const cssUnknown = require('../../helpers/constants').CSS_UNKNOWN;

class User {
    constructor(id, name, follows) {
        this._id = id;
        this._userName = name;
        this.userNameCSSClass = cssUnknown;
        if (follows) {
            this._follows = new Set(Object.keys(follows).map(id => parseInt(id)));
        }
    }

    getID() {
        return this._id;
    }

    getUserName() {
        return this._userName;
    }

    setID(id) {
        this._id = id;
    }

    addFollows(newFollows) {
        if (!newFollows) {
            return;
        }
        if (!this._follows) {
            this._follows = new Set();
        }

        (newFollows.data || []).forEach(follows => this._follows.add(parseInt(follows.to_id)));
    }

    isFollowing(targetUserID) {
        if (!this._follows) {
            return undefined;
        }
        return this._follows.has(targetUserID);
    }

    isApplicable(searchedValue) {
        return this._userName.toLowerCase().indexOf(searchedValue) > -1;
    }
}

module.exports = User;
