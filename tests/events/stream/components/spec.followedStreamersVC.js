const { assert } = require('chai');
const sinon = require('sinon');

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

    describe('_eventSignalsFunc', () => {
        it('channel.input.update', () => {
            const reset = sinon.stub(followedStreamersVC, 'reset');
            followedStreamersVC._eventSignalsFunc({ event: 'channel.input.update' });
            sinon.assert.calledOnce(reset);
        });

        it('stream.load.ready', () => {
            const reset = sinon.stub(followedStreamersVC, 'reset');
            const enable = sinon.stub(followedStreamersVC, 'enable');
            const _updateChartObject = sinon.stub(followedStreamersVC, '_updateChartObject');
            followedStreamersVC._eventSignalsFunc({ event: 'stream.load.ready' });
            sinon.assert.calledOnce(reset);
            sinon.assert.calledOnce(enable);
            sinon.assert.calledOnce(_updateChartObject);
        });

        it('stream.cleanup', () => {
            const disable = sinon.stub(followedStreamersVC, 'disable');
            followedStreamersVC._eventSignalsFunc({ event: 'stream.cleanup' });
            sinon.assert.calledOnce(disable);
        });

        it('fetch.user.follows.resp', () => {
            const _pushToProcess = sinon.stub(followedStreamersVC, '_pushToProcess');
            const update = sinon.stub(followedStreamersVC, 'update');
            followedStreamersVC._enabled = true;
            followedStreamersVC._eventSignalsFunc({ event: 'fetch.user.follows.resp' });
            followedStreamersVC._enabled = false;
            followedStreamersVC._eventSignalsFunc({ event: 'fetch.user.follows.resp' });
            sinon.assert.calledOnce(_pushToProcess);
            sinon.assert.calledOnce(update);
        });
    });
});