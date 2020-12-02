import { siteData, updateLocationHash, renderLoadBalancer } from '../bigipreport.js';
import translateStatus from './translateStatus.js';
import selectMonitorInputText from './selectMonitorInputText.js';
import parseHTTPMonitorSendString from './parseHTTPMonitorSendString.js';
/** ********************************************************************************************************************
 Shows the pool details light box
 **********************************************************************************************************************/
export default function showPoolDetails(pool, loadbalancer, layer = 'first') {
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
        const matchingmonitors = [];
        const monitors = siteData.monitors;
        for (const i in poolmonitors) {
            for (const x in monitors) {
                if (monitors[x].name === poolmonitors[i] &&
                    monitors[x].loadbalancer === loadbalancer) {
                    matchingmonitors.push(monitors[x]);
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
        if (matchingmonitors.length > 0) {
            table += '<div class="monitordetailsheader">Assigned monitors</div>';
            for (const i in matchingmonitors) {
                const matchingmonitor = matchingmonitors[i];
                matchingmonitor.sendstring = matchingmonitor.sendstring
                    .replace('<', '&lt;')
                    .replace('>', '&gt;');
                matchingmonitor.receivestring = matchingmonitor.receivestring
                    .replace('<', '&lt;')
                    .replace('>', '&gt;');
                matchingmonitor.disablestring = matchingmonitor.disablestring
                    .replace('<', '&lt;')
                    .replace('>', '&gt;');
                table += `
          <table class="monitordetailstable">
              <thead>
                <tr>
                    <th colspan=2>${matchingmonitor.name}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Type</td>
                  <td>${matchingmonitor.type}</b></td>
                </tr>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Send string</td>
                  <td>${matchingmonitor.sendstring}</b></td>
                </tr>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Receive String</b></td>
                  <td>${matchingmonitor.receivestring}</td>
                </tr>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Disable String</b></td>
                  <td>${matchingmonitor.disablestring}</td>
                </tr>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Interval</b></td>
                  <td>${matchingmonitor.interval}</td>
                </tr>
                <tr>
                  <td class="monitordetailstablerowheader"><b>Timeout</b></td>
                  <td>${matchingmonitor.timeout}</td>
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
                for (const x in members) {
                    const member = members[x];
                    const protocol = matchingmonitors[i].type.replace(/:.*$/, '');
                    const requestparameters = parseHTTPMonitorSendString(matchingmonitor.sendstring);
                    if (requestparameters && ['http', 'https', 'tcp', 'tcp-half-open'].includes(protocol)) {
                        let curllink;
                        let netcatlink;
                        let httplink;
                        let url;
                        let curlcommand;
                        const sendstring = matchingmonitors[i].sendstring;
                        if (['http', 'https'].includes(protocol)) {
                            if (requestparameters['verb'] === 'GET' ||
                                requestparameters['verb'] === 'HEAD') {
                                curlcommand = 'curl';
                                if (requestparameters['verb'] === 'HEAD') {
                                    curlcommand += ' -I';
                                }
                                if (requestparameters['version'] === 'HTTP/1.0') {
                                    curlcommand += ' -0';
                                }
                                for (const x in requestparameters['headers']) {
                                    const header = requestparameters['headers'][x];
                                    const headerarr = header.split(':');
                                    const headername = headerarr[0].trim();
                                    const headervalue = headerarr[1].trim();
                                    curlcommand += ` -H &quot;${headername}:${headervalue}&quot;`;
                                }
                                url = `${protocol}://${member.ip}:${member.port}${requestparameters['uri']}`;
                                curlcommand += ` ${url}`;
                            }
                            curllink = `<a href="${url}" target="_blank"
                            class="monitortest"
                            data-type="curl">curl<p>Curl command (CTRL+C)<input id="curlcommand" 
                            class="monitorcopybox" type="text" value="${curlcommand}"></p></a>`;
                        }
                        if (protocol === 'http' ||
                            protocol === 'tcp' ||
                            protocol === 'tcp-half-open') {
                            const netcatcommand = `echo -ne "${sendstring}" | nc ${member.ip} ${member.port}`;
                            netcatlink = `<a href="javascript:selectMonitorInpuText(this)" class="monitortest"
                              data-type="netcat">Netcat<p>Netcat command (CTRL+C)<input id="curlcommand"
                              class="monitorcopybox" type="text" value='${netcatcommand}'>
                              </p>
                            </a>`;
                        }
                        if (protocol === 'http' || protocol === 'https') {
                            const url = `${protocol}://${member.ip}:${member.port}${requestparameters['uri']}`;
                            httplink = `<a href="${url}" target="_blank" class="monitortest"
                            data-type="http">
                              HTTP
                              <p>
                                HTTP Link (CTL+C)
                                <input id="curlcommand" class="monitorcopybox" type="text" value="${url}">
                              </p>
                          </a>`;
                        }
                        table += `<tr><td>${member.name}</td><td>${member.ip}</td><td>${member.port}</td><td>${httplink || 'N/A'}</td><td>${curllink || 'N/A'}</td><td>${netcatlink || 'N/A'}</td></tr>`;
                    }
                    else {
                        table += `<tr>
                        <td>${member.name}</td>
                        <td>${member.ip}</td>
                        <td>${member.port}</td>
                        <td>N/A</td>
                        <td>N/A</td>
                        <td>N/A</td>
                      </tr>`;
                    }
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
    $(layerContentDiv).find('a.monitortest').on('mouseover', selectMonitorInputText);
    $(`#${layer}layerdiv`).fadeIn(updateLocationHash);
}
