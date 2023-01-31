import { Certificate } from 'crypto';
import ISiteData, { PatchedSettings } from './Interfaces/ISiteData';
import IPool, {IMember} from './Interfaces/IPool';
import ICertificate from './Interfaces/ICertificate';
import ILoggedError from './Interfaces/ILoggedErrors';
import IVirtualServer from './Interfaces/IVirtualServer';
import IIrule from './Interfaces/IIrule';
import IDataGroup, {IDataGroupData} from './Interfaces/IDataGroup';
import ILoadbalancer, { IStatusVIP } from './Interfaces/ILoadbalancer';
import IDeviceGroup from './Interfaces/IDeviceGroup';
import showPoolDetails from './PoolDetails/showPoolDetails';
import { ISupportState} from './Interfaces/IState';
import getJSONFiles from './Init/getJSONFiles';
import jqXHR = JQuery.jqXHR;
declare function sh_highlightDocument(prefix:any, suffix:any): any;

/* *********************************************************************************************************************

    BigIPReport Javascript

********************************************************************************************************************* */

// eslint-disable-next-line import/no-mutable-exports
export let siteData: Partial<ISiteData> = {
  loggedErrors: []
};

/* *********************************************************************************************************************

    Waiting for all pre-requisite objects to load

********************************************************************************************************************* */

declare global {
  interface Window {
    showPoolDetails: any;
    togglePool: any;
    togglePoolHighlight: any;
    showVirtualServerDetails: any;
    showDataGroupDetails: any;
    showiRuleDetails: any;
    showPolicyDetails: any;
    siteData: any;
  }
}

