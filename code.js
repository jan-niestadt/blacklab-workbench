// We're using plain Javascript, no jQuery or other libraries, to keep it simple and easy to understand

API_URL = 'http://localhost:8080/blacklab-server';

// When page ready: contact the API
const params = new URLSearchParams();
params.append("custom", true);
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Whenever a select, input or textarea changes, update the URL to reflect the current state of the form
    document.querySelectorAll('form select, form input, form textarea').forEach(element => {
        element.addEventListener('change', updateUrl);
    });
    document.querySelectorAll('form input[type=text], form textarea').forEach(element => {
        element.addEventListener('keyup', updateUrl);
    });

    // Reload corpora if we change the server URL
    document.getElementById('server-url').addEventListener('change', loadCorpora);

    // Clicking search performs the search
    document.getElementById('search-form').addEventListener('submit', event => {
        event.preventDefault();
        performSearch();
    });

    // Changing the view type updates the displayed results
    document.getElementById('view-type').addEventListener('change', showSearchResults);

    // Initial load of corpora
    loadCorpora();
    updateUrl();
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
function updateUrl() {
    const serverUrl = document.getElementById('server-url').value;
    const corpus = document.getElementById('corpus').value;
    const endpoint = 'hits';
    const params = new URLSearchParams();
    params.append("patt", document.getElementById('patt').value);
    params.append("outputformat", document.getElementById('outputformat').value);
    document.getElementById('url').href = `${serverUrl}/corpora/${corpus}/${endpoint}?${params}`;
}

async function loadCorpora() {
    const selectedCorpus = document.getElementById('corpus').value;
    const serverUrl = document.getElementById('server-url').value;
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
        updateUrl();
    } catch (error) {
        console.error('Error loading corpora:', error);
        document.getElementById('corpus').innerHTML = '<option value="">Error loading corpora</option>';
    }
}
