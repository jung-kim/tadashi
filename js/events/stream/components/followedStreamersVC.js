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
            type: 'horizontalBar',
            title: 'Top followed streamers by viewers',
            chartDomSelector: 'pie-followed-streamers',
            helpContent: chartFollowedStreamersHelperContent,
            updateThrottleTime: 5000
        });
    }

    _eventSignalsFunc(payload) {
        switch (payload.event) {
            case 'channel.input.update':
                this.reset();
                break;
            case 'stream.load.ready':
                this.enable();
                this.reset();
                this._updateChartObject();
                break;
            case 'stream.cleanup':
                this.disable();
                break;
            case 'fetch.user.follows.resp':
                this.update();
                break;
        }
    }

    reset() {
        this._fromAdmirers = {};
        this._fromFollowers = {};
        this._labels = [];
        this._datasets = [];
    }

    _pushToProcess(userFollows) {
        userFollows.data.forEach(follows => {
            this._map[follows.to_name] = (this._map[follows.to_name] || 0) + 1;
        });
    }

    _update() {
        if (!this._enabled) {
            return;
        }

        const currentStreamerID = twitchClient.getChannelID();
        const userFilter = chartFilter.getUserFilter();
        const followedBySummary = users.getTopFollowedBySummary(currentStreamerID, userFilter);

        this._labels = followedBySummary.map(summary => users.getUserByID(summary.userID).getUserName());
        this._datasets = [
            {
                label: 'from not following current streamer',
                data: followedBySummary.map(summary => summary.admiringCurrent),
                borderWidth: 5,
                backgroundColor: "red"
            },
            {
                label: 'from following current streamer',
                data: followedBySummary.map(summary => summary.followingCurrent),
                borderWidth: 1,
                backgroundColor: "blue"
            }
        ]
    }
}

const followedStreamersVC = new FollowedStreamersVC();
module.exports = followedStreamersVC;
