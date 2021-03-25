const cssUnknown = require('../../helpers/constants').CSS_UNKNOWN;

class User {
    constructor(id, name) {
        this._id = id;
        this._userName = name;
        this.userNameCSSClass = cssUnknown;

        this._following = new Set();   // ids of users this user is following
        this._followedBy = new Set();  // ids of users this user is followed by
    }

    getID() {
        return this._id;
    }

    getUserName() {
        return this._userName;
    }

    /**
     * Users this user is following
     * @param {int} userID 
     */
    addFollowing(userID) {
        if (userID) {
            this._following.add(userID);
        }
    }

    /**
     * Useers this user is followed by
     * @param {int} userID
     */
    addFollowedBy(userID) {
        if (userID) {
            this._followedBy.add(userID);
        }
    }

    getFollowingCounts() {
        return this._following.size;
    }

    getFollowedByCounts() {
        return this._followedBy.size;
    }

    /**
     * Check if this user is following the target user
     * 
     * @param {int} targetUserID 
     */
    isFollowing(targetUserID) {
        return this._following.has(targetUserID);
    }

    /**
     * Check if this user is followed by the target user
     * 
     * @param {*} targetUserID 
     */
    isFollowedBy(targetUserID) {
        return this._followedBy.has(targetUserID);
    }
}

module.exports = User;
