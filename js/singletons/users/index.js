/*eslint max-lines: ["error", {"max": 300, "skipComments": true, "skipBlankLines": true}]*/
const eventSignals = require('../../helpers/signals').eventSignals;

const User = require('./User');
const userIDFetcher = require('./userIDFetcher');
const userFollowsFetcher = require('./userFollowsFetcher');
const channelSubscribedFetcher = require('./channelSubscribedFetcher');
const constants = require('../../helpers/constants');
const filter = require('../filter');

class Users {
    constructor() {
        this.reset();
        eventSignals.add(this._eventSignalFunc.bind(this));
    }

    _eventSignalFunc(payload) {
        switch (payload.event) {
            case 'chatters.data.update':
                this.processChattersData(payload.data, payload.channelID);
                channelSubscribedFetcher.fetch(payload.channelID);
                eventSignals.dispatch({ event: 'chatters.data.update.data' });
                break;
            case 'fetch.user.ids.resp':
                this.processUserIDsResp(payload.data);
                break;
            case 'fetch.user.follows.resp':
                this.processUserFollowsResp(payload.data);
                break;
            case 'fetch.channel.subscribed.resp':
                this.processChannelSubscribedResp(payload.data);
                break;
            case 'api.unthrottled':
                userIDFetcher.fetch();
                userFollowsFetcher.fetch();
                channelSubscribedFetcher.fetch();
                break;
            case 'filter.change':
                if (payload.changed.channel) {
                    userIDFetcher.reset();
                    userFollowsFetcher.reset();
                    // channelFollowsFetcher.fetch(payload.data.id);
                    this._ensureUserExists(payload.changed.id, payload.changed.channel);
                }
                break;
            case 'fetch.channel.follows.resp':
                this.processUserFollowsResp(payload.data);
                break;
        }
    }

    reset() {
        this._viewers = {};
        this._idToUser = {};
        this._nameToUser = {};
        this._channelWarned = {};
    }

    getUserByID(id) {
        return this._idToUser[id];
    }

    getUserByName(name) {
        return this._nameToUser[name.toLowerCase()];
    }

    getViewers() {
        if (!filter.getSearchString()) {
            return this._viewers;
        }
        const toReturn = {}
        for (const [key, chatters] of Object.entries(this._viewers) || {}) {
            toReturn[key] = chatters.filter(u => u.isApplicable());
        }
        return toReturn;
    }


    /**
     * When a pair of id and name arrives, ensure user exists.
     * id is optional and maybe called again later with id to update object with the id.
     * 
     * @param {number} id optional
     * @param {string} name required
     * @returns {User} created or founded user object
     */
    _ensureUserExists(id, name) {
        const lowerCaseName = name.toLowerCase();
        const userObj = this.getUserByID(id) || this.getUserByName(lowerCaseName) || new User(id, name);

        if (id && !userObj._id) {
            userObj._id = parseInt(id);
        }
        if (id && !this._idToUser[id]) {
            this._idToUser[id] = userObj;
        }
        if (!this._nameToUser[lowerCaseName]) {
            this._nameToUser[lowerCaseName] = userObj;
        }

        return userObj;
    }

    /**
     * process chatters data to 
     *  1. ensure they exists as users object
     *  2. if new user, add them to id fetcher as user id is missing
     *  3. update viewers object to be used by chattersTableVC
     * 
     * @param {Object} chattersData result of `https://tmi.twitch.tv/group/user/{streamer name}/chatters`
     * @param {number} channelID current streamer id
     * @returns {undefined}
     * 
     * {
     *     "_links": {},
     *     "chatter_count": 3,
     *     "chatters": {
     *         "broadcaster": [
     *             "abc"
     *         ],
     *         "vips": [],
     *         "moderators": [],
     *         "staff": [],
     *         "admins": [],
     *         "global_mods": [],
     *         "viewers": [
     *             "aaa",
     *             "bbb"
     *         ]
     *     }
     * }
     */
    processChattersData(chattersData, channelID) {
        const tmp = {};
        const viewersCount = Object.values(chattersData || {}).
            reduce((sum, ray) => ray.length + sum, 0);

        for (const [key, names] of Object.entries(chattersData || {})) {
            tmp[key] = names.sort().map(name => {
                const lowerCaseName = name.toLowerCase();
                if (!this.getUserByName(lowerCaseName)) {
                    if (viewersCount < constants.MAX_VIEWERS_COUNTS_FOR_PROCESS) {
                        userIDFetcher.add(name);
                    }
                }

                return this._ensureUserExists(undefined, name);
            });
        }

        if (viewersCount >= constants.MAX_VIEWERS_COUNTS_FOR_PROCESS
            && !this._channelWarned[channelID]) {
            this._channelWarned[channelID] = true;
            eventSignals.dispatch({
                alert: {
                    type: 'warning',
                    body: `This channel has higher than ${constants.MAX_VIEWERS_COUNTS_FOR_PROCESS} viewers.  Halting some data gatherings to conserve API requests.`
                }
            });
        }

        this._viewers = tmp;
    }

