const chartFilter = require('../../shared/chartFilter');

const NUM_PER_PAGE = 250;

const chattersGroupHBS = templates[`./hbs/stream/components/chatters-group.hbs`];
const chattersGroupListHBS = templates[`./hbs/stream/components/chatters-group-list.hbs`];

// Chatters are a data storage around array of users to help display them at the front end.
class Chatters {
    constructor(key, allChatters) {
        this._update(key, allChatters);
        this.toPreviousPage = _.throttle(this._toPreviousPage.bind(this), 200);
        this.toNextPage = _.throttle(this._toNextPage.bind(this), 200);
        this.updateChattersList = _.throttle(this._updateChattersList.bind(this), 2000);
    }

    _update(key, allChatters) {
        // @todo search
        this.allChatters = chartFilter.getUserFilter().filterUsers(allChatters);
        this._validatePageNumber();
        this._key = key

        if (!this._expandButton) {
            this._chatterContainerDom = document.getElementById('chatter-container').
                insertAdjacentHTML('beforeend', chattersGroupHBS(this._key));
            this._expandButton = new BSN.Collapse(document.getElementById(`${this._key}-expand`));
        }

        if (this.allChatters.length <= NUM_PER_PAGE) {
            // hide pagination
            document.getElementById(`${this._key}-paginator`).classList.add('d-none');
        } else {
            // show pagination
            document.getElementById(`${this._key}-paginator`).classList.remove('d-none');
            this._updatePaginationNumbers();
        }

        document.getElementById(`${this._key}-count`).textContent = this.allChatters.length;
        this._updateChattersList();
    }

    _validatePageNumber() {
        const pn = Math.max(this._pageNumber || 0, 0);
        this._pageNumber = pn * NUM_PER_PAGE > this.allChatters.length ? 0 : pn;
    }

    _updatePaginationNumbers() {
        if (this.allChatters.length > NUM_PER_PAGE) {
            document.getElementById(`${this._key}-pagination-numbers`).
                textContent = `${this.getLeftIndex()} ~ ${this.getRightIndex()}`;
        }
    }

    _updateChattersList() {
        document.getElementById(`${this._key}-list-chatters`).
            innerHTML = chattersGroupListHBS(this._getPage());
        Array.from(document.getElementsByClassName('user-info'))
            .forEach(target => new BSN.Popover(target));
    }

    update(newChatters) {
        this._update(this._key, newChatters);
    }

    getLeftIndex() {
        return this._pageNumber * NUM_PER_PAGE;
    }

    getRightIndex() {
        return Math.min(this.allChatters.length, this.getLeftIndex() + NUM_PER_PAGE);
    }

    _getPage() {
        return this.allChatters.slice(this.getLeftIndex(), this.getRightIndex());
    }

    _toNextPage() {
        if ((this._pageNumber + 1) * NUM_PER_PAGE < this.allChatters.length) {
            this._pageNumber++;
            this._updatePaginationNumbers();
            this._updateChattersList();
        }
    }

    _toPreviousPage() {
        if (this._pageNumber - 1 >= 0) {
            this._pageNumber--;
            this._updatePaginationNumbers();
            this._updateChattersList();
        }
    }
}

module.exports = Chatters;
