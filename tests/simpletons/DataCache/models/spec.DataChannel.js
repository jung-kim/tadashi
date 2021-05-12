const { assert } = require('chai');
const sinon = require('sinon');

const testUtils = require('../../../testUtils');
const constants = require('../../../../js/helpers/constants');
const Ban = require('../../../../js/models/events/Ban');
const Chat = require('../../../../js/models/events/Chat');
const Cheer = require('../../../../js/models/events/Cheer');
const DataChannel = require('../../../../js/simpletons/dataCache/models/DataChannel');
const DataNode = require('../../../../js/simpletons/dataCache/models/DataNode');

describe('DataChannel.js', () => {

    it('add()', () => {
        const dataChannel = new DataChannel();

        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 10000 }));
        assert.deepEqual(dataChannel._data, {
            0: {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: {
                    _sum: 1,
                    _users: { 'a': 1 },
                },
            }
        });
        assert.deepEqual([...dataChannel._updated], [0]);

        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 50000 }));
        assert.deepEqual(dataChannel._data, {
            0: {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: {
                    _sum: 2,
                    _users: { 'a': 2 },
                },
            }
        });
        assert.deepEqual([...dataChannel._updated], [0]);


        dataChannel.add(new Cheer({ displayName: 'a', userID: 1, bits: 300, timestamp: 60000 }));
        assert.deepEqual(dataChannel._data, {
            0: {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: {
                    _sum: 2,
                    _users: { 'a': 2 },
                },
            },
            60: {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHEER]: {
                    _sum: 3,
                    _users: { 'a': 3 },
                },
            },
        });
        assert.deepEqual([...dataChannel._updated], [0]);


        dataChannel.add(new Ban({ displayName: 'a', userID: 1, timestamp: 65000 }));
        assert.deepEqual(dataChannel._data, {
            0: {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: {
                    _sum: 2,
                    _users: { 'a': 2 },
                },
            },
            60: {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHEER]: {
                    _sum: 3,
                    _users: { 'a': 3 },
                },
                [constants.TYPE_BAN]: {
                    _sum: 1,
                    _users: { 'a': 1 },
                },
            },
        });
        assert.deepEqual([...dataChannel._updated], [0]);

        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 365000 }));
        assert.deepEqual(dataChannel._data, {
            0: {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: {
                    _sum: 2,
                    _users: { 'a': 2 },
                },
            },
            60: {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHEER]: {
                    _sum: 3,
                    _users: { 'a': 3 },
                },
                [constants.TYPE_BAN]: {
                    _sum: 1,
                    _users: { 'a': 1 },
                },
            },

            360: {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: {
                    _sum: 1,
                    _users: { 'a': 1 },
                },
            },
        });
        assert.deepEqual([...dataChannel._updated], [0, 300]);
    });

    it('_getAt()', () => {
        const dataChannel = new DataChannel();

        assert.deepEqual(dataChannel._getAt(0), testUtils.blankAggsBucketToCompare);

        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 10000 }));
        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 10000 }));
        dataChannel.add(new Cheer({ displayName: 'a', userID: 1, bits: 300, timestamp: 60000 }));
        dataChannel.add(new Ban({ displayName: 'a', userID: 1, timestamp: 65000 }));

        assert.deepEqual(dataChannel._getAt(0), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 2,
                _users: { 'a': 2 },
            },
        });

        assert.deepEqual(dataChannel._getAt(10), testUtils.blankAggsBucketToCompare);


        assert.deepEqual(dataChannel._getAt(60), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHEER]: {
                _sum: 3,
                _users: { 'a': 3 },
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });
    });

    describe('_validateCache', () => {
        it('with _cachedSearchString is not changed', () => {
            const dataChannel = new DataChannel();
            dataChannel._cachedSearchString = 'abc';
            dataChannel._updated = new Set([0, 300]);
            dataChannel._cache = {
                300: 'something',
                600: 'another'
            }

            dataChannel._validateCache('abc')

            assert.deepEqual([...dataChannel._updated], []);
            assert.deepEqual(dataChannel._cache, {
                600: 'another'
            });
        });

        it('with _cachedSearchString changed', () => {
            const dataChannel = new DataChannel();
            dataChannel._cachedSearchString = '';
            dataChannel._updated = new Set([0, 300]);
            dataChannel._cache = {
                300: 'something',
                600: 'another'
            }

            dataChannel._validateCache('abc')

            assert.deepEqual([...dataChannel._updated], []);
            assert.deepEqual(dataChannel._cache, {});
        });
    });

    it('_getRange', () => {
        const dataChannel = new DataChannel();
        const _getAt = sinon.stub(dataChannel, '_getAt');
        const _getAt1 = _getAt.withArgs(300, 'a-filter').returns(new DataNode(1, { a: 1 }));
        const _getAt2 = _getAt.withArgs(360, 'a-filter').returns(new DataNode(2, { a: 2 }));
        const _getAt3 = _getAt.withArgs(420, 'a-filter').returns(new DataNode(4, { a: 1, b: 3 }));

        const res = dataChannel._getRange(300, 480, 'a-filter');

        sinon.assert.calledOnce(_getAt1);
        sinon.assert.calledOnce(_getAt2);
        sinon.assert.calledOnce(_getAt3);

        assert.deepEqual(res, {
            _sum: 7,
            _users: {
                a: 4,
                b: 3,
            }
        });
    });

});
