const env = require('../env');
const statusCodes = require('http-status-codes').StatusCodes;
const eventSignals = require('../helpers/signals').eventSignals;
const pako = require('pako');

const TIWTCH_NAME_REGEX = /[0-9a-zA-Z][\w]{3,23}/;
const RATELIMIT_REMAINING = 'Ratelimit-Remaining';
const RATELIMIT_RESET = 'Ratelimit-Reset';
const MAX_AWAIT_DURATION_SEC = 15;
const DEFAULT_REQ_OPT = Object.freeze({
    headers: {
        'Client-ID': env.CLIENT_ID,
        'Accept': 'application/vnd.twitchtv.v5+json',
    }
});

class API {
    constructor() {
        this.reset();
    }

    reset() {
        this.waitForReset = null;
    }

    /**
     * returns time to sleep until throttling is resolved.
     * 
     * @param {object} response object from fetch
     * @returns {number} time to await for in seconds
     */
    _getThrottledSleepDuration(response) {
        const resetAt = parseInt(response.headers.get(RATELIMIT_RESET));
        if (isNaN(resetAt)) {
            return MAX_AWAIT_DURATION_SEC;
        }

        if (resetAt > MAX_AWAIT_DURATION_SEC) {
            console.warn(`reset at is larger than max : ${resetAt}`);
        }

        return Math.min(resetAt, MAX_AWAIT_DURATION_SEC);
    }

    /**
     * make an api call, extract twitch api throttle headers and set promise to await for
     * next calls.
     * 
     * Will thro error if query fails, including being throttled.
     * 
     * @param {string} url to fetch
     * @param {object} authObj options to pass into fetch
     * @returns {object} result of api request
     */
    async _makeTwitchAPIQuery(url, authObj) {
        if (this.waitForReset) {
            await this.waitForReset;
            eventSignals.dispatch({ event: 'api.unthrottled' });
            this.waitForReset = null;
        }
        const response = await fetch(url, authObj || DEFAULT_REQ_OPT);
        const remaining = parseInt(response.headers.get(RATELIMIT_REMAINING) || 10);

        // check for too many requests and if reset has not been triggered already
        if ((remaining === 0 || response.status === statusCodes.TOO_MANY_REQUESTS) && !this.waitForReset) {
            const sleepDuration = this._getThrottledSleepDuration(response);

            console.warn(`too many requests! sleeping for ${sleepDuration}`);

            this.waitForReset = new Promise(resolve => {
                setTimeout(resolve, (sleepDuration * 1000) + 5)
            });
            throw { status: response.status, msg: 'too many requests' };
        }

        if (!response.ok) {
            console.warn(`query failed!`);
            throw { status: response.status, msg: 'query failed' };
        }

        if (response.headers.get('Content-Type').indexOf('gzip') > -1) {
            return JSON.parse(pako.ungzip(await response.arrayBuffer(), { to: 'string' }));
        }

        return await response.json();
    }

    /**
     * fetch twitch api with rate limiting logic.
     * 
     * @param {string} path path to query
     * @param {object} authObj auth info
     * @return {object} query result
     */
    async queryTwitchApi(path, authObj) {
        const url = `${env.TWITCH_ENDPOINT}/${path}`;

        return this._makeTwitchAPIQuery(url, authObj);
    }

    /**
     * make TMI endpoint query
     * does not go through rate limiting logic at _makeTwitchAPIQuery
     * 
     * This one probably doesn't have proper CORS configured for public consumption
     * It is bit unfortunate that to be dependent on a public service and not sure how
     * reliable.
     * 
     * @param {string} path path to query
     * @returns {object} json response
     */
    async queryTmiApi(path) {
        const url = `${env.TMI_ENDPOINT}/${path}`;
        const isLocal = url.indexOf('127.0.0.1') > -1;
        const finalUrl = isLocal ? url : `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const res = await fetch(finalUrl);
        const json = await res.json();

        return isLocal ? json : JSON.parse(json.contents);
    }

    async getChannelSearch(channel, authObj) {
        if (TIWTCH_NAME_REGEX.test(channel)) {
            return await this.queryTwitchApi(`helix/search/channels?query=${channel}&first=10`, authObj);
        }

        return {};
    }

    async getChannelInfo(channel, authObj) {
        return await this.queryTwitchApi(`helix/streams?user-login=${channel}`, authObj);
    }
}

const api = new API();

module.exports = api;
