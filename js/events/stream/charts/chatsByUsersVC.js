const ChartRoot = require('./ChartRoot');
const constants = require('../../../helpers/constants');
const dataCache = require('../../../simpletons/dataCache');
const utils = require('../../../helpers/utils');

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
        const { channel, usersObject, startBucket, endBucket } = await this._getParameters();
        const labels = this._getRootLabels();
        const datasets = this._getDataset();
        const data = datasets[0].data;

        // endBucket + 60 since endbucket is exclusive
        const chatTotal = dataCache.get(channel, startBucket, endBucket + constants.BUCKET_MIN, usersObject)[constants.TYPE_CHAT];
        const sorted = Object.entries(chatTotal._users).sort(([, a], [, b]) => b - a);
        const length = Math.min(sorted.length, DISPLAY_LIMIT);

        for (let i = 0; i < length; i++) {
            labels[i] = sorted[i][0];
            data[i] = sorted[i][1];
        }

        labels.length = length;
        data.length = length;
        datasets[0].backgroundColor = utils.getBackgroundColor(labels);
        datasets[0].borderColor = utils.getBorderColor(labels);
    }
}

const chatsByUsersVC = new ChatsByUsersVC();
module.exports = chatsByUsersVC;