	/*************************************************************************************************************************************************************************************

		BigIP-report Javascript

	*************************************************************************************************************************************************************************************/

	var asInitVals = new Array();

	var siteData = {};

	/*************************************************************************************************************************************************************************************

		Waiting for all pre-requisite objects to load

	*************************************************************************************************************************************************************************************/

	$(window).on("load", function () {
		// Animate loader off screen

		log("Starting window on load", "INFO");

		//Prevent caching of ajax requests
		$(document).ready(function () {
			$.ajaxSetup({ cache: false });
		});

		$("#firstlayerdetailscontentdiv").html(`
			<div id="jsonloadingerrors">
				<h1 class="jsonloadingerrors">There were errors when loading the object json files</h1>

				<h3>The following json files did not load:</h3>
				<div id="jsonloadingerrordetails">
				</div>

				<h3>Possible reasons</h3>

				<h4>The web server hosting the report is IIS7.x or older</h4>
				If you're running the report on IIS7.x or older it's not able to handle Json files without a tweak to the MIME files settings.<br>
				<a href="https://loadbalancing.se/bigip-report/#The_script_reports_missing_JSON_files">Detailed instructions are available here</a>.<br>

				<h4>File permissions or network issues</h4>
				Script has had issues when creating the files due to lack of permissions or network issues.<br>
				Double check your script execution logs, web folder content and try running the script manually.<br>

				<h3>Please note that while you can close these details, the report won't function as it should until these problems has been solved.</h3>

			</div>`
		);

		$("a#closefirstlayerbutton").text("Close error details");

		let addJSONLoadingFailure = function (jqxhr) {

			//Remove the random query string not to confuse people
			let url = this.url.split("?")[0];

			$("#jsonloadingerrordetails").append(`
					<div class="failedjsonitem"><span class="error">Failed object:</span><span class="errordetails"><a href="` + url + `">` + url + `</a></span>
					<br><span class="error">Status code:</span><span class="errordetails"> ` + jqxhr.status + `</span>
					<br><span class="error">Reason:</span><span class="errordetails"> ` + jqxhr.statusText + "</div>"
			)
			$("div.beforedocumentready").hide();
			$("#firstlayerdiv").fadeIn();
		}

		/******************************************************************************************************************************

			Lightbox related functions

		******************************************************************************************************************************/

		/* Hide the lightbox if clicking outside the information box*/
		$('body').on('click', function (e) {
			if (e.target.className == "lightbox") {
				$("div#" + e.target.id).fadeOut(function () {
					updateLocationHash();
				});
			}
		});

		/* Center the lightbox */
		jQuery.fn.center = function () {
			this.css("position", "absolute");
			//this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + $(window).scrollTop()) + "px");
			this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
			return this;
		}

		$("a#closefirstlayerbutton").on("click", function () {
			$("div#firstlayerdiv").trigger("click");
		});
		$("a#closesecondlayerbutton").on("click", function () {
			$("div#secondlayerdiv").trigger("click");
		});

		/**
		 * Example use:
		 * $('div:icontains("Text in page")');
		 * Will return jQuery object containing any/all of the following:
		 * <div>text in page</div>
		 * <div>TEXT in PAGE</div>
		 * <div>Text in page</div>
		 */
		$.expr[':'].icontains = $.expr.createPseudo(function(text) {
			return function(e) {
				return $(e).text().toUpperCase().indexOf(text.toUpperCase()) >= 0;
			};
		});

		/* syntax highlighting */
		sh_highlightDocument('js/', '.js');

		$.when(
			// Get pools
			$.getJSON("json/pools.json", function (result) {
				siteData.pools = result;
				siteData.poolsMap = new Map();
				let poolNum = 0;
				result.forEach((pool) => {
					pool.poolNum = poolNum;
					siteData.poolsMap.set(`${pool.loadbalancer}:${pool.name}`, pool);
					poolNum++;
				})
			}).fail(addJSONLoadingFailure),
			//Get the monitor data
			$.getJSON("json/monitors.json", function (result) {
				siteData.monitors = result;
			}).fail(addJSONLoadingFailure),
			//Get the virtual servers data
			$.getJSON("json/virtualservers.json", function (result) {
				siteData.virtualservers = result;
			}).fail(addJSONLoadingFailure),
			//Get the irules data
			$.getJSON("json/irules.json", function (result) {
				siteData.irules = result;
			}).fail(addJSONLoadingFailure),
			//Get the datagroup data
			$.getJSON("json/datagroups.json", function (result) {
				siteData.datagroups = result;
			}).fail(addJSONLoadingFailure),
			$.getJSON("json/loadbalancers.json", function (result) {
				siteData.loadbalancers = result;
			}).fail(addJSONLoadingFailure),
			$.getJSON("json/defaultpreferences.json", function (result) {
				siteData.defaultPreferences = result;
			}).fail(addJSONLoadingFailure),
			$.getJSON("json/knowndevices.json", function (result) {
				siteData.knownDevices = result;
			}).fail(addJSONLoadingFailure),
			$.getJSON("json/certificates.json", function (result) {
				siteData.certificates = result;
			}).fail(addJSONLoadingFailure),
			$.getJSON("json/devicegroups.json", function (result) {
				siteData.deviceGroups = result;
			}).fail(addJSONLoadingFailure),
			$.getJSON("json/asmpolicies.json", function (result) {
				siteData.asmPolicies = result;
			}).fail(addJSONLoadingFailure),
			$.getJSON("json/nat.json", function (result) {
				siteData.NATdict = result;
			}).fail(addJSONLoadingFailure),
			$.getJSON("json/loggederrors.json", function (result) {
				siteData.loggedErrors = result;
			}).fail(addJSONLoadingFailure)
		).then(function () {

			/********************************************************************************************************************************************************************************************

				All pre-requisite things have loaded

			********************************************************************************************************************************************************************************************/

			/*************************************************************************************************************

				Load preferences

			**************************************************************************************************************/

			loadPreferences();

			/*************************************************************************************************************

				Test the status VIPs

			*************************************************************************************************************/

			initializeStatusVIPs();

			for (var i in siteData.loggedErrors) {
				var logLine = siteData.loggedErrors[i];
				log(logLine.message, logLine.severity, logLine.date, logLine.time)
			}

			/* highlight selected menu option */

			populateSearchParameters()
			var currentSection = $("div#mainholder").attr("data-activesection");

			if (currentSection === undefined) {
				showVirtualServers();
			}

			/*************************************************************************************************************

				This section adds the update check button div and initiates the update checks

			**************************************************************************************************************/

			//Check if there's a new update every 30 minutes
			setInterval(function () {
				$.ajax(document.location.href, {
					type: 'HEAD',
					success: function (response, status, xhr) {

						var currentreport = Date.parse(document.lastModified);
						var latestreport = new Date(xhr.getResponseHeader('Last-Modified')).getTime();
						var currenttime = new Date();

						// The time since this report was generated (in minutes)
						//timesincelatestgeneration = Math.round((((currenttime - latestreport) % 86400000) % 3600000) / 60000)

						// If there's been a new report, how long ago (in minutes)
						timesincerefresh = Math.round((((latestreport - currentreport) % 86400000) % 3600000) / 60000)

						if (timesincerefresh > 60) {
							$("div#updateavailablediv").html('<a href="javascript:document.location.reload()" class="criticalupdateavailable">Update available</a>');
						} else if (timesincerefresh > 10) {
							$("div#updateavailablediv").html('<a href="javascript:document.location.reload()" class="updateavailable">Update available</a>');
						}

					}
				});
			}, 3000);

			log("loaded:" +
				" loadbalancers:" + siteData.loadbalancers.length +
				", virtualservers:" + siteData.virtualservers.length +
				", pools:" + siteData.pools.length +
				", iRules:" + siteData.irules.length +
				", certificates:" + siteData.certificates.length +
				", datagroups:" + siteData.datagroups.length +
				", asmPolicies:" + siteData.asmPolicies.length +
				".", "INFO");

		});

	});

	function initializeStatusVIPs() {

		// Also initialize the ajaxQueue
		siteData.memberStates = {}
		siteData.memberStates.ajaxQueue = [];
		siteData.memberStates.ajaxFailures = [];

		var loadbalancers = siteData.loadbalancers;

		//Check if there is any functioning pool status vips
		var hasConfiguredStatusVIP = loadbalancers.some(function (e) {
			return e.statusvip.url !== "";
		})

		if (hasConfiguredStatusVIP) {

			for (var i in loadbalancers) {

				var loadbalancer = loadbalancers[i];

				// Increase the not configured span for loadbalancers that is eligible for polling but has none configured
				if (loadbalancer.statusvip.url === "" && (loadbalancer.active || loadbalancer.isonlydevice)) {

					log("Loadbalancer " + loadbalancer.name + " does not have any status VIP configured", "INFO");
					$("span#realtimenotconfigured").text(parseInt($("span#realtimenotconfigured").text()) + 1);
					loadbalancer.statusvip.working = false;
					loadbalancer.statusvip.reason = "None configured";

				} else if (loadbalancer.statusvip.url !== "" && (loadbalancer.active || loadbalancer.isonlydevice)) {
					testStatusVIP(loadbalancer);
				}
			}
		} else {
			log("No status VIPs has been configured", "INFO");
			$("td#pollingstatecell").html("Disabled")
-			$("div.beforedocumentready").fadeOut(1500);
		}
	}

	function PoolMemberStatus(member) {
		var mStatus = member.enabled.split('_')[2] + ':' + member.availability.split('_')[2];

		if (mStatus == "ENABLED:GREEN" || mStatus == "ENABLED:BLUE") {
			return '<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="Available (Enabled)" title="Member is able to pass traffic"/></span><span class="textstatus">UP</span>';
		} else if (mStatus == "ENABLED:RED" || mStatus == "DISABLED:RED") {
			return '<span class="statusicon"><img src="images/red-circle-cross.png" alt="Offline (Enabled)" title="Member is unable to pass traffic"/></span><span class="textstatus">DOWN</span>';
		} else if (mStatus == "DISABLED:GREEN") {
			return '<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Available (Disabled)" title="Member is available, but disabled"/></span><span class="textstatus">DISABLED</span>'
		} else if (mStatus == "DISABLED:BLUE") {
			return '<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Unknown (Disabled)" title="Member is disabled"/></span><span class="textstatus">DISABLED</span>';
		}
		return mStatus;
	}

	function PoolStatus(pool) {
		if (!pool) {
			return '';
		}
		var pStatus = pool.enabled.split('_')[2] + ':' + pool.availability.split('_')[2];

		if (pStatus == "ENABLED:GREEN" || pStatus == "ENABLED:BLUE") {
			return '<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="' + pStatus + '" title="' + pool.status + '"/></span><span class="textstatus">' + pStatus + '</span>';
		} else if (pStatus == "ENABLED:RED" || pStatus == "DISABLED:RED") {
			return '<span class="statusicon"><img src="images/red-circle-cross.png" alt="' + pStatus + '" title="' + pool.status + '"/></span><span class="textstatus">DOWN</span>';
		} else if (pStatus == "DISABLED:GREEN") {
			return '<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="' + pStatus + '" title="' + pool.status + '"/></span><span class="textstatus">DISABLED</span>'
		} else if (pStatus == "DISABLED:BLUE") {
			return '<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="' + pStatus + '" title="' + pool.status + '"/></span><span class="textstatus">DISABLED</span>';
		}
		return pStatus;
	}

	function VirtualServerStatus(row) {
		if (!row.enabled || !row.availability)
			return '';
		var vsStatus = row.enabled.split('_')[2] + ':' + row.availability.split('_')[2];

		if (vsStatus == "ENABLED:GREEN") {
			return '<span class="statusicon"><img src="images/green-circle-checkmark.png" alt="Available (Enabled)"' +
				' title="Available (Enabled) - The virtual server is available"/></span><span class="textstatus">UP</span>';
		} else if (vsStatus == "ENABLED:BLUE") {
			return '<span class="statusicon"><img src="images/blue-square-questionmark.png" alt="Unknown (Enabled)"' +
				' title="Unknown (Enabled) - The children pool member(s) either don\'t have service checking enabled,' +
				' or service check results are not available yet"/></span><span class="textstatus">UNKNOWN</span>';
		} else if (vsStatus == "ENABLED:RED") {
			return '<span class="statusicon"><img src="images/red-circle-cross.png" alt="Offline (Enabled)"' +
				' title="Offline (Enabled) - The children pool member(s) are down"/></span><span class="textstatus">DOWN</span>';
		} else if (vsStatus == "DISABLED:GREEN") {
			return '<span class="statusicon"><img src="images/black-circle-cross.png" alt="Available (Disabled)"' +
				' title="Available (Disabled) - The virtual server is disabled"/></span><span class="textstatus">DISABLED</span>'
		} else if (vsStatus == "DISABLED:BLUE") {
			return '<span class="statusicon"><img src="images/black-circle-checkmark.png" alt="Unknown (Disabled)"' +
				' title="Unknown (Disabled) - The children pool member(s) either don\'t have service checking enabled,' +
				' or service check results are not available yet"/></span><span class="textstatus">DISABLED</span>';
		} else if (vsStatus == "DISABLED:RED") {
			return '<span class="statusicon"><img src="images/black-circle-cross.png" alt="Offline (Disabled)"' +
				' title="Offline (Disabled) - The children pool member(s) are down"/></span><span class="textstatus">DOWN</span>'
		}
		return vsStatus;
	}

	function createdPoolCell(cell, cellData, rowData, rowIndex, colIndex) {
		if (rowData.pools) {
			$(cell).addClass('PoolInformation');
			$(cell).attr('data-vsid', rowIndex);
		}
	}

	function renderPoolMember(member) {
		result='';
		if (member !== null) {
			result += '<span data-member="' + member.ip + ':' + member.port + '">';
			result += PoolMemberStatus(member);
			result += '</span>&nbsp;&nbsp;';
			name = member.name.split('/')[2];
			result += name
			if (name != member.ip) {
				result += '(' + member.ip + ')';
			}
			result += ':' + member.port;
		}
		return result;
	}

	function renderPoolMemberCell(member, poolNum) {
		membercell = '<td class="PoolMember" data-pool="' + poolNum + '">';
		membercell += renderPoolMember(member);
		membercell += '</td>'
		return membercell;
	}
	function renderPoolCell(data, type, row, meta) {
		if (type == 'sort') {
			if (row.pools) {
				return row.pools.length;
			} else {
				return 0;
			}
		}
		if (!row.pools) {
			return "N/A";
		}
		poolinformation = '<div class="expand" id="expand-' + meta.row + '" style="display: none;">' +
			'<a><img src="images/chevron-down.png" alt="down" onclick="Javascript:togglePool($(this))" data-vsid="' + meta.row + '"></a></div>';
		poolinformation += '<div class="collapse" id="collapse-' + meta.row + '" style="display: block;">' +
			'<a><img src="images/chevron-up.png" alt="up" onclick="Javascript:togglePool($(this))" data-vsid="' + meta.row + '"></a></div>';
		poolinformation +=	'<div class="AssociatedPoolsInfo" onclick="Javascript:togglePool($(this))" data-vsid="' + meta.row + '"' +
			' id="AssociatedPoolsInfo-' + meta.row + '" style="display: none;"> Click here to show ' + row.pools.length + ' associated pools</div>' +
			'<div id="PoolInformation-' + meta.row + '" class="pooltablediv" style="display: block;">';
		poolinformation += '<table class="pooltable"><tbody>';
		for (var i=0; i<row.pools.length; i++) {
			var pool = siteData.poolsMap.get(row.loadbalancer + ':' + row.pools[i]);
			var poolClass = 'Pool-' + pool.poolNum;
			poolinformation += '<tr class="' + poolClass + '" onmouseover="javascript:togglePoolHighlight(this);" onmouseout="javascript:togglePoolHighlight(this);" style="">'
			poolinformation += '<td';
			if (pool.members !== null) {
				poolinformation += ' rowspan="' + pool.members.length + '"';
			}
			poolinformation += ' data-vsid="' + meta.row + '" class="poolname">';
			poolinformation += renderPool(pool.loadbalancer, pool.name, type);
			poolinformation += '</td>';
			if (pool.members !== null) {
				poolinformation += renderPoolMemberCell(pool.members[0], pool.poolNum);
			}
			poolinformation += '</tr>';
			if (pool.members !== null) {
				for (var m=1; m<pool.members.length; m++) {
					poolinformation += '<tr class="' + poolClass + '">' + renderPoolMemberCell(pool.members[m], pool.poolNum) + '</tr>';
				}
			}
		}
		poolinformation += '</tbody></table>';
		poolinformation += "</div>";
		return poolinformation;
	}

	function testStatusVIP(loadbalancer) {

		var name = loadbalancer.name;

		// Find a pool with members on this load balancer
		var pool = false;
		var pools = siteData.pools;

		for (var i in pools) {
			if (pools[i].loadbalancer === name && pools[i].members) {
				pool = pools[i];
				break;
			}
		}

		if (!pool) {
			loadbalancer.statusvip.working = false;
			loadbalancer.statusvip.reason = "No pools with members found";
			log("No pools with members to test the status vip with on loadbalancer " + name + ", marking it as failed", "ERROR")

		} else {

			var testURL = loadbalancer.statusvip.url + pool.name;

			increaseAjaxQueue(testURL);

			$.ajax({
					dataType: "json",
					url: testURL,
					success: function (lb) {
						$("span#realtimetestsuccess").text(parseInt($("span#realtimetestsuccess").text()) + 1);
						log("Statusvip test <a href=\"" + testURL + "\">" + testURL + "</a> was successful on loadbalancer: <b>" + loadbalancer.name + "</b>", "INFO");
						loadbalancer.statusvip.working = true;
						loadbalancer.statusvip.reason = "";
						decreaseAjaxQueue(testURL);
					},
					timeout: 2000
				})
				.fail(function (jqxhr) {
					log('Statusvip test <a href="' + testURL + '">' + testURL + '</a> failed on loadbalancer: <b>' +
						loadbalancer.name + '</b><br>Information about troubleshooting status VIPs is available' +
						' <a href="https://loadbalancing.se/bigip-report/#One_or_more_status_endpoints_has_been_marked_as_failed">here</a>', "ERROR");
					$("span#realtimetestfailed").text(parseInt($("span#realtimetestfailed").text()) + 1);
					loadbalancer.statusvip.working = false;
					loadbalancer.statusvip.reason = jqxhr.statusText;
					decreaseAjaxQueue(testURL);
				})
				.always(function () {

					if (siteData.memberStates.ajaxQueue.length == 0) {

						//Tests done, restore the view of the original URL
						populateSearchParameters();

						//Check if there is any functioning pool status vips
						var hasWorkingStatusVIP = siteData.loadbalancers.some(function (e) {
							return e.statusvip.working;
						})

						if (hasWorkingStatusVIP) {

							log("Status VIPs tested, starting the polling functions", "INFO");

							//Initiate pool status updates
							var pollCurrentView = function () {
								resetClock();
								var length = $("table.pooltable tr td.poolname:visible").length;
								if (length == 0 || length > AJAXMAXPOOLS) {
									$("span#ajaxqueue").text(0);
									$("td#pollingstatecell").html('Disabled, ' + length + ' of ' + AJAXMAXPOOLS +
										' pools open<span id="realtimenextrefresh">, refresh in <span id="refreshcountdown">' +
										AJAXREFRESHRATE + '</span> seconds</span>');
								} else {
									$("td#pollingstatecell").html('<span id="ajaxqueue">0</span> queued<span id="realtimenextrefresh">,' +
										' refresh in <span id="refreshcountdown">' + AJAXREFRESHRATE + '</span> seconds</span>');

									$("span#ajaxqueue").text(length);
									$("table.pooltable tr td.poolname:visible").each(function () {
										getPoolStatus(this);
									});
								}
							}

							pollCurrentView()

							setInterval(function () {
								if (siteData.memberStates.ajaxQueue.length == 0) {
									pollCurrentView();
								} else {
									resetClock();
									log("Did not finish the polling in time, consider increasing the polling interval, or increase the max queue in the configuration file", "WARNING")
								}
							}, (AJAXREFRESHRATE * 1000));
						} else {
							log("No functioning status VIPs detected, scanning disabled<br>" +
								"More information about why this happens is available" +
								" <a href=\"https://loadbalancing.se/bigip-report/#The_member_status_polling_says_it8217s_disabled\">here</a>", "ERROR");
							$("td#pollingstatecell").html("Disabled")
						}
					}
				});
		}
		$("div.beforedocumentready").fadeOut(1500);
	}

	function renderLoadBalancer(loadbalancer) {
		var balancer;
		if (HideLoadBalancerFQDN) {
			balancer = loadbalancer.split('.')[0]
		} else {
			balancer = loadbalancer;
		}
		return '<a onclick="window.open(\'https://' + loadbalancer + '\',\'_blank\')">' + balancer + '</a>';
	}

	function renderVirtualServer(loadbalancer, name, type) {
		vsName=name.replace(/^\/Common\//,'');
		result = '';
		if (type == 'display') {
			result += '<a';
			result += ' class="tooltip"';
			result += ' data-originalvirtualservername="' + name + '"';
			result += ' data-loadbalancer="' + loadbalancer + '"';
			result += ' href="Javascript:showVirtualServerDetails(\'' + name + '\',\'' + loadbalancer + '\');">';
		}
		result += vsName;
		if (type == 'display') {
			result += '<span class="detailsicon"><img src="images/details.png" alt="details"></span>';
			result += '<p>Click to see virtual server details</p>';
			result += '</a>';
			result += '<span class="adcLinkSpan"><a target="_blank" href="https://' + loadbalancer;
			result += '/tmui/Control/jspmap/tmui/locallb/virtual_server/properties.jsp?name=' + name + '">Edit</a></span>';
		}
		return result;
	}

	function renderRule(loadbalancer, name, type) {
		console.log('renderRule:' + type);
		ruleName=name.replace(/^\/Common\//,'');
		result='';
		if (type == 'display') {
			result += '<a';
			result += ' class="tooltip"';
			result += ' data-originalvirtualservername="' + name + '"';
			result += ' data-loadbalancer="' + loadbalancer + '"';
			result += ' href="Javascript:showiRuleDetails(\'' + name + '\',\'' + loadbalancer + '\');">';
		}
		result += ruleName;
		if (type == 'display') {
			result += '<span class="detailsicon"><img src="images/details.png" alt="details"></span>';
			result += '<p>Click to see iRule details</p>';
			result += '</a>';
			result += '<span class="adcLinkSpan"><a target="_blank" href="https://' + loadbalancer;
			result += '/tmui/Control/jspmap/tmui/locallb/rule/properties.jsp?name=' + name + '">Edit</a></span>';
		}
		return result;
	}

	function renderPool(loadbalancer, name, type) {
		if (name == "N/A") {
			return name;
		}
		poolName=name.replace(/^\/Common\//,'');
		result = PoolStatus(siteData.poolsMap.get(loadbalancer + ':' + name)) + '&nbsp;';
		if (type == 'display') {
			result += '<a';
			result += ' class="tooltip"';
			result += ' data-originalpoolname="' + name + '"';
			result += ' data-loadbalancer="' + loadbalancer + '"';
			result += ' href="Javascript:showPoolDetails(\'' + name + '\',\'' + loadbalancer + '\');">';
		}
		result += poolName;
		if (type == 'display') {
			result += '<span class="detailsicon"><img src="images/details.png" alt="details"></span>';
			result += '<p>Click to see pool details</p>';
			result += '</a>';
			result += '<span class="adcLinkSpan"><a target="_blank" href="https://' + loadbalancer;
			result += '/tmui/Control/jspmap/tmui/locallb/pool/properties.jsp?name=' + name + '">Edit</a></span>';
		}
		return result;
	}

	function renderCertificate(loadbalancer, name, type) {
		certName=name.replace(/^\/Common\//,'');
		result = certName;
		if (type == 'display') {
			result += ' <span class="adcLinkSpan"><a target="_blank" href="https://' + loadbalancer;
			result += '/tmui/Control/jspmap/tmui/locallb/ssl_certificate/properties.jsp?certificate_name=' + name.replace(/\//,'%2F').replace(/.crt$/,'') + '">Edit</a></span>';
		}
		return result;
	}

	function renderDataGroup(loadbalancer, name, type) {
		datagroupName=name.replace(/^\/Common\//,'');
		result = '';
		if (type == 'display') {
			result = '<a';
			result += ' class="tooltip"';
			result += ' data-originalvirtualservername="' + name + '"';
			result += ' data-loadbalancer="' + loadbalancer + '"';
			result += ' href="Javascript:showDataGroupDetails(\'' + name + '\',\'' + loadbalancer + '\');">';
		}
		result += datagroupName;
		if (type == 'display') {
			result += '<span class="detailsicon"><img src="images/details.png" alt="details"></span>';
			result += '<p>Click to see Data Group details</p>';
			result += '</a>';
			result += '<span class="adcLinkSpan"><a target="_blank" href="https://' + loadbalancer;
			result += '/tmui/Control/jspmap/tmui/locallb/datagroup/properties.jsp?name=' + name + '">Edit</a></span>';
		}
		return result;
	}

	function resetClock() {

		var countDown = AJAXREFRESHRATE;

		var clock = setInterval(function () {
			countDown--;
			if (countDown === 0) {
				clearTimeout(clock)
			}
			$("span#refreshcountdown").html(countDown);

		}, 1000);

	}

	function getPoolStatus(poolCell) {

		if (siteData.memberStates.ajaxQueue.length >= AJAXMAXQUEUE) {
			setTimeout(function () {
				getPoolStatus(poolCell)
			}, 200);

		} else {

			var poolLink = $(poolCell).find("a.tooltip");
			var loadbalancerName = $(poolLink).attr("data-loadbalancer");

			var loadbalancer = getLoadbalancer(loadbalancerName);

			if (loadbalancer && loadbalancer.statusvip.working === true) {

				var poolName = $(poolLink).attr("data-originalpoolname");

				var pool = getPool(poolName, loadbalancerName);
				var url = loadbalancer.statusvip.url + pool.name

				if (increaseAjaxQueue(url)) {
					$.ajax({
						dataType: "json",
						url: url,
						success: function (data) {
							if (data.success) {

								decreaseAjaxQueue(url);

								for (var memberStatus in data.memberstatuses) {

									var statusSpan = $("td.PoolMember[data-pool=\"" + pool.poolNum + "\"] span[data-member=\"" + memberStatus + "\"]");

									setMemberState(statusSpan, data.memberstatuses[memberStatus])

									// Update the pool json object
									var members = pool.members;

									for (i in members) {
										var member = members[i];
										var ipport = member.ip + ":" + member.port;
										if (ipport === memberStatus) {
											member.realtimestatus = data.memberstatuses[memberStatus];
										}
									}
								}
							}
						},
						timeout: 2000
					})
					.fail(function (jqxhr) {
						// To be used later in the console
						// siteData.memberStates.ajaxFailures.push({ url: url, code: jqxhr.status, reason: jqxhr.statusText })
						decreaseAjaxQueue(url)
						return false;
					});
				}
			}
		}
	}

	function decreaseAjaxQueue(url) {

		var index = siteData.memberStates.ajaxQueue.indexOf(url);
		if (index > -1) {
			siteData.memberStates.ajaxQueue.splice(index,1);
		}

		//Decrease the total queue
		$("span#ajaxqueue").text(siteData.memberStates.ajaxQueue.length);
	}

	function increaseAjaxQueue(url) {
		if (siteData.memberStates.ajaxQueue.indexOf(url) == -1) {
			siteData.memberStates.ajaxQueue.push(url);
			$("span#ajaxqueue").text(siteData.memberStates.ajaxQueue.length);
			return true;
		}
		return false;
	}

	function setMemberState(statusSpan, memberStatus) {

		var statusIcon = $(statusSpan).find("span.statusicon");
		var textStatus = $(statusSpan).find("span.textstatus");

		var icon, title, textStatus;

		switch (memberStatus) {
			case "up":
				icon = "green-circle-checkmark.png";
				title = "Member is ready to accept traffic";
				textStatus = "UP";
				break;
			case "down":
				icon = "red-circle-cross.png";
				title = "Member is marked as down and unable to pass traffic";
				textStatus = "UP";
				break;
			case "session_disabled":
				icon = "black-circle-checkmark.png";
				title = "Member is ready to accept traffic, but is disabled";
				textStatus = "UP";
				break;
			default:
				icon = "blue-square-questionmark.png";
				title = "Unknown state";
				textStatus = "UNKNOWN";
				break;
		}

		var html = "<span class=\"statusicon\"><img src=\"images/" + icon + "\" title=\"" + title + "\" alt=\"" + textStatus + "\"/></span><span class=\"textstatus\">" + textStatus + "</span>";
		$(statusIcon).fadeOut(200).html(html).fadeIn(200);

	}

	/********************************************************************************************************************************************************************************************

		Functions used by the main data table

	********************************************************************************************************************************************************************************************/


	/******************************************************************************************************************************
		Highlight all matches
	******************************************************************************************************************************/

	function highlightAll(table) {

		var body = $(table.table().body());

		body.unhighlight();
		body.highlight(table.search());

		table.columns().every(function () {

			var that = this;

			columnvalue = $('input', this.header()).val()

			if (asInitVals.indexOf(columnvalue) == -1) {
				body.highlight(columnvalue);
			}
		});
	}

	/******************************************************************************************************************************
		Gets the query strings and populate the table
	******************************************************************************************************************************/

	function populateSearchParameters() {

		var vars = {};
		var hash;

		if (window.location.href.indexOf('#') >= 0) {

			//Split the hash query string and create a dictionary with the parameters
			var hashes = window.location.href.slice(window.location.href.indexOf('#') + 1).split('&');

			for (var i = 0; i < hashes.length; i++) {
				hash = hashes[i].split('=');
				vars[hash[0]] = hash[1];
			}

			//Populate the search and column filters
			for (var key in vars) {

				value = vars[key];

				//If it's provided, populate and search with the global string
				if (key == "global_search") {
					if ($('#allbigips_filter input[type="search"]')) {
						$('#allbigips_filter input[type="search"]').val(vars[key]);
						if (siteData.bigipTable) {
							siteData.bigipTable.search(vars[key]);
							siteData.bigipTable.draw();
						}
					}
				} else {
					//Validate that the key is a column filter and populate it
					if ($('input[name="' + key + '"]').length) {
						$('input[name="' + key + '"]').val(value);
					}
				}
			}

			if (siteData.bigipTable) {
				//Filter the table according to the column filters
				siteData.bigipTable.columns().every(function () {

					var that = this;

					columnvalue = $('input', this.header()).val();

					if (asInitVals.indexOf(columnvalue) == -1) {
						$('input', this.header()).addClass('search_entered').removeClass('search_init');
						this.search(columnvalue);
						this.draw();
						expandPoolMatches($(siteData.bigipTable.table().body()), columnvalue)
						highlightAll(siteData.bigipTable);
					}
				});
			}

			if (vars['pool']) {
				var poolName = vars['pool'].split('@')[0];
				var loadBalancer = vars['pool'].split('@')[1];

				showPoolDetails(poolName, loadBalancer);
			}

			if (vars['virtualserver']) {
				var virtualServerName = vars['virtualserver'].split('@')[0];
				var loadBalancer = vars['virtualserver'].split('@')[1];

				showVirtualServerDetails(virtualServerName, loadBalancer);
			}

			if (vars['datagroup']) {
				var dataGroupName = vars['datagroup'].split('@')[0];
				var loadBalancer = vars['datagroup'].split('@')[1];

				showDataGroupDetails(dataGroupName, loadBalancer);
			}


			if (vars['irule']) {
				var iruleName = vars['irule'].split('@')[0];
				var loadBalancer = vars['irule'].split('@')[1];

				showiRuleDetails(iruleName, loadBalancer);
			}

			if (vars['mainsection']) {

				var activeSection = vars['mainsection'];

				switch (activeSection) {
					case "virtualservers":
						showVirtualServers();
						break;
					case "irules":
						showiRules();
						break;
					case "deviceoverview":
						showDeviceOverview();
						break;
					case "certificatedetails":
						showCertificateDetails();
						break;
					case "datagroups":
						showDataGroups();
						break;
					case "reportlogs":
						showReportLogs();
						break;
					case "preferences":
						showPreferences();
						break;
					case "help":
						showHelp();
						break;
				}
			}
		}
	}

	/*************************************************************************************************************

		setup main Virtual Servers table

	*************************************************************************************************************/

	function setupVirtualServerTable() {
		if (siteData.bigipTable) {
			return;
		}

		var content = `
		<div id="allbigipsdiv" class="lbdiv">
			<table id="allbigips" class="bigiptable">
				<thead>
					<tr>
						<th class="loadbalancerHeaderCell"><input type="text" name="loadBalancer" value="Load Balancer"
							class="search_init" data-column-name="Load Balancer" data-setting-name="showLoadBalancerColumn"/></th>
						<th><input type="text" name="vipName" value="VIP Name" class="search_init" data-column-name="Virtual server"
							data-setting-name="showVirtualServerColumn"/></th>
						<th><input type="text" name="ipPort" value="IP:Port" class="search_init" data-column-name="IP:Port" data-setting-name="showIPPortColumn" /></th>
						<th><input type="text" name="asmPolicies" size="6" value="ASM" class="search_init" data-column-name="ASM Policies"
							data-setting-name="showASMPoliciesColumn"/></th>
						<th class="sslProfileHeaderCell"><input type="text" name="sslProfile" size="6" value="SSL C/S" class="search_init"
							data-column-name="SSL Profile" data-setting-name="showSSLProfileColumn"/></th>
						<th class="compressionProfileHeaderCell"><input type="text" name="compressionProfile" size="6" value="Compression"
							class="search_init" data-column-name="Compression Profile" data-setting-name="showCompressionProfileColumn" /></th>
						<th class="persistenceProfileHeaderCell"><input type="text" name="persistenceProfile" size="6" value="Persistence"
							class="search_init" data-column-name="Persistence Profile" data-setting-name="showPersistenceProfileColumn"/></th>
						<th><input type="text" name="pool_members" value="Pool/Members" class="search_init" data-column-name="Pools/Members"
							data-setting-name="showPoolsMembersColumn"/></th>
					</tr>
				</thead>
				<tbody>
				</tbody>
			</table>
		</div>`;

		$("div#virtualservers").html(content);


		/*************************************************************************************************************

			Initiate data tables, add a search all columns header and save the standard table header values

		**************************************************************************************************************/

		$("table#allbigips thead input.search_init").each(function (i) {
			asInitVals[i] = this.value;
		});


		siteData.bigipTable = $('table#allbigips').DataTable({
			"autoWidth": false,
			"deferRender": true,
			"data": siteData.virtualservers,
			"createdRow": function (row, data, index) {
				$(row).addClass('virtualserverrow');
			},
			"columns": [{
				"data": "loadbalancer",
				"className": "loadbalancerCell",
				"render": function (data, type, row) {
					return renderLoadBalancer(data);
				}
			}, {
				"data": "name",
				"className": "virtualServerCell",
				"render": function (data, type, row) {
					return VirtualServerStatus(row) + '&nbsp;' + renderVirtualServer(row.loadbalancer, data, type);
				}
			}, {
				"className": "centeredCell",
				"render": function (data, type, row) {
					result = row.ip + ':' + row.port;
					if (siteData.NATdict[row.ip.split('%')[0]]) {
						result += '<br>Public IP:' + siteData.NATdict[row.ip.split('%')[0]];
					}
					return result;
				}
			}, {
				"className": "centeredCell",
				"render": function (data, type, row) {
					if (!row.asmPolicies) {
						return "N/A";
					} else {
						result = row.asmPolicies;
						for (asm=0;asm<siteData.asmPolicies.length;asm++) {
							if (row.loadbalancer == siteData.asmPolicies[asm].loadbalancer &&
									row.asmPolicies[0] == siteData.asmPolicies[asm].name) {
								if (siteData.asmPolicies[asm].enforcementMode == 'blocking') {
									result += ' (B)';
								} else {
									result += ' (T)';
								}
							}
						}
						return result;
					}
				}
			}, {
				"className": "centeredCell",
				"render": function (data, type, row) {
					result = '';
					if (row.sslprofileclient == "None") {
						result += "No";
					} else {
						result += "Yes";
					}
					result += '/';
					if (row.sslprofileserver == "None") {
						result += "No";
					} else {
						result += "Yes";
					}
					return result;
				}
			}, {
				"className": "centeredCell",
				"render": function (data, type, row) {
					if (row.compressionprofile == "None") {
						return "No";
					} else {
						return "Yes";
					}
				}
			}, {
				"className": "centeredCell",
				"render": function (data, type, row) {
					if (row.persistence == "None") {
						return "No";
					} else {
						return "Yes";
					}
				}
			}, {
				"data": "pools",
				"type": "html-num",
				"createdCell": createdPoolCell,
				"render": renderPoolCell
			}],
			"iDisplayLength": 10,
			"oLanguage": {
				"sSearch": "Search all columns:"
			},
			"dom": 'fBrtilp',
			"buttons": [
				{
					"extend": "copyHtml5",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				},
				{
					"extend": "print",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				},
				{
					"extend": "csvHtml5",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				}
			],
			"lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
		});


		/******************************************************************************************************************************

			Add custom data tables functions

		******************************************************************************************************************************/

		//Expand pool matches  and hightlight them
		siteData.bigipTable.on('draw', function () {

			var body = $(siteData.bigipTable.table().body());

			highlightAll(siteData.bigipTable);


			hidePools();
			toggleColumns();
			toggleAdcLinks();

			if (siteData.bigipTable.search() != "") {
				expandPoolMatches(body, siteData.bigipTable.search());
			}

			setPoolTableCellWidth();

		});

		// is wheelmouse paging useful?
		/*
		$('table#allbigips tbody').bind('wheel', (e) => {
			var dir = e.originalEvent.deltaY < 0 ? 'previous' : 'next';
			siteData.bigipTable.page(dir).draw(false);
			return false;
		});
		*/

		/*************************************************************************************************************

			Attaches a function to the main data table column filters that
			removes the text from the input windows when clicking on them
			and adds the possibility to filter per column

		**************************************************************************************************************/

		$("table#allbigips thead input").focus(function () {
			if (this.className == "search_init")
			{
				this.className = "search_entered";
				this.value = "";
			}
		});

		//Prevents sorting the columns when clicking on the sorting headers
		$('table#allbigips .search_init').on('click', function (e) {
			e.stopPropagation();
		});

		$('table#allbigips .search_entered').on('click', function (e) {
			e.stopPropagation();
		});


		$("table#allbigips thead input").blur(function (i) {
			if (this.value == "") {
				this.className = "search_init";
				this.value = asInitVals[$("thead input").index(this)];
			}
		});

		/*************************************************************************************************************

			This section inserts the reset filters button and it's handlers

		**************************************************************************************************************/

		$("#allbigips_filter").append("<a id=\"resetFiltersButton\" class=\"resetFiltersButton\" href=\"javascript:void(0);\">Reset filters</a>")

		$("#resetFiltersButton").on("click", function () {

			$("table#allbigips thead th input[type='search']").val("");

			$("table#allbigips thead th input").each(function () {
				this.className = "search_init";
				this.value = asInitVals[$("table#allbigips thead input").index(this)];
			});

			siteData.bigipTable.search('')
				.columns().search('')
				.draw();
		});

		/*************************************************************************************************************

			This section inserts a button that exports the report to CSV

		**************************************************************************************************************/

		if (ShowExportLink) {
			$("#allbigips_filter").append("<a id=\"exportCSVButton\" class=\"exportCSVButton\" href=\"javascript:downloadCSV();\">Export to CSV</a>");
		}

		/*************************************************************************************************************

			This section inserts the column toggle buttons and attaches even handlers to it

		**************************************************************************************************************/

		$("#allbigips_filter").append("<div style=\"float:right\"><span id=\"toggleHeader\">Toggle columns:<span><span id=\"columnToggleButtons\"></span></div>")

		$("#allbigips thead th input").each(function () {

			var columnID = $(this).attr("data-setting-name");

			var toggleLinkData = "";

			if (localStorage.getItem(columnID) === "true") {
				buttonClass = "visibleColumnButton";
			} else {
				buttonClass = "hiddenColumnButton";
			}

			toggleLinkData += "<a href=\"javascript:void(0)\" class=\"" + buttonClass + "\" id=\"" + columnID + "\">" + $(this).attr("data-column-name") + "</a>";

			$("#columnToggleButtons").append(toggleLinkData);

			$("#" + columnID).on("click", function () {

				var preferenceName = $(this).attr("id")

				if (localStorage.getItem(preferenceName) === "false") {
					$(this).addClass("visibleColumnButton").removeClass("hiddenColumnButton");
					localStorage.setItem(preferenceName, "true");
				} else {
					$(this).addClass("hiddenColumnButton").removeClass("visibleColumnButton");
					localStorage.setItem(preferenceName, "false");
				}

				toggleColumns();

			});

		});

		//This section handles the global search
		$('div#allbigips_filter.dataTables_filter input').off('keyup.DT input.DT');

		// Set-up search delays
		var delay = (function () {

			var timer = 0;

			return function (callback, ms) {
				clearTimeout(timer);
				timer = setTimeout(callback, ms);
			};
		})();

		$('div#allbigips_filter.dataTables_filter input').on('keyup', function () {
			var search = $('div#allbigips_filter.dataTables_filter input').val();
			delay(function () {
				if (search != null) {
					updateLocationHash();
					siteData.bigipTable.search(search).draw();
				}
			}, 700);
		});

		//Filter columns on key update and adding search delay
		siteData.bigipTable.columns().every(function () {

			var that = this;

			$('input', this.header()).on('keyup change', function () {

				var search = this.value
				delay(function () {
					updateLocationHash();
					that
						.search(search)
						.draw();
					expandPoolMatches($(siteData.bigipTable.table().body()), search);
					highlightAll(siteData.bigipTable);
				}, 700);
			});

		});

		/*************************************************************************************************************

			If any search parameters has been sent, populate the search

		**************************************************************************************************************/

		siteData.bigipTable.draw();

	}

	function setupiRuleTable() {
		if (siteData.iRuleTable) {
			return;
		}

		var content = `
		<table id="iRuleTable" class="bigiptable">
			<thead>
				<tr>
					<th class="loadbalancerHeaderCell"><span style="display: none;">Load Balancer</span><input type="text" class="search" placeholder="Load Balancer" /></th>
					<th><span style="display: none;">Name</span><input type="text" class="search" placeholder="Name" /></th>
					<th><span style="display: none;">Pools</span><input type="text" class="search" placeholder="Associated Pools" /></th>
					<th><span style="display: none;">Datagroups</span><input type="text" class="search" placeholder="Associated Datagroups" /></th>
					<th style="width: 4em;"><span style="display: none;">Length</span><input type="text" class="search" placeholder="Length" /></th>
			</thead>
			<tbody>
			</tbody>
		</table>`;

		$("div#irules").html(content);

		siteData.iRuleTable = $('table#iRuleTable').DataTable({
			"autoWidth": false,
			"deferRender": true,
			"data": siteData.irules,
			"columns": [{
				"data": "loadbalancer",
				"className": "loadbalancerCell",
				"render": function (data, type, row) {
					return renderLoadBalancer(data);
				}
			}, {
				"data": "name",
				"className": "iRuleCell",
				"render": function (data, type, row) {
					return renderRule(row.loadbalancer, data, type);
				}
			}, {
				"type": "html-num",
				"render": function (data, type, row) {
					if (type == 'sort') {
						if (row.pools && row.pools.length) {
							return row.pools.length;
						}
						return 0;
					}
					var result = '';
					if (row.pools && row.pools.length > 0) {
						row.pools.forEach((pool) => {
							if (result != '') {
								result += '<br>';
							}
							result += renderPool(row.loadbalancer, pool, type);
						});
					} else {
						result = "None";
					}
					return result;
				}
			}, {
				"type": "html-num",
				"render": function (data, type, row) {
					if (type == 'sort') {
						if (row.datagroups && row.datagroups.length) {
							return row.datagroups.length;
						}
						return 0;
					}
					var result = '';
					if (row.datagroups && row.datagroups.length > 0) {
						row.datagroups.forEach((datagroup) => {
							if (result != '') {
								result += '<br>';
							}
							result += renderDataGroup(row.loadbalancer, datagroup, type);
						});
					} else {
						result = "None";
					}
					return result;
				}
			}, {
				"data": "definition",
				"render": function (data, type, row) {
					return data.length;
				}
			}],
			"iDisplayLength": 10,
			"oLanguage": {
				"sSearch": "Search all columns:"
			},
			"dom": 'fBrtilp',
			"buttons": [
				"columnsToggle",
				{
					"extend": "copyHtml5",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				},
				{
					"extend": "print",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				},
				{
					"extend": "csvHtml5",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				}
			],
			"lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
		});

		//Prevents sorting the columns when clicking on the sorting headers
		$('table#iRuleTable thead th input').on('click', function (e) {
			e.stopPropagation();
		});

		// Apply the search
		siteData.iRuleTable.columns().every( function () {
			var that = this;
			$( 'input', this.header() ).on( 'keyup change', function () {
				if ( that.search() !== this.value ) {
					that
						.search( this.value )
						.draw();
				}
			});
		});

		// reset filters button and handlers
		$("#iRuleTable_filter").append("<a id=\"resetiRuleFiltersButton\" class=\"resetFiltersButton\" href=\"javascript:void(0);\">Reset filters</a>")

		$("#resetiRuleFiltersButton").on("click", function () {
			$("table#iRuleTable thead th input").val("");
			siteData.iRuleTable.search('')
				.columns().search('')
				.draw();
		});

		// highlight matches
		siteData.iRuleTable.on('draw', function () {
			highlightAll(siteData.iRuleTable);
			toggleAdcLinks();
		});
	}

	function setupPoolTable() {
		if (siteData.poolTable) {
			return;
		}

		var content = `
		<table id="poolTable" class="bigiptable">
			<thead>
				<tr>
					<th class="loadbalancerHeaderCell"><span style="display: none;">Load Balancer</span><input type="text" class="search" placeholder="Load Balancer" /></th>
					<th><span style="display: none;">Name</span><input type="text" class="search" placeholder="Name" /></th>
					<th><span style="display: none;">Orphan</span><input type="text" class="search" placeholder="Orphan" /></th>
					<th><span style="display: none;">Method</span><input type="text" class="search" placeholder="Method" /></th>
					<th><span style="display: none;">Members</span><input type="text" class="search" placeholder="Members" /></th>
				</tr>
			</thead>
			<tbody>
			</tbody>
		</table>`;

		$("div#pools").html(content);

		siteData.poolTable = $('table#poolTable').DataTable({
			"autoWidth": false,
			"deferRender": true,
			"data": siteData.pools,
			"columns": [{
				"data": "loadbalancer",
				"className": "loadbalancerCell",
				"render": function (data, type, row) {
					return renderLoadBalancer(data);
				}
			}, {
				"data": "name",
				"render": function (data, type, row) {
					return renderPool(row.loadbalancer, data, type);
				}
			}, {
				"data": "orphaned"
			}, {
				"data": "loadbalancingmethod"
			}, {
				"data": "members",
				"type": "html-num",
				"render": function (data, type, row) {
					// column sort sorts by number of members
					if (type == 'sort') {
						if (data && data.length) {
							return data.length;
						}
						return 0;
					}
					result='';
					if (data) {
						data.forEach((member) => {
							result += renderPoolMember(member) + '<br>';
						});
					}
					return result;
				}
			}],
			"iDisplayLength": 10,
			"oLanguage": {
				"sSearch": "Search all columns:"
			},
			"dom": 'fBrtilp',
			"buttons": [
				"columnsToggle",
				{
					"extend": "copyHtml5",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				},
				{
					"extend": "print",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				},
				{
					"extend": "csvHtml5",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				}
			],
			"lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
		});

		//Prevents sorting the columns when clicking on the sorting headers
		$('table#poolTable thead th input').on('click', function (e) {
			e.stopPropagation();
		});

		// Apply the search
		siteData.poolTable.columns().every( function () {
			var that = this;
			$( 'input', this.header() ).on( 'keyup change', function () {
				if ( that.search() !== this.value ) {
					that
						.search( this.value )
						.draw();
				}
			});
		});

		// reset filters button and handlers
		$("#poolTable_filter").append("<a id=\"resetPoolFiltersButton\" class=\"resetFiltersButton\" href=\"javascript:void(0);\">Reset filters</a>")

		$("#resetPoolFiltersButton").on("click", function () {
			$("table#poolTable thead th input").val("");
			siteData.poolTable.search('')
				.columns().search('')
				.draw();
		});

		// highlight matches
		siteData.poolTable.on('draw', function () {
			highlightAll(siteData.poolTable);
			toggleAdcLinks();
		});
	}

	function setupDataGroupTable() {
		if (siteData.dataGroupTable) {
			return;
		}

		var content = `
		<table id="dataGroupTable" class="bigiptable">
			<thead>
				<tr>
					<th class="loadbalancerHeaderCell"><span style="display: none;">Load Balancer</span><input type="text" class="search" placeholder="Load Balancer" /></th>
					<th><span style="display: none;">Name</span><input type="text" class="search" placeholder="Name" /></th>
					<th><span style="display: none;">Type</span><input type="text" class="search" placeholder="Type" /></th>
					<th><span style="display: none;">Pools</span><input type="text" class="search" placeholder="Associated Pools" /></th>
					<th><span style="display: none;">Length</span><input type="text" class="search" placeholder="Length" /></th>
				</tr>
			</thead>
			<tbody>
			</tbody>
		</table>`;

		$("div#datagroups").html(content);

		siteData.dataGroupTable = $('table#dataGroupTable').DataTable({
			"autoWidth": false,
			"deferRender": true,
			"data": siteData.datagroups,
			"columns": [{
				"data": "loadbalancer",
				"className": "loadbalancerCell",
				"render": function (data, type, row) {
					return renderLoadBalancer(data);
				}
			}, {
				"data": "name",
				"className": "iRuleCell",
				"render": function (data, type, row) {
					return renderDataGroup(row.loadbalancer, data, type);
				}
			}, {
				"data": "type",
			}, {
				"type": "html-num",
				"render": function (data, type, row) {
					if (type == 'sort') {
						if (row.pools && row.pools.length) {
							return row.pools.length;
						}
						return 0;
					}
					var result = '';
					if (row.pools && row.pools.length > 0) {
						row.pools.forEach((pool) => {
							if (result != '') {
								result += '<br>';
							}
							result += renderPool(row.loadbalancer, pool, type);
						});
					} else {
						result = "None";
					}
					return result;
				}
			}, {
				"data": "data",
				"render": function (data, type, row) {
					if (data) {
						return Object.keys(data).length;
					}
					return 0;
				}
			}],
			"iDisplayLength": 10,
			"oLanguage": {
				"sSearch": "Search all columns:"
			},
			"dom": 'fBrtilp',
			"buttons": [
				"columnsToggle",
				{
					"extend": "copyHtml5",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				},
				{
					"extend": "print",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				},
				{
					"extend": "csvHtml5",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				}
			],
			"lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
		});

		//Prevents sorting the columns when clicking on the sorting headers
		$('table#dataGroupTable thead th input').on('click', function (e) {
			e.stopPropagation();
		});

		// Apply the search
		siteData.dataGroupTable.columns().every( function () {
			var that = this;
			$( 'input', this.header() ).on( 'keyup change', function () {
				if ( that.search() !== this.value ) {
					that
						.search( this.value )
						.draw();
				}
			});
		});

		// reset filters button and handlers
		$("#dataGroupTable_filter").append("<a id=\"resetDataGroupFiltersButton\" class=\"resetFiltersButton\" href=\"javascript:void(0);\">Reset filters</a>")

		$("#resetDataGroupFiltersButton").on("click", function () {
			$("table#dataGroupTable thead th input").val("");
			siteData.dataGroupTable.search('')
				.columns().search('')
				.draw();
		});

		// highlight matches
		siteData.dataGroupTable.on('draw', function () {
			highlightAll(siteData.dataGroupTable);
			toggleAdcLinks();
		});
	}

	function setupCertificateTable() {

		if (siteData.certificateTable) {
			return;
		}

		var content = `
		<table id="certificateTable" class="bigiptable">
			<thead>
				<tr>
					<th class="loadbalancerHeaderCell"><span style="display: none;">Load Balancer</span><input type="text" class="search" placeholder="Load Balancer" /></th>
					<th><span style="display: none;">Name</span><input type="text" class="search" placeholder="Name" /></th>
					<th><span style="display: none;">Common Name</span><input type="text" class="search" placeholder="Common Name" /></th>
					<th><span style="display: none;">Country</span><input type="text" class="search" placeholder="Country Name" /></th>
					<th><span style="display: none;">State</span><input type="text" class="search" placeholder="State Name" /></th>
					<th><span style="display: none;">Org</span><input type="text" class="search" placeholder="Organization Name" /></th>
					<th><span style="display: none;">Expiring</span><input type="text" class="search" placeholder="Expiring" /></th>
				</tr>
			</thead>
			<tbody>
			</tbody>
		</table>`;

		$("div#certificatedetails").html(content);

		siteData.certificateTable = $("div#certificatedetails table#certificateTable").DataTable({
			"autoWidth": false,
			"deferRender": true,
			"data": siteData.certificates,
			"columns": [{
				"data": "loadbalancer",
				"className": "loadbalancerCell",
				"render": function (data, type, row) {
					return renderLoadBalancer(data);
				}
			}, {
				"data": "fileName",
				"render": function(data, type, row) {
					return renderCertificate(row.loadbalancer, data, type);
				}
			}, {
				"data": "subject.commonName"
			}, {
				"data": "subject.countryName",
				"class": "certificatecountryname",
				"render": function(data, type, row) {
					result = '';
					if (data) {
						result += "<img class=\"flagicon\" alt=\"" + data.toLowerCase() + "\" src=\"images/flags/" + data.toLowerCase() + ".png\"/> ";
					}
					return result + " " + data;
				}
			}, {
				"data": "subject.stateName"
			}, {
				"data": "subject.organizationName"
			}, {
				"data": "expirationDate",
				"render": function(data, type, row){
					var certificateDate = new Date(0);
					certificateDate.setUTCSeconds(data);
					return certificateDate.toISOString().replace("T", " ").replace(/\.[0-9]{3}Z/, "");
				}
			}],
			"createdRow": function(row, data, index) {
				// Get the days left
				var now = new Date();
				var certificateDate = new Date(0);
				certificateDate.setUTCSeconds(data.expirationDate);
				var daysLeft = dateDiffInDays(now, certificateDate);

				if (daysLeft < 14) {
					var rowClass = "certificateExpiringIn14";
				} else if (daysLeft < 30) {
					var rowClass = "certificateExpiringIn30";
				} else if (daysLeft < 60) {
					var rowClass = "certificateExpiringIn60"
				} else {
					var rowClass = "certificateExpiringInMoreThan60"
				}
				$(row).addClass(rowClass);
			},
			"iDisplayLength": 10,
			"oLanguage": {
				"sSearch": "Search all columns:"
			},
			"dom": 'fBrtilp',
			"buttons": [
				"columnsToggle",
				{
					"extend": "copyHtml5",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				},
				{
					"extend": "print",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				},
				{
					"extend": "csvHtml5",
					"exportOptions": {
						"columns": ":visible",
						"stripHtml": false,
						"orthogonal": "export"
					}
				}
			],
			"lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
		});

		//Prevents sorting the columns when clicking on the sorting headers
		$('table#certifcateTable thead th input').on('click', function (e) {
			e.stopPropagation();
		});

		// Apply the search
		siteData.certificateTable.columns().every( function () {
			var that = this;
			$( 'input', this.header() ).on( 'keyup change', function () {
				if ( that.search() !== this.value ) {
					that
						.search( this.value )
						.draw();
				}
			});
		});

		// reset filters button and handlers
		$("#certificateTable_filter").append("<a id=\"resetCertificateFiltersButton\" class=\"resetFiltersButton\" href=\"javascript:void(0);\">Reset filters</a>")

		$("#resetCertificateFiltersButton").on("click", function () {
			$("table#certifcateTable thead th input").val("");
			siteData.certificateTable.search('')
				.columns().search('')
				.draw();
		});

		// highlight matches
		siteData.certificateTable.on('draw', function () {
			highlightAll(siteData.certificateTable);
			toggleAdcLinks();
		});
	}

	function hideMainSection() {
		$("div.mainsection").hide();
	}

	function showMainSection(section) {
		hideMainSection();
		$("div#" + section).fadeIn(10, updateLocationHash);
	}

	function showVirtualServers() {

		hideMainSection();
		setupVirtualServerTable();
		activateMenuButton("div#virtualserversbutton");
		$("div#mainholder").attr("data-activesection", "virtualservers");
		updateLocationHash();

		showMainSection("virtualservers")
	}

	function showiRules() {

		hideMainSection();
		setupiRuleTable();
		activateMenuButton("div#irulesbutton");
		$("div#mainholder").attr("data-activesection", "irules");
		updateLocationHash();

		showMainSection("irules");
		toggleAdcLinks();
	}

	function showPools() {

		hideMainSection();
		setupPoolTable();
		activateMenuButton("div#poolsbutton");
		$("div#mainholder").attr("data-activesection", "pools");
		updateLocationHash();

		showMainSection("pools");
		toggleAdcLinks();
	}

	function showDataGroups() {

		hideMainSection();
		setupDataGroupTable();
		activateMenuButton("div#datagroupbutton");
		$("div#mainholder").attr("data-activesection", "datagroups");
		updateLocationHash();

		showMainSection("datagroups");
		toggleAdcLinks();
	}

	function showPreferences() {

		hideMainSection();
		activateMenuButton($("div#preferencesbutton"));
		$("div#mainholder").attr("data-activesection", "preferences");
		updateLocationHash();

		//Prepare the content
		var settingsContent = `
							<table id="preferencestable" class="bigiptable">

								<thead>
									<tr>
										<th colspan=2>Generic settings</th>
									</tr>
								</thead>

								<tbody>
									<tr><td>Expand all pool members</td><td class="preferencescheckbox"><input type="checkbox" id="autoExpandPools"></td></tr>
									<tr><td>Direct links to Big-IP objects</td><td class="preferencescheckbox"><input type="checkbox" id="adcLinks"></td></tr>
								</tbody>

							</table>
`

		//Populate the content
		$("div#preferences").html(settingsContent);

		//Populate the settings according to the local storage or default settings of none exist
		$("#autoExpandPools").prop("checked", localStorage.getItem("autoExpandPools") === "true");
		$("#adcLinks").prop("checked", localStorage.getItem("showAdcLinks") === "true");

		// if we change content rendering rules, we can redraw with:
		// siteData.bigipTable.clear().rows.add(siteData.virtualservers).draw();
		// we could make HideLoadBalancerFQDN dynamic this way. Might want to redraw all tables.

		//Event handler for auto expand pools
		$("#autoExpandPools").on("click", function () {
			localStorage.setItem("autoExpandPools", this.checked);
			if (siteData.bigipTable) {
				siteData.bigipTable.draw();
			}
		});

		//Event handler for showing ADC edit links
		$("#adcLinks").on("click", function () {
			localStorage.setItem("showAdcLinks", this.checked);
			toggleAdcLinks();
		});

		//Make sure that the check boxes are checked according to the settings
		$("#allbigips thead th input").each(function () {
			var columnID = $(this).attr("data-setting-name");
			$("#" + columnID).prop("checked", localStorage.getItem(columnID) === "true");
		});

		showMainSection("preferences");

	}

	function showCertificateDetails() {

		hideMainSection();
		setupCertificateTable();
		activateMenuButton("div#certificatebutton");
		$("div#mainholder").attr("data-activesection", "certificatedetails");
		updateLocationHash();

		showMainSection("certificatedetails");

	}

	function showDeviceOverview() {

		hideMainSection();
		activateMenuButton("div#deviceoverviewbutton");
		$("div#mainholder").attr("data-activesection", "deviceoverview");
		updateLocationHash();

		var deviceGroups = siteData.deviceGroups
		var loadbalancers = siteData.loadbalancers

		var html = `
				<table id="deviceoverviewtable" class="bigiptable">
					<thead>
						<tr>
							<th>Icon</th>
							<th>Device Group</th>
							<th>Name</th>
							<th>Model</th>
							<th>Type</th>
							<th>Version</th>
							<th>Serial</th>
							<th>Management IP</th>
							<th>Polling</th>
						</tr>
					</thead>
					<tbody>`;

		for (var d in deviceGroups) {

			var firstDevice = true;
			var deviceGroup = deviceGroups[d];

			// Get an icon from a functioning device, if any

			var icon = "";
			var successFound = false;

			for (var i in deviceGroup.ips) {

				var loadbalancer = siteData.loadbalancers.find(function (o) {
					return o.ip === deviceGroup.ips[i];
				}) || false;

				if (loadbalancer.success) {

					var model = loadbalancer.model.toUpperCase();
					var deviceData = siteData.knownDevices[model] || false;
					successFound = true;

					if (deviceData) {
						icon = deviceData.icon;
						break;
					}
				}

			}

			if (icon === "" && successFound) {
				icon = "images/deviceicons/unknowndevice.png";
			} else if (icon === "") {
				icon = "images/faileddevice.png";
			}

			for (var i in deviceGroup.ips) {

				var loadbalancer = siteData.loadbalancers.find(function (o) {
					return o.ip === deviceGroup.ips[i];
				}) || false;

				var pollingStatus = "N/A";

				if (loadbalancer.success) {

					var deviceData = siteData.knownDevices[loadbalancer.model] || false;

					if (loadbalancer.active || loadbalancer.isonlydevice) {

						if (loadbalancer.statusvip.url === "") {
							pollingStatus = "<span class=\"devicepollingnotconfigured\">Not configured</span>";
						} else if (loadbalancer.statusvip.working) {
							pollingStatus = "<span class=\"devicepollingsuccess\">Working</span>";
						} else {
							pollingStatus = "<span class=\"devicepollingfailed\">Failed</span>";;
						}
					} else {
						pollingStatus = "N/A (passive device)"
					}

				}

				if (firstDevice) {
					html += "<tr><td rowspan=\"" + deviceGroup.ips.length + "\" class=\"deviceiconcell\"><img class=\"deviceicon\" alt=\"deviceicon\" src=\"" + icon +
						"\"/></td><td class=\"devicenamecell\" rowspan=\"" + deviceGroup.ips.length + "\">" + deviceGroup.name + "</td>";
					firstDevice = false;
				} else {
					html += "<tr>";
				}

				var devicestatus = (loadbalancer.color || "red");
				html += "<td class=\"devicenamecell\"><img class=\"devicestatusicon\" alt=\"" + devicestatus + "\" src=\"images/devicestatus" + devicestatus + ".png\"/>" +
					(loadbalancer.name ? '<a href="https://' + loadbalancer.name + '" target="_blank">' + loadbalancer.name + '</a>' : "<span class=\"devicefailed\">Failed to index</span>") +
					"</td><td>" + (loadbalancer.category || "N/A") + "</td><td>" +
					(loadbalancer.model || "N/A") + "</td><td>" + (loadbalancer.version || "N/A") + "</td><td>" + loadbalancer.serial + "</td><td>" +
					loadbalancer.ip + "</td><td>" + pollingStatus + "</td></tr>";

			}

		}

		html += `
					</tbody>
				</table>`

		$("div#deviceoverview").html(html);
		showMainSection("deviceoverview");

	}

	function showReportLogs() {

		hideMainSection();
		activateMenuButton($("div#logsbutton"));
		$("div#mainholder").attr("data-activesection", "reportlogs");

		updateLocationHash();

		showMainSection("reportlogs");

	}

	function showHelp() {

		hideMainSection();
		activateMenuButton("div#helpbutton");
		$("div#mainholder").attr("data-activesection", "help");
		updateLocationHash();

		showMainSection("helpcontent")

	}


	function log(message, severity = null, date = null, time = null) {

		if (!date || !time) {
			var now = new Date();
			var dateArr = now.toISOString().split("T")

			if (!date) {
				date = dateArr[0];
			}

			if (!time) {
				time = dateArr[1].replace(/\.[0-9]+Z$/, "");
			}
		}

		var severityClass;

		switch (severity) {
			case "ERROR":
				severityClass = "logseverityerror";
				break;
			default:
				severityClass = "logseverityinfo";
		}

		$("table#reportlogstable tbody").prepend(
			"<tr><td class=\"reportlogdate\">" + date + "</td><td class=\"reportlogtime\">" + time + "</td><td class=\"" + severityClass + "\">" + severity + "</td><td>" + message + "</td></tr>"
		);

	}

	function toggleAdcLinks() {
		if (localStorage.getItem("showAdcLinks") === "false") {
			$(".adcLinkSpan").hide();
		} else {
			$(".adcLinkSpan").show();
		}
	}

	function toggleColumns() {

		$("#allbigips thead th input").each(function (index, tHeader) {

			var settingName = tHeader.getAttribute("data-setting-name");
			index += 1

			if (localStorage.getItem(settingName) === "false") {
				$(this).parent().hide();
				$("#allbigips > tbody > tr.virtualserverrow > td:nth-child(" + index + "\)").hide();
			} else {
				$(this).parent().show();
				$("#allbigips > tbody > tr.virtualserverrow > td:nth-child(" + index + "\)").show();
			}

		});

	}


	function updateLocationHash(pool = null, virtualServer = null) {

		var parameters = [];

		$('.search_entered').each(function () {
			if (asInitVals.indexOf(this.value) == -1) {
				parameters.push(this.name + "=" + this.value);
			}
		});

		var global_search = $('#allbigips_filter label input').val();
		if (global_search && global_search != "") {
			parameters.push("global_search" + '=' + global_search);
		}

		$("div.lightboxcontent:visible").each(function (i, e) {
			var type = $(this).attr("data-type");
			var objectName = $(this).attr("data-objectname");
			var loadbalancer = $(this).attr("data-loadbalancer");

			parameters.push(type + "=" + objectName + "@" + loadbalancer);
		});

		var activeSection = $("div#mainholder").attr("data-activesection");
		parameters.push("mainsection=" + activeSection);

		window.location.hash = parameters.join("&");

	}

	/******************************************************************************************************************************
		Expands all pool matches in the main table when searching
	******************************************************************************************************************************/


	function expandPoolMatches(resultset, searchstring) {

		if (localStorage.autoExpandPools !== "true") {
			$(resultset).children().children().filter("td:icontains('" + searchstring + "')").each(function () {
				if (this.className == "PoolInformation") {
					togglePool(this);
				}
			});
		}
	}

	/******************************************************************************************************************************
		Collapses all pool cells in the main table
	******************************************************************************************************************************/

	function hidePools() {
		if (localStorage.autoExpandPools === "true") {
			$(".AssociatedPoolsInfo").hide();
			$('.pooltablediv').show();
			$('.collapse').show();
			$('.expand').hide();
		} else {
			$('.pooltablediv').hide();
			$('.collapse').hide();
			$('.expand').show();
			$('.AssociatedPoolsInfo').show();
		}
	}

	/******************************************************************************************************************************
		Expands/collapses a pool cell based on the id
	******************************************************************************************************************************/

	function togglePool(e) {

		var id = $(e).attr('data-vsid');

		//Store the current window selection
		var selection = window.getSelection();

		//If no text is selected, go ahead and expand or collapse the pool
		if (selection.type != "Range") {
			if ($("#PoolInformation-" + id).is(":visible")) {
				$('#AssociatedPoolsInfo-' + id).show();
				$('#expand-' + id).show();
				$('#collapse-' + id).hide();
				$('#PoolInformation-' + id).hide();
			} else {
				$('#AssociatedPoolsInfo-' + id).hide();
				$('#expand-' + id).hide();
				$('#collapse-' + id).show();
				$('#PoolInformation-' + id).fadeIn(300);
			}
		}

	}

	/******************************************************************************************************************************
		Set the max width of the pool cells in order to make the member column align
	******************************************************************************************************************************/

	function setPoolTableCellWidth() {

		var maxwidth = 0

		$('.poolname').each(function (i, obj) {
			if (obj.offsetWidth > maxwidth) {
				maxwidth = obj.offsetWidth
			}
		});

		$('.poolname').each(function (i, obj) {
			if (obj.offsetWidth < maxwidth) {
				obj.style.width = maxwidth
			}
		});

		var maxwidth = 0
		$('.PoolMember').each(function (i, obj) {
			if (obj.offsetWidth > maxwidth) {
				maxwidth = obj.offsetWidth
			}
		});

		$('.PoolMember').each(function (i, obj) {
			if (obj.offsetWidth < maxwidth) {
				obj.style.width = maxwidth
			}
		});
	}

	/******************************************************************************************************************************
		Handles the highlight of content when searching
	******************************************************************************************************************************/

	function togglePoolHighlight(e) {
		if (e.style.backgroundColor == "") {
			$('.' + e.className).css('background-color', '#BCD4EC');
		} else {
			$('.' + e.className).css('background-color', '');
		}
	}


	/********************************************************************************************************************************************************************************************

		Functions related to showing the pool details lightbox

	********************************************************************************************************************************************************************************************/

	/**********************************************************************************************************************
		Translates the status and availability of a member to less cryptic text and returns a dictionary
	**********************************************************************************************************************/

	function translateStatus(member) {

		translatedstatus = {
			availability: "",
			enabled: "",
			realtime: ""
		};

		switch (member.availability) {
			case "AVAILABILITY_STATUS_GREEN":
				translatedstatus['availability'] = "<span class=\"memberup\">UP</span>";
				break;
			case "AVAILABILITY_STATUS_BLUE":
				translatedstatus['availability'] = "<span class=\"memberunknown\">UNKNOWN</span>";
				break;
			default:
				translatedstatus['availability'] = "<span class=\"memberdown\">DOWN</span>";
		}

		switch (member.enabled) {
			case "ENABLED_STATUS_ENABLED":
				translatedstatus['enabled'] = "<span class=\"memberenabled\">Enabled</span>";
				break;
			case "ENABLED_STATUS_DISABLED_BY_PARENT":
				translatedstatus['enabled'] = "<span class=\"memberdisabled\">Disabled by parent</span>";
				break;
			case "ENABLED_STATUS_DISABLED":
				translatedstatus['enabled'] = "<span class=\"memberdisabled\">Member disabled</span>";
				break;
			default:
				translatedstatus['enabled'] = "<span class=\"memberunknown\">Unknown</span>";
		}

		switch (member.realtimestatus) {
			case "up":
				translatedstatus["realtime"] = "<span class=\"memberup\">UP</span>";
				break;
			case "down":
				translatedstatus["realtime"] = "<span class=\"memberdown\">DOWN</span>";
				break;
			case "session_disabled":
				translatedstatus["realtime"] = "<span class=\"memberdisabled\">DISABLED</span>";
				break;
			default:
				translatedstatus["realtime"] = (member.realtimestatus || "N/A").toUpperCase();
		}

		return translatedstatus;

	}

	/**********************************************************************************************************************
		Put the cursor in the input field holding the command and selects the text
	**********************************************************************************************************************/

	function selectMonitorInpuText(e) {
		$(e).find("p input").focus();
		$(e).find("p input").select();
	}

	/**********************************************************************************************************************
		Takes a monitor send string as parameter and returns a request object
	**********************************************************************************************************************/

	function getMonitorRequestParameters(sendstring) {

		var sendstringarr = sendstring.split(" ");

		var request = {
			verb: "",
			uri: "",
			headers: []
		}

		request['verb'] = sendstringarr[0];
		request['uri'] = sendstringarr[1].replace('\\r\\n', '');

		var headers = sendstring.split('\\r\\n');

		if (headers.length > 1) {

			for (i = 1; i < headers.length; i++) {

				var header = headers[i];

				if (header.indexOf(":") >= 0) {
					if (header.split(":").length == 2) {
						request["headers"].push(header);
					}
				}
			}
		}

		return request
	}

	/**********************************************************************************************************************
		Shows the virtual server details light box
	**********************************************************************************************************************/

	function showVirtualServerDetails(virtualserver, loadbalancer) {

		var virtualservers = siteData.virtualservers;
		var matchingvirtualserver = "";

		//Find the matching pool from the JSON object
		for (var i in virtualservers) {
			if (virtualservers[i].name == virtualserver && virtualservers[i].loadbalancer == loadbalancer) {
				matchingvirtualserver = virtualservers[i]
			}
		}

		//If a pool was found, populate the pool details table and display it on the page
		if (matchingvirtualserver != "") {

			var html = "<div class=\"virtualserverdetailsheader\"><span>Virtual Server: " + matchingvirtualserver.name + "</span></div>";

			$("div#firstlayerdetailscontentdiv").attr("data-type", "virtualserver");
			$("div#firstlayerdetailscontentdiv").attr("data-objectname", matchingvirtualserver.name);
			$("div#firstlayerdetailscontentdiv").attr("data-loadbalancer", matchingvirtualserver.loadbalancer);

			switch (matchingvirtualserver.sourcexlatetype) {
				case "SRC_TRANS_NONE":
					var xlate = "None";
					break;
				case "SRC_TRANS_AUTOMAP":
					var xlate = "Automap";
					break;
				case "SRC_TRANS_SNATPOOL":
					var xlate = "SNAT Pool " + matchingvirtualserver.sourcexlatetype;
					break;
				case "OLDVERSION":
					var xlate = "N/A in Bigip versions prior to 11.3";
					break;
				default:
					var xlate = "Unknown";
			}

			var trafficGroup = matchingvirtualserver.trafficgroup || "N/A"
			var defaultPool = matchingvirtualserver.defaultpool || "N/A"
			var description = matchingvirtualserver.description || ""

			//Build the table and headers
			var table = '<table class="virtualserverdetailstablewrapper">';
			table += '	<tbody>';

			//First row containing simple properties in two cells which in turn contains subtables
			table += '		<tr>';
			table += '			<td>';

			//Subtable 1
			table += '				<table class="virtualserverdetailstable">';
			table += '					<tr><th>Name</th><td>' + matchingvirtualserver.name + '</td></tr>';
			table += '					<tr><th>IP:Port</th><td>' + matchingvirtualserver.ip + ':' + matchingvirtualserver.port + '</td></tr>';
			table += '					<tr><th>Default pool</th><td>' + renderPool(loadbalancer,defaultPool, 'display') + '</td></tr>';
			table += '					<tr><th>Traffic Group</th><td>' + trafficGroup + '</td></tr>';
			table += '					<tr><th>Description</th><td>' + description + '</td></tr>';
			table += '				</table>';
			table += '			</td>';

			//Subtable 2
			table += '			<td>';
			table += '				<table class="virtualserverdetailstable">';
			table += '					<tr><th>Client SSL Profile</th><td>' + matchingvirtualserver.sslprofileclient + '</td></tr>';
			table += '					<tr><th>Server SSL Profile</th><td>' + matchingvirtualserver.sslprofileserver + '</td></tr>';
			table += '					<tr><th>Compression Profile</th><td>' + matchingvirtualserver.compressionprofile + '</td></tr>';
			table += '					<tr><th>Persistence Profile</th><td>' + matchingvirtualserver.persistence + '</td></tr>';
			table += '					<tr><th>Source Translation</th><td>' + xlate + '</td></tr>';
			table += '				</table>';
			table += '			</td>';
			table += '		</tr>';
			table += '	</tbody>';
			table += '</table>';
			table += '<br>';

			table += '<table class="virtualserverdetailstable">';
			table += '	<tr><th>Current Connections</th><th>Maximum Connections</th><th>5 second average CPU usage</th><th>1 minute average CPU usage</th>' +
						'<th>5 minute average CPU usage</th></tr>';
			table += '	<tr><td>' + matchingvirtualserver.currentconnections + '</td><td>' + matchingvirtualserver.maximumconnections + '</td><td>' +
					matchingvirtualserver.cpuavg5sec + '</td><td>' + matchingvirtualserver.cpuavg1min + '</td><td>' + matchingvirtualserver.cpuavg5min + '</td></tr>';
			table += '</table>';

			table += '<br>'

			if (ShowiRules == true) {
				if (matchingvirtualserver.irules.length > 0 && ShowiRules) {
					//Add the assigned irules
					table += '<table class="virtualserverdetailstable">';

					if (ShowiRuleLinks) {
						table += '	<tr><th>iRule name</th><th>Data groups</th></tr>';
					} else {
						table += '	<tr><th>iRule name</th></tr>';
					}

					for (var i in matchingvirtualserver.irules) {

						// If iRules linking has been set to true show iRule links
						// and parse data groups
						if (ShowiRuleLinks) {

							var iruleobj = getiRule(matchingvirtualserver.irules[i], loadbalancer);

							if (Object.keys(iruleobj).length === 0) {
								table += '	<tr><td>' + matchingvirtualserver.irules[i] + '</td><td>N/A (empty rule)</td></tr>';
							} else {

								var datagroupdata = [];
								if (iruleobj.datagroups && iruleobj.datagroups.length > 0) {
									iruleobj.datagroups.forEach((datagroup) => {
										name = datagroup.split("/")[2];

										if (ShowDataGroupLinks) {
											datagroupdata.push('<a href="Javascript:showDataGroupDetails(\'' + datagroup + '\', \'' + loadbalancer + '\')">' + name + '</a>');
										} else {
											datagroupdata.push(name)
										}
									});
								} else {
									datagroupdata.push("N/A");
								}

								table += '	<tr><td>' + renderRule(loadbalancer, iruleobj.name, 'display') + '</td><td>' + datagroupdata.join("<br>") + '</td></tr>';
							}
						} else {
							table += '	<tr><td>' + matchingvirtualserver.irules[i] + '</td></tr>';
						}
					}

					table += '</table>';
				}
			}

			html += table;

		} else {
			var html = `<div id="objectnotfound">
				<h1>No matching Virtual Server was found</h1>

				<h4>What happened?</h4>
				When clicking the report it will parse the JSON data to find the matching Virtual Server and display the details. However, in this case it was not able to find any matching Virtual Server.

				<h4>Possible reason</h4>
				This might happen if the report is being updated as you navigate to the page.
				If you see this page often, please report a bug <a href="https://devcentral.f5.com/codeshare/bigip-report">DevCentral</a>.

				<h4>Possible solutions</h4>
				Refresh the page and try again.

			</div>`
		}

		$('a#closefirstlayerbutton').text("Close virtual server details");
		$("#firstlayerdetailscontentdiv").html(html);
		$("#firstlayerdiv").fadeIn(updateLocationHash);
		toggleAdcLinks();

	}

	/**********************************************************************************************************************
		Returns a matching irules object from the irules json data
	**********************************************************************************************************************/

	function getiRule(irule, loadbalancer) {

		var irules = siteData.irules;
		var matchingirule = {};

		//Find the matching irule from the JSON object
		for (var i in irules) {
			if (irules[i].name == irule && irules[i].loadbalancer == loadbalancer) {
				matchingirule = irules[i];
			}
		}

		return matchingirule;
	}

	/**********************************************************************************************************************
		Shows the irule details light box
	**********************************************************************************************************************/

	function showiRuleDetails(irule, loadbalancer) {

		//Get the rule object from the json file
		matchingirule = getiRule(irule, loadbalancer)

		//If an irule was found, prepare the data to show it
		if (matchingirule != "") {

			//Populate the header
			var html = "<div class=\"iruledetailsheader\"><span>iRule: " + matchingirule.name + "</span></div>";

			$("div#secondlayerdetailscontentdiv").attr("data-type", "irule");
			$("div#secondlayerdetailscontentdiv").attr("data-objectname", matchingirule.name);
			$("div#secondlayerdetailscontentdiv").attr("data-loadbalancer", matchingirule.loadbalancer);

			//Save the definition to a variable for some classic string mangling
			var definition = matchingirule.definition

			//Replace those tags with to be sure that the content won't be interpreted as HTML by the browser
			definition = definition.replace(/</g, "&lt;").replace(/>/g, "&gt;")

			//Check if data group links are wanted. Parse and create links if that's the base
			if (ShowDataGroupLinks == true) {
				matchingirule.datagroups.forEach((dg) => {
					// rule might not include partition which causes the replace to fail
					var opt=dg.replace(/\/.*\//,'($&|\\b)+');
					// prepare a regexp to replace all instances
					var regexp = new RegExp("(" + opt + ")\\b", "gi");
					// Prepare the link
					var link = '<a href="Javascript:showDataGroupDetails(\'' + dg + '\', \'' + loadbalancer + '\')">$1</a>';
					// Do the actual replacement
					definition = definition.replace(regexp, link);
				})
				matchingirule.pools.forEach((pool) => {
					// rule might not include partition which causes the replace to fail
					var opt=pool.replace(/\/.*\//,'($&|\\b)+');
					// prepare a regexp to replace all instances
					var regexp = new RegExp("(" + opt + ")\\b", "gi");
					// Prepare the link
					var link = '<a href="Javascript:showPoolDetails(\'' + pool + '\', \'' + loadbalancer + '\')">$1</a>';
					// Do the actual replacement
					definition = definition.replace(regexp, link);
				})
			}

			//Prepare the div content
			html += `<table class="bigiptable">
						<thead>
							<tr><th>iRule definiton</th></tr>
						</thead>
						<tbody>
						<tr><td><pre class="sh_tcl">` + definition + `</pre></td></tr>
						</tbody>
					</table>`

		}

		//Add the close button to the footer
		$("a#closesecondlayerbutton").text("Close irule details");
		//Add the div content to the page
		$("#secondlayerdetailscontentdiv").html(html);
		/* redo syntax highlighting */
		sh_highlightDocument('js/', '.js');
		//Show the div
		$("#secondlayerdiv").fadeIn(updateLocationHash);
	}


	/**********************************************************************************************************************
		Returns a matching data group object from the data group json data
	**********************************************************************************************************************/

	function getDataGroup(datagroup, loadbalancer) {

		var datagroups = siteData.datagroups;
		var matchingdatagroup = "";

		//Find the matching data group from the JSON object
		for (var i in datagroups) {
			if (datagroups[i].name == datagroup && datagroups[i].loadbalancer == loadbalancer) {
				matchingdatagroup = datagroups[i];
			}
		}

		return matchingdatagroup;
	}


	/**********************************************************************************************************************
		Displays a data group in a lightbox
	**********************************************************************************************************************/

	function showDataGroupDetails(datagroup, loadbalancer) {

		//Get a matching data group from the json data
		matchingdatagroup = getDataGroup(datagroup, loadbalancer)

		if (siteData.datagroupdetailsTable) {
			siteData.datagroupdetailsTable.destroy();
		}

		//If a pool was found, populate the pool details table and display it on the page
		if (matchingdatagroup != "") {

			$("div#secondlayerdetailscontentdiv").attr("data-type", "datagroup");
			$("div#secondlayerdetailscontentdiv").attr("data-objectname", matchingdatagroup.name);
			$("div#secondlayerdetailscontentdiv").attr("data-loadbalancer", matchingdatagroup.loadbalancer);

			var html = "<div class=\"datagroupdetailsheader\">";
			html += "<span>Data group: " + matchingdatagroup.name + "</span><br>"
			html += "<span>Load Balancer: " + loadbalancer + "</span><br>";
			html += "<span class=\"dgtype\">Type: " + matchingdatagroup.type + "</span>";
			html += "</div>";

			html += `<table id="datagroupdetailsTable" class="datagrouptable">
						<thead>
							<tr>
								<th class="keyheader">Key</th>
								<th class="valueheader">Value</th>
							</tr>
						</thead>
						<tbody>`;

			if (Object.keys(matchingdatagroup).length == 0) {
				html += "<tr class=\"emptydg\"><td colspan=\"2\">Empty data group</td></tr>";
			} else {
				for (var i in matchingdatagroup.data) {
					html += "<tr><td class=\"dgkey\">" + i + "</td><td class=\"dgvalue\">" + matchingdatagroup.data[i] + "</td></tr>";
				}
			}

			html += '</tbody></table>'

			$("#secondlayerdetailscontentdiv").html(html);

			siteData.datagroupdetailsTable = $('table#datagroupdetailsTable').DataTable({
				"autoWidth": false,
				"pageLength": 10,
				"order": [],
				"language": {
					"search": "Search all columns:"
				},
				"dom": 'frtilp',
				"lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
			});

		} else {
			$("#secondlayerdetailscontentdiv").html('');
		}

		$("a#closesecondlayerbutton").text("Close data group details");
		$("#secondlayerdiv").fadeIn(updateLocationHash);

	}


	/**********************************************************************************************************************
		Shows the pool details light box
	**********************************************************************************************************************/

	function showPoolDetails(pool, loadbalancer, layer = "first") {

		var pools = siteData.pools;
		var matchingpool = siteData.poolsMap.get(loadbalancer + ':' + pool);

		updateLocationHash(pool + "@loadbalancer", null)

		//If a pool was found, populate the pool details table and display it on the page
		if (matchingpool != "") {

			//Build the table and headers
			$("#" + layer + "layerdetailscontentdiv").attr("data-type", "pool");
			$("#" + layer + "layerdetailscontentdiv").attr("data-objectname", matchingpool.name);
			$("#" + layer + "layerdetailscontentdiv").attr("data-loadbalancer", matchingpool.loadbalancer);

			var html = "<div class=\"pooldetailsheader\"><span>Pool: " + matchingpool.name + "</span></div>";

			var table = `
			<table class="pooldetailstable">
				<thead>
					<tr><th>Description</th><th>Load Balancing Method</th><th>Action On Service Down</th><th>Allow NAT</th><th>Allow SNAT</th></tr>
				</thead>
				<tbody>
					<tr><td>` + (matchingpool.description || "") + "</td><td>" + matchingpool.loadbalancingmethod + "</td><td>" +
					matchingpool.actiononservicedown + "</td><td>" + matchingpool.allownat + "</td><td>" + matchingpool.allowsnat + `</td></tr>
				</tbody>
				</table>
				<br>
				<div class="monitordetailsheader">Member details</div>
					<table class="pooldetailstable">
					<thead><tr><th>Member Name</th><th>Member IP</th><th>Port</th><th>Priority Group</th><th>Connections</th>
					<th>Max Connections</th><th>Member Availability</th><th>Enabled</th><th>Member Status Description</th><th>Realtime Availability</th></tr></thead><tbody>`

			poolmonitors = matchingpool.monitors

			matchingmonitors = [];

			var monitors = siteData.monitors;

			for (var i in poolmonitors) {

				for (var x in monitors) {
					if (monitors[x].name == poolmonitors[i] && monitors[x].loadbalancer == loadbalancer) {
						matchingmonitors.push(monitors[x]);
					}
				}
			}

			var members = matchingpool.members;

			for (var i in members) {

				var member = members[i];
				var memberstatus = translateStatus(member);

				table += "<tr><td>" + member.name + "</td><td>" + member.ip + "</td><td>" + member.port + "</td><td>" + member.priority + "</td><td>" +
					member.currentconnections + "</td><td>" + member.maximumconnections + "</td><td>" + memberstatus["availability"] + "</td><td>" +
					memberstatus["enabled"] + "</td><td>" + member.status + "</td><td>" + memberstatus.realtime + "</td></tr>";

			}

			table += `</tbody></table>
					  <br>`

			if (matchingmonitors.length > 0) {

				table += "<div class=\"monitordetailsheader\">Assigned monitors</div>";

				for (var i in matchingmonitors) {

					matchingmonitor = matchingmonitors[i];

					matchingmonitor.receivestring = matchingmonitor.receivestring.replace('<', '&lt;').replace('>', '&gt;');

					table += `
							<table class="monitordetailstable">
								<thead><tr><th colspan=2>` + matchingmonitor.name + `</th></thead>
								<tbody>
									<tr><td class="monitordetailstablerowheader"><b>Type</td><td>` + matchingmonitor.type + `</b></td></tr>
									<tr><td class="monitordetailstablerowheader"><b>Send string</td><td>` + matchingmonitor.sendstring + `</b></td></tr>
									<tr><td class="monitordetailstablerowheader"><b>Receive string</b></td><td>` + matchingmonitor.receivestring + `</td></tr>
									<tr><td class="monitordetailstablerowheader"><b>Interval</b></td><td>` + matchingmonitor.interval + `</td></tr>
									<tr><td class="monitordetailstablerowheader"><b>Timeout</b></td><td>` + matchingmonitor.timeout + `</td></tr>
								</table>

					<table class="membermonitortable">
						<thead>
							<tr><th>Member Name</th><th>Member ip</th><th>Member Port</th><th>HTTP Link</th><th>Curl Link</th><th>Netcat Link</th>
						</thead>
						<tbody>`

					for (var x in members) {

						member = members[x];
						memberstatus = translateStatus(member);

						var protocol = "";

						if (matchingmonitors[i].type.indexOf("HTTPS") >= 0) {
							protocol = "https";
						} else if (matchingmonitors[i].type.indexOf("HTTP") >= 0) {
							protocol = "http";
						}

						if (protocol != "") {

							sendstring = matchingmonitors[i].sendstring;

							requestparameters = getMonitorRequestParameters(sendstring)
							globheader = requestparameters;
							if (requestparameters["verb"] === "GET" || requestparameters["verb"] === "HEAD") {

								var curlcommand = "curl";

								if (requestparameters["verb"] === "HEAD") {
									curlcommand += " -I"
								}

								for (var x in requestparameters["headers"]) {
									header = requestparameters["headers"][x];
									headerarr = header.split(":");
									headername = headerarr[0].trim();
									headervalue = headerarr[1].trim();

									curlcommand += " --header &quot;" + headername + ": " + headervalue + "&quot;";
								}

								curlcommand += " " + protocol + "://" + member.ip + ":" + member.port + requestparameters["uri"];

								var netcatcommand = "echo -ne \"" + sendstring + "\" | nc " + member.ip + " " + member.port;

								var url = protocol + "://" + member.ip + ":" + member.port + requestparameters["uri"];

								var httplink = '<a href="javascript:void(0);" target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)"' +
									' data-type="http">HTTP<p>HTTP Link (CTL+C)<input id="curlcommand" class="monitorcopybox" type="text" value="' + url + '"></p></a>';

								var curllink = '<a href="javascript:void(0);" target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)"' +
									' data-type="curl">Curl<p>Curl command (CTRL+C)<input id="curlcommand" class="monitorcopybox" type="text" value="' + curlcommand + '"></p></a>';

								var netcatlink = '<a href="javascript:void(0); target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)"' +
									' data-type="netcat">Netcat<p>Netcat command (CTRL+C)<input id="curlcommand" class="monitorcopybox" type="text" value=\'' + netcatcommand + '\'></p></a>';

								table += "<tr><td>" + member.name + "</td><td>" + member.ip + "</td><td>" + member.port + "</td><td>" + httplink + "</td><td>" + curllink + "</td><td>" + netcatlink + "</td></tr>";

							} else {
								table += "<tr><td>" + member.name + "</td><td>" + member.ip + "</td><td>" + member.port + "</td><td>N/A</td><td>N/A</td><td>N/A</td></tr>";
							}
						} else {
							table += "<tr><td>" + member.name + "</td><td>" + member.ip + "</td><td>" + member.port + "</td><td>N/A</td><td>N/A</td><td>N/A</td></tr>";
						}
					}

					table += `
							</table>
							<br>`

				}


				table += '</tbody></table>';
			}

			html += table;

		} else {
			var table = `<div id="objectnotfound">
				<h1>No matching Pool was found</h1>

				<h4>What happened?</h4>
				When clicking the report it will parse the JSON data to find the matching pool and display the details.
				However, in this case it was not able to find any matching pool.

				<h4>Possible reason</h4>
				This might happen if the report is being updated as you navigate to the page. If you see this page often,
				please report a bug <a href="https://devcentral.f5.com/codeshare/bigip-report">DevCentral</a>.

				<h4>Possible solutions</h4>
				Refresh the page and try again.

			</div>`
		}

		$("a#close" + layer + "layerbutton").text("Close pool details");
		$("#" + layer + "layerdetailscontentdiv").html(html);
		$("#" + layer + "layerdiv").fadeIn(updateLocationHash);
	}

	function exportDeviceData() {

		var loadbalancers = siteData.loadbalancers;
		var loadbalancersForExport = [];


		// Loop through the load balancers while anonymizing the data
		for (var i in loadbalancers) {

			loadbalancer = loadbalancers[i];
			var newLB = {};

			for (p in loadbalancer) {

				switch (p) {
					case "name":
						newLB.name = "LB" + i;
						break;
					case "serial":
						newLB.serial = "XXXX-YYYY";
						break;
					case "ip":
						newLB.ip = "10.0.0." + i;
						break;
					case "statusvip":

						var statusvip = {}
						statusvip.url = "";
						statusvip.working = null;
						statusvip.state = null;

						newLB.statusvip = statusvip;

					default:
						newLB[p] = loadbalancer[p];
				}
			}

			loadbalancersForExport.push(newLB);
		}

		downLoadTextFile(JSON.stringify(loadbalancersForExport, null, 4), "loadbalancers.json");

		// Loop through the device groups while anonymizing the data
		var deviceGroups = siteData.deviceGroups;
		var deviceGroupsForExport = [];

		for (var d in deviceGroups) {

			deviceGroup = deviceGroups[d];
			var newDeviceGroup = {};

			newDeviceGroup.name = "DG" + d;
			newDeviceGroup.ips = [];

			for (i in deviceGroup.ips) {
				newDeviceGroup.ips.push("10.0.0." + i);
			}

			newDeviceGroup.statusvip;

		}

		deviceGroupsForExport.push(newDeviceGroup);

		console.log();

		downLoadTextFile(JSON.stringify(deviceGroupsForExport, null, 4), "devicegroups.json");
	}


	function loadPreferences() {

		var defaultPreferences = siteData.defaultPreferences;

		for (var k in defaultPreferences) {
			if (localStorage.getItem(k) === null){ localStorage.setItem(k, defaultPreferences[k]) }
		}

	}

	function getPool(pool, loadbalancer) {
		return siteData.poolsMap.get(loadbalancer + ':' + pool);
	}

	function getVirtualServer(vs, loadbalancer) {

		return siteData.virtualservers.find(function (o) {
			return o.name === vs && o.loadbalancer === loadbalancer;
		}) || false;

	}

	function getLoadbalancer(loadbalancer) {

		return siteData.loadbalancers.find(function (o) {
			return o.name === loadbalancer;
		}) || false;

	}

	// a and b are javascript Date objects
	function dateDiffInDays(a, b) {

		var _MS_PER_DAY = 1000 * 60 * 60 * 24;
		// Discard the time and time-zone information.
		var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
		var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

		return Math.floor((utc2 - utc1) / _MS_PER_DAY);
	}

	function activateMenuButton(b) {
		$("div.menuitem").removeClass("menuitemactive");
		$(b).addClass("menuitemactive");
	}

	function generateCSV() {

		var csv = "name;description;ip;port;sslprofile;compressionprofile;persistenceprofile;availability;enabled;" +
			"currentconnections;cpuavg5sec;cpuavg1min;cpuavg5min;defaultpool;associated-pools;loadbalancer\n";


		var getMembers = function (pool) {

			var returnStr = ""

			var first = true;
			var firstmember = true;

			for (var m in pool.members) {
				if (!firstmember){ returnStr += ", "} else { firstmember = false;}
				var member = pool.members[m]
				returnStr += member.name + ":" + member.port + " (" + member.ip + ":" + member.port + ")";
			}

			return returnStr;
		}


		$("#allbigips tbody tr.virtualserverrow").each(function () {

			var line = "";

			vsname = $(this).find("td.virtualServerCell a").attr("data-originalvirtualservername") || "N/A (Orphan pool)"

			if (vsname !== "N/A (Orphan pool)") {

				var loadbalancer = $(this).find("td.virtualServerCell a").attr("data-loadbalancer");

				var vs = getVirtualServer(vsname, loadbalancer)

				var line = vs.name + ";" + (vs.description || "") + ";" + (vs.ip || "") + ";" + (vs.port || "") + ";" + (vs.sslprofileclient || "None") + ";" +
					(vs.compressionprofile || "None") + ";" + (vs.persistenceprofile || "None") + ";" + vs.availability + ";" + vs.enabled + ";" + vs.currentconnections + ";" +
					vs.cpuavg5sec + ";" + vs.cpuavg1min + ";" + vs.cpuavg5min + ";" + (vs.defaultpool || "None") + ";";

				var firstpool = true;

				for (var p in vs.pools) {

					if (!firstpool){ line += "|"} else { firstpool = false }

					var pool = getPool(vs.pools[p], vs.loadbalancer);
					line += pool.name + ": ";

					line += getMembers(pool);
				}

				line += ";" + vs.loadbalancer;


			} else {

				var poolname = $(this).find("td.poolname a").attr("data-originalpoolname");
				var loadbalancer = $(this).find("td.poolname a").attr("data-loadbalancer");

				line = "N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);" +
					"N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);";

				pool = getPool(poolname, loadbalancer);

				line += pool.name + ": ";
				line += getMembers(pool);
			}

			csv += line + "\n";

		})

		return (csv);
	}

	function downLoadTextFile(data, fileName) {

		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
		element.setAttribute('download', fileName);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);

	}

	function downloadCSV() {

		var text = generateCSV();

		var d = new Date();

		var year = d.getFullYear();
		var month = d.getMonth();
		var day = d.getDay();

		if(month < 10){ month = "0" + month }
		if(day < 10){ day = "0" + day }

		var fileName = year + "-" + month + "-" + day + "-bigipreportexport.csv";

		downLoadTextFile(text, fileName);

	}
