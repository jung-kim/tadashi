const madge = require('madge');
const { assert } = require('chai');

describe('tests for circular dependencies', async () => {
    it('check', async () => {
        const res = await madge('./js/main.js');
        const circularDeps = res.circularGraph();

        if (Object.keys(circularDeps).length > 0) {
            assert.fail(`There are circular dependencies...\n\n${JSON.stringify(circularDeps, null, 2)}`);
        }
    });
});