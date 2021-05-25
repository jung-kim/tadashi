const sinon = require('sinon');
const { assert } = require('chai');

const constants = require('../../../../js/helpers/constants');
const dataCache = require('../../../../js/simpletons/dataCache');
const proceedsByTypesVC = require('../../../../js/events/stream/charts/proceedsByTypesVC');

describe('proceedsByTypesVC.js', () => {
    afterEach(() => {
        sinon.verifyAndRestore();
    });

    it('_update()', async () => {
        sinon.stub(proceedsByTypesVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            searchValue: undefined,
            startBucket: 1577901600,
        });
        sinon.stub(dataCache, 'get').
            withArgs('abc', 1577901600, 1577902020, undefined).
            returns(getTestDataBucket(10))
        document.getElementById.withArgs(proceedsByTypesVC._chartDomSelector).returns({});
        proceedsByTypesVC.reset();
        await proceedsByTypesVC._update();
        assert.deepEqual(proceedsByTypesVC._getRootLabels(), ["100 Cheer", "Subs", "Resubs", "Sub Gifts", "Sub Mystery"]);
        assert.deepEqual(proceedsByTypesVC._getDataset()[0].data, [10, 10, 10, 10, 10]);
    });

    it('_backgroundColor', () => {
        assert.deepEqual(proceedsByTypesVC._backgroundColor, [
            "rgb(51, 255, 255, 0.3)",
            "rgb(0, 128, 225, 0.3)",
            "rgb(153, 255, 51, 0.3)",
            "rgb(255, 128, 0, 0.3)",
            "rgb(128, 128, 128, 0.3)",
        ]);
    });
    it('_borderColor', () => {
        assert.deepEqual(proceedsByTypesVC._borderColor, [
            "rgb(51, 255, 255, 1.0)",
            "rgb(0, 128, 225, 1.0)",
            "rgb(153, 255, 51, 1.0)",
            "rgb(255, 128, 0, 1.0)",
            "rgb(128, 128, 128, 1.0)",
        ]);
    });
});