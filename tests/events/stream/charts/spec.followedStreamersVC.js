const { assert } = require('chai');
const sinon = require('sinon');

const followedStreamersVC = require('../../../../js/events/stream/charts/followedStreamersVC');
const users = require('../../../../js/singletons/users');
const filter = require('../../../../js/shared/filter');
const testUtils = require('../../../testUtils');


describe('followedStreamersVC.js', () => {
    beforeEach(() => {
        testUtils.reset();
        document.getElementById.withArgs('pie-followed-streamers').returns({});
        followedStreamersVC.reset();
    });

    it('_update', () => {
        users._idToUser = {
            1: testUtils.getUserObject(1, 'a'),
            2: testUtils.getUserObject(1, 'b'),
            3: testUtils.getUserObject(1, 'c'),
            4: testUtils.getUserObject(1, 'd'),
        }

        filter.setChannelInfo('abc', 123);
        sinon.stub(users, 'getTopFollowedBySummary').
            returns([])


        followedStreamersVC._update();
        assert.deepEqual(followedStreamersVC._getDataset()[0].data, []);
        assert.deepEqual(followedStreamersVC._getDataset()[1].data, []);
        assert.deepEqual(followedStreamersVC._getDataset()[2].data, []);
        assert.deepEqual(followedStreamersVC._getRootLabels(), []);

        sinon.verifyAndRestore();

        filter.setChannelInfo('abc', 123);
        sinon.stub(users, 'getTopFollowedBySummary').
            returns([{
                userID: 1,
                unknown: 0,
                following: 1,
                admiring: 0,
            }]);

        followedStreamersVC._update();
        assert.deepEqual(followedStreamersVC._getDataset()[0].data, [0]);
        assert.deepEqual(followedStreamersVC._getDataset()[1].data, [1]);
        assert.deepEqual(followedStreamersVC._getDataset()[2].data, [0]);
        assert.deepEqual(followedStreamersVC._getRootLabels(), ['a']);


        sinon.verifyAndRestore();

        filter.setChannelInfo('abc', 123);
        sinon.stub(users, 'getTopFollowedBySummary').
            returns([{
                userID: 1,
                unknown: 0,
                following: 6,
                admiring: 7,
            }, {
                userID: 2,
                unknown: 0,
                following: 3,
                admiring: 9,
            }, {
                userID: 3,
                unknown: 7,
                following: 4,
                admiring: 2,
            }]);

        followedStreamersVC._update();
        assert.deepEqual(followedStreamersVC._getDataset()[0].data, [7, 9, 2]);
        assert.deepEqual(followedStreamersVC._getDataset()[1].data, [6, 3, 4]);
        assert.deepEqual(followedStreamersVC._getDataset()[2].data, [0, 0, 7]);
        assert.deepEqual(followedStreamersVC._getRootLabels(), ['a', 'b', 'c']);
    });

    describe('_eventSignalsFunc', () => {
        it('channel.input.update', () => {
            const reset = sinon.stub(followedStreamersVC, 'reset');
            followedStreamersVC._eventSignalsFunc({ event: 'filter.change', changed: { channel: 'a-channel' } });
            sinon.assert.calledOnce(reset);
        });

        it('stream.load.ready', () => {
            const reset = sinon.stub(followedStreamersVC, 'reset');
            followedStreamersVC._eventSignalsFunc({ event: 'stream.load.ready' });
            sinon.assert.calledOnce(reset);
            assert.equal(followedStreamersVC._enabled, true);
        });

        it('stream.cleanup', () => {
            followedStreamersVC._eventSignalsFunc({ event: 'stream.cleanup' });
            assert.equal(followedStreamersVC._enabled, false);
        });

        it('fetch.user.follows.resp', () => {
            const update = sinon.stub(followedStreamersVC, 'update');
            const chartObjectUpdate = sinon.stub();
            followedStreamersVC._chartObject = { update: chartObjectUpdate };

            followedStreamersVC._enabled = true;
            followedStreamersVC._eventSignalsFunc({ event: 'fetch.user.follows.resp' });
            followedStreamersVC._enabled = false;
            followedStreamersVC._eventSignalsFunc({ event: 'fetch.user.follows.resp' });

            sinon.assert.calledOnce(chartObjectUpdate);
            sinon.assert.calledOnce(update);
        });
    });
});