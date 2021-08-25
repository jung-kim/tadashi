const env = require('../env');
const statusCodes = require('http-status-codes').StatusCodes;
const pLimit = require('p-limit');
const pako = require('pako');

const RATELIMIT_RESET = 'Ratelimit-Reset';
const TIWTCH_NAME_REGEX = /[0-9a-zA-Z][\w]{3,23}/;
const RATELIMIT_REMAINING = 'Ratelimit-Remaining';
const DEFAULT_REQ_OPT = Object.freeze({
    headers: {
        'Client-ID': env.CLIENT_ID,
        'Accept': 'application/vnd.twitchtv.v5+json',
    }
});

const MAX_ATTEMPT = 5;
const MAX_PARALLEL = 10;
const DEFAULT_ALLOWANCE = 5;
const DEFAULT_ALLOWANCE_RESET_SEC = 3000;
const MAX_AWAIT_SEC = 15000;

class API {
    constructor() {
        this.reset();
    }

    reset() {
        this._pLimit = pLimit(MAX_PARALLEL);
        this._allowance = DEFAULT_ALLOWANCE;
        this._resetTimeout = undefined;
    }

    _getEffectiveTimeout(attempt) {
        const effectiveTimeout = (5 ** ((attempt || 0) + 1)) + Math.floor(Math.random() * 50);
        return new Promise(resolve => setTimeout(resolve, effectiveTimeout));
    }

    async _queryTwitchApi(url, authObj, attempt) {
        // check for if api throttle is needed
        if (this._allowance <= 0) {
            if (attempt >= MAX_ATTEMPT) {
                console.warn(`query retry limit reached! url="${url}"`);
                // api retry attempt is exahusted, throw exception.                
                throw "api limit reached";
            }

            // await and retry
            await this._getEffectiveTimeout(attempt);
            return this._queryTwitchApi(url, authObj, (attempt || 0) + 1);
        }

        // fetch
        const response = await fetch(url, authObj || DEFAULT_REQ_OPT);

        // update allowance
        this._allowance = parseInt(response.headers.get(RATELIMIT_REMAINING));
        if (!this._allowance || response.status === statusCodes.TOO_MANY_REQUESTS) {
            this._allowance = 0;
        }

        // check if allowance is 0, then set reset timeout to rest allowance
        if (!this._resetTimeout && this._allowance == 0) {
            const resetAt = parseInt(response.headers.get(RATELIMIT_RESET));
            const nextReset = isNaN(resetAt) ? DEFAULT_ALLOWANCE_RESET_SEC : Math.min(resetAt, MAX_AWAIT_SEC);

            this._resetTimeout = setTimeout(() => {
                this._allowance = DEFAULT_ALLOWANCE;
                this._resetTimeout = undefined;
            }, nextReset);
        }

        // throw if fetch failed
        if (!response.ok) {
            console.warn(`query failed!`);
            throw { status: response.status, msg: 'query failed' };
        }

        // ungzip if gziped response
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

        return this._pLimit(this._queryTwitchApi.bind(this, url, authObj));
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
