const env = require('../env');
const constants = require('../helpers/constants');
const moment = require('../helpers/moment');
const { eventSignals } = require('../helpers/signals');

class Filter {
    constructor() {
        env._filter = {};
        this.reset();
    }

    reset() {
        env._filter._start = moment().set('second', 0).set('millisecond', 0);
        env._filter._end = moment().set('second', 0).set('millisecond', 0);
        env._filter._searchString = undefined;
        env._filter._intervalLevel = constants.BUCKET_MIN;
    }

    setStart(start) {
        if (!start || start.unix() === env._filter._start.unix()) {
            return;
        }

        env._filter._start = start;

        eventSignals.dispatch({
            event: 'filter.change',
            changed: { start: start },
        });
    }

    getStart() {
        return env._filter._start;
    }

    setEnd(end) {
        if (!end || end.unix() === env._filter._end.unix()) {
            return;
        }

        env._filter._end = end;

        eventSignals.dispatch({
            event: 'filter.change',
            changed: { end: end },
        });
    }

    getEnd() {
        return env._filter._end;
    }

    setSearchString(searchString) {
        if (!searchString || searchString === env._filter._searchString) {
            return;
        }

        const cleanedSearchString = searchString.trim().toLowerCase();
        env._filter._searchString = cleanedSearchString;

        eventSignals.dispatch({
            event: 'filter.change',
            changed: { searchString: cleanedSearchString },
        });
    }

    getSearchString() {
        return env._filter._searchString;
    }

    setIntervalLevel(intervalLevel) {
        if (!intervalLevel || intervalLevel === env._filter._intervalLevel) {
            return;
        }

        env._filter._intervalLevel = intervalLevel;

        eventSignals.dispatch({
            event: 'filter.change',
            changed: { intervalLevel: intervalLevel },
        });
    }

    getIntervalLevel() {
        return env._filter._intervalLevel;
    }
}

const filter = new Filter();
module.exports = filter;
