
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
    });

    it('_toggleEmbededTwitch', () => {
        document.getElementById.withArgs('twitch-embed').returns({
            classList: {
                contains: sinon.stub().returns(true)
            }
        });

        const _handleEmbededTwitch = sinon.stub(twitchEmbededVC, '_handleEmbededTwitch');
        twitchEmbededVC._toggleEmbededTwitch();

        sinon.assert.calledOnce(_handleEmbededTwitch);
        assert.equal(localStorage.getItem('isOpenTwitchEmbeded'), 'true');
    });

    describe('initialize', () => {
        it('open twitch embeded', () => {
            const destroy = sinon.stub(twitchEmbededVC, 'destroy');
            const _handleEmbededTwitch = sinon.stub(twitchEmbededVC, '_handleEmbededTwitch');
            sinon.stub(twitchEmbededVC, '_getIsOpenTwitchEmbeded').returns(true);

            twitchEmbededVC.initialize();

            sinon.assert.calledOnce(destroy);
            sinon.assert.calledOnce(_handleEmbededTwitch);
        });

        it('do not open twitch embeded', () => {
            const destroy = sinon.stub(twitchEmbededVC, 'destroy');
            sinon.stub(twitchEmbededVC, '_getIsOpenTwitchEmbeded').returns(false);
            const hide = sinon.stub();
            BSN.Collapse.returns({ hide: hide });

            twitchEmbededVC.initialize();

            sinon.assert.calledOnce(destroy);
            sinon.assert.calledOnce(hide);
        });
    });

    describe('destroy', () => {
        it('has values to destroy', () => {
            const dispose = sinon.stub();
            const destroy = sinon.stub();
            twitchEmbededVC.twitchEmbededCollapse = { dispose: dispose };
            twitchEmbededVC.embededTwitch = { destroy: destroy };

            twitchEmbededVC.destroy();

            sinon.assert.calledOnce(dispose);
            sinon.assert.calledOnce(destroy);
            assert.isUndefined(twitchEmbededVC.twitchEmbededCollapse);
            assert.isUndefined(twitchEmbededVC.embededTwitch);
        });
    });
});