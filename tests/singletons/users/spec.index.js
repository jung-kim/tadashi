const { assert } = require('chai');
const sinon = require('sinon');
const constants = require('../../../js/helpers/constants');

const users = require("../../../js/singletons/users");
const User = require('../../../js/singletons/users/User');
const userFollowsFetcher = require('../../../js/singletons/users/userFollowsFetcher');
const userIDFetcher = require('../../../js/singletons/users/userIDFetcher');
const chartFilter = require('../../../js/events/shared/chartFilter');
const eventSignals = require('../../../js/helpers/signals').eventSignals;


describe('users.js', () => {
    beforeEach(() => {
        users.reset();
    });

    afterEach(() => {
        userIDFetcher.reset();
        userFollowsFetcher.reset();
        reset();
    });

    it('processUserIDsResp()', () => {
        const aUser = new User(0, 'a');
        const bUser = new User(undefined, 'b');
        const cUser = new User(3, 'c');
        const stub = sinon.stub(userFollowsFetcher, 'add');

        users._idToUser = { 0: aUser, 3: cUser };
        users._nameToUser = { 'a': aUser, 'b': bUser, 'c': cUser };
        users.processUserIDsResp({ data: [{ login: 'A', id: 1 }, { login: 'B', id: 2 }, { login: 'D', id: 4 }] });
        assert.deepEqual(users._nameToUser, {
            'a': new User(1, 'a'),
            'b': new User(2, 'b'),
            'c': new User(3, 'c'),
            'd': new User(4, 'D'),
        });
        assert.deepEqual(users._idToUser, {
            0: new User(1, 'a'), // this demonstrates an odd case where id changes
            1: new User(1, 'a'),
            2: new User(2, 'b'),
            3: new User(3, 'c'),
            4: new User(4, 'D'),
        });

        sinon.assert.calledOnce(stub.withArgs(1));
        sinon.assert.calledOnce(stub.withArgs(2));
    });

    it('processUserFollowsResp()', () => {
        const aUser = new User(1, 'a');
        const bUser = new User(2, 'b');
        const cUser = new User(3, 'c');

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
            1: new User(1, 'a', [11, 22]),
            2: new User(2, 'b'),
            3: new User(3, 'c'),
            11: new User(11, 'aa', undefined, [1]),
            22: new User(22, 'bb', undefined, [1]),
        });
        assert.deepEqual(users._nameToUser, {
            a: new User(1, 'a', [11, 22]),
            b: new User(2, 'b'),
            c: new User(3, 'c'),
            aa: new User(11, 'aa', undefined, [1]),
            bb: new User(22, 'bb', undefined, [1]),
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
            1: new User(1, 'a', [11, 22, 33]),
            2: new User(2, 'b', [44]),
            3: new User(3, 'c'),
            11: new User(11, 'aa', undefined, [1]),
            22: new User(22, 'bb', undefined, [1]),
            33: new User(33, 'cc', undefined, [1]),
            44: new User(44, 'dd', undefined, [2]),
        });
        assert.deepEqual(users._nameToUser, {
            a: new User(1, 'a', [11, 22, 33]),
            b: new User(2, 'b', [44]),
            c: new User(3, 'c'),
            aa: new User(11, 'aa', undefined, [1]),
            bb: new User(22, 'bb', undefined, [1]),
            cc: new User(33, 'cc', undefined, [1]),
            dd: new User(44, 'dd', undefined, [2]),
        });
        sinon.assert.calledTwice(eventSignals.dispatch.withArgs({ event: `chatters.data.update.partial` }));
    });

    describe('processChattersData()', () => {
        it('default cases', async () => {
            users._nameToUser = { 'a': new User(1, 'a') };
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
                a: new User(1, 'a'),
                b: new User(undefined, 'b'),
                c: new User(undefined, 'c'),
                d: new User(undefined, 'd'),
            });
            assert.deepEqual(users._idToUser, {
                1: new User(1, 'a'),
            });

            assert.deepEqual(users._viewers, {
                broadcaster: [new User(1, 'a')],
                viewers: [
                    new User(undefined, 'b'),
                    new User(undefined, 'c'),
                    new User(undefined, 'd'),
                ]
            });
            sinon.assert.calledOnce(idFetcherAddStub);
        });

        it('high viewers throttling', async () => {
            users._nameToUser = { 'a': new User(1, 'a') };
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
            users._eventSignalFunc({ event: 'chatters.data.update', data: ["abc"], channelID: 123 });
            sinon.assert.calledOnce(processChattersData);
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
            users._eventSignalFunc({ event: 'channel.input.update', data: { id: 1111 } });
            sinon.assert.calledOnce(userIDFetch);
            sinon.assert.calledOnce(userFollowsFetch);
        });

        it('fetch.channel.follows.resp', () => {
            const processChannelFollows = sinon.stub(users, 'processUserFollowsResp').withArgs(["abc"]);
            users._eventSignalFunc({ event: 'fetch.channel.follows.resp', data: ["abc"], channelID: 123 });
            sinon.assert.calledOnce(processChannelFollows);
        });
    });

    describe('getUsers', () => {
        const userA = new User(111, 'a');
        const userB = new User(222, 'a');
        const userC = new User(333, 'a');

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
                aaa: new User(undefined, 'AAA'),
            });
        });

        it('update with id', () => {
            users._ensureUserExists(111, 'AAA');

            assert.deepEqual(users._idToUser, {
                111: new User(111, 'AAA'),
            });
            assert.deepEqual(users._nameToUser, {
                aaa: new User(111, 'AAA'),
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
            1: new User(1, 'a', [777], [11, 22, 33]),
            11: new User(11, 'aa', [123], [1]),
            22: new User(22, 'bb', undefined, [1]),
            33: new User(33, 'cc', [123], [1]),
            123: new User(123, 'abc', [], [11, 33]),
            777: new User(777, 'ggg', [1]),
            888: new User(888, 'hhh'),
            999: new User(999)
        }

        assert.deepEqual(users.getTopFollowedBySummary(123, userFilter), [
            { userID: 1, unknown: 1, following: 2, admiring: 0 },
            { userID: 123, unknown: 0, following: 2, admiring: 0 },
            { userID: 33, unknown: 0, following: 0, admiring: 1 },
            { userID: 22, unknown: 0, following: 0, admiring: 1 },
            { userID: 11, unknown: 0, following: 0, admiring: 1 },
            { userID: 999, unknown: 0, following: 0, admiring: 0 },
            { userID: 888, unknown: 0, following: 0, admiring: 0 },
            { userID: 777, unknown: 0, following: 0, admiring: 0 },
        ]);

        assert.deepEqual(users.getTopFollowedBySummary(777, userFilter), [
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
            1: new User(1, 'a', [777], [11, 22, 33]),
            11: new User(11, 'aa', [123], [1]),
            22: new User(22, 'bb', undefined, [1]),
            33: new User(33, 'cc', [123], [1]),
            123: new User(123, 'abc', [], [11, 33]),
            777: new User(777, 'ggg', [1]),
            888: new User(888, 'hhh'),
        }

        assert.deepEqual(users._getFollowedBySummary(123, 1), {
            userID: 1,
            unknown: 1,
            following: 2,
            admiring: 0,
        });

        assert.deepEqual(users._getFollowedBySummary(77, 1), {
            userID: 1,
            unknown: 1,
            following: 0,
            admiring: 2,
        });

        assert.deepEqual(users._getFollowedBySummary(123, 777), {
            userID: 777,
            unknown: 0,
            following: 0,
            admiring: 0,
        });

        assert.deepEqual(users._getFollowedBySummary(123, 33), {
            userID: 33,
            unknown: 0,
            following: 0,
            admiring: 1,
        });

        assert.isUndefined(users._getFollowedBySummary(123, 17263));
    });
});
