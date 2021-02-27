
const chartFilter = require('../../shared/chartFilter');
const moment = require('../../../helpers/moment');
const constants = require('../../../helpers/constants');
const ChartRoot = require('./ChartRoot');
const dataCache = require('../../../simpletons/dataCache');

class TimeseriesVC extends ChartRoot {
    constructor() {
        super({
            chartDomSelector: "canvas-timeseries",
        });
    }

    reset() {
        this._chartLabels = [];
        this._chartDatasets = [];
        if (this._chartObject) {
            this._chartObject.destroy();
        }
        this._chartObject = undefined;

        for (let msgType = 0; msgType < constants.NUM_TYPES; msgType++) {
            this._chartDatasets.push({
                label: constants.CHART_LABEL[msgType],
                backgroundColor: constants.CHART_BACKGROUND_COLOR[msgType],
                borderColor: constants.CHART_BORDER_COLOR[msgType],
                borderWidth: 1,
                data: [],
                users: [],
            });
        }
    }

    async _update() {
        console.log(882)
        const { interval, startBucket, channel, filter, length } = await this._getParameters();

        for (let i = 0; i < length; i++) {
            const at = startBucket + (i * interval);
            this._chartLabels[i] = moment.unix(at);

            const dataAt = dataCache.get(channel, at, interval, filter);

            // cache is at time -> type -> data
            // timeseries charts expects type -> time -> data
            for (let type = 0; type < constants.NUM_TYPES; type++) {
                this._chartDatasets[type].data[i] = dataAt[type]._sum;
                this._chartDatasets[type].users[i] = dataAt[type]._users;
            }
        }

        for (let type = 0; type < constants.NUM_TYPES; type++) {
            this._chartDatasets[type].data.length = length;
            this._chartDatasets[type].users.length = length;
        }
        this._chartLabels.length = length;
    }

    _toolTipAfterLabel(tooltipItem) {
        if (!tooltipItem) {
            return;
        }
        const chartDatasetsMsgType = this._chartDatasets[tooltipItem.datasetIndex];
        if (tooltipItem.yLabel === 0
            || !chartFilter.getFilter().isValid()
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
            return this._chartLabels[dataIndex].format(constants.TIMEFORMAT_DISPLAY);
        }
    }

    _toolTipFilter(tooltipItem) {
        return tooltipItem && tooltipItem.formattedValue != '0';
    }

    _scaleTicksFontStyle(context) {
        switch (chartFilter.getIntervalLevel()) {
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
        const value = this._chartLabels[labelIndex]
        if (value.hours() === 0 && value.minutes() === 0) {
            return value.format("M/D");
        }

        switch (chartFilter.getIntervalLevel()) {
            case constants.BUCKET_DAY:
                return value.format("M/D");
            default:
                return value.format("HH:mm");
        }
    }

    _updateChartObject() {
        if (this._chartObject) {
            this._chartObject.data.labels = this._chartLabels;
            this._chartObject.data.datasets = this._chartDatasets;
            this._chartObject.update();
        } else {
            this._chartObject = new Chart(document.getElementById(this._chartDomSelector), {
                type: 'bar',
                data: {
                    labels: this._chartLabels,
                    label: '# of Events',
                    datasets: this._chartDatasets,
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
                                // Include a dollar sign in the ticks
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
            });
        }
    }
}

const timeseriesVC = new TimeseriesVC();
module.exports = timeseriesVC;
