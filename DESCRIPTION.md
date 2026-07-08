# BlackLab Workbench

BlackLab Workbench is intended to be a simple web application that provides an interface to use BlackLab Server for testing and debugging queries. It is designed to be more convenient to use than typing BlackLab URLs directly, or a generic tool like Postman.


## Relevant information

The BlackLab API is described in the [BlackLab API documentation](https://blacklab.ivdnt.org/server/rest-api/) (organized in categories such as Server and corpus information, Search, Documents, etc.).


## Functional requirements

- User can specify a URL to a BlackLab Server instance to use, or choose a recently used one (stored in local storage).
- When a server has been chosen, the user can select the corpus to use from a list of available corpora (fetched from the server).
- User chooses which endpoint they want to test (e.g. `/hits`, `/docs`, etc.)
- Depending on the endpoint chosen, a form is displayed with the parameters available for that endpoint. Each parameter will be a simple control appropriate to the parameter. Often a text box (i.e. `patt`, `filter`, etc.), sometimes as checkbox or dropdown selection. The user can fill in the parameters and submit the request. For the `patt` parameter specifically (used in several endpoints), a list of recently used patterns is available (stored in local storage).
- When the request is submitted, the response is displayed below the form. We'll start with the plain response (can be JSON (which the application should request as the default) or XML). Later we might want to add a more user-friendly display of the response (e.g. a table for hits, or a list of documents).
- Server, corpus and endpoint are displayed in a "breadcrumbs" style at the top of the page. At any time, the user can easily change which which endpoint they're testing, which corpus they're querying or which server they're using. The rest of the interface will update accordingly.


## Technical requirements

- Uses plain Javascript, HTML and CSS. No build tools, frameworks or libraries are used.
- The application is a single-page application (SPA) that uses the browser's history API to manage navigation between different views (e.g. server selection, corpus selection, endpoint selection, request form + response display).
