
// Represents a user object
class User {
    constructor(id, name) {
        this._id = id ? parseInt(id) : undefined;
        this._userName = name;
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

    /**
     * 
     * @param {object} subObject Inthe format of:
     * https://dev.twitch.tv/docs/api/reference#Get-Broadcaster-Subscriptions
     * 
     * {
        "broadcaster_id": "141981764",
        "broadcaster_login": "twitchdev",
        "broadcaster_name": "TwitchDev",
        "gifter_id": "12826",
        "gifter_login": "twitch",
        "gifter_name": "Twitch",
        "is_gift": true,
        "tier": "1000",
        "plan_name": "Channel Subscription (twitchdev)",
        "user_id": "527115020",
        "user_name": "twitchgaming",
        "user_login": "twitchgaming"
       }
     * @returns {undefined}
     */
    addSubscribedTo(subObject) {
        if (subObject) {
            if (!this._subscribedTo) {
                this._subscribedTo = {};
            }
            this._subscribedTo[subObject.broadcaster_id] = subObject;
        }
    }

    getFollowingCounts() {
        return this._following ? this._following.size : undefined;
    }

    getFollowedByCounts() {
        return this._followedBy ? this._followedBy.size : undefined;
    }

    getSubscribedToCount() {
        return this._subscribedTo ? Object.keys(this._subscribedTo).length : undefined;
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

    getSubscribedTo(targetUserID) {
        return this._subscribedTo ? this._subscribedTo[targetUserID] : undefined;
    }

    getInfo(targetUserID) {
        let info = `following: ${this.isFollowing(targetUserID)}`;
        const subscribedObj = this.getSubscribedTo(targetUserID);
        if (!subscribedObj) {
            return `${info}\nis_subscribed: false`;
        } else {
            info += `\nis_subscribed: true`;
            info += `\ntier: ${subscribedObj.tier}`;
            info += `\nplan_name: ${subscribedObj.plan_name}`;
            if (subscribedObj.is_gift) {
                info += `\gifter: ${subscribedObj.gifter_name}`;
            }
        }

    }
}

module.exports = User;
