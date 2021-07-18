const chartFilter = require('../../shared/chartFilter');
const ChartRoot = require('./ChartRoot');
const users = require('../../../singletons/users');

const chartFollowedStreamersHelperContent = `<p>Top 10 followed streamers by viewers</br>
Includes data from both current viewers and the viewers who have left as well during the data capture period.</br> 
</br></br>
- followed by admirers: number of viewers following the target streamer but not current streamer.</br>
- followed by followers: number of viewers following the target streamd and current streamer.</br>
- unknown: data hasn't beent fetched yet and is unkonwn.
</p>`

class FollowedStreamersVC extends ChartRoot {
    constructor() {
        super({
            type: 'bar',
            title: 'Top followed streamers by viewers',
            chartDomSelector: 'chart-followed-streamers',
            helpContent: chartFollowedStreamersHelperContent,
            updateThrottleTime: 5000,
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
            case 'fetch.user.follows.resp':
                if (this._enabled) {
                    this.update();
                    this._chartObject.update();
                }
                break;
        }
    }

    _defaultChartOptions() {
        const options = super._defaultChartOptions();
        options.data.datasets = [{
            data: [],
            backgroundColor: '#B346A3',
            borderColor: '#B34650',
            borderWidth: 1,
            label: 'followed by admirers',
        },
        {
            data: [],
            backgroundColor: '#46B356',
            borderColor: '#46B380',
            borderWidth: 1,
            label: 'followed by followers',
        },
        {
            data: [],
            backgroundColor: '#466DB3',
            borderColor: '#466D80',
            borderWidth: 1,
            label: 'unknown',
        }];
        options.options.indexAxis = 'y';
        options.options.scales = {
            x: { stacked: true },
            y: { stacked: true },
        };

        return options;
    }

    _update() {
        const followedBySummary = users.getTopFollowedBySummary(chartFilter.getSearchValue());

        const labels = this._getRootLabels();
        const datasets = this._getDataset();

        for (let i = 0; i < followedBySummary.length; i++) {
            labels[i] = users.getUserByID(followedBySummary[i].userID).getUserName();
        }

        datasets[0].data = followedBySummary.map(summary => summary.admiring);
        datasets[1].data = followedBySummary.map(summary => summary.following);
        datasets[2].data = followedBySummary.map(summary => summary.unknown);
    }
}

const followedStreamersVC = new FollowedStreamersVC();
module.exports = followedStreamersVC;
