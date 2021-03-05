const { assert } = require('chai');
const sinon = require('sinon');
const tmi = require('tmi.js');
const constants = require('../../js/helpers/constants');

const auth = require('../../js/simpletons/auth');
const twitchClient = require("../../js/singletons/twitchClient");
const api = require("../../js/simpletons/api");
const dataCache = require('../../js/simpletons/dataCache');


describe('twitchClient.js', () => {
    beforeEach(() => {
        twitchClient._channel = undefined;
        twitchClient._channelID = undefined;
    });

    afterEach(() => {
        twitchClient._disable();
        reset();
    });

    describe('initializeClient', () => {
        let fakeClient = twitchClient._client;

        afterEach(() => {
            twitchClient._initPromise = undefined;
            twitchClient._client = fakeClient;
            twitchClient.channel = undefined;
            twitchClient._channelID = undefined;
            localStorage.clear();
            reset();
        });

        it('run while initializing', async () => {
            twitchClient._initPromise = new Promise((resolve) => {
                setTimeout(resolve, 500);
            });

            const start = Date.now();
            await twitchClient.initializeClient();
            assert.isTrue(Date.now() - start >= 500);
        });

        it('run after intialized', async () => {
            const getChannelStub = sinon.stub(twitchClient, 'getChannel');

            twitchClient._client = 'abc';
            await twitchClient.initializeClient();
            assert.equal(twitchClient._client, 'abc');
            sinon.assert.notCalled(getChannelStub);
        });

        it('channel and ID is in localstorage', async () => {
            twitchClient._client = undefined;
            const fakeClient = { connect: sinon.stub(), on: () => { } };

            sinon.stub(localStorage, 'getItem')
                .withArgs('channel').returns('hi')
                .withArgs('channel-id').returns('99');
            sinon.stub(tmi, 'Client')
                .callThroughWithNew()
                .withArgs(sinon.match.any)
                .returns(fakeClient);

            await twitchClient.initializeClient();

            assert.equal(twitchClient._channel, 'hi');
            assert.equal(twitchClient._channelID, 99);
            sinon.assert.calledOnce(fakeClient.connect);
        });

        it('broadcaster user init', async () => {
            twitchClient._client = undefined;
            const fakeClient = { connect: sinon.stub(), on: () => { } };

            sinon.stub(auth, 'isBroadcaster').returns(true);
            sinon.stub(auth, 'getLogin').returns('someone');
            sinon.stub(auth, 'getID').returns(123);
            sinon.stub(tmi, 'Client')
                .callThroughWithNew()
                .withArgs(sinon.match.any)
                .returns(fakeClient);

            await twitchClient.initializeClient();

            assert.equal(twitchClient._channel, 'someone');
            assert.equal(twitchClient._channelID, 123);
            sinon.assert.calledOnce(fakeClient.connect);
        });

        it('default user init', async () => {
            twitchClient._client = undefined;
            const fakeClient = { connect: sinon.stub(), on: () => { } };

            sinon.stub(tmi, 'Client')
                .callThroughWithNew()
                .withArgs(sinon.match.any)
                .returns(fakeClient);
            await twitchClient.initializeClient();

            sinon.assert.calledOnce(fakeClient.connect);
            assert.equal(twitchClient._channel, constants.DEFAULT_CHANNEL);
            assert.equal(twitchClient._channelID, constants.DEFAULT_CHANNEL_ID);
        });
    });

    describe('changeChannel()', () => {
        it('change channel from undefined', async () => {
            let joinStub = sinon.stub(twitchClient._client, 'join').withArgs('abcde');
            let partStub = sinon.stub(twitchClient._client, 'part');
            let updateViewerCacheStub = sinon.stub(twitchClient, 'updateViewersCache');
            await twitchClient.changeChannel('abcde', 5);
            sinon.assert.calledOnce(joinStub);
            sinon.assert.notCalled(partStub);
            sinon.assert.calledOnce(updateViewerCacheStub);
            assert.equal(twitchClient._channel, 'abcde');
            assert.equal(twitchClient._channelID, 5);
        });

        it('from same channel', async () => {
            twitchClient._channel = 'abcde'
            let joinStub = sinon.stub(twitchClient._client, 'join');
            let partStub = sinon.stub(twitchClient._client, 'part');
            let updateViewerCacheStub = sinon.stub(twitchClient, 'updateViewersCache');
            await twitchClient.changeChannel('abcde');
            sinon.assert.notCalled(joinStub);
            sinon.assert.notCalled(partStub);
            sinon.assert.notCalled(updateViewerCacheStub);
            assert.equal(twitchClient._channel, 'abcde');
        });

        it('from same channel from another channel', async () => {
            twitchClient._channel = '1111';
            twitchClient._channelID = 1111;
            let joinStub = sinon.stub(twitchClient._client, 'join').withArgs('abcde');
            let partStub = sinon.stub(twitchClient._client, 'part').withArgs('1111');
            let updateViewerCacheStub = sinon.stub(twitchClient, 'updateViewersCache');
            await twitchClient.changeChannel('abcde', 5);
            sinon.assert.calledOnce(joinStub);
            sinon.assert.calledOnce(partStub);
            sinon.assert.calledOnce(updateViewerCacheStub);
            assert.equal(twitchClient._channel, 'abcde');
            assert.equal(twitchClient._channelID, 5);
        });
    });

    describe('_processChatMessage', () => {
        class test {
            constructor(a, b, c) {
                this.a = a;
                this.b = b;
                this.c = c;
            }
        }

        it('enabled', () => {
            twitchClient._enable();
            const cacheAddStub = sinon.stub(dataCache, 'add').withArgs('abc', new test(1, 2, 3));
            twitchClient._processChatMessage('#abc', test, 1, 2, 3);
            sinon.assert.calledOnce(cacheAddStub);
        });

        it('disabled', () => {
            twitchClient._disable();
            const cacheAddStub = sinon.stub(dataCache, 'add').withArgs('abc', new test(1));
            twitchClient._processChatMessage('abc', test, 1);
            sinon.assert.calledOnce(cacheAddStub);
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

    it('_updateViewersCache', () => {
        let queryStub = sinon.stub(api, 'queryTmiApi');
        twitchClient._enabled = false;
        twitchClient._updateViewersCache();
        sinon.assert.notCalled(queryStub);

        twitchClient._enabled = true;
        sinon.stub(twitchClient, 'getChannel').returns(undefined);
        twitchClient._updateViewersCache();
        sinon.assert.notCalled(queryStub);

        sinon.verifyAndRestore();
        queryStub = sinon.stub(api, 'queryTmiApi').withArgs(`group/user/abc/chatters`);
        twitchClient._enabled = true;
        sinon.stub(twitchClient, 'getChannel').returns('abc');
        twitchClient._updateViewersCache();
        sinon.assert.calledOnce(queryStub);
    });

    it('_setChannel', () => {
        twitchClient._setChannel('abc');
        assert.equal(twitchClient._channel, 'abc');
    });

    it('_setChannelID', async () => {
        await twitchClient._setChannelID(123);
        assert.equal(twitchClient._channelID, 123);


        sinon.stub(twitchClient, 'getChannel').returns('abc');
        sinon.stub(api, 'queryTwitchApi')
            .withArgs(`kraken/users?login=abc`)
            .returns({ users: [{ _id: '111' }] });
        await twitchClient._setChannelID();
        assert.equal(twitchClient._channelID, 111);

        sinon.verifyAndRestore();

        sinon.stub(twitchClient, 'getChannel').returns(undefined);
        await twitchClient._setChannelID();
        assert.equal(twitchClient._channelID, 111);
    });

    describe('changeToRandomFeaturedStream', () => {
        it('should be able to select a channel within range', async () => {
            sinon.stub(twitchClient._client, 'join').withArgs('two');
            sinon.stub(api, 'queryTwitchApi')
                .withArgs('kraken/streams/featured?limit=100')
                .returns({
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
            assert.equal(twitchClient.getChannel(), 'two');
            assert.equal(twitchClient.getChannelID(), 333);
        });

        it('should default to xqcow with any fails', async () => {
            sinon.stub(twitchClient._client, 'join').withArgs('xqcow');
            sinon.stub(api, 'queryTwitchApi')
                .throws("something");

            await twitchClient.changeToRandomFeaturedStream();

            assert.equal(twitchClient.getChannel(), 'xqcow');
            assert.equal(twitchClient.getChannelID(), 71092938);
        });
    });

    it('getChannel', () => {
        twitchClient._channel = 'abc'
        assert.equal(twitchClient.getChannel(), 'abc');
    });

    it('getChannelID', () => {
        twitchClient._channel = 77
        assert.equal(twitchClient.getChannel(), 77);
    });

    it('saveChannel', () => {
        twitchClient._channelID = 111;
        twitchClient._channel = 'abc'
        twitchClient._saveChannel();

        localStorage.getItem('channel', 'abc');
        localStorage.getItem('channel-id', 111);
    });
});