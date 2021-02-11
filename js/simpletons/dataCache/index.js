const DataChannel = require('./models/DataChannel');
const DataNode = require('./models/DataNode');
const signals = require('../../helpers/signals').signals;


class DataCache {
    constructor() {
        this.reset();
    }

    reset() {
        this._data = {};
    }

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

    _ensureChannelExists(channel) {
        if (!this._data[channel]) {
            this._data[channel] = new DataChannel();
        }
    }

    add(channel, raw) {
        if (!this._isValidRaw(raw)) {
            return;
        }

        this._ensureChannelExists(channel);

        this._data[channel].add(raw);
        signals.dispatch({ event: 'data.cache.updated' });
    }

    get(channel, atBucket, interval, filter) {
        this._ensureChannelExists(channel);
        return this._data[channel].get(atBucket, interval, filter);
    }

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
