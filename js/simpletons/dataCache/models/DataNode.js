
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
     */
    add(raw) {
        const value = raw.bits ? raw.bits / 100 : 1;
        this._sum += value;
        this._users[raw.displayName] = (this._users[raw.displayName] || 0) + value;
    }

    /**
     * get a copy of data node that returns a new object
     * 
     * @param {object} filter object
     * @returns {DataNode} new object with same data as this
     */
    getCopy(filter) {
        // @todo search
        if (!filter) {
            return new DataNode(this._sum, { ...this._users });
        }
        let sum = 0;
        const users = Object.keys(this._users).reduce((obj, key) => {
            if (filter.isApplicable(key)) {
                sum += this._users[key];
                obj[key] = this._users[key];
            }
            return obj;
        }, {});

        return new DataNode(sum, users);
    }

    /**
     * merge targetDataNode's values into this
     * 
     * @param {DataNode} targetDataNode to be added into this
     * @returns {DataNode} this
     */
    merge(filter, targetDataNode) {
        if (targetDataNode) {
            Object.keys(targetDataNode._users).forEach(key => {
                if (!filter || filter.isApplicable(key)) {
                    this._users[key] = (this._users[key] || 0) + targetDataNode._users[key];
                    this._sum += targetDataNode._users[key];
                }
            });
        }
        return this;
    }
}

module.exports = DataNode;