    /**
     * for each user follows response, ensure users exists and establish
     * following and followed by relationships.
     * 
     * @param {Object} resp result of https://dev.twitch.tv/docs/api/reference#get-users-follows
     * {
     *     "total": 173,
     *     "data": [
     *         {
     *             "from_id": "1111",
     *             "from_login": "alogin",
     *             "from_name": "alogin",
     *             "to_id": "2222",
     *             "to_login": "another",
     *             "to_name": "another",
     *             "followed_at": "2021-03-16T11:06:38Z"
     *         },
     *         ...
     *     ]
     * }
     * @returns {undefined}
     * 
     */
    processUserFollowsResp(resp) {
        resp.data.forEach(follows => {
            const toID = parseInt(follows.to_id);
            const fromID = parseInt(follows.from_id);
            const toUser = this._ensureUserExists(toID, follows.to_name);
            const fromUser = this._ensureUserExists(fromID, follows.from_name);

            fromUser.addFollowing(toUser.getID());
            toUser.addFollowedBy(fromUser.getID());
        });

        // set follows for a user object
        eventSignals.dispatch({ event: `chatters.data.update.partial` });
    }

    /**
     * for each user subscribed response, ensure users exists and set subcribed
     * 
     * @param {Object} resp result of https://dev.twitch.tv/docs/api/reference#get-users-follows
     * {
        "data": [
            {
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
            },
            ...
        ],
        "pagination": {
            "cursor": "xxxx"
        }
     * }
     * @returns {undefined}
     * 
     */
    processChannelSubscribedResp(resp) {
        resp.data.forEach(subscribed => {
            this._ensureUserExists(subscribed.user_id, subscribed.user_name).
                addSubscribedTo(subscribed);
        });
        eventSignals.dispatch({ event: `fetch.channel.subscribed.refresh` });
    }

    /**
     * process get user response from `helix/users?login=...' to ensure exists
     * and queue up for fetching user follows fetching.
     * 
     * @param {Object} resp result of https://dev.twitch.tv/docs/api/reference#get-users
     * {
     *    "data": [
     *        {
     *            "id": "9999", // <-- why is this string...?  wtf twitch??
     *            "login": "...",
     *            "display_name": "...",
     *            "type": "",
     *            "broadcaster_type": "partner",
     *            "description": "...",
     *            "profile_image_url": "...",
     *            "offline_image_url": "..",
     *            "view_count": 9999,
     *            "created_at": "2014-06-11T14:11:05.9921119Z"
     *        }
     *    ]
     * }
     * @returns {undefined}
     * 
     */
    processUserIDsResp(resp) {
        for (const element of resp.data) {
            const userObj = this._ensureUserExists(element.id, element.login);
            userFollowsFetcher.add(userObj.getID());
        }
    }

    /**
     * return all collected users so far.
     * 
     * @returns {Array.<User>} all users
     */
    getAllUsers() {
        return Object.values(this._idToUser);
    }

    getFilteredUser() {
        return this.getAllUsers().filter(u => u.isApplicable());
    }

    /**
     * get top N followed by summary
     * 
     * @returns {Array.<Object>} array of followed by summary objects
     */
    getTopFollowedBySummary() {
        return this.getFilteredUser().
            sort((left, right) => {
                const followedByCount = (right.getFollowedByCounts() || 0) - (left.getFollowedByCounts() || 0);
                if (followedByCount === 0) {
                    return right.getID() - left.getID();
                } else {
                    return followedByCount;
                }
            }).slice(0, 10).
            map(userObj => this._getFollowedBySummary(userObj.getID()));
    }

    /**
     * return subscription by tiers separated out by gifted or non gifted.
     * 
     * @returns {Object} count of gifted and non gifted subs grouped by tiers
     */
    getSubscriptionsByTiers() {
        return this.getFilteredUser().
            reduce((res, curr) => {
                const subscribedTo = curr.getSubscribedToCurrent();
                if (subscribedTo) {
                    if (!res[subscribedTo.tier]) {
                        res[subscribedTo.tier] = {
                            gifted: 0,
                            notGifted: 0,
                        }
                    }

                    if (subscribedTo.is_gift) {
                        res[subscribedTo.tier].gifted++;
                    } else {
                        res[subscribedTo.tier].notGifted++;
                    }
                }
                return res;
            }, {});
    }

    /**
     * Get followed summary of a user grouped by if they are following 
     * current streamer or not
     * 
     * @param {number} userID userID of a user to get followed by summary
     * @returns {Object} { userID, unknown, folowing, admiring}
     */
    _getFollowedBySummary(userID) {
        if (!this.getUserByID(userID)) {
            return undefined;
        }

        return [...(this.getUserByID(userID)._followedBy || [])].
            map(id => this.getUserByID(id)).
            reduce((accumulator, current) => {
                switch (current.isFollowingCurrent()) {
                    case undefined:
                        accumulator.unknown++;
                        break;
                    case true:
                        accumulator.following++;
                        break;
                    case false:
                        accumulator.admiring++;
                        break;
                }
                return accumulator;
            }, { userID: userID, unknown: 0, following: 0, admiring: 0 });
    }

}

const users = new Users();
module.exports = users;
