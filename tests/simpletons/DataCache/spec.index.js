const { assert } = require('chai');
const sinon = require('sinon');

const Chat = require('../../../js/models/events/Chat');
const dataCache = require("../../../js/simpletons/dataCache");
const { blankDataBucket, blankDataNode } = require('../../../js/simpletons/dataCache/models/blanks');
const DataChannel = require('../../../js/simpletons/dataCache/models/DataChannel');



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
        assert.deepEqual(dataCache.get('aaa', 1, 60), blankDataBucket);

        dataCache._data['aaa'] = { get: () => { } };
        sinon.stub(dataCache._data['aaa'], 'get').withArgs(1, 60, undefined).returns('test');
        assert.equal(dataCache.get('aaa', 1, 60, undefined), 'test');
    });

    it('getTotal', () => {
        assert.deepEqual(dataCache.getTotal('aaa', 1, 60), blankDataNode);

        dataCache._data['aaa'] = { getTotal: () => { } };
        sinon.stub(dataCache._data['aaa'], 'getTotal').withArgs(1, 60, undefined).returns('test');
        assert.equal(dataCache.getTotal('aaa', 1, 60, undefined), 'test');

    });
});

