const signals = require('../../helpers/signals').signals;
const twitchClient = require('../../singletons/twitchClient');
const twitchAPI = require('../../singletons/twitchAPI');
const constants = require('../../helpers/constants');
const chartFilter = require('../shared/chartFilter');

require('../../helpers/signals').domSignals.add((payload) => {
    if (payload.type === 'click' && payload.id.endsWith('-interval')) {
        navOptionVC._intervalClickEvent(payload.event);
    } else if (payload.id === 'channel-input') {
        switch (payload.type) {
            case 'keyup':
                navOptionVC._onChannelInputKeyUp(payload.event);
                break;
            case 'click':
                navOptionVC._refreshList();
                break;
            case 'focusout':
            case 'channel.input.update':
                navOptionVC.syncChannelInput();
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
});

class NavOptionVC {
    constructor() {
        this.channelInputAutoComplete = undefined;
        this.toDsipose = [];

        this.fetchList = _.debounce(this._fetchList.bind(this), 500, { leading: false });
        this.streamSelect = _.debounce(this._streamSelect.bind(this), 500, { leading: false });
        this.populateStreamInfo = _.debounce(this._populateStreamInfo.bind(this), 500, { leading: false });
        this.syncChannelInput = _.debounce(() => {
            this.channelInputAutoComplete.input.value = twitchClient.getChannel();
        }, 250, { leading: false });
    }

    _onChannelInputKeyUp(event) {
        const channelToSearch = this.channelInputAutoComplete.input.value;

        if (event.keyCode === 13 || event.awesompleteSelect) {
            // enter key, trigger channel change
            this.lastSearchedChannel = channelToSearch;
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
        const searchResult = await twitchAPI.getChannelSearch(this.lastSearchedChannel);
        this.channelInputAutoComplete.list = (searchResult.data || []).map(stream => stream.display_name);
    }

    async _streamSelect() {
        // stream validation.
        try {
            await twitchClient.changeChannel(this.lastSearchedChannel);
            this.populateStreamInfo();
        } catch (err) {
            signals.dispatch({
                alert: {
                    type: 'warning',
                    body: `Requested ${this.lastSearchedChannel} is not a valid channel.`
                }
            });
        }
        this.channelInputAutoComplete.close();
    }

    async _populateStreamInfo() {
        const channel = twitchClient.getChannel();
        try {
            this.channelInputAutoComplete.input.value = this.lastSearchedChannel || channel;
            document.getElementById('embeded-twitch-channel').innerText = channel;

            this.streamInfo = await twitchAPI.getChannelInfo(channel);
            if (this.streamInfo && this.streamInfo.data && this.streamInfo.data.length > 0) {
                document.getElementById('embeded-twitch-desc').innerHTML = `${this.streamInfo.data[0].title}`;
            } else {
                document.getElementById('embeded-twitch-desc').innerHTML = `(inactive...)`;
            }
        } catch (err) {
            document.getElementById('embeded-twitch-desc').innerText = `${channel}'s stream`;
        }
    }

    // set interval click events
    _intervalClickEvent(event) {
        const signalEvent = { event: "filter.interval.change", label: event.srcElement.innerHTML };
        switch (signalEvent.label) {
            case '1 minute':
                signalEvent.intervalLevel = constants.BUCKET_MIN;
                break;
            case '5 minutes':
                signalEvent.intervalLevel = constants.BUCKET_FIVE;
                break;
            case '1 hour':
                signalEvent.intervalLevel = constants.BUCKET_HOUR;
                break;
            case '1 day':
                signalEvent.intervalLevel = constants.BUCKET_DAY;
                break;
        }
        document.getElementById('interval-selector-btn').innerText = signalEvent.label;
        chartFilter.update({ intervalLevel: signalEvent.intervalLevel });
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
        if (this.channelInputAutoComplete) {
            this.channelInputAutoComplete.destroy();
            this.channelInputAutoComplete = undefined;
        }
        this.toDsipose.forEach(td => td.dispose());
        this.toDsipose.length = 0;
    }
}

const navOptionVC = new NavOptionVC();
module.exports = navOptionVC;
