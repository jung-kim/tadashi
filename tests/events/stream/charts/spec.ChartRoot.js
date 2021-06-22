const moment = require('../../../../js/helpers/moment');
const { assert } = require('chai');
const sinon = require('sinon')

const chartFilter = require('../../../../js/events/shared/chartFilter');
const constants = require('../../../../js/helpers/constants');
const ChartRoot = require('../../../../js/events/stream/charts/ChartRoot');
const env = require('../../../../js/env');

describe('ChartRoot.js', () => {
    afterEach(() => {
        reset();
    });

    it('_getParameters()', () => {
        const chartRoot = new ChartRoot({});
        env.channel = 'abc';

        chartFilter._start = moment('2020-01-01 10:00');
        chartFilter._end = moment('2020-01-01 10:07');
        chartFilter._intervalLevel = constants.BUCKET_MIN;

        assert.deepEqual(chartRoot._getParameters(), {
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            filter: chartFilter.getUserFilter(),
            startBucket: 1577901600,
        });
        assert.equal((1577902020 - 1577901600) % constants.BUCKET_MIN, 0);

        chartFilter._start = moment('2020-01-01 10:00');
        chartFilter._end = moment('2020-01-01 10:07');
        chartFilter._intervalLevel = constants.BUCKET_FIVE;

        assert.deepEqual(chartRoot._getParameters(), {
            channel: 'abc',
            endBucket: 1577901900,
            interval: constants.BUCKET_FIVE,
            length: 2,
            filter: chartFilter.getUserFilter(),
            startBucket: 1577901600,
        });
        assert.equal((1577901900 - 1577901600) % constants.BUCKET_FIVE, 0);

        chartFilter._start = moment('2020-01-01 10:00');
        chartFilter._end = moment('2020-01-02 10:07');
        chartFilter._intervalLevel = constants.BUCKET_MIN;

        assert.deepEqual(chartRoot._getParameters(), {
            channel: 'abc',
            endBucket: 1577988000,
            interval: constants.BUCKET_HOUR,
            length: 25,
            filter: chartFilter.getUserFilter(),
            startBucket: 1577901600,
        });
        assert.equal((1577988000 - 1577901600) % constants.BUCKET_HOUR, 0);

        // hopefully no body will do searchs like this one....
        chartFilter._start = moment('2020-01-01 10:00');
        chartFilter._end = moment('2026-01-02 10:07');
        chartFilter._intervalLevel = constants.BUCKET_DAY;

        assert.deepEqual(chartRoot._getParameters(), {
            channel: 'abc',
            endBucket: 1767340800,
            interval: constants.BUCKET_DAY,
            length: 2194,
            filter: chartFilter.getUserFilter(),
            startBucket: 1577865600,
        });
    });

    describe('_eventSignalsFunc', () => {
        it('channel.input.update', () => {
            const chartRoot = new ChartRoot({});
            const reset = sinon.stub(chartRoot, 'reset');
            chartRoot._eventSignalsFunc({ event: 'channel.input.update' });
            sinon.assert.calledOnce(reset);
        });

        it('stream.load.ready', () => {
            const chartRoot = new ChartRoot({});
            const reset = sinon.stub(chartRoot, 'reset');
            chartRoot._eventSignalsFunc({ event: 'stream.load.ready' });
            sinon.assert.calledOnce(reset);
            assert.isTrue(chartRoot._enabled)
        });

        it('stream.cleanup', () => {
            const chartRoot = new ChartRoot({});
            chartRoot._eventSignalsFunc({ event: 'stream.cleanup' });
            assert.isFalse(chartRoot._enabled)
        });

        it('data.cache.updated', () => {
            const chartRoot = new ChartRoot({});
            const update = sinon.stub(chartRoot, 'update');

            chartRoot._enabled = true;
            chartRoot._eventSignalsFunc({ event: 'data.cache.updated' });
            chartRoot._enabled = false;
            chartRoot._eventSignalsFunc({ event: 'data.cache.updated' });
            sinon.assert.calledOnce(update);
        });

        it('filter.change', () => {
            const chartRoot = new ChartRoot({});
            const update = sinon.stub(chartRoot, 'update');

            chartRoot._enabled = true;
            chartRoot._eventSignalsFunc({ event: 'filter.change' });
            chartRoot._enabled = false;
            chartRoot._eventSignalsFunc({ event: 'filter.change' });
            sinon.assert.calledOnce(update);
        });
    });

    describe('_initializedChartObject', () => {
        it('_chartObject is undefined', () => {
            const chartRoot = new ChartRoot({ chartDomSelector: 'something' });

            const dom = {};
            document.getElementById.withArgs('something').returns(dom);
            chartRoot._initializedChartObject();

            assert.isString(dom.innerHTML);
            assert.isObject(chartRoot._helpDom);
            assert.isObject(chartRoot._chartObject);
        });

        it('_chartObject already initialized', () => {
            const chartRoot = new ChartRoot({ chartDomSelector: 'something' });
            const destroy = sinon.stub();
            chartRoot._chartObject = { destroy: destroy };

            const dom = {};
            document.getElementById.withArgs('something').returns(dom);
            chartRoot._initializedChartObject();

            sinon.assert.calledOnce(destroy);
            assert.isString(dom.innerHTML);
            assert.isObject(chartRoot._helpDom);
            assert.isObject(chartRoot._chartObject);
        });
    });

    it('update', async () => {
        const chartRoot = new ChartRoot({ chartDomSelector: 'something' });

        const update = sinon.stub(chartRoot, '_update');
        chartRoot._chartObject = { update: sinon.stub() };

        await chartRoot.update();

        sinon.assert.calledOnce(chartRoot._chartObject.update);
        sinon.assert.calledOnce(update);
    });
});