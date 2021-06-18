const users = require('../../../singletons/users');
const twitchClient = require('../../../singletons/twitchClient');

const followingFlag = ':following';
const notFollowingFlag = ':notfollowing';

class UserFilter {
    constructor(searchString) {
        this.changeSearchString(searchString);
    }

    changeSearchString(searchString) {
        this._searchString = this._getCleanedSearchString(searchString);

        if (this._searchString === followingFlag) {
            this.isApplicable = this._isFollowing;
        } else if (this._searchString === notFollowingFlag) {
            this.isApplicable = this._isNotFollowing;
        } else if (this._searchString.indexOf(':') !== 0 && this.isValid()) {
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

        return user.isFollowingCurrent();
    }

    _isNotFollowing(name) {
        const isFollowing = this._isFollowing(name);

        if (isFollowing === undefined) {
            return undefined;
        }

        return !isFollowing;
    }

    _isStringIncluded(name) {
        return name.toLowerCase().indexOf(this._searchString) > -1;
    }

    _getCleanedSearchString(searchString) {
        return (searchString || '').trim().toLowerCase();
    }

    /**
     * Filter array of users based on user Name
     * @param {Array.<User>} users list of users to be filtered
     * @returns {Array.<User>} filtered users
     */
    filterUsers(users) {
        return this.isValid() ? users.filter(user => this.isApplicable(user._userName)) : users;
    }

    isSameSearchString(newSearchString) {
        return this._getCleanedSearchString(newSearchString) === this._searchString;
    }

    isValid() {
        return Boolean(this._searchString);
    }
}

const filter = new UserFilter();
module.exports = filter;
