const ApiBuilder = require('claudia-api-builder');
const api = new ApiBuilder();
const Twit = require('twit');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

if (process.env.NODE_ENV === undefined) {
    require('dotenv-json')();
}

const getRandom = arr => {
    const randomIndex = Math.floor(Math.random() * arr.length);

    return arr[randomIndex];
};

const generateTweet = () => {
    return dynamoDb
        .scan({ TableName: 'theotwitterbot' })
        .promise()
        .then(response => {
            const words = response.Items.find(x => x.id === 'words').data;
            const people = response.Items.find(x => x.id === 'people').data;
            const hashtags = response.Items.find(x => x.id === 'hashtags').data;
            const emojis = response.Items.find(x => x.id === 'emojis').data;
            let newTweet = '';

            for (let index = 0; index < 15; index++) {
                if (newTweet.length < 280) newTweet += `${getRandom(words)} `;
            }
            if (newTweet.length < 280) newTweet += `${getRandom(emojis)} `;
            if (newTweet.length < 280) newTweet += `${getRandom(hashtags)} `;
            if (newTweet.length < 280) newTweet += `${getRandom(hashtags)} `;

            return newTweet.trim();
        });
};

const T = new Twit({
    consumer_key: process.env.CONS_KEY,
    consumer_secret: process.env.CONS_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000
});

api.get('/database', request => {
    // GET all data
    return dynamoDb
        .scan({ TableName: 'theotwitterbot' })
        .promise()
        .then(response => response);
});

api.get('/randomTweet', request => {
    return generateTweet();
});

api.get('/tweet', (req, res) => {
    const b64auth = (req.headers.Authorization || '').split(' ')[1] || '';
    const [login, password] = new Buffer(b64auth, 'base64')
        .toString()
        .split(':');

    if (
        !login ||
        !password ||
        login !== 'theobot' ||
        password !== process.env.CRON_SECRET
    ) {
        return { message: 'Error in Authorization', login };
    }

    return generateTweet().then(tweet => {
        T.post('statuses/update', { status: tweet }, (err, data, response) => {
            return data;
        });
    });
});

module.exports = api;
