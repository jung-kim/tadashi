const { assert } = require('chai');
const sinon = require('sinon');

const Chat = require('../../../js/models/events/Chat');
const dataCache = require("../../../js/simpletons/dataCache");
const { blankDataBucket } = require('../../../js/simpletons/dataCache/models/blanks');
const DataChannel = require('../../../js/simpletons/dataCache/models/DataChannel');
const filter = require('../../../js/events/shared/chartFilter').getUserFilter();
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

        dataCache.add('aaa', new Chat({
            displayName: 'aaa',
            timestamp: 1000,
        }));
        assert.deepEqual(Object.keys(dataCache._data), ['aaa']);
        assert.deepEqual(Object.keys(dataCache._data['aaa']._data), ['0']);

        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: 'data.cache.updated' }));
    });

    it('get', () => {
        assert.deepEqual(dataCache.get('aaa', 0, 60, filter), blankDataBucket);

        dataCache._data['aaa'] = new DataChannel();
        const get = sinon.stub(dataCache._data['aaa'], 'get').withArgs(0, 60, filter).returns('something');

        assert.equal(dataCache.get('aaa', 0, 60, filter), 'something');
        sinon.assert.calledOnce(get);
    });
});

