const ChartRoot = require('./ChartRoot');
const constants = require('../../../helpers/constants');
const dataCache = require('../../../singletons/dataCache');

const chartProceedsHelpContent = `<p>Proceeds by type<br>
<ul>
<li>100 Cheers count</li>
<li>Subscription count</li>
<li>Re-Subscription count</li>
<li>Subscription Gifts count</li>
<li>Mystery Subscription count</li>
</ul>
</p>`

class ProceedsByTypesVC extends ChartRoot {
    constructor() {
        super({
            type: 'bar',
            chartDomSelector: 'pie-proceeds',
            title: 'Overall Proceeds',
            helpContent: chartProceedsHelpContent,
        });
        this._labels = Object.freeze(["100 Cheer", "Subs", "Resubs", "Sub Gifts", "Sub Mystery"]);
        this._messageTypes = Object.freeze([
            constants.TYPE_CHEER,
            constants.TYPE_SUB,
            constants.TYPE_RESUB,
            constants.TYPE_SUBGIFT,
            constants.TYPE_SUBMYSTERY,
        ]);
        this._backgroundColor = Object.freeze(this._messageTypes.map((msgType) => {
            return constants.CHART_BACKGROUND_COLOR[msgType];
        }));
        this._borderColor = Object.freeze(this._messageTypes.map((msgType) => {
            return constants.CHART_BORDER_COLOR[msgType];
        }));
    }

    async _update() {
        const { channel, startBucket, endBucket } = await this._getParameters();
        const datasets = this._getDataset();
        const data = datasets[0].data;
        // endBucket + 60 since endbucket is exclusive
        const total = dataCache.get(channel, startBucket, endBucket + constants.BUCKET_MIN);
        console.log(23422, total)

        data[0] = total[constants.TYPE_CHEER]._sum;
        data[1] = total[constants.TYPE_SUB]._sum;
        data[2] = total[constants.TYPE_RESUB]._sum;
        data[3] = total[constants.TYPE_SUBGIFT]._sum;
        data[4] = total[constants.TYPE_SUBMYSTERY]._sum;
    }

    _defaultChartOptions() {
        const options = super._defaultChartOptions();

        options.data.labels = this._labels;
        options.data.datasets[0].backgroundColor = this._backgroundColor;
        options.data.datasets[0].borderColor = this._borderColor;

        return options;
    }
}

const proceedsByTypesVC = new ProceedsByTypesVC();
module.exports = proceedsByTypesVC;