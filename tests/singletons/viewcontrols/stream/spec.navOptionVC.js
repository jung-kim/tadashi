
const { assert } = require('chai');
const sinon = require('sinon');

const navOptionVC = require('../../../../js/singletons/viewcontrols/stream/navOptionVC');
const constants = require('../../../../js/helpers/constants');
const api = require('../../../../js/singletons/api');
const auth = require('../../../../js/singletons/auth');
const twitchClient = require('../../../../js/singletons/twitchClient');
const eventSignals = require('../../../../js/helpers/signals').eventSignals;
const testUtils = require('../../../testUtils');
const filter = require('../../../../js/singletons/filter');

describe('navOptionVC', () => {
    beforeEach(() => {
        testUtils.reset();
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
        sinon.stub(auth, 'getAuthObj').returns('auth-obj');
        const getChannelSearch = sinon.stub(api, 'getChannelSearch').withArgs('a-channel', 'auth-obj').returns({
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
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({
                alert: {
                    type: 'warning',
                    body: sinon.match.any,
                }
            }))
        });
    });

    describe('_populateStreamInfo', () => {
        it('success', async () => {
            filter.setChannelInfo('a-channel', 111);
            navOptionVC.channelInputAutoComplete = { input: {} };

            const channelDom = {},
                descDomc = {};
            document.getElementById = sinon.stub();
            document.getElementById.withArgs('embeded-twitch-channel').returns(channelDom);
            document.getElementById.withArgs('embeded-twitch-desc').returns(descDomc);

            sinon.stub(auth, 'getAuthObj').returns('auth-obj');
            sinon.stub(api, 'getChannelInfo').withArgs('a-channel', 'auth-obj').returns({
                data: [{ title: 'a-title' }]
            });

            await navOptionVC._populateStreamInfo();

            assert.equal(channelDom.innerText, 'a-channel');
            assert.equal(descDomc.innerHTML, 'a-title');
        });

        it('inactive', async () => {
            filter.setChannelInfo('a-channel', 111);
            navOptionVC.channelInputAutoComplete = { input: {} };

            const channelDom = {},
                descDomc = {};
            document.getElementById = sinon.stub();
            document.getElementById.withArgs('embeded-twitch-channel').returns(channelDom);
            document.getElementById.withArgs('embeded-twitch-desc').returns(descDomc);

            sinon.stub(auth, 'getAuthObj').returns('auth-obj');
            sinon.stub(api, 'getChannelInfo').withArgs('a-channel', 'auth-obj').returns({
                data: undefined
            });

            await navOptionVC._populateStreamInfo();

            assert.equal(channelDom.innerText, 'a-channel');
            assert.equal(descDomc.innerHTML, '(inactive...)');
        });


        it('fail', async () => {
            filter.setChannelInfo('a-channel', 111);
            navOptionVC.channelInputAutoComplete = { input: {} };

            const channelDom = {},
                descDomc = {};
            document.getElementById = sinon.stub();
            document.getElementById.withArgs('embeded-twitch-channel').returns(channelDom);
            document.getElementById.withArgs('embeded-twitch-desc').returns(descDomc);

            sinon.stub(auth, 'getAuthObj').returns('auth-obj');
            sinon.stub(api, 'getChannelInfo').withArgs('a-channel', 'auth-obj').throws('something');

            await navOptionVC._populateStreamInfo();

            assert.equal(channelDom.innerText, 'a-channel');
            assert.equal(descDomc.innerHTML, 'a-channel\'s stream');
        });
    });


    describe('_intervalClickEvent', () => {
        it('1min', () => {
            const btn = {};
            document.getElementById.withArgs('interval-selector-btn').returns(btn);
            const update = sinon.stub(filter, 'setIntervalLevel').withArgs(constants.BUCKET_MIN);

            navOptionVC._intervalClickEvent({ srcElement: { innerHTML: '1 minute' } });

            sinon.assert.calledOnce(update);
        });

        it('5min', () => {
            const btn = {};
            document.getElementById.withArgs('interval-selector-btn').returns(btn);
            const update = sinon.stub(filter, 'setIntervalLevel').withArgs(constants.BUCKET_FIVE);

            navOptionVC._intervalClickEvent({ srcElement: { innerHTML: '5 minutes' } });

            sinon.assert.calledOnce(update);
        });

        it('1hour', () => {
            const btn = {};
            document.getElementById.withArgs('interval-selector-btn').returns(btn);
            const update = sinon.stub(filter, 'setIntervalLevel').withArgs(constants.BUCKET_HOUR);

            navOptionVC._intervalClickEvent({ srcElement: { innerHTML: '1 hour' } });

            sinon.assert.calledOnce(update);
        });

        it('1day', () => {
            const btn = {};
            document.getElementById.withArgs('interval-selector-btn').returns(btn);
            const update = sinon.stub(filter, 'setIntervalLevel').withArgs(constants.BUCKET_DAY);

            navOptionVC._intervalClickEvent({ srcElement: { innerHTML: '1 day' } });

            sinon.assert.calledOnce(update);
        });
    });

    it('initialize', () => {
        const destroy = sinon.stub(navOptionVC, 'destroy');
        Awesomplete.returns({ input: { addEventListener: sinon.stub() } });

        document.getElementById.withArgs('nav-options').returns({});

        navOptionVC.initialize();

        assert.equal(navOptionVC.toDsipose.length, 4);
        sinon.assert.calledOnce(destroy);
    });

    it('destroy', () => {
        const channelInputAutoCompleteDestroy = sinon.stub();
        navOptionVC.channelInputAutoComplete = { destroy: channelInputAutoCompleteDestroy };

        navOptionVC.toDsipose = [{
            dispose: sinon.stub(),
        },
        {
            dispose: sinon.stub()
        }];

        navOptionVC.destroy();

        assert.isUndefined(navOptionVC.channelInputAutoComplete);
        sinon.assert.calledOnce(channelInputAutoCompleteDestroy);

        for (let i = 0; i < navOptionVC.toDsipose.length; i++) {
            sinon.assert.calledOnce(navOptionVC.toDsipose[i].dispose);
        }
    });
});