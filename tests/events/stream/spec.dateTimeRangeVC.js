
const { assert } = require('chai');
const _ = require('lodash');
const sinon = require('sinon');

const dateTimeRangeVC = require('../../../js/events/stream/dateTimeRangeVC');
const moment = require('../../../js/helpers/moment');
const utils = require('../../../js/helpers/utils');
const chartFilter = require('../../../js/events/shared/chartFilter');
const DateTime = require('../../../js/events/stream/components/DateTime');

describe('DateTimeRange.js', () => {
    beforeEach(() => {
        reset();
    });

    it('initialize', () => {
        const destroy = sinon.stub(dateTimeRangeVC, 'destroy');

        document.getElementById = sinon.stub().withArgs(sinon.match.any).onFirstCall().returns({});

        dateTimeRangeVC.initialize();

        sinon.assert.calledOnce(destroy);
        assert.deepEqual(dateTimeRangeVC.start.id, 'time-start');
        assert.deepEqual(dateTimeRangeVC.end.id, 'time-end');
    });

    describe('destroy', () => {
        it('start and end is intialized', () => {
            dateTimeRangeVC.start = undefined;
            dateTimeRangeVC.end = undefined;
            document.getElementById = sinon.stub().withArgs(sinon.match.any).onFirstCall().returns({});

            dateTimeRangeVC.initialize();

            const startDestroy = sinon.stub(dateTimeRangeVC.start, 'destroy');
            const endDestroy = sinon.stub(dateTimeRangeVC.end, 'destroy');

            dateTimeRangeVC.destroy();
            sinon.assert.calledOnce(startDestroy);
            sinon.assert.calledOnce(endDestroy);
            assert.isUndefined(dateTimeRangeVC.start);
            assert.isUndefined(dateTimeRangeVC.end);
        });
    });

    describe('minProgressed', () => {
        it('live and valid', () => {
            dateTimeRangeVC.isLive = true;
            dateTimeRangeVC.start = new DateTime('abc1');
            dateTimeRangeVC.end = new DateTime('abc2');
            const now = moment().set({ 'second': 0, 'millisecond': 0 });
            sinon.stub(utils, 'getNow').returns(now);
            const set = sinon.stub(dateTimeRangeVC.end, 'set').withArgs(now);

            dateTimeRangeVC.minProgressed();

            sinon.assert.calledOnce(set);
        });

        it('not live and valid', () => {
            dateTimeRangeVC.isLive = false;
            dateTimeRangeVC.start = new DateTime('abc1');
            dateTimeRangeVC.end = new DateTime('abc2');
            const now = moment().set({ 'second': 0, 'millisecond': 0 });
            sinon.stub(utils, 'getNow').returns(now);
            const set = sinon.stub(dateTimeRangeVC.end, 'set');

            dateTimeRangeVC.minProgressed();

            sinon.assert.notCalled(set);
        });

        it('live and not valid', () => {
            dateTimeRangeVC.isLive = true;
            dateTimeRangeVC.start = undefined;
            dateTimeRangeVC.end = new DateTime('abc2');
            const now = moment().set({ 'second': 0, 'millisecond': 0 });
            sinon.stub(utils, 'getNow').returns(now);
            const set = sinon.stub(dateTimeRangeVC.end, 'set');

            dateTimeRangeVC.minProgressed();

            sinon.assert.notCalled(set);
        });

        it('not live and not valid', () => {
            dateTimeRangeVC.isLive = false;
            dateTimeRangeVC.start = undefined;
            dateTimeRangeVC.end = new DateTime('abc2');
            const now = moment().set({ 'second': 0, 'millisecond': 0 });
            sinon.stub(utils, 'getNow').returns(now);
            const set = sinon.stub(dateTimeRangeVC.end, 'set');

            dateTimeRangeVC.minProgressed();

            sinon.assert.notCalled(set);
        });
    });

    describe('_onWindowFocus', () => {
        it('live and valid', () => {
            dateTimeRangeVC.isLive = true;
            dateTimeRangeVC.start = new DateTime('abc1');
            dateTimeRangeVC.end = new DateTime('abc2');
            const set = sinon.stub(dateTimeRangeVC, '_timeReset');

            dateTimeRangeVC._onWindowFocus();

            sinon.assert.calledOnce(set);
        });

        it('not live and valid', () => {
            dateTimeRangeVC.isLive = false;
            dateTimeRangeVC.start = new DateTime('abc1');
            dateTimeRangeVC.end = new DateTime('abc2');
            const set = sinon.stub(dateTimeRangeVC, '_timeReset');

            dateTimeRangeVC._onWindowFocus();

            sinon.assert.notCalled(set);
        });

        it('live and not valid', () => {
            dateTimeRangeVC.isLive = true;
            dateTimeRangeVC.start = undefined;
            dateTimeRangeVC.end = new DateTime('abc2');
            const set = sinon.stub(dateTimeRangeVC, '_timeReset');

            dateTimeRangeVC._onWindowFocus();

            sinon.assert.notCalled(set);
        });

        it('not live and not valid', () => {
            dateTimeRangeVC.isLive = false;
            dateTimeRangeVC.start = undefined;
            dateTimeRangeVC.end = new DateTime('abc2');
            const set = sinon.stub(dateTimeRangeVC, '_timeReset');

            dateTimeRangeVC._onWindowFocus();

            sinon.assert.notCalled(set);
        });
    });

    describe('setDate', () => {
        it('invalid', () => {
            const _setIsLive = sinon.stub(dateTimeRangeVC, '_setIsLive');
            dateTimeRangeVC.start = new DateTime('abc1');
            dateTimeRangeVC.end = undefined;
            dateTimeRangeVC.setDate();
            sinon.assert.notCalled(_setIsLive);
        });

        it('valid and reversed', () => {
            const _setIsLive = sinon.stub(dateTimeRangeVC, '_setIsLive');
            dateTimeRangeVC.start = new DateTime('abc1');
            dateTimeRangeVC.end = new DateTime('abc2');

            const start = { unix: () => 10 };
            const end = { unix: () => 5 };
            sinon.stub(dateTimeRangeVC.start, 'get').returns(start);
            sinon.stub(dateTimeRangeVC.end, 'get').returns(end);
            const startSet = sinon.stub(dateTimeRangeVC.start, 'set').withArgs(end)
            const endSet = sinon.stub(dateTimeRangeVC.end, 'set').withArgs(start)

            dateTimeRangeVC.setDate();

            sinon.assert.calledOnce(startSet);
            sinon.assert.calledOnce(endSet);
            sinon.assert.notCalled(_setIsLive);
        });

        it('valid', () => {
            const _setIsLive = sinon.stub(dateTimeRangeVC, '_setIsLive');
            const start = { unix: () => 5 };
            const end = { unix: () => 10 };
            const update = sinon.stub(chartFilter, 'update').withArgs({
                start: start,
                end: end,
            });
            dateTimeRangeVC.start = new DateTime('abc1');
            dateTimeRangeVC.end = new DateTime('abc2');
            sinon.stub(dateTimeRangeVC.start, 'get').returns(start);
            sinon.stub(dateTimeRangeVC.end, 'get').returns(end);

            dateTimeRangeVC.setDate();

            sinon.assert.calledOnce(update);
            sinon.assert.calledOnce(_setIsLive);
        });
    });

    describe('_isValid', () => {
        it('start and end valid', () => {
            dateTimeRangeVC.start = new DateTime('abc1');
            dateTimeRangeVC.end = new DateTime('abc2');

            assert.isTrue(dateTimeRangeVC._isValid());
        });

        it('start is valid and end is invalid', () => {
            dateTimeRangeVC.start = new DateTime('abc1');
            dateTimeRangeVC.end = undefined;

            assert.isFalse(dateTimeRangeVC._isValid());

        });

        it('start is invalid and end is valid', () => {
            dateTimeRangeVC.start = undefined;
            dateTimeRangeVC.end = new DateTime('abc2');

            assert.isFalse(dateTimeRangeVC._isValid());
        });

        it('start and end is invalid', () => {
            dateTimeRangeVC.start = undefined;
            dateTimeRangeVC.end = undefined;

            assert.isFalse(dateTimeRangeVC._isValid());
        });
    });

    it('_timeReset', () => {
        dateTimeRangeVC.defaultStart = moment();
        const now = moment();
        sinon.stub(utils, 'getNow').returns(now);
        const startSet = sinon.stub(dateTimeRangeVC.start, 'set').withArgs(dateTimeRangeVC.defaultStart);
        const endSet = sinon.stub(dateTimeRangeVC.end, 'set').withArgs(now);

        dateTimeRangeVC._timeReset();

        sinon.assert.calledOnce(startSet);
        sinon.assert.calledOnce(endSet);
    });

    describe('_setIsLive', () => {

        it('positive < 60', () => {
            dateTimeRangeVC.end = new DateTime('abc2');

            sinon.stub(dateTimeRangeVC.end, 'get').returns(moment(100000));
            const now = moment(120000);
            sinon.stub(utils, 'getNow').returns(now);

            dateTimeRangeVC._setIsLive();

            assert.isTrue(dateTimeRangeVC.isLive);
        });

        it('positive > 60', () => {
            dateTimeRangeVC.end = new DateTime('abc2');

            sinon.stub(dateTimeRangeVC.end, 'get').returns(moment(100000));
            const now = moment(370000);
            sinon.stub(utils, 'getNow').returns(now);

            dateTimeRangeVC._setIsLive();

            assert.isFalse(dateTimeRangeVC.isLive);
        });

        it('negative', () => {
            dateTimeRangeVC.end = new DateTime('abc2');

            sinon.stub(dateTimeRangeVC.end, 'get').returns(moment(100000));
            const now = moment(70000000);
            sinon.stub(utils, 'getNow').returns(now);

            dateTimeRangeVC._setIsLive();

            assert.isFalse(dateTimeRangeVC.isLive);
        });
    });

    it('_domSignalsFunc', () => {
        const _timeReset = sinon.stub(dateTimeRangeVC, '_timeReset');

        dateTimeRangeVC._domSignalsFunc({ type: 'click', id: 'time-reset' });

        sinon.assert.calledOnce(_timeReset);
    });
});