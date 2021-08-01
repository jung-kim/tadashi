
const { assert } = require('chai');
const { eventSignals } = require('../../js/helpers/signals');
const filter = require('../../js/shared/filter');
const moment = require('../../js/helpers/moment');
const testUtils = require('../testUtils');
const env = require('../../js/env');
const sinon = require('sinon');


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
});