const moment = require('../js/helpers/moment');
const sinon = require('sinon');

const constants = require('../js/helpers/constants');
const utils = require('../js/helpers/utils');
const DataBucket = require('../js/simpletons/dataCache/models/DataBucket');
const DataNode = require('../js/simpletons/dataCache/models/DataNode');

const hashCode = s => Math.abs(s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0))
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
    }
}
