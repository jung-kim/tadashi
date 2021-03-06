const constants = require('../../../helpers/constants');
const eventSignals = require('../../../helpers/signals').eventSignals;
const moment = require('../../../helpers/moment');
const utils = require('../../../helpers/utils');
const filter = require('./userFilter');

/**
 * Represents various filter settings
 */
class ChartFilter {
    constructor() {
        this.reset();
    }

    reset() {
        this._start = moment().set('second', 0).set('millisecond', 0);
        this._end = moment().set('second', 0).set('millisecond', 0);
        this._searchValue = undefined;
        this._intervalLevel = constants.BUCKET_MIN;
    }

    update(payload) {
        const changed = {};

        if (payload.start) {
            payload.start = utils.muteSeconds(payload.start);

            if (!this._start || payload.start.unix() !== this._start.unix()) {
                this._start = payload.start;
                changed.start = this._start;
            }
        }

        if (payload.end) {
            payload.end = utils.muteSeconds(payload.end);

            if (!this._end || payload.end.unix() !== this._end.unix()) {
                this._end = payload.end;
                changed.end = this._end;
            }
        }

        if ('searchValue' in payload) {
            if (!filter.isSameSearchString(payload.searchValue)) {
                filter.changeSearchString(payload.searchValue);
                changed.filter = filter;
            }
        }

        if (payload.intervalLevel && payload.intervalLevel !== this._intervalLevel) {
            this._intervalLevel = payload.intervalLevel;
            changed.intervalLevel = this._intervalLevel;
        }

        if (Object.keys(changed).length > 0) {
            eventSignals.dispatch({
                event: "filter.change",
                changed: changed,
            });
        }
    }

    getStartTime() {
        return this._start;
    }

    getEndTime() {
        return this._end;
    }

    getUserFilter() {
        return filter;
    }

    getIntervalLevel() {
        return this._intervalLevel;
    }

    // modifies interval level without triggering the events
    setIntervalLevel(interval) {
        this._intervalLevel = interval;
    }
}

const chartFilter = new ChartFilter();
module.exports = chartFilter;