
const { assert } = require('chai');
const _ = require('lodash');
const sinon = require('sinon');

const twitchEmbededVC = require('../../../js/events/stream/twitchEmbededVC');
const twitchClient = require('../../../js/singletons/twitchClient');

describe('twitchEmbededVC', () => {
    beforeEach(() => { reset() });

    describe('domeEventFunction', () => {
        const toggleEmbededTwitch = sinon.stub(twitchEmbededVC, 'toggleEmbededTwitch');

        twitchEmbededVC._domeEventFunction({ type: 'click', id: 'embeded-twitch-collapse' });

        sinon.assert.calledOnce(toggleEmbededTwitch);
    });

    describe('_getIsOpenTwitchEmbeded', () => {
        it('valid local storage', () => {
            localStorage.setItem('isOpenTwitchEmbeded', false);
            assert.isFalse(twitchEmbededVC._getIsOpenTwitchEmbeded());
        });

        it('invalid local storage', () => {
            localStorage.removeItem('isOpenTwitchEmbeded');
            assert.isTrue(twitchEmbededVC._getIsOpenTwitchEmbeded());
        })
    });

    describe('_handleEmbededTwitch', () => {
        it('_getIsOpenTwitchEmbeded true', () => {
            sinon.stub(twitchEmbededVC, '_getIsOpenTwitchEmbeded').returns(true);
            sinon.stub(twitchClient, 'getChannel').returns('abc');
            Twitch = {
                Embed: sinon.stub().withArgs('twitch-embed', {
                    width: '100%',
                    height: '100%',
                    channel: 'abc',
                    autoplay: true,
                    muted: true,
                    allowfullscreen: false
                })
            };

            twitchEmbededVC._handleEmbededTwitch();

            sinon.assert.calledOnce(Twitch.Embed);
        });

        it('_getIsOpenTwitchEmbeded false with valid embeded twitch', () => {
            sinon.stub(twitchEmbededVC, '_getIsOpenTwitchEmbeded').returns(false);
            twitchEmbededVC.embededTwitch = { destroy: sinon.stub() };

            twitchEmbededVC._handleEmbededTwitch();

            sinon.assert.calledOnce(twitchEmbededVC.embededTwitch.destroy);
        });
    })
});