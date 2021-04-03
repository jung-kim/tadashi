const chartFilter = require('../../shared/chartFilter');
const ChartRoot = require('./ChartRoot');
const users = require('../../../singletons/users');
const twitchClient = require('../../../singletons/twitchClient');

const chartFollowedStreamersHelperContent = `<p>Top followed streamers from viewers<br>
Top 10 streamers followed by viewers.  </br>
Includes some viewers who may not be watching anymore.
</p>`

class FollowedStreamersVC extends ChartRoot {
    constructor() {
        super({
            type: 'bar',
            title: 'Top followed streamers by viewers',
            chartDomSelector: 'pie-followed-streamers',
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
            backgroundColor: 'blue',
            borderColor: 'grey',
            borderWidth: 1,
            label: 'not following',
        },
        {
            data: [],
            backgroundColor: 'red',
            borderColor: 'grey',
            borderWidth: 1,
            label: 'following',
        },
        {
            data: [],
            backgroundColor: 'green',
            borderColor: 'grey',
            borderWidth: 1,
            label: 'unknown',
        }];
        options.options.indexAxis = 'y';
        options.options.scales = {
            x: { stacked: true },
            y: { stacked: true },
        };

        console.log(23482, options)

        return options;
    }

    _update() {
        const currentStreamerID = twitchClient.getChannelID();
        const userFilter = chartFilter.getUserFilter();
        const followedBySummary = users.getTopFollowedBySummary(currentStreamerID, userFilter);

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
