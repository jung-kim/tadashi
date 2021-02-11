const { assert } = require('chai');

const testUtils = require('../../../testUtils');
const constants = require('../../../../js/helpers/constants');
const DataBucket = require('../../../../js/simpletons/dataCache/models/DataBucket');
const DataNode = require('../../../../js/simpletons/dataCache/models/DataNode');
const blanks = require('../../../../js/simpletons/dataCache/models/blanks');

describe('blanks.js', () => {
    describe('blankDataNode', () => {
        it('getCopy()', () => {
            const blank = blanks.blankDataNode;
            assert.deepEqual(blank, { _sum: 0, _users: {} });
            const cloned = blank.getCopy();
            assert.deepEqual(cloned, { _sum: 0, _users: {} });

            cloned._sum = 3;
            assert.deepEqual(blank, { _sum: 0, _users: {} });
            assert.deepEqual(cloned, { _sum: 3, _users: {} });
        });

        it('merge()', () => {
            const blank = blanks.blankDataNode;
            assert.deepEqual(blank, { _sum: 0, _users: {} });

            const merged = blank.merge(new DataNode(7, { 'aa': 4, 'bb': 3 }));
            assert.deepEqual(blank, { _sum: 0, _users: {} });
            assert.deepEqual(merged, { _sum: 7, _users: { 'aa': 4, 'bb': 3 } });
        });

        it('split()', () => {
            const blank = blanks.blankDataNode;
            assert.deepEqual(blank, { _sum: 0, _users: {} });
            const splited = blank.split();
            assert.deepEqual(splited, { _sum: 0, _users: {} });

            splited._sum = 3;
            assert.deepEqual(blank, { _sum: 0, _users: {} });
            assert.deepEqual(splited, { _sum: 3, _users: {} });
        });
    });

    describe('blankDataBucket', () => {
        it('getCopy()', () => {
            const blank = blanks.blankDataBucket;
            assert.deepEqual(blank, testUtils.blankAggsBucketToCompare);
            const cloned = blank.getCopy();
            assert.deepEqual(cloned, testUtils.blankAggsBucketToCompare);

            const dataNode = new DataNode(7, { 'aa': 4, 'bb': 3 });
            cloned[constants.TYPE_CHAT] = dataNode;
            assert.deepEqual(blank, testUtils.blankAggsBucketToCompare);
            assert.deepEqual(cloned, {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: dataNode,
            });
        });

        it('merge()', () => {
            const blank = blanks.blankDataBucket;
            assert.deepEqual(blank, testUtils.blankAggsBucketToCompare);

            const node0 = new DataNode();
            node0.add({ displayName: 'a' });
            const node1 = new DataNode();
            const target = new DataBucket({
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: node0,
                [constants.TYPE_RESUB]: node1,
                [constants.TYPE_CHEER]: node1,
                [constants.TYPE_SUB]: node1,
                [constants.TYPE_BAN]: node1,
                [constants.TYPE_ANONGIFT]: node1,
                [constants.TYPE_SUBGIFT]: node1,
                [constants.TYPE_SUBMYSTERY]: node1,
            });

            const merged = blank.merge(target);
            assert.deepEqual(blank, testUtils.blankAggsBucketToCompare);
            assert.deepEqual(merged, {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: new DataNode(1, { 'a': 1 }),
            });
        });

        it('split()', () => {
            const blank = blanks.blankDataBucket;
            assert.deepEqual(blank, testUtils.blankAggsBucketToCompare);
            const splitted = blank.split();
            assert.deepEqual(splitted, testUtils.blankAggsBucketToCompare);

            const dataNode = new DataNode(7, { 'aa': 4, 'bb': 3 });
            splitted[constants.TYPE_CHAT] = dataNode;
            assert.deepEqual(blank, testUtils.blankAggsBucketToCompare);
            assert.deepEqual(splitted, {
                ...testUtils.blankAggsBucketToCompare,
                [constants.TYPE_CHAT]: dataNode,
            });
        });
    });
});