# BigIPReport

This tool will pull the configuration from multiple load balancers and display it in a table.

## Repository layout

- `frontend/`: TypeScript source, frontend build tooling, and frontend container files.
- `frontend/underlay/`: built static site served by nginx (`index.html`, `css/`, `js/`, `json/`).
- `data-collector/`: PowerShell collector script, modules, XML config, and data-collector container files.
- `helm/`: Helm chart.
- `frontend/cypress/`: Cypress end-to-end tests.

Demo can be shown here:

[https://loadbalancing.se/bigipreportdemo](https://loadbalancing.se/bigipreportdemo)

Installation instructions are available here:

[https://loadbalancing.se/bigipreport-rest/](https://loadbalancing.se/bigipreport-rest/)

DevCentral codeshare:

[https://devcentral.f5.com/codeshare/bigip-report](https://devcentral.f5.com/codeshare/bigip-report)

### Some components used for this project
* [jQuery](https://jquery.com/)
* [Data tables](https://datatables.net/)
* [jQuery hightlight plugin](http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html)
* [SHJS](http://shjs.sourceforge.net)

# Developing Javascript
1. Install NodeJS
2. Run `cd frontend && npm install`
3. Run `npm run build:dev`

The TypeScript files will now be transpiled and written to `frontend/underlay/js` when changes are detected.

[More details on how to contribute to BigIPReport](https://loadbalancing.se/2022/01/19/contributing-to-bigipreport/)

