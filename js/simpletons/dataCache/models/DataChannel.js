const constants = require("../../../helpers/constants");
const utils = require('../../../helpers/utils');

const DataBucket = require("./DataBucket");
const blanks = require("./blanks");

/**
 * DataChannel is an object that manages data caches for each channels or streamers.
 */
class DataChannel {
    constructor() {
        // cache derived from _data.
        // Only cached at 5 minutes and 1 hour level.
        // each cache tiers are normalized.
        this._cache = {
            [constants.BUCKET_FIVE]: {},
            [constants.BUCKET_HOUR]: {},
        };

        // timestamp key that maps to a data node that holds aggregate of data over 1 min period.
        // keys are always normalized to 1 min in seconds. i.e. 0, 60, 120 and etc...
        this._data = {};

        // new of udpated _data keys that needs force cache invalidations
        this._updated = new Set();
    }

    /**
     * Add a raw events data into the cache to be served by services.
     * 
     * @param {Object} raw events data such as Chat.js or Cheer.js
     * @returns {undefined}
     */
    add(raw) {
        const second = Math.floor(raw.timestamp / 1000);
        const bucket = utils.getTimeBucket(second, constants.BUCKET_MIN);
        const cacheBucket = utils.getTimeBucket(second, constants.BUCKET_FIVE);

        this._updated.add(cacheBucket);

        if (!this._data[bucket]) {
            this._data[bucket] = new DataBucket();
        }

        this._data[bucket].add(raw);
    }

    /**
     * get data at the time from _data without using _cache.
     * 
     * @param {*} timeBucket: time to get
     * @returns {AggBucket}: Minute level agg bucket
     */
    _getAt(timeBucket) {
        const minLevelData = this._data[timeBucket];
        return Object.freeze(minLevelData ? minLevelData : blanks.blankDataBucket);
    }

    /**
     * Handles cache validation.  If any of the minute has changed, it's cache interval buckets are dropped.
     * @returns {undefined}
     */
    _validateCache() {
        Array.from(this._updated).forEach(current => {
            const fiveMinTimeBucket = utils.getTimeBucket(current, constants.BUCKET_FIVE);
            const hourTimeBucket = utils.getTimeBucket(current, constants.BUCKET_HOUR);
            delete this._cache[constants.BUCKET_FIVE][fiveMinTimeBucket];
            delete this._cache[constants.BUCKET_HOUR][hourTimeBucket];
        });
        this._updated.clear();

        return;
    }

    /**
     * Get startBucket ~ (startBucket + 5 min period) worth of data using cache.
     * If cache is missing, fill cache.
     * 
     * @param {number} startBucket number of seconds normalized to 5 minutes i.e 300, 600, 900 ...
     * @returns {DataBucket} raw aggregated cached data bucket between startBucket ~ (startBucket + 5 mins period)
     */
    _getFiveMinRange(startBucket) {
        if (!this._cache[constants.BUCKET_FIVE][startBucket]) {
            const result = this._getAt(startBucket).getCopy();
            for (let current = startBucket + constants.BUCKET_MIN; current < startBucket + constants.BUCKET_FIVE; current += constants.BUCKET_MIN) {
                result.merge(undefined, this._getAt(current));
            }
            this._cache[constants.BUCKET_FIVE][startBucket] = Object.freeze(result);
        }
        return this._cache[constants.BUCKET_FIVE][startBucket];
    }

    /**
     * Get startBucket ~ (startBucket + 1 hour) worth of data using cache.
     * If cache is missing, fill cache.
     * 
     * @param {number} startBucket number of seconds normalized to 1 hour i.e 3600, 7200, 10800 ...
     * @returns {DataBucket} raw aggregated cached data bucket between startBucket ~ (startBucket + 1 hour)
     */
    _getHourRange(startBucket) {
        if (!this._cache[constants.BUCKET_HOUR][startBucket]) {
            // since _getFiveMinRange returns raw dataBucket, we need to clone it to prevent mutation of cache
            const result = this._getFiveMinRange(startBucket).getCopy();
            for (let current = startBucket + constants.BUCKET_FIVE; current < startBucket + constants.BUCKET_HOUR; current += constants.BUCKET_FIVE) {
                result.merge(undefined, this._getFiveMinRange(current));
            }
            this._cache[constants.BUCKET_HOUR][startBucket] = Object.freeze(result);
        }
        return this._cache[constants.BUCKET_HOUR][startBucket];
    }

    /**
     * Get aggregated data between startBucket ~ endBucket using cache
     * 
     * @param {number} startBucket in seconds, normalized to 1 minute.
     * @param {number} endBucket in seconds, nomalized to 1 minute.
     * @param {UserFilter} filter object
     * @returns {DataBucket} copied aggregated data bucket between startBucket ~ endBucket
     */
    get(startBucket, endBucket, filter) {
        this._validateCache();

        const result = new DataBucket();
        for (let current = startBucket; current < endBucket;) {
            if ((current % constants.BUCKET_HOUR) === 0 && current + constants.BUCKET_HOUR <= endBucket) {
                result.merge(filter, this._getHourRange(current));
                current += constants.BUCKET_HOUR;
            } else if ((current % constants.BUCKET_FIVE) === 0 && current + constants.BUCKET_FIVE <= endBucket) {
                result.merge(filter, this._getFiveMinRange(current));
                current += constants.BUCKET_FIVE;
            } else {
                result.merge(filter, this._getAt(current));
                current += constants.BUCKET_MIN;
            }
        }

        return result;
    }
}

module.exports = DataChannel;