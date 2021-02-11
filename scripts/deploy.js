const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-west-2' });
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
const glob = require('glob');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');
const env = require('./env');

const cfDistributionID = 'E39EW10V43C6IH';

console.log(`>>> deploying to "${env.ENVIRONMENT}"`);

if (env.ENVIRONMENT === 'local') {
    console.warn('nothing to deploy for local')
    return;
}

const getBucket = () => {
    switch (env.ENVIRONMENT) {
        case 'prod':
            return 'www.tadashi.io';
        default:
            throw 'invalid env';
    }
}

const getKey = (base) => {
    switch (env.ENVIRONMENT) {
        case 'prod':
            return `public/${base}`;
        default:
            throw 'invalid env';
    }
}

Promise.all(glob.sync('./public/*').map(async (file) => {
    if (file.includes('hash.json')) {
        return;
    }
    const parsedPath = path.parse(file);
    const param = {
        Bucket: getBucket(),
        Key: getKey(parsedPath.base),
        Body: await fs.readFile(file),
        ContentType: mime.lookup(parsedPath.ext),
    }

    return s3.putObject(param).promise();
})).then(() => {
    const reference = new Date().getTime().toString();
    return cloudfront.createInvalidation({
        DistributionId: cfDistributionID,
        InvalidationBatch: {
            CallerReference: reference,
            Paths: {
                Quantity: 1,
                Items: ['/*'],
            },
        },
    }).promise();
});
