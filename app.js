const ApiBuilder = require('claudia-api-builder');
const api = new ApiBuilder();
const Twit = require('twit');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const fetch = require('node-fetch');

if (process.env.NODE_ENV === undefined) {
    require('dotenv-json')();
}

const getRandom = (arr) => {
    const randomIndex = Math.floor(Math.random() * arr.length);

    return arr[randomIndex];
};

const generateTweet = () => {
    return dynamoDb
        .scan({ TableName: 'theotwitterbot' })
        .promise()
        .then((response) => {
            const words = response.Items.find((x) => x.id === 'words').data;
            const people = response.Items.find((x) => x.id === 'people').data;
            const hashtags = response.Items.find((x) => x.id === 'hashtags')
                .data;
            const emojis = response.Items.find((x) => x.id === 'emojis').data;
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

const getCovidData = () => {
    return fetch(
        'https://europe-west1-thomasmaclean.cloudfunctions.net/getRecentCovidData'
    )
        .then((x) => x.json())
        .then((y) => {
            const totaalAantal = y.totaal
                .trim()
                .split('*')
                .join('')
                .split(' ')
                .filter((x, i) => i < 2)
                .join(' ');

            const totaalPerc = y.totaal.trim().split(' ').pop();

            const sterfAantal = y.sterfGevallen
                .trim()
                .split('*')
                .join('')
                .split(' ')
                .filter((x, i) => i < 2)
                .join(' ');

            const sterfPerc = y.sterfGevallen.trim().split(' ').pop();

            const opnameAantal = y.opnames
                .trim()
                .split('*')
                .join('')
                .split(' ')
                .filter((x, i) => i < 2)
                .join(' ');

            const opnamePerc = y.opnames.trim().split(' ').pop();

            let newTweet = 'COVID DATA: ' + y.datum + '\n' + '\n' 
                + `Bevestigde gevallen: ${totaalAantal} (${totaalPerc})\n`
                + `Sterfgevallen: ${sterfAantal} (${sterfPerc})\n`
                + `Opnames in het ziekenhuis: ${opnameAantal} (${opnamePerc})\n`
            ;
            return newTweet
        });
};

const getHelfies = () => {
    return dynamoDb
        .scan({ TableName: 'theotwitterbot' })
        .promise()
        .then((response) => {
            const helfies = response.Items.filter((x) => x.type === 'helfie');

            return helfies;
        });
};
const T = new Twit({
    consumer_key: process.env.CONS_KEY,
    consumer_secret: process.env.CONS_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000,
});

api.get('/helfies', (request) => {
    // GET all data
    return getHelfies();
});

api.get('/database', (request) => {
    // GET all data
    return dynamoDb
        .scan({ TableName: 'theotwitterbot' })
        .promise()
        .then((response) => response);
});

api.get('/randomTweet', (request) => {
    return generateTweet();
});

api.put('/tweet', (req, res) => {
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
        throw new ApiBuilder.ApiResponse(
            '<error>' + login + ' login error</error>',
            { 'Content-Type': 'text/xml' },
            500
        );
    }

    return generateTweet().then((tweet) => {
        T.post('statuses/update', { status: tweet }, (err, data, response) => {
            if (err)
                throw new ApiBuilder.ApiResponse(
                    '<error>' + err + '</error>',
                    { 'Content-Type': 'text/xml' },
                    500
                );
            return data;
        });
    });
});

api.put('/covid', (req, res) => {
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
        throw new ApiBuilder.ApiResponse(
            '<error>' + login + ' login error</error>',
            { 'Content-Type': 'text/xml' },
            500
        );
    }

    return getCovidData().then((tweet) => {
        T.post('statuses/update', { status: tweet }, (err, data, response) => {
            if (err)
                throw new ApiBuilder.ApiResponse(
                    '<error>' + err + '</error>',
                    { 'Content-Type': 'text/xml' },
                    500
                );
            return data;
        });
    });
});
api.post(
    '/addhelfie',
    function (request) {
        var params = {
            TableName: 'theotwitterbot',
            Item: {
                id: 'helfie:' + request.body.helfie,
                name: request.body.helfie,
                type: 'helfie',
            },
        };
        return dynamoDb.put(params).promise();
    },
    { success: 201 }
);

api.post(
    '/updatehelfie',
    async (request) => {
        const helfie = request.body.helfie;
        const helfies = await getHelfies();

        const hh = helfies.find((h) => h.name === helfie);
        if (hh) {
            var params = {
                TableName: 'theotwitterbot',
                Item: {
                    ...hh,
                    laatstetweet: 'haha' + Date.now().toString(),
                },
            };

            return dynamoDb.put(params).promise();
        }
    },
    { success: 201 }
);
api.put('/answerhelfies', async (req, res) => {
    console.log('ANSWER....');

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
        throw new ApiBuilder.ApiResponse(
            '<error>' + login + ' login error</error>',
            { 'Content-Type': 'text/xml' },
            500
        );
    }

    const compliment = [
        'Goed gezegd',
        'Wat een inzicht',
        'Inderdaad',
        'Dacht ik ook',
        'Geniaal ben jij',
        'Uhu',
        'Zo had ik het nog niet bekeken',
        'Ja',
        'Inderdaad',
    ];

    const openingszin = [
        'Ik houd eigenlijk niet van regen, maar voor een spetter zoals jij maak ik een uitzondering.',
        'Ken ik jou niet van Griekenland? Niet? Want daar komen toch alle godinnen vandaan?',
        'Jouw vader is een dief! Hij heeft alle sterren gestolen en in jouw ogen verstopt!',
        'Je lijkt heel erg op mijn toekomstige vrouw..',
        'Is het nou zo warm hier binnen of ben jij dat?',
        'Deed het pijn, Toen je uit de hemel kwam vallen?',
        'Mijn hobby is puzzelen en jij bent het laatste stukje dat ik zocht.',
        'Houd jij van vrachtwagens? Nee? Dan hebben we iets gemeen. Ik namelijk ook niet.',
        'Weet jij waar mijn shirt van is gemaakt? Boyfriend material.',
        'Geloof jij in liefde op het eerste gezicht of zal ik nog een keertje langslopen?',
        'Ben jij niet moe? Je loopt al uren rondjes in mijn hoofd.',
        'Liefde troost als zonneschijn na regen.',
        'Tijd doet er niet toe, liefde is voor altijd.',
        'Liefde is een betere meester dan plicht.',
        'Het plezier van de liefde duurt slechts een moment. Pijn van liefde een leven lang.',
        'Heet jij soms Google? want je hebt alles wat ik zoek',
        'Ik ben een telefoonboek aan het schrijven, mag ik je nummer?',
        'Je zal wel moe zijn, nadat je al die tijd in mijn dromen hebt rondgelopen.',
        'Als de enige plaats waar ik je kon zien in m’n dromen was, zou ik eeuwig slapen.',
        'Ken je de pagina openingszin.com?',
        'So open your mouth and close your eyes and give your tounge some exercise.',
        'Mag ik twee bier, een cola, en jouw telefoonnummer?',
        'Er moet iets aan de hand zijn met mijn ogen want ik kan ze niet van je afhouden.',
        'Ik wil met jou wel eens een beschuitje eten.',
        'Ik wil met jou wel eens een potje klaverjassen.',
    ];

    const helfies = await getHelfies();

    return Promise.all(
        helfies.map(async (h) => {
            const helfie = '@' + h.name + ' ';
            console.log(helfie);
            return await T.get('statuses/user_timeline', {
                screen_name: helfie,
                count: 10,
                tweet_mode: 'extended',
            })
                .then((data) => {
                    console.log('komt ieee');
                    const ownTweets = data.data
                        .filter(
                            (tw) =>
                                // remove reply tweets
                                tw.in_reply_to_status_id === null &&
                                // remove retweets
                                tw.retweeted_status === undefined
                        )
                        .map((tweet) => ({
                            text: tweet.full_text,
                            id: tweet.id_str,
                        }));
                    if (
                        ownTweets.length &&
                        h.laatstetweet !== ownTweets[0].id
                    ) {
                        console.log(ownTweets[0].text);
                        return T.post(
                            'statuses/update',
                            {
                                status:
                                    helfie +
                                    getRandom(compliment) +
                                    ',... ' +
                                    getRandom(openingszin),
                                in_reply_to_status_id: ownTweets[0].id,
                            },
                            function (err, data, response) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    var params = {
                                        TableName: 'theotwitterbot',
                                        Item: {
                                            ...h,
                                            laatstetweet: ownTweets[0].id,
                                        },
                                    };

                                    return dynamoDb.put(params).promise();
                                    console.log(data.text + ' tweeted!');
                                }
                            }
                        );
                    }
                })
                .catch((err) => {
                    var params = {
                        TableName: 'theotwitterbot',
                        Item: {
                            ...h,
                            error: err.message,
                        },
                    };

                    return dynamoDb.put(params).promise();
                    return err;
                });
        })
    );
});

