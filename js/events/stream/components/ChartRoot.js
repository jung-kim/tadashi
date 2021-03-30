const eventSignals = require('../../../helpers/signals').eventSignals;
const chartFilter = require('../../shared/chartFilter');
const twitchClient = require('../../../singletons/twitchClient');
const utils = require('../../../helpers/utils');
const constants = require('../../../helpers/constants');
const toMaterialStyle = require('material-color-hash').default;
const _ = require('lodash');

const MAX_DATAPOINT_LIMIT = 250;

class ChartRoot {
    constructor(obj) {
        this._enabled = false;
        this._chartDomSelector = obj.chartDomSelector;
        this._title = obj.title;
        this._helpContent = obj.helpContent;
        this._type = obj.type || 'doughnut';

        this.update = _.throttle(() => {
            this._update();
            this._updateChartObject();
        }, obj.updateThrottleTime || 500);

        eventSignals.add(this._eventSignalsFunc.bind(this));
        this.reset();

        this._initializedChartObject();
    }

    _eventSignalsFunc(payload) {
        switch (payload.event) {
            case 'channel.input.update':
                this.reset();
                break;
            case 'stream.load.ready':
                this.enable();
                this.reset();
                this._updateChartObject();
                break;
            case 'stream.cleanup':
                this.disable();
                break;
            case 'data.cache.updated':
            case 'filter.change':
                if (this._enabled) {
                    this.update();
                }
                break;
        }
    }

    enable() {
        this._enabled = true;
    }

    disable() {
        this._enabled = false;
    }

    async _update() {
        // override this
    }

    reset() {
        // override this
    }

    _getParameters() {
        const start = chartFilter.getStartTime().unix();
        const end = chartFilter.getEndTime().unix();

        let interval = chartFilter.getIntervalLevel();
        let startBucket = utils.getTimeBucket(start, interval);
        let endBucket = utils.getTimeBucket(end, interval);
        let length = Math.floor((endBucket - startBucket) / interval) + 1;

        while (interval != constants.BUCKET_DAY && length >= MAX_DATAPOINT_LIMIT) {
            const indx = constants.INTERVAL_BUCKETS.indexOf(interval);
            interval = constants.INTERVAL_BUCKETS[indx + 1];
            length = Math.floor((endBucket - startBucket) / interval) + 1;
        }

        chartFilter.setIntervalLevel(interval);
        startBucket = utils.getTimeBucket(start, interval);
        endBucket = utils.getTimeBucket(end, interval);

        return {
            interval: interval,
            startBucket: startBucket,
            endBucket: endBucket,
            channel: twitchClient.getChannel(),
            filter: chartFilter.getUserFilter(),
            length: length,
        }
    }

    _getBackgroundColor() {
        return this._labels.map((userName) => {
            const bgColor = toMaterialStyle(userName, '200').backgroundColor;
            return `${bgColor}4D`;
        });
    }

    _getBorderColor() {
        return this._labels.map((userName) => {
            const bgColor = toMaterialStyle(userName, '200').backgroundColor;
            return `${bgColor}FF`;
        });
    }

    _initializedChartObject() {
        if (this._chartObject) {
            this._chartObject.destroy();
        }

        document.getElementById(this._chartDomSelector).innerHTML = templates[`./hbs/stream/components/chart.hbs`](this);
        this._helpDom = new BSN.Popover(document.getElementById(`${this._chartDomSelector}-help`), {
            title: this._title,
            content: this._helpContent,
            placement: 'left'
        });

        this._chartObject = new Chart(document.getElementById(`canvas-${this._chartDomSelector}`), this._defaultChartOptions());
    }

    _defaultChartOptions() {
        let indexAxis;
        if (this._type === 'horizontalBar') {
            this._type = 'bar';
            indexAxis = 'y';
        }

        return {
            type: this._type,
            data: {
                labels: [],

                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1,
                    indexAxis: indexAxis,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: this._title,
                        fontSize: 18,
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: (tooltipItem) => {
                                return this.afterLabel ? this.afterLabel(tooltipItem.label) : undefined;
                            }
                        }
                    }
                },
            },
        }
    }

    _updateChartObject() {
        this._chartObject.data.datasets[0].data = this._datasets;
        if (!Object.isFrozen(this._chartObject.data.labels)) {
            // not static lables, label colors will may change
            this._chartObject.data.labels = this._labels;
            this._chartObject.data.datasets[0].backgroundColor = this._getBackgroundColor();
            this._chartObject.data.datasets[0].borderColor = this._getBorderColor();
        }

        this._chartObject.update();
    }
}

module.exports = ChartRoot;
