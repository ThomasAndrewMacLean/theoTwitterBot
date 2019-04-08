const button = document.getElementById('tweet-btn');
const tweet = document.getElementById('tweet');
const URL =
    'https://sq4ecdjftk.execute-api.eu-west-1.amazonaws.com/dev/randomTweet';
button.addEventListener('click', () => {
    fetch(URL)
        .then(dataJson => dataJson.json())
        .then(data => {
            tweet.innerHTML = data;
        });
});
