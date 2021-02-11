const ChartRoot = require('./ChartRoot');
const constants = require('../../../helpers/constants');
const dataCache = require('../../../simpletons/dataCache');

const chartChatsByUsersHelperContent = `<p>Chats grouped by users<br>
Sum of chats grouped by users.
</p>`

const DISPLAY_LIMIT = 10;

class ChatsByUsersVC extends ChartRoot {
    constructor() {
        super({
            chartDomSelector: 'pie-chats-by-users',
            title: 'Chat Counts by User Name',
            helpContent: chartChatsByUsersHelperContent,
        });
    }
    reset() {
        this._labels = [];
        this._datasets = [];
    }

    async _update() {
        const { channel, filter, startBucket, endBucket } = await this._getParameters();

        const total = dataCache.getTotal(channel, startBucket, endBucket, constants.TYPE_CHAT, filter);
        const sorted = Object.entries(total._users).sort(([, a], [, b]) => b - a);
        const length = Math.min(sorted.length, DISPLAY_LIMIT);

        for (let i = 0; i < length; i++) {
            this._labels[i] = sorted[i][0];
            this._datasets[i] = sorted[i][1];
        }

        this._labels.length = length;
        this._datasets.length = length;
    }
}

const chatsByUsersVC = new ChatsByUsersVC();
module.exports = chatsByUsersVC;