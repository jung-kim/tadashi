const sinon = require('sinon');
const { assert } = require('chai');

const chatsByUsersVC = require('../../../../js/events/stream/charts/chatsByUsersVC');
const constants = require('../../../../js/helpers/constants');
const dataCache = require('../../../../js/simpletons/dataCache');
const testUtils = require('../../../testUtils');
const users = require('../../../../js/singletons/users');


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
            merge(undefined, testUtils.getTestDataBucket(2, 'c')).
            merge(undefined, testUtils.getTestDataBucket(1, 'b'))

        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, 1577902020 + 60, undefined).
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
            userObject: users,
        });

        datBucket.merge(undefined, testUtils.getTestDataBucket(1, 'c')).
            merge(undefined, testUtils.getTestDataBucket(5, 'd')).
            merge(undefined, testUtils.getTestDataBucket(9, 'e')).
            merge(undefined, testUtils.getTestDataBucket(1, 'f')).
            merge(undefined, testUtils.getTestDataBucket(10, 'g')).
            merge(undefined, testUtils.getTestDataBucket(7, 'h')).
            merge(undefined, testUtils.getTestDataBucket(4, 'i')).
            merge(undefined, testUtils.getTestDataBucket(4, 'j')).
            merge(undefined, testUtils.getTestDataBucket(8, 'k')).
            merge(undefined, testUtils.getTestDataBucket(2, 'l')).
            merge(undefined, testUtils.getTestDataBucket(7, 'm')).
            merge(undefined, testUtils.getTestDataBucket(7, 'o'));
        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, 1577902020 + 60, undefined).
            returns(datBucket);
        await chatsByUsersVC._update();
        assert.deepEqual(chatsByUsersVC._getDataset()[0].data, [10, 9, 8, 7, 7, 7, 5, 4, 4, 3]);
        assert.deepEqual(chatsByUsersVC._getRootLabels(), ['g', 'e', 'k', 'h', 'm', 'o', 'd', 'i', 'j', 'c']);
    });

});