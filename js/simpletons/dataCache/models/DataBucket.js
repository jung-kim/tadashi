const constants = require('../../../helpers/constants');
const DataNode = require('./DataNode');
const utils = require('../../../helpers/utils');

/**
 * Holda aggregate of event data over a time period.
 * 
 * Difference between DataBucket and DataNode is that DataNode is type agnostic,
 * where as DataBucket has DataType per each event types.
 */
class DataBucket {
    constructor(map) {
        if (map) {
            this[constants.TYPE_CHAT] = map[constants.TYPE_CHAT].getCopy();
            this[constants.TYPE_RESUB] = map[constants.TYPE_RESUB].getCopy();
            this[constants.TYPE_CHEER] = map[constants.TYPE_CHEER].getCopy();
            this[constants.TYPE_SUB] = map[constants.TYPE_SUB].getCopy();
            this[constants.TYPE_BAN] = map[constants.TYPE_BAN].getCopy();
            this[constants.TYPE_ANONGIFT] = map[constants.TYPE_ANONGIFT].getCopy();
            this[constants.TYPE_SUBGIFT] = map[constants.TYPE_SUBGIFT].getCopy();
            this[constants.TYPE_SUBMYSTERY] = map[constants.TYPE_SUBMYSTERY].getCopy();
            this[constants.TYPE_TIMEOUT] = map[constants.TYPE_TIMEOUT].getCopy();
        } else {
            this[constants.TYPE_CHAT] = new DataNode();
            this[constants.TYPE_RESUB] = new DataNode();
            this[constants.TYPE_CHEER] = new DataNode();
            this[constants.TYPE_SUB] = new DataNode();
            this[constants.TYPE_BAN] = new DataNode();
            this[constants.TYPE_ANONGIFT] = new DataNode();
            this[constants.TYPE_SUBGIFT] = new DataNode();
            this[constants.TYPE_SUBMYSTERY] = new DataNode();
            this[constants.TYPE_TIMEOUT] = new DataNode();
        }
    }

    /**
     * Add raw event object to the bucket cache
     * 
     * @param {Event} raw event object to add to the bucket
     * @returns {undefined}
     */
    add(raw) {
        this[utils.getMessageType(raw)].add(raw);
    }

    /**
     * Clone this object
     * 
     * @returns {DataBucket} cloned copy of this object
     */
    getCopy() {
        return new DataBucket(this);
    }

    /**
     * 
     * @param {DataBucket} dataBucket to merge with
     * @returns {DataBucet} merge target data bucket data to current data
     */
    merge(dataBucket) {
        Object.keys(dataBucket).forEach(key => {
            this[key].merge(dataBucket[key]);
        });
        return this;
    }
}

module.exports = DataBucket;