
const { assert } = require('chai');
const sinon = require('sinon');

const DateTime = require('../../../../../js/singletons/viewcontrols/stream/components/DateTime');
const moment = require('../../../../..//js/helpers/moment');
const testUtils = require('../../../../testUtils');

describe('DateTime.js', () => {
    beforeEach(() => {
        testUtils.reset();
    });


    it('constructor', () => {
        sinon.useFakeTimers();
        const getElementById = document.getElementById.withArgs('dom-id').returns('a-dom');

        const datetime = new DateTime('dom-id');
        sinon.assert.calledOnce(getElementById);

        assert.deepEqual(datetime, {
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

        sinon.assert.calledOnce(dateTime.timeSelector.setDate.withArgs([now.format('YYYY-MM-DD HH:mm')]));
    });

    it('destroy', () => {
        const dateTime = new DateTime('dom-id');
        const destroy = sinon.stub();
        dateTime.timeSelector = { destroy: destroy };

        dateTime.destroy();

        sinon.assert.calledOnce(destroy);
    });
});