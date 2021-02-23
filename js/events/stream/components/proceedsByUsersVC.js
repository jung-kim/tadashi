const ChartRoot = require('./ChartRoot');
const constants = require('../../../helpers/constants');
const dataCache = require('../../../simpletons/dataCache');

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
    }

    reset() {
        this._labels = [];
        this._datasets = [];
        this._sumByType = [];
        this._displayLimit = 10;
    }

    async _update() {
        const { channel, filter, startBucket, endBucket } = await this._getParameters();
        const cache = {};

        const total = this._proceedsTypesToProcess.reduce((prev, type) => {
            const value = dataCache.getTotal(channel, startBucket, endBucket, type, filter);
            cache[type] = value;
            return prev.merge(value);
        }, dataCache.getNewDataNode());

        const sorted = Object.entries(total._users).sort(([, a], [, b]) => b - a);
        const length = Math.min(sorted.length, this._displayLimit);

        for (let i = 0; i < length; i++) {
            const userName = sorted[i][0];
            this._labels[i] = userName;
            this._datasets[i] = sorted[i][1];
            this._sumByType[i] = this._proceedsTypesToProcess.reduce((prev, type) => {
                const value = cache[type]._users[userName];
                if (value) {
                    prev[type] = value;
                }
                return prev;
            }, {});
        }

        this._labels.length = length;
        this._datasets.length = length;
        this._sumByType.length = length;
    }

    afterLabel(userName) {
        const indx = this._labels.indexOf(userName);
        const data = this._sumByType[indx];
        return Object.keys(data || {}).map(msgTypeIndex => {
            const value = data[msgTypeIndex];
            return `  ${constants.CHART_LABEL[msgTypeIndex]}: ${msgTypeIndex == constants.TYPE_CHEER ? (value * 100) : value}`;
        });
    }
}

const proceedsByUsersVC = new ProceedsByUsersVC();
module.exports = proceedsByUsersVC;