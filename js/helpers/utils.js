const moment = require('../helpers/moment');
const constants = require('./constants');
const models = require('../models/events');
const toMaterialStyle = require('material-color-hash').default;

const getHashedColor = (label, fillerColor) => {
    return `${toMaterialStyle(label, '200').backgroundColor}${fillerColor}`;
}

module.exports = {
    muteSeconds(t) {
        return t.set({ 'second': 0, 'millisecond': 0 });
    },

    getTimeBucket(second, widthInSec) {
        if (widthInSec == constants.BUCKET_DAY) {
            // day bucket is special, definition of "day" is conditional
            // due to timezone.  So simple mathmatics cannot be applied.
            const toReturn = moment.unix(second);
            toReturn.set({ 'hour': 0, 'minute': 0, 'second': 0, 'millisecond': 0 });
            return toReturn.unix();
        }
        return second - (second % widthInSec);
    },

    extractTabObj(urlHash) {
        if (urlHash.length === 0) {
            return { 'tab': constants.TABS_OPTIONS[0], 'args': {} };
        }

        const tabEndIndex = urlHash.indexOf('?') > -1 ? urlHash.indexOf('?') : urlHash.length;
        const tmpTab = urlHash.substr(1, tabEndIndex - 1).toLowerCase();
        const tab = constants.TABS_OPTIONS.indexOf(tmpTab) > -1 ? tmpTab : constants.TABS_OPTIONS[0];

        const searchParam = new URLSearchParams(urlHash.substr(tmpTab.length + 1));
        return { 'tab': tab, 'args': Object.fromEntries(searchParam.entries()) };
    },

    getNow() {
        return moment().set({ 'second': 0, 'millisecond': 0 });
    },

    getMessageType(raw) {
        switch (true) {
            case raw instanceof models.AnonGift:
                return constants.TYPE_ANONGIFT;
            case raw instanceof models.Ban:
                return constants.TYPE_BAN;
            case raw instanceof models.Cheer:
                return constants.TYPE_CHEER;
            case raw instanceof models.Chat:
                return constants.TYPE_CHAT;
            case raw instanceof models.MysterySubGift:
                return constants.TYPE_SUBMYSTERY;
            case raw instanceof models.ReSub:
                return constants.TYPE_RESUB;
            case raw instanceof models.SubGift:
                return constants.TYPE_SUBGIFT;
            case raw instanceof models.Sub:
                return constants.TYPE_SUB;
            default:
                throw `invalid object type: ${raw}`;
        }
    },

    getRaw(messageType, obj) {
        switch (parseInt(messageType)) {
            case constants.TYPE_ANONGIFT:
                return new models.AnonGift(obj);
            case constants.TYPE_BAN:
                return new models.Ban(obj);
            case constants.TYPE_CHEER:
                return new models.Cheer(obj);
            case constants.TYPE_CHAT:
                return new models.Chat(obj);
            case constants.TYPE_SUBMYSTERY:
                return new models.MysterySubGift(obj);
            case constants.TYPE_RESUB:
                return new models.ReSub(obj);
            case constants.TYPE_SUBGIFT:
                return new models.SubGift(obj);
            case constants.TYPE_SUB:
                return new models.Sub(obj);
            default:
                throw `invalid message type: ${messageType}`;
        }
    },

    getHashedColor(label, fillerColor) {
        return getHashedColor(label, fillerColor);
    },

    getBackgroundColor(labels) {
        return labels.map((userName) => getHashedColor(userName, '4D'));
    },

    getBorderColor(labels) {
        return labels.map((userName) => getHashedColor(userName, 'FF'));
    },

    convertObjectToHTML(obj) {
        return Object.entries(obj || {}).map(([k, v]) => `${k}: ${v}`).join('<br>');
    }
}