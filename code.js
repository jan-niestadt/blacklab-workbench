// We're using plain Javascript, no jQuery or other libraries, to keep it simple and easy to understand

API_URL = 'http://localhost:8080/blacklab-server';

// When page ready: contact the API
const params = new URLSearchParams();
params.append("custom", true);
document.addEventListener('DOMContentLoaded', init);

function init() {

    document.getElementById('server-list').addEventListener('change', event => setServerUrl(event.target.value));

    document.getElementById('corpus-list').addEventListener('change', event => setCorpusName(event.target.value));

    // Form element change hooks    
    document.querySelectorAll('form select, form input, form textarea').forEach(element => {
        element.addEventListener('change', onFormElementChange);
    });
    // Form text input keyup hooks
    document.querySelectorAll('form input[type=text], form textarea').forEach(element => {
        element.addEventListener('keyup', onFormElementChange);
    });

    // Submitting form performs the search
    document.getElementById('search-form').addEventListener('submit', event => {
        event.preventDefault();
        performSearch();
    });

    // Changing the view type updates the displayed results
    document.getElementById('view-plain').addEventListener('change', showSearchResults);

    loadServers();
    updateUi();
}

let interfaceMode = 'choose-server';

function updateBodyProp(prop, value) {
    document.body.classList = [...document.body.classList].filter(c => !c.startsWith(`${prop}-`));
    document.body.classList.add(`${prop}-${value}`);
}

function updateUi() {
    // What's the current mode? select server -> select corpus -> search
    interfaceMode = !serverUrl ? 'choose-server' : (!corpusName ? 'choose-corpus' : 'search');
    updateBodyProp('mode', interfaceMode);

    // Show the current server and corpus in the UI
    const showUrl = serverUrl || '';
    document.querySelectorAll('span.server-url').forEach(el => el.textContent = showUrl);
    const showCorpus = corpusName || '';
    document.querySelectorAll('span.corpus-name').forEach(el => el.textContent = showCorpus);

    // If necessary, load the corpora for the selected server
    loadCorpora();

    // Update the search URL based on the current state of the form
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

let serverUrl = null;

let serverApiVersion = null;

function setCorpusName(name) {
    corpusName = name;
    updateUi();
}

function onFormElementChange(event) {
    updateSearchUrl();
}

function setServerUrl(url) {
    serverUrl = url;
    if (!serverUrl)
        corpusName = null;
    updateUi();
}

function showSearchResults() {
    const viewType = document.getElementById('view-plain').checked ? 'plain' : 'results';
    updateBodyProp('view', viewType); // Set the body class to the view
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
    const corpus = corpusName || '<no-corpus>';
    const endpoint = 'hits';
    const params = new URLSearchParams();
    params.append("patt", document.getElementById('patt').value);
    params.append("outputformat", document.getElementById('outputformat').value);
    const api = document.getElementById('api').value || serverApiVersion;
    if (api !== serverApiVersion)
        params.append("api", api);
    const optCorpora = api >= 5 ? '/corpora' : '';
    document.getElementById('url').href = `${server}${optCorpora}/${corpus}/${endpoint}?${params}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let currentCorporaServer = null;

function loading(b) {
    if (b) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

async function withLoading(fn, errorHandler) {
    loading(true);
    try {
        return await fn();
    } catch (error) {
        if (errorHandler) {
            errorHandler(error);
        } else {
            console.error(error);
        }
    } finally {
        loading(false);
    }
}

async function loadServers() {
    return withLoading(async () => {
        console.log('Loading servers...');
        const servers = [
            { display: '--- choose server ---', url: '' },
            { url: 'http://localhost:8080/blacklab-server' },
            { url: 'http://svotmc10.ivdnt.loc:8080/blacklab-server' }
        ]
        document.getElementById('server-list').innerHTML = 
            servers.map(server => `<option value="${server.url}">${server.display || server.url}</option>`).join('');
    }, (error) => {
        console.error('Error loading servers:', error);
        document.getElementById('server-list').innerHTML = '<option value="">Error loading servers</option>';
    });
}

async function loadCorpora() {
    if (!serverUrl || serverUrl === currentCorporaServer)
        return;
    currentCorporaServer = serverUrl;
    return withLoading(async () => {
        const url = `${serverUrl}/?${params}`;
        console.log('Loading corpora from', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
        });
        const data = await response.json();
        serverApiVersion = data.apiVersion.trim().charAt(0);
        document.getElementById('server-info').textContent = `API v${data.apiVersion}`;
        document.getElementById('corpus-list').innerHTML = 
            '<option value="">--- choose corpus ---</option>' +
            Object.entries(data.corpora).map(([key, corpus]) => {
                const display = key + (corpus.custom.displayName ? ` (${corpus.custom.displayName})` : '');
                return `<option value="${key}">${display}</option>`;
            })
            .join('');
        updateSearchUrl();
        //await sleep(2000);
    }, (error) => {
        console.error('Error loading corpora:', error);
        document.getElementById('corpus-list').innerHTML = '<option value="">Error loading corpora</option>';
    });
}
