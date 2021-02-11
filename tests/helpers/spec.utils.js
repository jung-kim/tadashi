const assert = require('chai').assert;

const utils = require('../../js/helpers/utils');
const constants = require('../../js/helpers/constants');
const moment = require('moment');
const testUtils = require('../testUtils');
const events = require('../../js/models/events');


describe('Utils.js', () => {

    describe('getTimeBucket', () => {

        it('1 min level', () => {
            // moment(1590118161984)
            const testMap = {
                1590118161: 1590118140,
                1590118166: 1590118140,
                1590118206: 1590118200,
                1590118521: 1590118500,
                1590118581: 1590118560,
            }

            for (let [second, expected] of Object.entries(testMap)) {
                assert.deepEqual(utils.getTimeBucket(second, constants.INTERVAL_BUCKETS[0]), expected);
            }
        });

        it('5min level', () => {
            const testMap = {
                1590118161: 1590117900,
                1590118166: 1590117900,
                1590118206: 1590118200,
                1590118521: 1590118500,
                1590118761: 1590118500,
            }

            for (let [second, expected] of Object.entries(testMap)) {
                assert.deepEqual(utils.getTimeBucket(second, constants.INTERVAL_BUCKETS[1]), expected);
            }
        });

        it('60min level', () => {
            const testMap = {
                1590118161: 1590116400,
                1590118521: 1590116400,
                1590118761: 1590116400,
                1590122361: 1590120000,
            }

            for (let [second, expected] of Object.entries(testMap)) {
                assert.deepEqual(utils.getTimeBucket(second, constants.INTERVAL_BUCKETS[2]), expected);
            }
        });

        it('1 day level', () => {
            // this one is tricky, because this function is timezone dependent.
            // this test definitely is lacking in value.
            const testValues = [
                1590118161,
                1590118521,
                1590136161,
                1611289761,
                1611361761,
            ]
            testValues.forEach(second => {
                const res = moment.unix(utils.getTimeBucket(second, constants.INTERVAL_BUCKETS[3]));
                assert.equal(res.hour(), 0);
                assert.equal(res.minutes(), 0);
                assert.equal(res.seconds(), 0);
            });
        });
    });

    describe("extractTabObj()", () => {
        it("empty string", () => {
            assert.deepEqual(utils.extractTabObj(""), { 'tab': constants.TABS_OPTIONS[0], 'args': {} });
        });

        it("tab with noargs", () => {
            assert.deepEqual(utils.extractTabObj('#' + constants.TABS_OPTIONS[0]), { 'tab': constants.TABS_OPTIONS[0], 'args': {} });
        });

        it("invalid tab no args", () => {
            assert.deepEqual(utils.extractTabObj("#fwww"), { 'tab': constants.TABS_OPTIONS[0], 'args': {} });
        });

        it("invalid tab with args", () => {
            assert.deepEqual(utils.extractTabObj("#fwww?a=1"), { 'tab': constants.TABS_OPTIONS[0], 'args': { 'a': '1' } });
        });

        it("tab no args", () => {
            assert.deepEqual(utils.extractTabObj(`#${constants.TABS_OPTIONS[0]}?a=1`), { 'tab': constants.TABS_OPTIONS[0], 'args': { 'a': '1' } });
        });

        it("tab multi args", () => {
            assert.deepEqual(utils.extractTabObj(`#${constants.TABS_OPTIONS[0]}?a=1&b=2&c=3`), { 'tab': constants.TABS_OPTIONS[0], 'args': { 'a': '1', 'b': '2', 'c': '3' } });
        });
    });

    it('muteSeconds', () => {
        const result = utils.muteSeconds(moment('2020-01-01 10:11:22'));
        assert.equal(result.unix(), 1577902260);
    });

    it('getNow', () => {
        testUtils.setFakeNow();
        const now = utils.getNow()
        testUtils.unsetFakeNow();
        assert.equal(now.unix(), 1597976520);
    });

    it('getMessageType', () => {
        assert.equal(utils.getMessageType(new events.AnonGift({})), constants.TYPE_ANONGIFT);
        assert.equal(utils.getMessageType(new events.Ban({})), constants.TYPE_BAN);
        assert.equal(utils.getMessageType(new events.Chat({})), constants.TYPE_CHAT);
        assert.equal(utils.getMessageType(new events.Cheer({})), constants.TYPE_CHEER);
        assert.equal(utils.getMessageType(new events.ReSub({})), constants.TYPE_RESUB);
        assert.equal(utils.getMessageType(new events.Sub({})), constants.TYPE_SUB);
        assert.equal(utils.getMessageType(new events.SubGift({})), constants.TYPE_SUBGIFT);
        assert.equal(utils.getMessageType(new events.MysterySubGift({})), constants.TYPE_SUBMYSTERY);

        try {
            utils.getMessageType({});
        } catch (err) {
            assert.equal(err, `invalid object type: ${{}}`);
        }
    });

    it('getRaw', () => {
        assert.instanceOf(utils.getRaw(constants.TYPE_ANONGIFT, {}), events.AnonGift);
        assert.instanceOf(utils.getRaw(constants.TYPE_BAN, {}), events.Ban);
        assert.instanceOf(utils.getRaw(constants.TYPE_CHAT, {}), events.Chat);
        assert.instanceOf(utils.getRaw(constants.TYPE_CHEER, {}), events.Cheer);
        assert.instanceOf(utils.getRaw(constants.TYPE_RESUB, {}), events.ReSub);
        assert.instanceOf(utils.getRaw(constants.TYPE_SUB, {}), events.Sub);
        assert.instanceOf(utils.getRaw(constants.TYPE_SUBGIFT, {}), events.SubGift);
        assert.instanceOf(utils.getRaw(constants.TYPE_SUBMYSTERY, {}), events.MysterySubGift);

        try {
            utils.getRaw(undefined, {});
        } catch (err) {
            assert.equal(err, `invalid message type: ${undefined}`);
        }
    });
});