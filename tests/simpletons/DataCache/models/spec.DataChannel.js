const { assert } = require('chai');

const testUtils = require('../../../testUtils');
const constants = require('../../../../js/helpers/constants');
const Ban = require('../../../../js/models/events/Ban');
const Chat = require('../../../../js/models/events/Chat');
const Cheer = require('../../../../js/models/events/Cheer');
const DataChannel = require('../../../../js/simpletons/dataCache/models/DataChannel');
const Filter = require('../../../../js/events/shared/chartFilter/Filter');

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
        assert.deepEqual([...dataChannel._updated], [0, 60]);


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
        assert.deepEqual([...dataChannel._updated], [0, 60]);
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

    it('_getAnInterval', () => {
        const dataChannel = new DataChannel();

        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_MIN, undefined), testUtils.blankAggsBucketToCompare);

        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 10000 }));
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(60, constants.BUCKET_MIN, undefined), testUtils.blankAggsBucketToCompare);
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_FIVE, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });

        dataChannel.add(new Chat({ displayName: 'b', userID: 1, timestamp: 60000 }));
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(60, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'b': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_FIVE, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 2,
                _users: { 'a': 1, 'b': 1 },
            },
        });

        dataChannel.add(new Ban({ displayName: 'a', userID: 1, timestamp: 360000 }));
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(60, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'b': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_FIVE, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 2,
                _users: { 'a': 1, 'b': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(300, constants.BUCKET_FIVE, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_HOUR, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 2,
                _users: { 'a': 1, 'b': 1 },
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });

        // with searches now
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_MIN, new Filter('a')), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_MIN, new Filter('b')), {
            ...testUtils.blankAggsBucketToCompare,
        });
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_FIVE, new Filter('a')), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_FIVE, new Filter('b')), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'b': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_HOUR, new Filter('a')), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });
        assert.deepEqual(dataChannel._getAnInterval(0, constants.BUCKET_HOUR, new Filter('b')), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'b': 1 },
            },
        });
    });

    it('_validateCache()', () => {
        const dataChannel = new DataChannel();

        dataChannel._validateCache(constants.BUCKET_MIN, undefined);
        assert.equal(dataChannel._cachedInterval, constants.BUCKET_MIN);
        assert.equal(dataChannel._cachedFilter, undefined);
        assert.deepEqual([...dataChannel._updated], []);
        assert.deepEqual(dataChannel._cache, {});

        dataChannel._updated = new Set([120, 180]);
        dataChannel._cache = {
            60: 1,
            120: 2,
            180: 3,
            240: 4,
        }
        dataChannel._validateCache(constants.BUCKET_MIN, undefined);
        assert.equal(dataChannel._cachedInterval, constants.BUCKET_MIN);
        assert.equal(dataChannel._cachedFilter, undefined);
        assert.deepEqual([...dataChannel._updated], []);
        assert.deepEqual(dataChannel._cache, { 60: 1, 240: 4 });

        dataChannel._updated = new Set([120, 180]);
        dataChannel._cache = {
            0: 0,
            300: 1,
            600: 2,
        }
        dataChannel._validateCache(constants.BUCKET_FIVE, undefined);
        assert.equal(dataChannel._cachedInterval, constants.BUCKET_FIVE);
        assert.equal(dataChannel._cachedFilter, undefined);
        assert.deepEqual([...dataChannel._updated], []);
        assert.deepEqual(dataChannel._cache, {});

        dataChannel._updated = new Set([120, 180]);
        dataChannel._cache = {
            0: 0,
            300: 1,
            600: 2,
        }
        dataChannel._validateCache(constants.BUCKET_FIVE, undefined);
        assert.equal(dataChannel._cachedInterval, constants.BUCKET_FIVE);
        assert.equal(dataChannel._cachedFilter, undefined);
        assert.deepEqual([...dataChannel._updated], []);
        assert.deepEqual(dataChannel._cache, { 300: 1, 600: 2 });


        dataChannel._updated = new Set([120, 180]);
        dataChannel._cache = {
            0: 0,
            300: 1,
            600: 2,
        }
        const filter = new Filter('a');
        dataChannel._validateCache(constants.BUCKET_FIVE, filter);
        assert.equal(dataChannel._cachedInterval, constants.BUCKET_FIVE);
        assert.equal(dataChannel._cachedFilter, filter);
        assert.deepEqual([...dataChannel._updated], []);
        assert.deepEqual(dataChannel._cache, {});


        dataChannel._cacheTotalByHour[3600] = 'abc'
        dataChannel._validateCache(constants.BUCKET_FIVE, filter);
        assert.deepEqual(dataChannel._cacheTotalByHour, {
            3600: 'abc'
        });

        dataChannel._updated.add(3660)
        dataChannel._validateCache(constants.BUCKET_FIVE, filter);
        assert.deepEqual(dataChannel._cacheTotalByHour, {});

        // _cachedFilter is `'a' here
        dataChannel._cacheTotalByHour[3600] = 'abc';
        dataChannel._validateCache(constants.BUCKET_FIVE, undefined);
        assert.deepEqual(dataChannel._cacheTotalByHour, {});
    });

    it('get()', () => {
        const dataChannel = new DataChannel();

        assert.deepEqual(dataChannel._getAt(0), testUtils.blankAggsBucketToCompare);

        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 10000 }));
        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 10000 }));
        dataChannel.add(new Chat({ displayName: 'b', userID: 2, timestamp: 10000 }));
        dataChannel.add(new Cheer({ displayName: 'a', userID: 1, bits: 300, timestamp: 60000 }));
        dataChannel.add(new Ban({ displayName: 'a', userID: 1, timestamp: 65000 }));
        dataChannel.add(new Cheer({ displayName: 'b', userID: 1, bits: 200, timestamp: 125000 }));

        assert.deepEqual(dataChannel.get(0, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 3,
                _users: { a: 2, b: 1 }
            }
        });
        assert.deepEqual(dataChannel.get(60, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHEER]: {
                _sum: 3,
                _users: { a: 3 }
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { a: 1 }
            },
        });

        dataChannel.add(new Chat({ displayName: 'b', userID: 2, timestamp: 63000 }));
        assert.deepEqual(dataChannel.get(0, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 3,
                _users: { a: 2, b: 1 }
            }
        });
        assert.deepEqual(dataChannel.get(60, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { b: 1 }
            },
            [constants.TYPE_CHEER]: {
                _sum: 3,
                _users: { a: 3 }
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { a: 1 }
            },
        });
        assert.deepEqual(dataChannel.get(120, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHEER]: {
                _sum: 2,
                _users: { b: 2 }
            },
        });
        assert.deepEqual(dataChannel.get(180, constants.BUCKET_MIN, undefined), {
            ...testUtils.blankAggsBucketToCompare,
        });

        assert.deepEqual(dataChannel.get(0, constants.BUCKET_MIN, new Filter('a')), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 2,
                _users: { a: 2 }
            }
        });
        assert.deepEqual(dataChannel.get(60, constants.BUCKET_MIN, new Filter('a')), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHEER]: {
                _sum: 3,
                _users: { a: 3 }
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { a: 1 }
            },
        });
        assert.deepEqual(dataChannel.get(120, constants.BUCKET_MIN, new Filter('a')), {
            ...testUtils.blankAggsBucketToCompare,
        });
        assert.deepEqual(dataChannel.get(180, constants.BUCKET_MIN, new Filter('a')), {
            ...testUtils.blankAggsBucketToCompare,
        });

        assert.deepEqual(dataChannel.get(0, constants.BUCKET_FIVE, undefined), {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 4,
                _users: { a: 2, b: 2 }
            },
            [constants.TYPE_CHEER]: {
                _sum: 5,
                _users: { a: 3, b: 2 }
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { a: 1 }
            },
        });
        assert.deepEqual(dataChannel.get(300, constants.BUCKET_FIVE, undefined), {
            ...testUtils.blankAggsBucketToCompare,
        });
    });

    it('getTotal()', () => {
        const dataChannel = new DataChannel();

        assert.deepEqual(dataChannel.getTotal(0, 60, constants.TYPE_CHAT, undefined), testUtils.emptyDataNodeToCompare);

        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 10000 }));
        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 0 }));
        dataChannel.add(new Chat({ displayName: 'b', userID: 2, timestamp: 3000 }));
        dataChannel.add(new Chat({ displayName: 'a', userID: 1, timestamp: 70000 }));
        dataChannel.add(new Cheer({ displayName: 'b', bits: 300, userID: 2, timestamp: 65000 }));

        assert.deepEqual(dataChannel.getTotal(0, 0, constants.TYPE_CHAT, undefined), {
            _sum: 3,
            _users: { 'a': 2, 'b': 1 },
        });
        assert.deepEqual(dataChannel.getTotal(0, 0, constants.TYPE_CHEER, undefined), testUtils.emptyDataNodeToCompare);
        assert.deepEqual(dataChannel.getTotal(0, 60, constants.TYPE_CHAT, undefined), {
            _sum: 4,
            _users: { 'a': 3, 'b': 1 },
        });
        assert.deepEqual(dataChannel.getTotal(0, 60, constants.TYPE_CHEER, undefined), {
            _sum: 3,
            _users: { 'b': 3 },
        });
        assert.deepEqual(dataChannel._cacheTotalByHour, {})


        dataChannel._cachedInterval = constants.BUCKET_FIVE
        assert.deepEqual(dataChannel.getTotal(0, 0, constants.TYPE_CHAT, undefined), {
            _sum: 3,
            _users: { 'a': 2, 'b': 1 },
        });
        assert.deepEqual(dataChannel.getTotal(0, 0, constants.TYPE_CHEER, undefined), testUtils.emptyDataNodeToCompare);
        assert.deepEqual(dataChannel.getTotal(0, 60, constants.TYPE_CHAT, undefined), {
            _sum: 4,
            _users: { 'a': 3, 'b': 1 },
        });
        assert.deepEqual(dataChannel.getTotal(0, 60, constants.TYPE_CHEER, undefined), {
            _sum: 3,
            _users: { 'b': 3 },
        });
        assert.deepEqual(dataChannel._cacheTotalByHour, {})


        assert.deepEqual(dataChannel.getTotal(0, 3600, constants.TYPE_CHAT, undefined), {
            _sum: 4,
            _users: { 'a': 3, 'b': 1 },
        });
        assert.deepEqual(dataChannel._cacheTotalByHour[0], {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 4,
                _users: { 'a': 3, 'b': 1 },
            }
        });
        assert.deepEqual(dataChannel.getTotal(0, 3600, constants.TYPE_CHEER, undefined), {
            _sum: 3,
            _users: { 'b': 3 },
        });
        assert.deepEqual(dataChannel._cacheTotalByHour[0], {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 4,
                _users: { 'a': 3, 'b': 1 },
            },
            [constants.TYPE_CHEER]: {
                _sum: 3,
                _users: { 'b': 3 },
            }
        });


        dataChannel.add(new Cheer({ displayName: 'b', bits: 100, userID: 2, timestamp: 65000 }));
        assert.deepEqual(dataChannel.getTotal(0, 3600, constants.TYPE_CHAT, undefined), {
            _sum: 4,
            _users: { 'a': 3, 'b': 1 },
        });
        assert.deepEqual(dataChannel._cacheTotalByHour[0], {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 4,
                _users: { 'a': 3, 'b': 1 },
            }
        });
        assert.deepEqual(dataChannel.getTotal(0, 3600, constants.TYPE_CHEER, undefined), {
            _sum: 4,
            _users: { 'b': 4 },
        });
        assert.deepEqual(dataChannel._cacheTotalByHour[0], {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 4,
                _users: { 'a': 3, 'b': 1 },
            },
            [constants.TYPE_CHEER]: {
                _sum: 4,
                _users: { 'b': 4 },
            }
        });


        // manually manipulate cache
        dataChannel._cacheTotalByHour[0] = {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 5,
                _users: { 'a': 3, 'b': 1, 'c': 1 },
            },
        }
        assert.deepEqual(dataChannel.getTotal(0, 7200, constants.TYPE_CHAT, undefined), {
            _sum: 5,
            _users: { 'a': 3, 'b': 1, 'c': 1 },
        });
        assert.deepEqual(dataChannel._cacheTotalByHour[0], {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 5,
                _users: { 'a': 3, 'b': 1, 'c': 1 },
            }
        });
        assert.deepEqual(dataChannel.getTotal(0, 7200, constants.TYPE_CHEER, undefined), {
            _sum: 4,
            _users: { 'b': 4 },
        });
        assert.deepEqual(dataChannel._cacheTotalByHour[0], {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 5,
                _users: { 'a': 3, 'b': 1, 'c': 1 },
            },
            [constants.TYPE_CHEER]: {
                _sum: 4,
                _users: { 'b': 4 },
            }
        });
    });
});
