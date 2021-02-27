const users = require('../../../singletons/users');
const twitchClient = require('../../../singletons/twitchClient');

const followingFlag = ':following';
const notFollowingFlag = ':notfollowing';

class Filter {
    constructor(searchString) {
        this.changeSearchString(searchString);
    }

    changeSearchString(searchString) {
        this._searchString = (searchString || '').trim().toLowerCase();

        if (this._searchString === followingFlag) {
            this.isApplicable = this._isFollowing;
        } else if (this._searchString === notFollowingFlag) {
            this.isApplicable = this._isNotFollowing;
        } else if (this.isValid()) {
            this.isApplicable = this._isStringIncluded;
        } else {
            this.isApplicable = () => true;
        }
    }

    _isFollowing(name) {
        const user = users.getUserByName(name);
        if (!user) {
            return undefined;
        }

        return user.isFollowing(twitchClient.getChannelID());
    }

    _isNotFollowing(name) {
        const isFollowing = this._isFollowing(name);

        if (isFollowing === undefined) {
            return undefined;
        }

        return !isFollowing;
    }

    _isStringIncluded(name) {
        if (!this._searchString) {
            return true;
        }
        return name.toLowerCase().indexOf(this._searchString) > -1;
    }

    isSameSearchString(newSearchString) {
        return newSearchString === this._searchString;
    }

    isValid() {
        return Boolean(this._searchString);
    }
}

const filter = new Filter();
module.exports = filter;
