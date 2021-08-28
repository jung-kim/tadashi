const filter = require('../../filter');

const keyIsOpenTwitchEmbeded = 'isOpenTwitchEmbeded';

class TwitchEmbededVC {
    constructor() {
        this.lastSearchedChannel = undefined;
        this.embededTwitch = undefined;
        this.twitchEmbededCollapse = undefined;
        this.streamInfo = undefined;

        this.toggleEmbededTwitch = _.debounce(this._toggleEmbededTwitch.bind(this), 1000, { leading: false });
        require('../../../helpers/signals').domSignals.add(this._domeEventFunction.bind(this));
    }

    _domeEventFunction(payload) {
        /* istanbul ignore else */
        if (payload.type === 'click' && payload.id === 'embeded-twitch-collapse') {
            this.toggleEmbededTwitch();
        }
    }

    _getIsOpenTwitchEmbeded() {
        const value = localStorage.getItem(keyIsOpenTwitchEmbeded)
        return value ? JSON.parse(value) : true
    }

    _handleEmbededTwitch() {
        /* istanbul ignore else */
        if (this._getIsOpenTwitchEmbeded()) {
            this.embededTwitch = new Twitch.Embed("twitch-embed", {
                width: '100%',
                height: '100%',
                channel: filter.getChannel(),
                autoplay: true,
                muted: true,
                allowfullscreen: false
            });
        } else if (this.embededTwitch) {
            this.embededTwitch.destroy();
        }
    }

    _toggleEmbededTwitch() {
        const isShowing = document.getElementById('twitch-embed').classList.contains('show');
        localStorage.setItem(keyIsOpenTwitchEmbeded, JSON.stringify(Boolean(isShowing)));
        this._handleEmbededTwitch();
    }

    initialize() {
        this.destroy();
        const embededTwitchBtn = document.getElementById('embeded-twitch-collapse');
        this.twitchEmbededCollapse = new BSN.Collapse(embededTwitchBtn);

        if (this._getIsOpenTwitchEmbeded()) {
            this._handleEmbededTwitch();
        } else {
            this.twitchEmbededCollapse.hide();
        }
    }

    destroy() {
        /* istanbul ignore else */
        if (this.twitchEmbededCollapse) {
            this.twitchEmbededCollapse.dispose();
            this.twitchEmbededCollapse = undefined;
        }
        /* istanbul ignore else */
        if (this.embededTwitch) {
            this.embededTwitch.destroy();
            this.embededTwitch = undefined;
        }
    }
}

module.exports = new TwitchEmbededVC();
