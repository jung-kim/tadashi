# Contributing Guidelines

These are the contributing guidelines as well as some documentation on how the code is structured. Read up before contributing to make everything as smooth as possible.

## Posting issues

Just common sense; do a quick search before posting, someone might already have created an issue (or resolved the problem!). If you're posting a bug; try to include as much relevant information as possible (ungit version, node and npm version, OS, any Git errors displayed, the output from CLI console and output from the browser console).

## Getting started

### requirements

Tadashi is mostly a front end app therefor dependencies are mostly for instrumentation purposes.  Listed below are setup used to develop Tadashi but requirements are not as strict.

1. `node >= 14.4.0`
2. `npm >= 7.5.2`

### unit tests

There are automatic tests that tests bulk of the logics.

- `npm run test`

### test coverages

Runs test coverage and relevant data and files will be generated at `./coverage` folder.  `open ./coverage/index.html` will show detailed coverage reports.

- `npm run cov`

### run local instance

Before any developments or changes, one should be able to test basic functionalities via running local instance.

1. create new [twitch application](https://dev.twitch.tv/console/apps/create) for free
2. update `./env/.env.local` with the client id. (client secret is not necessary.)
3. start the [helper proxy server](./proxy-server/README.md).
    - `npm --prefix ./proxy-server i; npm --prefix ./proxy-server run start`
4. build the project
    - `npm run build`
4. navigate to the local instance
    - `open ./public/index.html`
