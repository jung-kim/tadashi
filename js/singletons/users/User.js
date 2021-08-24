const filter = require("../../shared/filter");

const followingFlag = ':following';
const notFollowingFlag = ':notfollowing';


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

    isFollowingCurrent() {
        return this.isFollowing(filter.getChannelId());
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

    /**
     * Returns subscription info for current channel
     * 
     * @param {number} targetUserID of a user to check if this user is subscribed to that user
     * @returns {Object} subscribed info
     */
    getSubscribedTo(targetUserID) {
        return this._subscribedTo ? this._subscribedTo[targetUserID] : undefined;
    }

    getSubscribedToCurrent() {
        return this.getSubscribedTo(filter.getChannelId());
    }

    /**
     * Returns general info about this user to display
     * 
     * @returns {Object} JSON overviw of this user
     */
    getInfo() {
        const info = { following: this.isFollowingCurrent() }
        const subscribedObj = this.getSubscribedToCurrent();
        if (subscribedObj) {
            info.is_subscribed = true;
            info.tier = subscribedObj.tier;
            info.plan_name = subscribedObj.plan_name;
            if (subscribedObj.is_gift) {
                info.gifter_name = subscribedObj.gifter_name;
            }
        } else {
            info.is_subscribed = false;
        }

        return info;
    }

    /**
     * Returns css string to display for the info icon
     * 
     * @returns {string} css class depends on subscribed or not
     */
    getInfoCss() {
        const subObj = this.getSubscribedTo(filter.getChannelId());
        return subObj ? 'subscribed' : 'not-subscribed';
    }

    /**
     * returns if a user is selected based on the searchString.
     * @returns {boolean} weather if this user is applicable or not
     */
    isApplicable() {
        if (filter.getSearchString() === followingFlag) {
            return Boolean(this.isFollowingCurrent());
        } else if (filter.getSearchString() === notFollowingFlag) {
            return !this.isFollowingCurrent();
        } else if (filter.getSearchString() && filter.getSearchString().indexOf(':') !== 0) {
            // filtering for string like
            return this._userName.toLowerCase().indexOf(filter.getSearchString()) > -1;
        } else {
            // not a valid filter, returning true 
            return true;
        }
    }
}

module.exports = User;
