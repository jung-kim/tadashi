const moment = require('../../../../js/helpers/moment');
const { assert } = require('chai');
const sinon = require('sinon')

const chartFilter = require('../../../../js/events/shared/chartFilter');
const constants = require('../../../../js/helpers/constants');
const ChartRoot = require('../../../../js/events/stream/components/ChartRoot');
const twitchClient = require('../../../../js/singletons/twitchClient');

describe('ChartRoot.js', () => {
    afterEach(() => {
        reset();
    });

    it('_getParameters()', () => {
        const chartRoot = new ChartRoot({});
        sinon.stub(twitchClient, 'getChannel').returns('abc');

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

    it('enable/disable', () => {
        const chartRoot = new ChartRoot({});
        chartRoot.enable();
        assert.isTrue(chartRoot._enabled);

        chartRoot.disable();
        assert.isFalse(chartRoot._enabled);
    });

    it('_getBackgroundColor', () => {
        const chartRoot = new ChartRoot({});
        chartRoot._labels = ['a', 'b'];

        assert.deepEqual(chartRoot._getBackgroundColor(), ['#E6EE9C4D', '#FFCC804D']);
    });


    it('_getBorderColor', () => {
        const chartRoot = new ChartRoot({});
        chartRoot._labels = ['a', 'b'];

        assert.deepEqual(chartRoot._getBorderColor(), ['#E6EE9CFF', '#FFCC80FF']);
    });

    describe('_updateChartObject', () => {
        it('_chartObject initialized', () => {
            const chartRoot = new ChartRoot({});
            chartRoot._datasets = [5, 6];
            chartRoot._labels = ['a', 'b'];
            chartRoot._chartObject = {
                data: {
                    labels: [],
                    datasets: [{}]
                },
                update: sinon.stub()
            }

            chartRoot._updateChartObject();

            assert.deepEqual(chartRoot._chartObject.data.labels, ['a', 'b']);
            assert.deepEqual(chartRoot._chartObject.data.datasets[0].backgroundColor, ['#E6EE9C4D', '#FFCC804D']);
            assert.deepEqual(chartRoot._chartObject.data.datasets[0].borderColor, ['#E6EE9CFF', '#FFCC80FF']);
            assert.deepEqual(chartRoot._chartObject.data.datasets[0].data, [5, 6]);

            sinon.assert.calledOnce(chartRoot._chartObject.update);
        });

        it('_chartObject is not initialized', () => {
            const chartRoot = new ChartRoot({ type: 'horizontalBar', chartDomSelector: 'dom-selector' });
            chartRoot._datasets = [5, 6];
            chartRoot._labels = ['a', 'b'];

            document.getElementById.reset();
            document.getElementById = sinon.stub().withArgs(sinon.match.any).returns({ a: 1 })
            chartRoot._updateChartObject();

            assert.equal(chartRoot._chartObject.type, 'bar');
            assert.deepEqual(chartRoot._chartObject.data, {
                labels: ['a', 'b'],
                datasets: [{
                    backgroundColor: [
                        "#E6EE9C4D",
                        "#FFCC804D",
                    ],
                    borderColor: [
                        "#E6EE9CFF",
                        "#FFCC80FF",
                    ],
                    borderWidth: 1,
                    data: [
                        5,
                        6
                    ],
                    indexAxis: 'y'
                }],
            });
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
            const enable = sinon.stub(chartRoot, 'enable');
            const _updateChartObject = sinon.stub(chartRoot, '_updateChartObject');
            chartRoot._eventSignalsFunc({ event: 'stream.load.ready' });
            sinon.assert.calledOnce(reset);
            sinon.assert.calledOnce(enable);
            sinon.assert.calledOnce(_updateChartObject);
        });

        it('stream.cleanup', () => {
            const chartRoot = new ChartRoot({});
            const disable = sinon.stub(chartRoot, 'disable');
            chartRoot._eventSignalsFunc({ event: 'stream.cleanup' });
            sinon.assert.calledOnce(disable);
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
});