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
            dataChannel._updated = new Set([0, 300, 7200]);
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: 'something',
                    600: 'another'
                },
                [constants.BUCKET_HOUR]: {
                    3600: 'texas',
                    7200: 'caboose'
                }
            }

            dataChannel._validateCache('abc')

            assert.deepEqual([...dataChannel._updated], []);
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    600: 'another'
                },
                [constants.BUCKET_HOUR]: {
                    3600: 'texas',
                }
            });
        });

        it('with _cachedSearchString changed', () => {
            const dataChannel = new DataChannel();
            dataChannel._cachedSearchString = '';
            dataChannel._updated = new Set([0, 300]);
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: 'something',
                    600: 'another'
                },
                [constants.BUCKET_HOUR]: {
                    3600: 'texas',
                    7200: 'caboose'
                }
            }

            dataChannel._validateCache('abc')

            assert.deepEqual([...dataChannel._updated], []);
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {},
                [constants.BUCKET_HOUR]: {}
            });
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

    describe('getAt', () => {
        it('single minute no filter', () => {
            const dataChannel = new DataChannel();
            // below cache should not be utilized
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(99, { a: 99 })
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(300).returns(new DataNode(1, { a: 1 }));

            const res = dataChannel.getAt(300, 360, { _searchString: undefined });

            sinon.assert.calledOnce(_getAt);
            sinon.assert.calledOnce(_getAt1);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                _sum: 1,
                _users: { a: 1 }
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: { _sum: 99, _users: { a: 99 } }
                },
                [constants.BUCKET_HOUR]: {},
            });
        });

        it('three minute with filter', () => {
            const dataChannel = new DataChannel();
            // below cache should not be utilized
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(99, { a: 99 })
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs('abc');
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(300).returns(new DataNode(1, { a: 1 }));
            const _getAt2 = _getAt.withArgs(360).returns(new DataNode(1, { a: 1 }));
            const _getAt3 = _getAt.withArgs(420).returns(new DataNode(1, { a: 1 }));

            const res = dataChannel.getAt(300, 480, { _searchString: 'abc' });

            sinon.assert.calledThrice(_getAt);
            sinon.assert.calledOnce(_getAt1);
            sinon.assert.calledOnce(_getAt2);
            sinon.assert.calledOnce(_getAt3);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                _sum: 3,
                _users: { a: 3 }
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: { _sum: 99, _users: { a: 99 } }
                },
                [constants.BUCKET_HOUR]: {},
            });
        });

        it('five minute without cache hit', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {},
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs('abc');
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(300).returns(new DataNode(1, { a: 1 }));
            const _getAt2 = _getAt.withArgs(360).returns(new DataNode(1, { a: 1 }));
            const _getAt3 = _getAt.withArgs(420).returns(new DataNode(1, { a: 1 }));
            const _getAt4 = _getAt.withArgs(480).returns(new DataNode(1, { a: 1 }));
            const _getAt5 = _getAt.withArgs(540).returns(new DataNode(1, { a: 1 }));

            const res = dataChannel.getAt(300, 600, { _searchString: 'abc' });

            sinon.assert.callCount(_getAt, 5);
            sinon.assert.calledOnce(_getAt1);
            sinon.assert.calledOnce(_getAt2);
            sinon.assert.calledOnce(_getAt3);
            sinon.assert.calledOnce(_getAt4);
            sinon.assert.calledOnce(_getAt5);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                _sum: 5,
                _users: { a: 5 }
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: { _sum: 5, _users: { a: 5 } }
                },
                [constants.BUCKET_HOUR]: {},
            });
        });

        it('five minute with cache hit', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(99, { a: 99 })
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs('abc');
            const _getAt = sinon.stub(dataChannel, '_getAt');

            const res = dataChannel.getAt(300, 600, { _searchString: 'abc' });

            sinon.assert.notCalled(_getAt);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                _sum: 99,
                _users: { a: 99 }
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: { _sum: 99, _users: { a: 99 } }
                },
                [constants.BUCKET_HOUR]: {},
            });
        });

        it('eight minute with some chunk changes at the start and end', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(99, { a: 99 })
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs('abc');
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(240).returns(new DataNode(1, { a: 1 }));
            const _getAt2 = _getAt.withArgs(600).returns(new DataNode(1, { a: 1 }));
            const _getAt3 = _getAt.withArgs(660).returns(new DataNode(1, { a: 1 }));

            const res = dataChannel.getAt(240, 720, { _searchString: 'abc' });

            sinon.assert.calledThrice(_getAt);
            sinon.assert.calledOnce(_getAt1);
            sinon.assert.calledOnce(_getAt2);
            sinon.assert.calledOnce(_getAt3);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                _sum: 102,
                _users: { a: 102 }
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: { _sum: 99, _users: { a: 99 } }
                },
                [constants.BUCKET_HOUR]: {},
            });
        });


        it('18 minute with cache hit and misses', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(200, { a: 200 }),
                    900: new DataNode(10, { a: 10 }),
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs('abc');
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(240).returns(new DataNode(1, { a: 1 }));
            const _getAt2 = _getAt.withArgs(600).returns(new DataNode(1, { a: 1 }));
            const _getAt3 = _getAt.withArgs(660).returns(new DataNode(1, { a: 1 }));
            const _getAt4 = _getAt.withArgs(720).returns(new DataNode(1, { a: 1 }));
            const _getAt5 = _getAt.withArgs(780).returns(new DataNode(1, { a: 1 }));
            const _getAt6 = _getAt.withArgs(840).returns(new DataNode(1, { a: 1 }));
            const _getAt7 = _getAt.withArgs(1200).returns(new DataNode(1, { a: 1 }));
            const _getAt8 = _getAt.withArgs(1260).returns(new DataNode(1, { a: 1 }));

            const res = dataChannel.getAt(240, 1320, { _searchString: 'abc' });

            sinon.assert.callCount(_getAt, 8);
            sinon.assert.calledOnce(_getAt1);
            sinon.assert.calledOnce(_getAt2);
            sinon.assert.calledOnce(_getAt3);
            sinon.assert.calledOnce(_getAt4);
            sinon.assert.calledOnce(_getAt5);
            sinon.assert.calledOnce(_getAt6);
            sinon.assert.calledOnce(_getAt7);
            sinon.assert.calledOnce(_getAt8);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                _sum: 218,
                _users: { a: 218 }
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: { _sum: 200, _users: { a: 200 } },
                    600: { _sum: 5, _users: { a: 5 } },
                    900: { _sum: 10, _users: { a: 10 } }
                },
                [constants.BUCKET_HOUR]: {},
            });
        });
    });
});
