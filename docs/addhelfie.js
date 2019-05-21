const button = document.getElementById('add-helfie-btn');
const helfiesList = document.getElementById('helfiesList');
const success = document.getElementById('success');
const helfie = document.getElementById('add-helfie-input');
const URL =
    'https://sq4ecdjftk.execute-api.eu-west-1.amazonaws.com/dev/addhelfie';
const gethelfies =
    'https://sq4ecdjftk.execute-api.eu-west-1.amazonaws.com/dev/helfies';

button.addEventListener('click', e => {
    const name = helfie.value;
    if (!name) return;
    helfie.value = '';
    e.preventDefault();
    fetch(URL, {
        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ helfie: name.replace('@', '').trim() })
    })
        .then(dataJson => dataJson.json())
        .then(data => {
            var listItem = document.createElement('li');
            listItem.textContent = '@' + name.replace('@', '').trim();

            helfiesList.appendChild(listItem);
            success.innerHTML = '👌💛🖤🦁';
            setTimeout(() => {
                success.innerHTML = '';
            }, 5000);
        });
});

fetch(gethelfies)
    .then(x => x.json())
    .then(allHelfies => {
        allHelfies.forEach(helfie => {
            var listItem = document.createElement('li');
            listItem.textContent = '@' + helfie;

            helfiesList.appendChild(listItem);
        });
    });
