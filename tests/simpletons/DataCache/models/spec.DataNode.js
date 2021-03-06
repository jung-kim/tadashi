const { assert } = require('chai');
const chartFilter = require('../../../../js/events/shared/chartFilter');
const filter = chartFilter.getUserFilter();

const DataNode = require('../../../../js/simpletons/dataCache/models/DataNode');

describe('DataNode.js', () => {

    it('merge()', () => {
        const node1 = new DataNode(5, { 'aa': 3, 'a': 2 });
        assert(node1.merge(), node1);

        assert.deepEqual(node1, { _sum: 5, _users: { 'aa': 3, 'a': 2 } });
        const node2 = new DataNode(7, { 'aa': 4, 'bb': 3 });
        assert.deepEqual(node2, { _sum: 7, _users: { 'aa': 4, 'bb': 3 } });


        assert.deepEqual(node1.merge(node2), { _sum: 12, _users: { 'aa': 7, 'a': 2, 'bb': 3 } });
        assert.deepEqual(node1, { _sum: 12, _users: { 'aa': 7, 'a': 2, 'bb': 3 } });
        assert.deepEqual(node2, { _sum: 7, _users: { 'aa': 4, 'bb': 3 } });
    });

    it('split()', () => {
        const node1 = new DataNode(6, { 'aa': 3, 'a': 2, 'c': 1 });
        node1.split(new DataNode(1, { 'a': 1 }));
        assert.deepEqual(node1, { _sum: 5, _users: { 'aa': 3, 'a': 1, 'c': 1 } });

        node1.split(new DataNode(3, { 'a': 1, 'aa': 2 }));
        assert.deepEqual(node1, { _sum: 2, _users: { 'aa': 1, 'c': 1 } });
    });


    it('add() for cheers', () => {
        const node = new DataNode();

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

        assert.deepEqual(node.getCopy(), {
            _sum: 7,
            _users: {
                'a': 3,
                'aa': 3,
                'b': 1,
            }
        });

        filter.changeSearchString('a');
        assert.deepEqual(node.getCopy(filter), {
            _sum: 6,
            _users: {
                'a': 3,
                'aa': 3,
            }
        });

        filter.changeSearchString('aa');
        assert.deepEqual(node.getCopy(filter), {
            _sum: 3,
            _users: {
                'aa': 3,
            }
        });

        filter.changeSearchString('b');
        assert.deepEqual(node.getCopy(filter), {
            _sum: 1,
            _users: {
                'b': 1,
            }
        });

        filter.changeSearchString('aaa');
        assert.deepEqual(node.getCopy(filter), {
            _sum: 0,
            _users: {}
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

        assert.deepEqual(node.getCopy(), {
            _sum: 4,
            _users: {
                'a': 2,
                'aa': 1,
                'b': 1
            }
        });

        filter.changeSearchString('a');
        assert.deepEqual(node.getCopy(filter), {
            _sum: 3,
            _users: {
                'a': 2,
                'aa': 1,
            }
        });

        filter.changeSearchString('aa')
        assert.deepEqual(node.getCopy(filter), {
            _sum: 1,
            _users: {
                'aa': 1,
            }
        });

        filter.changeSearchString('b');
        assert.deepEqual(node.getCopy(filter), {
            _sum: 1,
            _users: {
                'b': 1,
            }
        });

        filter.changeSearchString('aaa');
        assert.deepEqual(node.getCopy(filter), {
            _sum: 0,
            _users: {}
        });
    });
});