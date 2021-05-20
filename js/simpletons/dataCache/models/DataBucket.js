const constants = require('../../../helpers/constants');
const DataNode = require('./DataNode');
const utils = require('../../../helpers/utils');

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

    getCopy() {
        return new DataBucket(this);
    }

    merge(filter, dataBucket) {
        Object.keys(dataBucket).forEach(key => {
            this[key].merge(filter, dataBucket[key]);
        });
        return this;
    }
}

module.exports = DataBucket;