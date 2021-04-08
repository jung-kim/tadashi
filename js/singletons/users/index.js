const eventSignals = require('../../helpers/signals').eventSignals;

const User = require('./User');
const userIDFetcher = require('./userIDFetcher');
const userFollowsFetcher = require('./userFollowsFetcher');
// const channelFollowsFetcher = require('./channelFollowsFetcher');
const constants = require('../../helpers/constants');

class Users {
    constructor() {
        this.reset();
        eventSignals.add(this._eventSignalFunc.bind(this));
    }

    _eventSignalFunc(payload) {
        switch (payload.event) {
            case 'chatters.data.update':
                this.processChattersData(payload.data, payload.channelID);
                eventSignals.dispatch({ event: 'chatters.data.update.data' });
                break;
            case 'fetch.user.ids.resp':
                this.processUserIDsResp(payload.data);
                break;
            case 'fetch.user.follows.resp':
                this.processUserFollowsResp(payload.data);
                break;
            case 'api.unthrottled':
                userIDFetcher.fetch();
                userFollowsFetcher.fetch();
                break;
            case 'channel.input.update':
                userIDFetcher.reset();
                userFollowsFetcher.reset();
                // channelFollowsFetcher.fetch(payload.data.id);
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
        return this._nameToUser[name];
    }

    getViewers() {
        return this._viewers;
    }

    getUsers(userFilter) {
        const users = Object.values(this._idToUser);

        if (!userFilter || !userFilter.isValid()) {
            return users;
        }

        return userFilter.filterUsers(users);
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

        userObj._id = userObj._id || id;

        if (id) {
            this._idToUser[id] = userObj;
        }
        this._nameToUser[lowerCaseName] = userObj;

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
     * get top N followed by summary
     * 
     * @param {number} currentStreamID userID of the current streamer
     * @param {UserFilter} filter filter to be applied on user lists
     * @returns {Array.<Object>} array of followed by summary objects
     */
    getTopFollowedBySummary(currentStreamID, filter) {
        return filter.filterUsers(Object.values(this._idToUser)).
            sort((left, right) => {
                const followedByCount = (right.getFollowedByCounts() || 0) - (left.getFollowedByCounts() || 0);
                if (followedByCount === 0) {
                    return right.getID() - left.getID();
                } else {
                    return followedByCount;
                }
            }).slice(0, 10).
            map(userObj => this._getFollowedBySummary(currentStreamID, userObj.getID()));
    }

    /**
     * Get followed summary of a user grouped by if they are following 
     * current streamer or not
     * 
     * @param {number} currentStreamID userID of the current streamer
     * @param {number} userID userID of a user to get followed by summary
     * @returns {Object} { userID, unknown, folowing, admiring}
     */
    _getFollowedBySummary(currentStreamID, userID) {
        if (!this.getUserByID(userID)) {
            return undefined;
        }

        return [...(this.getUserByID(userID)._followedBy || [])].
            map(id => this.getUserByID(id)).
            reduce((accumulator, current) => {
                switch (current.isFollowing(currentStreamID)) {
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
