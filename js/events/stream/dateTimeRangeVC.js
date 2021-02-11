const utils = require('../../helpers/utils');
const DateTime = require('./components/DateTime');

const chartFilter = require('../shared/chartFilter');

let scheduledCheckEndTimeUpdate;

require('../../helpers/signals').domSignals.add((payload) => {
    switch (payload.type) {
        case 'click':
            dateTimeRangeVC._timeReset();
            break;
    }
});

class DateTimeRangeVC {
    constructor() {
        this.defaultStart = utils.getNow();
        this.isLive = true;

        window.addEventListener('focus', this._onWindowFocus.bind(this));
    }

    _isValid() {
        return this.start && this.end;
    }

    _setIsLive() {
        const diff = this.end.get().unix() - utils.getNow().add(-1, 'minutes').unix();
        if (diff >= 0 && diff <= 60) {
            this.isLive = true;
        } else {
            this.isLive = false;
        }
    }

    _timeReset() {
        this.start.set(this.defaultStart);
        this.end.set(utils.getNow());
    }

    _onWindowFocus() {
        if (this.isLive && this._isValid()) {
            this._timeReset();
        }
    }

    setDate() {
        if (!this._isValid()) {
            return;
        }

        const start = this.start.get();
        const end = this.end.get();
        if (end.unix() < start.unix()) {
            this.start.set(end);
            this.end.set(start);
            return;
        }

        this._setIsLive();

        chartFilter.update({ start: start, end: end });
    }

    minProgressed() {
        if (this.isLive && this._isValid()) {
            this.end.set(utils.getNow());
        }
    }

    initialize() {
        this.destroy();
        document.getElementById("time-selectors").innerHTML = templates[`./hbs/stream/date-time-range.hbs`]();

        this.start = new DateTime('time-start');
        this.end = new DateTime('time-end');

        new BSN.Popover(document.getElementById(`time-help`), {
            title: "Date range",
            content: "Data display time window.",
            delay: 500,
            placement: 'bottom'
        });

        new BSN.Popover(document.getElementById(`time-reset-help`), {
            title: 'Reset time',
            content: 'Reset time window to page load time to now',
            delay: 500,
            placement: 'bottom'
        });
    }

    destroy() {
        if (scheduledCheckEndTimeUpdate) {
            clearInterval(scheduledCheckEndTimeUpdate);
            scheduledCheckEndTimeUpdate = undefined;
        }
        if (this.start) {
            this.start.destroy();
            this.start = undefined;
        }
        if (this.end) {
            this.end.destroy();
            this.end = undefined;
        }
    }
}
const dateTimeRangeVC = new DateTimeRangeVC();
module.exports = dateTimeRangeVC;
