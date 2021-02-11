const _ = require('lodash');
const auth = require('../../simpletons/auth');
const api = require('../../simpletons/api');
const signals = require('../../helpers/signals').signals;

const PARALLEL_THREAD_COUNT = 5;

class UserFollowsFetcher {
    constructor() {
        this.reset();
        this._paginations = {};
        this.fetch = _.throttle(this._fetch, 5000);
    }

    reset() {
        this._toFetch = new Set();
        this._running = 0;
        if (this._toFetchArray) {
            this._toFetchArray.length = 0;
        }
        this._toFetchArray = undefined;
    }

    add(userIdToFetch) {
        this._toFetch.add(userIdToFetch);
        this.fetch();
    }

    _fetch() {
        this._toFetchArray = Array.from(this._toFetch);
        if (this._toFetchArray.length === 0) {
            return;
        }

        for (let nThread = this._running; nThread < PARALLEL_THREAD_COUNT; nThread++) {
            this._running++;
            this._fetchUserFollows();
        }
    }

    async _fetchUserFollows() {
        const authObj = await auth.getAuthObj();

        for (; ;) {
            const userID = (this._toFetchArray || []).shift();
            if (!userID || this._paginations[userID] === 'done') {
                this._toFetch.delete(userID);
                break;
            }

            try {
                for (; ;) {

                    const path = `helix/users/follows?first=100&from_id=${userID}`;
                    const resp = await api.queryTwitchApi(
                        this._paginations[userID] ? `${path}&after=${this._paginations[userID]}` : path, authObj);
                    signals.dispatch({ event: 'fetch.user.follows.resp', data: resp, userID: userID });

                    if (!resp.pagination || !resp.pagination.cursor) {
                        this._paginations[userID] = 'done';
                        this._toFetch.delete(userID);
                        break;
                    }
                    this._paginations[userID] = resp.pagination.cursor;
                }
            } catch (err) {
                console.warn(`failed to fetch user follows`, err);
                break;
            }
        }
        this._running = Math.max(0, this._running - 1);
    }
}

const userFollowsFetcher = new UserFollowsFetcher();
module.exports = userFollowsFetcher;
