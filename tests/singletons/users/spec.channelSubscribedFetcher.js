const { assert } = require('chai');
const sinon = require('sinon');
const api = require('../../../js/simpletons/api');

const auth = require('../../../js/simpletons/auth');
const channelSubscribedFetcher = require('../../../js/singletons/users/channelSubscribedFetcher');
const eventSignals = require('../../../js/helpers/signals').eventSignals;
const testUtils = require('../../testUtils');

const firstResponse = {
    "data": [
        {
            "broadcaster_id": "141981764",
            "broadcaster_login": "twitchdev",
            "broadcaster_name": "TwitchDev",
            "gifter_id": "12826",
            "gifter_login": "twitch",
            "gifter_name": "Twitch",
            "is_gift": true,
            "tier": "1000",
            "plan_name": "Channel Subscription (twitchdev)",
            "user_id": "527115020",
            "user_name": "twitchgaming",
            "user_login": "twitchgaming"
        },
    ],
    "pagination": {
        "cursor": "xxxx"
    }
}

const secondResponse = {
    "data": [
        {
            "broadcaster_id": "141981764",
            "broadcaster_login": "twitchdev",
            "broadcaster_name": "TwitchDev",
            "plan_name": "Channel Subscription (twitchdev)",
            "user_id": "111",
            "user_name": "abc",
            "user_login": "abc"
        },
        {
            "broadcaster_id": "141981764",
            "broadcaster_login": "twitchdev",
            "broadcaster_name": "TwitchDev",
            "plan_name": "Channel Subscription (twitchdev)",
            "user_id": "222",
            "user_name": "aaa",
            "user_login": "aaa"
        },
    ],
}


describe('channelSubscribedFetcher.js', () => {
    beforeEach(() => {
        channelSubscribedFetcher._paginations = {};
        channelSubscribedFetcher._isRunning = undefined;
        testUtils.reset();
    });

    describe('_fetch', () => {
        it('undefined, with id, while running', async () => {
            channelSubscribedFetcher._isRunning = true;

            await channelSubscribedFetcher._fetch(111);
            assert.equal(channelSubscribedFetcher._channelID, 111);
            assert.equal(channelSubscribedFetcher._isRunning, true);

            await channelSubscribedFetcher._fetch(222);
            assert.equal(channelSubscribedFetcher._channelID, 222);
            assert.equal(channelSubscribedFetcher._isRunning, true);
        });

        it('channel is already done', async () => {
            channelSubscribedFetcher._paginations = { 111: 'done' };

            await channelSubscribedFetcher._fetch(111);
            assert.isUndefined(channelSubscribedFetcher._isRunning);
        });

        it('main', async () => {
            sinon.stub(auth, 'getAuthObj').returns('an-auth');
            sinon.stub(api, 'queryTwitchApi').
                withArgs(`helix/subscriptions?first=100&broadcaster_id=111`, 'an-auth').
                returns(firstResponse).
                withArgs(`helix/subscriptions?first=100&broadcaster_id=111&after=xxxx`, 'an-auth').
                returns(secondResponse);

            await channelSubscribedFetcher._fetch(111);

            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
                event: 'fetch.channel.subscribed.resp',
                data: firstResponse,
                channelID: 111
            }));

            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
                event: 'fetch.channel.subscribed.resp',
                data: secondResponse,
                channelID: 111
            }));

            assert.isFalse(channelSubscribedFetcher._isRunning);
            assert.deepEqual(channelSubscribedFetcher._paginations, { 111: 'done' });
        });

        it('error', async () => {
            sinon.stub(auth, 'getAuthObj').returns('an-auth');
            sinon.stub(api, 'queryTwitchApi').
                withArgs(`helix/subscriptions?first=100&broadcaster_id=111`, 'an-auth').
                returns(firstResponse).
                withArgs(`helix/subscriptions?first=100&broadcaster_id=111&after=xxxx`, 'an-auth').
                throws('some error');

            await channelSubscribedFetcher._fetch(111);

            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
                event: 'fetch.channel.subscribed.resp',
                data: firstResponse,
                channelID: 111
            }));

            sinon.assert.notCalled(eventSignals.dispatch.withArgs({
                event: 'fetch.channel.subscribed.resp',
                data: secondResponse,
                channelID: 111
            }));

            assert.isFalse(channelSubscribedFetcher._isRunning);
            assert.deepEqual(channelSubscribedFetcher._paginations, { 111: 'xxxx' });
        });
    });
});
