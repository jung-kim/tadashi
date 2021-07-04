const sinon = require('sinon');
const { assert } = require('chai');
const moment = require('../../../../js/helpers/moment');

const constants = require('../../../../js/helpers/constants');
const dataCache = require('../../../../js/simpletons/dataCache');
const timeseriesVC = require('../../../../js/events/stream/charts/timeseriesVC');
const chartFilter = require('../../../../js/events/shared/chartFilter');

describe('timeseriesVC.js', () => {
    beforeEach(() => {
        document.getElementById.withArgs(timeseriesVC._chartDomSelector).returns({});
        timeseriesVC.reset();
    });
    beforeEach(() => {
        reset();
    });

    it('_update', async () => {
        sinon.stub(timeseriesVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            startBucket: 1577901600,
            filter: chartFilter
        });
        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, 1577901660, chartFilter).
            returns(getTestDataBucket(1, 'a')).
            withArgs('abc', 1577901660, 1577901720, chartFilter).
            returns(getTestDataBucket(2, 'b')).
            withArgs('abc', 1577901720, 1577901780, chartFilter).
            returns(getTestDataBucket(3, 'c')).
            withArgs('abc', 1577901780, 1577901840, chartFilter).
            returns(getTestDataBucket(4, 'e')).
            withArgs('abc', 1577901840, 1577901900, chartFilter).
            returns(getTestDataBucket(5, 'e')).
            withArgs('abc', 1577901900, 1577901960, chartFilter).
            returns(getTestDataBucket(6, 'c')).
            withArgs('abc', 1577901960, 1577902020, chartFilter).
            returns(getTestDataBucket(7, 'c')).
            withArgs('abc', 1577902020, 1577902080, chartFilter).
            returns(getTestDataBucket(16, 'b'));

        await timeseriesVC._update();

        assert.deepEqual(timeseriesVC._getDataset(), [
            {
                label: 'chat',
                backgroundColor: 'rgb(255, 255, 0, 0.3)',
                borderColor: 'rgb(255, 255, 0, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                    5, 6, 7, 16
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { b: 16 }]
            },
            {
                label: 're-subscription',
                backgroundColor: 'rgb(153, 255, 51, 0.3)',
                borderColor: 'rgb(153, 255, 51, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                    5, 6, 7, 16
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { b: 16 }]
            },
            {
                label: 'cheer',
                backgroundColor: 'rgb(51, 255, 255, 0.3)',
                borderColor: 'rgb(51, 255, 255, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                    5, 6, 7, 16
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { b: 16 }]
            },
            {
                label: 'subscription',
                backgroundColor: 'rgb(0, 128, 225, 0.3)',
                borderColor: 'rgb(0, 128, 225, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                    5, 6, 7, 16
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { b: 16 }]
            },
            {
                label: 'ban',
                backgroundColor: 'rgb(255, 51, 153, 0.3)',
                borderColor: 'rgb(255, 51, 153, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                    5, 6, 7, 16
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { b: 16 }]
            },
            {
                label: 'anonymous gift',
                backgroundColor: 'rgb(102, 0, 204, 0.3)',
                borderColor: 'rgb(102, 0, 204, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                    5, 6, 7, 16
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { b: 16 }]
            },
            {
                label: 'subscription gift',
                backgroundColor: 'rgb(255, 128, 0, 0.3)',
                borderColor: 'rgb(255, 128, 0, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                    5, 6, 7, 16
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { b: 16 }]
            },
            {
                label: 'subscription mystery',
                backgroundColor: 'rgb(128, 128, 128, 0.3)',
                borderColor: 'rgb(128, 128, 128, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                    5, 6, 7, 16
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { b: 16 }]
            },
            {
                label: 'timeout',
                backgroundColor: 'rgb(0, 225, 139, 0.3)',
                borderColor: 'rgb(0, 225, 139, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                    5, 6, 7, 16
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { b: 16 }]
            }
        ]);
        assert.deepEqual(timeseriesVC._getRootLabels().map(t => t.unix()),
            [1577901600, 1577901660, 1577901720, 1577901780, 1577901840, 1577901900, 1577901960, 1577902020]);


        sinon.verifyAndRestore();

        sinon.stub(timeseriesVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577901780,
            interval: constants.BUCKET_MIN,
            length: 4,
            filter: chartFilter,
            startBucket: 1577901600,
        });
        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, 1577901660, chartFilter).
            returns(getTestDataBucket(1, 'a')).
            withArgs('abc', 1577901660, 1577901720, chartFilter).
            returns(getTestDataBucket(2, 'b')).
            withArgs('abc', 1577901720, 1577901780, chartFilter).
            returns(getTestDataBucket(3, 'c')).
            withArgs('abc', 1577901780, 1577901840, chartFilter).
            returns(getTestDataBucket(4, 'e'));

        await timeseriesVC._update();

        assert.deepEqual(timeseriesVC._getDataset(), [
            {
                label: 'chat',
                backgroundColor: 'rgb(255, 255, 0, 0.3)',
                borderColor: 'rgb(255, 255, 0, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }]
            },
            {
                label: 're-subscription',
                backgroundColor: 'rgb(153, 255, 51, 0.3)',
                borderColor: 'rgb(153, 255, 51, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }]
            },
            {
                label: 'cheer',
                backgroundColor: 'rgb(51, 255, 255, 0.3)',
                borderColor: 'rgb(51, 255, 255, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }]
            },
            {
                label: 'subscription',
                backgroundColor: 'rgb(0, 128, 225, 0.3)',
                borderColor: 'rgb(0, 128, 225, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }]
            },
            {
                label: 'ban',
                backgroundColor: 'rgb(255, 51, 153, 0.3)',
                borderColor: 'rgb(255, 51, 153, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }]
            },
            {
                label: 'anonymous gift',
                backgroundColor: 'rgb(102, 0, 204, 0.3)',
                borderColor: 'rgb(102, 0, 204, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }]
            },
            {
                label: 'subscription gift',
                backgroundColor: 'rgb(255, 128, 0, 0.3)',
                borderColor: 'rgb(255, 128, 0, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }]
            },
            {
                label: 'subscription mystery',
                backgroundColor: 'rgb(128, 128, 128, 0.3)',
                borderColor: 'rgb(128, 128, 128, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }]
            },
            {
                label: 'timeout',
                backgroundColor: 'rgb(0, 225, 139, 0.3)',
                borderColor: 'rgb(0, 225, 139, 1.0)',
                borderWidth: 1,
                data: [
                    1, 2, 3, 4,
                ],
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }]
            }
        ]);
        assert.deepEqual(timeseriesVC._getRootLabels().map(t => t.unix()),
            [1577901600, 1577901660, 1577901720, 1577901780]);
    });

    it('_toolTipAfterLabel', () => {
        assert.isUndefined(timeseriesVC._toolTipAfterLabel());

        assert.isUndefined(timeseriesVC._toolTipAfterLabel({ yLabel: 0 }));

        chartFilter.getUserFilter().changeSearchString();
        assert.isUndefined(timeseriesVC._toolTipAfterLabel({ yLabel: 1 }));

        chartFilter.getUserFilter().changeSearchString('aa');
        sinon.stub(timeseriesVC, '_getDataset').returns({
            1: { users: [{}, {}, {}, { 'aaa': 4, 'caaa': 5 }, {}] }
        });
        assert.deepEqual(timeseriesVC._toolTipAfterLabel({ yLabel: 1, datasetIndex: 1, dataIndex: 3 }), [
            `  aaa: 4`,
            `  caaa: 5`
        ]);
    });

    it('_toolTipLabel', () => {
        assert.equal(timeseriesVC._toolTipLabel({
            dataIndex: 1,
            dataset: {
                label: 'chat',
                data: [undefined, 2],
            }
        }), `chat: 2`);
    });

    it('_toolTipTitle', () => {
        assert.isUndefined(timeseriesVC._toolTipTitle(), undefined);
        timeseriesVC._chartLabels = [undefined, moment('2021-01-01 10:00')];
        sinon.stub(timeseriesVC, '_getRootLabels').returns([undefined, moment('2021-01-01 10:00')]);
        assert.equal(timeseriesVC._toolTipTitle([{ dataIndex: 1 }]), '2021/01/01 10:00');
    });

    it('_toolTipFilter', () => {
        assert.isUndefined(timeseriesVC._toolTipFilter());
        assert.isTrue(timeseriesVC._toolTipFilter({ formattedValue: 'something' }));
    });

    it('_scaleTicksFontStyle', () => {
        sinon.stub(chartFilter, 'getIntervalLevel').returns('something wrong');
        assert.isUndefined(timeseriesVC._scaleTicksFontStyle());

        sinon.verifyAndRestore();
        sinon.stub(chartFilter, 'getIntervalLevel').returns(constants.BUCKET_DAY);
        assert.equal(timeseriesVC._scaleTicksFontStyle({ tick: { value: { days: () => 1 } } }), 'bold');
        assert.isUndefined(timeseriesVC._scaleTicksFontStyle({ tick: { value: { days: () => 2 } } }));


        sinon.verifyAndRestore();
        sinon.stub(chartFilter, 'getIntervalLevel').returns(constants.BUCKET_HOUR);
        assert.equal(timeseriesVC._scaleTicksFontStyle({ tick: { value: { hours: () => 0 } } }), 'bold');
        assert.isUndefined(timeseriesVC._scaleTicksFontStyle({ tick: { value: { hours: () => 2 } } }));


        sinon.verifyAndRestore();
        sinon.stub(chartFilter, 'getIntervalLevel').returns(constants.BUCKET_FIVE);
        assert.equal(timeseriesVC._scaleTicksFontStyle({ tick: { value: { minutes: () => 0 } } }), 'bold');
        assert.isUndefined(timeseriesVC._scaleTicksFontStyle({ tick: { value: { minutes: () => 2 } } }));


        sinon.verifyAndRestore();
        sinon.stub(chartFilter, 'getIntervalLevel').returns(constants.BUCKET_MIN);
        assert.equal(timeseriesVC._scaleTicksFontStyle({ tick: { value: { minutes: () => 10 } } }), 'bold');
        assert.isUndefined(timeseriesVC._scaleTicksFontStyle({ tick: { value: { minutes: () => 2 } } }));
    });

    it('_scaleTicksCallback', () => {
        sinon.stub(chartFilter, 'getIntervalLevel').returns(constants.BUCKET_MIN);
        sinon.stub(timeseriesVC, '_getRootLabels').returns([moment('2021-01-01 00:00')]);
        assert.equal(timeseriesVC._scaleTicksCallback(0), '1/1');

        sinon.verifyAndRestore();
        sinon.stub(chartFilter, 'getIntervalLevel').returns(constants.BUCKET_MIN);
        sinon.stub(timeseriesVC, '_getRootLabels').returns([moment('2021-01-01 10:00')]);
        assert.equal(timeseriesVC._scaleTicksCallback(0), '10:00');

        sinon.verifyAndRestore();
        sinon.stub(chartFilter, 'getIntervalLevel').returns(constants.BUCKET_DAY);
        sinon.stub(timeseriesVC, '_getRootLabels').returns([moment('2021-01-01 10:00')]);
        assert.equal(timeseriesVC._scaleTicksCallback(0), '1/1');
    });
});