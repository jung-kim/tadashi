const { assert } = require('chai');
const sinon = require('sinon');
const tmi = require('tmi.js');
const constants = require('../../js/helpers/constants');

const auth = require('../../js/singletons/auth');
const twitchClient = require("../../js/singletons/twitchClient");
const api = require("../../js/singletons/api");
const dataCache = require('../../js/singletons/dataCache');
const eventSignals = require('../../js/helpers/signals').eventSignals;
const testUtils = require('../testUtils');
const events = require('../../js/models/events');
const filter = require('../../js/singletons/filter');
const users = require('../../js/singletons/users');

const fakeClient = twitchClient._client;

describe('twitchClient.js', () => {
    beforeEach(() => {
        twitchClient._disable();
        testUtils.reset();
        twitchClient._client = fakeClient;
        twitchClient._initPromise = undefined;
    });

    describe('initializeClient', () => {
        it('run while initializing', async () => {
            twitchClient._initPromise = new Promise((resolve) => {
                setTimeout(resolve, 500);
            });
            twitchClient._client = undefined;
            const start = Date.now();
            await twitchClient.initializeClient();
            const diff = Date.now() - start;
            assert.isTrue(diff >= 499);
        });

        it('run after intialized', async () => {
            const tmiClientStub = sinon.stub(tmi, 'Client');

            twitchClient._client = 'abc';
            await twitchClient.initializeClient();
            assert.equal(twitchClient._client, 'abc');
            sinon.assert.notCalled(tmiClientStub);
        });

        it('broadcaster user init', async () => {
            twitchClient._client = undefined;
            const fakeClient = { connect: sinon.stub(), on: () => ({}) };

            sinon.stub(auth, 'isBroadcaster').returns(true);
            sinon.stub(auth, 'getLogin').returns('someone');
            sinon.stub(auth, 'getID').returns(123);
            sinon.stub(tmi, 'Client').
                callThroughWithNew().
                withArgs(sinon.match.any).
                returns(fakeClient);
            const ping = sinon.stub(twitchClient, 'ping');

            await twitchClient.initializeClient();

            sinon.assert.calledOnce(ping);
            assert.equal(filter.getChannel(), 'someone');
            assert.equal(filter.getChannelId(), 123);
            sinon.assert.calledOnce(fakeClient.connect);
        });

        it('default user init', async () => {
            twitchClient._client = undefined;
            const fakeClient = { connect: sinon.stub(), on: () => ({}) };

            sinon.stub(tmi, 'Client').
                callThroughWithNew().
                withArgs(sinon.match.any).
                returns(fakeClient);
            const ping = sinon.stub(twitchClient, 'ping');

            await twitchClient.initializeClient();

            sinon.assert.calledOnce(ping);
            sinon.assert.calledOnce(fakeClient.connect);
            assert.equal(filter.getChannel(), 'xqcow');
            assert.equal(filter.getChannelId(), 71092938);
        });
    });

    describe('changeChannel()', () => {
        it('change channel from undefined', async () => {
            const joinStub = sinon.stub(twitchClient._client, 'join').withArgs('abcde');
            const partStub = sinon.stub(twitchClient._client, 'part');

            await twitchClient.changeChannel('abcde', 5);

            sinon.assert.calledOnce(joinStub);
            sinon.assert.notCalled(partStub);
            assert.equal(filter.getChannel(), 'abcde');
            assert.equal(filter.getChannelId(), 5);
        });

        it('from same channel', async () => {
            filter.setChannelInfo('abcde', 5);
            const joinStub = sinon.stub(twitchClient._client, 'join');
            const partStub = sinon.stub(twitchClient._client, 'part');

            await twitchClient.changeChannel('abcde');

            sinon.assert.notCalled(joinStub);
            sinon.assert.notCalled(partStub);
            assert.equal(filter.getChannel(), 'abcde');
        });

        it('from another channel', async () => {
            filter.setChannelInfo('1111', 1111);
            const joinStub = sinon.stub(twitchClient._client, 'join').withArgs('abcde');
            const partStub = sinon.stub(twitchClient._client, 'part').withArgs('1111');

            await twitchClient.changeChannel('abcde', 5);

            sinon.assert.calledOnce(joinStub);
            sinon.assert.calledOnce(partStub);
            assert.equal(filter.getChannel(), 'abcde');
            assert.equal(filter.getChannelId(), 5);
        });

        it('missing id', async () => {
            filter.setChannelInfo('1111', 1111);
            const joinStub = sinon.stub(twitchClient._client, 'join').withArgs('abcde');
            const partStub = sinon.stub(twitchClient._client, 'part').withArgs('1111');
            const queryTwitchApi = sinon.stub(api, 'queryTwitchApi').withArgs(`kraken/users?login=abcde`).returns({
                users: [{ _id: 5 }]
            });

            await twitchClient.changeChannel('abcde', undefined);

            sinon.assert.calledOnce(joinStub);
            sinon.assert.calledOnce(partStub);
            sinon.assert.calledOnce(queryTwitchApi);
            assert.equal(filter.getChannel(), 'abcde');
            assert.equal(filter.getChannelId(), 5);
        });
    });

    describe('_processChatMessage', () => {
        it('missing display name', () => {
            const ping = sinon.stub(twitchClient, 'ping');
            const dataCacheAdd = sinon.stub(dataCache, 'add').withArgs('abc', new events.Chat({}));

            twitchClient._processChatMessage('abc', new events.Chat({}));

            sinon.assert.calledOnce(ping);
            sinon.assert.calledOnce(dataCacheAdd);
        });

        it('with display name', () => {
            const ping = sinon.stub(twitchClient, 'ping');
            const _ensureUserExists = sinon.stub(users, '_ensureUserExists').withArgs()
            const dataCacheAdd = sinon.stub(dataCache, 'add').withArgs('abc', new events.Chat({
                'user-id': 123,
                'display-name': 'hello'
            }));

            twitchClient._processChatMessage('abc', new events.Chat({
                'user-id': 123,
                'display-name': 'hello'
            }));

            sinon.assert.calledOnce(ping);
            sinon.assert.calledOnce(dataCacheAdd);
            sinon.assert.calledOnce(_ensureUserExists);
        });
    });

    it('disable/enable', () => {
        twitchClient._enabled = false;
        const updateViewerCacheStub = sinon.stub(twitchClient, 'updateViewersCache');
        twitchClient._enable();
        assert.isTrue(twitchClient._enabled);
        sinon.assert.calledOnce(updateViewerCacheStub);

        twitchClient._enable();
        assert.isTrue(twitchClient._enabled);
        sinon.assert.calledOnce(updateViewerCacheStub);

        twitchClient._disable();
        assert.isFalse(twitchClient._enabled)
        sinon.assert.calledOnce(updateViewerCacheStub);
    });

    it('_updateViewersCache', async () => {
        let queryStub = sinon.stub(api, 'queryTmiApi');
        twitchClient._enabled = false;
        await twitchClient._updateViewersCache();
        sinon.assert.notCalled(queryStub);
        sinon.assert.notCalled(eventSignals.dispatch);

        twitchClient._enabled = true;
        filter.setChannelInfo(undefined, undefined);
        await twitchClient._updateViewersCache();
        sinon.assert.notCalled(queryStub);
        sinon.assert.notCalled(eventSignals.dispatch);

        sinon.verifyAndRestore();
        filter.setChannelInfo('abc', 333);
        queryStub = sinon.stub(api, 'queryTmiApi').withArgs(`group/user/abc/chatters`).returns({
            chatters: 'data'
        });
        twitchClient._enabled = true;
        await twitchClient._updateViewersCache();
        sinon.assert.calledOnce(queryStub);
        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
            event: 'chatters.data.update',
            data: 'data',
            channelID: 333,
        }));
    });

    describe('changeToRandomFeaturedStream', () => {
        it('should be able to select a channel within range', async () => {
            sinon.stub(twitchClient._client, 'join').withArgs('two');
            sinon.stub(api, 'queryTwitchApi').
                withArgs('kraken/streams/featured?limit=100').
                returns({
                    featured: [{
                        stream: {
                            game: 'something',
                            viewers: 100,
                            channel: {
                                name: 'one',
                                _id: 222
                            }
                        }
                    }, {
                        stream: {
                            game: 'Music',
                            viewers: 500,
                            channel: {
                                name: 'two',
                                _id: 333
                            }
                        }
                    }, {
                        stream: {
                            game: 'another',
                            viewers: constants.MAX_VIEWERS_COUNTS_FOR_PROCESS + 1,
                            channel: {
                                name: 'three',
                                _id: 444
                            }
                        }
                    }]
                });

            await twitchClient.changeToRandomFeaturedStream();
            assert.equal(filter.getChannel(), 'two');
            assert.equal(filter.getChannelId(), 333);
        });

        it('should default to xqcow with any fails', async () => {
            sinon.stub(twitchClient._client, 'join').withArgs('xqcow');
            sinon.stub(api, 'queryTwitchApi').
                throws("something");

            await twitchClient.changeToRandomFeaturedStream();

            assert.equal(filter.getChannel(), 'xqcow');
            assert.equal(filter.getChannelId(), 71092938);
        });
    });

    it('saveChannel', () => {
        filter.setChannelInfo('abc', 111);
        twitchClient._saveChannel();

        assert.equal(localStorage.getItem('channel'), 'abc');
        assert.equal(localStorage.getItem('channel-id'), 111);
        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
            alert: {
                type: 'success',
                body: `Successfully saved channel`
            }
        }));
    });

    describe('_eventSignalFunc', () => {
        describe('filter.change', () => {
            it('changed search string', () => {
                const updateViewersCache = sinon.stub(twitchClient, 'updateViewersCache');
                twitchClient._eventSignalFunc({
                    event: 'filter.change',
                    changed: { searchString: '111' }
                });
                sinon.assert.calledOnce(updateViewersCache);
            });

            it('not changed search string', () => {
                const updateViewersCache = sinon.stub(twitchClient, 'updateViewersCache');
                twitchClient._eventSignalFunc({
                    event: 'filter.change',
                    changed: { intervalLevel: constants.BUCKET_MIN }
                });
                sinon.assert.notCalled(updateViewersCache);
            });
        });

        describe('stream.cleanup', () => {
            const _disable = sinon.stub(twitchClient, '_disable');
            twitchClient._eventSignalFunc({ event: 'stream.cleanup' });
            sinon.assert.calledOnce(_disable);
        });

        describe('stream.load.ready', () => {
            const _enable = sinon.stub(twitchClient, '_enable');
            twitchClient._eventSignalFunc({ event: 'stream.load.ready' });
            sinon.assert.calledOnce(_enable);
        });

        describe('channel.changed', () => {
            const changeChannel = sinon.stub(twitchClient, 'changeChannel').withArgs('new_channel');
            twitchClient._eventSignalFunc({ event: 'channel.changed', channel: 'new_channel' });
            sinon.assert.calledOnce(changeChannel);
        });
    });

    describe('isConnected', () => {
        it('client is not connected', () => {
            twitchClient._lastPingSuccess = false;
            sinon.stub(twitchClient._client, '_isConnected').returns(false);
            assert.isFalse(twitchClient.isConnected());
        });

        it('client is connected but missing channel', () => {
            twitchClient._lastPingSuccess = false;
            sinon.stub(twitchClient._client, '_isConnected').returns(true);
            twitchClient._client.channels = undefined;
            assert.isFalse(twitchClient.isConnected());
        });

        it('client is connected but channel is empty', () => {
            twitchClient._lastPingSuccess = false;
            sinon.stub(twitchClient._client, '_isConnected').returns(true);
            twitchClient._client.channels = [];
            assert.isFalse(twitchClient.isConnected());
        });

        it('client is connected and channel is valid', () => {
            twitchClient._lastPingSuccess = false;
            sinon.stub(twitchClient._client, '_isConnected').returns(true);
            twitchClient._client.channels = ['aaa'];
            assert.isFalse(twitchClient.isConnected());
        });

        it('client is connected and channel is valid and last ping is suscessful', () => {
            twitchClient._lastPingSuccess = true;
            sinon.stub(twitchClient._client, '_isConnected').returns(true);
            twitchClient._client.channels = ['aaa'];
            assert.isTrue(twitchClient.isConnected());
        });
    });

    describe('_ping', () => {
        it('client is not initialized', async () => {
            twitchClient._client = undefined;
            const ping = sinon.stub(twitchClient, 'ping');

            await twitchClient._ping();

            sinon.assert.calledOnce(ping);
            assert.isFalse(twitchClient._lastPingSuccess);
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: 'draw.nav.actvitiy-status' }));
        });

        it('client is initialized but failed ping', async () => {
            twitchClient._client = {
                ping: sinon.stub().throws('error')
            };
            const ping = sinon.stub(twitchClient, 'ping');

            await twitchClient._ping();

            sinon.assert.calledOnce(ping);
            assert.isFalse(twitchClient._lastPingSuccess);
            sinon.assert.calledOnce(twitchClient._client.ping);
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: 'draw.nav.actvitiy-status' }));
        });

        it('client is initialized but failed ping', async () => {
            twitchClient._client = {
                ping: sinon.stub()
            };
            const ping = sinon.stub(twitchClient, 'ping');

            await twitchClient._ping();

            sinon.assert.calledOnce(ping);
            assert.isTrue(twitchClient._lastPingSuccess);
            sinon.assert.calledOnce(twitchClient._client.ping);
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: 'draw.nav.actvitiy-status' }));
        });
    });

    describe('ping', () => {
        it('connected', () => {
            sinon.stub(twitchClient, 'isConnected').returns(true);
            const debouncedPing = sinon.stub(twitchClient, '_debouncedPing');
            const throttledPing = sinon.stub(twitchClient, '_throttledPing');

            twitchClient.ping();

            sinon.assert.calledOnce(debouncedPing);
            sinon.assert.notCalled(throttledPing);
        });

        it('disconnected', () => {
            sinon.stub(twitchClient, 'isConnected').returns(false);
            const debouncedPing = sinon.stub(twitchClient, '_debouncedPing');
            const throttledPing = sinon.stub(twitchClient, '_throttledPing');

            twitchClient.ping();

            sinon.assert.notCalled(debouncedPing);
            sinon.assert.calledOnce(throttledPing);
        });
    });
});