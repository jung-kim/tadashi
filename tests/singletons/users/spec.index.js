const { assert } = require('chai');
const sinon = require('sinon');
const constants = require('../../../js/helpers/constants');

const users = require("../../../js/singletons/users");
const User = require('../../../js/singletons/users/User');
const userFollowsFetcher = require('../../../js/singletons/users/userFollowsFetcher');
const userIDFetcher = require('../../../js/singletons/users/userIDFetcher');
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
        users.processUserIDsResp([{ login: 'A', id: 1 }, { login: 'B', id: 2 }, { login: 'D', id: 4 }]);
        assert.deepEqual(users._nameToUser, {
            'a': {
                _id: 1,
                _userName: 'a',
                userNameCSSClass: 'text-muted',
            }, 'b': {
                _id: 2,
                _userName: 'b',
                userNameCSSClass: 'text-muted',
            }, 'c': {
                _id: 3,
                _userName: 'c',
                userNameCSSClass: 'text-muted',
            }
        });
        assert.deepEqual(users._idToUser, {
            0: { // this demonstrates an odd case where id changes
                _id: 1,
                _userName: 'a',
                userNameCSSClass: 'text-muted',
            }, 1: {
                _id: 1,
                _userName: 'a',
                userNameCSSClass: 'text-muted',
            }, 2: {
                _id: 2,
                _userName: 'b',
                userNameCSSClass: 'text-muted',
            }, 3: {
                _id: 3,
                _userName: 'c',
                userNameCSSClass: 'text-muted',
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
        users.processUserFollowsResp(1, {
            data: [
                { to_id: 11, to_name: 'aa' },
                { to_id: 22, to_name: 'bb' },
            ]
        });
        assert.deepEqual(users._idToUser[1], {
            _id: 1,
            _userName: 'a',
            userNameCSSClass: 'text-muted',
            _follows: new Set([11, 22]),
        });
        assert.deepEqual(users._nameToUser['a'], {
            _id: 1,
            _userName: 'a',
            userNameCSSClass: 'text-muted',
            _follows: new Set([11, 22]),
        });

        // with valid get user
        users.processUserFollowsResp(1, {
            data: [
                { to_id: 33, to_name: 'c' },
                { to_id: 44, to_name: 'dd' },
            ]
        });
        assert.deepEqual(users._idToUser[1], {
            _id: 1,
            _userName: 'a',
            userNameCSSClass: 'text-muted',
            _follows: new Set([11, 22, 33, 44]),
        });
        assert.deepEqual(users._nameToUser['a'], {
            _id: 1,
            _userName: 'a',
            userNameCSSClass: 'text-muted',
            _follows: new Set([11, 22, 33, 44]),
        });
    });

    describe('processChattersData()', () => {
        it('default cases', async () => {
            users._nameToUser = { 'a': new User(1, 'a', { 11: undefined, 22: undefined }) };
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
                    _follows: new Set([11, 22]),
                }, b: {
                    _id: undefined,
                    _userName: 'b',
                    userNameCSSClass: 'text-muted',
                }, c: {
                    _id: undefined,
                    _userName: 'c',
                    userNameCSSClass: 'text-muted',
                }, d: {
                    _id: undefined,
                    _userName: 'd',
                    userNameCSSClass: 'text-muted',
                }
            });
            assert.deepEqual(users._idToUser, {
                1: {
                    _id: 1,
                    _userName: 'a',
                    userNameCSSClass: 'text-muted',
                    _follows: new Set([11, 22]),
                }
            });

            assert.deepEqual(users._viewers, {
                broadcaster: [
                    {
                        _follows: new Set([11, 22]),
                        _id: 1,
                        _userName: 'a',
                        userNameCSSClass: 'text-muted'
                    }
                ],
                viewers: [
                    {
                        _id: undefined,
                        _userName: 'b',
                        userNameCSSClass: 'text-muted'
                    },
                    {
                        _id: undefined,
                        _userName: 'c',
                        userNameCSSClass: 'text-muted'
                    },
                    {
                        _id: undefined,
                        _userName: 'd',
                        userNameCSSClass: 'text-muted'
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

    it('processChannelFollows', () => {
        users._nameToUser['aaa'] = new User(111, 'aAa');
        users._idToUser[222] = new User(222, 'BbB');


        users.processChannelFollows(999, {
            data: [{
                from_id: 111,
                from_name: 'aAa',
            }, {
                from_id: 222,
                from_name: 'BbB',
            }, {
                from_id: 333,
                from_name: 'cCc',
            }]
        });

        assert.equal(users._nameToUser['aaa'], users._idToUser[111]);
        assert.deepEqual(users._idToUser[111], {
            _id: 111,
            _userName: 'aAa',
            _follows: new Set([999]),
            userNameCSSClass: 'text-muted'
        });

        assert.equal(users._nameToUser['bbb'], users._idToUser[222]);
        assert.deepEqual(users._idToUser[222], {
            _id: 222,
            _userName: 'BbB',
            _follows: new Set([999]),
            userNameCSSClass: 'text-muted'
        });

        assert.equal(users._nameToUser['ccc'], users._idToUser[333]);
        assert.deepEqual(users._idToUser[333], {
            _id: 333,
            _userName: 'cCc',
            _follows: new Set([999]),
            userNameCSSClass: 'text-muted'
        });
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
            const processUserIDsResp = sinon.stub(users, 'processUserFollowsResp').withArgs(888, ["abc"]);
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
            const processChannelFollows = sinon.stub(users, 'processChannelFollows').withArgs(123, ["abc"]);
            users._eventSignalFunc({ event: 'fetch.channel.follows.resp', data: ["abc"], channelID: 123 });
            sinon.assert.calledOnce(processChannelFollows);
        });
    });
});