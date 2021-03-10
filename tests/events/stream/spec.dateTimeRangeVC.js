
const { assert } = require('chai');
const _ = require('lodash');
const sinon = require('sinon');
const DateTime = require('../../../js/events/stream/components/DateTime');

const dateTimeRangeVC = require('../../../js/events/stream/dateTimeRangeVC');
const moment = require('../../../js/helpers/moment');
const utils = require('../../../js/helpers/utils');
// const DateTime = require('../../../../js/events/stream/components/DateTime');
// const moment = require('../../../..//js/helpers/moment');
// const constants = require('../../../../js/helpers/constants');

describe('DateTime.js', () => {
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
            console.log(888, dateTimeRangeVC)

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
});