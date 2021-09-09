const _ = require('lodash');
const auth = require('../../singletons/auth');
const api = require('../../singletons/api');
const eventSignals = require('../../helpers/signals').eventSignals;

class ChannelSubscribedFetcher {
    constructor() {
        this._paginations = {};
        this._channelID = undefined;
        this._isRunning = undefined;
        this.fetch = _.throttle(this._fetch, 5000);
    }

    async _fetch(channelID) {
        this._channelID = channelID || this._channelID;
        if (this._isRunning) {
            return;
        }

        if (!this._channelID || this._paginations[this._channelID] === 'done') {
            return;
        }
        this._isRunning = true;
        const authObj = await auth.getAuthObj();

        try {
            while (this._isRunning) {
                const currentChannelID = this._channelID;
                const path = `helix/subscriptions?first=100&broadcaster_id=${currentChannelID}`;
                const resp = await api.queryTwitchApi(
                    this._paginations[currentChannelID] ? `${path}&after=${this._paginations[currentChannelID]}` : path, authObj);
                eventSignals.dispatch({ event: 'fetch.channel.subscribed.resp', data: resp, channelID: currentChannelID });

                if (!resp.pagination || !resp.pagination.cursor) {
                    this._paginations[currentChannelID] = 'done';
                    this._isRunning = false;
                } else {
                    this._paginations[currentChannelID] = resp.pagination.cursor;
                }
            }
        } catch (err) {
            this._isRunning = false;
            console.warn(`failed to fetch channel follows`, err);
        }

    }
}

module.exports = new ChannelSubscribedFetcher();
