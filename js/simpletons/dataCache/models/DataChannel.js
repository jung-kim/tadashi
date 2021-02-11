const constants = require("../../../helpers/constants");
const utils = require('../../../helpers/utils');

const DataBucket = require("./DataBucket");
const DataNode = require("./DataNode");
const blanks = require("./blanks");


class DataChannel {
    constructor() {
        this._cachedInterval = undefined;
        this._cachedFilter = undefined;
        this._cache = {}; // derived from data, cached by time bucket / type / user
        this._cacheTotalByHour = {};
        this._data = {};  // time bucket to DataBucket
        this._updated = new Set(); // represents updated minutes, which will be used to invalidate cache
    }

    add(raw) {
        const second = Math.floor(raw.timestamp / 1000);
        const bucket = utils.getTimeBucket(second, constants.BUCKET_MIN);

        this._updated.add(bucket);

        if (!this._data[bucket]) {
            this._data[bucket] = new DataBucket();
        }

        this._data[bucket].add(raw);
    }

    /**
     * get data at the time.
     * 
     * @param {*} timeBucket: time to get
     * @param {*} filter: search value
     * @returns {AggBucket}: Minute level agg bucket
     */
    _getAt(timeBucket, filter) {
        const minLevelData = this._data[timeBucket];
        return minLevelData ? minLevelData.getCopy(filter) : blanks.blankDataBucket;
    }

    /**
     * get an aggregated value from {startBucket} ~ {startBucket + inerval} without using cache
     * 
     * @param {*} startBucket: seconds since epoch normalized to {interval}
     * @param {*} interval: number of seconds to gather from the {startBucket}
     * @param {*} filter: search value
     * @returns {AggBucket}: AggBucket aggregated over interval
     */
    _getAnInterval(startBucket, interval, filter) {
        let toReturn = this._getAt(startBucket, filter);
        for (let value = startBucket + constants.BUCKET_MIN; value < startBucket + interval; value += constants.BUCKET_MIN) {
            toReturn = toReturn.merge(this._getAt(value, filter));
        }
        return Object.freeze(toReturn);
    }

    _validateCache(interval, filter) {
        if (this._cachedInterval === interval && this._cachedFilter === filter) {
            this._updated.forEach((updated) => {
                const bucket = utils.getTimeBucket(updated, interval);
                delete this._cache[bucket];

                delete this._cacheTotalByHour[utils.getTimeBucket(bucket, constants.BUCKET_HOUR)];
            });
        } else {
            this._cacheTotalByHour = {};
            this._cache = {};
        }

        this._updated.clear();
        this._cachedFilter = filter;
        this._cachedInterval = interval;
    }

    /**
     * get an aggregated value from {startBucket} ~ {startBucket + inerval} with cache
     * 
     * @param {*} atBucket: seconds since epoch normalized to interval
     * @param {*} interval: interval to aggregate over
     * @param {*} filter: search value
     * @returns {AggBucket}: Aggregated AggBucket either from cache or calculated
     */
    get(atBucket, interval, filter) {
        // invalidate cache block
        this._validateCache(interval, filter);
        // if cache is missing rebuild
        if (!this._cache[atBucket]) {
            this._cache[atBucket] = this._getAnInterval(atBucket, interval, filter);
        }

        return this._cache[atBucket];
    }

    /**
     * Get total sum of a type during the period with caching
     * 
     * @param {*} startBucket: start seconds since epoch normalized to interval
     * @param {*} endBucket: end seconds since epoch normalized to interval
     * @param {*} type: a type of message to get total of
     * @param {*} filter: search value
     * @returns {DataNode}: Aggregated DataNode between start and end time
     */
    getTotal(startBucket, endBucket, type, filter) {
        // invalidate cache block
        this._validateCache(this._cachedInterval || constants.BUCKET_MIN, filter);

        let toReturn = new DataNode();
        let atHourCache;
        // ensure missing cache blocks are rebuilt
        for (let atBucket = startBucket; atBucket <= endBucket; atBucket += constants.BUCKET_MIN) {
            if (atBucket % constants.BUCKET_HOUR === 0) {
                // check Cache
                if (this._cacheTotalByHour[atBucket]
                    && this._cacheTotalByHour[atBucket][type]
                    && this._cacheTotalByHour[atBucket][type]._sum != 0) {
                    // found cache
                    toReturn = toReturn.merge(this._cacheTotalByHour[atBucket][type]);
                    atBucket += constants.BUCKET_HOUR - constants.BUCKET_MIN;
                    continue;
                }

                // do cache cut over
                if (atHourCache) {
                    const lastHour = atBucket - constants.BUCKET_HOUR;
                    if (!this._cacheTotalByHour[lastHour]) {
                        this._cacheTotalByHour[lastHour] = blanks.blankDataBucket.getCopy();
                    }
                    this._cacheTotalByHour[lastHour][type] = atHourCache;
                }
                atHourCache = new DataNode();
            }

            const toMerge = this._getAt(atBucket, filter)[type];
            toReturn = toReturn.merge(toMerge);
            if (atHourCache) {
                atHourCache = atHourCache.merge(toMerge);
            }
        }

        return toReturn;
    }
}

module.exports = DataChannel;