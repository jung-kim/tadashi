const sinon = require('sinon');
const { assert } = require('chai');

const constants = require('../../../../js/helpers/constants');
const dataCache = require('../../../../js/simpletons/dataCache');
const proceedsByUsersVC = require('../../../../js/events/stream/charts/proceedsByUsersVC');

describe('proceedsByUsersVC.js', () => {
    afterEach(() => {
        sinon.verifyAndRestore();
    });

    it('_update()', async () => {
        sinon.stub(proceedsByUsersVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            searchValue: undefined,
            startBucket: 1577901600,
        });
        sinon.stub(dataCache, 'getTotal').
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_CHEER, undefined).
            returns({
                _sum: 5,
                _users: {
                    'a': 3,
                    'b': 1,
                    'c': 1,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUB, undefined).
            returns({
                _sum: 5,
                _users: {
                    'd': 3,
                    'e': 2,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_RESUB, undefined).
            returns({
                _sum: 5,
                _users: {
                    'a': 3,
                    'b': 2,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUBGIFT, undefined).
            returns({
                _sum: 5,
                _users: {
                    'f': 5,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUBMYSTERY, undefined).
            returns({
                _sum: 5,
                _users: {
                    'f': 2,
                    'a': 3,
                }
            });

        document.getElementById.withArgs(proceedsByUsersVC._chartDomSelector).returns({});
        proceedsByUsersVC.reset();
        await proceedsByUsersVC._update();

        assert.deepEqual(proceedsByUsersVC._getRootLabels(), ['a', 'f', 'b', 'd', 'e', 'c']);
        assert.deepEqual(proceedsByUsersVC._getDataset()[0].data, [9, 7, 3, 3, 2, 1]);
        assert.deepEqual(proceedsByUsersVC._sumByType, [
            { 1: 3, 2: 3, 7: 3 },
            { 6: 5, 7: 2 },
            { 1: 2, 2: 1 },
            { 3: 3 },
            { 3: 2 },
            { 2: 1 }
        ]);


        sinon.verifyAndRestore();

        sinon.stub(proceedsByUsersVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            searchValue: undefined,
            startBucket: 1577901600,
        });
        sinon.stub(dataCache, 'getTotal').
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_CHEER, undefined).
            returns({
                _sum: 5,
                _users: {
                    a: 1,
                    b: 1,
                    c: 1,
                    d: 1,
                    e: 1,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUB, undefined).
            returns({
                _sum: 5,
                _users: {
                    f: 2,
                    g: 1,
                    h: 1,
                    i: 1,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_RESUB, undefined).
            returns({
                _sum: 5,
                _users: {
                    j: 1,
                    k: 1,
                    l: 1,
                    m: 1,
                    n: 1,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUBGIFT, undefined).
            returns({
                _sum: 5,
                _users: {
                    a: 5,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUBMYSTERY, undefined).
            returns({
                _sum: 5,
                _users: {
                    b: 2,
                    c: 3,
                }
            });

        await proceedsByUsersVC._update();

        assert.deepEqual(proceedsByUsersVC._getRootLabels(), ['a', 'c', 'b', 'f', 'd', 'e', 'g', 'h', 'i', 'j']);
        assert.deepEqual(proceedsByUsersVC._getDataset()[0].data, [6, 4, 3, 2, 1, 1, 1, 1, 1, 1]);
        assert.deepEqual(proceedsByUsersVC._sumByType, [
            { 2: 1, 6: 5 },
            { 2: 1, 7: 3 },
            { 2: 1, 7: 2 },
            { 3: 2 },
            { 2: 1 },
            { 2: 1 },
            { 3: 1 },
            { 3: 1 },
            { 3: 1 },
            { 1: 1 }
        ]);
    });

    it('afterLabel()', () => {
        sinon.stub(proceedsByUsersVC, '_getParameters').returns({
            channel: 'abc',
            endBucket: 1577902020,
            interval: constants.BUCKET_MIN,
            length: 8,
            searchValue: undefined,
            startBucket: 1577901600,
        });
        sinon.stub(dataCache, 'getTotal').
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_CHEER, undefined).
            returns({
                _sum: 5,
                _users: {
                    a: 1,
                    b: 1,
                    c: 1,
                    d: 1,
                    e: 1,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUB, undefined).
            returns({
                _sum: 5,
                _users: {
                    f: 2,
                    g: 1,
                    h: 1,
                    i: 1,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_RESUB, undefined).
            returns({
                _sum: 5,
                _users: {
                    j: 1,
                    k: 1,
                    l: 1,
                    m: 1,
                    n: 1,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUBGIFT, undefined).
            returns({
                _sum: 5,
                _users: {
                    a: 5,
                }
            }).
            withArgs('abc', 1577901600, 1577902020, constants.TYPE_SUBMYSTERY, undefined).
            returns({
                _sum: 5,
                _users: {
                    b: 2,
                    c: 3,
                }
            });

        assert.deepEqual(proceedsByUsersVC._afterLabel('a'), [
            "  cheer: 100",
            "  subscription gift: 5",
        ]);

        assert.deepEqual(proceedsByUsersVC._afterLabel('aaa'), []);
    });
});
