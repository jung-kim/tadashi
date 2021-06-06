const ChartRoot = require('./ChartRoot');

const chartSubsByTiersHelperContent = `<p>Subscription counts grouped by tiers and gifts.</p>`

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


    async _update() {
        const currentStreamerID = twitchClient.getChannelID();
        const userFilter = chartFilter.getUserFilter();
        const subscribeByTiers = users.getSubscriptionsByTiers(currentStreamerID, userFilter);

        const labels = this._getRootLabels();
        const datasets = this._getDataset();

        Object.keys(followedBySummary).
            sort((a, b) => a - b).
            forEach((key, index) => {
                labels[index] = key;
                datasets[0] = subscribeByTiers[key].gifted;
                datasets[1] = subscribeByTiers[key].notGifted;
            });
    }
}

const subsByTiersVC = new SubsByTiersVC();
module.exports = subsByTiersVC;
