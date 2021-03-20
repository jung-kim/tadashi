
const { assert } = require('chai');
const _ = require('lodash');
const sinon = require('sinon');

const DateTime = require('../../../../js/events/stream/components/DateTime');
const moment = require('../../../..//js/helpers/moment');
const constants = require('../../../../js/helpers/constants');

describe('DateTime.js', () => {
    beforeEach(() => {
        reset();
    });


    it('constructor', () => {
        sinon.useFakeTimers();
        const getElementById = document.getElementById.withArgs('dom-id').returns('a-dom');

        assert.deepEqual(new DateTime('dom-id'), {
            dom: 'a-dom',
            id: 'dom-id',
            timeSelector: undefined,
        });

        sinon.assert.calledOnce(flatpickr.withArgs('a-dom', {
            dateFormat: "Y-m-d H:i",
            enableTime: true,
            allowInput: true,
            clickOpens: true,
            time_24hr: true,
            minDate: "2020-01-01 00:00",
            defaultDate: moment().toDate(),
            onValueUpdate: sinon.match.any,
        }));
        sinon.assert.calledOnce(getElementById);
    });

    it('get', () => {
        const dateTime = new DateTime('dom-id');
        dateTime.timeSelector = { selectedDates: [1615132337884] }
        assert.equal(dateTime.get().valueOf(), 1615132337884);
    });


    it('set', () => {
        const dateTime = new DateTime('dom-id');
        const now = moment();
        dateTime.timeSelector = { setDate: sinon.stub() }

        dateTime.set(now);

        sinon.assert.calledOnce(dateTime.timeSelector.setDate.withArgs([now.format(constants.MOMENT_DISPLAY_FORMAT)]));
    });
});