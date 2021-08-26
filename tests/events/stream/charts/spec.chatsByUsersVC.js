const sinon = require('sinon');
const { assert } = require('chai');

const chatsByUsersVC = require('../../../../js/events/stream/charts/chatsByUsersVC');
const constants = require('../../../../js/helpers/constants');
const dataCache = require('../../../../js/singletons/dataCache');
const testUtils = require('../../../testUtils');


describe('chatsByUsersVC.js', () => {
    beforeEach(() => {
        testUtils.reset();
    });

    it('_update', async () => {
        sinon.stub(chatsByUsersVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            searchValue: undefined,
            startBucket: 1577901600,
        });

        const datBucket = testUtils.getTestDataBucket(2, 'a').
            merge(testUtils.getTestDataBucket(2, 'c')).
            merge(testUtils.getTestDataBucket(1, 'b'));

        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, 1577902020 + 60).
            returns(datBucket);
        document.getElementById.withArgs(chatsByUsersVC._chartDomSelector).returns({});
        chatsByUsersVC.reset();

        await chatsByUsersVC._update();
        assert.deepEqual(chatsByUsersVC._getDataset()[0].data, [2, 2, 1]);
        assert.deepEqual(chatsByUsersVC._getRootLabels(), ['a', 'c', 'b']);

        sinon.verifyAndRestore();
        sinon.stub(chatsByUsersVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            searchValue: undefined,
            startBucket: 1577901600,
        });

        datBucket.merge(testUtils.getTestDataBucket(1, 'c')).
            merge(testUtils.getTestDataBucket(5, 'd')).
            merge(testUtils.getTestDataBucket(9, 'e')).
            merge(testUtils.getTestDataBucket(1, 'f')).
            merge(testUtils.getTestDataBucket(10, 'g')).
            merge(testUtils.getTestDataBucket(7, 'h')).
            merge(testUtils.getTestDataBucket(4, 'i')).
            merge(testUtils.getTestDataBucket(4, 'j')).
            merge(testUtils.getTestDataBucket(8, 'k')).
            merge(testUtils.getTestDataBucket(2, 'l')).
            merge(testUtils.getTestDataBucket(7, 'm')).
            merge(testUtils.getTestDataBucket(7, 'o'));
        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, 1577902020 + 60).
            returns(datBucket);
        await chatsByUsersVC._update();
        assert.deepEqual(chatsByUsersVC._getDataset()[0].data, [10, 9, 8, 7, 7, 7, 5, 4, 4, 3]);
        assert.deepEqual(chatsByUsersVC._getRootLabels(), ['g', 'e', 'k', 'h', 'm', 'o', 'd', 'i', 'j', 'c']);
    });

});