const { assert } = require('chai');
const sinon = require('sinon');

const testUtils = require('../../../testUtils');
const constants = require('../../../../js/helpers/constants');
const Ban = require('../../../../js/models/events/Ban');
const Chat = require('../../../../js/models/events/Chat');
const Cheer = require('../../../../js/models/events/Cheer');
const DataChannel = require('../../../../js/singletons/dataCache/models/DataChannel');
const DataNode = require('../../../../js/singletons/dataCache/models/DataNode');
const filter = require('../../../../js/singletons/filter');

describe('DataChannel.js', () => {
    beforeEach(() => {
        testUtils.reset();
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

    it('_getFiveMinRange', () => {
        const dataChannel = new DataChannel();
        const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
            return testUtils.getTestDataBucket();
        })
        dataChannel._cache[constants.BUCKET_FIVE][300] = testUtils.getTestDataBucket(10);

        const res = dataChannel.get(300, 660);

        sinon.assert.calledOnce(_getAt);
        assert.deepEqual(res, testUtils.getTestDataBucket(11));
    });

    it('_getHourRange', () => {
        const dataChannel = new DataChannel();
        const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
            return testUtils.getTestDataBucket();
        })
        dataChannel._cache[constants.BUCKET_FIVE][300] = testUtils.getTestDataBucket(10);
        dataChannel._cache[constants.BUCKET_FIVE][3600] = testUtils.getTestDataBucket(10);
        dataChannel._cache[constants.BUCKET_HOUR][0] = testUtils.getTestDataBucket(10);

        const res = dataChannel.get(0, 3960);

        sinon.assert.calledOnce(_getAt);
        assert.deepEqual(res, testUtils.getTestDataBucket(21));
    });

    describe('get', () => {

        it('single minute no filter', () => {
            const dataChannel = new DataChannel();
            // below cache should not be utilized
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(300).returns(testUtils.getTestDataBucket());

            const res = dataChannel.get(300, 360);

            sinon.assert.calledOnce(_getAt);
            sinon.assert.calledOnce(_getAt1);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, testUtils.getTestDataBucket(1));
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
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
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return testUtils.getTestDataBucket(1);
            });

            const res = dataChannel.get(300, 600);

            sinon.assert.callCount(_getAt, 5);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, testUtils.getTestDataBucket(5));
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(5)
                },
                [constants.BUCKET_HOUR]: {},
            });
        });

        it('five minute with cache hit', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt');

            const res = dataChannel.get(300, 600);

            sinon.assert.notCalled(_getAt);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, testUtils.getTestDataBucket(99));
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99),
                },
                [constants.BUCKET_HOUR]: {},
            });
        });

        it('eight minute with some chunk changes at the start and end', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return testUtils.getTestDataBucket();
            });

            const res = dataChannel.get(240, 720);

            sinon.assert.calledThrice(_getAt);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, testUtils.getTestDataBucket(102));
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
                },
                [constants.BUCKET_HOUR]: {},
            });
        });


        it('18 minute with cache hit and misses', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(200),
                    900: testUtils.getTestDataBucket(10),
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return testUtils.getTestDataBucket();
            });

            const res = dataChannel.get(240, 1320);

            sinon.assert.callCount(_getAt, 8);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, testUtils.getTestDataBucket(218));
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(200),
                    600: testUtils.getTestDataBucket(5),
                    900: testUtils.getTestDataBucket(10)
                },
                [constants.BUCKET_HOUR]: {},
            });
        });

        it('60 mins with mixed in', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(200),
                    900: testUtils.getTestDataBucket(10),
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return testUtils.getTestDataBucket(1)
            });

            const res = dataChannel.get(0, 3600);

            sinon.assert.callCount(_getAt, 50);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, testUtils.getTestDataBucket(260));
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    0: testUtils.getTestDataBucket(5),
                    300: testUtils.getTestDataBucket(200),
                    600: testUtils.getTestDataBucket(5),
                    900: testUtils.getTestDataBucket(10),
                    1200: testUtils.getTestDataBucket(5),
                    1500: testUtils.getTestDataBucket(5),
                    1800: testUtils.getTestDataBucket(5),
                    2100: testUtils.getTestDataBucket(5),
                    2400: testUtils.getTestDataBucket(5),
                    2700: testUtils.getTestDataBucket(5),
                    3000: testUtils.getTestDataBucket(5),
                    3300: testUtils.getTestDataBucket(5),
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(260),
                },
            });
        });

        it('60 mins with 1 hour cache', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(200),
                    900: testUtils.getTestDataBucket(10),
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(65),
                },
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return testUtils.getTestDataBucket()
            });

            const res = dataChannel.get(0, 3600);

            sinon.assert.callCount(_getAt, 0);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, testUtils.getTestDataBucket(65));
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(200),
                    900: testUtils.getTestDataBucket(10),
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(65),
                },
            });
        });

        it('67 mins with mixed cache', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(200),
                    900: testUtils.getTestDataBucket(10),
                    3900: testUtils.getTestDataBucket(11),
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(65),
                },
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return testUtils.getTestDataBucket()
            });

            const res = dataChannel.get(0, 4020);

            sinon.assert.callCount(_getAt, 7);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, testUtils.getTestDataBucket(72));
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(200),
                    900: testUtils.getTestDataBucket(10),
                    3600: testUtils.getTestDataBucket(5),
                    3900: testUtils.getTestDataBucket(11),
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(65),
                },
            });
        });


        it('127 mins with mixed cache', () => {
            const dataChannel = new DataChannel();
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(200),
                    900: testUtils.getTestDataBucket(10),
                    3900: testUtils.getTestDataBucket(11),
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(65),
                },
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return testUtils.getTestDataBucket()
            });

            const res = dataChannel.get(0, 7620);

            sinon.assert.callCount(_getAt, 62);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, testUtils.getTestDataBucket(138),);
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(200),
                    900: testUtils.getTestDataBucket(10),
                    3600: testUtils.getTestDataBucket(5),
                    3900: testUtils.getTestDataBucket(11),
                    4200: testUtils.getTestDataBucket(5),
                    4500: testUtils.getTestDataBucket(5),
                    4800: testUtils.getTestDataBucket(5),
                    5100: testUtils.getTestDataBucket(5),
                    5400: testUtils.getTestDataBucket(5),
                    5700: testUtils.getTestDataBucket(5),
                    6000: testUtils.getTestDataBucket(5),
                    6300: testUtils.getTestDataBucket(5),
                    6600: testUtils.getTestDataBucket(5),
                    6900: testUtils.getTestDataBucket(5),
                    7200: testUtils.getTestDataBucket(5),
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(65),
                    3600: testUtils.getTestDataBucket(66),
                },
            });
        });

        it('three minute with filter', () => {
            const dataChannel = new DataChannel();
            // below cache should not be utilized
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt');
            const _getAt1 = _getAt.withArgs(300).returns(testUtils.getTestDataBucket(1));
            const _getAt2 = _getAt.withArgs(360).returns(testUtils.getTestDataBucket(1));
            const _getAt3 = _getAt.withArgs(420).returns(testUtils.getTestDataBucket(1));

            filter.setSearchString('a');
            const res = dataChannel.get(300, 480);

            sinon.assert.calledThrice(_getAt);
            sinon.assert.calledOnce(_getAt1);
            sinon.assert.calledOnce(_getAt2);
            sinon.assert.calledOnce(_getAt3);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: new DataNode(3, { a: 3 }),
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
                },
                [constants.BUCKET_HOUR]: {},
            });
        });

        it('eight minute with filter', () => {
            const dataChannel = new DataChannel();
            // below cache should not be utilized
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
                },
                [constants.BUCKET_HOUR]: {},
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return testUtils.getTestDataBucket();
            });

            filter.setSearchString('a');
            const res = dataChannel.get(240, 720);

            sinon.assert.calledThrice(_getAt);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: new DataNode(102, { a: 102 }),
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
                },
                [constants.BUCKET_HOUR]: {},
            });
        });

        it('62 minute with filter', () => {
            const dataChannel = new DataChannel();
            // below cache should not be utilized
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(10)
                },
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return testUtils.getTestDataBucket();
            });

            filter.setSearchString('a');
            const res = dataChannel.get(0, 3720);

            sinon.assert.calledTwice(_getAt);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: new DataNode(12, { a: 12 }),
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99)
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(10)
                },
            });
        });

        it('66 minute with filter', () => {
            const dataChannel = new DataChannel();
            // below cache should not be utilized
            dataChannel._cache = {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99),
                    3600: testUtils.getTestDataBucket(5)
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(10)
                },
            }
            const _validateCache = sinon.stub(dataChannel, '_validateCache').withArgs();
            const _getAt = sinon.stub(dataChannel, '_getAt').callsFake(() => {
                return testUtils.getTestDataBucket();
            });

            filter.setSearchString('c');
            const res = dataChannel.get(0, 3960);

            sinon.assert.calledOnce(_getAt);
            sinon.assert.calledOnce(_validateCache);
            assert.deepEqual(res, {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHEER]: new DataNode(16, { c: 16 }),
            });
            assert.deepEqual(dataChannel._cache, {
                [constants.BUCKET_FIVE]: {
                    300: testUtils.getTestDataBucket(99),
                    3600: testUtils.getTestDataBucket(5)
                },
                [constants.BUCKET_HOUR]: {
                    0: testUtils.getTestDataBucket(10)
                },
            });
        });
    });
});
