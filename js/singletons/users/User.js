const cssUnknown = require('../../helpers/constants').CSS_UNKNOWN;

class User {
    constructor(id, name) {
        this._id = id;
        this._userName = name;
        this.userNameCSSClass = cssUnknown;

        this._following = {};   // id, user pair of users this user is following
        this._followedBy = {};  // id, user pair of users this user is followed by
    }

    getID() {
        return this._id;
    }

    getUserName() {
        return this._userName;
    }

    /**
     * Users this user is following
     * @param {User} user 
     */
    addFollowing(user) {
        if (!user || !user.getID()) {
            throw 'user is missing id and cannot be added to following';
        }
        this._following[user.getID()] = user;
    }

    /**
     * Useers this user is followed by
     * @param {User} user 
     */
    addFollowedBy(user) {
        if (!user || !user.getID()) {
            throw 'user is missing id and cannot be added to followed by';
        }
        this._followedBy[user.getID()] = user;
    }

    /**
     * get followed by sumary grouped by if a follower is following 
     * current streamer or not.
     * 
     * @param {int} currentStreamID 
     */
    getFollowedBySummary(currentStreamID) {
        return Object.values(this._followedBy)
            .reduce((accumulator, current) => {
                if (current.isFollowing(currentStreamID)) {
                    accumulator.followingCurrent++;
                } else {
                    accumulator.admiringCurrent++;
                }
                return accumulator;
            }, { followingCurrent: 0, admiringCurrent: 0 });
    }

    getFollowedByCounts() {
        return Object.keys(this._followedBy).length;
    }

    isFollowing(targetUserID) {
        return Boolean(this._following[targetUserID]);
    }

    isFollowedBy(targetUserID) {
        return Boolean(this._followedBy[targetUserID]);
    }
}

module.exports = User;
