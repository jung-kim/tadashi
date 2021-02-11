const { assert } = require('chai');
const sinon = require('sinon');
const constants = require('../../../js/helpers/constants');

const auth = require('../../../js/simpletons/auth');
const channelFollowsFetcher = require('../../../js/singletons/users/channelFollowsFetcher');
const api = require('../../../js/simpletons/api');
const signals = require('../../../js/helpers/signals').signals;

describe('channelFollowsFetcher.js', () => {
    afterEach(() => {
        channelFollowsFetcher._paginations = {};
        signals.dispatch.reset();
        reset();
    });

    describe('_fetch', () => {
        it('invalid id', async () => {
            const getAuthStub = sinon.stub(auth, 'getAuthObj');
            await channelFollowsFetcher._fetch();
            sinon.assert.notCalled(getAuthStub);
        });

        it('already called id', async () => {
            const getAuthStub = sinon.stub(auth, 'getAuthObj');
            channelFollowsFetcher._paginations[111] = 'done';
            await channelFollowsFetcher._fetch(111);
            sinon.assert.notCalled(getAuthStub);
        });

        it('none pagination case', async () => {
            sinon.stub(auth, 'getAuthObj')
                .returns('auth');
            sinon.stub(api, 'queryTwitchApi')
                .withArgs('helix/users/follows?first=100&to_id=111', 'auth')
                .returns({ data: 'something' });

            await channelFollowsFetcher._fetch(111);

            assert.equal(channelFollowsFetcher._paginations[111], 'done');
            sinon.assert.calledOnce(
                signals.dispatch.withArgs({ event: 'fetch.channel.follows.resp', data: { data: 'something' }, channelID: 111 }));
        });

        it('pagination case', async () => {
            sinon.stub(auth, 'getAuthObj')
                .returns('auth');
            sinon.stub(api, 'queryTwitchApi')
                .withArgs('helix/users/follows?first=100&to_id=111', 'auth')
                .returns({ data: 'something', pagination: { cursor: 'a_cursor' } })
                .withArgs('helix/users/follows?first=100&to_id=111&after=a_cursor', 'auth')
                .returns({ data: 'another', pagination: {} });

            await channelFollowsFetcher._fetch(111);

            assert.equal(channelFollowsFetcher._paginations[111], 'done');
            sinon.assert.calledOnce(
                signals.dispatch.withArgs({
                    event: 'fetch.channel.follows.resp',
                    channelID: 111,
                    data: { data: 'something', pagination: { cursor: 'a_cursor' } },
                }));
            sinon.assert.calledOnce(
                signals.dispatch.withArgs({
                    event: 'fetch.channel.follows.resp',
                    channelID: 111,
                    data: { data: 'another', pagination: {} },
                }));
        });

        it('err mid pagination case', async () => {
            sinon.stub(auth, 'getAuthObj')
                .returns('auth');
            sinon.stub(api, 'queryTwitchApi')
                .withArgs('helix/users/follows?first=100&to_id=111', 'auth')
                .returns({ data: 'something', pagination: { cursor: 'a_cursor' } })
                .withArgs('helix/users/follows?first=100&to_id=111&after=a_cursor', 'auth')
                .returns({ data: 'another', pagination: {} })
                .throws('an_err');

            await channelFollowsFetcher._fetch(111);

            assert.equal(channelFollowsFetcher._paginations[111], 'a_cursor');
            sinon.assert.calledOnce(
                signals.dispatch.withArgs({
                    event: 'fetch.channel.follows.resp',
                    channelID: 111,
                    data: { data: 'something', pagination: { cursor: 'a_cursor' } },
                }));
            sinon.assert.calledOnce(signals.dispatch);
        });
    });
});