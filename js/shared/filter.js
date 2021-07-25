const env = require('../env');
const constants = require('../helpers/constants');
const moment = require('../helpers/moment');

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

    setStart(start, isTrigger) {
        if (!start || start.unix() === env._filter._start.unix()) {
            return;
        }

        env._filter._start = start;

        if (isTrigger) {
            eventSignals.dispatch({
                event: "filter.change",
                changed: { start: start },
            });
        }
    }

    getStart() {
        return env._filter._start;
    }

    setEnd(end, isTrigger) {
        if (!end || end.unix() === env._filter._end.unix()) {
            return;
        }

        env._filter._end = end;

        if (isTrigger) {
            eventSignals.dispatch({
                event: "filter.change",
                changed: { end: end },
            });
        }
    }

    getEnd() {
        return env._filter._end;
    }

    setSearchString(searchString, isTrigger) {
        if (!searchString || searchString === env._filter._searchString) {
            return;
        }

        env._filter._searchString = searchString;

        if (isTrigger) {
            eventSignals.dispatch({
                event: "filter.change",
                changed: { searchString: searchString },
            });
        }
    }

    getSearchString() {
        return env._filter._searchString;
    }

    setIntervalLevel(intervalLevel, isTrigger) {
        if (!intervalLevel || intervalLevel === env._filter._intervalLevel) {
            return;
        }

        env._filter._intervalLevel = intervalLevel;

        if (isTrigger) {
            eventSignals.dispatch({
                event: "filter.change",
                changed: { intervalLevel: intervalLevel },
            });
        }
    }

    getIntervalLevel() {
        return env._filter._intervalLevel;
    }
}

const filter = new Filter();
module.exports = filter;