api.put('/answer', (req, res) => {
    const helfie = '@lutdebisschop ';
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
        throw new ApiBuilder.ApiResponse(
            '<error>' + login + ' login error</error>',
            { 'Content-Type': 'text/xml' },
            500
        );
    }

    const compliment = [
        'Goed gezegd',
        'Wat een inzicht',
        'Inderdaad',
        'Dacht ik ook',
        'Geniaal ben jij',
    ];

    const answers = [
        'Ik houd eigenlijk niet van regen, maar voor een spetter zoals jij maak ik een uitzondering.',
        'Ken ik jou niet van Griekenland? Niet? Want daar komen toch alle godinnen vandaan?',
        'Jouw vader is een dief! Hij heeft alle sterren gestolen en in jouw ogen verstopt!',
        'Je lijkt heel erg op mijn toekomstige vrouw..',
        'Is het nou zo warm hier binnen of ben jij dat?',
        'Deed het pijn, Toen je uit de hemel kwam vallen?',
        'Mijn hobby is puzzelen en jij bent het laatste stukje dat ik zocht.',
    ];

    return T.get(
        'statuses/user_timeline',
        {
            screen_name: helfie,
            count: 10,
            tweet_mode: 'extended',
        },
        function (err, data, response) {
            const ownTweets = data
                .filter(
                    (tw) =>
                        // remove reply tweets
                        tw.in_reply_to_status_id === null &&
                        // remove retweets
                        tw.retweeted_status === undefined
                )
                .map((tweet) => ({
                    text: tweet.full_text,
                    id: tweet.id_str,
                }));
            T.post(
                'statuses/update',
                {
                    status:
                        helfie +
                        getRandom(compliment) +
                        ',... ' +
                        getRandom(answers),
                    in_reply_to_status_id: ownTweets[0].id,
                },
                function (err, data, response) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(data.text + ' tweeted!');
                    }
                }
            );
        }
    );
});

module.exports = api;
