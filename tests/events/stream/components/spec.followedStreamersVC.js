const { assert } = require('chai');

const followedStreamersVC = require('../../../../js/events/stream/components/followedStreamersVC');
const filter = require('../../../../js/events/shared/chartFilter').getUserFilter();


describe('followedStreamersVC.js', () => {
    afterEach(() => {
        followedStreamersVC.reset();
        reset();
    });

    it('_pushToProcess', () => {
        followedStreamersVC._pushToProcess({
            data: [
                { to_id: '123', to_name: 'abc' },
                { to_id: '442', to_name: 'aaa' }
            ]
        });
        assert.deepEqual(followedStreamersVC._map, {
            abc: 1,
            aaa: 1
        });


        followedStreamersVC._pushToProcess({
            data: [
                { to_id: '123', to_name: 'abc' },
                { to_id: '555', to_name: 'bbb' }
            ]
        });
        assert.deepEqual(followedStreamersVC._map, {
            abc: 2,
            aaa: 1,
            bbb: 1,
        });
    });

    it('_update', () => {
        followedStreamersVC._update();
        assert.deepEqual(followedStreamersVC._datasets, []);
        assert.deepEqual(followedStreamersVC._labels, []);

        followedStreamersVC._map = {
            'a': 11
        }
        followedStreamersVC._update();
        assert.deepEqual(followedStreamersVC._datasets, [11]);
        assert.deepEqual(followedStreamersVC._labels, ['a']);

        followedStreamersVC._map = {
            'a': 11,
            'b': 17,
            'c': 7
        }
        followedStreamersVC._update();
        assert.deepEqual(followedStreamersVC._datasets, [17, 11, 7]);
        assert.deepEqual(followedStreamersVC._labels, ['b', 'a', 'c']);

        followedStreamersVC._map = {
            'a': 18,
            'b': 17,
            'c': 18
        }
        followedStreamersVC._update();
        assert.deepEqual(followedStreamersVC._datasets, [18, 18, 17]);
        assert.deepEqual(followedStreamersVC._labels, ['a', 'c', 'b']);

        followedStreamersVC._map = {
            'a': 18,
            'b': 17,
            'c': 18,
            'd': 20,
            'e': 1,
            'f': 8,
            'g': 12,
            'h': 4,
            'i': 21,
            'j': 17,
            'k': 11,
            'l': 15,
            'm': 2
        }
        followedStreamersVC._update();
        assert.deepEqual(followedStreamersVC._datasets, [21, 20, 18, 18, 17, 17, 15, 12, 11, 8]);
        assert.deepEqual(followedStreamersVC._labels, ['i', 'd', 'a', 'c', 'b', 'j', 'l', 'g', 'k', 'f']);

        followedStreamersVC._map = {
            'aa': 18,
            'a': 17,
            'bAaA': 18,
            'abab': 20,
            'AA': 1,
            'Aa': 8,
            'A': 12,
        }
        filter.changeSearchString('aa')
        followedStreamersVC._update();
        assert.deepEqual(followedStreamersVC._datasets, [18, 18, 8, 1]);
        assert.deepEqual(followedStreamersVC._labels, ['aa', 'bAaA', 'Aa', 'AA']);

    });
});