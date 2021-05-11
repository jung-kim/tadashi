const DataChannel = require('./models/DataChannel');
const DataNode = require('./models/DataNode');
const eventSignals = require('../../helpers/signals').eventSignals;

/**
 * Represents cache of the data recevied from the TwitchClient
 * 
 * few things to note
 * - lowest time granualrity of collected data is minute level.
 *  - this means reutrned DataNode represents aggregate over 1 minute period at the lowest level.
 *  - but there are other interval levels so a datanode may contain aggregated data over larget period.
 * - returned values are immutable.
 *  - immutability is bit tricky but returned object should not be altered.
 * - all data are cached
 * 
 * 
 */
class DataCache {
    constructor() {
        this.reset();
    }

    /**
     * drops cache and starts fresh
     */
    reset() {
        this._data = {};
    }

    /**
     * validates if a raw data received is valid or not
     * 
     * @param {object} raw event data object such as Ban or Chat
     * @returns if valid or not
     */
    _isValidRaw(raw) {
        if (!raw.displayName) {
            console.warn("missing displayname", raw)
            return false;
        }

        if (!raw.timestamp) {
            console.warn("missing timestamp", raw)
            return false;
        }

        return true;
    }

    /**
     * ensure channel bucket exists within cache
     * 
     * @param {string} channel name
     */
    _ensureChannelExists(channel) {
        if (!this._data[channel]) {
            this._data[channel] = new DataChannel();
        }
    }

    /**
     * Cache received data
     * 
     * @param {string} channel name
     * @param {object} raw event data object such as Ban or Chat
     * @returns nothing
     */
    add(channel, raw) {
        if (!this._isValidRaw(raw)) {
            return;
        }

        this._ensureChannelExists(channel);

        this._data[channel].add(raw);
        eventSignals.dispatch({ event: 'data.cache.updated' });
    }

    /**
     * Get a DataNode that represents aggregate data over {atBucket} ~ {atBucket + inerval} period.
     * 
     * @param {string} channel name
     * @param {number} atBucket start timestamp in milliseconds (must be in )
     * @param {number} interval data aggregate interval in sec
     * @param {object} filter object
     * @returns DataNode
     */
    get(channel, atBucket, interval, filter) {
        this._ensureChannelExists(channel);
        return this._data[channel].get(atBucket, interval, filter);
    }

    /**
     * Get a DataNode that represents aggregate data over {startBucket} ~ {endBucket} period.
     * 
     * @param {*} channel name
     * @param {*} startBucket start timestamp in milliseconds (must be in )
     * @param {*} endBucket 
     * @param {*} type 
     * @param {*} filter 
     * @returns DataNode
     */
    getTotal(channel, startBucket, endBucket, type, filter) {
        this._ensureChannelExists(channel);
        return this._data[channel].getTotal(startBucket, endBucket, type, filter);
    }

    getNewDataNode() {
        return new DataNode();
    }
}

const dataCache = new DataCache();
module.exports = dataCache;
