const { assert } = require('chai');
const sinon = require('sinon');
const constants = require('../../js/helpers/constants');

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

    describe('changeChannel()', () => {
        it('change channel from undefined', async () => {
            sinon.stub(twitchClient, 'getChannel').returns(undefined)
            let joinStub = sinon.stub(twitchClient._client, 'join').withArgs('abcde');
            let setChannelStub = sinon.stub(twitchClient, '_setChannel').withArgs('abcde');
            let partStub = sinon.stub(twitchClient._client, 'part');
            let setChannelIDStub = sinon.stub(twitchClient, '_setChannelID');
            let updateViewerCacheStub = sinon.stub(twitchClient, 'updateViewersCache');
            await twitchClient.changeChannel('abcde');
            sinon.assert.calledOnce(joinStub);
            sinon.assert.calledOnce(setChannelStub);
            sinon.assert.notCalled(partStub);
            sinon.assert.calledOnce(setChannelIDStub);
            sinon.assert.calledOnce(updateViewerCacheStub);
        });

        it('from same channel', async () => {
            sinon.stub(twitchClient, 'getChannel').returns('abcde')
            let joinStub = sinon.stub(twitchClient._client, 'join').withArgs('abcde');
            let setChannelStub = sinon.stub(twitchClient, '_setChannel').withArgs('abcde');
            let partStub = sinon.stub(twitchClient._client, 'part');
            let setChannelIDStub = sinon.stub(twitchClient, '_setChannelID');
            let updateViewerCacheStub = sinon.stub(twitchClient, 'updateViewersCache');
            await twitchClient.changeChannel('abcde');
            sinon.assert.notCalled(joinStub);
            sinon.assert.notCalled(setChannelStub);
            sinon.assert.notCalled(partStub);
            sinon.assert.notCalled(setChannelIDStub);
            sinon.assert.notCalled(updateViewerCacheStub);
        });

        it('from same channel from another channel', async () => {
            sinon.stub(twitchClient, 'getChannel').returns('1111')
            let joinStub = sinon.stub(twitchClient._client, 'join').withArgs('abcde');
            let setChannelStub = sinon.stub(twitchClient, '_setChannel').withArgs('abcde');
            let partStub = sinon.stub(twitchClient._client, 'part').withArgs('1111');
            let setChannelIDStub = sinon.stub(twitchClient, '_setChannelID');
            let updateViewerCacheStub = sinon.stub(twitchClient, 'updateViewersCache');
            await twitchClient.changeChannel('abcde');
            sinon.assert.calledOnce(joinStub);
            sinon.assert.calledOnce(setChannelStub);
            sinon.assert.calledOnce(partStub);
            sinon.assert.calledOnce(setChannelIDStub);
            sinon.assert.calledOnce(updateViewerCacheStub);
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
            const emitStub = sinon.stub(twitchClient, '_emitDataChange');
            const cacheAddStub = sinon.stub(dataCache, 'add').withArgs('abc', new test(1, 2, 3));
            twitchClient._processChatMessage('#abc', test, 1, 2, 3);
            sinon.assert.calledOnce(cacheAddStub);
            sinon.assert.calledOnce(emitStub);
        });

        it('disabled', () => {
            twitchClient._disable();
            const emitStub = sinon.stub(twitchClient, '_emitDataChange');
            const cacheAddStub = sinon.stub(dataCache, 'add').withArgs('abc', new test(1));
            twitchClient._processChatMessage('abc', test, 1);
            sinon.assert.calledOnce(cacheAddStub);
            sinon.assert.notCalled(emitStub);
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
        assert.equal(localStorage.getItem('channel'), 'abc');
    });

    it('_setChannelID', async () => {
        await twitchClient._setChannelID(123);
        assert.equal(twitchClient._channelID, 123);
        assert.equal(localStorage.getItem('channel-id'), 123);


        sinon.stub(twitchClient, 'getChannel').returns('abc');
        sinon.stub(api, 'queryTwitchApi')
            .withArgs(`kraken/users?login=abc`)
            .returns({ users: [{ _id: '111' }] });
        await twitchClient._setChannelID();
        assert.equal(twitchClient._channelID, 111);
        assert.equal(localStorage.getItem('channel-id'), 111);

        sinon.verifyAndRestore();

        sinon.stub(twitchClient, 'getChannel').returns(undefined);
        await twitchClient._setChannelID();
        assert.equal(twitchClient._channelID, 111);
        assert.equal(localStorage.getItem('channel-id'), 111);
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
});