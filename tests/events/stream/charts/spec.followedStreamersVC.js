const { assert } = require('chai');
const sinon = require('sinon');

const followedStreamersVC = require('../../../../js/events/stream/charts/followedStreamersVC');
const chartFilter = require('../../../../js/events/shared/chartFilter');
const twitchClient = require('../../../../js/singletons/twitchClient');
const users = require('../../../../js/singletons/users');
const User = require('../../../../js/singletons/users/User');


describe('followedStreamersVC.js', () => {
    beforeEach(() => {
        reset();
        document.getElementById.withArgs('pie-followed-streamers').returns({});
        followedStreamersVC.reset();
    });

    it('_update', () => {
        users._idToUser = {
            1: new User(1, 'a'),
            2: new User(1, 'b'),
            3: new User(1, 'c'),
            4: new User(1, 'd'),
        }

        sinon.stub(twitchClient, 'getChannelID').returns(123);
        sinon.stub(users, 'getTopFollowedBySummary').
            withArgs(123, chartFilter.getUserFilter()).
            returns([])


        followedStreamersVC._update();
        assert.deepEqual(followedStreamersVC._getDataset()[0].data, []);
        assert.deepEqual(followedStreamersVC._getDataset()[1].data, []);
        assert.deepEqual(followedStreamersVC._getDataset()[2].data, []);
        assert.deepEqual(followedStreamersVC._getRootLabels(), []);

        sinon.verifyAndRestore();

        sinon.stub(twitchClient, 'getChannelID').returns(123);
        sinon.stub(users, 'getTopFollowedBySummary').
            withArgs(123, chartFilter.getUserFilter()).
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

        sinon.stub(twitchClient, 'getChannelID').returns(123);
        sinon.stub(users, 'getTopFollowedBySummary').
            withArgs(123, chartFilter.getUserFilter()).
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
            followedStreamersVC._eventSignalsFunc({ event: 'channel.input.update' });
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