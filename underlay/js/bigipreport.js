/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "av": () => (/* binding */ renderLoadBalancer),
  "HM": () => (/* binding */ siteData),
  "nJ": () => (/* binding */ updateLocationHash)
});

;// CONCATENATED MODULE: ./js-src/PoolDetails/translateStatus.ts
/** ********************************************************************************************************************
 Translates the status and availability of a member to less cryptic text and returns a dictionary
 **********************************************************************************************************************/
function translateStatus(member) {
    const translatedStatus = {
        availability: '',
        enabled: '',
        realtime: '',
    };
    switch (member.availability) {
        case 'available':
            translatedStatus['availability'] = '<span class="memberup">UP</span>';
            break;
        case 'unknown':
            translatedStatus['availability'] =
                '<span class="memberunknown">UNKNOWN</span>';
            break;
        default:
            translatedStatus['availability'] = '<span class="memberdown">DOWN</span>';
    }
    switch (member.enabled) {
        case 'enabled':
            translatedStatus['enabled'] =
                '<span class="memberenabled">Enabled</span>';
            break;
        case 'disabled-by-parent':
            translatedStatus['enabled'] =
                '<span class="memberdisabled">Disabled by parent</span>';
            break;
        case 'disabled':
            translatedStatus['enabled'] =
                '<span class="memberdisabled">Disabled</span>';
            break;
        default:
            translatedStatus['enabled'] =
                '<span class="memberunknown">Unknown</span>';
    }
    switch (member.realtimestatus) {
        case 'up':
            translatedStatus['realtime'] = '<span class="memberup">UP</span>';
            break;
        case 'down':
            translatedStatus['realtime'] = '<span class="memberdown">DOWN</span>';
            break;
        case 'session_disabled':
            translatedStatus['realtime'] =
                '<span class="memberdisabled">DISABLED</span>';
            break;
        default:
            translatedStatus['realtime'] = (member.realtimestatus || 'N/A').toUpperCase();
    }
    return translatedStatus;
}

;// CONCATENATED MODULE: ./js-src/PoolDetails/selectMonitorInputText.ts
// Did not detect hoisting, disabled
// eslint-disable-next-line no-unused-vars
function selectMonitorInputText(e) {
    $(e.target).find('p input').focus();
    $(e.target).find('p input').select();
}

;// CONCATENATED MODULE: ./js-src/PoolDetails/parseMonitorRequestParameters.ts
function parseMonitorRequestParameters(sendString) {
    const lines = sendString.split(/\\r\\n|\\\\r\\\\n/);
    const requestDataArr = lines[0].split(' ');
    // Invalid HTTP request
    if (requestDataArr.length !== 3)
        return {};
    const [verb, uri, version] = requestDataArr;
    const monitorComponents = {
        verb,
        uri,
        version,
        headers: []
    };
    // Add only valid headers
    for (const h of lines.filter(l => /^[^:]+: *[^:]*$/.test(l))) {
        const [key, value] = h.split(/:\s*/);
        monitorComponents.headers.push({ key, value });
    }
    return monitorComponents;
}

;// CONCATENATED MODULE: ./js-src/PoolDetails/generateMonitorTests.ts

const generateMonitorTests = (monitor, member) => {
    const { type, sendstring } = monitor;
    const protocol = type.replace(/:.*$/, '');
    const { verb, uri, version, headers } = parseMonitorRequestParameters(sendstring);
    const monitorTests = {};
    let curl, http, netcat;
    if (['http', 'https', 'tcp', 'tcp-half-open'].includes(protocol)) {
        if (['http', 'https'].includes(protocol)) {
            if (verb === 'GET' ||
                verb === 'HEAD') {
                curl = 'curl';
                if (verb === 'HEAD') {
                    curl += ' -I';
                }
                if (version === 'HTTP/1.0') {
                    curl += ' -0';
                }
                for (const h of headers) {
                    curl += ` -H &quot;${h.key}:${h.value}&quot;`;
                }
                curl += ` ${protocol}://${member.ip}:${member.port}${uri}`;
            }
            monitorTests.curl = curl;
        }
        if (protocol === 'http' ||
            protocol === 'tcp' ||
            protocol === 'tcp-half-open') {
            netcat = `echo -ne &quot;${sendstring}&quot; | nc ${member.ip} ${member.port}`;
        }
        if (protocol === 'http' || protocol === 'https') {
            http = `${protocol}://${member.ip}:${member.port}${uri}`;
        }
        console.log('rasdasd');
    }
    return {
        curl,
        http,
        netcat,
    };
};
/* harmony default export */ const PoolDetails_generateMonitorTests = (generateMonitorTests);

;// CONCATENATED MODULE: ./js-src/PoolDetails/showPoolDetails.ts
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};




/**
 * A more modern approach to copy a string into the clipboard
 * @param str
 * @Return Promise<void>
 */
const navCopy = (str) => {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText)
        return navigator.clipboard.writeText(str);
    return Promise.reject('The Clipboard API is not available.');
};
/**
 * Copy data-copy attribute content from a monitor test button
 * @param e
 */
