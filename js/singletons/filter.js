const env = require('../env');
const constants = require('../helpers/constants');
const moment = require('../helpers/moment');
const { eventSignals } = require('../helpers/signals');

const CHANNEL_LS_KEY = 'channel';
const CHANNEL_LS_ID_KEY = 'channel-id';

class Filter {
    constructor() {
        this.reset();
    }

    reset() {
        env._filter = {};
        if (localStorage.getItem(CHANNEL_LS_KEY)) {
            env._filter._channel = localStorage.getItem(CHANNEL_LS_KEY);
        } else {
            env._filter._channel = undefined;
        }
        if (localStorage.getItem(CHANNEL_LS_ID_KEY)) {
            env._filter._channelId = parseInt(localStorage.getItem(CHANNEL_LS_ID_KEY));
        } else {
            env._filter._channelId = undefined;
        }

        env._filter._start = moment().set('second', 0).set('millisecond', 0);
        env._filter._end = moment().set('second', 0).set('millisecond', 0);
        env._filter._searchString = undefined;
        env._filter._intervalLevel = constants.BUCKET_MIN;
    }

    setStart(start) {
        if (!moment.isMoment(start) || start.unix() === this.getStart().unix()) {
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
        if (!moment.isMoment(end) || end.unix() === this.getEnd().unix()) {
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
        if (!searchString || searchString === this.getSearchString()) {
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
        if (!intervalLevel || intervalLevel === this.getIntervalLevel()) {
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

    setChannelInfo(channel, channelId, isIgnoreSignal) {
        if (this.getChannelId() === channelId && this.getChannel() === channel) {
            return;
        }

        env._filter._channel = channel;
        env._filter._channelId = parseInt(channelId);

        if (!isIgnoreSignal) {
            eventSignals.dispatch({
                event: 'filter.change',
                changed: {
                    channelId: this.getChannelId(),
                    channel: this.getChannel()
                },
            });
        }
    }

    getChannelId() {
        return env._filter._channelId;
    }

    getChannel() {
        return env._filter._channel;
    }
}

const filter = new Filter();
module.exports = filter;
