const signals = require('../../../helpers/signals').signals;
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
        }, obj.updateThrottleTime || 1000);

        signals.add(obj.signalListener || ((payload) => {
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
        }));
        this.reset();
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
            filter: chartFilter.getFilter(),
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


    _updateChartObject() {
        if (this._chartObject) {
            this._chartObject.data.datasets[0].data = this._datasets;
            if (!Object.isFrozen(this._chartObject.data.labels)) {
                // static lables, label colors will not change and preconfigured.
                this._chartObject.data.labels = this._labels;
                this._chartObject.data.datasets[0].backgroundColor = this._getBackgroundColor()
                this._chartObject.data.datasets[0].borderColor = this._getBorderColor()
            }

            this._chartObject.update();
            return;
        }

        document.getElementById(this._chartDomSelector).innerHTML = templates[`./hbs/stream/components/chart.hbs`](this);
        this._helpDom = new BSN.Popover(document.getElementById(`${this._chartDomSelector}-help`), {
            title: this._title,
            content: this._helpContent,
            placement: 'left'
        });

        let indexAxis;
        if (this._type === 'horizontalBar') {
            this._type = 'bar';
            indexAxis = 'y';
        }

        this._chartObject = new Chart(document.getElementById(`canvas-${this._chartDomSelector}`), {
            type: this._type,
            data: {
                labels: this._labels,

                datasets: [{
                    data: this._datasets,
                    backgroundColor: this._getBackgroundColor(),
                    borderColor: this._getBorderColor(),
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
        });
    }
}

module.exports = ChartRoot;
