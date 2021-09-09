const ChartRoot = require('./ChartRoot');
const constants = require('../../../../helpers/constants');
const dataCache = require('../../../../singletons/dataCache');
const utils = require('../../../../helpers/utils');

const chartProceedsByUsersHelperContent = `<p>Proceeds by users<br>
<ul>
<li>100 Cheers</li>
<li>Subscription count</li>
<li>Re-Subscription count</li>
<li>Subscription Gifts count</li>
<li>Mystery Subscription count</li>
</ul>
</p>`

class ProceedsByUsersVC extends ChartRoot {
    constructor() {
        super({
            chartDomSelector: 'pie-proceeds-by-users',
            title: 'Proceeds by User Name',
            helpContent: chartProceedsByUsersHelperContent,
        });
        this._proceedsTypesToProcess = Object.freeze([
            constants.TYPE_CHEER,
            constants.TYPE_SUB,
            constants.TYPE_RESUB,
            constants.TYPE_SUBGIFT,
            constants.TYPE_SUBMYSTERY
        ]);
        this._displayLimit = 10;
    }

    reset() {
        super.reset();
        this._sumByType = [];
    }

    async _update() {
        const { channel, startBucket, endBucket } = await this._getParameters();
        // endBucket + 60 since endbucket is exclusive
        const dataBucket = dataCache.get(channel, startBucket, endBucket + constants.BUCKET_MIN);

        const total = this._proceedsTypesToProcess.reduce((prev, type) => {
            return prev ? prev.merge(dataBucket[type], true) : dataBucket[type].getCopy();
        }, null);

        const sorted = Object.entries(total._users).sort(([, a], [, b]) => b - a);
        const length = Math.min(sorted.length, this._displayLimit);
        const labels = this._getRootLabels();
        const datasets = this._getDataset();
        const data = datasets[0].data;

        for (let i = 0; i < length; i++) {
            const userName = sorted[i][0];
            labels[i] = userName;
            data[i] = sorted[i][1];
            this._sumByType[i] = this._proceedsTypesToProcess.reduce((prev, type) => {
                const value = dataBucket[type]._users[userName];
                if (value) {
                    prev[type] = value;
                }
                return prev;
            }, {});
        }

        labels.length = length;
        data.length = length;
        this._sumByType.length = length;
        datasets[0].backgroundColor = utils.getBackgroundColor(labels);
        datasets[0].borderColor = utils.getBorderColor(labels);
    }

    _afterLabel(userName) {
        const indx = this._chartObject.data.labels.indexOf(userName);
        const data = this._sumByType[indx];
        return Object.keys(data || {}).map(msgTypeIndex => {
            const value = data[msgTypeIndex];
            return `  ${constants.CHART_LABEL[msgTypeIndex]}: ${msgTypeIndex == constants.TYPE_CHEER ? (value * 100) : value}`;
        });
    }

    _defaultChartOptions() {
        const options = super._defaultChartOptions();
        options.options.plugins.tooltip = {
            callbacks: {
                afterLabel: this._afterLabel.bind(this)
            }
        }
        return options;
    }
}

const proceedsByUsersVC = new ProceedsByUsersVC();
module.exports = proceedsByUsersVC;