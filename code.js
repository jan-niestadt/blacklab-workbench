// We're using plain Javascript, no jQuery or other libraries, to keep it simple and easy to understand

API_URL = 'http://localhost:8080/blacklab-server';

// When page ready: contact the API
const params = new URLSearchParams();
params.append("custom", true);
document.addEventListener('DOMContentLoaded', init);

function init() {

    // Corpus change
    document.getElementById('corpus').addEventListener('change', event => setCorpusName(event.target.value));

    // Form element change hooks    
    document.querySelectorAll('select#corpus, form select, form input, form textarea').forEach(element => {
        element.addEventListener('change', onFormElementChange);
    });
    // Form text input keyup hooks
    document.querySelectorAll('form input[type=text], form textarea').forEach(element => {
        element.addEventListener('keyup', onFormElementChange);
    });

    // Clicking search performs the search
    document.getElementById('search-form').addEventListener('submit', event => {
        event.preventDefault();
        performSearch();
    });

    // Changing the view type updates the displayed results
    document.getElementById('view-type').addEventListener('change', showSearchResults);

    updateUi();
}

let interfaceMode = 'choose-server';

function updateUi() {
    interfaceMode = !serverUrl ? 'choose-server' : (!corpusName ? 'choose-corpus' : 'search');

    document.body.classList = [...document.body.classList].filter(c => !c.startsWith('mode-'));
    document.body.classList.add(`mode-${interfaceMode}`);

    const showUrl = serverUrl || '';
    document.querySelectorAll('span.server-url').forEach(el => el.textContent = showUrl);
    const showCorpus = corpusName || '';
    document.querySelectorAll('span.corpus-name').forEach(el => el.textContent = showCorpus);

    loadCorpora();
    updateSearchUrl();
}

let searchContent = null;

async function performSearch() {
    const url = document.getElementById('url').href;
    try {
        const response = await fetch(url, {
            method: 'GET'
        });
        const isJson = response.headers.get("Content-Type")?.split(';')[0]?.trim() === 'application/json';
        searchContent = isJson ? JSON.stringify(await response.json(), null, 2) : await response.text();
        showSearchResults();
    } catch(error) {
        document.getElementById('results').textContent = `Error fetching results: ${error}`;
    }
}

let corpusName = null;

function setCorpusName(name) {
    corpusName = name;
    updateUi();
}

function onFormElementChange(event) {
    updateSearchUrl();
}

let serverUrl = null;

function setServerUrl(url) {
    serverUrl = url;
    if (!serverUrl)
        corpusName = null;
    updateUi();
}

function showSearchResults() {
    const viewType = document.getElementById('view-type').value;
    document.body.className = `view-${viewType}`; // Set the body class to the view
    if (viewType === 'results') {
        const el = document.getElementById('results');
        el.textContent = searchContent;
    } else {
        const el = document.getElementById('plain-results');
        el.textContent = searchContent;
    }
}

// Update the URL to reflect the current state of the form
function updateSearchUrl() {
    const server = serverUrl || '<no-server>';
    const corpus = document.getElementById('corpus').value;
    const endpoint = 'hits';
    const params = new URLSearchParams();
    params.append("patt", document.getElementById('patt').value);
    params.append("outputformat", document.getElementById('outputformat').value);
    document.getElementById('url').href = `${server}/corpora/${corpus}/${endpoint}?${params}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let currentCorporaServer = null;

async function loadCorpora() {
    if (!serverUrl || serverUrl === currentCorporaServer)
        return;
    currentCorporaServer = serverUrl;
    const selectedCorpus = document.getElementById('corpus').value;
    document.body.classList.add('loading');
    try {
        const response = await fetch(`${serverUrl}/?${params}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
        });
        const data = await response.json();
        document.getElementById('corpus').innerHTML = 
            Object.entries(data.corpora).map(([key, corpus]) => `<option value="${key}">${key}${corpus.custom.displayName ? ` (${corpus.custom.displayName})` : ''}</option>`).join('');
        if (selectedCorpus && data.corpora[selectedCorpus]) {
            document.getElementById('corpus').value = selectedCorpus;
        } else {
            document.getElementById('corpus').value = Object.keys(data.corpora)[0] || '';
        }
        updateSearchUrl();
        //await sleep(2000);
    } catch (error) {
        console.error('Error loading corpora:', error);
        document.getElementById('corpus').innerHTML = '<option value="">Error loading corpora</option>';
    } finally {
        document.body.classList.remove('loading');
    }
}
