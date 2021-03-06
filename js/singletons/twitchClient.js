const tmi = require('tmi.js');
const _ = require('lodash');
const events = require('../models/events');
const eventSignals = require('../helpers/signals').eventSignals;
const constants = require('../helpers/constants');

const auth = require('../simpletons/auth');
const api = require('../simpletons/api');
const dataCache = require('../simpletons/dataCache');

const CHANNEL_LS_KEY = 'channel';
const CHANNEL_LS_ID_KEY = 'channel-id';
const CHATTERS_KEY = 'chatters';

const DEFAULT_CHANNEL = 'xqcow';
const DEFAULT_CHANNEL_ID = 71092938;

class TwitchClient {
    constructor() {
        this._channel = undefined;
        this._channelID = undefined;
        this._enabled = false;
        this.updateViewersCache = _.debounce(this._updateViewersCache.bind(this), 500, { leading: false });
        this.saveChannel = _.debounce(this._saveChannel.bind(this), 500, { leading: false });
        this._debouncedPing = _.debounce(this._ping.bind(this), 5000, { leading: false });
        this._throttledPing = _.throttle(this._ping.bind(this), 1000, { leading: false });
        this._lastPingSuccess = true;
        eventSignals.add(this._eventSignalFunc.bind(this));
    }

    _eventSignalFunc(payload) {
        switch (payload.event) {
            case 'main.minute':
                if (!payload.filter.isValid()) {
                    this.updateViewersCache();
                }
                break;
            case 'stream.cleanup':
                this._disable();
                break;
            case 'stream.load.ready':
                this._enable();
                break;
            case 'channel.changed':
                this.changeChannel(payload.channel);
                break;
        }
    }

