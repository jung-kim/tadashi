const eventSignals = require('../../../../helpers/signals').eventSignals;

const moment = require('../../../../helpers/moment');

const MOMENT_DISPLAY_FORMAT = 'YYYY-MM-DD HH:mm';

class DateTime {
    constructor(id) {
        this.id = id;
        this.dom = document.getElementById(id);
        this.timeSelector = flatpickr(this.dom, {
            dateFormat: "Y-m-d H:i",
            enableTime: true,
            allowInput: true,
            clickOpens: true,
            time_24hr: true,
            minDate: "2020-01-01 00:00",
            defaultDate: moment().toDate(),
            onValueUpdate: _.debounce(() => eventSignals.dispatch({ event: 'date.change' }, 1000)),
        });
    }

    get() {
        return moment(this.timeSelector.selectedDates[0]);
    }

    set(momentObj) {
        this.timeSelector.setDate([momentObj.format(MOMENT_DISPLAY_FORMAT)], true);
    }

    destroy() {
        this.timeSelector.destroy();
    }
}

module.exports = DateTime;