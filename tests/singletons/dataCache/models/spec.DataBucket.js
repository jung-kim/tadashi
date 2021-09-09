const { assert } = require('chai');

const testUtils = require('../../../testUtils');
const DataNode = require('../../../../js/singletons/dataCache/models/DataNode');
const DataBucket = require('../../../../js/singletons/dataCache/models/DataBucket');
const Chat = require('../../../../js/models/events/Chat');
const Cheer = require('../../../../js/models/events/Cheer');
const Ban = require('../../../../js/models/events/Ban');
const constants = require('../../../../js/helpers/constants');
const users = require('../../../../js/singletons/users');
const filter = require('../../../../js/singletons/filter');

describe('DataBucket.js', () => {
    beforeEach(() => {
        testUtils.reset();
    });

    it('add()', () => {
        const dataBucket = new DataBucket();

        dataBucket.add(new Chat({ displayName: 'a', userID: 1, timestamp: 1000 }));
        assert.deepEqual(dataBucket, {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 1,
                _users: { 'a': 1 },
            },
        });

        dataBucket.add(new Chat({ displayName: 'a', userID: 1, timestamp: 1000 }));
        assert.deepEqual(dataBucket, {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 2,
                _users: { 'a': 2 },
            },
        });

        dataBucket.add(new Chat({ displayName: 'aa', userID: 1, timestamp: 1000 }));
        assert.deepEqual(dataBucket, {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 3,
                _users: { 'a': 2, 'aa': 1 },
            },
        });

        dataBucket.add(new Ban({ displayName: 'aa', userID: 1, timestamp: 1000 }));
        assert.deepEqual(dataBucket, {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 3,
                _users: { 'a': 2, 'aa': 1 },
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { 'aa': 1 },
            },
        });

        dataBucket.add(new Cheer({ displayName: 'aa', bits: 200, userID: 1, timestamp: 1000 }));
        assert.deepEqual(dataBucket, {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 3,
                _users: { 'a': 2, 'aa': 1 },
            },
            [constants.TYPE_CHEER]: {
                _sum: 2,
                _users: { 'aa': 2 }
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { 'aa': 1 },
            },
        });
    });

    it('getCopy()', () => {
        const dataBucket = new DataBucket();

        dataBucket.add(new Chat({ displayName: 'a', userID: 1, timestamp: 1000 }));
        dataBucket.add(new Chat({ displayName: 'a', userID: 1, timestamp: 1000 }));
        dataBucket.add(new Chat({ displayName: 'aa', userID: 1, timestamp: 1000 }));
        dataBucket.add(new Ban({ displayName: 'aa', userID: 1, timestamp: 1000 }));
        dataBucket.add(new Cheer({ displayName: 'b', bits: 200, userID: 1, timestamp: 1000 }));

        const got = dataBucket.getCopy();
        assert.deepEqual(got, {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 3,
                _users: { 'a': 2, 'aa': 1 },
            },
            [constants.TYPE_CHEER]: {
                _sum: 2,
                _users: { 'b': 2 }
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { 'aa': 1 },
            },
        });

        assert.deepEqual(dataBucket, {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 3,
                _users: { 'a': 2, 'aa': 1 },
            },
            [constants.TYPE_CHEER]: {
                _sum: 2,
                _users: { 'b': 2 }
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { 'aa': 1 },
            },
        });

        dataBucket.add(new Chat({ displayName: 'a', userID: 1, timestamp: 1000 }));
        got.add(new Chat({ displayName: 'aa', userID: 1, timestamp: 1000 }))

        assert.deepEqual(got, {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 4,
                _users: { 'a': 2, 'aa': 2 },
            },
            [constants.TYPE_CHEER]: {
                _sum: 2,
                _users: { 'b': 2 }
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { 'aa': 1 },
            },
        });

        assert.deepEqual(dataBucket, {
            ...testUtils.blankAggsBucketToCompare,
            [constants.TYPE_CHAT]: {
                _sum: 4,
                _users: { 'a': 3, 'aa': 1 },
            },
            [constants.TYPE_CHEER]: {
                _sum: 2,
                _users: { 'b': 2 }
            },
            [constants.TYPE_BAN]: {
                _sum: 1,
                _users: { 'aa': 1 },
            },
        });
    });

    describe('merge', () => {
        it('no filter', () => {
            const node1 = new DataNode();
            node1.add({ displayName: 'a' });

            const node2 = new DataNode();
            node2.add({ displayName: 'a' });
            node2.add({ displayName: 'aa' });

            users._ensureUserExists(1, 'a');
            users._ensureUserExists(11, 'aa');

            const dataBucket1 = new DataBucket({
                [constants.TYPE_CHAT]: node1,
                [constants.TYPE_RESUB]: node1,
                [constants.TYPE_CHEER]: node1,
                [constants.TYPE_SUB]: node1,
                [constants.TYPE_BAN]: node1,
                [constants.TYPE_ANONGIFT]: node1,
                [constants.TYPE_SUBGIFT]: node1,
                [constants.TYPE_SUBMYSTERY]: node1,
                [constants.TYPE_TIMEOUT]: node1,
            });

            const dataBucket2 = new DataBucket({
                [constants.TYPE_CHAT]: node2,
                [constants.TYPE_RESUB]: node2,
                [constants.TYPE_CHEER]: node2,
                [constants.TYPE_SUB]: node2,
                [constants.TYPE_BAN]: node2,
                [constants.TYPE_ANONGIFT]: node2,
                [constants.TYPE_SUBGIFT]: node2,
                [constants.TYPE_SUBMYSTERY]: node2,
                [constants.TYPE_TIMEOUT]: node2,
            });

            dataBucket1.merge(dataBucket2);

            assert.deepEqual(dataBucket1, {
                0: {
                    _sum: 3,
                    _users: { a: 2, aa: 1 }
                },
                1: {
                    _sum: 3,
                    _users: { a: 2, aa: 1 }
                },
                2: {
                    _sum: 3,
                    _users: { a: 2, aa: 1 }
                },
                3: {
                    _sum: 3,
                    _users: { a: 2, aa: 1 }
                },
                4: {
                    _sum: 3,
                    _users: { a: 2, aa: 1 }
                },
                5: {
                    _sum: 3,
                    _users: { a: 2, aa: 1 }
                },
                6: {
                    _sum: 3,
                    _users: { a: 2, aa: 1 }
                },
                7: {
                    _sum: 3,
                    _users: { a: 2, aa: 1 }
                },
                8: {
                    _sum: 3,
                    _users: { a: 2, aa: 1 }
                },
            });


            assert.deepEqual(dataBucket2, {
                0: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                1: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                2: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                3: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                4: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                5: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                6: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                7: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                8: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
            });
        });

        it('with filter', () => {
            filter.setSearchString('aa')
            const node1 = new DataNode();
            node1.add({ displayName: 'a' });

            const node2 = new DataNode();
            node2.add({ displayName: 'a' });
            node2.add({ displayName: 'aa' });

            users._ensureUserExists(1, 'a');
            users._ensureUserExists(11, 'aa');

            const dataBucket1 = new DataBucket({
                [constants.TYPE_CHAT]: node1,
                [constants.TYPE_RESUB]: node1,
                [constants.TYPE_CHEER]: node1,
                [constants.TYPE_SUB]: node1,
                [constants.TYPE_BAN]: node1,
                [constants.TYPE_ANONGIFT]: node1,
                [constants.TYPE_SUBGIFT]: node1,
                [constants.TYPE_SUBMYSTERY]: node1,
                [constants.TYPE_TIMEOUT]: node1,
            });

            const dataBucket2 = new DataBucket({
                [constants.TYPE_CHAT]: node2,
                [constants.TYPE_RESUB]: node2,
                [constants.TYPE_CHEER]: node2,
                [constants.TYPE_SUB]: node2,
                [constants.TYPE_BAN]: node2,
                [constants.TYPE_ANONGIFT]: node2,
                [constants.TYPE_SUBGIFT]: node2,
                [constants.TYPE_SUBMYSTERY]: node2,
                [constants.TYPE_TIMEOUT]: node2,
            });

            dataBucket1.merge(dataBucket2);

            assert.deepEqual(dataBucket1, {
                0: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                1: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                2: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                3: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                4: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                5: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                6: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                7: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                8: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
            });


            assert.deepEqual(dataBucket2, {
                0: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                1: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                2: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                3: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                4: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                5: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                6: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                7: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                },
                8: {
                    _sum: 2,
                    _users: { a: 1, aa: 1 }
                }
            });

        });
    });
});
