/* eslint-disable no-unused-vars */

const tmi = require('tmi.js');
const _ = require('lodash');
const events = require('../models/events');
const eventSignals = require('../helpers/signals').eventSignals;
const constants = require('../helpers/constants');
const filter = require('../shared/filter');
const users = require('../singletons/users');

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
        this._enabled = false;
        this.updateViewersCache = _.debounce(this._updateViewersCache.bind(this), 500, { leading: false });
        this.saveChannel = _.debounce(this._saveChannel.bind(this), 500, { leading: false });
        this._debouncedPing = _.debounce(this._ping.bind(this), 5000, { leading: false });
        this._throttledPing = _.throttle(this._ping.bind(this), 1000, { leading: false });
        this._lastPingSuccess = true;
        eventSignals.add(this._eventSignalFunc.bind(this));
    }

    async _eventSignalFunc(payload) {
        switch (payload.event) {
            case 'filter.change':
                if (payload.changed.searchString || payload.changed.channel) {
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

        if (!filter.getChannelId() || !filter.getChannel()) {
            if (auth.isBroadcaster()) {
                filter.setChannelInfo(auth.getLogin(), auth.getID(), true);
            } else {
                filter.setChannelInfo(DEFAULT_CHANNEL, DEFAULT_CHANNEL_ID, true);
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
            channels: [filter.getChannel()]
        });

        this._client.on("anongiftpaidupgrade", (channel, username, userstate) => {
            this._processChatMessage(channel, new events.AnonGift(userstate));
        });
        this._client.on("ban", (channel, username, reason, userstate) => {
            // {reason} is deprecated
            this._processChatMessage(channel, new events.Ban(userstate));
        });
        this._client.on('chat', (channel, userstate, message, self) => {
            this._processChatMessage(channel, new events.Chat(userstate));
        });
        this._client.on("cheer", (channel, userstate, message) => {
            this._processChatMessage(channel, new events.Cheer(userstate));
        });
        this._client.on("timeout", (channel, userstate, message) => {
            this._processChatMessage(channel, new events.Timeout(userstate));
        });

        this._client.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
            this._processChatMessage(channel, new events.MysterySubGift(userstate, methods, numbOfSubs));
        });
        this._client.on("resub", (channel, username, months, message, userstate, methods) => {
            this._processChatMessage(channel, new events.ReSub(userstate, methods, months));
        });
        this._client.on("subscription", (channel, username, methods, message, userstate) => {
            this._processChatMessage(channel, new events.Sub(userstate, methods));
        });
        this._client.on("subgift", (channel, username, numbOfSubs, recipient, methods, userstate) => {
            this._processChatMessage(channel, new events.SubGift(userstate, methods, numbOfSubs));
        });

        await this._client.connect();
        this.ping();
        this._initPromise = undefined;
    }

    _processChatMessage(channel, raw) {
        this.ping();
        if (raw.displayName) {
            users._ensureUserExists(raw.userID, raw.displayName);
        }
        dataCache.add(channel, raw);
    }

    async changeChannel(channel, id) {
        if (filter.getChannel() === channel) {
            // channel is already set, return
            return;
        }

        if (filter.getChannel()) {
            this._client.part(filter.getChannel());
        }

        if (!id) {
            const resp = await api.queryTwitchApi(`kraken/users?login=${this.getChannel()}`);
            id = parseInt(resp.users[0]._id);
        }

        await this._client.join(filter.getChannel());
        filter.setChannelInfo(channel, id);
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
        if (!this._enabled || !filter.getChannel()) {
            return;
        }

        const json = await api.queryTmiApi(`group/user/${filter.getChannel()}/chatters`);

        eventSignals.dispatch({
            event: "chatters.data.update",
            data: json[CHATTERS_KEY],
            channelID: filter.getChannelId(),
        });
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
            this.changeChannel(DEFAULT_CHANNEL, DEFAULT_CHANNEL_ID);
        }
    }

    _saveChannel() {
        localStorage.setItem(CHANNEL_LS_KEY, filter.getChannel());
        localStorage.setItem(CHANNEL_LS_ID_KEY, filter.getChannelId());
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
