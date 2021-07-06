const { assert } = require('chai');
const sinon = require('sinon');
const constants = require('../../../js/helpers/constants');

const users = require("../../../js/singletons/users");
const userFollowsFetcher = require('../../../js/singletons/users/userFollowsFetcher');
const userIDFetcher = require('../../../js/singletons/users/userIDFetcher');
const chartFilter = require('../../../js/events/shared/chartFilter');
const channelSubscribedFetcher = require('../../../js/singletons/users/channelSubscribedFetcher');
const eventSignals = require('../../../js/helpers/signals').eventSignals;
const User = require('../../../js/singletons/users/User');
const env = require('../../../js/env');
const testUtils = require('../../testUtils');


describe('users.js', () => {
    beforeEach(() => {
        userIDFetcher.reset();
        userFollowsFetcher.reset();
        testUtils.reset();
    });

    it('processUserIDsResp()', () => {
        const aUser = testUtils.getUserObject(0, 'a');
        const bUser = testUtils.getUserObject(undefined, 'b');
        const cUser = testUtils.getUserObject(3, 'c');
        const stub = sinon.stub(userFollowsFetcher, 'add');

        users._idToUser = { 0: aUser, 3: cUser };
        users._nameToUser = { 'a': aUser, 'b': bUser, 'c': cUser };
        users.processUserIDsResp({ data: [{ login: 'A', id: 1 }, { login: 'B', id: 2 }, { login: 'D', id: 4 }] });
        assert.deepEqual(users._nameToUser, {
            'a': testUtils.getUserObject(1, 'a'),
            'b': testUtils.getUserObject(2, 'b'),
            'c': testUtils.getUserObject(3, 'c'),
            'd': testUtils.getUserObject(4, 'D'),
        });
        assert.deepEqual(users._idToUser, {
            0: testUtils.getUserObject(1, 'a'), // this demonstrates an odd case where id changes
            1: testUtils.getUserObject(1, 'a'),
            2: testUtils.getUserObject(2, 'b'),
            3: testUtils.getUserObject(3, 'c'),
            4: testUtils.getUserObject(4, 'D'),
        });

        sinon.assert.calledOnce(stub.withArgs(1));
        sinon.assert.calledOnce(stub.withArgs(2));
    });

    it('processUserFollowsResp()', () => {
        const aUser = testUtils.getUserObject(1, 'a');
        const bUser = testUtils.getUserObject(2, 'b');
        const cUser = testUtils.getUserObject(3, 'c');

        users._idToUser = { 1: aUser, 2: bUser, 3: cUser };
        users._nameToUser = { 'a': aUser, 'b': bUser, 'c': cUser };

        // missing get user
        users.processUserFollowsResp({
            data: [
                { to_id: 11, to_name: 'aa', from_name: 'a', from_id: 1 },
                { to_id: 22, to_name: 'bb', from_name: 'a', from_id: 1 },
            ]
        });

        assert.deepEqual(users._idToUser, {
            1: testUtils.getUserObject(1, 'a', [11, 22]),
            2: testUtils.getUserObject(2, 'b'),
            3: testUtils.getUserObject(3, 'c'),
            11: testUtils.getUserObject(11, 'aa', undefined, [1]),
            22: testUtils.getUserObject(22, 'bb', undefined, [1]),
        });
        assert.deepEqual(users._nameToUser, {
            a: testUtils.getUserObject(1, 'a', [11, 22]),
            b: testUtils.getUserObject(2, 'b'),
            c: testUtils.getUserObject(3, 'c'),
            aa: testUtils.getUserObject(11, 'aa', undefined, [1]),
            bb: testUtils.getUserObject(22, 'bb', undefined, [1]),
        });
        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: `chatters.data.update.partial` }));

        // with valid get user
        users.processUserFollowsResp({
            data: [
                { to_id: 33, to_name: 'cc', from_name: 'a', from_id: 1 },
                { to_id: 44, to_name: 'dd', from_name: 'b', from_id: 2 },
            ]
        });


        assert.deepEqual(users._idToUser, {
            1: testUtils.getUserObject(1, 'a', [11, 22, 33]),
            2: testUtils.getUserObject(2, 'b', [44]),
            3: testUtils.getUserObject(3, 'c'),
            11: testUtils.getUserObject(11, 'aa', undefined, [1]),
            22: testUtils.getUserObject(22, 'bb', undefined, [1]),
            33: testUtils.getUserObject(33, 'cc', undefined, [1]),
            44: testUtils.getUserObject(44, 'dd', undefined, [2]),
        });
        assert.deepEqual(users._nameToUser, {
            a: testUtils.getUserObject(1, 'a', [11, 22, 33]),
            b: testUtils.getUserObject(2, 'b', [44]),
            c: testUtils.getUserObject(3, 'c'),
            aa: testUtils.getUserObject(11, 'aa', undefined, [1]),
            bb: testUtils.getUserObject(22, 'bb', undefined, [1]),
            cc: testUtils.getUserObject(33, 'cc', undefined, [1]),
            dd: testUtils.getUserObject(44, 'dd', undefined, [2]),
        });
        sinon.assert.calledTwice(eventSignals.dispatch.withArgs({ event: `chatters.data.update.partial` }));
    });

    describe('processChattersData()', () => {
        it('default cases', async () => {
            users._nameToUser = {
                'a': testUtils.getUserObject(1, 'a')
            };
            users._idToUser = { 1: users._nameToUser['a'] };
            const idFetcherAddStub = sinon.stub(userIDFetcher, 'add').
                withArgs('b').
                withArgs('c').
                withArgs('d');

            users.processChattersData({
                'broadcaster': ['a'],
                'viewers': ['b', 'c', 'd'],
            }, 111);

            assert.deepEqual(users._nameToUser, {
                a: testUtils.getUserObject(1, 'a'),
                b: testUtils.getUserObject(undefined, 'b'),
                c: testUtils.getUserObject(undefined, 'c'),
                d: testUtils.getUserObject(undefined, 'd'),
            });
            assert.deepEqual(users._idToUser, {
                1: testUtils.getUserObject(1, 'a'),
            });

            assert.deepEqual(users._viewers, {
                broadcaster: [testUtils.getUserObject(1, 'a')],
                viewers: [
                    testUtils.getUserObject(undefined, 'b'),
                    testUtils.getUserObject(undefined, 'c'),
                    testUtils.getUserObject(undefined, 'd'),
                ]
            });
            sinon.assert.calledOnce(idFetcherAddStub);
        });

        it('high viewers throttling', async () => {
            users._nameToUser = { 'a': testUtils.getUserObject(1, 'a') };
            users._idToUser = { 1: users._nameToUser['a'] };

            const idFetcherAddStub = sinon.stub(userIDFetcher, 'add');
            const fakeViewers = new Array(constants.MAX_VIEWERS_COUNTS_FOR_PROCESS);
            for (let i = 0; i < constants.MAX_VIEWERS_COUNTS_FOR_PROCESS; i++) {
                fakeViewers[i] = i.toString();
            }

            users.processChattersData({
                'broadcaster': ['a'],
                'viewers': fakeViewers,
            }, 111);

            assert.isTrue(users._channelWarned[111]);
            sinon.assert.notCalled(idFetcherAddStub);
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ alert: { type: 'warning', body: sinon.match.any } }));
        });
    });

    it('getViewers', () => {
        users._viewers = 111
        assert.equal(users.getViewers(), 111);
    });

    describe('_eventSignalFunc', () => {
        it('chatters.data.update', () => {
            const processChattersData = sinon.stub(users, 'processChattersData').withArgs(["abc"], 123);
            const dispatch = eventSignals.dispatch.withArgs({ event: 'chatters.data.update.data' });
            const fetch = sinon.stub(channelSubscribedFetcher, 'fetch').withArgs(123);
            users._eventSignalFunc({ event: 'chatters.data.update', data: ["abc"], channelID: 123 });
            sinon.assert.calledOnce(processChattersData);
            sinon.assert.calledOnce(fetch);
            sinon.assert.calledOnce(dispatch);
        });

        it('fetch.user.ids.resp', () => {
            const processUserIDsResp = sinon.stub(users, 'processUserIDsResp').withArgs(["abc"]);
            users._eventSignalFunc({ event: 'fetch.user.ids.resp', data: ["abc"] });
            sinon.assert.calledOnce(processUserIDsResp);
        });

        it('fetch.user.follows.resp', () => {
            const processUserIDsResp = sinon.stub(users, 'processUserFollowsResp').withArgs(["abc"]);
            users._eventSignalFunc({ event: 'fetch.user.follows.resp', data: ["abc"], userID: 888 });
            sinon.assert.calledOnce(processUserIDsResp);
        });

        it('api.unthrottled', () => {
            const userIDFetch = sinon.stub(userIDFetcher, 'fetch').withArgs();
            const userFollowsFetch = sinon.stub(userFollowsFetcher, 'fetch').withArgs();
            users._eventSignalFunc({ event: 'api.unthrottled', data: ["abc"] });
            sinon.assert.calledOnce(userIDFetch);
            sinon.assert.calledOnce(userFollowsFetch);
        });

        it('channel.input.update', () => {
            const userIDFetch = sinon.stub(userIDFetcher, 'reset').withArgs();
            const userFollowsFetch = sinon.stub(userFollowsFetcher, 'reset').withArgs();
            const userEnsureStub = sinon.stub(users, '_ensureUserExists').withArgs(1111, 'aBcD')
            users._eventSignalFunc({ event: 'channel.input.update', data: { id: 1111, channel: 'aBcD' } });
            sinon.assert.calledOnce(userIDFetch);
            sinon.assert.calledOnce(userFollowsFetch);
            sinon.assert.calledOnce(userEnsureStub);
        });

        it('fetch.channel.follows.resp', () => {
            const processChannelFollows = sinon.stub(users, 'processUserFollowsResp').withArgs(["abc"]);
            users._eventSignalFunc({ event: 'fetch.channel.follows.resp', data: ["abc"], channelID: 123 });
            sinon.assert.calledOnce(processChannelFollows);
        });

        it('fetch.channel.subscribed.resp', () => {
            const processChannelSubscribedResp = sinon.stub(users, 'processChannelSubscribedResp').withArgs({ a: 123 });
            users._eventSignalFunc({ event: 'fetch.channel.subscribed.resp', data: { a: 123 } });
            sinon.assert.calledOnce(processChannelSubscribedResp);

        });
    });

    describe('getUsers', () => {
        const userA = testUtils.getUserObject(111, 'a');
        const userB = testUtils.getUserObject(222, 'a');
        const userC = testUtils.getUserObject(333, 'a');

        beforeEach(() => {
            users._idToUser = {
                111: userA,
                222: userB,
                333: userC,
            }
        });

        it('with null filter', () => {
            assert.deepEqual(users.getUsers(), [userA, userB, userC]);
        });

        it('with invalid filter', () => {
            const userFilter = chartFilter.getUserFilter();
            userFilter.changeSearchString('');

            assert.deepEqual(users.getUsers(userFilter), [userA, userB, userC]);
        });

        it('with valid filter', () => {
            const userFilter = chartFilter.getUserFilter();
            userFilter.changeSearchString('a');

            const filterUsers = sinon.stub(userFilter, 'filterUsers').
                withArgs([userA, userB, userC]).
                returns([userA]);

            assert.deepEqual(users.getUsers(userFilter), [userA]);
            sinon.assert.calledOnce(filterUsers);
        });
    });

    describe('_ensureUserExists', () => {
        beforeEach(() => { users.reset(); });
        it('none existant', () => {
            users._ensureUserExists(undefined, 'AAA');

            assert.deepEqual(users._idToUser, {});
            assert.deepEqual(users._nameToUser, {
                aaa: testUtils.getUserObject(undefined, 'AAA'),
            });
        });

        it('update with id', () => {
            users._ensureUserExists(111, 'AAA');

            assert.deepEqual(users._idToUser, {
                111: testUtils.getUserObject(111, 'AAA'),
            });
            assert.deepEqual(users._nameToUser, {
                aaa: testUtils.getUserObject(111, 'AAA'),
            });
        });

        it('already existing', () => {
            users._ensureUserExists(111, 'AAA');
            users._idToUser[111]._test = 'test';
            users._ensureUserExists(111, 'AAA');

            assert.deepEqual(users._idToUser, {
                111: {
                    _id: 111,
                    _userName: 'AAA',
                    _test: 'test',
                }
            });
            assert.deepEqual(users._nameToUser, {
                'aaa': {
                    _id: 111,
                    _userName: 'AAA',
                    _test: 'test',
                }
            });
        });
    });

    it('getTopFollowedBySummary', () => {
        const userFilter = chartFilter.getUserFilter();
        users._idToUser = {
            1: testUtils.getUserObject(1, 'a', [777], [11, 22, 33]),
            11: testUtils.getUserObject(11, 'aa', [123], [1]),
            22: testUtils.getUserObject(22, 'bb', undefined, [1]),
            33: testUtils.getUserObject(33, 'cc', [123], [1]),
            123: testUtils.getUserObject(123, 'abc', [], [11, 33]),
            777: testUtils.getUserObject(777, 'ggg', [1]),
            888: testUtils.getUserObject(888, 'hhh'),
            999: testUtils.getUserObject(999)
        }

        env.channelID = 123;
        assert.deepEqual(users.getTopFollowedBySummary(userFilter), [
            { userID: 1, unknown: 1, following: 2, admiring: 0 },
            { userID: 123, unknown: 0, following: 2, admiring: 0 },
            { userID: 33, unknown: 0, following: 0, admiring: 1 },
            { userID: 22, unknown: 0, following: 0, admiring: 1 },
            { userID: 11, unknown: 0, following: 0, admiring: 1 },
            { userID: 999, unknown: 0, following: 0, admiring: 0 },
            { userID: 888, unknown: 0, following: 0, admiring: 0 },
            { userID: 777, unknown: 0, following: 0, admiring: 0 },
        ]);

        env.channelID = 777;
        assert.deepEqual(users.getTopFollowedBySummary(userFilter), [
            { userID: 1, unknown: 1, following: 0, admiring: 2 },
            { userID: 123, unknown: 0, following: 0, admiring: 2 },
            { userID: 33, unknown: 0, following: 1, admiring: 0 },
            { userID: 22, unknown: 0, following: 1, admiring: 0 },
            { userID: 11, unknown: 0, following: 1, admiring: 0 },
            { userID: 999, unknown: 0, following: 0, admiring: 0 },
            { userID: 888, unknown: 0, following: 0, admiring: 0 },
            { userID: 777, unknown: 0, following: 0, admiring: 0 },
        ]);
    });

    it('_getFollowedBySummary', () => {
        users._idToUser = {
            1: testUtils.getUserObject(1, 'a', [777], [11, 22, 33]),
            11: testUtils.getUserObject(11, 'aa', [123], [1]),
            22: testUtils.getUserObject(22, 'bb', undefined, [1]),
            33: testUtils.getUserObject(33, 'cc', [123], [1]),
            123: testUtils.getUserObject(123, 'abc', [], [11, 33]),
            777: testUtils.getUserObject(777, 'ggg', [1]),
            888: testUtils.getUserObject(888, 'hhh'),
        }

        env.channelID = 123;
        assert.deepEqual(users._getFollowedBySummary(1), {
            userID: 1,
            unknown: 1,
            following: 2,
            admiring: 0,
        });

        env.channelID = 77;
        assert.deepEqual(users._getFollowedBySummary(1), {
            userID: 1,
            unknown: 1,
            following: 0,
            admiring: 2,
        });

        env.channelID = 123;
        assert.deepEqual(users._getFollowedBySummary(777), {
            userID: 777,
            unknown: 0,
            following: 0,
            admiring: 0,
        });

        assert.deepEqual(users._getFollowedBySummary(33), {
            userID: 33,
            unknown: 0,
            following: 0,
            admiring: 1,
        });

        assert.isUndefined(users._getFollowedBySummary(17263));
    });

    it('processChannelSubscribedResp', () => {
        users.processChannelSubscribedResp({
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
                }, {
                    "broadcaster_id": "141981764",
                    "broadcaster_login": "twitchdev",
                    "broadcaster_name": "TwitchDev",
                    "gifter_id": "12826",
                    "gifter_login": "twitch",
                    "gifter_name": "Twitch",
                    "is_gift": true,
                    "tier": "1000",
                    "plan_name": "Channel Subscription (twitchdev)",
                    "user_id": "4444",
                    "user_name": "oliver",
                    "user_login": "0l1v3rD@Gr3@t3st"
                },
            ],
        });

        assert.deepEqual(users._idToUser, {
            4444: {
                "_id": 4444,
                "_subscribedTo": {
                    "141981764": {
                        "broadcaster_id": "141981764",
                        "broadcaster_login": "twitchdev",
                        "broadcaster_name": "TwitchDev",
                        "gifter_id": "12826",
                        "gifter_login": "twitch",
                        "gifter_name": "Twitch",
                        "is_gift": true,
                        "plan_name": "Channel Subscription (twitchdev)",
                        "tier": "1000",
                        "user_id": "4444",
                        "user_login": "0l1v3rD@Gr3@t3st",
                        "user_name": "oliver"
                    }
                },
                "_userName": "oliver"
            },
            527115020: {
                "_id": 527115020,
                "_subscribedTo": {
                    "141981764": {
                        "broadcaster_id": "141981764",
                        "broadcaster_login": "twitchdev",
                        "broadcaster_name": "TwitchDev",
                        "gifter_id": "12826",
                        "gifter_login": "twitch",
                        "gifter_name": "Twitch",
                        "is_gift": true,
                        "plan_name": "Channel Subscription (twitchdev)",
                        "tier": "1000",
                        "user_id": "527115020",
                        "user_login": "twitchgaming",
                        "user_name": "twitchgaming"
                    }
                },
                "_userName": "twitchgaming"
            }
        })

    });

    describe('getSubscriptionsByTiers', () => {
        beforeEach(() => {
            users._idToUser = {
                1: new User(1, 'aaa'), // no subs
                2: new User(2, 'bbb'), // subs to another
                3: new User(3, 'ccc'), // tier 3000 gift subed
                4: new User(4, 'ddd'), // tier 3000 subed
                5: new User(5, 'eee'), // tier 1000 subed
                6: new User(6, 'fff'), // tier 3000 subed
            }

            users._idToUser[2].addSubscribedTo({
                broadcaster_id: 222,
                tier: 3000,
                is_gift: false,
            });
            users._idToUser[3].addSubscribedTo({
                broadcaster_id: 111,
                tier: 3000,
                is_gift: true,
            });
            users._idToUser[4].addSubscribedTo({
                broadcaster_id: 111,
                tier: 3000,
                is_gift: false,
            });
            users._idToUser[5].addSubscribedTo({
                broadcaster_id: 111,
                tier: 1000,
                is_gift: false,
            });
            users._idToUser[6].addSubscribedTo({
                broadcaster_id: 111,
                tier: 3000,
                is_gift: false,
            });

        });

        it('empty', () => {
            env.channelID = 0;
            const res = users.getSubscriptionsByTiers(chartFilter.getUserFilter());

            assert.deepEqual(res, {});
        });

        it('with a match', () => {
            env.channelID = 111;
            const res = users.getSubscriptionsByTiers(chartFilter.getUserFilter());

            assert.deepEqual(res, {
                1000: {
                    gifted: 0,
                    notGifted: 1
                },
                3000: {
                    gifted: 1,
                    notGifted: 2
                }
            });
        })

    });
});
