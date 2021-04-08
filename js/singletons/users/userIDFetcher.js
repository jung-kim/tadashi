const _ = require('lodash');
const auth = require('../../simpletons/auth');
const api = require('../../simpletons/api');
const eventSignals = require('../../helpers/signals').eventSignals;

const FETCH_NAMES_LIMIT = 100;

let isRunning = false;

class UserIDFetcher {
    constructor() {
        this.reset();
    }

    reset() {
        this._names = new Set();
        this.fetch = _.throttle(this._fetch, 2000);
    }

    add(name) {
        this._names.add(name);
        this.fetch();
    }

    async _fetch() {
        if (isRunning) {
            return;
        }
        isRunning = true;

        const targets = Array.from(this._names)
        const authObj = await auth.getAuthObj();
        const toFetch = [];
        for (let i = 0; i < targets.length; i += FETCH_NAMES_LIMIT) {
            toFetch.push(targets.slice(i, i + FETCH_NAMES_LIMIT))
        }

        try {
            for (const ids of toFetch) {
                await this._fetchUserIDsForNames(authObj, ids);
            }
        } catch (err) {
            console.warn(`failed to query for ids`, err);
        }
        isRunning = false;
    }

    async _fetchUserIDsForNames(authObj, names) {
        const url = `helix/users?login=${names.join('&login=')}`;
        const json = await api.queryTwitchApi(url, authObj);

        for (const element of json.data) {
            this._names.delete(element.login.toLowerCase());
        }

        eventSignals.dispatch({ event: 'fetch.user.ids.resp', data: json });
    }

}

const userIDFetcher = new UserIDFetcher();
module.exports = userIDFetcher;
