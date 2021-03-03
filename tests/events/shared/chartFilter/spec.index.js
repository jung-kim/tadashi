const { assert } = require('chai');
const moment = require('../../../../js/helpers/moment');
const sinon = require('sinon');

const chartFilter = require('../../../../js/events/shared/chartFilter');
const signals = require('../../../../js/helpers/signals').signals;
const constants = require('../../../../js/helpers/constants');

describe('chartFilter.js', () => {
    it('update', () => {
        chartFilter.update({ start: moment('2020-01-01 10:01:13') });
        let stub = signals.dispatch.withArgs({
            event: "filter.change",
            changed: { start: sinon.match.truthy },
        });
        sinon.assert.calledOnce(stub);
        assert.equal(stub.getCall(0).args[0].changed.start.unix(), moment('2020-01-01 10:01:00').unix());

        signals.dispatch.reset();
        chartFilter.update({ start: moment('2020-01-01 10:01:28') });
        sinon.assert.notCalled(signals.dispatch);

        signals.dispatch.reset();
        chartFilter.update({ end: moment('2020-01-01 10:01:13') });
        stub = signals.dispatch.withArgs({
            event: "filter.change",
            changed: { end: sinon.match.truthy },
        });
        sinon.assert.calledOnce(stub);
        assert.equal(stub.getCall(0).args[0].changed.end.unix(), moment('2020-01-01 10:01:00').unix());

        signals.dispatch.reset();
        chartFilter.update({ end: moment('2020-01-01 10:01:28') });
        sinon.assert.notCalled(signals.dispatch);

        signals.dispatch.reset();
        chartFilter.update({ start: moment('2020-01-01 10:01:30'), end: moment('2020-01-01 10:01:55') });
        sinon.assert.notCalled(signals.dispatch);

        signals.dispatch.reset();
        chartFilter.update({ start: moment('2020-01-01 10:02:30'), end: moment('2020-01-01 10:04:55') });
        stub = signals.dispatch.withArgs({
            event: "filter.change",
            changed: {
                start: sinon.match.truthy,
                end: sinon.match.truthy,
            },
        });
        sinon.assert.calledOnce(stub);
        assert.equal(stub.getCall(0).args[0].changed.start.unix(), moment('2020-01-01 10:02:00').unix());
        assert.equal(stub.getCall(0).args[0].changed.end.unix(), moment('2020-01-01 10:04:00').unix());

        signals.dispatch.reset();
        chartFilter.update({
            intervalLevel: constants.BUCKET_HOUR,
            start: moment('2020-01-01 10:02:30'),
            end: moment('2020-01-01 10:04:55')
        });
        sinon.assert.calledOnce(signals.dispatch.withArgs({
            event: "filter.change",
            changed: { intervalLevel: constants.BUCKET_HOUR },
        }));


        signals.dispatch.reset();
        chartFilter.update({
            intervalLevel: constants.BUCKET_HOUR,
            start: moment('2020-01-01 10:02:32'),
            end: moment('2020-01-01 10:05:00')
        });
        stub = signals.dispatch.withArgs({
            event: "filter.change",
            changed: {
                end: sinon.match.truthy,
            },
        });
        sinon.assert.calledOnce(stub);
        assert.equal(stub.getCall(0).args[0].changed.end.unix(), moment('2020-01-01 10:05:00').unix());


        signals.dispatch.reset();
        chartFilter.update({
            searchValue: 'aAa',
        });
        sinon.assert.calledOnce(signals.dispatch.withArgs({
            event: "filter.change",
            changed: { filter: chartFilter.getUserFilter() },
        }));

        signals.dispatch.reset();
        chartFilter.update({
            searchValue: 'AAA',
        });
        sinon.assert.notCalled(signals.dispatch);
    });

});