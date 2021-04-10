const fetchMock = require('fetch-mock');
const { assert } = require('chai');
const sinon = require('sinon');

const auth = require('../../../js/simpletons/auth');
const api = require('../../../js/simpletons/api');
const userFollowsFetcher = require('../../../js/singletons/users/userFollowsFetcher');
const eventSignals = require('../../../js/helpers/signals').eventSignals;

const fetchUserFollowsBackup = userFollowsFetcher._fetchUserFollows;

describe('userFollowsFetcher.js', () => {
    beforeEach(() => {
        fetchMock.reset();
        auth._setAuthToken('testAuth');
        userFollowsFetcher._paginations = {};
        reset();
    });

    afterEach(() => {
        userFollowsFetcher.reset();
        auth._auth = undefined;
        userFollowsFetcher._fetchUserFollows = fetchUserFollowsBackup;
    });

    it('_fetch', async () => {
        // stub out the fetch user follows for easier testing for now
        userFollowsFetcher._fetchUserFollows = () => ({});

        // don't spawn any if there are nothing to work on
        userFollowsFetcher._fetch();
        assert.equal(userFollowsFetcher._running, 0);

        // even though we have 4 ids, it will spawn 5 threads, which is not a big deal
        userFollowsFetcher._toFetch = new Set([1, 2, 3, 8]);
        await userFollowsFetcher._fetch();
        assert.equal(userFollowsFetcher._running, 5);

        // simulating some of the threads not finished but _fetch is called, it should respawn all 5
        userFollowsFetcher._running = 2;
        await userFollowsFetcher._fetch();
        assert.equal(userFollowsFetcher._running, 5);


        // ensure only 5 threads when there are more than 5 works to be done
        userFollowsFetcher._toFetch = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
        userFollowsFetcher._running = 0;
        await userFollowsFetcher._fetch();
        assert.equal(userFollowsFetcher._running, 5);
    });

    it('add()', () => {
        userFollowsFetcher.fetch = () => ({});

        userFollowsFetcher.add(1);
        assert.deepEqual(userFollowsFetcher._toFetch, new Set([1]));

        userFollowsFetcher.add(3);
        assert.deepEqual(userFollowsFetcher._toFetch, new Set([1, 3]));
    });

    describe('_fetchUserFollows', () => {
        it('missing _toFetchArray', async () => {
            userFollowsFetcher._toFetch = new Set([123]);
            await userFollowsFetcher._fetchUserFollows();
            assert.equal(userFollowsFetcher._running, 0);
            assert.deepEqual(userFollowsFetcher._toFetch, new Set([123]));
        });

        it('empty _toFetchArray', async () => {
            userFollowsFetcher._toFetch = new Set([123]);
            userFollowsFetcher._toFetchArray = [];
            await userFollowsFetcher._fetchUserFollows();
            assert.equal(userFollowsFetcher._running, 0);
            assert.deepEqual(userFollowsFetcher._toFetch, new Set([123]));
        });

        it('fetch once', async () => {
            const authObj = await auth.getAuthObj();
            userFollowsFetcher._toFetch = new Set([123]);
            userFollowsFetcher._toFetchArray = [123];
            const payload = {
                "total": 2,
                "data": [
                    {
                        "from_id": "123",
                        "from_name": "test",
                        "to_id": "111",
                        "to_name": "follower_1",
                        "followed_at": "2021-01-03T08:54:10Z"
                    }, {
                        "from_id": "123",
                        "from_name": "test",
                        "to_id": "222",
                        "to_name": "follower_2",
                        "followed_at": "2020-12-29T08:34:38Z"
                    }],
                "pagination": { "cursor": undefined }
            };
            sinon.stub(api, 'queryTwitchApi').
                withArgs('helix/users/follows?first=100&from_id=123', authObj).
                returns(payload);

            await userFollowsFetcher._fetchUserFollows();
            assert.equal(userFollowsFetcher._running, 0);
            assert.deepEqual(userFollowsFetcher._toFetch, new Set());

            sinon.assert.calledOnce(eventSignals.dispatch.
                withArgs({ event: 'fetch.user.follows.resp', data: payload, userID: 123 }));
        });

        it('go through pagination', async () => {
            const authObj = await auth.getAuthObj();
            userFollowsFetcher._toFetch = new Set([123]);
            userFollowsFetcher._toFetchArray = [123];
            const payload1 = {
                "total": 2,
                "data": [
                    {
                        "from_id": "123",
                        "from_name": "test",
                        "to_id": "111",
                        "to_name": "follower_1",
                        "followed_at": "2021-01-03T08:54:10Z"
                    }, {
                        "from_id": "123",
                        "from_name": "test",
                        "to_id": "222",
                        "to_name": "follower_2",
                        "followed_at": "2020-12-29T08:34:38Z"
                    }],
                "pagination": { "cursor": 'abc' }
            };
            const payload2 = {
                "total": 1,
                "data": [
                    {
                        "from_id": "123",
                        "from_name": "test",
                        "to_id": "333",
                        "to_name": "follower_3",
                        "followed_at": "2021-01-03T08:54:10Z"
                    }],
                "pagination": undefined
            };
            sinon.stub(api, 'queryTwitchApi').
                withArgs('helix/users/follows?first=100&from_id=123', authObj).
                returns(payload1).
                withArgs('helix/users/follows?first=100&from_id=123&after=abc', authObj).
                returns(payload2);

            await userFollowsFetcher._fetchUserFollows();
            assert.equal(userFollowsFetcher._running, 0);
            assert.deepEqual(userFollowsFetcher._toFetch, new Set());

            assert.equal(userFollowsFetcher._paginations[123], 'done');
            sinon.assert.calledOnce(eventSignals.dispatch.
                withArgs({ event: 'fetch.user.follows.resp', data: payload1, userID: 123 }));
            sinon.assert.calledOnce(eventSignals.dispatch.
                withArgs({ event: 'fetch.user.follows.resp', data: payload2, userID: 123 }));
        });

        it('go through multiple userID', async () => {
            const authObj = await auth.getAuthObj();
            userFollowsFetcher._toFetch = new Set([123, 124]);
            userFollowsFetcher._toFetchArray = [123, 124];
            const payload1 = {
                "total": 2,
                "data": [
                    {
                        "from_id": "123",
                        "from_name": "test",
                        "to_id": "111",
                        "to_name": "follower_1",
                        "followed_at": "2021-01-03T08:54:10Z"
                    }, {
                        "from_id": "123",
                        "from_name": "test",
                        "to_id": "222",
                        "to_name": "follower_2",
                        "followed_at": "2020-12-29T08:34:38Z"
                    }],
                "pagination": undefined
            };
            const payload2 = {
                "total": 1,
                "data": [
                    {
                        "from_id": "124",
                        "from_name": "test",
                        "to_id": "333",
                        "to_name": "follower_3",
                        "followed_at": "2021-01-03T08:54:10Z"
                    }],
                "pagination": undefined
            };
            sinon.stub(api, 'queryTwitchApi').
                withArgs('helix/users/follows?first=100&from_id=123', authObj).
                returns(payload1).
                withArgs('helix/users/follows?first=100&from_id=124', authObj).
                returns(payload2)

            await userFollowsFetcher._fetchUserFollows();

            assert.equal(userFollowsFetcher._running, 0);
            assert.deepEqual(userFollowsFetcher._toFetch, new Set());
            assert.equal(userFollowsFetcher._paginations[123], 'done');
            assert.equal(userFollowsFetcher._paginations[124], 'done');

            sinon.assert.calledOnce(eventSignals.dispatch.
                withArgs({ event: 'fetch.user.follows.resp', data: payload1, userID: 123 }));
            sinon.assert.calledOnce(eventSignals.dispatch.
                withArgs({ event: 'fetch.user.follows.resp', data: payload2, userID: 124 }));
        });


        it('a fetch throwing error', async () => {
            const authObj = await auth.getAuthObj();
            userFollowsFetcher._toFetch = new Set([123]);
            userFollowsFetcher._toFetchArray = [123];
            const payload1 = {
                "total": 2,
                "data": [
                    {
                        "from_id": "123",
                        "from_name": "test",
                        "to_id": "111",
                        "to_name": "follower_1",
                        "followed_at": "2021-01-03T08:54:10Z"
                    }, {
                        "from_id": "123",
                        "from_name": "test",
                        "to_id": "222",
                        "to_name": "follower_2",
                        "followed_at": "2020-12-29T08:34:38Z"
                    }],
                "pagination": {
                    cursor: 'hello'
                }
            };
            const payload2 = {
                "total": 1,
                "data": [
                    {
                        "from_id": "123",
                        "from_name": "test",
                        "to_id": "333",
                        "to_name": "follower_3",
                        "followed_at": "2021-01-03T08:54:10Z"
                    }],
                "pagination": undefined
            };
            sinon.stub(api, 'queryTwitchApi').
                withArgs('helix/users/follows?first=100&from_id=123', authObj).
                returns(payload1).
                withArgs('helix/users/follows?first=100&from_id=123&after=hello', authObj).
                throws('something');

            await userFollowsFetcher._fetchUserFollows();

            assert.equal(userFollowsFetcher._running, 0);
            assert.deepEqual(userFollowsFetcher._toFetch, new Set([123]));
            assert.equal(userFollowsFetcher._paginations[123], 'hello');

            sinon.assert.calledOnce(eventSignals.dispatch.
                withArgs({ event: 'fetch.user.follows.resp', data: payload1, userID: 123 }));

            sinon.verifyAndRestore();
            eventSignals.dispatch.reset();

            sinon.stub(api, 'queryTwitchApi').
                withArgs('helix/users/follows?first=100&from_id=123&after=hello', authObj).
                returns(payload2);

            userFollowsFetcher._toFetchArray = [123];

            await userFollowsFetcher._fetchUserFollows();

            assert.deepEqual(userFollowsFetcher._toFetch, new Set());
            assert.equal(userFollowsFetcher._running, 0);
            assert.equal(userFollowsFetcher._paginations[123], 'done');

            sinon.assert.calledOnce(eventSignals.dispatch.
                withArgs({ event: 'fetch.user.follows.resp', data: payload2, userID: 123 }));
        });

        it('already fetched should not be fetched', async () => {
            userFollowsFetcher._toFetch = new Set([123]);
            userFollowsFetcher._toFetchArray = [123];
            userFollowsFetcher._paginations = { 123: 'done' };
            const queryStub = sinon.stub(api, 'queryTwitchApi');

            await userFollowsFetcher._fetchUserFollows();

            assert.deepEqual(userFollowsFetcher._toFetch, new Set());
            assert.deepEqual(userFollowsFetcher._toFetchArray, []);
            sinon.assert.notCalled(queryStub);
        });
    });
});
