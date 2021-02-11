const api = require('../simpletons/api');
const auth = require('../simpletons/auth');

const twitchNameRegex = /[0-9a-zA-Z][\w]{3,23}/;

class TwitchAPI {
    async getChannelSearch(channel) {
        if (twitchNameRegex.test(channel)) {
            return await api.queryTwitchApi(`helix/search/channels?query=${channel}&first=10`, auth.getAuthObj());
        }

        return {};
    }

    async getChannelInfo(channel) {
        return await api.queryTwitchApi(`helix/streams?user_login=${channel}`, auth.getAuthObj());
    }

}

const twitchAPI = new TwitchAPI();
module.exports = twitchAPI;