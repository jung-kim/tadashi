const sinon = require('sinon');
const { assert } = require('chai');

const constants = require('../../../../js/helpers/constants');
const dataCache = require('../../../../js/simpletons/dataCache');
const proceedsByTypesVC = require('../../../../js/events/stream/components/proceedsByTypesVC');

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
        sinon.stub(dataCache, 'getTotal')
            .withArgs('abc', 1577901600, 1577902020, constants.TYPE_CHEER, undefined)
            .returns({ _sum: 5 })
            .withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUB, undefined)
            .returns({ _sum: 6 })
            .withArgs('abc', 1577901600, 1577902020, constants.TYPE_RESUB, undefined)
            .returns({ _sum: 7 })
            .withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUBGIFT, undefined)
            .returns({ _sum: 8 })
            .withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUBMYSTERY, undefined)
            .returns({ _sum: 9 });
        await proceedsByTypesVC._update();
        assert.deepEqual(proceedsByTypesVC._labels, ["100 Cheer", "Subs", "Resubs", "Sub Gifts", "Sub Mystery"]);
        assert.deepEqual(proceedsByTypesVC._datasets, [5, 6, 7, 8, 9]);
    });

    it('_getBackgroundColor()', () => {
        assert.deepEqual(proceedsByTypesVC._getBackgroundColor(), [
            "rgb(51, 255, 255, 0.3)",
            "rgb(0, 128, 225, 0.3)",
            "rgb(153, 255, 51, 0.3)",
            "rgb(255, 128, 0, 0.3)",
            "rgb(128, 128, 128, 0.3)",
        ]);
    });
    it('_getBorderColor', () => {
        assert.deepEqual(proceedsByTypesVC._getBorderColor(), [
            "rgb(51, 255, 255, 0.3)",
            "rgb(0, 128, 225, 0.3)",
            "rgb(153, 255, 51, 0.3)",
            "rgb(255, 128, 0, 0.3)",
            "rgb(128, 128, 128, 0.3)",
        ]);
    });
});