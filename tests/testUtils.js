const moment = require('../js/helpers/moment');
const sinon = require('sinon');

const constants = require('../js/helpers/constants');
const utils = require('../js/helpers/utils');
const DataBucket = require('../js/simpletons/dataCache/models/DataBucket');
const DataNode = require('../js/simpletons/dataCache/models/DataNode');
const api = require('../js/simpletons/api');
const users = require('../js/singletons/users');
const User = require('../js/singletons/users/User');
const auth = require('../js/simpletons/auth');
const fetchMock = require('fetch-mock');
const { eventSignals, domSignals } = require('../js/helpers/signals');
const userIDFetcher = require('../js/singletons/users/userIDFetcher');
const filter = require('../js/shared/filter');

/*eslint-disable no-bitwise */
const hashCode = s => Math.abs(s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0))
/*eslint-enable no-bitwise */
const oldTimestamp = "2020-06-24T20:54:29.953000-07:00";
const expiryTimestampFormat = "YYYY-MM-DD[T]HH:mm:ss.SSSSSSZ";
const originalMomentNow = moment.now;

const getExpiredAuthObj = () => {
    return {
        oauth2_token: {
            access_token: Math.round(Math.random() * 100000),
            expiry: oldTimestamp,
            refresh_token: 'abc',
        }, id_token_claims: {
            aud: Math.round(Math.random() * 100000),
        }
    }
}

const emptyDataNodeToCompare = Object.freeze(new DataNode(0, {}));

const blankAggsBucketToCompare = new DataBucket({
    [constants.TYPE_CHAT]: emptyDataNodeToCompare,
    [constants.TYPE_RESUB]: emptyDataNodeToCompare,
    [constants.TYPE_CHEER]: emptyDataNodeToCompare,
    [constants.TYPE_SUB]: emptyDataNodeToCompare,
    [constants.TYPE_BAN]: emptyDataNodeToCompare,
    [constants.TYPE_ANONGIFT]: emptyDataNodeToCompare,
    [constants.TYPE_SUBGIFT]: emptyDataNodeToCompare,
    [constants.TYPE_SUBMYSTERY]: emptyDataNodeToCompare,
    [constants.TYPE_TIMEOUT]: emptyDataNodeToCompare,
});

module.exports = {
    oldTimestamp: oldTimestamp,
    expiryTimestampFormat: expiryTimestampFormat,
    fakeNow: 1597976534,
    emptyDataNodeToCompare: emptyDataNodeToCompare,
    blankAggsBucketToCompare: blankAggsBucketToCompare,

    getFakeRawData(type, timestamp, displayName, bits) {
        const userID = hashCode(displayName);
        return utils.getRaw(type, {
            'tmi-sent-ts': timestamp,
            'display-name': displayName,
            'user-id': userID,
            'bits': bits
        });
    },

    getExpiredAuthObj() {
        return getExpiredAuthObj();
    },

    setFakeNow() { moment.now = () => this.fakeNow * 1000 },

    unsetFakeNow() { moment.now = originalMomentNow; },

    setChattersStubs() {
        document.getElementById.reset();
        document.getElementById.returns({
            insertAdjacentHTML: sinon.stub().returns('insertAdjacentHTMLCall'),
            classList: {
                add: sinon.stub().returns('addCall'),
                remove: sinon.stub().returns('removeCall'),
            }
        });
    },


    // global test rest func
    reset() {
        sinon.verifyAndRestore();
        document.getElementById.reset();
        document.getElementsByClassName.reset();
        auth.logout();
        localStorage.clear();
        fetchMock.reset();
        filter.reset();
        flatpickr.reset();
        eventSignals.dispatch.reset();
        domSignals.dispatch.reset();
        api.reset();
        userIDFetcher._isRunning = undefined;
        users.reset();

        // stub out boostrap functions 
        BSN = {
            Collapse: sinon.stub(),
            Popover: sinon.stub(),
            Dropdown: sinon.stub(),
            Alert: sinon.stub(),
        }
    },

    getTestDataBucket(count, name) {
        const adjustedCount = count || 1;

        users._ensureUserExists(1, 'a');
        users._ensureUserExists(2, 'b');
        users._ensureUserExists(3, 'c');
        users._ensureUserExists(4, 'd');
        users._ensureUserExists(5, 'e');
        users._ensureUserExists(6, 'f');
        users._ensureUserExists(7, 'g');
        users._ensureUserExists(8, 'h');
        users._ensureUserExists(9, 'i');
        users._ensureUserExists(10, 'j');
        users._ensureUserExists(11, 'k');
        users._ensureUserExists(12, 'l');
        users._ensureUserExists(13, 'm');
        users._ensureUserExists(14, 'n');
        users._ensureUserExists(15, 'o');

        return new DataBucket({
            [constants.TYPE_CHAT]: new DataNode(adjustedCount, { [name || 'a']: adjustedCount }),
            [constants.TYPE_RESUB]: new DataNode(adjustedCount, { [name || 'b']: adjustedCount }),
            [constants.TYPE_CHEER]: new DataNode(adjustedCount, { [name || 'c']: adjustedCount }),
            [constants.TYPE_SUB]: new DataNode(adjustedCount, { [name || 'd']: adjustedCount }),
            [constants.TYPE_BAN]: new DataNode(adjustedCount, { [name || 'e']: adjustedCount }),
            [constants.TYPE_ANONGIFT]: new DataNode(adjustedCount, { [name || 'f']: adjustedCount }),
            [constants.TYPE_SUBGIFT]: new DataNode(adjustedCount, { [name || 'g']: adjustedCount }),
            [constants.TYPE_SUBMYSTERY]: new DataNode(adjustedCount, { [name || 'h']: adjustedCount }),
            [constants.TYPE_TIMEOUT]: new DataNode(adjustedCount, { [name || 'i']: adjustedCount }),
        });
    },

    getUserObject(userID, name, following, followedBy, subscribedTo) {
        const user = new User(userID, name);

        if (following) {
            user._following = new Set(following)
        }
        if (followedBy) {
            user._followedBy = new Set(followedBy)
        }
        if (subscribedTo) {
            user._subscribedTo = subscribedTo;
        }

        return user;
    },
}
