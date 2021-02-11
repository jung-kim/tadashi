const signals = require('../../helpers/signals').signals;

const User = require('./User');
const userIDFetcher = require('./userIDFetcher');
const userFollowsFetcher = require('./userFollowsFetcher');
const channelFollowsFetcher = require('./channelFollowsFetcher');
const constants = require('../../helpers/constants');


signals.add(async (payload) => {
    switch (payload.event) {
        case 'chatters.data.update':
            users.processChattersData(payload.data, payload.channelID);
            signals.dispatch({ event: 'chatters.data.update.data' });
            break;
        case 'fetch.user.ids.resp':
            users.processUserIDsResp(payload.data);
            break;
        case 'fetch.user.follows.resp':
            users.processUserFollowsResp(payload.userID, payload.data);
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
            users.processChannelFollows(payload.channelID, payload.data);
            break;
    }
});


class Users {
    constructor() {
        this.reset();
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

                return this.getUserByName[lowerCaseName];
            });
        }

        if (viewersCount >= constants.MAX_VIEWERS_COUNTS_FOR_PROCESS
            && !this._channelWarned[channelID]) {
            this._channelWarned[channelID] = true;
            signals.dispatch({
                alert: {
                    body: `This channel has higher than ${constants.MAX_VIEWERS_COUNTS_FOR_PROCESS} viewers.  Halting some data gatherings to conserve API requests.`
                }
            });
        }

        this._viewers = tmp;
    }

    processUserFollowsResp(id, resp) {
        // set follows for a user object
        this.getUserByID(id).addFollows(resp);
        signals.dispatch({ event: `chatters.data.update.partial` });
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
