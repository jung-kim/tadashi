class DataNode {
    constructor(sum, users) {
        this._sum = sum || 0;
        this._users = users || {};
    }

    add(raw) {
        const value = raw.bits ? raw.bits / 100 : 1;
        this._sum += value;
        this._users[raw.displayName] = (this._users[raw.displayName] || 0) + value;
    }

    getCopy(filter) {
        // @todo search
        if (!filter) {
            return new DataNode(this._sum, { ...this._users });
        }
        let sum = 0;
        const users = Object.keys(this._users).reduce((obj, key) => {
            if (filter.isApplicable(key)) {
                sum += this._users[key];
                obj[key] = this._users[key];
            }
            return obj;
        }, {});

        return new DataNode(sum, users);
    }

    // merge values of `dggNode` into `this`. 
    merge(dggNode) {
        if (dggNode) {
            this._sum += dggNode._sum;

            Object.keys(dggNode._users).forEach(key => {
                this._users[key] = (this._users[key] || 0) + dggNode._users[key];
            });
        }
        return this;
    }

    split(dggNode) {
        this._sum -= dggNode._sum;

        Object.keys(dggNode._users).forEach(key => {
            if (this._users[key]) {
                this._users[key] -= dggNode._users[key];
            } else {
                /// this shouldn't happen???
            }

            if (this._users[key] <= 0) {
                delete this._users[key];
            }
        });

        return this;
    }
}

module.exports = DataNode;