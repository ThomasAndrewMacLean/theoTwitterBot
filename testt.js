const ApiBuilder = require('claudia-api-builder');
const api = new ApiBuilder();
const Twit = require('twit');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

if (process.env.NODE_ENV === undefined) {
    require('dotenv-json')();
}
const T = new Twit({
    consumer_key: process.env.CONS_KEY,
    consumer_secret: process.env.CONS_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000
});
T.get(
    'statuses/user_timeline',
    { screen_name: 'theoRandomBot1', count: 10, tweet_mode: 'extended' },
    function(err, data, response) {
        const ownTweets = data
            .filter(
                tw =>
                    // remove reply tweets
                    tw.in_reply_to_status_id === null &&
                    // remove retweets
                    tw.retweeted_status === undefined
            )
            .map(tweet => ({ text: tweet.full_text, id: tweet.id_str }));
        T.post(
            'statuses/update',
            {
                status: '🐛d!!',
                in_reply_to_status_id: ownTweets[0].id
            },
            function(err, data, response) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(data.text + ' tweeted!');
                }
            }
        );
    }
);
