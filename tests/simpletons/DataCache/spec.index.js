const { assert } = require('chai');
const sinon = require('sinon');

const constants = require('../../../js/helpers/constants');
const Chat = require('../../../js/models/events/Chat');
const dataCache = require("../../../js/simpletons/dataCache");
const { blankDataBucket, blankDataNode } = require('../../../js/simpletons/dataCache/models/blanks');
const filter = require('../../../js/events/shared/chartFilter').getFilter();


describe('dataCache/index.js', () => {
    beforeEach(() => {
        dataCache.reset();
    });

    it('_isValidRaw', () => {
        assert.isFalse(dataCache._isValidRaw({}));
        assert.isFalse(dataCache._isValidRaw({ displayName: 'aaa' }));
        assert.isTrue(dataCache._isValidRaw({
            displayName: 'aaa',
            timestamp: 1111,
        }));
    });

    it('add', () => {
        dataCache.add('aaa', {});
        assert.deepEqual(Object.keys(dataCache._data), []);

        dataCache.add('aaa', new Chat({
            displayName: 'aaa',
            timestamp: 1000,
        }));
        assert.deepEqual(Object.keys(dataCache._data), ['aaa']);
        assert.deepEqual(Object.keys(dataCache._data['aaa']._data), ['0']);
    });

    it('get', () => {
        assert.deepEqual(dataCache.get('aaa', 1, 60, filter), blankDataBucket);

        dataCache._data['aaa'] = { get: () => { } };
        sinon.stub(dataCache._data['aaa'], 'get').withArgs(1, 60, filter).returns('test');
        assert.equal(dataCache.get('aaa', 1, 60, filter), 'test');
    });

    it('getTotal', () => {
        assert.deepEqual(dataCache.getTotal('aaa', 1, 60, constants.TYPE_CHAT, filter), blankDataNode);

        dataCache._data['aaa'] = { getTotal: () => { } };
        sinon.stub(dataCache._data['aaa'], 'getTotal').withArgs(1, 60, constants.TYPE_CHAT, filter).returns('test');
        assert.equal(dataCache.getTotal('aaa', 1, 60, constants.TYPE_CHAT, filter), 'test');

    });
});