const copyToClipBoard = (e) => __awaiter(void 0, void 0, void 0, function* () {
    const monitorButton = e.target;
    const copyString = monitorButton.getAttribute('data-copy');
    try {
        yield navCopy(copyString);
    }
    catch (e) {
        const el = document.createElement('textarea');
        el.value = copyString;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
});
/** ********************************************************************************************************************
 Shows the pool details light box
 **********************************************************************************************************************/
/**
 * Renders the pool details div
 * @param pool
 * @param loadbalancer
 * @param layer
 */
function showPoolDetails(pool, loadbalancer, layer = 'first') {
    const matchingpool = siteData.poolsMap.get(loadbalancer + ':' + pool);
    const layerContentDiv = $(`#${layer}layerdetailscontentdiv`);
    updateLocationHash(true);
    let html;
    // If a pool was found, populate the pool details table and display it on the page
    if (matchingpool) {
        // Build the table and headers
        layerContentDiv.attr('data-type', 'pool');
        layerContentDiv.attr('data-objectname', matchingpool.name);
        layerContentDiv.attr('data-loadbalancer', matchingpool.loadbalancer);
        html = `<div class="pooldetailsheader">
                        <span>Pool: ${matchingpool.name}</span><br>
                        <span>Load Balancer: ${renderLoadBalancer(loadbalancer, 'display')}</span>
                    </div>`;
        let table = `
        <table class="pooldetailstable">
            <thead>
              <tr>
                <th>Description</th>
                <th>Load Balancing Method</th>
                <th>Action On Service Down</th>
                <th>Allow NAT</th>
                <th>Allow SNAT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${matchingpool.description || ''}</td>
                <td>${matchingpool.loadbalancingmethod}</td>
                <td>${matchingpool.actiononservicedown}</td>
                <td>${matchingpool.allownat}</td>
                <td>${matchingpool.allowsnat}</td>
              </tr>
            </tbody>
            </table>
            <br>
            <div class="monitordetailsheader">Member details</div>
              <table class="pooldetailstable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>IP</th>
                    <th>Port</th>
                    <th>Priority Group</th>
                    <th>Connections</th>
                    <th>Max Connections</th>
                    <th>Availability</th>
                    <th>Enabled</th>
                    <th>Status Description</th>
                    <th>Realtime Availability</th>
                  </tr>
                </thead>
              <tbody>`;
        const poolmonitors = matchingpool.monitors;
        const matchingMonitors = [];
        const monitors = siteData.monitors;
        for (const i in poolmonitors) {
            for (const x in monitors) {
                if (monitors[x].name === poolmonitors[i] &&
                    monitors[x].loadbalancer === loadbalancer) {
                    matchingMonitors.push(monitors[x]);
                }
            }
        }
        const members = matchingpool.members;
        for (const i in members) {
            const member = members[i];
            const memberstatus = translateStatus(member);
            table += `
                    <tr>
                        <td>${member.name}</td>
                        <td>${member.ip}</td>
                        <td>${member.port}</td>
                        <td>${member.priority}</td>
                        <td>${member.currentconnections}</td>
                        <td>${member.maximumconnections}</td>
                        <td>${memberstatus['availability']}</td>
                        <td>${memberstatus['enabled']}</td>
                        <td>${member.status}</td>
                        <td>${memberstatus.realtime}</td>
                    </tr>`;
        }
        table += `</tbody></table>
                    <br>`;
        if (matchingMonitors.length > 0) {
            table += '<div class="monitordetailsheader">Assigned monitors</div>';
            for (const i in matchingMonitors) {
                const matchingMonitor = matchingMonitors[i];
                matchingMonitor.sendstring = matchingMonitor.sendstring
                    .replace('<', '&lt;')
                    .replace('>', '&gt;');
                matchingMonitor.receivestring = matchingMonitor.receivestring
                    .replace('<', '&lt;')
                    .replace('>', '&gt;');
                matchingMonitor.disablestring = matchingMonitor.disablestring
                    .replace('<', '&lt;')
                    .replace('>', '&gt;');
                table += `
          <table class="monitordetailstable">
              <thead>
                <tr>
                    <th colspan=2>${matchingMonitor.name}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Type</td>
                  <td>${matchingMonitor.type}</b></td>
                </tr>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Send string</td>
                  <td>${matchingMonitor.sendstring}</b></td>
                </tr>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Receive String</b></td>
                  <td>${matchingMonitor.receivestring}</td>
                </tr>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Disable String</b></td>
                  <td>${matchingMonitor.disablestring}</td>
                </tr>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Interval</b></td>
                  <td>${matchingMonitor.interval}</td>
                </tr>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Timeout</b></td>
                  <td>${matchingMonitor.timeout}</td>
                </tr>
              </table>

                <table class="membermonitortable">
                    <thead>
                      <tr>
                        <th>Member Name</th>
                        <th>Member ip</th>
                        <th>Member Port</th>
                        <th>HTTP Link</th>
                        <th>Curl Link</th>
                        <th>Netcat Link</th>
                    </thead>
                    <tbody>`;
                for (const member of members) {
                    const protocol = matchingMonitor.type.replace(/:.*$/, '').toLocaleLowerCase();
                    const { curl, http, netcat } = PoolDetails_generateMonitorTests(matchingMonitor, member);
                    const curlLink = curl ? `<button class="monitor-copy" data-copy="${curl}">Copy</button>` : 'N/A';
                    const netcatLink = netcat ? `<button class="monitor-copy" data-copy="${netcat}">Copy</button>` : 'N/A';
                    const httpLink = http ? `<button class="monitor-copy" data-copy="${http}">Copy</button>` : 'N/A';
                    table += `<tr>
                        <td>${member.name}</td>
                        <td>
                            ${/^http[s]*$/.test(protocol) ?
                        `<a href="${protocol}/${member.ip}">${member.ip}</a>` :
                        member.ip}
                        </td>
                        <td>${member.port}</td>
                        <td>${httpLink}</td>
                        <td>${curlLink}</td>
                        <td>${netcatLink}</td>
                      </tr>`;
                }
                table += `
                        </table>
                        <br>`;
            }
            table += '</tbody></table>';
        }
        html += table;
    }
    else {
        html = `<div id="objectnotfound">
            <h1>No matching Pool was found</h1>

            <h4>What happened?</h4>
            When clicking the report it will parse the JSON data to find the matching pool and display the details.
            However, in this case it was not able to find any matching pool.

            <h4>Possible reason</h4>
            This might happen if the report is being updated as you navigate to the page. If you see this page often,
            please report a bug <a href="https://devcentral.f5.com/codeshare/bigip-report">DevCentral</a>.

            <h4>Possible solutions</h4>
            Refresh the page and try again.

        </div>`;
    }
    $(`a#close${layer}layerbutton`).text('Close pool details');
    layerContentDiv.html(html);
    // Attach the copy function to the buttons
    document.querySelectorAll('button.monitor-copy')
        .forEach(el => el.addEventListener('click', copyToClipBoard));
    $(layerContentDiv).find('a.monitortest').on('mouseover', selectMonitorInputText);
    $(`#${layer}layerdiv`).fadeIn(updateLocationHash);
}

;// CONCATENATED MODULE: ./js-src/bigipreport.ts
var bigipreport_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

/** ********************************************************************************************************************

    BigIPReport Javascript

***********************************************************************************************************************/
const siteData = {
    NATdict: [],
    asmPolicies: [],
    certificates: [],
    countDown: 0,
    datagroupdetailsTableData: [],
    datagroups: [],
    deviceGroups: [],
    irules: [],
    knownDevices: [],
    loadbalancers: [],
    loggedErrors: [],
    monitors: [],
    pools: [],
    virtualservers: [],
    policies: [],
    poolsMap: new Map(),
};
/** ********************************************************************************************************************

    Waiting for all pre-requisite objects to load

***********************************************************************************************************************/
window.addEventListener('load', function () {
    return bigipreport_awaiter(this, void 0, void 0, function* () {
        // Animate loader off screen
        log('Starting window on load', 'INFO');
        // Prevent caching of ajax requests
        $(function () {
            $.ajaxSetup({ cache: false });
        });
        $('#firstlayerdetailscontentdiv').html(`
    <div id="jsonloadingerrors">
        <span style="font-size: 20px">The following json file did not load:</span>
        <div id="jsonloadingerrordetails"></div>

        <br>
        <span style="font-size: 18px;">Possible reasons</span>

        <ul>
            <li>
                The web server hosting the report is IIS7.x or older
                If you're running the report on IIS7.x or older it's not able to handle Json files without a tweak to
                the MIME files settings.<br>
                <a href="https://loadbalancing.se/bigip-report/#The_script_reports_missing_JSON_files">
                    Detailed instructions are available here</a>
            </li>
            <li>File permissions or network issues</li>
            <li>
                Script has had issues when creating the files due to lack of permissions or network issues.
                Double check your script execution logs, web folder content and try running the script manually.
            </li>
        </ul>
        <span style="font-style: italic;font-weight: bold;">
            Please note that while you can close these details, the report won't function as it should until these
            problems has been solved.
         </span>
    </div>`);
        const closeFirstLayerButton = $('a#closefirstlayerbutton');
        closeFirstLayerButton.text('Close error details');
        /** ******************************************************************************************************************
      
              Lightbox related functions
      
          *******************************************************************************************************************/
        /* Hide the lightbox if clicking outside the information box*/
        $('body').on('click', function (e) {
            if (e.target.classList.contains('lightbox')) {
                $('div#' + e.target.id).fadeOut(function () {
                    updateLocationHash();
                });
            }
        });
        closeFirstLayerButton.on('click', function () {
            $('div#firstlayerdiv').trigger('click');
        });
        $('a#closesecondlayerbutton').on('click', function () {
            $('div#secondlayerdiv').trigger('click');
        });
        /**
         * Example use:
         * $('div:icontains("Text in page")');
         * Will return jQuery object containing any/all of the following:
         * <div>text in page</div>
         * <div>TEXT in PAGE</div>
         * <div>Text in page</div>
         */
        $.expr[':'].icontains = $.expr.createPseudo(function (text) {
            return function (e) {
                return $(e).text().toUpperCase().indexOf(text.toUpperCase()) >= 0;
            };
        });
        /* syntax highlighting */
        // sh_highlightDocument('js/', '.js'); // eslint-disable-line no-undef
        const jsonFiles = [
            'json/pools.json',
            'json/monitors.json',
            'json/virtualservers.json',
            'json/irules.json',
            'json/datagroups.json',
            'json/loadbalancers.json',
            'json/preferences.json',
            'json/knowndevices.json',
            'json/certificates.json',
            'json/devicegroups.json',
            'json/asmpolicies.json',
            'json/nat.json',
            'json/state.json',
            'json/policies.json',
            'json/loggederrors.json'
        ];
        let jsonResponses;
        try {
            jsonResponses = yield Promise.all(jsonFiles.map((url) => bigipreport_awaiter(this, void 0, void 0, function* () {
                const resp = yield fetch(url, { cache: 'no-cache' });
                if (resp.status !== 200) {
                    throw new Error(`Failed to load ${resp.url}, got a status code of ${resp.status} (${resp.statusText})`);
                }
                return resp.json();
            })));
        }
        catch (e) {
            $('#jsonloadingerrordetails').append(`${e.message}`);
            $('div.beforedocumentready').hide();
            $('#firstlayerdiv').fadeIn();
            return;
        }
        const [pools, monitors, virtualservers, irules, datagroups, loadbalancers, preferences, knowndevices, certificates, devicegroups, asmpolicies, nat, state, policies, loggederrors,] = jsonResponses;
        siteData.pools = pools;
        siteData.poolsMap = new Map();
        let poolNum = 0;
        siteData.pools.forEach((pool) => {
            pool.poolNum = poolNum;
            siteData.poolsMap.set(`${pool.loadbalancer}:${pool.name}`, pool);
            poolNum++;
        });
        siteData.monitors = monitors;
        siteData.virtualservers = virtualservers;
        siteData.irules = irules;
        siteData.datagroups = datagroups;
        siteData.loadbalancers = loadbalancers;
        siteData.preferences = preferences;
        siteData.knownDevices = knowndevices;
        siteData.certificates = certificates;
        siteData.deviceGroups = devicegroups;
        siteData.asmPolicies = asmpolicies;
        siteData.NATdict = nat;
        siteData.state = state;
        siteData.policies = policies;
        siteData.loggedErrors = loggederrors.concat(siteData.loggedErrors);
        // Update the footer
        const localStartTime = new Date(siteData.preferences.startTime).toString();
        $('div#report-footer').html(`
    <div class="footer">
    The report was generated on ${siteData.preferences.scriptServer}
    using BigIPReport version ${siteData.preferences.scriptVersion}.
    Script started at <span id="Generationtime">${localStartTime}</span> and took
    ${Math.round(siteData.preferences.executionTime).toString()} minutes to finish.<br>
    BigIPReport is written and maintained by <a href="http://loadbalancing.se/about/">Patrik Jonsson</a>
    and <a href="https://rikers.org/">Tim Riker</a>.
    </div>
  `);
        /** ***********************************************************************************************************
      
                All pre-requisite things have loaded
      
            **************************************************************************************************************/
        // Show statistics from siteData arrays
        log('Loaded: ' +
            Object.keys(siteData)
                .filter((k) => k !== 'bigipTable' && siteData[k] && siteData[k].length !== undefined)
                .map((k) => `${k}: ${siteData[k].length}`)
                .join(', '), 'INFO');
        /** ***********************************************************************************************************
      
                Load preferences
      
            **************************************************************************************************************/
        loadPreferences();
        /** ***********************************************************************************************************
      
                Test the status VIPs
      
        **************************************************************************************************************/
        initializeStatusVIPs();
        /* highlight selected menu option */
        populateSearchParameters(false);
        const currentSection = $('div#mainholder').attr('data-activesection');
        if (currentSection === undefined) {
            showVirtualServers(true);
        }
        /** ***********************************************************************************************************
                This section adds the update check button div and initiates the update checks
         **************************************************************************************************************/
        NavButtonDiv(null, null, null); // eslint-disable-line new-cap
        // Check if there's a new update
        setInterval(function () {
            $.ajax('json/preferences.json', {
                type: 'HEAD',
                success: NavButtonDiv,
            });
        }, 60000);
        // Attach click events to the main menu buttons and poller div
        document.querySelector('div#virtualserversbutton').addEventListener('click', showVirtualServers);
        document.querySelector('div#poolsbutton').addEventListener('click', showPools);
        document.querySelector('div#irulesbutton').addEventListener('click', showiRules);
        document.querySelector('div#datagroupbutton').addEventListener('click', showDataGroups);
        document.querySelector('div#policiesbutton').addEventListener('click', showPolicies);
        document.querySelector('div#deviceoverviewbutton').addEventListener('click', showDeviceOverview);
        document.querySelector('div#certificatebutton').addEventListener('click', showCertificateDetails);
        document.querySelector('div#logsbutton').addEventListener('click', showLogs);
        document.querySelector('div#preferencesbutton').addEventListener('click', showPreferences);
        document.querySelector('div#helpbutton').addEventListener('click', showHelp);
        document.querySelector('div#realtimestatusdiv').addEventListener('click', pollCurrentView);
        // Attach module calls to window in order to call them from html rendered by js
        // These should be removed in favor of event listeners later. See Virtual Server name column
        // for an example
        window['showPoolDetails'] = showPoolDetails;
        window['togglePool'] = togglePool;
        window['togglePoolHighlight'] = togglePoolHighlight;
        window['showVirtualServerDetails'] = showVirtualServerDetails;
        window['showDataGroupDetails'] = showDataGroupDetails;
        window['showiRuleDetails'] = showiRuleDetails;
        window['showPolicyDetails'] = showPolicyDetails;
        window['siteData'] = siteData;
    });
});
// update Navigation Buttons based on HEAD polling date (if available)
function NavButtonDiv(response, status, xhr) {
    let timesincerefresh = 0;
    if (siteData.preferences.currentReportDate === undefined && xhr && null != xhr.getResponseHeader('Last-Modified')) {
        // If we have not yet stored the currentReportDate, store it and return
        siteData.preferences.currentReportDate = new Date(xhr.getResponseHeader('Last-Modified')).getTime();
    }
    else if (xhr && null != xhr.getResponseHeader('Last-Modified')) {
        const latestreport = new Date(xhr.getResponseHeader('Last-Modified')).getTime();
        // If there's been a new report, how long ago (in minutes)
        timesincerefresh = Math.round((latestreport - siteData.preferences.currentReportDate) / 60000);
    }
    let navbutton = '<ul>';
    if (timesincerefresh > 60) {
        navbutton +=
            '<li><button onclick="document.location.reload()" class="navbutton urgent">Update available</a></li>';
    }
    else if (timesincerefresh > 0) {
        navbutton +=
            '<li><button onclick="document.location.reload()" class="navbutton important">Update available</a></li>';
    }
    else {
        navbutton +=
            '<li><button onclick="document.location.reload()" class="navbutton">Refresh</button></li>';
    }
    for (const key in siteData.preferences.NavLinks) {
        navbutton += `<li><button onclick="window.location.href='${siteData.preferences.NavLinks[key]}'"
                    class="navbutton">${key}</button></li>`;
    }
    navbutton += '</ul>';
    $('div#navbuttondiv').html(navbutton);
}
function initializeStatusVIPs() {
    // Also initialize the ajaxQueue
    siteData.memberStates = {
        ajaxFailures: [],
        ajaxQueue: [],
        ajaxRecent: []
    };
    siteData.memberStates.ajaxQueue = [];
    siteData.memberStates.ajaxRecent = [];
    siteData.memberStates.ajaxFailures = [];
    const loadbalancers = siteData.loadbalancers;
    // Check if there is any functioning pool status vips
    const hasConfiguredStatusVIP = loadbalancers.some(function (e) {
        return /[a-b0-9]+/.test(e.statusvip.url);
    });
    if (hasConfiguredStatusVIP) {
        for (const i in loadbalancers) {
            const loadbalancer = loadbalancers[i];
            // Increase the not configured span for loadbalancers that is eligible for polling but has none configured
            if (loadbalancer.statusvip.url === '' &&
                (loadbalancer.active || loadbalancer.isonlydevice)) {
                log(`Loadbalancer ${loadbalancer.name} does not have any status VIP configured`, 'INFO');
                const realTimeNotConfigured = $('span#realtimenotconfigured');
                realTimeNotConfigured.text(parseInt(realTimeNotConfigured.text()) + 1);
                loadbalancer.statusvip.working = false;
                loadbalancer.statusvip.reason = 'None configured';
            }
            else if (loadbalancer.statusvip.url !== '' &&
                (loadbalancer.active || loadbalancer.isonlydevice)) {
                testStatusVIP(loadbalancer);
            }
        }
    }
    else {
        log('No status VIPs has been configured', 'INFO');
        $('td#pollingstatecell').html('Disabled');
        $('div.beforedocumentready').fadeOut(1500);
    }
}
function poolMemberStatus(member, type) {
    const mStatus = member.enabled + ':' + member.availability;
    if (type === 'export') {
        return '';
    }
    else if (type === 'filter') {
        return mStatus;
    }
    else if (mStatus === 'enabled:available') {
        return `<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="Available (Enabled)"
                title="${mStatus} - Member is able to pass traffic"/></span>`;
    }
    else if (mStatus === 'enabled:unknown') {
        return `<span class="statusicon"><img src="images/blue-square-questionmark.png" alt="Unknown (Enabled)"
                title="${mStatus} - Member status unknown"/></span>`;
    }
    else if (mStatus === 'enabled:offline') {
        return `<span class="statusicon"><img src="images/red-circle-cross.png" alt="Offline (Enabled)"
                title="${mStatus} - Member is unable to pass traffic"/></span>`;
    }
    else if (mStatus === 'enabled:unavailable') {
        return `<span class="statusicon"><img src="images/red-diamond-exclamationmark.png" alt="Unavailable (Enabled)"
                title="${mStatus} - Member connection limit reached"/></span>`;
    }
    else if (mStatus === 'disabled:available') {
        return `<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Available (Disabled)"
                title="${mStatus} - Member is available, but disabled"/></span>`;
    }
    else if (mStatus === 'disabled:offline' ||
        mStatus === 'disabled-by-parent:available' ||
        mStatus === 'disabled-by-parent:offline') {
        return `<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Unknown (Disabled)"
                title="${mStatus} - Member is disabled"/></span>`;
    }
    return mStatus;
}
function poolStatus(pool, type) {
    if (!pool || type === 'export') {
        return '';
    }
    const pStatus = pool.enabled + ':' + pool.availability;
    if (type === 'display' || type === 'print') {
        if (pStatus === 'enabled:available') {
            return ('<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="' +
                pStatus +
                '" title="' +
                pStatus +
                ' - ' +
                pool.status +
                '"/></span>');
        }
        else if (pStatus === 'enabled:unknown') {
            return ('<span class="statusicon"><img src="images/blue-square-questionmark.png" alt="' +
                pStatus +
                '" title="' +
                pStatus +
                ' - ' +
                pool.status +
                '"/></span>');
        }
        else if (pStatus === 'enabled:offline') {
            return ('<span class="statusicon"><img src="images/red-circle-cross.png" alt="' +
                pStatus +
                '" title="' +
                pStatus +
                ' - ' +
                pool.status +
                '"/></span>');
        }
        else if (pStatus === 'disabled-by-parent:available' ||
            pStatus === 'disabled-by-parent:offline') {
            return ('<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="' +
                pStatus +
                '" title="' +
                pStatus +
                ' - ' +
                pool.status +
                '"/></span>');
        }
        return pStatus;
    }
    else {
        return pStatus;
    }
}
function virtualServerStatus(row, type) {
    if (!row.enabled || !row.availability)
        return '';
    const vsStatus = row.enabled + ':' + row.availability;
    if (type === 'filter') {
        return vsStatus;
    }
    else if (vsStatus === 'enabled:available') {
        return `<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="Available (Enabled)"
                title="${vsStatus} - The virtual server is available"/></span>`;
    }
    else if (vsStatus === 'enabled:unknown') {
        return ('<span class="statusicon"><img src="images/blue-square-questionmark.png" alt="Unknown (Enabled)"' +
            ` title="${vsStatus} - The children pool member(s) either don't have service checking enabled, or ` +
            'service check results are not available yet"/></span>');
    }
    else if (vsStatus === 'enabled:offline') {
        return ('<span class="statusicon"><img src="images/red-circle-cross.png" alt="Offline (Enabled)"' +
            ` title="${vsStatus} - The children pool member(s) are down"/></span>`);
    }
    else if (vsStatus === 'disabled:available') {
        return ('<span class="statusicon"><img src="images/black-circle-cross.png" alt="Available (Disabled)"' +
            ` title="${vsStatus} - The virtual server is disabled"/></span>`);
    }
    else if (vsStatus === 'disabled:unknown') {
        return ('<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Unknown (Disabled)"' +
            ` title="${vsStatus} - The children pool member(s) either don't have service checking enabled,` +
            ' or service check results are not available yet"/></span>');
    }
    else if (vsStatus === 'disabled:offline') {
        return ('<span class="statusicon"><img src="images/black-circle-cross.png" alt="Offline (Disabled)"' +
            ` title="${vsStatus} - The children pool member(s) are down"/></span>`);
    }
    else if (vsStatus === 'disabled-by-parent:offline') {
        return ('<span class="statusicon">' +
            '<img src="images/black-circle-cross.png" alt="Offline (Disabled-by-parent)"' +
            ` title="${vsStatus} - The parent is disabled and the children pool member(s) are down"/></span>`);
    }
    else if (vsStatus === 'disabled-by-parent:available') {
        return ('<span class="statusicon">' +
            '<img src="images/black-diamond-exclamationmark.png" alt="Available (Disabled-by-parent)"' +
            ` title="${vsStatus} - The children pool member(s) are available but the parent is disabled"/></span>`);
    }
    return vsStatus;
}
function createdPoolCell(cell, cellData, rowData, rowIndex) {
    if (rowData.pools) {
        $(cell).addClass('PoolCell');
        $(cell).attr('id', 'vs-' + rowIndex);
    }
}
function renderPoolMember(loadbalancer, member, type) {
    let result = '';
    if (member !== null) {
        if (type === 'display' || type === 'print') {
            result += '<span data-member="' + member.ip + ':' + member.port + '">';
        }
        result += poolMemberStatus(member, type);
        if (type === 'display' || type === 'print') {
            result += '</span>';
        }
        else {
            result += ' ';
        }
        const name = member.name.split('/')[2];
        if ((name !== member.ip + ':' + member.port) && (name !== member.ip + '.' + member.port)) {
            result += '(' + member.ip + ')';
        }
        result += name;
    }
    return result;
}
function renderPoolMemberCell(type, member, poolNum) {
    return `
        <td class="PoolMember" data-pool="${poolNum}">
            ${renderPoolMember('', member, type)}
        </td>
    `;
}
function renderPoolCell(data, type, row, meta) {
    if (type === 'sort') {
        if (data) {
            return data.length;
        }
        else {
            return 0;
        }
    }
    if (!data) {
        return 'N/A';
    }
    let poolCell = '';
    if (type === 'filter' || type === 'export') {
        for (let i = 0; i < data.length; i++) {
            const pool = siteData.poolsMap.get(row.loadbalancer + ':' + data[i]);
            if (pool) {
                poolCell += renderPool(pool.loadbalancer, pool.name, type) + ': ';
                if (pool.members !== null) {
                    poolCell += renderPoolMember(pool.loadbalancer, pool.members[0], type);
                    for (let m = 1; m < pool.members.length; m++) {
                        poolCell +=
                            ',' + renderPoolMember(pool.loadbalancer, pool.members[m], type);
                    }
                }
            }
        }
        return poolCell;
    }
    if (type === 'display') {
        const tid = `vs-${meta.row}`;
        poolCell += `
                    <div class="expand" id="expand-${tid}" style="display: none;">
                        <a><img src="images/chevron-down.png" alt="down" onclick="togglePool('${tid}')"></a>
                    </div>
                    <div class="collapse" id="collapse-${tid}" style="display: block;">
                        <a><img src="images/chevron-up.png" alt="up" onclick="togglePool('${tid}')"></a>
                    </div>
                    <div class="AssociatedPoolsInfo" onclick="togglePool('${tid}')"
                        id="AssociatedPoolsInfo-${tid}" style="display: none;">
                        Show ${data.length} associated pools
                    </div>
                    <div id="PoolCell-${tid}" class="pooltablediv" style="display: block;">`;
    }
    poolCell += '<table class="pooltable"><tbody>';
    for (let i = 0; i < data.length; i++) {
        const pool = siteData.poolsMap.get(row.loadbalancer + ':' + data[i]);
        // report dumps pools before virtualhosts, so pool might not exist
        if (pool) {
            const poolClass = `Pool-${pool.poolNum}`;
            poolCell += `<tr class="${poolClass}"`;
            if (type === 'display') {
                poolCell +=
                    'onmouseover="javascript:togglePoolHighlight(this);" onmouseout="javascript:togglePoolHighlight(this);"';
            }
            poolCell += 'style="">';
            poolCell += '<td';
            if (pool.members !== null && pool.members.length > 1) {
                poolCell += ` rowspan="${pool.members.length}"`;
            }
            poolCell += ' class="poolname">';
            poolCell += renderPool(pool.loadbalancer, pool.name, type);
            poolCell += '</td>';
            if (pool.members == null) {
                poolCell += '<td>None</td>';
            }
            else {
                poolCell += renderPoolMemberCell(type, pool.members[0], pool.poolNum || 0);
            }
            poolCell += '</tr>';
            if (pool.members !== null) {
                for (let m = 1; m < pool.members.length; m++) {
                    poolCell += `<tr class="${poolClass}">${renderPoolMemberCell(type, pool.members[m], pool.poolNum || 0)}</tr>`;
                }
            }
        }
    }
    poolCell += '</tbody></table>';
    poolCell += '</div>';
    return poolCell;
}
function renderList(data, type, row, meta, renderCallback, plural) {
    if (type === 'sort') {
        if (data && data.length) {
            return data.length;
        }
        return 0;
    }
    let result = '';
    if (data && data.length > 0) {
        const members = [];
        data.forEach((member) => {
            members.push(renderCallback(row.loadbalancer, member, type));
        });
        if (type === 'display') {
            if (data.length === 1) {
                result = `<div data-loadbalancer="${row.loadbalancer}" data-name="${row.name}">`;
            }
            else {
                result = `<details data-loadbalancer="${row.loadbalancer}" data-name="${row.name}">
                            <summary>View ${data.length} ${plural}</summary>`;
            }
            result += members.join('<br>');
            if (data.length === 1) {
                result += '</div>';
            }
            else {
                result += '</details>';
            }
            result += '</div>';
        }
        else if (type === 'print') {
            result += members.join('<br>');
        }
        else {
            result += members;
        }
    }
    else {
        result = 'None';
    }
    return result;
}
function testStatusVIP(loadbalancer) {
    const name = loadbalancer.name;
    // Find a pool with members on this load balancer
    let pool;
    const pools = siteData.pools;
    for (const i in pools) {
        if (pools[i].loadbalancer === name && pools[i].members) {
            pool = pools[i];
            break;
        }
    }
    if (!pool) {
        loadbalancer.statusvip.working = false;
        loadbalancer.statusvip.reason = 'No pools with members found';
        log(`No pools with members to test the status vip with on loadbalancer ${name}, marking it as failed`, 'ERROR');
    }
    else {
        const testURL = loadbalancer.statusvip.url + pool.name;
        increaseAjaxQueue(testURL);
        $.ajax({
            dataType: 'json',
            url: testURL,
            success: function () {
                const realtimeTestSuccessSpan = $('span#realtimetestsuccess');
                realtimeTestSuccessSpan.text(parseInt(realtimeTestSuccessSpan.text()) + 1);
                log('Statusvip test <a href="' +
                    testURL +
                    '">' +
                    testURL +
                    '</a> was successful on loadbalancer: <b>' +
                    loadbalancer.name +
                    '</b>', 'INFO');
                loadbalancer.statusvip.working = true;
                loadbalancer.statusvip.reason = '';
                decreaseAjaxQueue(testURL);
            },
            timeout: 2000,
        })
            .fail(function (jqxhr) {
            log(`Statusvip test <a href="${testURL}">${testURL}</a> failed on loadbalancer: <b>` +
                `${loadbalancer.name}</b><br>Information about troubleshooting status VIPs is available` +
                ` <a href="https://loadbalancing.se/bigip-report/#One_or_more_status_endpoints_has_been_marked_as_failed">
                here
            </a>`, 'ERROR');
            const realtimeTestFailedSpan = $('span#realtimetestfailed');
            realtimeTestFailedSpan.text(parseInt(realtimeTestFailedSpan.text()) + 1);
            loadbalancer.statusvip.working = false;
            loadbalancer.statusvip.reason = jqxhr.statusText;
            decreaseAjaxQueue(testURL);
        })
            .always(function () {
            if (siteData.memberStates.ajaxQueue.length === 0) {
                // Tests done, restore the view of the original URL
                populateSearchParameters(false);
                // Check if there is any functioning pool status vips
                const hasWorkingStatusVIP = siteData.loadbalancers.some(function (e) {
                    return e.statusvip.working;
                });
                if (hasWorkingStatusVIP) {
                    log('Status VIPs tested, starting the polling functions', 'INFO');
                    pollCurrentView();
                    setInterval(function () {
                        if (siteData.memberStates.ajaxQueue.length === 0) {
                            pollCurrentView();
                        }
                        else {
                            resetClock();
                            log(`Did not finish the polling in time, consider increasing the polling interval,
                                or increase the max queue in the configuration file`, 'WARNING');
                        }
                    }, siteData.preferences.PollingRefreshRate * 1000);
                }
                else {
                    log('No functioning status VIPs detected, scanning disabled<br>' +
                        'More information about why this happens is available' +
                        ` <a href="https://loadbalancing.se/bigip-report/#The_member_status_polling_says_it8217s_disabled">
                  here</a>`, 'ERROR');
                    $('td#pollingstatecell').html('Disabled');
                }
            }
        });
    }
    $('div.beforedocumentready').fadeOut(1500);
}
// Initiate pool status updates
function pollCurrentView() {
    siteData.memberStates.ajaxRecent = [];
    resetClock();
    const currentSection = $('div#mainholder').attr('data-activesection');
    let length = 0;
    const visiblePools = $('table.pooltable tr td.poolname:visible');
    const poolTableDiv = $('table#poolTable details[open][data-name],table#poolTable div[data-name]');
    switch (currentSection) {
        case 'virtualservers':
            length = visiblePools.length;
            break;
        case 'pools':
            length = poolTableDiv.length;
            break;
    }
    if (length >= 0 && length <= siteData.preferences.PollingMaxPools) {
        switch (currentSection) {
            case 'virtualservers':
                visiblePools.each(function () {
                    getPoolStatus(this);
                });
                break;
            case 'pools':
                poolTableDiv.each(function () {
                    getPoolStatusPools(this);
                });
                break;
        }
    }
}
function renderLoadBalancer(loadbalancer, type) {
    let balancer;
    if (siteData.preferences.HideLoadBalancerFQDN) {
        balancer = loadbalancer.split('.')[0];
    }
    else {
        balancer = loadbalancer;
    }
    if (type === 'display') {
        return `<a href="https://${loadbalancer}" target="_blank" class="plainLink">${balancer}</a>`;
    }
    return balancer;
}
function renderVirtualServer(loadbalancer, name, type) {
    const vsName = name.replace(/^\/Common\//, '');
    let result = '';
    if (type === 'display') {
        result += `<span class="adcLinkSpan"><a target="_blank" href="https://${loadbalancer}`;
        result += `/tmui/Control/jspmap/tmui/locallb/virtual_server/properties.jsp?name=${name}">Edit</a></span>`;
    }
    if (type === 'display' || type === 'print' || type === 'filter') {
        const vs = getVirtualServer(name, loadbalancer);
        result += virtualServerStatus(vs, type);
    }
    if (type === 'display') {
        result += `<a class="tooltip details-link" data-originalvirtualservername="${name}"`;
        result += ` data-loadbalancer="${loadbalancer}"`;
        result += ` href="Javascript:showVirtualServerDetails('${name}','${loadbalancer}');">`;
    }
    result += vsName;
    if (type === 'display') {
        result += `<span class="detailsicon">
                      <img src="images/details.png" alt="details"></span>
                      <p>Click to see virtual server details</p>
                      </a>`;
    }
    return result;
}
function renderRule(loadbalancer, name, type) {
    const ruleName = name.replace(/^\/Common\//, '');
    let result = '';
    if (type === 'display') {
        result += `<span class="adcLinkSpan">
                 <a target="_blank"
                 href="https://${loadbalancer}/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=${name}">
                     Edit
                 </a>
               </span>
               <a class="tooltip" data-originalvirtualservername="${name}" data-loadbalancer="${loadbalancer}"
                href="Javascript:showiRuleDetails('${name}','${loadbalancer}');">`;
    }
    result += ruleName;
    if (type === 'display') {
        result += `<span class="detailsicon"><img src="images/details.png" alt="details"></span>
                      <p>Click to see iRule details</p>
                   </a>`;
    }
    return result;
}
function renderPolicy(loadbalancer, name, type) {
    if (name === 'None') {
        return 'None';
    }
    //const policyName = name.replace(/^\/Common\//, ''); does not work for any reason
    let result = '';
    if (type === 'display') {
        result += `<span class="adcLinkSpan"></span>
                <a class="tooltip" data-originalvirtualservername="${name}" data-loadbalancer="${loadbalancer}"
                 href="Javascript:showPolicyDetails('${name}','${loadbalancer}');">`;
    }
    result += name;
    if (type === 'display') {
        result += `<span class="detailsicon"><img src="images/details.png" alt="details"></span>
                       <p>Click to see policy details</p>
                    </a>`;
    }
    return result;
}
function renderPool(loadbalancer, name, type) {
    if (name === 'N/A') {
        return name;
    }
    const poolName = name.replace(/^\/Common\//, '');
    let result = '';
    if (type === 'display') {
        result += `<span class="adcLinkSpan"><a target="_blank"
    href="https://${loadbalancer}/tmui/Control/jspmap/tmui/locallb/pool/properties.jsp?name=${name}">Edit</a></span>`;
    }
    result += poolStatus(siteData.poolsMap.get(`${loadbalancer}:${name}`), type);
    if (type === 'display') {
        result += `<a class="tooltip" data-originalpoolname="${name}" data-loadbalancer="${loadbalancer}"
    href="Javascript:showPoolDetails('${name}','${loadbalancer}');">`;
    }
    else {
        result += ' ';
    }
    result += poolName;
    if (type === 'display') {
        result += `<span class="detailsicon">
                      <img src="images/details.png" alt="details">
                      </span>
                      <p>Click to see pool details</p>
                </a>`;
    }
    return result;
}
function renderCertificate(loadbalancer, name, type) {
    let result = name.replace(/^\/Common\//, '');
    if (type === 'display') {
        result += `
    <span class="adcLinkSpan">
      <a target="_blank"
      href="https://${loadbalancer}/tmui/Control/jspmap/tmui/locallb/ssl_certificate/properties.jsp?` +
            `certificate_name=${name.replace(/\//, '%2F').replace(/.crt$/, '')}">
        Edit
      </a>
    </span>`;
    }
    return result;
}
function renderDataGroup(loadbalancer, name, type) {
    const datagroupName = name.replace(/^\/Common\//, '');
    let result = '';
    if (type === 'display') {
        result += `
    <span class="adcLinkSpan">
      <a target="_blank"
      href="https://${loadbalancer}/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp?name=${name}">
        Edit
      </a>
   </span>
   <a class="tooltip" data-originalvirtualservername="${name}" data-loadbalancer="${loadbalancer}"
       href="Javascript:showDataGroupDetails('${name}','${loadbalancer}');">`;
    }
    result += datagroupName;
    if (type === 'display') {
        result +=
            '<span class="detailsicon"><img src="images/details.png" alt="details"></span>';
        result += '<p>Click to see Data Group details</p>';
        result += '</a>';
    }
    return result;
}
function countdownClock() {
    siteData.countDown--;
    if (siteData.countDown === 0) {
        clearTimeout(siteData.clock);
    }
    $('span#refreshcountdown').html(siteData.countDown.toString());
    const currentSection = $('div#mainholder').attr('data-activesection');
    let length = 0;
    switch (currentSection) {
        case 'virtualservers':
            length = $('table.pooltable tr td.poolname:visible').length;
            break;
        case 'pools':
            length = $('table#poolTable details[open][data-name],table#poolTable div[data-name]').length;
            break;
    }
    let pollingstate = '';
    if (length === 0 || length > siteData.preferences.PollingMaxPools) {
        pollingstate += 'Disabled, ';
    }
    pollingstate +=
        length + '/' + siteData.preferences.PollingMaxPools + ' pools open, ';
    if (siteData.memberStates) {
        pollingstate +=
            '<span id="ajaxqueue">' +
                siteData.memberStates.ajaxQueue.length +
                '</span>/' +
                siteData.preferences.PollingMaxQueue +
                ' queued, ';
    }
    pollingstate += 'refresh in ' + siteData.countDown + ' seconds.';
    $('td#pollingstatecell').html(pollingstate);
}
function resetClock() {
    siteData.countDown = siteData.preferences.PollingRefreshRate + 1;
    window.clearInterval(siteData.clock);
    countdownClock();
    siteData.clock = window.setInterval(countdownClock, 1000);
}
function getPoolStatus(poolCell) {
    if (siteData.memberStates.ajaxQueue.length >=
        siteData.preferences.PollingMaxQueue) {
        setTimeout(function () {
            getPoolStatus(poolCell);
        }, 200);
    }
    else {
        const poolLink = $(poolCell).find('a.tooltip');
        const loadbalancerName = $(poolLink).attr('data-loadbalancer');
        const loadbalancer = getLoadbalancer(loadbalancerName);
        if (loadbalancer && loadbalancer.statusvip.working === true) {
            const poolName = $(poolLink).attr('data-originalpoolname');
            const pool = getPool(poolName, loadbalancerName);
            const url = loadbalancer.statusvip.url + pool.name;
            if (increaseAjaxQueue(url)) {
                $.ajax({
                    dataType: 'json',
                    url: url,
                    success: function (data) {
                        if (data.success) {
                            decreaseAjaxQueue(url);
                            for (const memberStatus in data.memberstatuses) {
                                const statusSpan = $('td.PoolMember[data-pool="' +
                                    pool.poolNum +
                                    '"] span[data-member="' +
                                    memberStatus +
                                    '"]');
                                setMemberState(statusSpan, data.memberstatuses[memberStatus]);
                                // Update the pool json object
                                const members = pool.members;
                                for (const i in members) {
                                    const member = members[i];
                                    const ipport = member.ip + ':' + member.port;
                                    if (ipport === memberStatus) {
                                        member.realtimestatus = data.memberstatuses[memberStatus];
                                    }
                                }
                            }
                        }
                    },
                    timeout: 2000,
                }).fail(function () {
                    // To be used later in the console
                    // siteData.memberStates.ajaxFailures.push({ url: url, code: jqxhr.status, reason: jqxhr.statusText })
                    decreaseAjaxQueue(url);
                    return false;
                });
            }
        }
    }
}
function getPoolStatusPools(poolCell) {
    if (siteData.memberStates.ajaxQueue.length >=
        siteData.preferences.PollingMaxQueue) {
        setTimeout(function () {
            getPoolStatusPools(poolCell);
        }, 200);
    }
    else {
        const loadbalancerName = $(poolCell).attr('data-loadbalancer');
        const loadbalancer = getLoadbalancer(loadbalancerName);
        if (loadbalancer && loadbalancer.statusvip.working === true) {
            const poolName = $(poolCell).attr('data-name');
            const pool = getPool(poolName, loadbalancerName);
            const url = loadbalancer.statusvip.url + pool.name;
            if (increaseAjaxQueue(url)) {
                $.ajax({
                    dataType: 'json',
                    url: url,
                    success: function (data) {
                        if (data.success) {
                            decreaseAjaxQueue(url);
                            for (const memberStatus in data.memberstatuses) {
                                const statusSpan = $(`table#poolTable details[data-name="${poolName}"] span[data-member="${memberStatus}"],` +
                                    `table#poolTable div[data-name="${poolName}"] span[data-member="${memberStatus}"]`);
                                setMemberState(statusSpan, data.memberstatuses[memberStatus]);
                                // Update the pool json object
                                const members = pool.members;
                                for (const i in members) {
                                    const member = members[i];
                                    const ipport = member.ip + ':' + member.port;
                                    if (ipport === memberStatus) {
                                        member.realtimestatus = data.memberstatuses[memberStatus];
                                    }
                                }
                            }
                        }
                    },
                    timeout: 2000,
                }).fail(function () {
                    // To be used later in the console
                    // siteData.memberStates.ajaxFailures.push({ url: url, code: jqxhr.status, reason: jqxhr.statusText })
                    decreaseAjaxQueue(url);
                    return false;
                });
            }
        }
    }
}
function decreaseAjaxQueue(url) {
    const index = siteData.memberStates.ajaxQueue.indexOf(url);
    if (index > -1) {
        siteData.memberStates.ajaxQueue.splice(index, 1);
    }
    if (siteData.memberStates.ajaxRecent.indexOf(url) === -1) {
        siteData.memberStates.ajaxRecent.push(url);
    }
    // Decrease the total queue
    $('span#ajaxqueue').text(siteData.memberStates.ajaxQueue.length);
}
function increaseAjaxQueue(url) {
    if (siteData.memberStates.ajaxRecent.indexOf(url) === -1 &&
        siteData.memberStates.ajaxQueue.indexOf(url) === -1) {
        siteData.memberStates.ajaxQueue.push(url);
        $('span#ajaxqueue').text(siteData.memberStates.ajaxQueue.length);
        return true;
    }
    return false;
}
function setMemberState(statusSpan, memberStatus) {
    const statusIcon = $(statusSpan).find('span.statusicon');
    let icon;
    let title;
    let status;
    switch (memberStatus) {
        case 'up':
            icon = 'green-circle-checkmark.png';
            title = 'Member is ready to accept traffic';
            status = 'enabled:available';
            break;
        case 'down':
            icon = 'red-circle-cross.png';
            title = 'Member is marked as down and unable to pass traffic';
            status = 'enabled:offline';
            break;
        case 'session_disabled':
            icon = 'black-circle-checkmark.png';
            title = 'Member is ready to accept traffic, but is disabled';
            status = 'disabled:unknown';
            break;
        default:
            icon = 'blue-square-questionmark.png';
            title = 'Unknown state';
            status = 'enabled:unknown';
            break;
    }
    const html = `<img src="images/${icon}" title="${status} - ${title}" alt="${status}"/>`;
    $(statusIcon).fadeOut(200).html(html).fadeIn(200);
}
/** ********************************************************************************************************************

    Functions used by the main data table

***********************************************************************************************************************/
/** ********************************************************************************************************************
    Highlight all matches
***********************************************************************************************************************/
function highlightAll(table) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = $(table.table().body());
    body.unhighlight();
    const search = [table.search()];
    table.columns().every(function () {
        const columnvalue = $('input', this.header()).val();
        if (columnvalue) {
            search.push(columnvalue);
        }
    });
    body.highlight(search, {
        regEx: localStorage.getItem('regexSearch') === 'true',
    });
}
/** ********************************************************************************************************************
    test for valid regex
***********************************************************************************************************************/
function isRegExp(regExp) {
    try {
        new RegExp(regExp);
    }
    catch (e) {
        return false;
    }
    return true;
}
/** ********************************************************************************************************************
    Gets the query strings and populates the table
***********************************************************************************************************************/
function populateSearchParameters(updateHash) {
    const vars = {};
    let hash;
    if (window.location.href.indexOf('#') >= 0) {
        // Split the hash query string and create a dictionary with the parameters
        const hashes = window.location.href
            .slice(window.location.href.indexOf('#') + 1)
            .split('&');
        for (let i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars[hash[0]] = hash[1];
        }
        if (vars['mainsection']) {
            const activeSection = vars['mainsection'];
            switch (activeSection) {
                case 'virtualservers':
                    showVirtualServers(updateHash);
                    break;
                case 'pools':
                    showPools(updateHash);
                    break;
                case 'irules':
                    showiRules(updateHash);
                    break;
                case 'policies':
                    showPolicies(updateHash);
                    break;
                case 'deviceoverview':
                    showDeviceOverview(updateHash);
                    break;
                case 'certificatedetails':
                    showCertificateDetails(updateHash);
                    break;
                case 'datagroups':
                    showDataGroups(updateHash);
                    break;
                case 'logs':
                    showLogs(updateHash);
                    break;
                case 'preferences':
                    showPreferences(updateHash);
                    break;
                case 'help':
                    showHelp(updateHash);
                    break;
            }
        }
        // Populate the search and column filters
        // Reset the search before applying the global search and column filters
        //siteData.bigipTable && siteData.bigipTable.search('');
        for (const key in vars) {
            const value = vars[key];
            // If it's provided, populate and search with the global string
            if (key === 'global_search') {
                const allFilterInput = $('#allbigips_filter input');
                if (allFilterInput) {
                    allFilterInput.val(vars[key]);
                    if (siteData.bigipTable) {
                        siteData.bigipTable.search(vars[key], localStorage.getItem('regexSearch') === 'true', false);
                        siteData.bigipTable.draw();
                    }
                }
            }
            else {
                // Validate that the key is a column filter and populate it
                const inputKey = $(`input[name="${key}"]`);
                if (inputKey.length) {
                    inputKey.val(value);
                    inputKey.trigger('keyup');
                }
            }
        }
        if (vars['pool']) {
            const poolName = vars['pool'].split('@')[0];
            const loadBalancer = vars['pool'].split('@')[1];
            showPoolDetails(poolName, loadBalancer);
        }
        if (vars['virtualserver']) {
            const virtualServerName = vars['virtualserver'].split('@')[0];
            const loadBalancer = vars['virtualserver'].split('@')[1];
            showVirtualServerDetails(virtualServerName, loadBalancer);
        }
        if (vars['datagroup']) {
            const dataGroupName = vars['datagroup'].split('@')[0];
            const loadBalancer = vars['datagroup'].split('@')[1];
            showDataGroupDetails(dataGroupName, loadBalancer);
        }
        if (vars['irule']) {
            const iruleName = vars['irule'].split('@')[0];
            const loadBalancer = vars['irule'].split('@')[1];
            showiRuleDetails(iruleName, loadBalancer);
        }
        if (vars['policy']) {
            const policyName = vars['policy'].split('@')[0];
            const loadBalancer = vars['policy'].split('@')[1];
            showPolicyDetails(policyName, loadBalancer);
        }
    }
}
/** ***********************************************************************************************************

    setup main Virtual Servers table

*************************************************************************************************************/
function setupVirtualServerTable() {
    if (siteData.bigipTable) {
        return;
    }
    const content = `

    <table id="allbigips" class="bigiptable display">
        <thead>
          <tr>
            <th class="loadbalancerHeaderCell">
              <span style="display: none;">Load Balancer</span>
              <input type="search" name="loadbalancer" class="search" placeholder="Load Balancer" /></th>
            <th>
              <span style="display: none;">Name</span>
              <input type="search" name="name" class="search" placeholder="Name" /></th>
            <th>
               <span style="display: none;">Description</span>
               <input type="search" name="description" class="search" placeholder="Description" />
            </th>
            <th>
              <span style="display: none;">IP:Port</span>
              <input type="search" name="ipport" class="search" placeholder="IP:Port" />
            </th>
            <th>
              <span style="display: none;">SNAT</span>
              <input type="search" name="snat" class="search" placeholder="Source Translation" />
            </th>
            <th>
              <span style="display: none;">ASM</span>
              <input type="search" name="asmpolicies" class="search" placeholder="ASM Policies" />
            </th>
            <th>
              <span style="display: none;">SSL</span>
              <input type="search" name="sslprofile" class="search" placeholder="SSL Profile" />
            </th>
            <th>
              <span style="display: none;">Comp</span>
              <input name="compressionprofile" type="search" class="search" placeholder="Compression Profile" />
            </th>
            <th>
              <span style="display: none;">Persist</span>
              <input type="search" name="persistenceprofile" class="search" placeholder="Persistence Profile" />
            </th>
            <th>
              <span style="display: none;">Pool/Members</span>
              <input type="search" name="poolmembers" class="search" placeholder="Pool/Members" />
            </th>
          </tr>
        </thead>
        <tbody>
        </tbody>
    </table>`;
    $('div#virtualservers').html(content);
    /** ***********************************************************************************************************
  
          Initiate data tables, add a search all columns header and save the standard table header values
  
      **************************************************************************************************************/
    siteData.bigipTable = $('table#allbigips').DataTable({
        autoWidth: false,
        deferRender: true,
        data: siteData.virtualservers,
        createdRow: function (row) {
            $(row).addClass('virtualserverrow');
        },
        columns: [
            {
                data: 'loadbalancer',
                className: 'loadbalancerCell',
                render: function (name, type) {
                    return renderLoadBalancer(name, type);
                },
            },
            {
                data: 'name',
                className: 'virtualServerCell',
                render: function (name, type, row) {
                    return renderVirtualServer(row.loadbalancer, name, type);
                }
            },
            {
                className: 'centeredCell',
                data: 'description',
                visible: false,
            },
            {
                className: 'centeredCell',
                render: function (data, type, row) {
                    let result = row.ip + ':' + row.port;
                    if (siteData.NATdict[row.ip.split('%')[0]]) {
                        result += '<br>Public IP:' + siteData.NATdict[row.ip.split('%')[0]];
                    }
                    return result;
                },
            },
            {
                className: 'centeredCell',
                render: function (data, type, row) {
                    if (!row.sourcexlatetype) {
                        return 'Unknown';
                    }
                    else {
                        switch (row.sourcexlatetype) {
                            case 'snat':
                                return 'SNAT:' + row.sourcexlatepool;
                            default:
                                return row.sourcexlatetype;
                        }
                    }
                },
                visible: false,
            },
            {
                className: 'centeredCell',
                render: function (data, type, row) {
                    if (!row.asmPolicies) {
                        return 'N/A';
                    }
                    else {
                        let result = row.asmPolicies;
                        for (let asm = 0; asm < siteData.asmPolicies.length; asm++) {
                            if (row.loadbalancer === siteData.asmPolicies[asm].loadbalancer &&
                                row.asmPolicies[0] === siteData.asmPolicies[asm].name) {
                                if (siteData.asmPolicies[asm].enforcementMode === 'blocking') {
                                    result += ' (B)';
                                }
                                else {
                                    result += ' (T)';
                                }
                            }
                        }
                        return result;
                    }
                },
                visible: false,
            },
            {
                className: 'centeredCell',
                render: function (data, type, row) {
                    let result = '';
                    if ((row.profiletype === 'Fast L4') || (row.profiletype === 'UDP')) {
                        result += row.profiletype;
                    }
                    else {
                        result += row.sslprofileclient.includes('None') ? 'No' : 'Yes';
                        result += '/';
                        result += row.sslprofileserver.includes('None') ? 'No' : 'Yes';
                    }
                    if (type === 'filter') {
                        if (row &&
                            row.sslprofileclient &&
                            !row.sslprofileclient.includes('None')) {
                            result += ' ' + row.sslprofileclient;
                        }
                        if (row &&
                            row.sslprofileserver &&
                            !row.sslprofileserver.includes('None')) {
                            result += ' ' + row.sslprofileserver;
                        }
                        if (row &&
                            row.otherprofiles) {
                            result += ' ' + row.otherprofiles;
                        }
                        if (row &&
                            row.protocol) {
                            result += ' protocol=' + row.protocol;
                        }
                    }
                    return result;
                },
                visible: false,
            },
            {
                className: 'centeredCell',
                render: function (data, type, row) {
                    if (row.compressionprofile === 'None') {
                        return 'No';
                    }
                    else {
                        return 'Yes';
                    }
                },
                visible: false,
            },
            {
                className: 'centeredCell',
                render: function (data, type, row) {
                    return row.persistence.includes('None') ? 'No' : 'Yes';
                },
                visible: false,
            },
            {
                data: 'pools',
                type: 'html-num',
                createdCell: createdPoolCell,
                render: renderPoolCell,
            },
        ],
        pageLength: 10,
        language: {
            search: 'Search all columns:',
        },
        dom: 'fBrtilp',
        buttons: {
            buttons: [
                {
                    text: 'Reset',
                    titleAttr: 'Clear global and column filters',
                    className: 'tableHeaderColumnButton resetFilters',
                    action: function () {
                        $('table#allbigips thead th input').val('');
                        siteData.bigipTable.search('').columns().search('').draw();
                        updateLocationHash();
                    },
                },
                {
                    text: 'Expand',
                    titleAttr: 'Temporarily expand all',
                    className: 'tableHeaderColumnButton toggleExpansion',
                    action: function (e, dt, node) {
                        switch (node['0'].innerText) {
                            case 'Expand':
                                hidePools(false);
                                node['0'].innerHTML = '<span>Collapse</span>';
                                node['0'].title = 'Temporarily collapse all';
                                break;
                            case 'Collapse':
                                hidePools(true);
                                node['0'].innerHTML = '<span>Restore</span>';
                                node['0'].title = 'Restore normal expansion';
                                break;
                            case 'Restore':
                                hidePools(true);
                                expandPoolMatches($(siteData.bigipTable.table(null).body()), siteData.bigipTable.search());
                                node['0'].innerHTML = '<span>Expand</span>';
                                node['0'].title = 'Temporarily expand all';
                                break;
                        }
                    },
                },
                'columnsToggle',
                {
                    extend: 'copyHtml5',
                    titleAttr: 'Copy current filtered results as HTML 5 to clipboard',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                },
                {
                    extend: 'print',
                    titleAttr: 'Print current filtered results',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'print',
                    },
                },
                {
                    extend: 'csvHtml5',
                    titleAttr: 'Download current filtered results in CSV format',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                    customize: customizeCSV,
                },
            ],
        },
        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, 'All'],
        ],
        search: { regex: localStorage.getItem('regexSearch') === 'true' },
        stateSave: true,
    });
    // Apply the search
    siteData.bigipTable.columns().every(function () {
        // display cached column filter
        $('input', this.header())[0].value = this.search();
        const that = this;
        $('input', this.header()).on('keyup change input search', function (e) {
            const input = e.target;
            if (that.search() !== input.value) {
                if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
                    that
                        .search(input.value, localStorage.getItem('regexSearch') === 'true', false)
                        .draw();
                }
            }
        });
    });
    $('div#allbigips_filter.dataTables_filter input').on('keyup input', function () {
        updateLocationHash();
    });
    /** ******************************************************************************************************************
  
          Add custom data tables functions
  
    *********************************************************************************************************************/
    // Prevents sorting the columns when clicking on the sorting headers
    $('table#allbigips thead th input').on('click', function (e) {
        e.stopPropagation();
    });
    // highlight matches
    siteData.bigipTable.on('draw', function () {
        const body = $(siteData.bigipTable.table(null).body());
        // reset toggleExpansion button
        const button = $('div#allbigips_wrapper div.dt-buttons button.toggleExpansion');
        button[0].innerHTML = '<span>Expand<span>';
        button[0].title = 'Temporarily expand all';
        hidePools();
        toggleAdcLinks();
        highlightAll(siteData.bigipTable);
        expandPoolMatches(body, siteData.bigipTable.search());
        setPoolTableCellWidth();
    });
    /** ***********************************************************************************************************
  
          If any search parameters has been sent, populate the search
  
      **************************************************************************************************************/
    siteData.bigipTable.draw();
}
function setupiRuleTable() {
    if (siteData.iRuleTable) {
        return;
    }
    const content = `
    <table id="iRuleTable" class="bigiptable display">
      <thead>
          <tr>
            <th class="loadbalancerHeaderCell">
              <span style="display: none;">Load Balancer</span>
              <input type="search" class="search" placeholder="Load Balancer" />
            </th>
            <th>
              <span style="display: none;">Name</span>
              <input type="search" class="search" placeholder="Name" />
            </th>
            <th>
              <span style="display: none;">Pools</span>
              <input type="search" class="search" placeholder="Associated Pools" />
            </th>
            <th>
              <span style="display: none;">Datagroups</span>
              <input type="search" class="search" placeholder="Associated Datagroups" />
            </th>
            <th>
              <span style="display: none;">Virtualservers</span>
              <input type="search" class="search" placeholder="Associated Virtual Servers" />
            </th>
            <th style="width: 4em;"><span style="display: none;">Length</span>
              <input type="search" class="search" placeholder="Length" />
            </th>
          </tr>
      </thead>
      <tbody>
      </tbody>
    </table>`;
    $('div#irules').html(content);
    siteData.iRuleTable = $('table#iRuleTable').DataTable({
        autoWidth: false,
        deferRender: true,
        data: siteData.irules,
        columns: [
            {
                data: 'loadbalancer',
                className: 'loadbalancerCell',
                render: function (data, type) {
                    return renderLoadBalancer(data, type);
                },
            },
            {
                data: 'name',
                className: 'iRuleCell',
                render: function (data, type, row) {
                    return renderRule(row.loadbalancer, data, type);
                },
            },
            {
                data: 'pools',
                type: 'html-num',
                className: 'relative',
                render: function (data, type, row, meta) {
                    return renderList(data, type, row, meta, renderPool, 'pools');
                },
            },
            {
                data: 'datagroups',
                type: 'html-num',
                render: function (data, type, row, meta) {
                    return renderList(data, type, row, meta, renderDataGroup, 'datagroups');
                },
            },
            {
                data: 'virtualservers',
                type: 'html-num',
                render: function (data, type, row, meta) {
                    return renderList(data, type, row, meta, renderVirtualServer, 'virtualservers');
                },
            },
            {
                data: 'definition',
                render: function (data) {
                    return data.length;
                },
            },
        ],
        pageLength: 10,
        language: {
            search: 'Search all columns:',
        },
        dom: 'fBrtilp',
        buttons: {
            buttons: [
                {
                    text: 'Reset filters',
                    className: 'tableHeaderColumnButton resetFilters',
                    action: resetFilters,
                },
                {
                    text: 'Expand',
                    titleAttr: 'Temporarily expand all',
                    className: 'tableHeaderColumnButton toggleExpansion',
                    action: toggleExpandCollapseRestore,
                },
                'columnsToggle',
                {
                    extend: 'copyHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                },
                {
                    extend: 'print',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'print',
                    },
                },
                {
                    extend: 'csvHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                    customize: customizeCSV,
                },
            ],
        },
        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, 'All'],
        ],
        search: { regex: localStorage.getItem('regexSearch') === 'true' },
        stateSave: true,
    });
    // Prevents sorting the columns when clicking on the sorting headers
    $('table#iRuleTable thead th input').on('click', function (e) {
        e.stopPropagation();
    });
    // Apply the search
    siteData.iRuleTable.columns().every(function () {
        // display cached column filter
        $('input', this.header())[0].value = this.search();
        const that = this;
        $('input', this.header()).on('keyup change input search', function (e) {
            const input = e.target;
            if (that.search() !== input.value) {
                if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
                    that
                        .search(input.value, localStorage.getItem('regexSearch') === 'true', false)
                        .draw();
                }
            }
        });
    });
    // highlight matches
    siteData.iRuleTable.on('draw', function () {
        // reset toggleExpansion button
        const button = $('div#iRuleTable_wrapper div.dt-buttons button.toggleExpansion');
        button[0].innerHTML = '<span>Expand<span>';
        button[0].title = 'Temporarily expand all';
        toggleAdcLinks();
        highlightAll(siteData.iRuleTable);
        expandMatches(siteData.iRuleTable.table(null).body());
    });
    siteData.iRuleTable.draw();
}
function setupPolicyTable() {
    if (siteData.PolicyTable) {
        return;
    }
    const content = `
     <table id="PolicyTable" class="bigiptable display">
         <thead>
             <tr>
                 <th class="loadbalancerHeaderCell">
                    <span style="display: none;">Load Balancer</span>
                    <input type="search" class="search" placeholder="Load Balancer" />
                </th>
                 <th>
                    <span style="display: none;">Name</span>
                    <input type="search" class="search" placeholder="Name" />
                </th>
                 <th>
                    <span style="display: none;">Virtualservers</span>
                    <input type="search" class="search" placeholder="Associated Virtual Servers" />
                </th>
            </tr>
         </thead>
         <tbody>
         </tbody>
     </table>`;
    $('div#policies').html(content);
    siteData.PolicyTable = $('table#PolicyTable').DataTable({
        autoWidth: false,
        deferRender: true,
        data: siteData.policies,
        columns: [
            {
                data: 'loadbalancer',
                className: 'loadbalancerCell',
                render: function (data, type, row) {
                    return renderLoadBalancer(data, type);
                },
            },
            {
                data: 'name',
                className: 'PolicyCell',
                render: function (data, type, row) {
                    return renderPolicy(row.loadbalancer, data, type);
                },
            },
            {
                data: 'virtualservers',
                type: 'html-num',
                render: function (data, type, row, meta) {
                    return renderList(data, type, row, meta, renderVirtualServer, 'virtualservers');
                },
            },
        ],
        pageLength: 10,
        language: {
            search: 'Search all columns:',
        },
        dom: 'fBrtilp',
        buttons: {
            buttons: [
                {
                    text: 'Reset filters',
                    className: 'tableHeaderColumnButton resetFilters',
                    action: resetFilters,
                },
                {
                    text: 'Expand',
                    titleAttr: 'Temporarily expand all',
                    className: 'tableHeaderColumnButton toggleExpansion',
                    action: toggleExpandCollapseRestore,
                },
                'columnsToggle',
                {
                    extend: 'copyHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                },
                {
                    extend: 'print',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'print',
                    },
                },
                {
                    extend: 'csvHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                    customize: customizeCSV,
                },
            ],
        },
        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, 'All'],
        ],
        search: { regex: localStorage.getItem('regexSearch') === 'true' },
        stateSave: true,
    });
    // Prevents sorting the columns when clicking on the sorting headers
    $('table#PolicyTable thead th input').on('click', function (e) {
        e.stopPropagation();
    });
    // Apply the search
    siteData.PolicyTable.columns().every(function () {
        // display cached column filter
        $('input', this.header())[0].value = this.search();
        const that = this;
        $('input', this.header()).on('keyup change input search', function (e) {
            const input = e.target;
            if (that.search() !== input.value) {
                if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
                    that
                        .search(input.value, localStorage.getItem('regexSearch') === 'true', false)
                        .draw();
                }
            }
        });
    });
    // highlight matches
    siteData.PolicyTable.on('draw', function () {
        // reset toggleExpansion button
        const button = $('div#PolicyTable_wrapper div.dt-buttons button.toggleExpansion');
        button[0].innerHTML = '<span>Expand<span>';
        button[0].title = 'Temporarily expand all';
        toggleAdcLinks();
        highlightAll(siteData.PolicyTable);
        expandMatches(siteData.PolicyTable.table(null).body());
    });
    siteData.PolicyTable.draw();
}
function setupPoolTable() {
    if (siteData.poolTable) {
        return;
    }
    const content = `
    <table id="poolTable" class="bigiptable display">
      <thead>
        <tr>
          <th class="loadbalancerHeaderCell">
            <span style="display: none;">Load Balancer</span>
            <input type="search" class="search" placeholder="Load Balancer" />
            </th>
          <th><span style="display: none;">Name</span>
            <input type="search" class="search" placeholder="Name" />
          </th>
          <th>
          <span style="display: none;">Description</span>
            <input type="search" class="search" placeholder="Description" />
          </th>
          <th>
          <span style="display: none;">Orphan</span>
            <input type="search" class="search" placeholder="Orphan" />
          </th>
          <th>
          <span style="display: none;">Method</span>
            <input type="search" class="search" placeholder="Method" />
          </th>
          <th><span style="display: none;">Monitors</span>
            <input type="search" class="search" placeholder="Monitors" />
          </th>
          <th><span style="display: none;">Members</span>
            <input type="search" class="search" placeholder="Members" />
          </th>
        </tr>
      </thead>
        <tbody>
        </tbody>
    </table>`;
    $('div#pools').html(content);
    siteData.poolTable = $('table#poolTable').DataTable({
        autoWidth: false,
        deferRender: true,
        data: siteData.pools,
        columns: [
            {
                data: 'loadbalancer',
                className: 'loadbalancerCell',
                render: function (data, type) {
                    return renderLoadBalancer(data, type);
                },
            },
            {
                data: 'name',
                render: function (data, type, row) {
                    return renderPool(row.loadbalancer, data, type);
                },
            },
            {
                data: 'description',
                visible: false,
            },
            {
                data: 'orphaned',
            },
            {
                data: 'loadbalancingmethod',
            },
            {
                data: 'monitors',
                render: function (data) {
                    if (data) {
                        return data.join(' ');
                    }
                    else {
                        return 'None';
                    }
                },
                visible: false,
            },
            {
                data: 'members',
                type: 'html-num',
                render: function (data, type, row, meta) {
                    return renderList(data, type, row, meta, renderPoolMember, 'pool members');
                },
            },
        ],
        pageLength: 10,
        language: {
            search: 'Search all columns:',
        },
        dom: 'fBrtilp',
        buttons: {
            buttons: [
                {
                    text: 'Reset filters',
                    className: 'tableHeaderColumnButton resetFilters',
                    action: resetFilters,
                },
                {
                    text: 'Expand',
                    titleAttr: 'Temporarily expand all',
                    className: 'tableHeaderColumnButton toggleExpansion',
                    action: toggleExpandCollapseRestore,
                },
                'columnsToggle',
                {
                    extend: 'copyHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                },
                {
                    extend: 'print',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'print',
                    },
                },
                {
                    extend: 'csvHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                    customize: customizeCSV,
                },
            ],
        },
        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, 'All'],
        ],
        search: { regex: localStorage.getItem('regexSearch') === 'true' },
        stateSave: true,
    });
    // Prevents sorting the columns when clicking on the sorting headers
    $('table#poolTable thead th input').on('click', function (e) {
        e.stopPropagation();
    });
    // Apply the search
    siteData.poolTable.columns().every(function () {
        // display cached column filter
        $('input', this.header())[0].value = this.search();
        const that = this;
        $('input', this.header()).on('keyup change input search', function (e) {
            const input = e.target;
            if (that.search() !== input.value) {
                if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
                    that
                        .search(input.value, localStorage.getItem('regexSearch') === 'true', false)
                        .draw();
                }
            }
        });
    });
    // highlight matches
    siteData.poolTable.on('draw', function () {
        // reset toggleExpansion button
        const button = $('div#poolTable_wrapper div.dt-buttons button.toggleExpansion');
        button[0].innerHTML = '<span>Expand<span>';
        button[0].title = 'Temporarily expand all';
        toggleAdcLinks();
        highlightAll(siteData.poolTable);
        expandMatches($(siteData.poolTable.table(null).body()));
    });
    siteData.poolTable.draw();
}
function setupDataGroupTable() {
    if (siteData.dataGroupTable) {
        return;
    }
    const content = `
    <table id="dataGroupTable" class="bigiptable display">
      <thead>
        <tr>
          <th class="loadbalancerHeaderCell">
            <span style="display: none;">Load Balancer</span>
            <input type="search" class="search" placeholder="Load Balancer" />
          </th>
          <th>
            <span style="display: none;">Name</span>
            <input type="search" class="search" placeholder="Name" />
          </th>
          <th>
            <span style="display: none;">Type</span>
            <input type="search" class="search" placeholder="Type" />
          </th>
          <th>
            <span style="display: none;">Pools</span>
            <input type="search" class="search" placeholder="Associated Pools" />
          </th>
          <th>
            <span style="display: none;">Length</span>
            <input type="search" class="search" placeholder="Length" />
          </th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    </table>`;
    $('div#datagroups').html(content);
    siteData.dataGroupTable = $('table#dataGroupTable').DataTable({
        autoWidth: false,
        deferRender: true,
        data: siteData.datagroups,
        columns: [
            {
                data: 'loadbalancer',
                className: 'loadbalancerCell',
                render: function (data, type) {
                    return renderLoadBalancer(data, type);
                },
            },
            {
                data: 'name',
                className: 'iRuleCell',
                render: function (data, type, row) {
                    return renderDataGroup(row.loadbalancer, data, type);
                },
            },
            {
                data: 'type',
            },
            {
                data: 'pools',
                type: 'html-num',
                className: 'relative',
                render: function (data, type, row, meta) {
                    return renderList(data, type, row, meta, renderPool, 'pools');
                },
            },
            {
                data: 'data',
                render: function (data) {
                    if (data) {
                        return Object.keys(data).length;
                    }
                    return 0;
                },
            },
        ],
        pageLength: 10,
        language: {
            search: 'Search all columns:',
        },
        dom: 'fBrtilp',
        buttons: {
            buttons: [
                {
                    text: 'Reset filters',
                    className: 'tableHeaderColumnButton resetFilters',
                    action: resetFilters,
                },
                {
                    text: 'Expand',
                    titleAttr: 'Temporarily expand all',
                    className: 'tableHeaderColumnButton toggleExpansion',
                    action: toggleExpandCollapseRestore,
                },
                'columnsToggle',
                {
                    extend: 'copyHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                },
                {
                    extend: 'print',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'print',
                    },
                },
                {
                    extend: 'csvHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                    customize: customizeCSV,
                },
            ],
        },
        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, 'All'],
        ],
        search: { regex: localStorage.getItem('regexSearch') === 'true' },
        stateSave: true,
    });
    // Prevents sorting the columns when clicking on the sorting headers
    $('table#dataGroupTable thead th input').on('click', function (e) {
        e.stopPropagation();
    });
    // Apply the search
    siteData.dataGroupTable.columns().every(function () {
        // display cached column filter
        $('input', this.header())[0].value = this.search();
        const that = this;
        $('input', this.header()).on('keyup change input search', function (e) {
            const input = e.target;
            if (that.search() !== input.value) {
                if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
                    that
                        .search(input.value, localStorage.getItem('regexSearch') === 'true', false)
                        .draw();
                }
            }
        });
    });
    // highlight matches
    siteData.dataGroupTable.on('draw', function () {
        // reset toggleExpansion button
        const button = $('div#dataGroupTable_wrapper div.dt-buttons button.toggleExpansion');
        button[0].innerHTML = '<span>Expand<span>';
        button[0].title = 'Temporarily expand all';
        toggleAdcLinks();
        highlightAll(siteData.dataGroupTable);
        expandMatches(siteData.dataGroupTable.table(null).body());
    });
    siteData.dataGroupTable.draw();
}
function setupCertificateTable() {
    if (siteData.certificateTable) {
        return;
    }
    const content = `
    <table id="certificateTable" class="bigiptable display">
        <thead>
          <tr>
            <th class="loadbalancerHeaderCell">
              <span style="display: none;">Load Balancer</span>
              <input type="search" class="search" placeholder="Load Balancer" />
              </th>
            <th>
              <span style="display: none;">Name</span>
              <input type="search" class="search" placeholder="Name" />
            </th>
            <th>
              <span style="display: none;">Common Name</span>
              <input type="search" class="search" placeholder="Common Name" />
            </th>
            <th>
              <span style="display: none;">SAN</span>
              <input type="search" class="search" placeholder="SAN" />
            </th>
            <th>
              <span style="display: none;">Country</span>
              <input type="search" class="search" placeholder="Country Name" />
            </th>
            <th>
              <span style="display: none;">State</span>
              <input type="search" class="search" placeholder="State Name" />
            </th>
            <th>
              <span style="display: none;">Org</span>
              <input type="search" class="search" placeholder="Organization Name" />
            </th>
            <th>
              <span style="display: none;">Expiring</span>
              <input type="search" class="search" placeholder="Expiring" />
            </th>
          </tr>
        </thead>
        <tbody>
        </tbody>
    </table>`;
    $('div#certificatedetails').html(content);
    siteData.certificateTable = $('div#certificatedetails table#certificateTable').DataTable({
        autoWidth: false,
        deferRender: true,
        data: siteData.certificates,
        columns: [
            {
                data: 'loadbalancer',
                className: 'loadbalancerCell',
                render: function (data, type) {
                    return renderLoadBalancer(data, type);
                },
            },
            {
                data: 'fileName',
                render: function (data, type, row) {
                    return renderCertificate(row.loadbalancer, data, type);
                },
            },
            {
                data: 'subject.commonName',
            },
            {
                data: 'subjectAlternativeName',
                visible: false,
            },
            {
                data: 'subject.countryName',
                className: 'certificatecountryname',
                render: function (data) {
                    let result = '';
                    if (data) {
                        result += `<img class="flagicon" alt="${data.toLowerCase()}"
                        src="images/flags/${data.toLowerCase()}.png"/>`;
                    }
                    return result + ' ' + data;
                },
                visible: false,
            },
            {
                data: 'subject.stateName',
                visible: false,
            },
            {
                data: 'subject.organizationName',
            },
            {
                data: 'expirationDate',
                render: function (data) {
                    const certificateDate = new Date(0);
                    certificateDate.setUTCSeconds(data);
                    return certificateDate
                        .toISOString()
                        .replace('T', ' ')
                        .replace(/\.[0-9]{3}Z/, '');
                },
            },
        ],
        createdRow: function (row, data) {
            // Get the days left
            const now = new Date();
            const certificateDate = new Date(0);
            certificateDate.setUTCSeconds(data.expirationDate);
            const daysLeft = dateDiffInDays(now, certificateDate);
            let rowClass;
            if (daysLeft < 14) {
                rowClass = 'certificateExpiringIn14';
            }
            else if (daysLeft < 30) {
                rowClass = 'certificateExpiringIn30';
            }
            else if (daysLeft < 60) {
                rowClass = 'certificateExpiringIn60';
            }
            else {
                rowClass = 'certificateExpiringInMoreThan60';
            }
            $(row).addClass(rowClass);
        },
        pageLength: 10,
        language: {
            search: 'Search all columns:',
        },
        dom: 'fBrtilp',
        buttons: {
            buttons: [
                {
                    text: 'Reset filters',
                    className: 'tableHeaderColumnButton resetFilters',
                    action: resetFilters,
                },
                'columnsToggle',
                {
                    extend: 'copyHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                },
                {
                    extend: 'print',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'print',
                    },
                },
                {
                    extend: 'csvHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                    customize: customizeCSV,
                },
            ],
        },
        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, 'All'],
        ],
        search: { regex: localStorage.getItem('regexSearch') === 'true' },
        stateSave: true,
    });
    // Prevents sorting the columns when clicking on the sorting headers
    $('table#certifcateTable thead th input').on('click', function (e) {
        e.stopPropagation();
    });
    // Apply the search
    siteData.certificateTable.columns().every(function () {
        // display cached column filter
        $('input', this.header())[0].value = this.search();
        const that = this;
        $('input', this.header()).on('keyup change input search', function (e) {
            const input = e.target;
            if (that.search() !== input.value) {
                if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
                    that
                        .search(input.value, localStorage.getItem('regexSearch') === 'true', false)
                        .draw();
                }
            }
        });
    });
    // Highlight matches
    siteData.certificateTable.on('draw', function () {
        toggleAdcLinks();
        highlightAll(siteData.certificateTable);
    });
    siteData.certificateTable.draw();
}
function setupLogsTable() {
    if (siteData.logTable) {
        return;
    }
    const content = `
    <table id="logstable" class="bigiptable display">
      <thead>
        <tr>
          <th>
            <span style="display: none;">DateTime</span>
            <input type="search" class="search" placeholder="DateTime" />
          </th>
          <th>
            <span style="display: none;">Severity</span>
            <input type="search" class="search" placeholder="Severity" />
          </th>
          <th>
            <span style="display: none;">Log Content</span>
            <input type="search" class="search" placeholder="Log Content" />
          </th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    </table>`;
    $('div#logs').html(content);
    siteData.logTable = $('div#logs table#logstable').DataTable({
        autoWidth: false,
        deferRender: true,
        data: siteData.loggedErrors,
        columns: [
            {
                data: 'datetime',
                className: 'logdatetime',
            },
            {
                data: 'severity',
            },
            {
                data: 'message',
            },
        ],
        pageLength: 10,
        language: {
            search: 'Search all columns:',
        },
        dom: 'fBrtilp',
        buttons: {
            buttons: [
                {
                    text: 'Reset filters',
                    className: 'tableHeaderColumnButton resetFilters',
                    action: resetFilters,
                },
                'columnsToggle',
                {
                    extend: 'copyHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                },
                {
                    extend: 'print',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'print',
                    },
                },
                {
                    extend: 'csvHtml5',
                    className: 'tableHeaderColumnButton exportFunctions',
                    exportOptions: {
                        columns: ':visible',
                        stripHtml: false,
                        orthogonal: 'export',
                    },
                    customize: customizeCSV,
                },
            ],
        },
        createdRow: function (row, data) {
            if (data && data.severity) {
                $('td', row)
                    .eq(1)
                    .addClass('logseverity' + data.severity.toLowerCase());
            }
        },
        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, 'All'],
        ],
        search: { regex: localStorage.getItem('regexSearch') === 'true' },
        stateSave: true,
    });
    // Prevents sorting the columns when clicking on the sorting headers
    $('table#logstable thead th input').on('click', function (e) {
        e.stopPropagation();
    });
    // Apply the search
    siteData.logTable.columns().every(function () {
        // display cached column filter
        $('input', this.header())[0].value = this.search();
        const that = this;
        $('input', this.header()).on('keyup change input search', function (e) {
            const input = e.target;
            if (that.search() !== input.value) {
                if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
                    that
                        .search(input.value, localStorage.getItem('regexSearch') === 'true', false)
                        .draw();
                }
            }
        });
    });
    // Highlight matches
    siteData.logTable.on('draw', function () {
        toggleAdcLinks();
        highlightAll(siteData.logTable);
    });
    siteData.logTable.draw();
}
function hideMainSection() {
    $('div.mainsection').hide();
}
function showMainSection(section) {
    hideMainSection();
    $('div#' + section).fadeIn(10, updateLocationHash);
}
function showVirtualServers(updatehash) {
    hideMainSection();
    setupVirtualServerTable();
    activateMenuButton('div#virtualserversbutton');
    $('div#mainholder').attr('data-activesection', 'virtualservers');
    updateLocationHash(updatehash);
    showMainSection('virtualservers');
}
function showiRules(updatehash) {
    hideMainSection();
    setupiRuleTable();
    activateMenuButton('div#irulesbutton');
    $('div#mainholder').attr('data-activesection', 'irules');
    updateLocationHash(updatehash);
    showMainSection('irules');
    toggleAdcLinks();
}
function showPolicies(updatehash) {
    hideMainSection();
    setupPolicyTable();
    activateMenuButton('div#policiesbutton');
    $('div#mainholder').attr('data-activesection', 'policies');
    updateLocationHash(updatehash);
    showMainSection('policies');
    toggleAdcLinks();
}
function showPools(updatehash) {
    hideMainSection();
    setupPoolTable();
    activateMenuButton('div#poolsbutton');
    $('div#mainholder').attr('data-activesection', 'pools');
    updateLocationHash(updatehash);
    showMainSection('pools');
    toggleAdcLinks();
}
function showDataGroups(updatehash) {
    hideMainSection();
    setupDataGroupTable();
    activateMenuButton('div#datagroupbutton');
    $('div#mainholder').attr('data-activesection', 'datagroups');
    updateLocationHash(updatehash);
    showMainSection('datagroups');
    toggleAdcLinks();
}
function showPreferences(updatehash) {
    hideMainSection();
    activateMenuButton('div#preferencesbutton');
    $('div#mainholder').attr('data-activesection', 'preferences');
    updateLocationHash(updatehash);
    // Prepare the content
    const settingsContent = `
    <table id="preferencestable" class="bigiptable display">
        <thead>
            <tr>
                <th colspan=2>Generic settings</th>
            </tr>
        </thead>
        <tbody>
          <tr>
            <td>Expand all pool members</td>
            <td class="preferencescheckbox">
                <input type="checkbox" id="autoExpandPools">
            </td>
          </tr>
          <tr>
            <td>Direct links to Big-IP objects</td><td class="preferencescheckbox">
              <input type="checkbox" id="adcLinks">
            </td>
          </tr>
          <tr>
            <td>Use Regular Expressions when searching</td>
            <td class="preferencescheckbox">
                <input type="checkbox" id="regexSearch">
            </td>
          </tr>
        </tbody>
    </table>
`;
    // Populate the content
    $('div#preferences').html(settingsContent);
    // Populate the settings according to the local storage or default settings if none exist
    const autoExpandPool = $('#autoExpandPools');
    const adcLinks = $('#adcLinks');
    const regexSearch = $('#regexSearch');
    // Make sure that the check boxes are checked according to the settings
    autoExpandPool.prop('checked', localStorage.getItem('autoExpandPools') === 'true');
    adcLinks.prop('checked', localStorage.getItem('showAdcLinks') === 'true');
    regexSearch.prop('checked', localStorage.getItem('regexSearch') === 'true');
    // if we change content rendering rules, we can redraw with:
    // siteData.bigipTable.clear().rows.add(siteData.virtualservers).draw();
    // we could make siteData.preferences.HideLoadBalancerFQDN dynamic this way. Might want to redraw all tables.
    // Event handler for auto expand pools
    autoExpandPool.on('click', function (e) {
        const checkBox = e.target;
        localStorage.setItem('autoExpandPools', checkBox.checked.toString());
        if (siteData.bigipTable) {
            siteData.bigipTable.draw();
        }
    });
    // Event handler for showing ADC edit links
    adcLinks.on('click', function (e) {
        const checkBox = e.target;
        localStorage.setItem('showAdcLinks', checkBox.checked.toString());
        toggleAdcLinks();
    });
    // Event handler for regular expression searches
    regexSearch.on('click', function (e) {
        const checkBox = e.target;
        localStorage.setItem('regexSearch', checkBox.checked.toString());
        toggleRegexSearch();
    });
    showMainSection('preferences');
}
function showCertificateDetails(updatehash) {
    hideMainSection();
    setupCertificateTable();
    activateMenuButton('div#certificatebutton');
    $('div#mainholder').attr('data-activesection', 'certificatedetails');
    updateLocationHash(updatehash);
    showMainSection('certificatedetails');
}
function showDeviceOverview(updatehash) {
    hideMainSection();
    activateMenuButton('div#deviceoverviewbutton');
    $('div#mainholder').attr('data-activesection', 'deviceoverview');
    updateLocationHash(updatehash);
    const deviceGroups = siteData.deviceGroups;
    const loadbalancers = siteData.loadbalancers;
    let html = `
            <table id="deviceoverviewtable" class="bigiptable display">
                <thead>
                    <tr>
                        <th>Icon</th>
                        <th>Device Group</th>
                        <th>In Sync</th>
                        <th>Name</th>
                        <th>Model</th>
                        <th>Type</th>
                        <th>Version</th>
                        <th>Serial</th>
                        ${siteData.preferences.supportCheckEnabled ? '<th>Support</th>' : ''}
                        <th>Management</th>
                        <th>Polling</th>
                    </tr>
                </thead>
                <tbody>`;
    for (const d in deviceGroups) {
        const deviceGroup = deviceGroups[d];
        // Get an icon from a functioning device, if any
        let deviceIcon = 'images/deviceicons/unknowndevice.png';
        for (const i in deviceGroup.ips) {
            const loadbalancer = loadbalancers.find(function (o) {
                return o.ip === deviceGroup.ips[i];
            });
            if (loadbalancer) {
                const model = loadbalancer.model && loadbalancer.model.toUpperCase();
                deviceIcon = model in siteData.knownDevices ? siteData.knownDevices[model].icon :
                    'images/deviceicons/unknowndevice.png';
                break;
            }
        }
        deviceGroup.ips.forEach((deviceIP, deviceIndex) => {
            const loadbalancer = loadbalancers.find(function (o) {
                return o.ip === deviceIP;
            });
            // This load balancer has failed to index
            if (!loadbalancer) {
                html += `
                <tr class="failed-device" title="BigIPReport has failed to index this device">
                  ${deviceIndex === 0 ? `
                    <td
                        rowspan="${deviceGroup.ips.length}"
                        class="deviceiconcell"
                    >
                    <img class="deviceicon" alt="deviceicon" src="${deviceIcon}"/>
                  </td>
                  <td class="devicenamecell" rowspan="${deviceGroup.ips.length}">
                    ${renderLoadBalancer(deviceGroup.name, 'display')}
                  </td>` : ''}
                  <td>FAILED</td>
                  <td><img class="devicestatusicon" title="Failed to index" alt="Failed to index"
            src="images/devicestatusred.png"/> ${renderLoadBalancer(deviceIP, 'display')}</td>
                  <td>Unknown</td>
                  <td>Unknown</td>
                  <td>Unknown</td>
                  <td>Unknown</td>
                  ${siteData.preferences.supportCheckEnabled ?
                    '<td>Unknown</td>'
                    : ''}
                  <td>Unknown</td>
                  <td>Unknown</td>`;
                return;
            }
            let pollingStatus = 'Passive Device';
            if (loadbalancer.active || loadbalancer.isonlydevice) {
                const { url, working } = loadbalancer.statusvip;
                if (url === '') {
                    pollingStatus =
                        '<span class="devicepollingnotconfigured">Not configured</span>';
                }
                else if (working) {
                    pollingStatus = '<span class="devicepollingsuccess">Working</span>';
                }
                else {
                    pollingStatus = '<span class="devicepollingfailed">Failed</span>';
                }
            }
            const deviceStatus = loadbalancer.color || 'red';
            if (deviceIndex === 0) {
                html +=
                    `<tr ${loadbalancer.success ? '' : 'class="failed-device" title="Failed to index, using cached data"'}>
             <td rowspan="${deviceGroup.ips.length}" class="deviceiconcell">
               <img class="deviceicon" alt="deviceicon" src="${deviceIcon}"/>
             </td>
             <td class="devicenamecell" rowspan="${deviceGroup.ips.length}">
                ${renderLoadBalancer(deviceGroup.name, 'display')}
             </td>`;
            }
            else if (!loadbalancer.success) {
                html += '<tr class="failed-device" title="Failed to index, using cached data">';
            }
            else if (deviceStatus == 'green') {
                html += '<tr title="Secondary device is Active" class="out-of-sync-device">';
            }
            else {
                html += '<tr>';
            }
            let syncSpan = '<span style="color:#B26F6F;font-weight:bold;">No</span>';
            const { sync } = loadbalancer;
            if (sync === 'yellow') {
                syncSpan = '<span style="color:#ED833A;font-weight:bold;">Pending</span>';
            }
            else if (sync === 'green') {
                syncSpan = '<span style="color:#8DA54B;font-weight:bold;">Yes</span>';
            }
            html +=
                `
        <td>
          <a href="https://${loadbalancer.name}/tmui/tmui/devmgmt/overview/app/index.html"
              class="plainLink" target="_blank">
            ${syncSpan}
          </a>
        </td>
        <td class="devicenamecell"><img class="devicestatusicon" alt="${deviceStatus}"
            src="images/devicestatus${deviceStatus}.png"/>
            ${(loadbalancer.name ? renderLoadBalancer(loadbalancer.name, 'display') :
                    '<span class="devicefailed">Failed to index</span>')}
        </td>
        <td>
            ${loadbalancer.category || 'N/A'}
        </td>
        <td>
            ${loadbalancer.model || 'N/A'}
        </td>
        <td>
            ${loadbalancer.version || 'N/A'}
        </td>
        <td>
            ${loadbalancer.serial}
        </td>
        ${siteData.preferences.supportCheckEnabled ?
                    generateSupportCell(loadbalancer)
                    : ''}
        <td>
            ${renderLoadBalancer(loadbalancer.ip, 'display')}
        </td>
        <td>
            ${pollingStatus}
        </td>
      </tr>`;
        });
    }
    html += `
                </tbody>
            </table>`;
    $('div#deviceoverview').html(html);
    showMainSection('deviceoverview');
}
function generateSupportCell(loadbalancer) {
    const serial = loadbalancer.serial.split(/\s+/).find(s => /^(f5-|[A-Z]|chs)/.test(s));
    const supportInfo = serial in siteData.state.supportStates ? siteData.state.supportStates[serial] : {
        hasSupport: 'unknown',
        supportErrorMessage: 'Device has no serial number',
        lastChecked: 'unknown',
        serial: '',
    };
    const icon = ['ignored', 'unknown'].includes(supportInfo.hasSupport) ? 'images/cone.png'
        : supportInfo.hasSupport === 'true' ? 'images/check-box.png'
            : 'images/warning.png';
    const title = supportInfo.hasSupport === 'true' ? 'Device has active support'
        : supportInfo.hasSupport === 'ignored' ? 'Support checks ignored in config'
            : supportInfo.supportErrorMessage;
    return `
  <td>
      <img
        class="support-icon" src="${icon}" title='${title}'
      />
  </td>`;
}
function showLogs(updatehash) {
    hideMainSection();
    setupLogsTable();
    activateMenuButton('div#logsbutton');
    $('div#mainholder').attr('data-activesection', 'logs');
    updateLocationHash(updatehash);
    showMainSection('logs');
}
function showHelp(updatehash) {
    hideMainSection();
    activateMenuButton('div#helpbutton');
    $('div#mainholder').attr('data-activesection', 'help');
    updateLocationHash(updatehash);
    showMainSection('helpcontent');
}
function log(message, severity, datetime = undefined) {
    if (!datetime) {
        let now = new Date();
        const offset = now.getTimezoneOffset();
        now = new Date(now.getTime() - offset * 60000);
        const dateArr = now.toISOString().split('T');
        datetime = dateArr[0] + ' ' + dateArr[1].replace(/\.[0-9]+Z$/, '');
    }
    siteData.loggedErrors.push({
        datetime: datetime,
        severity: severity,
        message: message,
    });
    if (siteData.logTable) {
        siteData.logTable.destroy();
        delete siteData.logTable;
        setupLogsTable();
    }
}
function toggleAdcLinks() {
    if (localStorage.getItem('showAdcLinks') === 'false') {
        $('.adcLinkSpan').hide();
    }
    else {
        $('.adcLinkSpan').show();
    }
}
function toggleRegexSearch() {
    const regexSearch = localStorage.getItem('regexSearch') === 'true';
    // internal flag: siteData.poolTable.context['0'].oPreviousSearch.bRegex
    const tables = [
        siteData.bigipTable,
        siteData.poolTable,
        siteData.iRuleTable,
        siteData.PolicyTable,
        siteData.dataGroupTable,
        siteData.certificateTable,
        siteData.logTable,
    ];
    tables.forEach((table) => {
        if (table) {
            table.search(table.search(), regexSearch, !regexSearch).draw();
        }
    });
}
function updateLocationHash(updatehash = true) {
    const parameters = [];
    const activeSection = $('div#mainholder').attr('data-activesection');
    parameters.push(`mainsection=${activeSection}`);
    $('table#allbigips thead tr th input').each(function (i, e) {
        const input = e;
        if (input.value !== '') {
            parameters.push(`${input.name}=${input.value}`);
        }
    });
    const globalSearch = $('#allbigips_filter label input').val();
    if (globalSearch && globalSearch !== '') {
        parameters.push(`global_search=${globalSearch}`);
    }
    $('div.lightboxcontent:visible').each(function () {
        const type = $(this).attr('data-type');
        const objectName = $(this).attr('data-objectname');
        const loadbalancer = $(this).attr('data-loadbalancer');
        parameters.push(`${type}=${objectName}@${loadbalancer}`);
    });
    if (updatehash) {
        window.location.hash = parameters.join('&');
    }
}
/** ********************************************************************************************************************
    Expands all pool matches in the main table when searching
***********************************************************************************************************************/
function expandPoolMatches(resultset, searchstring) {
    if (localStorage.autoExpandPools !== 'true' && searchstring !== '') {
        $(resultset)
            .children()
            .children()
            .filter('td:has(span.highlight)')
            .each(function () {
            if (this.classList.contains('PoolCell') ||
                this.classList.contains('relative')) {
                togglePool(this.id);
            }
        });
    }
}
function expandMatches(resultset) {
    $(resultset).find('details').removeAttr('open');
    $(resultset).find('details:has(span.highlight)').attr('open', '');
}
function resetFilters(e, dt) {
    $(dt.header()).find('input').val('');
    dt.search('').columns().search('').draw();
}
function toggleExpandCollapseRestore(e, dt, node) {
    switch (node['0'].innerText) {
        case 'Expand':
            $(dt.table(null).body()).find('details').attr('open', '');
            node['0'].innerHTML = '<span>Collapse</span>';
            node['0'].title = 'Temporarily collapse all';
            break;
        case 'Collapse':
            $(dt.table(null).body()).find('details').removeAttr('open');
            node['0'].innerHTML = '<span>Restore</span>';
            node['0'].title = 'Restore normal expansion';
            break;
        case 'Restore':
            hidePools(true);
            expandMatches($(dt.table(null).body()));
            node['0'].innerHTML = '<span>Expand</span>';
            node['0'].title = 'Temporarily expand all';
            break;
    }
}
/** ********************************************************************************************************************
    Collapses all pool cells in the main table
***********************************************************************************************************************/
function hidePools(hide = (localStorage.autoExpandPools !== 'true')) {
    if (hide) {
        $('.pooltablediv').hide();
        $('.collapse').hide();
        $('.expand').show();
        $('.AssociatedPoolsInfo').show();
    }
    else {
        $('.AssociatedPoolsInfo').hide();
        $('.expand').hide();
        $('.collapse').show();
        $('.pooltablediv').show();
    }
}
/** ********************************************************************************************************************
    Expands/collapses a pool cell based on the tid (toggle id)
***********************************************************************************************************************/
function togglePool(tid) {
    // Store the current window selection
    const selection = window.getSelection();
    // If no text is selected, go ahead and expand or collapse the pool
    if (selection.type !== 'Range') {
        if ($('#PoolCell-' + tid).is(':visible')) {
            $('#AssociatedPoolsInfo-' + tid).show();
            $('#expand-' + tid).show();
            $('#collapse-' + tid).hide();
            $('#PoolCell-' + tid).hide();
        }
        else {
            $('#AssociatedPoolsInfo-' + tid).hide();
            $('#expand-' + tid).hide();
            $('#collapse-' + tid).show();
            $('#PoolCell-' + tid).fadeIn(300);
        }
    }
}
/** ********************************************************************************************************************
    Set the max width of the pool cells in order to make the member column align
***********************************************************************************************************************/
function setPoolTableCellWidth() {
    let maxwidth = 0;
    const poolName = $('.poolname');
    poolName.each(function (i, obj) {
        if (obj.offsetWidth > maxwidth) {
            maxwidth = obj.offsetWidth;
        }
    });
    poolName.each(function (i, obj) {
        if (obj.offsetWidth < maxwidth) {
            obj.style.width = maxwidth.toString();
        }
    });
    maxwidth = 0;
    poolName.each(function (i, obj) {
        if (obj.offsetWidth > maxwidth) {
            maxwidth = obj.offsetWidth;
        }
    });
    poolName.each(function (i, obj) {
        if (obj.offsetWidth < maxwidth) {
            obj.style.width = maxwidth.toString();
        }
    });
}
/** ********************************************************************************************************************
 Handles the highlight of content when searching
 **********************************************************************************************************************/
