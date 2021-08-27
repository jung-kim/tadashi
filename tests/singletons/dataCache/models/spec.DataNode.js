const { assert } = require('chai');
const filter = require('../../../../js/singletons/filter');

const DataNode = require('../../../../js/singletons/dataCache/models/DataNode');
const users = require('../../../../js/singletons/users');
const testUtils = require('../../../testUtils');

describe('DataNode.js', () => {
    beforeEach(() => {
        testUtils.reset();
    });

    describe('merge()', () => {
        it('empty filter', () => {
            const node1 = new DataNode(5, { 'aa': 3, 'a': 2 });
            filter.setSearchString();
            assert(node1.merge(), node1);

            users._ensureUserExists(11, 'aa');
            users._ensureUserExists(1, 'a');
            users._ensureUserExists(22, 'bb');

            assert.deepEqual(node1, { _sum: 5, _users: { 'aa': 3, 'a': 2 } });
            const node2 = new DataNode(7, { 'aa': 4, 'bb': 3 });
            assert.deepEqual(node2, { _sum: 7, _users: { 'aa': 4, 'bb': 3 } });

            assert.deepEqual(node1.merge(node2), { _sum: 12, _users: { 'aa': 7, 'a': 2, 'bb': 3 } });
            assert.deepEqual(node1, { _sum: 12, _users: { 'aa': 7, 'a': 2, 'bb': 3 } });
            assert.deepEqual(node2, { _sum: 7, _users: { 'aa': 4, 'bb': 3 } });
        });

        it('with filter', () => {
            const node1 = new DataNode(5, { 'aa': 3, 'a': 2 });
            const node2 = new DataNode(9, { 'aa': 4, 'bb': 3, 'a': 2 });
            filter.setSearchString('a');

            users._ensureUserExists(11, 'aa');
            users._ensureUserExists(1, 'a');
            users._ensureUserExists(22, 'bb');

            assert.deepEqual(node1.merge(node2), { _sum: 11, _users: { 'aa': 7, 'a': 4 } });
            assert.deepEqual(node1, { _sum: 11, _users: { 'aa': 7, 'a': 4 } });
            assert.deepEqual(node2, { _sum: 9, _users: { 'aa': 4, 'bb': 3, 'a': 2 } });
        });

        it('with filter but ignore filter', () => {
            const node1 = new DataNode(5, { 'aa': 3, 'a': 2 });
            const node2 = new DataNode(9, { 'aa': 4, 'bb': 3, 'a': 2 });
            filter.setSearchString('a');

            users._ensureUserExists(11, 'aa');
            users._ensureUserExists(1, 'a');
            users._ensureUserExists(22, 'bb');

            assert.deepEqual(node1.merge(node2, true), { _sum: 14, _users: { 'aa': 7, 'bb': 3, 'a': 4 } });
            assert.deepEqual(node1, { _sum: 14, _users: { 'aa': 7, 'bb': 3, 'a': 4 } });
            assert.deepEqual(node2, { _sum: 9, _users: { 'aa': 4, 'bb': 3, 'a': 2 } });
        });
    });

    it('add() for cheers', () => {
        const node = new DataNode();

        users._ensureUserExists(1, 'a');
        users._ensureUserExists(3, 'c')

        node.add({ displayName: 'a', bits: 100 });
        assert.equal(node._sum, 1);
        assert.deepEqual(node._users, { 'a': 1 });


        node.add({ displayName: 'a', bits: 300 });
        assert.equal(node._sum, 4);
        assert.deepEqual(node._users, { 'a': 4 });


        node.add({ displayName: 'c', bits: 200 });
        assert.equal(node._sum, 6);
        assert.deepEqual(node._users, { 'a': 4, 'c': 2 });
    });

    it('getCopy() for cheers', () => {
        const node = new DataNode();
        node.add({ displayName: 'a', bits: 100 });
        node.add({ displayName: 'a', bits: 200 });
        node.add({ displayName: 'aa', bits: 300 });
        node.add({ displayName: 'b', bits: 100 });

        const copy = node.getCopy();

        assert.deepEqual(node, {
            _sum: 7,
            _users: {
                'a': 3,
                'aa': 3,
                'b': 1,
            }
        });
        assert.deepEqual(copy, {
            _sum: 7,
            _users: {
                'a': 3,
                'aa': 3,
                'b': 1,
            }
        });

        copy.add({ displayName: 'a', bits: 400 });

        assert.deepEqual(node, {
            _sum: 7,
            _users: {
                'a': 3,
                'aa': 3,
                'b': 1,
            }
        });
        assert.deepEqual(copy, {
            _sum: 11,
            _users: {
                'a': 7,
                'aa': 3,
                'b': 1,
            }
        });
    });

    it('add() for other types', () => {
        const node = new DataNode();

        node.add({ displayName: 'a' });
        assert.equal(node._sum, 1);
        assert.deepEqual(node._users, { 'a': 1 });


        node.add({ displayName: 'a' });
        assert.equal(node._sum, 2);
        assert.deepEqual(node._users, { 'a': 2 });


        node.add({ displayName: 'c' });
        assert.equal(node._sum, 3);
        assert.deepEqual(node._users, { 'a': 2, 'c': 1 });
    });

    it('getCopy() for other types', () => {
        const node = new DataNode();
        node.add({ displayName: 'a' });
        node.add({ displayName: 'a' });
        node.add({ displayName: 'aa' });
        node.add({ displayName: 'b' });

        const copy = node.getCopy();

        assert.deepEqual(node, {
            _sum: 4,
            _users: {
                'a': 2,
                'aa': 1,
                'b': 1
            }
        });
        assert.deepEqual(copy, {
            _sum: 4,
            _users: {
                'a': 2,
                'aa': 1,
                'b': 1
            }
        });

        copy.add({ displayName: 'bb' });

        assert.deepEqual(node, {
            _sum: 4,
            _users: {
                'a': 2,
                'aa': 1,
                'b': 1
            }
        });
        assert.deepEqual(copy, {
            _sum: 5,
            _users: {
                'a': 2,
                'aa': 1,
                'b': 1,
                'bb': 1
            }
        });
    });
});