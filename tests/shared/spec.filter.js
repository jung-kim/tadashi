
const { assert } = require('chai');
const { eventSignals } = require('../../js/helpers/signals');
const filter = require('../../js/shared/filter');
const moment = require('../../js/helpers/moment');
const testUtils = require('../testUtils');
const env = require('../../js/env');
const sinon = require('sinon');
const constants = require('../../js/helpers/constants');


describe('filter.js', () => {
    beforeEach(() => {
        testUtils.reset();
    });

    describe('setStart', () => {
        it('null', () => {
            filter.setStart(null);

            sinon.assert.notCalled(eventSignals.dispatch.withArgs());
        });

        it('default', () => {
            const time = moment('2020-01-01 10:00');

            filter.setStart(time);

            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
                event: 'filter.change',
                changed: { start: time },
            }));
            assert.deepEqual(env._filter._start, time);
        });
    });

    it('getStart', () => {
        const time = moment('2020-01-01 10:00');
        filter.setStart(time);

        assert.equal(filter.getStart(), time);
    });


    describe('setEnd', () => {
        it('null', () => {
            filter.setEnd(null);

            sinon.assert.notCalled(eventSignals.dispatch.withArgs());
        });

        it('default', () => {
            const time = moment('2020-01-01 10:00');

            filter.setEnd(time);

            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
                event: 'filter.change',
                changed: { end: time },
            }));
            assert.deepEqual(env._filter._end, time);
        });
    });

    it('getEnd', () => {
        const time = moment('2020-01-01 10:00');
        filter.setEnd(time);

        assert.equal(filter.getEnd(), time);
    });



    describe('setSearchString', () => {
        it('null', () => {
            filter.setSearchString(null);

            sinon.assert.notCalled(eventSignals.dispatch.withArgs());
        });

        it('default', () => {
            filter.setSearchString(' aBc ');

            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
                event: 'filter.change',
                changed: { searchString: 'abc' },
            }));
            assert.deepEqual(env._filter._searchString, 'abc');
        });
    });

    it('getSearchString', () => {
        filter.setSearchString('aaa');

        assert.equal(filter.getSearchString(), 'aaa');
    });

    describe('setIntervalLevel', () => {
        it('null', () => {
            filter.setIntervalLevel(null);

            sinon.assert.notCalled(eventSignals.dispatch.withArgs());
        });

        it('default', () => {
            filter.setIntervalLevel(constants.BUCKET_FIVE);

            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
                event: 'filter.change',
                changed: { intervalLevel: constants.BUCKET_FIVE },
            }));
            assert.deepEqual(env._filter._intervalLevel, constants.BUCKET_FIVE);
        });
    });

    it('getIntervalLevel', () => {
        filter.setIntervalLevel(constants.BUCKET_MIN);

        assert.equal(filter.getIntervalLevel(), constants.BUCKET_MIN);
    });
});