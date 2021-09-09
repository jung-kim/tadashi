const { assert } = require('chai');
const sinon = require('sinon');

const Chat = require('../../../js/models/events/Chat');
const dataCache = require("../../../js/singletons/dataCache");
const { blankDataBucket } = require('../../../js/singletons/dataCache/models/blanks');
const DataChannel = require('../../../js/singletons/dataCache/models/DataChannel');
const eventSignals = require('../../../js/helpers/signals').eventSignals;


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

        dataCache.add('#aaa', new Chat({
            displayName: 'aaa',
            timestamp: 1000,
        }));
        assert.deepEqual(Object.keys(dataCache._data), ['aaa']);
        assert.deepEqual(Object.keys(dataCache._data['aaa']._data), ['0']);

        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: 'data.cache.updated' }));
    });

    it('get', () => {
        assert.deepEqual(dataCache.get('aaa', 0, 60), blankDataBucket);

        dataCache._data['aaa'] = new DataChannel();
        const get = sinon.stub(dataCache._data['aaa'], 'get').withArgs(0, 60).returns('something');

        assert.equal(dataCache.get('aaa', 0, 60), 'something');
        sinon.assert.calledOnce(get);
    });
});

