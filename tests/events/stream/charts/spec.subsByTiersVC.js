const sinon = require('sinon');
const { assert } = require('chai');

const subsByTiersVC = require('../../../../js/events/stream/charts/subsByTiersVC');


describe('chatsByUsersVC.js', () => {
    afterEach(() => {
        reset();
    });

    describe('_eventSignalsFunc', () => {
        it('channel.input.update', () => {
            const reset = sinon.stub(subsByTiersVC, 'reset');
            subsByTiersVC._eventSignalsFunc({ event: 'channel.input.update' });
            sinon.assert.calledOnce(reset);
        });

        it('stream.load.ready', () => {
            const reset = sinon.stub(subsByTiersVC, 'reset');
            subsByTiersVC._eventSignalsFunc({ event: 'stream.load.ready' });
            sinon.assert.calledOnce(reset);
            assert.equal(subsByTiersVC._enabled, true);
        });

        it('stream.cleanup', () => {
            subsByTiersVC._eventSignalsFunc({ event: 'stream.cleanup' });
            assert.equal(subsByTiersVC._enabled, false);
        });

        it('fetch.channel.subscribed.refresh', () => {
            const update = sinon.stub(subsByTiersVC, 'update');
            const chartObjectUpdate = sinon.stub();
            subsByTiersVC._chartObject = { update: chartObjectUpdate };

            subsByTiersVC._enabled = true;
            subsByTiersVC._eventSignalsFunc({ event: 'fetch.channel.subscribed.refresh' });
            subsByTiersVC._enabled = false;
            subsByTiersVC._eventSignalsFunc({ event: 'fetch.channel.subscribed.refresh' });

            sinon.assert.calledOnce(chartObjectUpdate);
            sinon.assert.calledOnce(update);
        });
    });

});