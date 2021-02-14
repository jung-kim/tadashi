const env = require('../env');
const moment = require('../helpers/moment');
const statusCodes = require('http-status-codes').StatusCodes;
const constants = require('../helpers/constants');
const signals = require('../helpers/signals').signals;
const pako = require('pako');

const DEFAULT_REQ_OPT = {
    headers: {
        'Client-ID': env.CLIENT_ID,
        'Accept': 'application/vnd.twitchtv.v5+json',
    }
};

class API {
    constructor() {
        this.reset();
    }

    reset() {
        if (this._waitForTimeOut) {
            clearTimeout(this._waitForTimeOut);
        }
        this._waitForTimeOut = null;
        this.waitForReset = null;
    }

    async _makeAPIQuery(url, authObj) {
        if (this.waitForReset) {
            await this.waitForReset;
            this.waitForReset = null;
        }
        const response = await fetch(url, authObj || DEFAULT_REQ_OPT);
        const remaining = parseInt(response.headers.get(constants.RATELIMIT_REMAINING) || 10);
        const now = moment().unix();
        let resetAt = parseInt(response.headers.get(constants.RATELIMIT_RESET) || now + constants.MAX_AWAIT_DURATION_SEC);

        if (remaining === 0 || response.status === statusCodes.TOO_MANY_REQUESTS) {
            console.warn(`too many requests! ${resetAt} ${response.headers}`);
            // status too many requests
            if (!this.waitForReset) {
                // set waitForReset
                const sleepForSec = Math.min(resetAt - now, constants.MAX_AWAIT_DURATION_SEC);
                resetAt = now + sleepForSec;
                this.waitForReset = new Promise(resolve => {
                    this._waitForTimeOut = setTimeout(() => {
                        resolve();
                        signals.dispatch({ event: 'api.unthrottled' });
                    }, sleepForSec * 1000);
                });
            }

            throw { status: response.status, msg: 'too many requests', resetAt: resetAt };
        }

        if (!response.ok) {
            console.warn(`query failed!`);
            throw { status: response.status, msg: 'query failed', resetAt: resetAt };
        }

        if (response.headers.get('Content-Type').indexOf('gzip') > -1) {
            return JSON.parse(pako.ungzip(await response.arrayBuffer(), { to: 'string' }));
        }

        return await response.json();
    }

    /**
     * fetch twitch api with rate limiting loic.
     * @param {string} path path to query
     * @param {object} authObj auth info
     * @return {object} query result
     */
    async queryTwitchApi(path, authObj) {
        const url = `${env.TWITCH_ENDPOINT}/${path}`;

        return this._makeAPIQuery(url, authObj);
    }

    /**
     * make TMI endpoint query
     * does not go through rate limiting logic at _makeAPIQuery
     * @param {string} path path to query
     * @returns {object} json response
     */
    async queryTmiApi(path) {
        const url = `${env.TMI_ENDPOINT}/${path}`;
        const res = await fetch(url, { mode: 'no-cors' });
        return res.json();
    }
}

const api = new API();

module.exports = api;