    async initializeClient() {
        if (this._client) {
            // already initialized
            return;
        }
        if (twitchClient._initPromise) {
            await twitchClient._initPromise;
        }

        if (!this.getChannel()) {
            if (localStorage.getItem(CHANNEL_LS_KEY)) {
                this._setChannel(localStorage.getItem(CHANNEL_LS_KEY));
                this._setChannelID(localStorage.getItem(CHANNEL_LS_ID_KEY));
            } else if (auth.isBroadcaster()) {
                this._setChannel(auth.getLogin());
                this._setChannelID(auth.getID());
            } else {
                this._setChannel(DEFAULT_CHANNEL);
                this._setChannelID(DEFAULT_CHANNEL_ID);
            }
        }

        this._client = new tmi.Client({
            connection: {
                secure: true,
                reconnect: true,
                maxReconnectInterval: 1000,
                reconnectInterval: 1000,
                reconnectDecay: 1.0,
                timeout: 5000,
            },
            channels: [this.getChannel()]
        });

        // eslint-disable-next-line no-unused-vars
        this._client.on('chat', (channel, userstate, message, self) => {
            this._processChatMessage(channel, events.Chat, userstate);
        });
        this._client.on("resub", (channel, username, months, message, userstate, methods) => {
            this._processChatMessage(channel, events.ReSub, userstate, methods, months);
        });
        this._client.on("subscription", (channel, username, methods, message, userstate) => {
            this._processChatMessage(channel, events.Sub, userstate, methods, 0);
        });
        // eslint-disable-next-line no-unused-vars
        this._client.on("cheer", (channel, userstate, message) => {
            this._processChatMessage(channel, events.Cheer, userstate);
        });
        this._client.on("ban", (channel, username, reason, userstate) => {
            // {reason} is deprecated
            this._processChatMessage(channel, events.Ban, userstate);
        });
        this._client.on("anongiftpaidupgrade", (channel, username, userstate) => {
            this._processChatMessage(channel, events.AnonGift, userstate);
        });
        this._client.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
            this._processChatMessage(channel, events.SubGift, userstate, methods, streakMonths);
        });
        this._client.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
            this._processChatMessage(channel, events.MysterySubGift, userstate, methods, numbOfSubs);
        });

        await this._client.connect();
        this.ping();
        this._initPromise = undefined;
    }

    async changeChannel(channel, id) {
        if (this.getChannel() === channel) {
            // channel is already set, return
            return;
        }

        if (this.getChannel()) {
            this._client.part(this.getChannel());
        }

        this._setChannel(channel);
        this._setChannelID(id);

        await this._client.join(this.getChannel());

        this.updateViewersCache();
        eventSignals.dispatch({
            event: 'channel.input.update',
            data: {
                id: this.getChannelID(),
                channel: this.getChannel(),
            }
        });
    }

    _processChatMessage(channel, clazz, arg1, arg2, arg3, arg4) {
        this.ping();
        const raw = new clazz(arg1, arg2, arg3, arg4);

        dataCache.add(channel.charAt(0) === '#' ? channel.substring(1) : channel, raw);
    }

    _disable() {
        this._enabled = false;
    }

    _enable() {
        if (this._enabled) {
            return;
        }
        this._enabled = true;
        this.updateViewersCache();
    }

    async _updateViewersCache() {
        if (!this._enabled || !this.getChannel()) {
            return;
        }

        const json = await api.queryTmiApi(`group/user/${this.getChannel()}/chatters`);

        eventSignals.dispatch({
            event: "chatters.data.update",
            data: json[CHATTERS_KEY],
            channelID: this.getChannelID(),
        });
    }

    /**
     * Sets and caches channel name and channel id.
     * If want to redirect tmi client channel, use `changechannel()`
     * @param {string} channel channel name
     * @returns {undefined}
     */
    _setChannel(channel) {
        this._channel = channel;
    }

    /**
     * Set channel id 
     * @param {number} id if set, cache id. if id is not set and channel exists, then id is from fetch. else nothing.
     * @returns {undefined}
     */
    async _setChannelID(id) {
        if (id) {
            this._channelID = id;
        } else if (this.getChannel()) {
            const resp = await api.queryTwitchApi(`kraken/users?login=${this.getChannel()}`);
            this._channelID = parseInt(resp.users[0]._id);
        }
    }

    async changeToRandomFeaturedStream() {
        try {
            const json = await api.queryTwitchApi('kraken/streams/featured?limit=100');
            const featuresChannelPool = json.featured.filter((channel) => {
                return channel.stream.viewers > 100
                    && channel.stream.viewers <= constants.MAX_VIEWERS_COUNTS_FOR_PROCESS;
            });

            const selected = featuresChannelPool[Math.floor(Math.random() * featuresChannelPool.length)];

            this.changeChannel(selected.stream.channel.name, selected.stream.channel._id);
        } catch (err) {
            this.changeChannel('xqcow', 71092938);
        }
    }

    getChannel() {
        return this._channel;
    }

    getChannelID() {
        return this._channelID;
    }

    _saveChannel() {
        localStorage.setItem(CHANNEL_LS_KEY, this._channel);
        localStorage.setItem(CHANNEL_LS_ID_KEY, this._channelID);
        eventSignals.dispatch({
            alert: {
                type: 'success',
                body: `Successfully saved channel`
            }
        });
    }

    isConnected() {
        return Boolean(this._client._isConnected()
            && this._client.channels
            && this._client.channels.length > 0
            && this._lastPingSuccess);
    }

    async _ping() {
        if (this._client) {
            try {
                await this._client.ping();
                this._lastPingSuccess = true;
            } catch (err) {
                this._lastPingSuccess = false;
            }
        } else {
            this._lastPingSuccess = false;
        }
        eventSignals.dispatch({ event: 'draw.nav.actvitiy-status' });
        this.ping();
    }

    ping() {
        if (this.isConnected()) {
            // connected, call debounced to reduce traffic
            this._debouncedPing();
        } else {
            // not connected, call once every seconds
            this._throttledPing();
        }
    }
}

const twitchClient = new TwitchClient();
twitchClient._initPromise = twitchClient.initializeClient();
module.exports = twitchClient;
