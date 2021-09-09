const _ = require('lodash');
const auth = require('../../singletons/auth');
const api = require('../../singletons/api');
const eventSignals = require('../../helpers/signals').eventSignals;

class ChannelFollowsFetcher {
    constructor() {
        this._paginations = {};
        this.fetch = _.throttle(this._fetch, 5000);
    }

    async _fetch(channelID) {
        if (!channelID || this._paginations[channelID] === 'done') {
            return;
        }
        const authObj = await auth.getAuthObj();

        try {
            for (; ;) {
                const path = `helix/users/follows?first=100&to_id=${channelID}`;
                const resp = await api.queryTwitchApi(
                    this._paginations[channelID] ? `${path}&after=${this._paginations[channelID]}` : path, authObj);
                eventSignals.dispatch({ event: 'fetch.channel.follows.resp', data: resp, channelID: channelID });

                if (!resp.pagination || !resp.pagination.cursor) {
                    this._paginations[channelID] = 'done';
                    return;
                }
                this._paginations[channelID] = resp.pagination.cursor;
            }
        } catch (err) {
            console.warn(`failed to fetch channel follows`, err);
        }
    }
}

module.exports = new ChannelFollowsFetcher();
