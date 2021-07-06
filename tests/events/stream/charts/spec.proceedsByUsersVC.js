const sinon = require('sinon');
const { assert } = require('chai');

const constants = require('../../../../js/helpers/constants');
const dataCache = require('../../../../js/simpletons/dataCache');
const proceedsByUsersVC = require('../../../../js/events/stream/charts/proceedsByUsersVC');
const testUtils = require('../../../testUtils');

describe('proceedsByUsersVC.js', () => {
    beforeEach(() => {
        testUtils.reset();
    });

    it('_update()', async () => {
        sinon.stub(proceedsByUsersVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            searchValue: undefined,
            startBucket: 1577901600,
        });
        const dataBucket = testUtils.getTestDataBucket(1, 'a').
            merge(undefined, testUtils.getTestDataBucket(3, 'b')).
            merge(undefined, testUtils.getTestDataBucket(6, 'c')).
            merge(undefined, testUtils.getTestDataBucket(6, 'd')).
            merge(undefined, testUtils.getTestDataBucket(5, 'e')).
            merge(undefined, testUtils.getTestDataBucket(9, 'f')).
            merge(undefined, testUtils.getTestDataBucket(8, 'g')).
            merge(undefined, testUtils.getTestDataBucket(2, 'h')).
            merge(undefined, testUtils.getTestDataBucket(1, 'i')).
            merge(undefined, testUtils.getTestDataBucket(1, 'j')).
            merge(undefined, testUtils.getTestDataBucket(3, 'k')).
            merge(undefined, testUtils.getTestDataBucket(5, 'l'))
        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, 1577902020 + 60, undefined).
            returns(dataBucket);

        document.getElementById.withArgs(proceedsByUsersVC._chartDomSelector).returns({});
        proceedsByUsersVC.reset();
        await proceedsByUsersVC._update();

        assert.deepEqual(proceedsByUsersVC._getRootLabels(), ['f', 'g', 'c', 'd', 'e', 'l', 'b', 'k', 'h', 'a']);
        assert.deepEqual(proceedsByUsersVC._getDataset()[0].data, [45, 40, 30, 30, 25, 25, 15, 15, 10, 5]);
        assert.deepEqual(proceedsByUsersVC._sumByType, [
            { '1': 9, '2': 9, '3': 9, '6': 9, '7': 9 },
            { '1': 8, '2': 8, '3': 8, '6': 8, '7': 8 },
            { '1': 6, '2': 6, '3': 6, '6': 6, '7': 6 },
            { '1': 6, '2': 6, '3': 6, '6': 6, '7': 6 },
            { '1': 5, '2': 5, '3': 5, '6': 5, '7': 5 },
            { '1': 5, '2': 5, '3': 5, '6': 5, '7': 5 },
            { '1': 3, '2': 3, '3': 3, '6': 3, '7': 3 },
            { '1': 3, '2': 3, '3': 3, '6': 3, '7': 3 },
            { '1': 2, '2': 2, '3': 2, '6': 2, '7': 2 },
            { '1': 1, '2': 1, '3': 1, '6': 1, '7': 1 }
        ]);
    });

    it('afterLabel()', () => {
        sinon.stub(proceedsByUsersVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            searchValue: undefined,
            startBucket: 1577901600,
        });

        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, 1577902020, undefined).
            returns(testUtils.getTestDataBucket(1, 'a').
                merge(undefined, testUtils.getTestDataBucket(3, 'b')).
                merge(undefined, testUtils.getTestDataBucket(6, 'c')).
                merge(undefined, testUtils.getTestDataBucket(6, 'd')).
                merge(undefined, testUtils.getTestDataBucket(5, 'e')).
                merge(undefined, testUtils.getTestDataBucket(9, 'f')).
                merge(undefined, testUtils.getTestDataBucket(8, 'g')).
                merge(undefined, testUtils.getTestDataBucket(2, 'h')).
                merge(undefined, testUtils.getTestDataBucket(1, 'i')).
                merge(undefined, testUtils.getTestDataBucket(1, 'j')).
                merge(undefined, testUtils.getTestDataBucket(3, 'k')).
                merge(undefined, testUtils.getTestDataBucket(5, 'l')));

        assert.deepEqual(proceedsByUsersVC._afterLabel('a'), [
            "  re-subscription: 1",
            "  cheer: 100",
            "  subscription: 1",
            "  subscription gift: 1",
            "  subscription mystery: 1"
        ]);

        assert.deepEqual(proceedsByUsersVC._afterLabel('aaa'), []);
    });
});
