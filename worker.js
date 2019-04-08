const Twit = require('twit');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

checkIsEmoji = string => {
    var regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    return !!string.match(regex);
};

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
    { screen_name: 'FranckenTheo', count: 500, tweet_mode: 'extended' },
    function(err, data, response) {
        const ownTweets = data
            .filter(
                tw =>
                    // remove reply tweets
                    tw.in_reply_to_status_id === null &&
                    // remove retweets
                    tw.retweeted_status === undefined
            )
            .map(tweet => ({ text: tweet.full_text, id: tweet.id }));

        const emojis = [];
        const hashtags = [];
        const people = [];
        const words = [];

        console.log(`Processing ${ownTweets.length} tweets...`);

        ownTweets.forEach(tweet => {
            tweet = tweet.text;
            // replace newlines with spaces
            tweet = tweet.replace(/\n/g, ' ');
            // remove double spaces
            tweet = tweet.replace(/[ ]{2,}/gi, ' ');
            // remove leading and trailing spaces
            tweet = tweet.replace(/(^\s*)|(\s*$)/gi, '');
            // split into words, and remove internal twitter links
            const wordsInTweet = tweet
                .split(' ')
                .filter(w => !w.includes('https://t.co/'));

            wordsInTweet.forEach(word => {
                // remove dots
                word = word.replace(/\./g, '');
                if (checkIsEmoji(word)) {
                    emojis.push(word);
                } else if (word[0] === '@') {
                    people.push(word);
                } else if (word[0] === '#') {
                    hashtags.push(word);
                } else if (word) {
                    words.push(word);
                }
            });
        });

        // console.log(emojis);
        // console.log(hashtags);
        // console.log(people);
        // console.log(words);

        return;

        var params = {
            TableName: 'theotwitterbot',
            Item: {
                id: 'emojis',
                data: emojis
            }
        };
        dynamoDb.put(params, function(err, data) {
            if (err) {
                console.log('Error', err);
            } else {
                console.log('Success', data);
            }
        });

        params = {
            TableName: 'theotwitterbot',
            Item: {
                id: 'hashtags',
                data: hashtags
            }
        };
        dynamoDb.put(params, function(err, data) {
            if (err) {
                console.log('Error', err);
            } else {
                console.log('Success', data);
            }
        });

        params = {
            TableName: 'theotwitterbot',
            Item: {
                id: 'people',
                data: people
            }
        };
        dynamoDb.put(params, function(err, data) {
            if (err) {
                console.log('Error', err);
            } else {
                console.log('Success', data);
            }
        });

        params = {
            TableName: 'theotwitterbot',
            Item: {
                id: 'words',
                data: words
            }
        };
        dynamoDb.put(params, function(err, data) {
            if (err) {
                console.log('Error', err);
            } else {
                console.log('Success', data);
            }
        });
    }
);
