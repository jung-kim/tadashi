const ChartRoot = require('./ChartRoot');
const constants = require('../../../helpers/constants');
const dataCache = require('../../../simpletons/dataCache');

const chartChatsByUsersHelperContent = `<p>Chats grouped by user name</p>`

const DISPLAY_LIMIT = 10;

class ChatsByUsersVC extends ChartRoot {
    constructor() {
        super({
            chartDomSelector: 'pie-chats-by-users',
            title: 'Chat Counts by User Name',
            helpContent: chartChatsByUsersHelperContent,
        });
    }

    async _update() {
        const { channel, filter, startBucket, endBucket } = await this._getParameters();
        const labels = this._chartObject.data.labels;
        const data = this._chartObject.data.datasets[0].data;

        const total = dataCache.getTotal(channel, startBucket, endBucket, constants.TYPE_CHAT, filter);
        const sorted = Object.entries(total._users).sort(([, a], [, b]) => b - a);
        const length = Math.min(sorted.length, DISPLAY_LIMIT);

        for (let i = 0; i < length; i++) {
            labels[i] = sorted[i][0];
            data[i] = sorted[i][1];
        }

        labels.length = length;
        data.length = length;
        this._chartObject.data.datasets[0].backgroundColor = this._getBackgroundColor(labels);
        this._chartObject.data.datasets[0].borderColor = this._getBorderColor(labels);
        this._chartObject.update();
    }
}

const chatsByUsersVC = new ChatsByUsersVC();
module.exports = chatsByUsersVC;