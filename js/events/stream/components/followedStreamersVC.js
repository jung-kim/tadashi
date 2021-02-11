const chartFilter = require('../../shared/chartFilter');
const ChartRoot = require('./ChartRoot');

const numStreamerToDisplay = 10;

const chartFollowedStreamersHelperContent = `<p>Viewer's top followed streamers<br>
Top 10 streamers followed among viewers.
</p>`

class FollowedStreamersVC extends ChartRoot {
    constructor() {
        super({
            type: 'horizontalBar',
            title: 'Top followed streamers by viewers',
            chartDomSelector: 'pie-followed-streamers',
            helpContent: chartFollowedStreamersHelperContent,
            updateThrottleTime: 5000,
            signalListener: (payload) => {
                switch (payload.event) {
                    case 'channel.input.update':
                        this.reset();
                        break;
                    case 'stream.load.ready':
                        this.enable();
                        this.reset();
                        break;
                    case 'stream.cleanup':
                        this.disable();
                        break;
                    case 'fetch.user.follows.resp':
                        if (this._enabled) {
                            this._pushToProcess(payload.data);
                            this.update();
                        }
                        break;
                }
            }
        });
    }

    reset() {
        this._map = {};
        this._labels = [];
        this._datasets = [];
    }

    _pushToProcess(userFollows) {
        userFollows.data.forEach(follows => {
            this._map[follows.to_name] = (this._map[follows.to_name] || 0) + 1;
        });
    }

    _update() {
        this._labels = [];
        this._datasets = [];
        const filter = chartFilter.getFilter();

        for (const [name, value] of Object.entries(this._map)) {
            if (filter && !filter.isApplicable(name)) {
                // searching and this one doesn't meet search criteria
                continue;
            }

            const lastIndx = (this._datasets.length >= numStreamerToDisplay ? numStreamerToDisplay : this._datasets.length) - 1;
            if (this._datasets.length >= numStreamerToDisplay && value < this._datasets[lastIndx]) {
                // value is lower than displaying and already showing maximum amount;
                continue;
            }

            let indx = 0;
            for (; indx < this._datasets.length; indx++) {
                if (value > this._datasets[indx]) {
                    break;
                }
            }

            this._datasets.splice(indx, 0, value);
            this._labels.splice(indx, 0, name);
        }
        this._datasets.length = Math.min(this._datasets.length, numStreamerToDisplay);
        this._labels.length = Math.min(this._datasets.length, numStreamerToDisplay);
    }
}

const followedStreamersVC = new FollowedStreamersVC();
module.exports = followedStreamersVC;
