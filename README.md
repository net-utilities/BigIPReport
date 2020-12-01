# BigIPReport

This tool will pull the configuration from multiple load balancers and display it in a table.

Demo can be shown here:

[https://loadbalancing.se/bigipreportdemo](https://loadbalancing.se/bigipreportdemo)

Installation instructions are available here:

[https://loadbalancing.se/bigip-report/](https://loadbalancing.se/bigip-report/)

DevCentral codeshare:

[https://devcentral.f5.com/codeshare/bigip-report](https://devcentral.f5.com/codeshare/bigip-report)

### Some components used for this project
* [jQuery](https://jquery.com/)
* [Data tables](https://datatables.net/)
* [jQuery hightlight plugin](http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html)
* [SHJS](http://shjs.sourceforge.net)

# Developing Javascript
1. Install NodeJS
2. Run `npm install`
4. Run `tsc --watch` which uses `tsconfig.json`

The typescript files will now be transpiled and written to js folder path when changes are detected.