// es-lint does not seem to respect hoisting in this case
// eslint-disable-next-line no-unused-vars
function togglePoolHighlight(e) {
    if (e.style.backgroundColor === '') {
        $('.' + e.className).css('background-color', '#BCD4EC');
    }
    else {
        $('.' + e.className).css('background-color', '');
    }
}
/** ********************************************************************************************************************

    Functions related to showing the pool details lightbox

***********************************************************************************************************************/
/** ********************************************************************************************************************
    Shows the virtual server details light box
**********************************************************************************************************************/
function showVirtualServerDetails(virtualserver, loadbalancer) {
    let html;
    const virtualservers = siteData.virtualservers;
    let matchingvirtualserver;
    // Find the matching pool from the JSON object
    for (const i in virtualservers) {
        if (virtualservers[i].name === virtualserver &&
            virtualservers[i].loadbalancer === loadbalancer) {
            matchingvirtualserver = virtualservers[i];
        }
    }
    // If a pool was found, populate the pool details table and display it on the page
    if (matchingvirtualserver) {
        const { name, currentconnections, cpuavg1min, cpuavg5min, cpuavg5sec, maximumconnections, loadbalancer, sourcexlatetype, sourcexlatepool, trafficgroup, defaultpool, description, sslprofileclient, sslprofileserver, compressionprofile, profiletype, persistence, otherprofiles, policies, irules, ip, port, } = matchingvirtualserver;
        html = '<div class="virtualserverdetailsheader">';
        html +=
            '<span>Virtual Server: ' + name + '</span><br>';
        html +=
            '<span>Load Balancer: ' +
                renderLoadBalancer(loadbalancer, 'display') +
                '</span>';
        html += '</div>';
        const firstLayer = $('div#firstlayerdetailscontentdiv');
        firstLayer.attr('data-type', 'virtualserver');
        firstLayer.attr('data-objectname', name);
        firstLayer.attr('data-loadbalancer', loadbalancer);
        let xlate;
        switch (sourcexlatetype) {
            case 'snat':
                xlate = 'SNAT:' + sourcexlatepool;
                break;
            default:
                xlate = sourcexlatetype || 'Unknown';
        }
        const trafficGroup = trafficgroup || 'N/A';
        const defaultPool = defaultpool || 'N/A';
        // Build the table and headers
        // First row containing simple properties in two cells which in turn contains subtables
        let table = `<table class="virtualserverdetailstablewrapper">
                        <tbody>
                           <tr>
                             <td>`;
        // Subtable 1
        table += `<table class="virtualserverdetailstable">
                <tr>
                  <th>Name</th>
                  <td>
                    ${name}
                  </td>
                </tr>
                <tr>
                  <th>IP:Port</th>
                  <td>${ip}:${port}</td>
                </tr>
                <tr>
                  <th>Profile Type</th>
                  <td>${profiletype}</td>
                </tr>
                <tr>
                  <th>Default pool</th>
                  <td>${renderPool(loadbalancer, defaultPool, 'display')}</td>
                </tr>
                <tr><th>Traffic Group</th><td>${trafficGroup}</td></tr>
                <tr><th>Description</th><td>${description || ''}</td></tr>
            </table>
         </td>`;
        // Subtable 2
        table += `<td>
                <table class="virtualserverdetailstable">
                  <tr>
                    <th>Client SSL Profile</th>
                    <td>${sslprofileclient.join('<br>')}</td>
                  </tr>
                  <tr>
                    <th>Server SSL Profile</th>
                    <td>${sslprofileserver.join('<br>')}</td>
                  </tr>
                  <tr>
                    <th>Compression Profile</th>
                    <td>${compressionprofile}</td>
                  </tr>
                  <tr>
                    <th>Persistence Profiles</th>
                    <td>${persistence.join('<br>')}</td>
                  </tr>
                  <tr><th>Source Translation</th><td>${xlate}</td></tr>
                  <tr>
                    <th>Other Profiles</th>
                    <td>${otherprofiles.join('<br>')}</td>
                  </tr>
                </table>
            </td>
           </tr>
         </tbody>
     </table>
     <br>`;
        table += `<table class="virtualserverdetailstable">
                    <tr>
                      <th>Current Connections</th>
                      <th>Maximum Connections</th>
                      <th>5 second average CPU usage</th>
                      <th>1 minute average CPU usage</th>
                      <th>5 minute average CPU usage</th>
                    </tr>
                    <tr>
                      <td>${currentconnections}</td>
                      <td>${maximumconnections}</td>
                      <td>${cpuavg5sec}</td>
                      <td>${cpuavg1min}</td>
                      <td>${cpuavg5min}</td>
                     </tr>
              </table>
              <br>`;
        if (!matchingvirtualserver.policies.some(p => p === 'None')) {
            table += `<table class="virtualserverdetailstable">
                <tr><th>Policy name</th></tr>
                ${policies.map(p => `<tr><td>${renderPolicy(loadbalancer, p, 'display')}</td></tr>`)}`;
        }
        if (siteData.preferences.ShowiRules) {
            if (irules.length > 0) {
                // Add the assigned irules
                table += '<table class="virtualserverdetailstable">';
                if (siteData.preferences.ShowiRuleLinks) {
                    table += '    <tr><th>iRule name</th><th>Data groups</th></tr>';
                }
                else {
                    table += '    <tr><th>iRule name</th></tr>';
                }
                for (const i in irules) {
                    // If iRules linking has been set to true show iRule links
                    // and parse data groups
                    if (siteData.preferences.ShowiRuleLinks) {
                        const iruleobj = getiRule(irules[i], loadbalancer);
                        if (Object.keys(iruleobj).length === 0) {
                            table +=
                                '    <tr><td>' +
                                    matchingvirtualserver.irules[i] +
                                    '</td><td>N/A (empty rule)</td></tr>';
                        }
                        else {
                            const datagroupdata = [];
                            if (iruleobj.datagroups && iruleobj.datagroups.length > 0) {
                                iruleobj.datagroups.forEach((datagroup) => {
                                    const name = datagroup.split('/')[2];
                                    if (siteData.preferences.ShowDataGroupLinks) {
                                        datagroupdata.push(renderDataGroup(loadbalancer, datagroup, 'display'));
                                    }
                                    else {
                                        datagroupdata.push(name);
                                    }
                                });
                            }
                            else {
                                datagroupdata.push('N/A');
                            }
                            table += `    <tr><td>${renderRule(loadbalancer, iruleobj.name, 'display')}</td><td>${datagroupdata.join('<br>')}</td></tr>`;
                        }
                    }
                    else {
                        table += `        <tr><td>${irules[i]}</td></tr>`;
                    }
                }
                table += '</table>';
            }
        }
        html += table;
    }
    else {
        html = `
      <div id="objectnotfound">
        <h1>No matching Virtual Server was found</h1>

        <h4>What happened?</h4>
        When clicking the report it will parse the JSON data to find the matching Virtual Server and display the
        details. However, in this case it was not able to find any matching Virtual Server.

        <h4>Possible reason</h4>
        This might happen if the report is being updated as you navigate to the page.
        If you see this page often, please report a bug
        <a href="https://devcentral.f5.com/codeshare/bigip-report">DevCentral</a>.

        <h4>Possible solutions</h4>
        Refresh the page and try again.

        </div>`;
    }
    $('a#closefirstlayerbutton').text('Close virtual server details');
    $('#firstlayerdetailscontentdiv').html(html);
    $('#firstlayerdiv').fadeIn(updateLocationHash);
    toggleAdcLinks();
}
/** ********************************************************************************************************************
    Returns a matching irules object from the irules json data
**********************************************************************************************************************/
function getiRule(irule, loadbalancer) {
    const irules = siteData.irules;
    let matchingirule;
    // Find the matching irule from the JSON object
    for (const i in irules) {
        if (irules[i].name === irule && irules[i].loadbalancer === loadbalancer) {
            matchingirule = irules[i];
        }
    }
    return matchingirule;
}
/** ********************************************************************************************************************
    Shows the irule details light box
**********************************************************************************************************************/
function showiRuleDetails(irule, loadbalancer) {
    // Get the rule object from the json file
    const matchingirule = getiRule(irule, loadbalancer);
    let html;
    // If an irule was found, prepare the data to show it
    if (matchingirule) {
        // Populate the header
        html = '<div class="iruledetailsheader">';
        html += '<span>iRule: ' + matchingirule.name + '</span><br>';
        html +=
            '<span>Load Balancer: ' +
                renderLoadBalancer(loadbalancer, 'display') +
                '</span>';
        html += '</div>';
        const secondLayerContent = $('div#secondlayerdetailscontentdiv');
        secondLayerContent.attr('data-type', 'irule');
        secondLayerContent.attr('data-objectname', matchingirule.name);
        secondLayerContent.attr('data-loadbalancer', matchingirule.loadbalancer);
        // Save the definition to a variable for some classic string mangling
        let definition = matchingirule.definition;
        // Replace those tags with to be sure that the content won't be interpreted as HTML by the browser
        definition = definition.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Check if data group links are wanted. Parse and create links if that's the base
        if (siteData.preferences.ShowDataGroupLinks === true) {
            matchingirule.datagroups.forEach((dg) => {
                // rule might not include partition which causes the replace to fail
                let regexp;
                const opt = dg.replace(/\/.*\//, '($&)?');
                // prepare a regexp to replace all instances
                try {
                    // negative look behind is part of ES2018
                    // https://github.com/tc39/proposal-regexp-lookbehind
                    regexp = new RegExp('((?<![\\w-])' + opt + '(?![\\w-]))', 'gi');
                }
                catch (e) {
                    regexp = new RegExp('(' + opt + ')\\b', 'gi');
                }
                // Prepare the link
                const link = `<a href="Javascript:showDataGroupDetails('${dg}', '${loadbalancer}')">$1</a>`;
                // Do the actual replacement
                definition = definition.replace(regexp, link);
            });
            matchingirule.pools.forEach((pool) => {
                // rule might not include partition which causes the replace to fail
                const opt = pool.replace(/\/.*\//, '($&)?');
                let regexp;
                // prepare a regexp to replace all instances
                try {
                    // negative look behind is part of ES2018
                    // https://github.com/tc39/proposal-regexp-lookbehind
                    regexp = new RegExp('((?<![\\w-])' + opt + '(?![\\w-]))', 'gi');
                }
                catch (e) {
                    regexp = new RegExp('(' + opt + ')\\b', 'gi');
                }
                // Prepare the link
                const link = '<a href="Javascript:showPoolDetails(\'' +
                    pool +
                    '\', \'' +
                    loadbalancer +
                    '\')">$1</a>';
                // Do the actual replacement
                definition = definition.replace(regexp, link);
            });
        }
        // Prepare the div content
        html +=
            `<table class="bigiptable display">
                    <thead>
                        <tr><th>iRule definiton</th></tr>
                    </thead>
                    <tbody>
                    <tr><td><pre class="sh_tcl">` +
                definition +
                '</pre></td></tr>';
        if (matchingirule.virtualservers &&
            matchingirule.virtualservers.length > 0) {
            html +=
                '<tr><td>Used by ' +
                    matchingirule.virtualservers.length +
                    ' Virtual Servers:<br>' +
                    matchingirule.virtualservers
                        .map((vs) => renderVirtualServer(loadbalancer, vs, 'display'))
                        .join('<br>') +
                    '</td></tr>';
        }
        html += `</tbody>
                </table>`;
    }
    // Add the close button to the footer
    $('a#closesecondlayerbutton').text('Close irule details');
    // Add the div content to the page
    $('#secondlayerdetailscontentdiv').html(html);
    /* redo syntax highlighting */
    // sh_highlightDocument('js/', '.js'); // eslint-disable-line no-undef
    // Show the div
    $('#secondlayerdiv').fadeIn(updateLocationHash);
    toggleAdcLinks();
}
/** ********************************************************************************************************************
    Returns a matching data group object from the data group json data
**********************************************************************************************************************/
function getDataGroup(datagroup, loadbalancer) {
    const datagroups = siteData.datagroups;
    let matchingdatagroup;
    // Find the matching data group from the JSON object
    for (const i in datagroups) {
        if (datagroups[i].name === datagroup &&
            datagroups[i].loadbalancer === loadbalancer) {
            matchingdatagroup = datagroups[i];
        }
    }
    return matchingdatagroup;
}
/** ********************************************************************************************************************
 Returns a matching policy object from the policy json data
 **********************************************************************************************************************/
function getPolicy(policy, loadbalancer) {
    const policies = siteData.policies;
    let matchingpolicy;
    //Find the matching policy from the JSON object
    for (const p in policies) {
        if (policies[p].name === policy && policies[p].loadbalancer === loadbalancer) {
            matchingpolicy = policies[p];
        }
    }
    return matchingpolicy;
}
/** ********************************************************************************************************************
 Shows the policy details light box
 **********************************************************************************************************************/
function showPolicyDetails(policy, loadbalancer) {
    //Get the policy object from the json file
    const matchingpolicy = getPolicy(policy, loadbalancer);
    let html;
    //If an policy was found, prepare the data to show it
    if (matchingpolicy) {
        //Populate the header
        html = `<div class="policydetailsheader">
               <span>Policy: ${matchingpolicy.name} </span>
               <br>
               <span>Load Balancer: ${renderLoadBalancer(loadbalancer, 'display')} </span>
            </div>`;
        const firstLayerContent = $('div#firstlayerdetailscontentdiv');
        firstLayerContent.attr('data-type', 'policy');
        firstLayerContent.attr('data-objectname', matchingpolicy.name);
        firstLayerContent.attr('data-loadbalancer', matchingpolicy.loadbalancer);
        // Save the definition to a variable for some classic string mangling
        let definition = matchingpolicy.definition;
        // Replace those tags with to be sure that the content won't be interpreted as HTML by the browser
        definition = definition.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        //Prepare the div content
        html += `<table class="bigiptable display">
               <thead>
                  <tr><th>Policy definition</th></tr> </thead>
               <tbody>
                 <tr><td><pre class="sh_tcl"> ${definition} </pre></td></tr>`;
        if (matchingpolicy.virtualservers &&
            matchingpolicy.virtualservers.length > 0) {
            html += `<tr><td>Used by ${matchingpolicy.virtualservers.length} Virtual Servers:<br>
                  ${matchingpolicy.virtualservers.map(vs => renderVirtualServer(loadbalancer, vs, 'display'))
                .join('<br>')} </td></tr>`;
        }
        html += '</tbody> </table>';
    }
    //Add the close button to the footer
    $('a#closefirstlayerbutton').text('Close policy details');
    //Add the div content to the page
    $('#firstlayerdetailscontentdiv').html(html);
    /* redo syntax highlighting */
    // sh_highlightDocument('js/', '.js'); // eslint-disable-line no-undef
    //Show the div
    $('#firstlayerdiv').fadeIn(updateLocationHash);
    toggleAdcLinks();
}
/** ********************************************************************************************************************
    Displays a data group in a lightbox
**********************************************************************************************************************/
function showDataGroupDetails(datagroup, loadbalancer) {
    // Get a matching data group from the json data
    const matchingdatagroup = getDataGroup(datagroup, loadbalancer);
    if (siteData.datagroupdetailsTable) {
        siteData.datagroupdetailsTable.destroy();
    }
    // If a pool was found, populate the pool details table and display it on the page
    if (matchingdatagroup) {
        const secondLayerContent = $('div#secondlayerdetailscontentdiv');
        secondLayerContent.attr('data-type', 'datagroup');
        secondLayerContent.attr('data-objectname', matchingdatagroup.name);
        secondLayerContent.attr('data-loadbalancer', matchingdatagroup.loadbalancer);
        let html = '<div class="datagroupdetailsheader">';
        html += '<span>Data group: ' + matchingdatagroup.name + '</span><br>';
        html +=
            '<span>Load Balancer: ' +
                renderLoadBalancer(loadbalancer, 'display') +
                '</span><br>';
        html += '<span class="dgtype">Type: ' + matchingdatagroup.type + '</span>';
        html += '</div>';
        html += `<table id="datagroupdetailsTable" class="datagrouptable display">
                    <thead>
                        <tr>
                            <th class="keyheader">Key</th>
                            <th class="valueheader">Value</th>
                        </tr>
                    </thead>
                    <tbody>`;
        if (Object.keys(matchingdatagroup).length === 0) {
            html += '<tr class="emptydg"><td colspan="2">Empty data group</td></tr>';
        }
        else {
            siteData.datagroupdetailsTableData = $.map(matchingdatagroup.data, function (value, key) {
                return { key: key, value: value };
            });
        }
        html += '</tbody></table>';
        $('#secondlayerdetailscontentdiv').html(html);
        siteData.datagroupdetailsTable = $('table#datagroupdetailsTable').DataTable(// eslint-disable-line new-cap
        {
            autoWidth: false,
            pageLength: 10,
            order: [],
            language: {
                search: 'Search all columns:',
            },
            data: siteData.datagroupdetailsTableData,
            columns: [
                {
                    data: 'key',
                },
                {
                    data: 'value',
                    render: function (data, type) {
                        if (data && data.match(/^http(s)?:/)) {
                            return '<a href="' + data + '">' + data + '</a>';
                        }
                        else {
                            const pool = getPool('/Common/' + data, loadbalancer);
                            if (pool) {
                                // Click to see pool details
                                return renderPool(loadbalancer, pool.name, type);
                            }
                            else {
                                return data;
                            }
                        }
                    },
                },
            ],
            dom: 'frtilp',
            lengthMenu: [
                [10, 25, 50, 100, -1],
                [10, 25, 50, 100, 'All'],
            ],
            search: { regex: localStorage.getItem('regexSearch') === 'true' },
            stateSave: true,
        });
    }
    else {
        $('#secondlayerdetailscontentdiv').html('');
    }
    $('a#closesecondlayerbutton').text('Close data group details');
    $('#secondlayerdiv').fadeIn(updateLocationHash);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function exportDeviceData() {
    const loadbalancers = siteData.loadbalancers;
    const loadbalancersForExport = [];
    // Loop through the load balancers while anonymizing the data
    for (const i in loadbalancers) {
        const loadbalancer = loadbalancers[i];
        let statusvip;
        let newLB;
        for (const p in loadbalancer) {
            switch (p) {
                case 'name':
                    newLB.name = 'LB' + i;
                    break;
                case 'serial':
                    newLB.serial = 'XXXX-YYYY';
                    break;
                case 'ip':
                    newLB.ip = '10.0.0.' + i;
                    break;
                case 'statusvip':
                    statusvip.url = '';
                    statusvip.working = null;
                    statusvip.state = null;
                    newLB.statusvip = statusvip;
                    break;
                default:
                    newLB[p] = loadbalancer[p];
            }
        }
        loadbalancersForExport.push(newLB);
    }
    downLoadTextFile(JSON.stringify(loadbalancersForExport, null, 4), 'loadbalancers.json');
    // Loop through the device groups while anonymizing the data
    const deviceGroups = siteData.deviceGroups;
    const deviceGroupsForExport = [];
    let newDeviceGroup;
    for (const d in deviceGroups) {
        const deviceGroup = deviceGroups[d];
        newDeviceGroup.name = 'DG' + d;
        newDeviceGroup.ips = [];
        for (const i in deviceGroup.ips) {
            newDeviceGroup.ips.push('10.0.0.' + i);
        }
    }
    deviceGroupsForExport.push(newDeviceGroup);
    downLoadTextFile(JSON.stringify(deviceGroupsForExport, null, 4), 'devicegroups.json');
}
function loadPreferences() {
    const preferences = siteData.preferences;
    for (const k in preferences) {
        if (localStorage.getItem(k) === null) {
            localStorage.setItem(k, preferences[k]);
        }
    }
}
function getPool(pool, loadbalancer) {
    return siteData.poolsMap.get(`${loadbalancer}:${pool}`);
}
function getVirtualServer(vs, loadbalancer) {
    return (siteData.virtualservers.find(function (o) {
        return o.name === vs && o.loadbalancer === loadbalancer;
    }));
}
function getLoadbalancer(loadbalancer) {
    return (siteData.loadbalancers.find(function (o) {
        return o.name === loadbalancer;
    }) || false);
}
// a and b are javascript Date objects
function dateDiffInDays(a, b) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}
function activateMenuButton(b) {
    $('div.menuitem').removeClass('menuitemactive');
    $(b).addClass('menuitemactive');
}
function customizeCSV(csv) {
    const csvRows = csv.split('\n');
    // table headings have a span and a placeholder, replace with placeholder
    csvRows[0] = csvRows[0].replace(/<span[^>]*>[^<]*<\/span>[^>]*<[^>]* placeholder=""([^"]*)""[^>]*>/gi, '$1');
    return csvRows.join('\n');
}
function downLoadTextFile(data, fileName) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', fileName);
    element.innerHTML = 'download';
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/******/ })()
;