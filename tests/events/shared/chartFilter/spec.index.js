const { assert } = require('chai');
const moment = require('../../../../js/helpers/moment');
const sinon = require('sinon');

const chartFilter = require('../../../../js/events/shared/chartFilter');
const eventSignals = require('../../../../js/helpers/signals').eventSignals;
const constants = require('../../../../js/helpers/constants');

describe('chartFilter.js', () => {
    it('update', () => {
        chartFilter.update({ start: moment('2020-01-01 10:01:13') });
        let stub = eventSignals.dispatch.withArgs({
            event: "filter.change",
            changed: { start: sinon.match.truthy },
        });
        sinon.assert.calledOnce(stub);
        assert.equal(stub.getCall(0).args[0].changed.start.unix(), moment('2020-01-01 10:01:00').unix());

        eventSignals.dispatch.reset();
        chartFilter.update({ start: moment('2020-01-01 10:01:28') });
        sinon.assert.notCalled(eventSignals.dispatch);

        eventSignals.dispatch.reset();
        chartFilter.update({ end: moment('2020-01-01 10:01:13') });
        stub = eventSignals.dispatch.withArgs({
            event: "filter.change",
            changed: { end: sinon.match.truthy },
        });
        sinon.assert.calledOnce(stub);
        assert.equal(stub.getCall(0).args[0].changed.end.unix(), moment('2020-01-01 10:01:00').unix());

        eventSignals.dispatch.reset();
        chartFilter.update({ end: moment('2020-01-01 10:01:28') });
        sinon.assert.notCalled(eventSignals.dispatch);

        eventSignals.dispatch.reset();
        chartFilter.update({ start: moment('2020-01-01 10:01:30'), end: moment('2020-01-01 10:01:55') });
        sinon.assert.notCalled(eventSignals.dispatch);

        eventSignals.dispatch.reset();
        chartFilter.update({ start: moment('2020-01-01 10:02:30'), end: moment('2020-01-01 10:04:55') });
        stub = eventSignals.dispatch.withArgs({
            event: "filter.change",
            changed: {
                start: sinon.match.truthy,
                end: sinon.match.truthy,
            },
        });
        sinon.assert.calledOnce(stub);
        assert.equal(stub.getCall(0).args[0].changed.start.unix(), moment('2020-01-01 10:02:00').unix());
        assert.equal(stub.getCall(0).args[0].changed.end.unix(), moment('2020-01-01 10:04:00').unix());

        eventSignals.dispatch.reset();
        chartFilter.update({
            intervalLevel: constants.BUCKET_HOUR,
            start: moment('2020-01-01 10:02:30'),
            end: moment('2020-01-01 10:04:55')
        });
        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
            event: "filter.change",
            changed: { intervalLevel: constants.BUCKET_HOUR },
        }));


        eventSignals.dispatch.reset();
        chartFilter.update({
            intervalLevel: constants.BUCKET_HOUR,
            start: moment('2020-01-01 10:02:32'),
            end: moment('2020-01-01 10:05:00')
        });
        stub = eventSignals.dispatch.withArgs({
            event: "filter.change",
            changed: {
                end: sinon.match.truthy,
            },
        });
        sinon.assert.calledOnce(stub);
        assert.equal(stub.getCall(0).args[0].changed.end.unix(), moment('2020-01-01 10:05:00').unix());


        eventSignals.dispatch.reset();
        chartFilter.update({
            searchValue: 'aAa',
        });
        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
            event: "filter.change",
            changed: { filter: chartFilter.getUserFilter() },
        }));

        eventSignals.dispatch.reset();
        chartFilter.update({
            searchValue: 'AAA',
        });
        sinon.assert.notCalled(eventSignals.dispatch);
    });

});