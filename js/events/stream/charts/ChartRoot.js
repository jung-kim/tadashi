const eventSignals = require('../../../helpers/signals').eventSignals;
const filter = require('../../../shared/filter');
const utils = require('../../../helpers/utils');
const constants = require('../../../helpers/constants');
const users = require('../../../singletons/users');
const _ = require('lodash');

const MAX_DATAPOINT_LIMIT = 250;

class ChartRoot {
    constructor(obj) {
        this._enabled = false;
        this._chartDomSelector = obj.chartDomSelector;
        this._title = obj.title;
        this._helpContent = obj.helpContent;
        this._type = obj.type || 'doughnut';

        this.update = _.throttle(async () => {
            await this._update();
            this._chartObject.update();
        }, obj.updateThrottleTime || 500);

        eventSignals.add(this._eventSignalsFunc.bind(this));
    }

    /**
     * function to run on event signals.  
     * 
     * @param {object} payload event signals
     * @returns {undefined}
     */
    _eventSignalsFunc(payload) {
        switch (payload.event) {
            case 'stream.load.ready':
                this._enabled = true;
                this.reset();
                break;
            case 'stream.cleanup':
                this._enabled = false;
                break;
            case 'data.cache.updated':
            case 'filter.change':
                if (payload.changed && payload.changed.channel) {
                    this.reset();
                } else if (this._enabled) {
                    this.update();
                }
                break;
        }
    }

    /**
     * logic to update data values and redraws
     * 
     * @returns {undefined}
     */
    async _update() {
        throw "not implemented";
    }

    /**
     * called when to disregard existing data and start fresh
     * 
     * @returns {undefined}
     */
    reset() {
        this._initializedChartObject();
    }

    /**
     * returns parameters for drawing charts and set context
     * 
     * @returns {object} various parameters
     */
    _getParameters() {
        const start = filter.getStart().unix();
        const end = filter.getEnd().unix();

        let interval = filter.getIntervalLevel();
        let startBucket = utils.getTimeBucket(start, interval);
        let endBucket = utils.getTimeBucket(end, interval);
        let length = Math.floor((endBucket - startBucket) / interval) + 1;

        while (interval != constants.BUCKET_DAY && length >= MAX_DATAPOINT_LIMIT) {
            const indx = constants.INTERVAL_BUCKETS.indexOf(interval);
            interval = constants.INTERVAL_BUCKETS[indx + 1];
            length = Math.floor((endBucket - startBucket) / interval) + 1;
        }

        filter.setIntervalLevel(interval);
        startBucket = utils.getTimeBucket(start, interval);
        endBucket = utils.getTimeBucket(end, interval);

        return {
            interval: interval,
            startBucket: startBucket,
            endBucket: endBucket,
            channel: filter.getChannel(),
            usersObject: users,
            length: length,
        }
    }

    /**
     * initialized chart object, destroy if already exists.
     * Previous data are destroyed
     * 
     * @returns {undefined}
     */
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

    /**
     * Returns default chart option object to create chart with.
     * Maybe overwridden to customize
     * 
     * @returns {object} chart option object to be passed into `new Chart`
     */
    _defaultChartOptions() {
        return {
            type: this._type,
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1,
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
                    }
                },
                animation: {
                    duartion: 250,
                },
                hover: {
                    animationDuration: 0,
                },
                responsiveAnimationDuration: 250,
            },
        }
    }

    /**
     * Returns root level labels.  
     * This labels are different then dataset level labels.
     * 
     * @returns {Array} root level labels
     */
    _getRootLabels() {
        return this._chartObject.data.labels;
    }

    /**
     * returns datasets of chartjs
     * 
     * @returns {Array} datasets
     */
    _getDataset() {
        return this._chartObject.data.datasets;
    }
}

module.exports = ChartRoot;
