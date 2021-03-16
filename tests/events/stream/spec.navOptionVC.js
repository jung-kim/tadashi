
const { assert } = require('chai');
const _ = require('lodash');
const sinon = require('sinon');

const navOptionVC = require('../../../js/events/stream/navOptionVC');
const twitchAPI = require('../../../js/singletons/twitchAPI');
const twitchClient = require('../../../js/singletons/twitchClient');

describe('navOptionVC', () => {
    beforeEach(() => {
        reset();
        navOptionVC.lastSearchedChannel = undefined;
        navOptionVC.channelInputAutoComplete = undefined;
    });

    describe('_domSignalsFunc', () => {
        it('interval click', () => {
            const _intervalClickEvent = sinon.stub(navOptionVC, '_intervalClickEvent').withArgs('an-event');

            navOptionVC._domSignalsFunc({ type: 'click', id: 'one-interval', event: 'an-event' });

            sinon.assert.calledOnce(_intervalClickEvent);
        });

        describe('channel-input', () => {
            it('keyup', () => {
                const _onChannelInputKeyUp = sinon.stub(navOptionVC, '_onChannelInputKeyUp').withArgs('an-event');

                navOptionVC._domSignalsFunc({ type: 'keyup', id: 'channel-input', event: 'an-event' });

                sinon.assert.calledOnce(_onChannelInputKeyUp);
            });

            it('click', () => {
                const _refreshList = sinon.stub(navOptionVC, '_refreshList');

                navOptionVC._domSignalsFunc({ type: 'click', id: 'channel-input' });

                sinon.assert.calledOnce(_refreshList);
            });

            it('focusout', () => {
                const syncChannelInput = sinon.stub(navOptionVC, 'syncChannelInput');

                navOptionVC._domSignalsFunc({ type: 'focusout', id: 'channel-input' });

                sinon.assert.calledOnce(syncChannelInput);
            });

            it('channel.input.update', () => {
                const syncChannelInput = sinon.stub(navOptionVC, 'syncChannelInput');

                navOptionVC._domSignalsFunc({ type: 'channel.input.update', id: 'channel-input' });

                sinon.assert.calledOnce(syncChannelInput);
            })
        });

        it('channel-refresh click', () => {
            const changeToRandomFeaturedStream = sinon.stub(twitchClient, 'changeToRandomFeaturedStream');

            navOptionVC._domSignalsFunc({ type: 'click', id: 'channel-refresh' });

            sinon.assert.calledOnce(changeToRandomFeaturedStream);
        });

        it('channel-save click', () => {
            const saveChannel = sinon.stub(twitchClient, 'saveChannel');

            navOptionVC._domSignalsFunc({ type: 'click', id: 'channel-save' });

            sinon.assert.calledOnce(saveChannel);
        });
    });

    describe('_onChannelInputKeyUp', () => {
        describe('enter or awesomeComplete select event', () => {
            it('enter', () => {
                navOptionVC.channelInputAutoComplete = { input: { value: 'a-channel' } };
                const streamSelect = sinon.stub(navOptionVC, 'streamSelect');
                const _refreshList = sinon.stub(navOptionVC, '_refreshList');

                navOptionVC._onChannelInputKeyUp({ keyCode: 13 });

                sinon.assert.calledOnce(streamSelect);
                assert.equal(navOptionVC.lastSearchedChannel, 'a-channel');
                sinon.assert.notCalled(_refreshList);
            });

            it('awesomeComplete select event', () => {
                navOptionVC.channelInputAutoComplete = { input: { value: 'a-channel' } };
                const streamSelect = sinon.stub(navOptionVC, 'streamSelect');
                const _refreshList = sinon.stub(navOptionVC, '_refreshList');

                navOptionVC._onChannelInputKeyUp({ awesompleteSelect: true });

                sinon.assert.calledOnce(streamSelect);
                assert.equal(navOptionVC.lastSearchedChannel, 'a-channel');
                sinon.assert.notCalled(_refreshList);
            });
        });

        it('other events', () => {
            const _refreshList = sinon.stub(navOptionVC, '_refreshList');
            const streamSelect = sinon.stub(navOptionVC, 'streamSelect');

            navOptionVC._onChannelInputKeyUp({});


            sinon.assert.notCalled(streamSelect);
            assert.isUndefined(navOptionVC.lastSearchedChannel);
            sinon.assert.calledOnce(_refreshList);
        });
    });

    describe('_refreshList', () => {
        it('current channel is same as last searched channel, just open it', () => {
            const open = sinon.stub();
            navOptionVC.channelInputAutoComplete = { input: { value: 'a-channel' }, open: open };
            navOptionVC.lastSearchedChannel = 'a-channel';
            const fetchList = sinon.stub(navOptionVC, 'fetchList');

            navOptionVC._refreshList();

            sinon.assert.calledOnce(open);
            sinon.assert.notCalled(fetchList);
            assert.equal(navOptionVC.lastSearchedChannel, 'a-channel');
        });

        it('current channel is different, fetch it', () => {
            const open = sinon.stub();
            navOptionVC.channelInputAutoComplete = { input: { value: 'a-channel' }, open: open };
            navOptionVC.lastSearchedChannel = 'b-channel';
            const fetchList = sinon.stub(navOptionVC, 'fetchList');

            navOptionVC._refreshList();

            sinon.assert.notCalled(open);
            sinon.assert.calledOnce(fetchList);
            assert.equal(navOptionVC.lastSearchedChannel, 'a-channel');
        });
    });

    it('_fetchList', async () => {
        navOptionVC.lastSearchedChannel = 'a-channel';
        navOptionVC.channelInputAutoComplete = {};
        const getChannelSearch = sinon.stub(twitchAPI, 'getChannelSearch').withArgs('a-channel').returns({
            data: [{ display_name: 'aaa' }, { display_name: 'bbb' }]
        });

        await navOptionVC._fetchList();

        sinon.assert.calledOnce(getChannelSearch);
        assert.deepEqual(navOptionVC.channelInputAutoComplete.list, ['aaa', 'bbb']);
    });

    describe('_streamSelect', async () => {

        it('success', async () => {
            navOptionVC.lastSearchedChannel = 'a-channel';
            const changeChannel = sinon.stub(twitchClient, 'changeChannel').withArgs('a-channel');
            const populateStreamInfo = sinon.stub(navOptionVC, 'populateStreamInfo');
            const close = sinon.stub();
            navOptionVC.channelInputAutoComplete = { close: close };

            await navOptionVC._streamSelect();

            sinon.assert.calledOnce(changeChannel);
            sinon.assert.calledOnce(populateStreamInfo);
            sinon.assert.calledOnce(close);
        });

        it('fail', async () => {
            navOptionVC.lastSearchedChannel = 'a-channel';
            const changeChannel = sinon.stub(twitchClient, 'changeChannel').throws('something');
            const populateStreamInfo = sinon.stub(navOptionVC, 'populateStreamInfo');
            const close = sinon.stub();
            navOptionVC.channelInputAutoComplete = { close: close };

            await navOptionVC._streamSelect();

            sinon.assert.calledOnce(changeChannel);
            sinon.assert.notCalled(populateStreamInfo);
            sinon.assert.calledOnce(close);
        });
    });

    describe('_populateStreamInfo', () => {
        it('success', async () => {
            sinon.stub(twitchClient, 'getChannel').returns('a-channel');
            navOptionVC.channelInputAutoComplete = { input: {} };

            const channelDom = {}, descDomc = {};
            document.getElementById = sinon.stub();
            document.getElementById.withArgs('embeded-twitch-channel').returns(channelDom);
            document.getElementById.withArgs('embeded-twitch-desc').returns(descDomc);

            sinon.stub(twitchAPI, 'getChannelInfo').withArgs('a-channel').returns({
                data: [{ title: 'a-title' }]
            });

            await navOptionVC._populateStreamInfo();

            assert.equal(channelDom.innerText, 'a-channel');
            assert.equal(descDomc.innerHTML, 'a-title');
        });

        it('inactive', async () => {
            sinon.stub(twitchClient, 'getChannel').returns('a-channel');
            navOptionVC.channelInputAutoComplete = { input: {} };

            const channelDom = {}, descDomc = {};
            document.getElementById = sinon.stub();
            document.getElementById.withArgs('embeded-twitch-channel').returns(channelDom);
            document.getElementById.withArgs('embeded-twitch-desc').returns(descDomc);

            sinon.stub(twitchAPI, 'getChannelInfo').withArgs('a-channel').returns({
                data: undefined
            });

            await navOptionVC._populateStreamInfo();

            assert.equal(channelDom.innerText, 'a-channel');
            assert.equal(descDomc.innerHTML, '(inactive...)');
        });


        it('fail', async () => {
            sinon.stub(twitchClient, 'getChannel').returns('a-channel');
            navOptionVC.channelInputAutoComplete = { input: {} };

            const channelDom = {}, descDomc = {};
            document.getElementById = sinon.stub();
            document.getElementById.withArgs('embeded-twitch-channel').returns(channelDom);
            document.getElementById.withArgs('embeded-twitch-desc').returns(descDomc);

            sinon.stub(twitchAPI, 'getChannelInfo').withArgs('a-channel').throws('something');

            await navOptionVC._populateStreamInfo();

            assert.equal(channelDom.innerText, 'a-channel');
            assert.equal(descDomc.innerHTML, 'a-channel\'s stream');
        });
    });
});