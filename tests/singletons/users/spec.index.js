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
        const dUser = new User(4, 'd')
        const stub = sinon.stub(userFollowsFetcher, 'add');

        users._idToUser = { 0: aUser, 3: cUser };
        users._nameToUser = { 'a': aUser, 'b': bUser, 'c': cUser };
        users.processUserIDsResp({ data: [{ login: 'A', id: 1 }, { login: 'B', id: 2 }, { login: 'D', id: 4 }] });
        assert.deepEqual(users._nameToUser, {
            'a': {
                _id: 1,
                _userName: 'a',
                userNameCSSClass: 'text-muted',
                _following: {},
                _followedBy: {},
            }, 'b': {
                _id: 2,
                _userName: 'b',
                userNameCSSClass: 'text-muted',
                _following: {},
                _followedBy: {},
            }, 'c': {
                _id: 3,
                _userName: 'c',
                userNameCSSClass: 'text-muted',
                _following: {},
                _followedBy: {},
            }, 'd': {
                _id: 4,
                _userName: 'D',
                userNameCSSClass: 'text-muted',
                _following: {},
                _followedBy: {},
            }
        });
        assert.deepEqual(users._idToUser, {
            0: { // this demonstrates an odd case where id changes
                _id: 1,
                _userName: 'a',
                userNameCSSClass: 'text-muted',
                _following: {},
                _followedBy: {},
            }, 1: {
                _id: 1,
                _userName: 'a',
                userNameCSSClass: 'text-muted',
                _following: {},
                _followedBy: {},
            }, 2: {
                _id: 2,
                _userName: 'b',
                userNameCSSClass: 'text-muted',
                _following: {},
                _followedBy: {},
            }, 3: {
                _id: 3,
                _userName: 'c',
                userNameCSSClass: 'text-muted',
                _following: {},
                _followedBy: {},
            }, 4: {
                _id: 4,
                _userName: 'D',
                userNameCSSClass: 'text-muted',
                _following: {},
                _followedBy: {},
            }
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

        // because of circular reference issues, checking mostly by id
        assert.deepEqual(Object.keys(users._idToUser), ['1', '2', '3', '11', '22']);
        assert.deepEqual(Object.keys(users._idToUser[1]._followedBy), []);
        assert.deepEqual(Object.keys(users._idToUser[2]._followedBy), []);
        assert.deepEqual(Object.keys(users._idToUser[3]._followedBy), []);
        assert.deepEqual(Object.keys(users._idToUser[11]._followedBy), ['1']);
        assert.deepEqual(Object.keys(users._idToUser[22]._followedBy), ['1']);
        assert.deepEqual(Object.keys(users._idToUser[1]._following), ['11', '22']);
        assert.deepEqual(Object.keys(users._idToUser[2]._following), []);
        assert.deepEqual(Object.keys(users._idToUser[3]._following), []);
        assert.deepEqual(Object.keys(users._idToUser[11]._following), []);
        assert.deepEqual(Object.keys(users._idToUser[22]._following), []);
        assert.deepEqual(Object.keys(users._nameToUser), ['a', 'b', 'c', 'aa', 'bb']);

        // with valid get user
        users.processUserFollowsResp({
            data: [
                { to_id: 33, to_name: 'cc', from_name: 'a', from_id: 1 },
                { to_id: 44, to_name: 'dd', from_name: 'a', from_id: 2 },
            ]
        });

        assert.deepEqual(Object.keys(users._idToUser), ['1', '2', '3', '11', '22', '33', '44']);
        assert.deepEqual(Object.keys(users._idToUser[1]._followedBy), []);
        assert.deepEqual(Object.keys(users._idToUser[2]._followedBy), []);
        assert.deepEqual(Object.keys(users._idToUser[3]._followedBy), []);
        assert.deepEqual(Object.keys(users._idToUser[11]._followedBy), ['1']);
        assert.deepEqual(Object.keys(users._idToUser[22]._followedBy), ['1']);
        assert.deepEqual(Object.keys(users._idToUser[33]._followedBy), ['1']);
        assert.deepEqual(Object.keys(users._idToUser[44]._followedBy), ['2']);
        assert.deepEqual(Object.keys(users._idToUser[1]._following), ['11', '22', '33']);
        assert.deepEqual(Object.keys(users._idToUser[2]._following), ['44']);
        assert.deepEqual(Object.keys(users._idToUser[3]._following), []);
        assert.deepEqual(Object.keys(users._idToUser[11]._following), []);
        assert.deepEqual(Object.keys(users._idToUser[22]._following), []);
        assert.deepEqual(Object.keys(users._idToUser[33]._following), []);
        assert.deepEqual(Object.keys(users._idToUser[44]._following), []);
        assert.deepEqual(Object.keys(users._nameToUser), ['a', 'b', 'c', 'aa', 'bb', 'cc', 'dd']);
    });

    describe('processChattersData()', () => {
        it('default cases', async () => {
            users._nameToUser = { 'a': new User(1, 'a') };
            users._idToUser = { 1: users._nameToUser['a'] };
            const idFetcherAddStub = sinon.stub(userIDFetcher, 'add')
                .withArgs('b')
                .withArgs('c')
                .withArgs('d');

            users.processChattersData({
                'broadcaster': ['a'],
                'viewers': ['b', 'c', 'd'],
            }, 111);

            assert.deepEqual(users._nameToUser, {
                a: {
                    _id: 1,
                    _userName: 'a',
                    userNameCSSClass: 'text-muted',
                    _following: {},
                    _followedBy: {},
                }, b: {
                    _id: undefined,
                    _userName: 'b',
                    userNameCSSClass: 'text-muted',
                    _following: {},
                    _followedBy: {},
                }, c: {
                    _id: undefined,
                    _userName: 'c',
                    userNameCSSClass: 'text-muted',
                    _following: {},
                    _followedBy: {},
                }, d: {
                    _id: undefined,
                    _userName: 'd',
                    userNameCSSClass: 'text-muted',
                    _following: {},
                    _followedBy: {},
                }
            });
            assert.deepEqual(users._idToUser, {
                1: {
                    _id: 1,
                    _userName: 'a',
                    userNameCSSClass: 'text-muted',
                    _following: {},
                    _followedBy: {},
                }
            });

            assert.deepEqual(users._viewers, {
                broadcaster: [
                    {
                        _id: 1,
                        _userName: 'a',
                        userNameCSSClass: 'text-muted',
                        _following: {},
                        _followedBy: {},
                    }
                ],
                viewers: [
                    {
                        _id: undefined,
                        _userName: 'b',
                        userNameCSSClass: 'text-muted',
                        _following: {},
                        _followedBy: {},
                    },
                    {
                        _id: undefined,
                        _userName: 'c',
                        userNameCSSClass: 'text-muted',
                        _following: {},
                        _followedBy: {},
                    },
                    {
                        _id: undefined,
                        _userName: 'd',
                        userNameCSSClass: 'text-muted',
                        _following: {},
                        _followedBy: {},
                    }
                ]
            });
            sinon.assert.calledOnce(idFetcherAddStub);
        });

        it('high viewers throttling', async () => {
            users._nameToUser = { 'a': new User(1, 'a', { 11: undefined, 22: undefined }) };
            users._idToUser = { 1: users._nameToUser['a'] };

            const idFetcherAddStub = sinon.stub(userIDFetcher, 'add');
            const fakeViewers = new Array(constants.MAX_VIEWERS_COUNTS_FOR_PROCESS);
            for (i = 0; i < constants.MAX_VIEWERS_COUNTS_FOR_PROCESS; i++) {
                fakeViewers[i] = i.toString();
            }

            users.processChattersData({
                'broadcaster': ['a'],
                'viewers': fakeViewers,
            }, 111);

            assert.isTrue(users._channelWarned[111]);
            sinon.assert.notCalled(idFetcherAddStub);
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
            const userFollowsFetch = sinon.stub(userFollowsFetcher, 'reset').withArgs();;
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

            const filterUsers = sinon.stub(userFilter, 'filterUsers')
                .withArgs([userA, userB, userC])
                .returns([userA]);

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
                'aaa': {
                    _id: undefined,
                    _userName: 'AAA',
                    userNameCSSClass: 'text-muted',
                    _following: {},
                    _followedBy: {},
                }
            });
        });

        it('update with id', () => {
            users._ensureUserExists(111, 'AAA');

            assert.deepEqual(users._idToUser, {
                111: {
                    _id: 111,
                    _userName: 'AAA',
                    userNameCSSClass: 'text-muted',
                    _following: {},
                    _followedBy: {},
                }
            });
            assert.deepEqual(users._nameToUser, {
                'aaa': {
                    _id: 111,
                    _userName: 'AAA',
                    userNameCSSClass: 'text-muted',
                    _following: {},
                    _followedBy: {},
                }
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
                    userNameCSSClass: 'text-muted',
                    _following: {},
                    _followedBy: {},
                    _test: 'test',
                }
            });
            assert.deepEqual(users._nameToUser, {
                'aaa': {
                    _id: 111,
                    _userName: 'AAA',
                    userNameCSSClass: 'text-muted',
                    _following: {},
                    _followedBy: {},
                    _test: 'test',
                }
            });
        });
    });
});
