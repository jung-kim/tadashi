
const filter = require('../../../../singletons/filter');
const moment = require('../../../../helpers/moment');
const constants = require('../../../../helpers/constants');
const ChartRoot = require('./ChartRoot');
const dataCache = require('../../../../singletons/dataCache');

const TIMEFORMAT_DISPLAY = 'YYYY/MM/DD HH:mm';

class TimeseriesVC extends ChartRoot {
    constructor() {
        super({
            chartDomSelector: 'canvas-timeseries',
        });
    }

    async _update() {
        const { interval, startBucket, channel, length } = await this._getParameters();
        const labels = this._getRootLabels();
        const datasets = this._getDataset();

        for (let i = 0; i < length; i++) {
            const at = startBucket + (i * interval);
            labels[i] = moment.unix(at);

            const dataAt = dataCache.get(channel, at, at + interval);

            // cache is at time -> type -> data
            // timeseries charts expects type -> time -> data
            for (let type = 0; type < constants.NUM_TYPES; type++) {
                datasets[type].data[i] = dataAt[type]._sum;
                datasets[type].users[i] = dataAt[type]._users;
            }
        }

        for (let type = 0; type < constants.NUM_TYPES; type++) {
            datasets[type].data.length = length;
            datasets[type].users.length = length;
        }
        labels.length = length;
    }

    _initializedChartObject() {
        if (this._chartObject) {
            this._chartObject.destroy();
        }

        this._chartObject = new Chart(document.getElementById(this._chartDomSelector), this._defaultChartOptions());
    }

    _toolTipAfterLabel(tooltipItem) {
        if (!tooltipItem) {
            return;
        }
        const chartDatasetsMsgType = this._getDataset()[tooltipItem.datasetIndex];
        if (tooltipItem.yLabel === 0
            || !filter.getSearchString()
            || !chartDatasetsMsgType.users
            || !chartDatasetsMsgType.users[tooltipItem.dataIndex]) {
            return;
        }

        const filteredUsers = chartDatasetsMsgType.users[tooltipItem.dataIndex];
        return Object.keys(filteredUsers).reduce((obj, user) => {
            obj.push(`  ${user}: ${filteredUsers[user]}`);
            return obj;
        }, []);
    }

    _toolTipLabel(tooltipItem) {
        return `${tooltipItem.dataset.label}: ${tooltipItem.dataset.data[tooltipItem.dataIndex]}`;
    }

    _toolTipTitle(tooltipItem) {
        const dataIndex = ((tooltipItem && tooltipItem[0]) || {}).dataIndex;
        if (dataIndex >= 0) {
            return this._getRootLabels()[dataIndex].format(TIMEFORMAT_DISPLAY);
        }
    }

    _toolTipFilter(tooltipItem) {
        return tooltipItem && tooltipItem.formattedValue != '0';
    }

    _scaleTicksFontStyle(context) {
        switch (filter.getIntervalLevel()) {
            case constants.BUCKET_DAY:
                return context.tick.value.days() === 1 ? 'bold' : undefined;
            case constants.BUCKET_HOUR:
                return context.tick.value.hours() === 0 ? 'bold' : undefined;
            case constants.BUCKET_FIVE:
                return context.tick.value.minutes() === 0 ? 'bold' : undefined;
            case constants.BUCKET_MIN:
                return context.tick.value.minutes() % 5 === 0 ? 'bold' : undefined;
            default:
                return;
        }
    }

    _scaleTicksCallback(labelIndex) {
        const value = this._getRootLabels()[labelIndex];
        if (value.hours() === 0 && value.minutes() === 0) {
            return value.format("M/D");
        }

        switch (filter.getIntervalLevel()) {
            case constants.BUCKET_DAY:
                return value.format("M/D");
            default:
                return value.format("HH:mm");
        }
    }

    _defaultChartOptions() {
        const datasets = [];
        for (let msgType = 0; msgType < constants.NUM_TYPES; msgType++) {
            datasets.push({
                label: constants.CHART_LABEL[msgType],
                backgroundColor: constants.CHART_BACKGROUND_COLOR[msgType],
                borderColor: constants.CHART_BORDER_COLOR[msgType],
                borderWidth: 1,
                data: [],
                users: [],
            });
        }

        return {
            type: 'bar',
            data: {
                labels: [],
                label: '# of Events',
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        stacked: true,
                        ticks: {
                            fontColor: '#7d7d7d',
                            fontSize: 14,
                            fontStyle: this._scaleTicksFontStyle.bind(this),
                            callback: this._scaleTicksCallback.bind(this),
                        },
                        gridLines: {
                            display: true,
                            color: '#7d7d7d',
                        },
                    },
                    y: {
                        stacked: true,
                        gridLines: {
                            display: true,
                            color: '#7d7d7d',
                        },
                        ticks: {
                            fontColor: '#7d7d7d',
                            fontSize: 14,
                            stepSize: 5
                        }
                    }
                },
                plugins: {
                    title: { display: false },
                    legend: {
                        labels: {
                            display: true,
                            color: '#7d7d7d',
                        }
                    },
                    tooltip: {
                        intersect: false,
                        mode: 'index',
                        filter: this._toolTipFilter.bind(this),
                        callbacks: {
                            title: this._toolTipTitle.bind(this),
                            label: this._toolTipLabel.bind(this),
                            afterLabel: this._toolTipAfterLabel.bind(this),
                        }
                    }
                },
            }
        }
    }
}

const timeseriesVC = new TimeseriesVC();
module.exports = timeseriesVC;
