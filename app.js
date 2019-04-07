const ApiBuilder = require('claudia-api-builder');
const api = new ApiBuilder();
const Twit = require('twit');

if (process.env.NODE_ENV === undefined) {
    require('dotenv-json')();
}

console.log(process.env.NODE_ENV);
const T = new Twit({
    consumer_key: process.env.CONS_KEY,
    consumer_secret: process.env.CONS_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000
});

// T.post('statuses/update', { status: 'hello world!' }, function(
//     err,
//     data,
//     response
// ) {
//     console.log(data);
// });

api.get('/test', function(request) {
    return process.env.NODE_ENV;
});

module.exports = api;
