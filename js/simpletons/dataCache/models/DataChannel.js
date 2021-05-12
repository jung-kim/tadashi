const constants = require("../../../helpers/constants");
const utils = require('../../../helpers/utils');

const DataBucket = require("./DataBucket");
const blanks = require("./blanks");

class DataChannel {
    constructor() {
        this._cachedSearchString = '';
        this._cache = {}; // derived from data, cached by time bucket / type / user
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
                delete this._cache[updatedCacheBucket];
            });
            this._updated.clear();

            return;
        }
        this._updated.clear();
        this._cache = {};
        this._cachedSearchString = searchString
    }

    _getRange(startBucket, endBucket, filter) {
        const toReturn = this._getAt(startBucket, filter);
        for (let value = startBucket + constants.BUCKET_MIN; value < endBucket; value += constants.BUCKET_MIN) {
            toReturn.merge(this._getAt(value, filter));
        }
        return toReturn;
    }
}

module.exports = DataChannel;