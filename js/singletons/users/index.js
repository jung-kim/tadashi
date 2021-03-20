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
                this.processUserFollowsResp(payload.userID, payload.data);
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
                this.processChannelFollows(payload.channelID, payload.data);
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

    processChattersData(chattersData, channelID) {
        const tmp = {};
        const viewersCount = Object.values(chattersData || {}).
            reduce((sum, ray) => ray.length + sum, 0);

        for (const [key, names] of Object.entries(chattersData || {})) {
            tmp[key] = names.sort().map(name => {
                const lowerCaseName = name.toLowerCase();

                if (!this.getUserByName(lowerCaseName)) {
                    this._nameToUser[lowerCaseName] = new User(undefined, name);

                    if (viewersCount < constants.MAX_VIEWERS_COUNTS_FOR_PROCESS) {
                        userIDFetcher.add(name);
                    }
                }

                return this.getUserByName(lowerCaseName);
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

    processUserFollowsResp(id, resp) {
        // set follows for a user object
        this.getUserByID(id).addFollows(resp);
        eventSignals.dispatch({ event: `chatters.data.update.partial` });

        resp.data.forEach(follows => {
            const toID = parseInt(follows.to_id);
            const toName = follows.to_name;
            const toLowerCaseName = toName.toLowerCase();
            const userObj = this._idToUser[toID] || this._nameToUser[toLowerCaseName] || new User(toID, toName);

            if (!this._idToUser[toID]) {
                this._idToUser[toID] = userObj;
            }
            if (!this._nameToUser[lowerCaseName]) {
                this._nameToUser[lowerCaseName] = userObj;
            }
        });
    }

    processUserIDsResp(resp) {
        for (const element of resp) {
            const login = element.login.toLowerCase();
            if (this.getUserByName(login)) {
                const intID = parseInt(element.id);
                this.getUserByName(login).setID(intID);
                this._idToUser[intID] = this.getUserByName(login);
                userFollowsFetcher.add(intID);
            }
        }
    }

    processChannelFollows(channelID, resp) {
        resp.data.forEach(follows => {
            const userID = follows.from_id;
            const userName = follows.from_name;
            const userNameLower = userName.toLowerCase();

            const user = this.getUserByName(userNameLower) || this.getUserByID(userID) || new User(userID, userName);
            user.addFollows({ data: [{ to_id: channelID }] });

            this._nameToUser[userNameLower] = user;
            this._idToUser[userID] = user;
        });
    }
}

const users = new Users();
module.exports = users;
