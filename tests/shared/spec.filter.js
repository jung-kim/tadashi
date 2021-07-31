
const { assert } = require('chai');
const { eventSignals } = require('../../js/helpers/signals');
const filter = require('../../js/shared/filter');
const moment = require('../../js/helpers/moment');
const testUtils = require('../testUtils');
const env = require('../../js/env');


describe('filter.js', () => {
    beforeEach(() => {
        testUtils.reset();
    });

    it('setStart', () => {

        const time = moment('2020-01-01 10:00');

        filter.setStart(time);

        eventSignals.dispatch.calledWith({
            event: 'filter.change',
            changed: { start: time },
        });
        assert.deepEqual(env._filter._start, time);
    });
});