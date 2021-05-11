const constants = require('../../../helpers/constants');
const DataNode = require('./DataNode');
const utils = require('../../../helpers/utils');

class DataBucket {
    constructor(map, filter) {
        if (map) {
            this[constants.TYPE_CHAT] = map[constants.TYPE_CHAT].getCopy(filter);
            this[constants.TYPE_RESUB] = map[constants.TYPE_RESUB].getCopy(filter);
            this[constants.TYPE_CHEER] = map[constants.TYPE_CHEER].getCopy(filter);
            this[constants.TYPE_SUB] = map[constants.TYPE_SUB].getCopy(filter);
            this[constants.TYPE_BAN] = map[constants.TYPE_BAN].getCopy(filter);
            this[constants.TYPE_ANONGIFT] = map[constants.TYPE_ANONGIFT].getCopy(filter);
            this[constants.TYPE_SUBGIFT] = map[constants.TYPE_SUBGIFT].getCopy(filter);
            this[constants.TYPE_SUBMYSTERY] = map[constants.TYPE_SUBMYSTERY].getCopy(filter);
        } else {
            this[constants.TYPE_CHAT] = new DataNode();
            this[constants.TYPE_RESUB] = new DataNode();
            this[constants.TYPE_CHEER] = new DataNode();
            this[constants.TYPE_SUB] = new DataNode();
            this[constants.TYPE_BAN] = new DataNode();
            this[constants.TYPE_ANONGIFT] = new DataNode();
            this[constants.TYPE_SUBGIFT] = new DataNode();
            this[constants.TYPE_SUBMYSTERY] = new DataNode();
        }
    }

    add(raw) {
        this[utils.getMessageType(raw)].add(raw);
    }

    getCopy(filter) {
        return new DataBucket(this, filter);
    }

    merge(dataBucket) {
        Object.keys(dataBucket).forEach(key => {
            this[key].merge(dataBucket[key]);
        });
        return this;
    }
}

module.exports = DataBucket;