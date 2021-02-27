const constants = require('../../../helpers/constants');
const signals = require('../../../helpers/signals').signals;

const moment = require('../../../helpers/moment');

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
            onValueUpdate: _.debounce(() => signals.dispatch({ event: 'date.change' }, 1000)),
        });
    }

    get() {
        return moment(this.timeSelector.selectedDates[0]);
    }

    set(momentObj) {
        this.timeSelector.setDate([momentObj.format(constants.MOMENT_DISPLAY_FORMAT)], true);
    }
}

module.exports = DateTime;