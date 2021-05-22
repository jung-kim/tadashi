const constants = require('../../../helpers/constants');
const DataNode = require('./DataNode');
const DataBucket = require('./DataBucket');

/**
 * Represents collections of empty DataNode or DataBucket to be served as default value.
 * Strictly speaking, this object is not necessary, but this object will help prevent 
 * creation of new object and thus reduce gc pressure.
 */
class BlankDataNode {
    constructor() {
        this._sum = 0;
        this._users = {};
        Object.freeze(this);
    }

    merge(dataNode) {
        return dataNode.getCopy();
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
        return DataBucket.getCopy();
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

