if (process.env.NODE_ENV === undefined) {
    require('dotenv-json')();
}

const fs = require('fs');
const NeoCities = require('neocities');

const api = new NeoCities('theobot', process.env.NEO_PW);

const files = fs
    .readdirSync('docs')
    .filter(file => !file.includes('.map'))
    .map(file => {
        return { name: file, path: 'docs/' + file };
    });

api.upload(files, function(resp) {
    console.log(resp);
});
