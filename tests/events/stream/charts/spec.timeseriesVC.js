const sinon = require('sinon');
const { assert } = require('chai');
const moment = require('../../../../js/helpers/moment');

const constants = require('../../../../js/helpers/constants');
const dataCache = require('../../../../js/simpletons/dataCache');
const timeseriesVC = require('../../../../js/events/stream/charts/timeseriesVC');
const chartFilter = require('../../../../js/events/shared/chartFilter');

const getDummyData = ((sum, users) => {
    return {
        [constants.TYPE_CHAT]: { _sum: sum, _users: users },
        [constants.TYPE_RESUB]: { _sum: sum, _users: users },
        [constants.TYPE_CHEER]: { _sum: sum, _users: users },
        [constants.TYPE_SUB]: { _sum: sum, _users: users },
        [constants.TYPE_BAN]: { _sum: sum, _users: users },
        [constants.TYPE_ANONGIFT]: { _sum: sum, _users: users },
        [constants.TYPE_SUBGIFT]: { _sum: sum, _users: users },
        [constants.TYPE_SUBMYSTERY]: { _sum: sum, _users: users },
    }
});

describe('timeseriesVC.js', () => {
    beforeEach(() => {
        document.getElementById.withArgs(timeseriesVC._chartDomSelector).returns({});
        timeseriesVC.reset();
    });
    afterEach(() => {
        reset();
    });

    it('_update', async () => {
        sinon.stub(timeseriesVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            searchValue: undefined,
            startBucket: 1577901600,
        });
        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, constants.BUCKET_MIN, undefined).
            returns(getDummyData(1, { 'a': 1 })).
            withArgs('abc', 1577901660, constants.BUCKET_MIN, undefined).
            returns(getDummyData(2, { 'b': 2 })).
            withArgs('abc', 1577901720, constants.BUCKET_MIN, undefined).
            returns(getDummyData(3, { 'c': 3 })).
            withArgs('abc', 1577901780, constants.BUCKET_MIN, undefined).
            returns(getDummyData(4, { 'e': 4 })).
            withArgs('abc', 1577901840, constants.BUCKET_MIN, undefined).
            returns(getDummyData(5, { 'e': 5 })).
            withArgs('abc', 1577901900, constants.BUCKET_MIN, undefined).
            returns(getDummyData(6, { 'c': 6 })).
            withArgs('abc', 1577901960, constants.BUCKET_MIN, undefined).
            returns(getDummyData(7, { 'c': 7 })).
            withArgs('abc', 1577902020, constants.BUCKET_MIN, undefined).
            returns(getDummyData(16, { 'a': 8, 'd': 8 }));

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
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { a: 8, d: 8 }]
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
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { a: 8, d: 8 }]
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
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { a: 8, d: 8 }]
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
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { a: 8, d: 8 }]
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
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { a: 8, d: 8 }]
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
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { a: 8, d: 8 }]
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
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { a: 8, d: 8 }]
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
                users: [{ a: 1 }, { b: 2 }, { c: 3 }, { e: 4 }, { e: 5 }, { c: 6 }, { c: 7 }, { a: 8, d: 8 }]
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
            searchValue: undefined,
            startBucket: 1577901600,
        });
        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, constants.BUCKET_MIN, undefined).
            returns(getDummyData(1, { 'a': 1 })).
            withArgs('abc', 1577901660, constants.BUCKET_MIN, undefined).
            returns(getDummyData(2, { 'b': 2 })).
            withArgs('abc', 1577901720, constants.BUCKET_MIN, undefined).
            returns(getDummyData(3, { 'c': 3 })).
            withArgs('abc', 1577901780, constants.BUCKET_MIN, undefined).
            returns(getDummyData(4, { 'e': 4 }))

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