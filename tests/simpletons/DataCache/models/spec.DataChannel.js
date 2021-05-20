const { assert } = require('chai');
const sinon = require('sinon');

const testUtils = require('../../../testUtils');
const constants = require('../../../../js/helpers/constants');
const Ban = require('../../../../js/models/events/Ban');
const Chat = require('../../../../js/models/events/Chat');
const Cheer = require('../../../../js/models/events/Cheer');
const DataChannel = require('../../../../js/simpletons/dataCache/models/DataChannel');
const DataNode = require('../../../../js/simpletons/dataCache/models/DataNode');
const chartFilter = require('../../../../js/events/shared/chartFilter');
const userFilter = chartFilter.getUserFilter();

describe('DataChannel.js', () => {
    beforeEach(() => {
        reset();
    });

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
            dataChannel._updated = new Set([0, 360, 3720]);
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

            dataChannel._validateCache()

            assert.deepEqual([...dataChannel._updated], []);
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    600: 'another'
                },
                [constants.BUCKET_HOUR]: {
                    7200: 'caboose'
                }
            });
        });
    });

    describe('get', () => {
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

            const res = dataChannel.get(300, 360, userFilter);

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
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(300).returns(new DataNode(1, { a: 1 }));
            const _getAt2 = _getAt.withArgs(360).returns(new DataNode(1, { a: 1 }));
            const _getAt3 = _getAt.withArgs(420).returns(new DataNode(1, { a: 1 }));

            const res = dataChannel.get(300, 480, userFilter);

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
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(300).returns(new DataNode(1, { a: 1 }));
            const _getAt2 = _getAt.withArgs(360).returns(new DataNode(1, { a: 1 }));
            const _getAt3 = _getAt.withArgs(420).returns(new DataNode(1, { a: 1 }));
            const _getAt4 = _getAt.withArgs(480).returns(new DataNode(1, { a: 1 }));
            const _getAt5 = _getAt.withArgs(540).returns(new DataNode(1, { a: 1 }));

            const res = dataChannel.get(300, 600, userFilter);

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
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt');

            const res = dataChannel.get(300, 600, userFilter);

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
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(240).returns(new DataNode(1, { a: 1 }));
            const _getAt2 = _getAt.withArgs(600).returns(new DataNode(1, { a: 1 }));
            const _getAt3 = _getAt.withArgs(660).returns(new DataNode(1, { a: 1 }));

            const res = dataChannel.get(240, 720, userFilter);

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
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(240).returns(new DataNode(1, { a: 1 }));
            const _getAt2 = _getAt.withArgs(600).returns(new DataNode(1, { a: 1 }));
            const _getAt3 = _getAt.withArgs(660).returns(new DataNode(1, { a: 1 }));
            const _getAt4 = _getAt.withArgs(720).returns(new DataNode(1, { a: 1 }));
            const _getAt5 = _getAt.withArgs(780).returns(new DataNode(1, { a: 1 }));
            const _getAt6 = _getAt.withArgs(840).returns(new DataNode(1, { a: 1 }));
            const _getAt7 = _getAt.withArgs(1200).returns(new DataNode(1, { a: 1 }));
            const _getAt8 = _getAt.withArgs(1260).returns(new DataNode(1, { a: 1 }));

            const res = dataChannel.get(240, 1320, userFilter);

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

        it('60 mins with mixed in', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(200, { a: 200 }),
                    900: new DataNode(10, { a: 10 }),
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return new DataNode(1, { a: 1 });
            });

            const res = dataChannel.get(0, 3600, userFilter);

            sinon.assert.callCount(_getAt, 50);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                _sum: 260,
                _users: { a: 260 }
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    0: { _sum: 5, _users: { a: 5 } },
                    300: { _sum: 200, _users: { a: 200 } },
                    600: { _sum: 5, _users: { a: 5 } },
                    900: { _sum: 10, _users: { a: 10 } },
                    1200: { _sum: 5, _users: { a: 5 } },
                    1500: { _sum: 5, _users: { a: 5 } },
                    1800: { _sum: 5, _users: { a: 5 } },
                    2100: { _sum: 5, _users: { a: 5 } },
                    2400: { _sum: 5, _users: { a: 5 } },
                    2700: { _sum: 5, _users: { a: 5 } },
                    3000: { _sum: 5, _users: { a: 5 } },
                    3300: { _sum: 5, _users: { a: 5 } },
                },
                [constants.BUCKET_HOUR]: {
                    0: { _sum: 260, _users: { a: 260 } }
                },
            });
        });

        it('60 mins with 1 hour cache', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(200, { a: 200 }),
                    900: new DataNode(10, { a: 10 }),
                },
                [constants.BUCKET_HOUR]: {
                    0: new DataNode(65, { a: 65 }),
                },
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return new DataNode(1, { a: 1 });
            });

            const res = dataChannel.get(0, 3600, userFilter);

            sinon.assert.callCount(_getAt, 0);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                _sum: 65,
                _users: { a: 65 }
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: { _sum: 200, _users: { a: 200 } },
                    900: { _sum: 10, _users: { a: 10 } }
                },
                [constants.BUCKET_HOUR]: {
                    0: { _sum: 65, _users: { a: 65 } }
                },
            });
        });

        it('67 mins with mixed cache', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(200, { a: 200 }),
                    900: new DataNode(10, { a: 10 }),
                    3900: new DataNode(11, { b: 11 }),
                },
                [constants.BUCKET_HOUR]: {
                    0: new DataNode(65, { a: 65 }),
                },
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return new DataNode(1, { a: 1 });
            });

            const res = dataChannel.get(0, 4020, userFilter);

            sinon.assert.callCount(_getAt, 7);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                _sum: 72,
                _users: { a: 72 }
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(200, { a: 200 }),
                    900: new DataNode(10, { a: 10 }),
                    3600: new DataNode(5, { a: 5 }),
                    3900: new DataNode(11, { b: 11 }),
                },
                [constants.BUCKET_HOUR]: {
                    0: { _sum: 65, _users: { a: 65 } }
                },
            });
        });


        it('127 mins with mixed cache', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(200, { a: 200 }),
                    900: new DataNode(10, { a: 10 }),
                    3900: new DataNode(11, { b: 11 }),
                },
                [constants.BUCKET_HOUR]: {
                    0: new DataNode(65, { a: 65 }),
                },
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return new DataNode(1, { a: 1 });
            });

            const res = dataChannel.get(0, 7620, userFilter);

            sinon.assert.callCount(_getAt, 62);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                _sum: 138,
                _users: { a: 127, b: 11 }
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: new DataNode(200, { a: 200 }),
                    900: new DataNode(10, { a: 10 }),
                    3600: new DataNode(5, { a: 5 }),
                    3900: new DataNode(11, { b: 11 }),
                    4200: new DataNode(5, { a: 5 }),
                    4500: new DataNode(5, { a: 5 }),
                    4800: new DataNode(5, { a: 5 }),
                    5100: new DataNode(5, { a: 5 }),
                    5400: new DataNode(5, { a: 5 }),
                    5700: new DataNode(5, { a: 5 }),
                    6000: new DataNode(5, { a: 5 }),
                    6300: new DataNode(5, { a: 5 }),
                    6600: new DataNode(5, { a: 5 }),
                    6900: new DataNode(5, { a: 5 }),
                    7200: new DataNode(5, { a: 5 }),
                },
                [constants.BUCKET_HOUR]: {
                    0: new DataNode(65, { a: 65 }),
                    3600: new DataNode(66, { a: 55, b: 11 }),
                },
            });
        });
    });
});
