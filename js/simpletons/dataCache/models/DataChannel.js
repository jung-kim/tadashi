const constants = require("../../../helpers/constants");
const utils = require('../../../helpers/utils');

const DataBucket = require("./DataBucket");
const DataNode = require("./DataNode");
const blanks = require("./blanks");

class DataChannel {
    constructor() {
        this._cachedSearchString = '';
        // cache derived from _data
        this._cache = {
            [constants.BUCKET_FIVE]: {},
            [constants.BUCKET_HOUR]: {},
        };
        this._data = {};  // time bucket to DataBucket
        this._updated = new Set(); // represents updated minutes, which will be used to invalidate cache
    }

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
     * @param {*} filter: search value
     * @returns {AggBucket}: Minute level agg bucket
     */
    _getAt(timeBucket, filter) {
        const minLevelData = this._data[timeBucket];
        return minLevelData ? minLevelData.getCopy(filter) : blanks.blankDataBucket;
    }

    _validateCache(searchString) {
        if (this._cachedSearchString === searchString) {
            this._updated.forEach(updatedCacheBucket => {
                delete this._cache[constants.BUCKET_FIVE][updatedCacheBucket];
                delete this._cache[constants.BUCKET_HOUR][updatedCacheBucket];
            });
            this._updated.clear();

            return;
        }
        this._updated.clear();
        this._cache[constants.BUCKET_FIVE] = {};
        this._cache[constants.BUCKET_HOUR] = {};
        this._cachedSearchString = searchString
    }

    _isCacheable(start, end, interval) {
        return (start % interval) === 0 && start + interval <= end;
    }

    _getRange(startBucket, endBucket, filter) {
        const toReturn = this._getAt(startBucket, filter);
        for (let value = startBucket + constants.BUCKET_MIN; value < endBucket;) {
            if (this._isCacheable(value, endBucket, constants.BUCKET_HOUR) && this._cache[constants.BUCKET_HOUR][value]) {
                toReturn.merge(this._cache[constants.BUCKET_HOUR][value]);
                value += constants.BUCKET_HOUR;
            } else if (this._isCacheable(value, endBucket, constants.BUCKET_FIVE) && this._cache[constants.BUCKET_FIVE][value]) {
                toReturn.merge(this._cache[constants.BUCKET_FIVE][value]);
                value += constants.BUCKET_FIVE;
            } else {
                toReturn.merge(this._getAt(value, filter));
                value += constants.BUCKET_MIN;
            }
        }
        return toReturn;
    }

    getAt(startBucket, endBucket, filter) {
        this._validateCache(filter._searchString);

        const result = new DataNode();
        for (let start = startBucket; start < endBucket;) {
            if (this._isCacheable(start, endBucket, constants.BUCKET_HOUR)) {
                const end = start + constants.BUCKET_HOUR;
                this._cache[constants.BUCKET_HOUR][start] = this._cache[constants.BUCKET_HOUR][start] || this._getRange(start, end, filter);
                result.merge(this._cache[constants.BUCKET_HOUR][start]);
                start += constants.BUCKET_HOUR;
            } else if (this._isCacheable(start, endBucket, constants.BUCKET_FIVE)) {
                const end = start + constants.BUCKET_FIVE;
                this._cache[constants.BUCKET_FIVE][start] = this._cache[constants.BUCKET_FIVE][start] || this._getRange(start, end, filter);
                result.merge(this._cache[constants.BUCKET_FIVE][start]);
                start += constants.BUCKET_FIVE;
            } else {
                result.merge(this._getAt(start, filter));
                start += constants.BUCKET_MIN;
            }
        }

        return result;
    }
}

module.exports = DataChannel;