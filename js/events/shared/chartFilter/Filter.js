const users = require('../../../singletons/users');
const twitchClient = require('../../../singletons/twitchClient');

class Filter {
    constructor(searchString) {
        this._searchString = (searchString || '').trim().toLowerCase();

        if (this._searchString.startsWith(':')) {
            switch (this._searchString) {
                case ':following':
                    this.isApplicable = this._isFollowing;
                    break;
                case ':notfollowing':
                    this.isApplicable = this._isNotFollowing;
                    break;
                default:
                    this.isApplicable = () => true;
                    break;
            }
        } else {
            this.isApplicable = this._isStringIncluded;
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

    isEqual(that) {
        return that && this._searchString === that._searchString;
    }
}

module.exports = Filter;
