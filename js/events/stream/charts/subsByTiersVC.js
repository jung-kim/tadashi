const ChartRoot = require('./ChartRoot');

const chartSubsByTiersHelperContent = `<p>Subscription counts grouped by tiers and gifts.</p>`
const twitchClient = require('../../../singletons/twitchClient');
const chartFilter = require('../../shared/chartFilter');
const users = require('../../../singletons/users');

class SubsByTiersVC extends ChartRoot {
    constructor() {
        super({
            type: 'bar',
            chartDomSelector: 'chart-subs-by-tiers',
            title: 'Subscription counts by tiers and gifts.',
            helpContent: chartSubsByTiersHelperContent,
        });
    }

    _eventSignalsFunc(payload) {
        switch (payload.event) {
            case 'channel.input.update':
                this.reset();
                break;
            case 'stream.load.ready':
                this._enabled = true;
                this.reset();
                break;
            case 'stream.cleanup':
                this._enabled = false;
                break;
            case 'fetch.channel.subscribed.refresh':
                if (this._enabled) {
                    this.update();
                    this._chartObject.update();
                }
                break;
        }
    }

    _defaultChartOptions() {
        const defaultValue = super._defaultChartOptions();

        defaultValue.data.datasets = [
            {
                data: [],
                backgroundColor: '#F9E74B',
                borderColor: '##FBF08B',
                borderWidth: 1,
                label: 'gifted by others',
            },
            {
                data: [],
                backgroundColor: '#4B5DF9',
                borderColor: '#8B96FB',
                borderWidth: 1,
                label: 'own subscription',
            },
        ]

        defaultValue.options.scales = {
            x: {
                stacked: true,
            },
            y: {
                stacked: true
            }
        }

        return defaultValue;
    }


    async _update() {
        const currentStreamerID = twitchClient.getChannelID();
        const userFilter = chartFilter.getUserFilter();
        const subscribeByTiers = users.getSubscriptionsByTiers(currentStreamerID, userFilter);

        const labels = this._getRootLabels();
        const datasets = this._getDataset();

        Object.keys(subscribeByTiers).
            sort((a, b) => a - b).
            forEach((key, index) => {
                labels[index] = key;
                datasets[0].data[index] = subscribeByTiers[key].gifted;
                datasets[1].data[index] = subscribeByTiers[key].notGifted;
            });
    }
}

const subsByTiersVC = new SubsByTiersVC();
module.exports = subsByTiersVC;
