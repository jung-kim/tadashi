const eventSignals = require('../../helpers/signals').eventSignals;
const twitchClient = require('../../singletons/twitchClient');
const auth = require('../../singletons/auth');
const api = require('../../singletons/api');
const constants = require('../../helpers/constants');
const filter = require('../../singletons/filter');

class NavOptionVC {
    constructor() {
        this.channelInputAutoComplete = undefined;
        this.toDsipose = [];

        this.fetchList = _.debounce(this._fetchList.bind(this), 500, { leading: false });
        this.streamSelect = _.debounce(this._streamSelect.bind(this), 500, { leading: false });
        this.populateStreamInfo = _.debounce(this._populateStreamInfo.bind(this), 500, { leading: false });
        this.syncChannelInput = _.debounce(() => {
            this.channelInputAutoComplete.input.value = filter.getChannel();
        }, 250, { leading: false });
        require('../../helpers/signals').domSignals.add(this._domSignalsFunc.bind(this));
    }

    _domSignalsFunc(payload) {
        /* istanbul ignore else */
        if (payload.type === 'click' && payload.id.endsWith('-interval')) {
            this._intervalClickEvent(payload.event);
        } else if (payload.id === 'channel-input') {
            switch (payload.type) {
                case 'keyup':
                    this._onChannelInputKeyUp(payload.event);
                    break;
                case 'click':
                    this._refreshList();
                    break;
                case 'focusout':
                case 'channel.input.update':
                    this.syncChannelInput();
                    break;
            }
        } else if (payload.id === 'channel-refresh') {
            switch (payload.type) {
                case 'click':
                    twitchClient.changeToRandomFeaturedStream();
                    break;
            }
        } else if (payload.id === 'channel-save') {
            switch (payload.type) {
                case 'click':
                    twitchClient.saveChannel();
                    break;
            }
        }
    }

    _onChannelInputKeyUp(event) {
        if (event.keyCode === 13 || event.awesompleteSelect) {
            // enter key, trigger channel change
            this.lastSearchedChannel = this.channelInputAutoComplete.input.value;
            this.streamSelect();
            return;
        }

        // other keys, refresh list
        this._refreshList();
    }

    _refreshList() {
        const channelToSearch = this.channelInputAutoComplete.input.value;

        if (this.lastSearchedChannel === channelToSearch) {
            this.channelInputAutoComplete.open()
            return;
        }

        this.lastSearchedChannel = channelToSearch;
        this.fetchList();
    }

    async _fetchList() {
        const searchResult = await api.getChannelSearch(this.lastSearchedChannel, auth.getAuthObj());
        this.channelInputAutoComplete.list = (searchResult.data || []).map(stream => stream.display_name);
    }

    async _streamSelect() {
        // stream validation.
        try {
            await twitchClient.changeChannel(this.lastSearchedChannel);
            this.populateStreamInfo();
        } catch (err) {
            eventSignals.dispatch({
                alert: {
                    type: 'warning',
                    body: `Requested ${this.lastSearchedChannel} is not a valid channel.`
                }
            });
        }
        this.channelInputAutoComplete.close();
    }

    async _populateStreamInfo() {
        this.channelInputAutoComplete.input.value = this.lastSearchedChannel || filter.getChannel();
        document.getElementById('embeded-twitch-channel').innerText = filter.getChannel();

        try {
            this.streamInfo = await api.getChannelInfo(filter.getChannel(), auth.getAuthObj());
            if (this.streamInfo && this.streamInfo.data && this.streamInfo.data.length > 0) {
                document.getElementById('embeded-twitch-desc').innerHTML = `${this.streamInfo.data[0].title}`;
            } else {
                document.getElementById('embeded-twitch-desc').innerHTML = `(inactive...)`;
            }
        } catch (err) {
            document.getElementById('embeded-twitch-desc').innerHTML = `${filter.getChannel()}'s stream`;
        }
    }

    // set interval click events
    _intervalClickEvent(event) {
        const label = event.srcElement.innerHTML;
        switch (label) {
            case '1 minute':
                filter.setIntervalLevel(constants.BUCKET_MIN);
                break;
            case '5 minutes':
                filter.setIntervalLevel(constants.BUCKET_FIVE);
                break;
            case '1 hour':
                filter.setIntervalLevel(constants.BUCKET_HOUR);
                break;
            case '1 day':
                filter.setIntervalLevel(constants.BUCKET_DAY);
                break;
        }
        document.getElementById('interval-selector-btn').innerText = label;
    }

    initialize() {
        this.destroy();
        document.getElementById("nav-options").innerHTML = templates[`./hbs/stream/nav-options.hbs`]();

        // set interval drop down
        this.toDsipose.push(new BSN.Dropdown(document.getElementById('interval-selector')));
        // set helpful popover messages
        this.toDsipose.push(new BSN.Popover(document.getElementById(`interval-selector-help`), {
            title: "Timeseries interval level",
            content: "Select timeseries interval level.",
            delay: 500,
            placement: 'bottom'
        }));
        // set helpful popover messages
        this.toDsipose.push(new BSN.Popover(document.getElementById(`channel-refresh-help`), {
            title: "Randomize channel",
            content: "Randomize channel based on featured streams API call.",
            delay: 500,
            placement: 'bottom'
        }));
        // set helpful popover messages
        this.toDsipose.push(new BSN.Popover(document.getElementById(`channel-save-help`), {
            title: "Save channel",
            content: "Cache channel to be used on next page time page loads.",
            delay: 500,
            placement: 'bottom'
        }));

        // set up channel auto complete
        this.channelInputAutoComplete = new Awesomplete(document.getElementById('channel-input'), {
            minChars: 4,
            maxItems: 10,
            autoFirst: true,
        });
        this.channelInputAutoComplete.input.addEventListener('awesomplete-selectcomplete', this._onChannelInputKeyUp.bind(this));
    }

    destroy() {
        /* istanbul ignore else */
        if (this.channelInputAutoComplete) {
            this.channelInputAutoComplete.destroy();
            this.channelInputAutoComplete = undefined;
        }
        this.toDsipose.forEach(td => td.dispose());
        this.toDsipose.length = 0;
    }
}

module.exports = new NavOptionVC();