window.addEventListener('load', async () => {

  // Animate loader off screen
  log('Starting window on load', 'INFO');

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

  /* *******************************************************************************************************************

        Lightbox related functions

    ***************************************************************************************************************** */

  /* Hide the lightbox if clicking outside the information box */
  $('body').on('click', (e) => {
    if (e.target.classList.contains('lightbox')) {
      $(`div#${e.target.id}`).fadeOut(updateLocationHash);
    }
  });

  closeFirstLayerButton.on('click',  () => {
    $('div#firstlayerdiv').trigger('click');
  });
  $('a#closesecondlayerbutton').on('click', () => {
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
  $.expr[':'].icontains = $.expr.createPseudo(
    (text) => (e) => $(e).text().toUpperCase().indexOf(text.toUpperCase()) >= 0);

  /* syntax highlighting */
  sh_highlightDocument('js/', '.js'); // eslint-disable-line no-undef

  siteData = await getJSONFiles();

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
  /* ************************************************************************************************************

          All pre-requisite things have loaded

     ********************************************************************************************************* */

  // Show statistics from siteData arrays
  log(
    `Loaded: ${
    Object.keys(siteData)
      .filter((k) => k !== 'bigipTable' && siteData[k] && siteData[k].length !== undefined)
      .map((k) => `${k}: ${siteData[k].length}`)
      .join(', ')}`,
    'INFO'
  );

  /* ************************************************************************************************************

          Load preferences

     ********************************************************************************************************* */

  loadPreferences();

  /* ***********************************************************************************************************

          Test the status VIPs

  *********************************************************************************************************** */
  initializeStatusVIPs();

  /* highlight selected menu option */

  populateSearchParameters(false);
  const currentSection = $('div#mainholder').attr('data-activesection');

  if (currentSection === undefined) {
    showVirtualServers(true);
  }

  /* ************************************************************************************************************
          This section adds the update check button div and initiates the update checks
   *********************************************************************************************************** */

  NavButtonDiv(null, null, null); // eslint-disable-line new-cap
  // Check if there's a new update
  setInterval( () => {
    $.ajax('json/preferences.json', {
      type: 'HEAD',
      success: NavButtonDiv,
    });
  }, 60000);


  // Attach click events to the main menu buttons and poller div
  document.querySelector('div#virtualserversbutton')!.addEventListener('click', showVirtualServers);
  document.querySelector('div#poolsbutton')!.addEventListener('click', showPools)
  document.querySelector('div#irulesbutton')!.addEventListener('click', showiRules)
  document.querySelector('div#datagroupbutton')!.addEventListener('click', showDataGroups)
  document.querySelector('div#policiesbutton')!.addEventListener('click', showPolicies)
  document.querySelector('div#deviceoverviewbutton')!.addEventListener('click', showDeviceOverview)
  document.querySelector('div#certificatebutton')!.addEventListener('click', showCertificateDetails)
  document.querySelector('div#logsbutton')!.addEventListener('click', showLogs)
  document.querySelector('div#preferencesbutton')!.addEventListener('click', showPreferences)
  document.querySelector('div#helpbutton')!.addEventListener('click', showHelp)
  document.querySelector('div#realtimestatusdiv')!.addEventListener('click', pollCurrentView)

  // Attach module calls to window in order to call them from html rendered by js
  // These should be removed in favor of event listeners later. See Virtual Server name column
  // for an example
  window.showPoolDetails = showPoolDetails;
  window.togglePool = togglePool;
  window.togglePoolHighlight = togglePoolHighlight;
  window.showVirtualServerDetails = showVirtualServerDetails;
  window.showDataGroupDetails = showDataGroupDetails;
  window.showiRuleDetails = showiRuleDetails;
  window.showPolicyDetails = showPolicyDetails;
  window.siteData = siteData;

});

// update Navigation Buttons based on HEAD polling date (if available)
function NavButtonDiv(response: any, status: any, xhr: jqXHR<any>) {
  let timesincerefresh = 0;
  if (siteData.preferences.currentReportDate === undefined && xhr && xhr.getResponseHeader('Last-Modified') != null) {
    // If we have not yet stored the currentReportDate, store it and return
    siteData.preferences.currentReportDate = new Date(
      xhr.getResponseHeader('Last-Modified')
    ).getTime();
  } else if (xhr && xhr.getResponseHeader('Last-Modified') != null) {
    const latestreport = new Date(
      xhr.getResponseHeader('Last-Modified')
    ).getTime();
    // If there's been a new report, how long ago (in minutes)
    timesincerefresh = Math.round(
      (latestreport - siteData.preferences.currentReportDate) / 60000
    );
  }

  let navbutton = '<ul>';
  if (timesincerefresh > 60) {
    navbutton +=
      '<li><button onclick="document.location.reload()" class="navbutton urgent">Update available</a></li>';
  } else if (timesincerefresh > 0) {
    navbutton +=
      '<li><button onclick="document.location.reload()" class="navbutton important">Update available</a></li>';
  } else {
    navbutton +=
      '<li><button onclick="document.location.reload()" class="navbutton">Refresh</button></li>';
  }
  Object.keys(siteData.preferences.NavLinks).forEach((key) => {
    navbutton += `<li><button onclick="window.location.href='${siteData.preferences.NavLinks[key]}'"
                    class="navbutton">${key}</button></li>`;
  });
  navbutton += '</ul>';
  $('div#navbuttondiv').html(navbutton);
}

function initializeStatusVIPs() {

  // Also initialize the ajaxQueue
  siteData.memberStates = {
    ajaxFailures: [],
    ajaxQueue: [],
    ajaxRecent: []
  }
  siteData.memberStates.ajaxQueue = [];
  siteData.memberStates.ajaxRecent = [];
  siteData.memberStates.ajaxFailures = [];

  const { loadbalancers } = siteData;

  // Check if there is any functioning pool status vips
  const hasConfiguredStatusVIP = loadbalancers.some((e) => /[a-b0-9]+/.test(e.statusvip.url));

  if (hasConfiguredStatusVIP) {
    loadbalancers.forEach(loadbalancer => {
      // Increase the not configured span for loadbalancers that is eligible for polling but has none configured
      if (
        loadbalancer.statusvip.url === '' &&
        (loadbalancer.active || loadbalancer.isonlydevice)
      ) {
        log(
          `Loadbalancer ${loadbalancer.name} does not have any status VIP configured`,
          'INFO'
        );
        const realTimeNotConfigured = $('span#realtimenotconfigured');
        realTimeNotConfigured.text(parseInt(realTimeNotConfigured.text(), 10) + 1);
        loadbalancer.statusvip.working = false;
        loadbalancer.statusvip.reason = 'None configured';
      } else if (
        loadbalancer.statusvip.url !== '' &&
        (loadbalancer.active || loadbalancer.isonlydevice)
      ) {
        testStatusVIP(loadbalancer);
      }
    });
  } else {
    log('No status VIPs has been configured', 'INFO');
    $('td#pollingstatecell').html('Disabled');
    $('div.beforedocumentready').fadeOut(1500);
  }
}

function poolMemberStatus(member: IMember, type: string) {
  const memberStatus = `${member.enabled}:${member.availability}`;

  if (type === 'export') {
    return '';
  }

  if (type === 'filter') {
    return memberStatus;
  }

  let returnValue = '';

  if (memberStatus === 'enabled:available') {
    returnValue = `<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="Available (Enabled)"
                title="${memberStatus} - Member is able to pass traffic"/></span>`;
  } else if (memberStatus === 'enabled:unknown') {
    returnValue = `<span class="statusicon"><img src="images/blue-square-questionmark.png" alt="Unknown (Enabled)"
                title="${memberStatus} - Member status unknown"/></span>`;
  } else if (memberStatus === 'enabled:offline') {
    returnValue = `<span class="statusicon"><img src="images/red-circle-cross.png" alt="Offline (Enabled)"
                title="${memberStatus} - Member is unable to pass traffic"/></span>`;
  } else if (memberStatus === 'enabled:unavailable') {
    returnValue = `<span class="statusicon">
                     <img src="images/red-diamond-exclamationmark.png" alt="Unavailable (Enabled)"
                        title="${memberStatus} - Member connection limit reached"/></span>`;
  } else if (memberStatus === 'disabled:available') {
    returnValue = `<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Available (Disabled)"
                title="${memberStatus} - Member is available, but disabled"/></span>`;
  } else if (
    memberStatus === 'disabled:offline' ||
    memberStatus === 'disabled-by-parent:available' ||
    memberStatus === 'disabled-by-parent:offline'
  ) {
    returnValue = `<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Unknown (Disabled)"
                title="${memberStatus} - Member is disabled"/></span>`;
  }
  return returnValue;
}

function poolStatus(pool: IPool, type: string) {
  if (!pool || type === 'export') {
    return '';
  }
  const { enabled, availability, status } = pool;
  const pStatus = `${enabled}:${availability}`;

  if (type === 'display' || type === 'print') {
    if (pStatus === 'enabled:available') {
      return (
        `<span class="statusicon">
            <img src="images/green-circle-checkmark.png" alt="${pStatus}" title="${pStatus} - ${status}"/>
        </span>`
      );
    }

    if (pStatus === 'enabled:unknown') {
      return (
        `<span class="statusicon">
            <img src="images/blue-square-questionmark.png" alt="${pStatus}" title="${pStatus} - ${status}"/>
         </span>`
      );
    }

    if (pStatus === 'enabled:offline') {
      return (
        `<span class="statusicon">
            <img src="images/red-circle-cross.png" alt="${pStatus}" title="${pStatus} - ${status}"/>
        </span>`
      );
    }

    if (
      pStatus === 'disabled-by-parent:available' ||
      pStatus === 'disabled-by-parent:offline'
    ) {
      return (
        `<span class="statusicon">
            <img src="images/black-circle-checkmark.png" alt="${pStatus}" title="${pStatus} - ${status}"/>
         </span>`
      );
    }
    return pStatus;
  }

  return pStatus;
}

function virtualServerStatus(row: IVirtualServer, type: string) {
  const { enabled, availability } = row;
  if (!enabled || !availability) return '';
  const vsStatus = `${enabled}:${availability}`;

  if (type === 'filter') {
    return vsStatus;
  }

  if (vsStatus === 'enabled:available') {
    return `<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="Available (Enabled)"
                title="${vsStatus} - The virtual server is available"/></span>`;
  }

  if (vsStatus === 'enabled:unknown') {
    return (
      '<span class="statusicon"><img src="images/blue-square-questionmark.png" alt="Unknown (Enabled)"' +
      ` title="${vsStatus} - The children pool member(s) either don't have service checking enabled, or ` +
      'service check results are not available yet"/></span>'
    );
  }

  if (vsStatus === 'enabled:offline') {
    return (
      '<span class="statusicon"><img src="images/red-circle-cross.png" alt="Offline (Enabled)"' +
      ` title="${vsStatus} - The children pool member(s) are down"/></span>`
    );
  }

  if (vsStatus === 'disabled:available') {
    return (
      '<span class="statusicon"><img src="images/black-circle-cross.png" alt="Available (Disabled)"' +
      ` title="${vsStatus} - The virtual server is disabled"/></span>`
    );
  }

  if (vsStatus === 'disabled:unknown') {
    return (
      '<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Unknown (Disabled)"' +
      ` title="${vsStatus} - The children pool member(s) either don't have service checking enabled,` +
      ' or service check results are not available yet"/></span>'
    );
  }

  if (vsStatus === 'disabled:offline') {
    return (
      '<span class="statusicon"><img src="images/black-circle-cross.png" alt="Offline (Disabled)"' +
      ` title="${vsStatus} - The children pool member(s) are down"/></span>`
    );
  }

  if (vsStatus === 'disabled-by-parent:offline') {
    return (
      '<span class="statusicon">' +
      '<img src="images/black-circle-cross.png" alt="Offline (Disabled-by-parent)"' +
      ` title="${vsStatus} - The parent is disabled and the children pool member(s) are down"/></span>`
    );
  }

  if (vsStatus === 'disabled-by-parent:available') {
    return (
      '<span class="statusicon">' +
      '<img src="images/black-diamond-exclamationmark.png" alt="Available (Disabled-by-parent)"' +
      ` title="${vsStatus} - The children pool member(s) are available but the parent is disabled"/></span>`
    );
  }
  return vsStatus;
}

function createdPoolCell(cell: Node, cellData: any, rowData: any, rowIndex: number) {
  if (rowData.pools) {
    $(cell).addClass('PoolCell');
    $(cell).attr('id', `vs-${rowIndex}`);
  }
}

function renderPoolMember(loadbalancer: string, member: IMember, type: string) {

  const { name, ip, port } = member;

  let result = '';
  if (member !== null) {
    if (type === 'display' || type === 'print') {
      result += `<span data-member="${ip}:${port}">`;
    }
    result += poolMemberStatus(member, type);
    if (type === 'display' || type === 'print') {
      result += '</span>';
    } else {
      result += ' ';
    }
    const memberName = name.split('/')[2];
    if ((memberName !== `${ip}:${port}`) && (memberName !== `${ip}.${port}`)) {
      result += `(${ip})`;
    }
    result += memberName;
  }
  return result;
}

function renderPoolMemberCell(type: string, member: IMember, poolNum: number) {
  return `
        <td class="PoolMember" data-pool="${poolNum}">
            ${renderPoolMember('', member, type)}
        </td>
    `;
}

/**
 * Renders the pools associated with a virtual server
 * @param poolNames
 * @param type
 * @param virtualServer
 * @param meta
 */
function renderVirtualServerPoolCell(poolNames: string[],
                                     type: string,
                                     virtualServer: IVirtualServer,
                                     meta: DataTables.CellMetaSettings) {
  if (type === 'sort') {
    return poolNames ? poolNames.length: 0
  }
  if (!poolNames) {
    return 'N/A';
  }
  const { loadbalancer: vipLoadbalancer } = virtualServer
  let poolCell = '';
  if (type === 'filter' || type === 'export') {
    poolNames.forEach(poolName => {

      const pool = siteData.poolsMap.get(`${vipLoadbalancer}:${poolName}`);
      if(!pool) return

      const { loadbalancer: poolLoadbalancer, name, members } = pool;
      if (pool) {
        poolCell += `${renderPool(poolLoadbalancer, name, type)}: `;
        if (members !== null) {
          poolCell += renderPoolMember(
            poolLoadbalancer,
            members[0],
            type
          );
          members.forEach(m => {
            poolCell += `,${renderPoolMember(poolLoadbalancer, m, type)}`;
          })
        }
      }
    });
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
                          Show ${poolNames.length} associated pools
                      </div>
                      <div id="PoolCell-${tid}" class="pooltablediv" style="display: block;">`;
  }

  poolCell += '<table class="pooltable"><tbody>';
  poolNames.forEach(poolName => {
    const pool = siteData.poolsMap.get(`${vipLoadbalancer}:${poolName}`);
    // Report dumps pools before virtualhosts, so pool might not exist
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
      } else {
        poolCell += renderPoolMemberCell(type, pool.members[0], pool.poolNum || 0);
      }
      poolCell += '</tr>';

      if (pool.members !== null) {
        for (let m = 1; m < pool.members.length; m+= 1) {
          poolCell += `<tr class="${poolClass}">${renderPoolMemberCell(
            type,
            pool.members[m],
            pool.poolNum || 0
          )}</tr>`;
        }
      }
    }
  })
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
      } else {
        result = `<details data-loadbalancer="${row.loadbalancer}" data-name="${row.name}">
                            <summary>View ${data.length} ${plural}</summary>`;
      }
      result += members.join('<br>');
      if (data.length === 1) {
        result += '</div>';
      } else {
        result += '</details>';
      }
      result += '</div>';
    } else if (type === 'print') {
      result += members.join('<br>');
    } else {
      result += members;
    }
  } else {
    result = 'None';
  }
  return result;
}

function testStatusVIP(loadbalancer: ILoadbalancer) {
  const { name, statusvip } = loadbalancer;
  const { pools } = siteData;

  // Find a pool with members on this load balancer
  const pool = pools.find(p => p.loadbalancer === name && p.members)

  if (!pool) {
    statusvip.working = false;
    statusvip.reason = 'No pools with members found';
    log(
      `No pools with members to test the status vip with on loadbalancer ${name}, marking it as failed`,
      'ERROR'
    );
  } else {
    const testURL = statusvip.url + pool.name;

    increaseAjaxQueue(testURL);

    $.ajax({
      dataType: 'json',
      url: testURL,
      success () {
        const realtimeTestSuccessSpan = $('span#realtimetestsuccess');
        realtimeTestSuccessSpan.text(
          parseInt(realtimeTestSuccessSpan.text(), 10) + 1
        );
        log(
          `Statusvip test <a href="${testURL}">${testURL}</a>
                    was successful on loadbalancer: <b>${name}</b>`,
          'INFO'
        );
        statusvip.working = true;
        statusvip.reason = '';
        decreaseAjaxQueue(testURL);
      },
      timeout: 2000,
    })
      .fail((jqxhr) => {
        log(
          `Statusvip test <a href="${testURL}">${testURL}</a> failed on loadbalancer: <b>` +
          `${name}</b><br>Information about troubleshooting status VIPs is available` +
          ` <a href="https://loadbalancing.se/bigip-report/#One_or_more_status_endpoints_has_been_marked_as_failed">
                here
            </a>`,
          'ERROR'
        );
        const realtimeTestFailedSpan = $('span#realtimetestfailed');
        realtimeTestFailedSpan.text(
          parseInt(realtimeTestFailedSpan.text(), 10) + 1
        );
        loadbalancer.statusvip.working = false;
        loadbalancer.statusvip.reason = jqxhr.statusText;
        decreaseAjaxQueue(testURL);
      })
      .always(() => {
        if (siteData.memberStates.ajaxQueue.length === 0) {
          // Tests done, restore the view of the original URL
          populateSearchParameters(false);

          // Check if there is any functioning pool status vips
          const hasWorkingStatusVIP = siteData.loadbalancers.some((e) => e.statusvip.working);

          if (hasWorkingStatusVIP) {
            log('Status VIPs tested, starting the polling functions', 'INFO');

            pollCurrentView();

            setInterval(() => {
              if (siteData.memberStates.ajaxQueue.length === 0) {
                pollCurrentView();
              } else {
                resetClock();
                log(
                  `Did not finish the polling in time, consider increasing the polling interval,
                                or increase the max queue in the configuration file`,
                  'WARNING'
                );
              }
            }, siteData.preferences.PollingRefreshRate * 1000);
          } else {
            log(
              'No functioning status VIPs detected, scanning disabled<br>' +
              'More information about why this happens is available' +
              ` <a href="https://loadbalancing.se/bigip-report/#The_member_status_polling_says_it8217s_disabled">
                  here</a>`,
              'ERROR'
            );
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
  const visiblePools = $('table.pooltable tr td.poolname:visible')
  const poolTableDiv = $('table#poolTable details[open][data-name],table#poolTable div[data-name]');
  switch (currentSection) {
    case 'virtualservers':
      length = visiblePools.length;
      break;
    case 'pools':
      length = poolTableDiv.length;
      break;
    default: break;
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
      default: break;
    }
  }
}

export function renderLoadBalancer(loadbalancer: string, type: string) : string {
  let balancer;
  if (siteData.preferences.HideLoadBalancerFQDN) {
    [balancer] = loadbalancer.split('.');
  } else {
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
    result += `<a class="tooltip details-link" data-originalvirtualservername="${name}"`
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

function renderRule(loadbalancer: string, name: string, type: string) {
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

function renderPolicy(loadbalancer: string, name: string, type: string) {
  if (name === 'None') {
    return 'None';
  }
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

function renderPool(loadbalancer: string, name: string, type: string) {
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
  } else {
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

function renderCertificate(loadbalancer: string, name: string, type: string) {
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

function renderDataGroup(loadbalancer: string, name: string, type: string) {
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
  siteData.countDown += -1;
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
      length = $(
        'table#poolTable details[open][data-name],table#poolTable div[data-name]'
      ).length;
      break;
    default: break;
  }
  let pollingstate = '';
  if (length === 0 || length > siteData.preferences.PollingMaxPools) {
    pollingstate += 'Disabled, ';
  }
  pollingstate += `${length}/${siteData.preferences.PollingMaxPools} pools open, `;
  if (siteData.memberStates) {
    pollingstate +=
      `<span id="ajaxqueue">${siteData.memberStates.ajaxQueue.length}</span>/${siteData.preferences.PollingMaxQueue}
        queued, `;
  }
  pollingstate += `refresh in ${siteData.countDown} seconds.`;
  $('td#pollingstatecell').html(pollingstate);
}

function resetClock() {
  siteData.countDown = siteData.preferences.PollingRefreshRate + 1;
  window.clearInterval(siteData.clock);
  countdownClock();
  siteData.clock = window.setInterval(countdownClock, 1000);
}

function getPoolStatus(poolCell: HTMLElement) {
  if (
    siteData.memberStates.ajaxQueue.length >=
    siteData.preferences.PollingMaxQueue
  ) {
    setTimeout(() => {
      getPoolStatus(poolCell);
    }, 200);
  } else {
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
          url,
          success (data) {
            if (data.success) {
              decreaseAjaxQueue(url);

              Object.keys(data.memberstatuses).forEach(member => {

                const statusSpan = $(
                  `td.PoolMember[data-pool="${
                  pool.poolNum
                  }"] span[data-member="${
                  member
                  }"]`
                );

                setMemberState(statusSpan, data.memberstatuses[member]);

                // Update the pool json object
                const {members} = pool;

                members.forEach(poolMember => {
                  const ipport = `${poolMember.ip  }:${  poolMember.port}`;
                  if (ipport === member) {
                    poolMember.realtimestatus = data.memberstatuses[member];
                  }
                })
              })
            }
          },
          timeout: 2000,
        }).fail(() => {
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
  if (
    siteData.memberStates.ajaxQueue.length >=
    siteData.preferences.PollingMaxQueue
  ) {
    setTimeout(() => {
      getPoolStatusPools(poolCell);
    }, 200);
  } else {
    const loadbalancerName = $(poolCell).attr('data-loadbalancer');

    const loadbalancer = getLoadbalancer(loadbalancerName);

    if (loadbalancer && loadbalancer.statusvip.working === true) {
      const poolName = $(poolCell).attr('data-name');

      const pool = getPool(poolName, loadbalancerName);
      const url = loadbalancer.statusvip.url + pool.name;

      if (increaseAjaxQueue(url)) {
        $.ajax({
          dataType: 'json',
          url,
          success (data) {
            if (data.success) {
              decreaseAjaxQueue(url);

              Object.keys(data.memberstatuses).forEach(member => {
                const statusSpan = $(
                  `table#poolTable details[data-loadbalancer="${loadbalancerName}"][data-name="${poolName}"] ` +
                  `span[data-member="${member}"],` +
                  `table#poolTable div[data-loadbalancer="${loadbalancerName}"][data-name="${poolName}"] ` +
                  `span[data-member="${member}"]`
                );

                setMemberState(statusSpan, data.memberstatuses[member]);

                // Update the pool json object
                const {members} = pool;

                members.forEach(poolMember => {
                  const ipport = `${poolMember.ip  }:${  poolMember.port}`;
                  if (ipport === member) {
                    poolMember.realtimestatus = data.memberstatuses[member];
                  }
                })
              })
            }
          },
          timeout: 2000,
        }).fail(() => {
          // To be used later in the console
          // siteData.memberStates.ajaxFailures.push({ url: url, code: jqxhr.status, reason: jqxhr.statusText })
          decreaseAjaxQueue(url);
          return false;
        });
      }
    }
  }
}

function decreaseAjaxQueue(url: string) {
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

function increaseAjaxQueue(url: string) {
  if (
    siteData.memberStates.ajaxRecent.indexOf(url) === -1 &&
    siteData.memberStates.ajaxQueue.indexOf(url) === -1
  ) {
    siteData.memberStates.ajaxQueue.push(url);
    $('span#ajaxqueue').text(siteData.memberStates.ajaxQueue.length);
    return true;
  }
  return false;
}

function setMemberState(statusSpan, memberStatus) {
  const statusIcon = $(statusSpan).find('span.statusicon');

  let icon; let title; let status;

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
********************************************************************************************************************* */

/** ********************************************************************************************************************
    Highlight all matches
********************************************************************************************************************* */

function highlightAll(table) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = $(table.table().body()) as any;

  body.unhighlight();
  const search = [table.search()];

  // eslint-disable-next-line array-callback-return
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
********************************************************************************************************************* */

function isRegExp(regExp: string) {
  try {
    // eslint-disable-next-line no-new
    new RegExp(regExp);
  } catch (e) {
    return false
  }
  return true
}

/** ********************************************************************************************************************
    Gets the query strings and populates the table
********************************************************************************************************************* */

function populateSearchParameters(updateHash: boolean) {

  const vars: {[key:string]: string} = {};
  let hash;

  if (window.location.href.indexOf('#') >= 0) {
    // Split the hash query string and create a dictionary with the parameters
    const hashes = window.location.href
      .slice(window.location.href.indexOf('#') + 1)
      .split('&');

    for (let i = 0; i < hashes.length; i+=1) {
      hash = hashes[i].split('=');
      // eslint-disable-next-line prefer-destructuring
      vars[hash[0]] = hash[1];
    }

    let table:DataTables.Api = null;

    if (vars.m) {

      // mainsection in m
      const activeSection = vars.m;

      switch (activeSection) {
        case 'v':
          showVirtualServers(updateHash);
          table = siteData.bigipTable;
          break;
        case 'p':
          showPools(updateHash);
          table = siteData.poolTable;
          break;
        case 'i':
          showiRules(updateHash);
          table = siteData.iRuleTable;
          break;
        case 'pl':
          showPolicies(updateHash);
          table = siteData.PolicyTable;
          break;
        case 'd':
          showDeviceOverview(updateHash);
          table = siteData.dataGroupTable;
          break;
        case 'c':
          showCertificateDetails(updateHash);
          table = siteData.certificateTable;
          break;
        case 'dg':
          showDataGroups(updateHash);
          table = siteData.dataGroupTable;
          break;
        case 'l':
          showLogs(updateHash);
          table = siteData.logTable;
          break;
        case 's':
          // preferences = settings = s
          showPreferences(updateHash);
          break;
        case 'h':
          showHelp(updateHash);
          break;
        default:
      }
    }

    // Populate the search and column filters
    // Reset the search before applying the global search and column filters
    // siteData.bigipTable && siteData.bigipTable.search('');

    // eslint-disable-next-line no-restricted-syntax
    if (table) {
      Object.keys(vars).forEach(key => {
        // If it's provided, populate and search with the global string
        if (key === 'q') {
          table.search(
              decodeURIComponent(vars[key]),
              localStorage.getItem('regexSearch') === 'true',
              false
          );
        } else if (key.match(/^[0-9]+$/)) {
          // Validate that the key is a column filter and populate it
          table.column(key).search(
            decodeURIComponent(vars[key]),
            localStorage.getItem('regexSearch') === 'true',
            false
          );
          table.column(key).header().querySelector('input').value = decodeURIComponent(vars[key]);
        }
      });
      table.draw();
    }

    if (vars.pool) {
      const [poolName, loadBalancer] = vars.pool.split('@');
      showPoolDetails(poolName, loadBalancer);
    }

    if (vars.virtualserver) {
      const [virtualServerName, loadBalancer] = vars.virtualserver.split('@');
      showVirtualServerDetails(virtualServerName, loadBalancer);
    }

    if (vars.datagroup) {
      const [dataGroupName, loadBalancer] = vars.datagroup.split('@');
      showDataGroupDetails(dataGroupName, loadBalancer);
    }

    if (vars.irule) {
      const [iruleName, loadBalancer] = vars.irule.split('@');
      showiRuleDetails(iruleName, loadBalancer);
    }

    if (vars.policy) {
      const [policyName, loadBalancer] = vars.policy.split('@');
      showPolicyDetails(policyName, loadBalancer);
    }
  }

}

/** ***********************************************************************************************************

    setup main Virtual Servers table

************************************************************************************************************ */

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

    ************************************************************************************************************* */

  siteData.bigipTable = $('table#allbigips').DataTable({
    autoWidth: false,
    deferRender: true,
    data: siteData.virtualservers,
    createdRow (row) {
      $(row).addClass('virtualserverrow');
    },
    columns: [
      {
        data: 'loadbalancer',
        className: 'loadbalancerCell',
        render (name: string, type: string) {
          return renderLoadBalancer(name, type);
        },
      },
      {
        data: 'name',
        className: 'virtualServerCell',
        render (name: string, type: string, row: IVirtualServer) {
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
        render (data: undefined, type: string, row: IVirtualServer) {
          let result = `${row.ip}:${row.port}`
          const ipNoRD = row.ip.replace(/%.*/,'');
          if (siteData.NATdict[ipNoRD]) {
            result += `<br>Public IP:${siteData.NATdict[ipNoRD]}`;
          }
          return result;
        },
      },
      {
        className: 'centeredCell',
        render (data: undefined, type: string, row: IVirtualServer) {
          if (!row.sourcexlatetype) {
            return 'Unknown';
          }
            switch (row.sourcexlatetype) {
              case 'snat':
                return `SNAT:${  row.sourcexlatepool}`;
              default:
                return row.sourcexlatetype;
            }

        },
        visible: false,
      },
      {
        className: 'centeredCell',
        render (data, type, row: IVirtualServer) {
          const { asmPolicies, loadbalancer } = row;
          if (!asmPolicies) {
            return 'N/A';
          }
          const result: string[] = [];
          asmPolicies.forEach((name) => {
            const policy = siteData.asmPolicies.find(p => p.loadbalancer === loadbalancer && p.name === name)
            if (policy) result.push(`${name} ${policy.enforcementMode === 'blocking' ? ' (B)': ' (T)'}`);
          })
          return result;
        },
        visible: false,
      },
      {
        className: 'centeredCell',
        render (data: undefined, type: string, row: IVirtualServer) {
          let result = '';
          if ((row.profiletype === 'Fast L4') || (row.profiletype === 'UDP')) {
            result += row.profiletype;
          } else {
            result += row.sslprofileclient.includes('None') ? 'No' : 'Yes';
            result += '/';
            result += row.sslprofileserver.includes('None') ? 'No' : 'Yes';
          }
          if (type === 'filter') {
            if (
              row &&
              row.sslprofileclient &&
              !row.sslprofileclient.includes('None')
            ) {
              result += ` ${  row.sslprofileclient}`;
            }
            if (
              row &&
              row.sslprofileserver &&
              !row.sslprofileserver.includes('None')
            ) {
              result += ` ${  row.sslprofileserver}`;
            }
            if (
              row &&
              row.otherprofiles
            ) {
              result += ` ${  row.otherprofiles}`;
            }
            if (
              row &&
              row.protocol
            ) {
              result += ` protocol=${  row.protocol}`;
            }
          }
          return result;
        },
        visible: false,
      },
      {
        className: 'centeredCell',
        render (data: undefined, type: string, row: IVirtualServer) {
          if (row.compressionprofile === 'None') {
            return 'No';
          }
            return 'Yes';

        },
        visible: false,
      },
      {
        className: 'centeredCell',
        render (data: undefined, type: string, row: IVirtualServer) {
          return row.persistence.includes('None') ? 'No' : 'Yes';
        },
        visible: false,
      },
      {
        data: 'pools',
        type: 'html-num',
        createdCell: createdPoolCell,
        render: renderVirtualServerPoolCell,
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
          action () {
            $('table#allbigips thead th input').val('');
            siteData.bigipTable.search('').columns().search('').draw();
            updateLocationHash();
          },
        },
        {
          text: 'Expand',
          titleAttr: 'Temporarily expand all',
          className: 'tableHeaderColumnButton toggleExpansion',
          action (e: any, dt: any, node: any) {
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
                expandPoolMatches(
                  $(siteData.bigipTable.table(null).body()),
                  siteData.bigipTable.search()
                );
                node['0'].innerHTML = '<span>Expand</span>';
                node['0'].title = 'Temporarily expand all';
                break;
              default:
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
          className: 'tableHeaderColumnButton exportFunctions',
          customize: customizeCSV,
          exportOptions: {
            columns: ':visible',
            stripHtml: false,
            orthogonal: 'export',
          },
          extend: 'csvHtml5',
          filename: 'BigIPReport-virtualservers',
          titleAttr: 'Download current filtered results in CSV format',
        },
        {
          className: 'tableHeaderColumnButton exportFunctions',
          customize: customizeCSV,
          exportOptions: {
            modifier: { search:'none' },
            orthogonal: 'export',
            search: 'none',
            stripHtml: false,
          },
          extend: 'csvHtml5',
          filename: 'BigIPReport-all-virtualservers',
          text: 'All CSV',
          titleAttr: 'Download all results in CSV format',
        },
      ],
    },
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, 'All'],
    ],
    search: { regex: localStorage.getItem('regexSearch') === 'true' },
    stateSave: true,
  } as PatchedSettings)

  // Apply the search
  // eslint-disable-next-line array-callback-return
  siteData.bigipTable.columns().every(function () {
    // display cached column filter
    ($('input', this.header())[0] as HTMLInputElement).value = this.search();
    const that = this;
    $('input', this.header()).on('keyup change input search', (e) => {
      const input = e.target as HTMLInputElement;
      if (that.search() !== input.value) {
        if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
          that
            .search(
              input.value,
              localStorage.getItem('regexSearch') === 'true',
              false
            )
            .draw();
            updateLocationHash();
        }
      }
    });
  });

  $('div#allbigips_filter.dataTables_filter input').on(
    'keyup input',
    () => {
      updateLocationHash();
    }
  );

  /** ******************************************************************************************************************
        Add custom data tables functions
  ******************************************************************************************************************* */

  // Prevents sorting the columns when clicking on the sorting headers
  $('table#allbigips thead th input').on('click', (e) => {
    e.stopPropagation();
  });


  // highlight matches
  siteData.bigipTable.on('draw', () => {
    const body = $(siteData.bigipTable.table(null).body());

    // reset toggleExpansion button
    const button = $(
      'div#allbigips_wrapper div.dt-buttons button.toggleExpansion'
    );
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

    ************************************************************************************************************* */

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

  siteData.iRuleTable = $('table#iRuleTable').DataTable({ // eslint-disable-line new-cap
    autoWidth: false,
    deferRender: true,
    data: siteData.irules,
    columns: [
      {
        data: 'loadbalancer',
        className: 'loadbalancerCell',
        render (data: string, type: string) {
          return renderLoadBalancer(data, type);
        },
      },
      {
        data: 'name',
        className: 'iRuleCell',
        render (data, type, row: IIrule) {
          return renderRule(row.loadbalancer, data, type);
        },
      },
      {
        data: 'pools',
        type: 'html-num',
        className: 'relative',
        render (data: string[], type: string, row: IIrule, meta) {
          return renderList(data, type, row, meta, renderPool, 'pools');
        },
      },
      {
        data: 'datagroups',
        type: 'html-num',
        render (data: string[], type: string, row: IIrule, meta) {
          return renderList(
            data,
            type,
            row,
            meta,
            renderDataGroup,
            'datagroups'
          );
        },
      },
      {
        data: 'virtualservers',
        type: 'html-num',
        render (data: string[], type: string, row: IIrule, meta) {
          return renderList(
            data,
            type,
            row,
            meta,
            renderVirtualServer,
            'virtualservers'
          );
        },
      },
      {
        data: 'definition',
        render (data: string) {
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
          filename: 'BigIPReport-irules',
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
  } as PatchedSettings);

  // Prevents sorting the columns when clicking on the sorting headers
  $('table#iRuleTable thead th input').on('click', (e) => {
    e.stopPropagation();
  });

  $('div#iRuleTable_wrapper input').on(
    'keyup input',
    () => {
      updateLocationHash();
    }
  );

  // Apply the search
  // eslint-disable-next-line array-callback-return
  siteData.iRuleTable.columns().every(function () {
    // display cached column filter
    ($('input', this.header())[0] as HTMLInputElement).value = this.search();
    const that = this;
    $('input', this.header()).on('keyup change input search', (e) => {
      const input = e.target as HTMLInputElement;
      if (that.search() !== input.value) {
        if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
          that
            .search(
              input.value,
              localStorage.getItem('regexSearch') === 'true',
              false
            )
            .draw();
        }
      }
    });
  });

  // highlight matches
  siteData.iRuleTable.on('draw', () => {
    // reset toggleExpansion button
    const button = $(
      'div#iRuleTable_wrapper div.dt-buttons button.toggleExpansion'
    );
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
        render (data, type, row) {
          return renderLoadBalancer(data, type);
        },
      },
      {
        data: 'name',
        className: 'PolicyCell',
        render (data, type, row) {
          return renderPolicy(row.loadbalancer, data, type);
        },
      },
      {
        data: 'virtualservers',
        type: 'html-num',
        render (data, type, row, meta) {
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
          filename: 'BigIPReport-policies',
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
  $('table#PolicyTable thead th input').on('click', (e) => {
    e.stopPropagation();
  });
  $('div#PolicyTable_wrapper input').on(
    'keyup input',
    () => {
      updateLocationHash();
    }
  );
  // Apply the search
  // eslint-disable-next-line array-callback-return
  siteData.PolicyTable.columns().every(function () {
    // display cached column filter
    ($('input', this.header())[0] as HTMLInputElement).value = this.search();
    const that = this;
    $('input', this.header()).on('keyup change input search', (e) => {
      const input = e.target as HTMLInputElement;
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
  siteData.PolicyTable.on('draw', () => {
    // reset toggleExpansion button
    const button = $('div#PolicyTable_wrapper div.dt-buttons button.toggleExpansion');
    button[0].innerHTML = '<span>Expand<span>'
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

  siteData.poolTable = $('table#poolTable').DataTable({ // eslint-disable-line new-cap
    autoWidth: false,
    deferRender: true,
    data: siteData.pools,
    columns: [
      {
        data: 'loadbalancer',
        className: 'loadbalancerCell',
        render (data: string, type: string) {
          return renderLoadBalancer(data, type);
        },
      },
      {
        data: 'name',
        render (data: string, type: string, row: IPool) {
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
        render (data: string[]) {
          return data ? data.join(' '): 'None';
        },
        visible: false,
      },
      {
        data: 'members',
        type: 'html-num',
        render (data: IMember[], type: string, row: IPool, meta) {
          return renderList(
            data,
            type,
            row,
            meta,
            renderPoolMember,
            'pool members'
          );
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
          filename: 'BigIPReport-pools',
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
  } as PatchedSettings);

  // Prevents sorting the columns when clicking on the sorting headers
  $('table#poolTable thead th input').on('click', (e) => {
    e.stopPropagation();
  });

  // Apply the search
  // eslint-disable-next-line array-callback-return
  siteData.poolTable.columns().every(function () {
    // display cached column filter
    ($('input', this.header())[0] as HTMLInputElement).value = this.search();
    const that = this;
    $('input', this.header()).on('keyup change input search', (e) => {
      const input = e.target as HTMLInputElement;
      if (that.search() !== input.value) {
        if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
          that
            .search(
              input.value,
              localStorage.getItem('regexSearch') === 'true',
              false
            )
            .draw();
            updateLocationHash();
        }
      }
    });
  });

  $('div#poolTable_filter.dataTables_filter input').on(
    'keyup input',
    () => {
      updateLocationHash();
    }
  );

  // highlight matches
  siteData.poolTable.on('draw', () => {
    // reset toggleExpansion button
    const button = $(
      'div#poolTable_wrapper div.dt-buttons button.toggleExpansion'
    );
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

  siteData.dataGroupTable = $('table#dataGroupTable').DataTable({ // eslint-disable-line new-cap
    autoWidth: false,
    deferRender: true,
    data: siteData.datagroups,
    columns: [
      {
        data: 'loadbalancer',
        className: 'loadbalancerCell',
        render (data: string, type: string) {
          return renderLoadBalancer(data, type);
        },
      },
      {
        data: 'name',
        className: 'iRuleCell',
        render (data: string, type: string, row: IDataGroup) {
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
        render (data: string[], type: string, row: IDataGroup, meta) {
          return renderList(data, type, row, meta, renderPool, 'pools');
        },
      },
      {
        data: 'data',
        render (data: IDataGroupData) {
          return data ? Object.keys(data).length: 0;
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
          filename: 'BigIPReport-datagroups',
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
  } as PatchedSettings);

  // Prevents sorting the columns when clicking on the sorting headers
  $('table#dataGroupTable thead th input').on('click', (e) => {
    e.stopPropagation();
  });

  $('div#dataGroupTable_wrapper input').on(
    'keyup input',
    () => {
      updateLocationHash();
    }
  );

  // Apply the search
  // eslint-disable-next-line array-callback-return
  siteData.dataGroupTable.columns().every(function () {
    // display cached column filter
    ($('input', this.header())[0] as HTMLInputElement).value = this.search();
    const that = this;
    $('input', this.header()).on('keyup change input search', (e) => {
      const input = e.target as HTMLInputElement;
      if (that.search() !== input.value) {
        if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
          that
            .search(
              input.value,
              localStorage.getItem('regexSearch') === 'true',
              false
            )
            .draw();
        }
      }
    });
  });

  // highlight matches
  siteData.dataGroupTable.on('draw', () => {
    // reset toggleExpansion button
    const button = $(
      'div#dataGroupTable_wrapper div.dt-buttons button.toggleExpansion'
    );
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

  siteData.certificateTable = $(
    'div#certificatedetails table#certificateTable'
  ).DataTable({ // eslint-disable-line new-cap
    autoWidth: false,
    deferRender: true,
    data: siteData.certificates,
    columns: [
      {
        data: 'loadbalancer',
        className: 'loadbalancerCell',
        render (data, type) {
          return renderLoadBalancer(data, type);
        },
      },
      {
        data: 'fileName',
        render (data, type, row) {
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
        render (data) {
          let result = '';
          if (data) {
            result += `<img class="flagicon" alt="${data.toLowerCase()}"
                        src="images/flags/${data.toLowerCase()}.png"/>`;
          }
          return `${result  } ${  data}`;
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
        render (data: number) {
          const certificateDate = new Date(0);
          certificateDate.setUTCSeconds(data);
          return certificateDate
            .toISOString()
            .replace('T', ' ')
            .replace(/\.[0-9]{3}Z/, '');
        },
      },
    ],
    createdRow (row, data: ICertificate) {
      // Get the days left
      const now = new Date();
      const certificateDate = new Date(0);
      certificateDate.setUTCSeconds(data.expirationDate);
      const daysLeft = dateDiffInDays(now, certificateDate);

      let rowClass;
      if (daysLeft < 14) {
        rowClass = 'certificateExpiringIn14';
      } else if (daysLeft < 30) {
        rowClass = 'certificateExpiringIn30';
      } else if (daysLeft < 60) {
        rowClass = 'certificateExpiringIn60';
      } else {
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
          filename: 'BigIPReport-certificates',
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
  } as PatchedSettings);

  // Prevents sorting the columns when clicking on the sorting headers
  $('table#certifcateTable thead th input').on('click', (e) => {
    e.stopPropagation();
  });

  $('div#certificateTable_wrapper input').on(
    'keyup input',
    () => {
      updateLocationHash();
    }
  );

  // Apply the search
  // eslint-disable-next-line array-callback-return
  siteData.certificateTable.columns().every(function () {
    // display cached column filter
    ($('input', this.header())[0] as HTMLInputElement).value = this.search();
    const that = this;
    $('input', this.header()).on('keyup change input search', (e) => {
      const input = e.target as HTMLInputElement;
      if (that.search() !== input.value) {
        if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
          that
            .search(
              input.value,
              localStorage.getItem('regexSearch') === 'true',
              false
            )
            .draw();
        }
      }
    });
  });

  // Highlight matches
  siteData.certificateTable.on('draw', () => {
    toggleAdcLinks();
    highlightAll(siteData.certificateTable);
  });

  siteData.certificateTable.draw();
}

function setupLogTable() {
  if (siteData.logTable) {
    return;
  }

  const content = `
    <table id="logtable" class="bigiptable display">
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

  siteData.logTable = $('div#logs table#logtable').DataTable({ // eslint-disable-line new-cap
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
          filename: 'BigIPReport-logs',
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
    createdRow (row, data: ILoggedError) {
      if (data && data.severity) {
        $('td', row)
          .eq(1)
          .addClass(`logseverity${  data.severity.toLowerCase()}`);
      }
    },
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, 'All'],
    ],
    search: { regex: localStorage.getItem('regexSearch') === 'true' },
    stateSave: true,
  } as PatchedSettings);

  // Prevents sorting the columns when clicking on the sorting headers
  $('table#logtable thead th input').on('click', (e) => {
    e.stopPropagation();
  });
  $('div#logtable_wrapper input').on(
    'keyup input',
    () => {
      updateLocationHash();
    }
  );

  // Apply the search
  // eslint-disable-next-line array-callback-return
  siteData.logTable.columns().every(function () {
    // display cached column filter
    ($('input', this.header())[0] as HTMLInputElement).value = this.search();
    const that = this;
    $('input', this.header()).on('keyup change input search', (e) => {
      const input = e.target as HTMLInputElement;
      if (that.search() !== input.value) {
        if ((localStorage.getItem('regexSearch') !== 'true') || isRegExp(input.value)) {
          that
            .search(
              input.value,
              localStorage.getItem('regexSearch') === 'true',
              false
            )
            .draw();
        }
      }
    });
  });

  // Highlight matches
  siteData.logTable.on('draw', () => {
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
  $(`div#${section}`).fadeIn(10, updateLocationHash);
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
  autoExpandPool.on('click', (e) => {
    const checkBox = e.target as HTMLInputElement
    localStorage.setItem('autoExpandPools', checkBox.checked.toString());
    if (siteData.bigipTable) {
      siteData.bigipTable.draw();
    }
  });

  // Event handler for showing ADC edit links
  adcLinks.on('click', (e) => {
    const checkBox = e.target as HTMLInputElement;
    localStorage.setItem('showAdcLinks', checkBox.checked.toString());
    toggleAdcLinks();
  });

  // Event handler for regular expression searches
  regexSearch.on('click', (e) => {
    const checkBox = e.target as HTMLInputElement;
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

  const {deviceGroups} = siteData;
  const {loadbalancers} = siteData;

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

  deviceGroups.forEach(deviceGroup => {

    // Get an icon from a functioning device, if any
    let deviceIcon = 'images/deviceicons/unknowndevice.png';

    deviceGroup.ips.forEach(ip => {
      const loadbalancer =
        loadbalancers.find((o) => o.ip === ip);

      if (loadbalancer) {
        const model = loadbalancer.model && loadbalancer.model.toUpperCase();
        deviceIcon = model in siteData.knownDevices ? siteData.knownDevices[model].icon :
            'images/deviceicons/unknowndevice.png';
      }
    })

    deviceGroup.ips.forEach((deviceIP, deviceIndex) => {

      const loadbalancer =
        loadbalancers.find((o) => o.ip === deviceIP);

      // This load balancer has failed to index
      if(!loadbalancer) {
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
                  </td>` : '' }
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
        } else if (working) {
          pollingStatus = '<span class="devicepollingsuccess">Working</span>';
        } else {
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
      } else if (!loadbalancer.success) {
        html += '<tr class="failed-device" title="Failed to index, using cached data">';
      } else if (deviceStatus === 'green') {
        html += '<tr title="Secondary device is Active" class="out-of-sync-device">';
      } else {
        html += '<tr>';
      }

      let syncSpan = '<span style="color:#B26F6F;font-weight:bold;">No</span>';
      const { sync } = loadbalancer;

      if (sync === 'yellow') {
        syncSpan = '<span style="color:#ED833A;font-weight:bold;">Pending</span>';
      } else if (sync === 'green') {
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
  })

  html += `
                </tbody>
            </table>`;

  $('div#deviceoverview').html(html);
  showMainSection('deviceoverview');
}

function generateSupportCell(loadbalancer: ILoadbalancer) {

  const serial = loadbalancer.serial.split(/\s+/).find(s => /^(f5-|[A-Z]|chs)/.test(s));
  const supportInfo: ISupportState = serial in siteData.state.supportStates ? siteData.state.supportStates[serial] : {
    hasSupport: 'unknown',
    supportErrorMessage: 'Device has no serial number',
    lastChecked: 'unknown',
    serial: '',
  }

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

function showLogs(updatehash: any) {
  hideMainSection();
  setupLogTable();
  activateMenuButton('div#logsbutton');
  $('div#mainholder').attr('data-activesection', 'logs');

  updateLocationHash(updatehash);

  showMainSection('logs');
}

function showHelp(updatehash: any) {
  hideMainSection();
  activateMenuButton('div#helpbutton');
  $('div#mainholder').attr('data-activesection', 'help');
  updateLocationHash(updatehash);

  showMainSection('helpcontent');
}

function log(message: string, severity: string, datetime: string | undefined = undefined) {
  if (!datetime) {
    let now = new Date();
    const offset = now.getTimezoneOffset();
    now = new Date(now.getTime() - offset * 60000);
    const dateArr = now.toISOString().split('T');

    datetime = `${dateArr[0]  } ${  dateArr[1].replace(/\.[0-9]+Z$/, '')}`;
  }

  siteData.loggedErrors.push({
    datetime,
    severity,
    message,
  });

  if (siteData.logTable) {
    siteData.logTable.destroy();
    delete siteData.logTable;
    setupLogTable();
  }
}

function toggleAdcLinks() {
  if (localStorage.getItem('showAdcLinks') === 'false') {
    $('.adcLinkSpan').hide();
  } else {
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

export function updateLocationHash(updatehash: any = true) : void {
  const parameters = [];

  const activeSection = $('div#mainholder').attr('data-activesection');
  // m is mainsection
  const sections = {
    'virtualservers': 'v',
    'pools':'p',
    'irules':'i',
    'policies':'pl',
    'datagroups':'dg',
    'deviceoverview':'d',
    'certificatedetails':'c',
    'logs':'l',
    'preferences':'s',
    'help':'h'
  }
  parameters.push(`m=${sections[activeSection]}`);
  const tables = {
    'virtualservers': siteData.bigipTable,
    'pools':siteData.poolTable,
    'irules':siteData.iRuleTable,
    'policies':siteData.PolicyTable,
    'datagroups':siteData.dataGroupTable,
    'certificatedetails':siteData.certificateTable,
    'logs':siteData.logTable,
  }

  if (tables[activeSection]) {
    if (tables[activeSection].search()) {
      parameters.push(`q=${encodeURIComponent(tables[activeSection].search())}`);
    }
    tables[activeSection].columns().every(function () {
      if (this.search()) {
        parameters.push(`${this.index()}=${encodeURIComponent(this.search())}`);
      }
    });
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
********************************************************************************************************************* */

function expandPoolMatches(resultset: any, searchstring: string) {
  if (localStorage.autoExpandPools !== 'true' && searchstring !== '') {
    $(resultset)
      .children()
      .children()
      .filter('td:has(span.highlight)')
      .each(function () {
        if (
          this.classList.contains('PoolCell') ||
          this.classList.contains('relative')
        ) {
          togglePool(this.id);
        }
      });
  }
}

function expandMatches(resultset: any) {
  $(resultset).find('details').removeAttr('open');
  $(resultset).find('details:has(span.highlight)').attr('open', '');
}

function resetFilters(e: any, dt: any) {
  $(dt.header()).find('input').val('');
  dt.search('').columns().search('').draw();
  updateLocationHash();
}

function toggleExpandCollapseRestore(e: any, dt: any, node: any) {
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
    default:
  }
}

/** ********************************************************************************************************************
    Collapses all pool cells in the main table
********************************************************************************************************************* */

function hidePools(hide = (localStorage.autoExpandPools !== 'true')) {
  if (hide) {
    $('.pooltablediv').hide();
    $('.collapse').hide();
    $('.expand').show();
    $('.AssociatedPoolsInfo').show();
  } else {
    $('.AssociatedPoolsInfo').hide();
    $('.expand').hide();
    $('.collapse').show();
    $('.pooltablediv').show();
  }
}

/** ********************************************************************************************************************
    Expands/collapses a pool cell based on the tid (toggle id)
********************************************************************************************************************* */

function togglePool(tid) {
  // Store the current window selection
  const selection = window.getSelection();

  // If no text is selected, go ahead and expand or collapse the pool
  if (selection.type !== 'Range') {
    if ($(`#PoolCell-${  tid}`).is(':visible')) {
      $(`#AssociatedPoolsInfo-${  tid}`).show();
      $(`#expand-${  tid}`).show();
      $(`#collapse-${  tid}`).hide();
      $(`#PoolCell-${  tid}`).hide();
    } else {
      $(`#AssociatedPoolsInfo-${  tid}`).hide();
      $(`#expand-${  tid}`).hide();
      $(`#collapse-${  tid}`).show();
      $(`#PoolCell-${  tid}`).fadeIn(300);
    }
  }
}

/** ********************************************************************************************************************
    Set the max width of the pool cells in order to make the member column align
********************************************************************************************************************* */

function setPoolTableCellWidth() {
  let maxwidth = 0;
  const poolName = $('.poolname');

  poolName.each((i, obj) => {
    if (obj.offsetWidth > maxwidth) {
      maxwidth = obj.offsetWidth;
    }
  });

  poolName.each((i, obj) => {
    if (obj.offsetWidth < maxwidth) {
      obj.style.width = maxwidth.toString();
    }
  });

  maxwidth = 0;
  poolName.each((i, obj) => {
    if (obj.offsetWidth > maxwidth) {
      maxwidth = obj.offsetWidth;
    }
  });

  poolName.each((i, obj) => {
    if (obj.offsetWidth < maxwidth) {
      obj.style.width = maxwidth.toString();
    }
  });
}


/** ********************************************************************************************************************
 Handles the highlight of content when searching
 ******************************************************************************************************************** */

// es-lint does not seem to respect hoisting in this case
// eslint-disable-next-line no-unused-vars
function togglePoolHighlight(e) {
  if (e.style.backgroundColor === '') {
    $(`.${  e.className}`).css('background-color', '#BCD4EC');
  } else {
    $(`.${  e.className}`).css('background-color', '');
  }
}

/** ********************************************************************************************************************

    Functions related to showing the pool details lightbox

********************************************************************************************************************* */


/** ********************************************************************************************************************
    Shows the virtual server details light box
********************************************************************************************************************* */

function showVirtualServerDetails(virtualserver: string, loadbalancer: string) {
  let html;
  const {virtualservers} = siteData;

  // Find the matching pool from the JSON object
  const matchingVirtualServer = virtualservers.find(
    vip => vip.name === virtualserver && vip.loadbalancer === loadbalancer
  )

  // If a virtual server was found, populate the pool details table and display it on the page
  if (matchingVirtualServer) {

    const {
      name,
      currentconnections,
      cpuavg1min,
      cpuavg5min,
      cpuavg5sec,
      maximumconnections,
      sourcexlatetype,
      sourcexlatepool,
      trafficgroup,
      defaultpool,
      description,
      sslprofileclient,
      sslprofileserver,
      compressionprofile,
      profiletype,
      persistence,
      otherprofiles,
      policies,
      irules,
      ip,
      port,
    } = matchingVirtualServer;

    html = '<div class="virtualserverdetailsheader">';
    html +=
      `<span>Virtual Server: ${  name  }</span><br>`;
    html +=
      `<span>Load Balancer: ${
      renderLoadBalancer(loadbalancer, 'display')
      }</span>`;
    html += '</div>';

    const firstLayer = $('div#firstlayerdetailscontentdiv');
    firstLayer.attr('data-type', 'virtualserver');
    firstLayer.attr('data-objectname', name);
    firstLayer.attr('data-loadbalancer', loadbalancer);

    let xlate: string;
    switch (sourcexlatetype) {
      case 'snat':
        xlate = `SNAT:${  sourcexlatepool}`;
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

    if (!matchingVirtualServer.policies.some(p => p === 'None')) {
      table += `<table class="virtualserverdetailstable">
                <tr><th>Policy name</th></tr>
                ${policies.map(
                  p => `<tr><td>${renderPolicy(loadbalancer, p, 'display')}</td></tr>`
                )}`;
    }

    if (siteData.preferences.ShowiRules) {
      if (irules.length > 0) {
        // Add the assigned irules
        table += '<table class="virtualserverdetailstable">';

        if (siteData.preferences.ShowiRuleLinks) {
          table += '    <tr><th>iRule name</th><th>Data groups</th></tr>';
        } else {
          table += '    <tr><th>iRule name</th></tr>';
        }

        irules.forEach(iRuleName => {
          // If iRules linking has been set to true show iRule links
          // and parse data groups
          if (siteData.preferences.ShowiRuleLinks) {
            const iRule: IIrule = siteData.irules.find(
              i => i.name === iRuleName && i.loadbalancer === loadbalancer);

            if (!iRule || Object.keys(iRule).length === 0) {
              table +=
                `    <tr><td>${
                iRuleName
                }</td><td>N/A (empty rule)</td></tr>`;
            } else {
              const datagroupdata = [];
              if (iRule.datagroups && iRule.datagroups.length > 0) {
                iRule.datagroups.forEach((datagroup) => {
                  const dataGroupName = datagroup.split('/')[2];

                  if (siteData.preferences.ShowDataGroupLinks) {
                    datagroupdata.push(
                      renderDataGroup(loadbalancer, datagroup, 'display')
                    );
                  } else {
                    datagroupdata.push(dataGroupName);
                  }
                });
              } else {
                datagroupdata.push('N/A');
              }

              table += `    <tr><td>${renderRule(
                loadbalancer,
                iRule.name,
                'display'
              )}</td><td>${datagroupdata.join('<br>')}</td></tr>`;
            }
          } else {
            table += `        <tr><td>${iRuleName}</td></tr>`;
          }
        });

        table += '</table>';
      }
    }

    html += table;
  } else {
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
    Shows the irule details light box
********************************************************************************************************************* */

function showiRuleDetails(name: string, loadbalancer: string) {

  // Get the rule object from the json file
  const matchingirule: IIrule = siteData.irules.find(
    iRule => iRule.name === name && iRule.loadbalancer === loadbalancer);

  let html;

  // If an irule was found, prepare the data to show it
  if (matchingirule) {
    // Populate the header
    html = '<div class="iruledetailsheader">';
    html += `<span>iRule: ${  matchingirule.name  }</span><br>`;
    html +=
      `<span>Load Balancer: ${
      renderLoadBalancer(loadbalancer, 'display')
      }</span>`;
    html += '</div>';

    const secondLayerContent = $('div#secondlayerdetailscontentdiv');
    secondLayerContent.attr('data-type', 'irule');
    secondLayerContent.attr('data-objectname', matchingirule.name);
    secondLayerContent.attr('data-loadbalancer', matchingirule.loadbalancer);

    // Save the definition to a variable for some classic string mangling
    let {definition} = matchingirule;

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
          regexp = new RegExp(`((?<![\\w-])${  opt  }(?![\\w-]))`, 'gi');
        } catch (e) {
          regexp = new RegExp(`(${  opt  })\\b`, 'gi');
        }
        // Prepare the link
        const link = `<a href="Javascript:showDataGroupDetails('${dg}', '${loadbalancer}')">$1</a>`;
        // Do the actual replacement
        definition = definition.replace(regexp, link);
      });
      matchingirule.pools.forEach((pool: string) => {
        // rule might not include partition which causes the replace to fail
        const opt = pool.replace(/\/.*\//, '($&)?');
        let regexp;
        // prepare a regexp to replace all instances
        try {
          // negative look behind is part of ES2018
          // https://github.com/tc39/proposal-regexp-lookbehind
          regexp = new RegExp(`((?<![\\w-])${  opt  }(?![\\w-]))`, 'gi');
        } catch (e) {
          regexp = new RegExp(`(${  opt  })\\b`, 'gi');
        }
        // Prepare the link
        const link =
          `<a href="Javascript:showPoolDetails('${
          pool
          }', '${
          loadbalancer
          }')">$1</a>`;
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
                    <tr><td><pre class="sh_tcl">${
      definition
      }</pre></td></tr>`;

    if (
      matchingirule.virtualservers &&
      matchingirule.virtualservers.length > 0
    ) {
      html +=
        `<tr><td>Used by ${
        matchingirule.virtualservers.length
        } Virtual Servers:<br>${
        matchingirule.virtualservers
          .map((vs) => renderVirtualServer(loadbalancer, vs, 'display'))
          .join('<br>')
        }</td></tr>`;
    }

    html += `</tbody>
                </table>`;
  }

  // Add the close button to the footer
  $('a#closesecondlayerbutton').text('Close irule details');
  // Add the div content to the page
  $('#secondlayerdetailscontentdiv').html(html);
  /* redo syntax highlighting */
  sh_highlightDocument('js/', '.js'); // eslint-disable-line no-undef
  // Show the div
  $('#secondlayerdiv').fadeIn(updateLocationHash);
  toggleAdcLinks();
}

/** ********************************************************************************************************************
 Shows the policy details light box
 ******************************************************************************************************************** */
function showPolicyDetails(policy: string, loadbalancer: string) {
  // Get the policy object from the json file
  const matchingPolicy = siteData.policies.find(p => p.name === policy && p.loadbalancer === loadbalancer);
  let html;

  // If an policy was found, prepare the data to show it
  if (matchingPolicy) {
    // Populate the header
    html = `<div class="policydetailsheader">
               <span>Policy: ${matchingPolicy.name} </span>
               <br>
               <span>Load Balancer: ${renderLoadBalancer(loadbalancer, 'display')} </span>
            </div>`;
    const firstLayerContent = $('div#firstlayerdetailscontentdiv');
    firstLayerContent.attr('data-type', 'policy');
    firstLayerContent.attr('data-objectname', matchingPolicy.name);
    firstLayerContent.attr('data-loadbalancer', matchingPolicy.loadbalancer);
    // Save the definition to a variable for some classic string mangling
    let {definition} = matchingPolicy;
    // Replace those tags with to be sure that the content won't be interpreted as HTML by the browser
    definition = definition.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Prepare the div content
    html += `<table class="bigiptable display">
               <thead>
                  <tr><th>Policy definition</th></tr> </thead>
               <tbody>
                 <tr><td><pre class="sh_tcl"> ${definition} </pre></td></tr>`;
    if (matchingPolicy.virtualservers &&
      matchingPolicy.virtualservers.length > 0) {
      html += `<tr><td>Used by ${matchingPolicy.virtualservers.length} Virtual Servers:<br>
                  ${matchingPolicy.virtualservers.map(vs => renderVirtualServer(loadbalancer, vs, 'display'))
        .join('<br>')} </td></tr>`;
    }
    html += '</tbody> </table>';
  }
  // Add the close button to the footer
  $('a#closefirstlayerbutton').text('Close policy details');
  // Add the div content to the page
  $('#firstlayerdetailscontentdiv').html(html);
  /* redo syntax highlighting */
  sh_highlightDocument('js/', '.js'); // eslint-disable-line no-undef
  // Show the div
  $('#firstlayerdiv').fadeIn(updateLocationHash);
  toggleAdcLinks();
}

/** ********************************************************************************************************************
    Displays a data group in a lightbox
********************************************************************************************************************* */

function showDataGroupDetails(datagroup, loadbalancer) {
  // Get a matching data group from the json data
  const matchingDatagroup = siteData.datagroups.find(dg => dg.name === datagroup && dg.loadbalancer === loadbalancer);

  if (siteData.datagroupdetailsTable) {
    siteData.datagroupdetailsTable.destroy();
  }

  // If a pool was found, populate the pool details table and display it on the page
  if (matchingDatagroup) {
    const secondLayerContent = $('div#secondlayerdetailscontentdiv');
    secondLayerContent.attr('data-type', 'datagroup');
    secondLayerContent.attr('data-objectname', matchingDatagroup.name);
    secondLayerContent.attr(
      'data-loadbalancer',
      matchingDatagroup.loadbalancer
    );

    let html = '<div class="datagroupdetailsheader">';
    html += `<span>Data group: ${  matchingDatagroup.name  }</span><br>`;
    html +=
      `<span>Load Balancer: ${
      renderLoadBalancer(loadbalancer, 'display')
      }</span><br>`;
    html += `<span class="dgtype">Type: ${  matchingDatagroup.type  }</span>`;
    html += '</div>';

    html += `<table id="datagroupdetailsTable" class="datagrouptable display">
                    <thead>
                        <tr>
                            <th class="keyheader">Key</th>
                            <th class="valueheader">Value</th>
                        </tr>
                    </thead>
                    <tbody>`;

    if (Object.keys(matchingDatagroup).length === 0) {
      html += '<tr class="emptydg"><td colspan="2">Empty data group</td></tr>';
    } else {
      siteData.datagroupdetailsTableData = $.map(
        matchingDatagroup.data,
        (value, key) => ({ key, value })
      );
    }

    html += '</tbody></table>';

    $('#secondlayerdetailscontentdiv').html(html);

    siteData.datagroupdetailsTable = $('table#datagroupdetailsTable').DataTable( // eslint-disable-line new-cap
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
            render (data, type) {
              const result = [];
              data.split(' ').forEach((item) => {
                if (item.match(/^http(s)?:/)) {
                  result.push(`<a href="${ item }">${ item }</a>`);
                } else {
                  const pool = getPool(`/Common/${ item }`, loadbalancer);
                  if (pool) {
                    // Click to see pool details
                    result.push(renderPool(loadbalancer, pool.name, type));
                  } else {
                    result.push(item);
                  }
                }
              });
              return result.join(' ');
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
      }
    );
  } else {
    $('#secondlayerdetailscontentdiv').html('');
  }

  $('a#closesecondlayerbutton').text('Close data group details');
  $('#secondlayerdiv').fadeIn(updateLocationHash);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function exportDeviceData() { // eslint-disable-line no-unused-vars
  const {loadbalancers} = siteData;
  const loadbalancersForExport = [];

  // Loop through the load balancers while anonymizing the data
  // eslint-disable-next-line no-restricted-syntax
  for (const i in loadbalancers) {
    const loadbalancer = loadbalancers[i];
    let statusvip: IStatusVIP;
    let newLB: ILoadbalancer;

    // eslint-disable-next-line no-restricted-syntax
    for (const p in loadbalancer) {
      switch (p) {
        case 'name':
          newLB.name = `LB${  i}`;
          break;
        case 'serial':
          newLB.serial = 'XXXX-YYYY';
          break;
        case 'ip':
          newLB.ip = `10.0.0.${  i}`;
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

  downLoadTextFile(
    JSON.stringify(loadbalancersForExport, null, 4),
    'loadbalancers.json'
  );

  // Loop through the device groups while anonymizing the data
  const {deviceGroups} = siteData;
  const deviceGroupsForExport = [];
  let newDeviceGroup: IDeviceGroup;

  // eslint-disable-next-line no-restricted-syntax
  for (const d in deviceGroups) {
    const deviceGroup = deviceGroups[d];

    newDeviceGroup.name = `DG${  d}`;
    newDeviceGroup.ips = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const i in deviceGroup.ips) {
      newDeviceGroup.ips.push(`10.0.0.${  i}`);
    }
  }

  deviceGroupsForExport.push(newDeviceGroup);

  downLoadTextFile(
    JSON.stringify(deviceGroupsForExport, null, 4),
    'devicegroups.json'
  );
}

function loadPreferences() {
  const {preferences} = siteData;

  Object.keys(preferences).forEach(k => {
    if (localStorage.getItem(k) === null) {
      localStorage.setItem(k, preferences[k]);
    }
  });
}

function getPool(pool: string, loadbalancer: string) {
  return siteData.poolsMap.get(`${loadbalancer}:${pool}`);
}

function getVirtualServer(vs: string, loadbalancer: string) {
  return (
    siteData.virtualservers.find((o) => o.name === vs && o.loadbalancer === loadbalancer)
  );
}

function getLoadbalancer(loadbalancer: string) {
  return (
    siteData.loadbalancers.find((o) => o.name === loadbalancer) || false
  );
}

// a and b are javascript Date objects
function dateDiffInDays(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / msPerDay);
}

function activateMenuButton(b: string) {
  $('div.menuitem').removeClass('menuitemactive');
  $(b).addClass('menuitemactive');
}

function customizeCSV(csv) {
  const csvRows = csv.split('\n');
  // table headings have a span and a placeholder, replace with placeholder
  csvRows[0] = csvRows[0].replace(
    /<span[^>]*>[^<]*<\/span>[^>]*<[^>]* placeholder=""([^"]*)""[^>]*>/gi,
    '$1'
  );
  return csvRows.join('\n');
}

function downLoadTextFile(data, fileName) {
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    `data:text/plain;charset=utf-8,${  encodeURIComponent(data)}`
  );
  element.setAttribute('download', fileName);
  element.innerHTML = 'download';

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
