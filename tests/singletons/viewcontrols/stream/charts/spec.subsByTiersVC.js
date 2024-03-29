const sinon = require('sinon');
const { assert } = require('chai');

const subsByTiersVC = require('../../../../../js/singletons/viewcontrols/stream/charts/subsByTiersVC');
const users = require('../../../../../js/singletons/users');
const filter = require('../../../../../js/singletons/filter');
const testUtils = require('../../../../testUtils');


describe('subsByTiers.js', () => {
    beforeEach(() => {
        testUtils.reset();
        document.getElementById.withArgs('chart-subs-by-tiers').returns({});
        subsByTiersVC.reset();
    });

    describe('_eventSignalsFunc', () => {
        it('channel.input.update', () => {
            const reset = sinon.stub(subsByTiersVC, 'reset');
            subsByTiersVC._eventSignalsFunc({ event: 'filter.change', changed: { channel: 'a-channel' } });
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
            subsByTiersVC._chartObject.update = chartObjectUpdate;

            subsByTiersVC._enabled = true;
            subsByTiersVC._eventSignalsFunc({ event: 'fetch.channel.subscribed.refresh' });
            subsByTiersVC._enabled = false;
            subsByTiersVC._eventSignalsFunc({ event: 'fetch.channel.subscribed.refresh' });

            sinon.assert.calledOnce(chartObjectUpdate);
            sinon.assert.calledOnce(update);
        });
    });

    it('_defaultChartOptions', () => {
        assert.deepEqual(subsByTiersVC._defaultChartOptions(), {
            "data": {
                "datasets": [
                    {
                        "backgroundColor": "#F9E74B",
                        "borderColor": "##FBF08B",
                        "borderWidth": 1,
                        "data": [],
                        "label": "gifted by others",
                    },
                    {
                        "backgroundColor": "#4B5DF9",
                        "borderColor": "#8B96FB",
                        "borderWidth": 1,
                        "data": [],
                        "label": "own subscription",
                    },
                ],
                "labels": []
            },
            "options": {
                "animation": {
                    "duartion": 250
                },
                "hover": {
                    "animationDuration": 0
                },
                "maintainAspectRatio": false,
                "plugins": {
                    "legend": {
                        "display": false
                    },
                    "title": {
                        "display": true,
                        "fontSize": 18,
                        "text": "Subscription counts by tiers and gifts."
                    },
                },
                "responsive": true,
                "responsiveAnimationDuration": 250,
                "scales": {
                    "x": {
                        "stacked": true
                    },
                    "y": {
                        "stacked": true
                    }
                }
            },
            "type": "bar"
        });
    });

    it('_update', async () => {
        filter.setChannelInfo('abc', 111);
        sinon.stub(users, 'getSubscriptionsByTiers').withArgs().
            returns({
                1000: {
                    gifted: 0,
                    notGifted: 1
                },
                3000: {
                    gifted: 1,
                    notGifted: 2
                }
            });

        await subsByTiersVC._update();

        assert.deepEqual(subsByTiersVC._getRootLabels(), ['1000', '3000']);
        assert.deepEqual(subsByTiersVC._getDataset().map(dataset => dataset.data), [[0, 1], [1, 2]]);
    });

});