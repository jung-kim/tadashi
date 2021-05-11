const constants = require('../../../helpers/constants');
const DataNode = require('./DataNode');
const DataBucket = require('./DataBucket');

class BlankDataNode {
    constructor() {
        this._sum = 0;
        this._users = {};
        Object.freeze(this);
    }

    merge(dataNode) {
        const newThis = this.getCopy();
        newThis.merge(dataNode);
        return newThis;
    }

    getCopy() {
        return new DataNode(0, {});
    }
}
const blankDataNode = new BlankDataNode();

class BlankDataBucket {
    constructor() {
        this[constants.TYPE_CHAT] = blankDataNode;
        this[constants.TYPE_RESUB] = blankDataNode;
        this[constants.TYPE_CHEER] = blankDataNode;
        this[constants.TYPE_SUB] = blankDataNode;
        this[constants.TYPE_BAN] = blankDataNode;
        this[constants.TYPE_ANONGIFT] = blankDataNode;
        this[constants.TYPE_SUBGIFT] = blankDataNode;
        this[constants.TYPE_SUBMYSTERY] = blankDataNode;
        Object.freeze(this);
    }

    merge(DataBucket) {
        const newThis = this.getCopy();
        newThis.merge(DataBucket);
        return newThis;
    }

    getCopy() {
        const toReturn = new DataBucket();
        toReturn[constants.TYPE_CHAT] = new DataNode();
        toReturn[constants.TYPE_RESUB] = new DataNode();
        toReturn[constants.TYPE_CHEER] = new DataNode();
        toReturn[constants.TYPE_SUB] = new DataNode();
        toReturn[constants.TYPE_BAN] = new DataNode();
        toReturn[constants.TYPE_ANONGIFT] = new DataNode();
        toReturn[constants.TYPE_SUBGIFT] = new DataNode();
        toReturn[constants.TYPE_SUBMYSTERY] = new DataNode();
        return toReturn;
    }
}
const blankDataBucket = new BlankDataBucket();

module.exports.blankDataNode = blankDataNode;
module.exports.blankDataBucket = blankDataBucket;

