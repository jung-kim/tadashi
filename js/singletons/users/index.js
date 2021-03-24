const eventSignals = require('../../helpers/signals').eventSignals;

const User = require('./User');
const userIDFetcher = require('./userIDFetcher');
const userFollowsFetcher = require('./userFollowsFetcher');
const channelFollowsFetcher = require('./channelFollowsFetcher');
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
                channelFollowsFetcher.fetch(payload.data.id);
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
     */
    _ensureUserExists(id, name) {
        const lowerCaseName = name.toLowerCase();
        const userObj = this.getUserByID(id) || this.getUserByName(lowerCaseName) || new User(id, name);

        userObj._id = userObj._id || id;
        userObj._userName = userObj._userName || name;

        if (id) {
            this._idToUser[id] = userObj;
        }
        this._nameToUser[lowerCaseName] = userObj;

        return userObj;
    }

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
     * @param {json} resp 
     * 
{
    "total": 173,
    "data": [
        {
            "from_id": "1111",
            "from_login": "alogin",
            "from_name": "alogin",
            "to_id": "2222",
            "to_login": "another",
            "to_name": "another",
            "followed_at": "2021-03-16T11:06:38Z"
        },
    ]
    ...
}
     */
    processUserFollowsResp(resp) {
        resp.data.forEach(follows => {
            const toID = parseInt(follows.to_id);
            const fromID = parseInt(follows.from_id);
            const toUser = this._ensureUserExists(toID, follows.to_name);
            const fromUser = this._ensureUserExists(fromID, follows.from_name);

            fromUser.addFollowing(toUser);
            toUser.addFollowedBy(fromUser);
        });

        // set follows for a user object
        eventSignals.dispatch({ event: `chatters.data.update.partial` });
    }

    /**
     * process get user response from `helix/users?login=...' to ensure exists
     * and queue up for fetching user follows fetching.
     * 
     * @param {json} resp 
     * 
{
    "data": [
        {
            "id": "9999", // <-- why is this string...?  wtf twitch??
            "login": "...",
            "display_name": "...",
            "type": "",
            "broadcaster_type": "partner",
            "description": "...",
            "profile_image_url": "...",
            "offline_image_url": "..",
            "view_count": 9999,
            "created_at": "2014-06-11T14:11:05.9921119Z"
        }
    ]
}
     */
    processUserIDsResp(resp) {
        for (const element of resp.data) {
            const userObj = this._ensureUserExists(element.id, element.login);
            userFollowsFetcher.add(userObj.getID());
        }
    }
}

const users = new Users();
module.exports = users;
