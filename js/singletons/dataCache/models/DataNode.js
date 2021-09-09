const users = require('../../users');

/**
 * Holds aggregate of event data that holds
 * - total number of all counts
 * - map of users and it's counts
 * for a time period
 */
class DataNode {
    constructor(sum, users) {
        this._sum = sum || 0;
        this._users = users || {};
    }

    /**
     * Add received raw event data object int to this data node.
     * 
     * Degree of "value" associated with an object is 1 for all event data objects
     * except for the Cheer event.  For Cheer, it's bits / 100.
     * 
     * This some what normalize value of data across all events for easier comparisons
     * as Cheers is likely to overshadow other events in comparison charts.
     * 
     * @param {Object} raw event data
     * @returns {undefined}
     */
    add(raw) {
        const value = raw.bits ? raw.bits / 100 : 1;
        this._sum += value;
        this._users[raw.displayName] = (this._users[raw.displayName] || 0) + value;
    }

    /**
     * get a copy of data node that returns a new object
     * 
     * @returns {DataNode} new object with same data as this
     */
    getCopy() {
        return new DataNode(this._sum, { ...this._users });
    }

    /**
     * merge targetDataNode's values into this
     * 
     * @param {DataNode} targetDataNode to be added into this
     * @param {boolean} isIgnoreFilter ignore filter or not
     * @returns {DataNode} this
     */
    merge(targetDataNode, isIgnoreFilter) {
        if (targetDataNode) {
            Object.keys(targetDataNode._users).forEach(key => {
                if (isIgnoreFilter || users.getUserByName(key).isApplicable()) {
                    this._users[key] = (this._users[key] || 0) + targetDataNode._users[key];
                    this._sum += targetDataNode._users[key];
                }
            });
        }
        return this;
    }
}

module.exports = DataNode;