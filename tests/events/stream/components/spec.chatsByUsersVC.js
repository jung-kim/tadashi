const sinon = require('sinon');
const { assert } = require('chai');

const chatsByUsersVC = require('../../../../js/events/stream/components/chatsByUsersVC');
const constants = require('../../../../js/helpers/constants');
const dataCache = require('../../../../js/simpletons/dataCache');


describe('chatsByUsersVC.js', () => {
    afterEach(() => {
        reset();
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
        sinon.stub(dataCache, 'getTotal')
            .withArgs('abc', 1577901600, 1577902020, constants.TYPE_CHAT, undefined)
            .returns({
                _sum: 5,
                _users: {
                    'a': 2,
                    'b': 1,
                    'c': 2,
                }
            });
        const datasets = [{
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1,
        }];
        const labels = [];
        sinon.stub(chatsByUsersVC, '_getDataset').returns(datasets);
        sinon.stub(chatsByUsersVC, '_getRootLabels').returns(labels);

        await chatsByUsersVC._update();
        assert.deepEqual(datasets[0].data, [2, 2, 1]);
        assert.deepEqual(labels, ['a', 'c', 'b']);

        sinon.verifyAndRestore();
        sinon.stub(chatsByUsersVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            searchValue: undefined,
            startBucket: 1577901600,
        });
        sinon.stub(dataCache, 'getTotal')
            .withArgs('abc', 1577901600, 1577902020, constants.TYPE_CHAT, undefined)
            .returns({
                _sum: 5,
                _users: {
                    'a': 2,
                    'b': 1,
                    'c': 2,
                    'd': 5,
                    'e': 9,
                    'f': 1,
                    'g': 10,
                    'h': 7,
                    'i': 4,
                    'j': 4,
                    'k': 8,
                    'l': 2,
                    'm': 7,
                    'o': 7,
                }
            });
        sinon.stub(chatsByUsersVC, '_getDataset').returns(datasets);
        sinon.stub(chatsByUsersVC, '_getRootLabels').returns(labels);
        await chatsByUsersVC._update();
        assert.deepEqual(datasets[0].data, [10, 9, 8, 7, 7, 7, 5, 4, 4, 2]);
        assert.deepEqual(labels, ['g', 'e', 'k', 'h', 'm', 'o', 'd', 'i', 'j', 'a']);
    });

});