
const { assert } = require('chai');
const _ = require('lodash');
const sinon = require('sinon');

const navOptionVC = require('../../../js/events/stream/navOptionVC');
const twitchClient = require('../../../js/singletons/twitchClient');

describe('navOptionVC', () => {
    beforeEach(() => { reset() });

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
});