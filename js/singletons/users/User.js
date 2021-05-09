
class User {
    constructor(id, name, following, followedBy) {
        this._id = id;
        this._userName = name;

        if (following) {
            this._following = new Set(following);    // ids of users this user is following
        }
        if (followedBy) {
            this._followedBy = new Set(followedBy);  // ids of users this user is followed by
        }
    }

    getID() {
        return this._id;
    }

    getUserName() {
        return this._userName;
    }

    /**
     * Users this user is following
     * @param {number} userID of a user this user is following
     * @returns {undefined}
     */
    addFollowing(userID) {
        if (userID) {
            if (!this._following) {
                this._following = new Set();
            }
            this._following.add(userID);
        }
    }

    /**
     * Useers this user is followed by
     * @param {number} userID of a user this user is followed by
     * @returns {undefined}
     */
    addFollowedBy(userID) {
        if (userID) {
            if (!this._followedBy) {
                this._followedBy = new Set();
            }
            this._followedBy.add(userID);
        }
    }

    getFollowingCounts() {
        return this._following ? this._following.size : undefined;
    }

    getFollowedByCounts() {
        return this._followedBy ? this._followedBy.size : undefined;
    }

    /**
     * Check if this user is following the target user
     * 
     * @param {number} targetUserID of a user to check if this user is following by that user
     * @returns {Boolean|undefined} returns true if this this user is following the target user
     */
    isFollowing(targetUserID) {
        return this._following ? this._following.has(targetUserID) : undefined;
    }

    /**
     * Check if this user is followed by the target user
     * 
     * @param {number} targetUserID of a user to check if this user is followed by that user
     * @returns {Boolean|undefined} returns true if this this user is following the target user
     */
    isFollowedBy(targetUserID) {
        return this._followedBy ? this._followedBy.has(targetUserID) : undefined;
    }
}

module.exports = User;
