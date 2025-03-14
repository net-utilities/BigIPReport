import { siteData, updateLocationHash, renderLoadBalancer } from '../bigipreport';
import translateStatus from './translateStatus';
import selectMonitorInputText from './selectMonitorInputText';
import IMonitor from '../Interfaces/IMonitor';
import generateMonitorTests from './generateMonitorTests';

/**
 * A more modern approach to copy a string into the clipboard
 * @param str
 * @Return Promise<void>
 */
const navCopy = (str: string): Promise<void> => {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText)
    return navigator.clipboard.writeText(str);
  return Promise.reject(Error('The Clipboard API is not available.'));
};

/**
 * Copy data-copy attribute content from a monitor test button
 * @param event
 */
const copyToClipBoard = async (event: MouseEvent): Promise<void> => {

  const monitorButton = event.target as HTMLButtonElement;
  const copyString = monitorButton.getAttribute('data-copy');

  try {
    await navCopy(copyString)
  } catch(e) {
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
};



/** ********************************************************************************************************************
 Shows the pool details light box
 ******************************************************************************************************************** */

/**
 * Renders the pool details div
 * @param pool
 * @param loadbalancer
 * @param layer
 */

export default function showPoolDetails(pool: string, loadbalancer: string, layer = 'first'): void {
  const matchingpool = siteData.poolsMap.get(`${loadbalancer}:${pool}`);
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
                        <span>Load Balancer: ${renderLoadBalancer(
      loadbalancer,
      'display'
    )}</span>
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
    const matchingMonitors: IMonitor[] = [];

    const { monitors } = siteData;

    if (poolmonitors && poolmonitors.length) {
      poolmonitors.forEach(monitorName => {
        const matchingMonitor = monitors.find(m => m.loadbalancer === loadbalancer && m.name === monitorName);
        if (matchingMonitor) matchingMonitors.push(matchingMonitor);
      })
    }

    const { members } = matchingpool;

   members.forEach(member => {
      const memberstatus = translateStatus(member);

      table += `
                    <tr>
                        <td>${member.name}</td>
                        <td>${member.ip}</td>
                        <td>${member.port}</td>
                        <td>${member.priority}</td>
                        <td>${member.currentconnections}</td>
                        <td>${member.maximumconnections}</td>
                        <td>${memberstatus.availability}</td>
                        <td>${memberstatus.enabled}</td>
                        <td>${member.status}</td>
                        <td>${memberstatus.realtime}</td>
                    </tr>`;
    })

    table += `</tbody></table>
                    <br>`;

    if (matchingMonitors.length > 0) {
      table += '<div class="monitordetailsheader">Assigned monitors</div>';

      matchingMonitors.forEach(matchingMonitor => {
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

        members.forEach(member => {

          const {name, ip, port } = member;
          const escapedIP = /.+:.+:.+:/.test(ip) ? `[${ip}]`: ip;
          const protocol = matchingMonitor.type.replace(/:.*$/, '').toLocaleLowerCase();
          const { curl, http, netcat } = generateMonitorTests(matchingMonitor, member);

          const curlLink = curl ? `<button class="monitor-copy" data-copy="${curl}">Copy</button>` : 'N/A';
          const netcatLink = netcat ? `<button class="monitor-copy" data-copy="${netcat}">Copy</button>` : 'N/A';
          const httpLink = http ? `<button class="monitor-copy" data-copy="${http}">Copy</button>` : 'N/A';

            table += `<tr>
                        <td>${name}</td>
                        <td>
                            ${
                              /^http[s]*$/.test(protocol) ?
                              `<a href="${protocol}://${escapedIP}">${ip}</a>`:
                              ip
                            }
                        </td>
                        <td>${port}</td>
                        <td>${httpLink}</td>
                        <td>${curlLink}</td>
                        <td>${netcatLink}</td>
                      </tr>`;
        });

        table += `
                        </table>
                        <br>`;
      });

      table += '</tbody></table>';
    }

    html += table;
  } else {
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
