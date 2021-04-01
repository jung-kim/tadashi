const ChartRoot = require('./ChartRoot');
const constants = require('../../../helpers/constants');
const dataCache = require('../../../simpletons/dataCache');

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
            return constants.CHART_BACKGROUND_COLOR[msgType];
        }));
    }

    async _update() {
        const { channel, filter, startBucket, endBucket } = await this._getParameters();
        const data = this._chartObject.data.datasets[0].data;

        data[0] = dataCache.getTotal(channel, startBucket, endBucket, constants.TYPE_CHEER, filter)._sum;
        data[1] = dataCache.getTotal(channel, startBucket, endBucket, constants.TYPE_SUB, filter)._sum;
        data[2] = dataCache.getTotal(channel, startBucket, endBucket, constants.TYPE_RESUB, filter)._sum;
        data[3] = dataCache.getTotal(channel, startBucket, endBucket, constants.TYPE_SUBGIFT, filter)._sum;
        data[4] = dataCache.getTotal(channel, startBucket, endBucket, constants.TYPE_SUBMYSTERY, filter)._sum;

        this._chartObject.update();
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