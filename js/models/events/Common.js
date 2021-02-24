
class Common {
    constructor(userstate) {
        this.userID = parseInt(userstate['user-id'] || userstate.userID);
        this.displayName = userstate['display-name'] || userstate.displayName;
        this.timestamp = parseInt(userstate['tmi-sent-ts']) || userstate.timestamp;
    }
}

module.exports = Common;