const tmi = require('tmi.js');
const _ = require('lodash');
const events = require('../models/events');
const signals = require('../helpers/signals').signals;
const constants = require('../helpers/constants');

const auth = require('../simpletons/auth');
const api = require('../simpletons/api');
const dataCache = require('../simpletons/dataCache');

const CHANNEL_LS_KEY = 'channel';
const CHANNEL_LS_ID_KEY = 'channel-id';

signals.add((payload) => {
    switch (payload.event) {
        case 'main.minute':
            if (!payload.filter.isValid()) {
                twitchClient.updateViewersCache();
            }
            break;
        case 'stream.cleanup':
            twitchClient._disable();
            break;
        case 'stream.load.ready':
            twitchClient._enable();
            break;
        case 'channel.changed':
            twitchClient.changeChannel(payload.channel);
            break;
    }
});

class TwitchClient {
    constructor() {
        this._channel = undefined;
        this._channelID = undefined;
        this._enabled = false;
        this.updateViewersCache = _.debounce(this._updateViewersCache.bind(this), 500, { leading: false });
        this.saveChannel = _.debounce(this._saveChannel.bind(this), 500, { leading: false });
        this._emitDataChange = _.throttle(() => {
            signals.dispatch({ event: "chats.data.update" });
        }, 250);
    }

    async initializeClient() {
        if (twitchClient._initPromise) {
            await twitchClient._initPromise;
        }
        if (this._client) {
            // already initialized
            return;
        }

        if (!this.getChannel()) {
            if (localStorage.getItem(CHANNEL_LS_KEY)) {
                this._setChannel(localStorage.getItem(CHANNEL_LS_KEY));
            } else if (auth.isBroadcaster()) {
                this._setChannel(auth.getLogin());
                this._setChannelID(auth.getID());
            } else {
                this.changeChannel(constants.DEFAULT_CHANNEL, constants.DEFAULT_CHANNEL_ID);
            }
        }

        if (this.getChannel() && !this.getChannelID()) {
            if (localStorage.getItem(CHANNEL_LS_ID_KEY)) {
                this._setChannelID(parseInt(localStorage.getItem(CHANNEL_LS_ID_KEY)));
            } else {
                this._setChannelID();
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

        this._client.connect();
        signals.dispatch({ event: 'channel.input.update', data: { id: this.getChannelID(), channe: this.getChannel() } });
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
        signals.dispatch({
            event: 'channel.input.update',
            data: {
                id: this.getChannelID(),
                channel: this.getChannel(),
            }
        });
    }

    _processChatMessage(channel, clazz, arg1, arg2, arg3, arg4) {
        const raw = new clazz(arg1, arg2, arg3, arg4);

        if (channel.charAt(0) === '#') {
            dataCache.add(channel.substring(1), raw);
        } else {
            dataCache.add(channel, raw);
        }

        if (this._enabled) {
            this._emitDataChange();
        }
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

        signals.dispatch({
            event: "chatters.data.update",
            data: json[constants.KEY_CHATTERS],
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
     * @param {int} id if set, cache id. if id is not set and channel exists, then id is from fetch. else nothing.
     * @returns {undefined}
     */
    async _setChannelID(id) {
        if (id) {
            this._channelID = id;
        } else if (this.getChannel()) {
            const resp = await api.queryTwitchApi(`kraken/users?login=${this.getChannel()}`);
            this._channelID = parseInt(resp.users[0]._id);
        } else {
            return;
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
        signals.dispatch({
            alert: {
                type: 'success',
                body: `Successfully saved channel`
            }
        });
    }
}

const twitchClient = new TwitchClient();
twitchClient._initPromise = twitchClient.initializeClient();
module.exports = twitchClient;