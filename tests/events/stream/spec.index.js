
const { assert } = require('chai');
const sinon = require('sinon');

const _eventSignalsFunc = require('../../../js/events/stream');
const chattersTableVC = require('../../../js/events/stream/chattersTableVC');
const dateTimeRangeVC = require('../../../js/events/stream/dateTimeRangeVC');
const navOptionVC = require('../../../js/events/stream/navOptionVC');
const twitchEmbededVC = require('../../../js/events/stream/twitchEmbededVC');
const eventSignals = require('../../../js/helpers/signals').eventSignals;
const testUtils = require('../../testUtils');

describe('stream/index.js', () => {
    beforeEach(() => { testUtils.reset() });

    it('stream.load', () => {
        const chattersTableInit = sinon.stub(chattersTableVC, 'initialize');
        const navOptionStreamInfo = sinon.stub(navOptionVC, 'populateStreamInfo');
        const navOptionInit = sinon.stub(navOptionVC, 'initialize');
        const twitchEmbededInit = sinon.stub(twitchEmbededVC, 'initialize');
        const dateTimeRangeInit = sinon.stub(dateTimeRangeVC, 'initialize');
        const dispatch = eventSignals.dispatch.withArgs({ event: 'stream.load.ready' });

        const main = {}
        document.getElementById.withArgs('main').returns(main);

        _eventSignalsFunc({ event: 'stream.load' });

        assert.isString(main.innerHTML);

        sinon.assert.calledOnce(dispatch);
        sinon.assert.calledOnce(chattersTableInit);
        sinon.assert.calledOnce(navOptionStreamInfo);
        sinon.assert.calledOnce(navOptionInit);
        sinon.assert.calledOnce(twitchEmbededInit);
        sinon.assert.calledOnce(dateTimeRangeInit);
    });

    it('chatters.data.update.data', () => {
        const loadChattersTable = sinon.stub(chattersTableVC, 'loadChattersTable');
        _eventSignalsFunc({ event: 'chatters.data.update.data' });
        sinon.assert.calledOnce(loadChattersTable);
    });

    describe('filter.change', () => {
        it('not changed', () => {
            const loadChattersTable = sinon.stub(chattersTableVC, 'loadChattersTable');
            const populateStreamInfo = sinon.stub(navOptionVC, 'populateStreamInfo');
            _eventSignalsFunc({ event: 'filter.change' });
            sinon.assert.notCalled(loadChattersTable);
            sinon.assert.notCalled(populateStreamInfo);
        });

        it('changed filter', () => {
            const loadChattersTable = sinon.stub(chattersTableVC, 'loadChattersTable');
            const populateStreamInfo = sinon.stub(navOptionVC, 'populateStreamInfo');
            _eventSignalsFunc({ event: 'filter.change', changed: { filter: true } });
            sinon.assert.calledOnce(loadChattersTable);
            sinon.assert.notCalled(populateStreamInfo);
        });

        it('changed channel', () => {
            const loadChattersTable = sinon.stub(chattersTableVC, 'loadChattersTable');
            const populateStreamInfo = sinon.stub(navOptionVC, 'populateStreamInfo');
            _eventSignalsFunc({ event: 'filter.change', changed: { channel: true } });
            sinon.assert.notCalled(loadChattersTable);
            sinon.assert.calledOnce(populateStreamInfo);
        });

        it('changed filter and channel', () => {
            const loadChattersTable = sinon.stub(chattersTableVC, 'loadChattersTable');
            const populateStreamInfo = sinon.stub(navOptionVC, 'populateStreamInfo');
            _eventSignalsFunc({ event: 'filter.change', changed: { filter: true, channel: true } });
            sinon.assert.calledOnce(loadChattersTable);
            sinon.assert.calledOnce(populateStreamInfo);
        });
    });

    it('main.minute', () => {
        const populateStreamInfo = sinon.stub(navOptionVC, 'populateStreamInfo');

        _eventSignalsFunc({ event: 'main.minute' });

        sinon.assert.calledOnce(populateStreamInfo);
    });

    it('date.change', () => {
        const setDate = sinon.stub(dateTimeRangeVC, 'setDate');

        _eventSignalsFunc({ event: 'date.change' });

        sinon.assert.calledOnce(setDate);
    });


    it('main.minute.top', () => {
        const minProgressed = sinon.stub(dateTimeRangeVC, 'minProgressed');

        _eventSignalsFunc({ event: 'main.minute.top' });

        sinon.assert.calledOnce(minProgressed);
    });

    it('channel.input.update', () => {
        const populateStreamInfo = sinon.stub(navOptionVC, 'populateStreamInfo');

        _eventSignalsFunc({ event: 'filter.change', changed: { channel: 'a-channel' } });

        sinon.assert.calledOnce(populateStreamInfo);
    });

    it('stream.cleanup', () => {
        const navDestroy = sinon.stub(navOptionVC, 'destroy');
        const dateTimeDestroy = sinon.stub(dateTimeRangeVC, 'destroy');
        const chattersDestroy = sinon.stub(chattersTableVC, 'destroy');

        _eventSignalsFunc({ event: 'stream.cleanup' });

        sinon.assert.calledOnce(navDestroy);
        sinon.assert.calledOnce(dateTimeDestroy);
        sinon.assert.calledOnce(chattersDestroy);
    });

    it('chatters.data.update.partial', () => {
        const updateChattersList = sinon.stub(chattersTableVC, 'updateChattersList');

        _eventSignalsFunc({ event: 'chatters.data.update.partial' });

        sinon.assert.calledOnce(updateChattersList);
    });
});