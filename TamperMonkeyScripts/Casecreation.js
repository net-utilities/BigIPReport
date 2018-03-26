// ==UserScript==
// @name         F5 Support case tweaker
// @version      0.1
// @description  Adds your devices to the F5 support page
// @author       Patrik Jonsson
// @match        https://support.f5.com/csp/my-support/service-request*
// @grant        GM_xmlhttpRequest
// @connect      linuxworker.j.local
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==


/*
	Documentation of the options

	hideModulesByDefault:
	Hides modules you don't have installed. Please report if you see any missing modules.

	hideVersionsByDefault:
	Hides versions that you don't have.

	defaultSeverityEnabled:
	If you want to set the default severity.

	defaultSeverity:
	What you want to set the default severity to.

	defaultWorkingBeforeToNo:
	Set "Was this working before?" to no by default.

	defaultProblemWithVirtualServerToNo:
	Set "Is the problem related to a virtual server?" to no by default.

	preferredContactMethod:
	Your preferred method of contact. Possible options are "Phone", "Mobile", "Email".

	timeZone:
	Which item in the time zone list that you want to use as default.
	The values in the list does not really follow a standard, so this was the "best" way.

	Examples:
	1 = First timezone in the drop down ("GMT -12:00) GMT-12:00")
	2 = Second timezone in the drop down ("GMT -11:00) GMT-11:00")
*/

(function() {
	'use strict';

	var options = {
		"hideModulesByDefault": true,
		"hideVersionsByDefault": true,
		"defaultSeverityEnabled": true,
		"defaultSeverity": 4,
		"defaultWorkingBeforeToNo": true,
		"defaultProblemWithVirtualServerToNo": true,
		"preferredContactMethod": "Phone",
		"timeZone": 8
	};

	var bigipReportURL = "https://linuxworker.j.local/json/loadbalancers.json";

	// Get the load balancer objects from BigIP Report
	GM_xmlhttpRequest({
		method: "GET",
		url: bigipReportURL,
		onload: function (response) {
			if (response.status == 200) {
				var devices = JSON.parse(response.responseText);
				var modules = getModules(devices);
				var availableVersions = getVersions(devices);
				var deviceToSerialSelectionHTML = getDeviceSelectionDropDown(devices);

				if(options.hideModulesByDefault){
					filterModuleSelection(modules);
				}

				if(options.hideVersionsByDefault){
					filterVersionSelection(availableVersions);
				}

				var secondPageTimer = setInterval(function(){
					var serialNumberInput = $("input#serialNumberInput");
					if(serialNumberInput.is(":visible")){
						serialNumberInput.css("display", "inline").css("width", "20%");
						serialNumberInput.after(deviceToSerialSelectionHTML);

						var deviceDropDown = $("select#deviceToSerial");
						deviceDropDown.on("change", function(){
							serialNumberInput.val(deviceDropDown.val());

							// Somehow jQuery binds the objects to this when declaring them.
							// Native JS was the only thing working for some reason.

							triggerEvent("change", "input#serialNumberInput");
							triggerEvent("blur", "input#serialNumberInput");
						});

						if(options.defaultSeverityEnabled){
							$("select#severitySelect").val(options.defaultSeverity);
							triggerEvent("change", "select#severitySelect");
						}

						if(options.defaultWorkingBeforeToNo){
							$("input#workingBeforeNo").click();
						}

						if(options.defaultProblemWithVirtualServerToNo){
							$("input#virtualServerNo").click();
						}

						clearInterval(secondPageTimer);
					}
				}, 500);

				var thirdPageTimer = setInterval(function(){
					$("select#contactMethodOfContact").val(options.preferredContactMethod);
					triggerEvent("change", "select#contactMethodOfContact");

					$("select#contactTimezoneSelect option").eq(options.timeZone).attr("selected", true);
					triggerEvent("change", "select#contactTimezoneSelect");
				}, 500);
			}
		},
		error: function(e){
			console.log(e);
		}
	});
})();

function triggerEvent(e, s){
	"use strict";

	var event = document.createEvent('HTMLEvents');
	event.initEvent(e, true, true);
	document.querySelector(s).dispatchEvent(event);
}


function filterModuleSelection(configuredModules){
	"use strict";
	var moduleFilterInterval = setInterval(function(){
		var productSelect = $("select#productSelect");

		if(productSelect.find("option").length > 10){
			productSelect.find("option:not(:selected)").each(function(){
				if(configuredModules.indexOf($(this).attr("label")) === -1){
					$(this).hide();
				}
			});

			productSelect.after("<a href=\"javascript:void(0);\" id=\"showAllModules\">Show all modules</a>");
			$("a#showAllModules").on("click", function(){
				productSelect.find("option:hidden").show();
			});

			clearInterval(moduleFilterInterval);
		}
	}, 500);
}

function filterVersionSelection(availableVersions){
	"use strict";

	var versionSelect = $("select#versionSelect");

	var filterVersionInterval = setInterval(function(){

		if(versionSelect.find("option").length > 2){

			versionSelect.find("option:hidden").show();

			versionSelect.find("option:not(:selected)").each(function(){
				if(availableVersions.indexOf($(this).attr("label")) === -1){
					$(this).hide();
				}
			});

			var showAllVersions = $("a#showAllVersions")

			if(showAllVersions.length === 0){

				versionSelect.after("<a href=\"javascript:void(0);\" id=\"showAllVersions\">Show all versions</a>");
				showAllVersions.on("click", function(){
					versionSelect.find("option:hidden").show();
				});

				$("select#productSelect").on("change", function(){
					filterVersionSelection(availableVersions);
				});
			}
			clearInterval(filterVersionInterval);
		}
	}, 500);
}

// Get's a list of all configured modules from your load balancers
function getModules(devices){
	"use strict";

	var prefix = "BIG-IP ";
	var veSuffix = " VE";

	var configuredModules = [];

	devices.map(function(d){
		for(var m in d.modules){

			var module = prefix + m;
			var veModule = module + veSuffix;

			if(d.category === "Virtual Edition" && configuredModules.indexOf(veModule) === -1){

				configuredModules.push(veModule);

				// Add alias for GTM
				if(m === "GTM"){
					configuredModules.push("BIG-IP DNS VE");
				}
			}

			if(configuredModules.indexOf(module) === -1){

				configuredModules.push(module);

				// Add alias for GTM
				if(m === "GTM"){
					configuredModules.push("BIG-IP DNS");
				}
			}
		}
	});
	return configuredModules;
}

// Get's a list of all configured modules from your load balancers
function getVersions(devices){
	"use strict";

	var availableVersions = [];

	devices.map(function(d){
		if(availableVersions.indexOf(d.version === -1)){
			availableVersions.push(d.version);
		}
	});

	return availableVersions;
}

function getDeviceSelectionDropDown(devices){
	"use strict";

	var deviceDict = {};

	devices.map(function(d){
		if(d.name){
			deviceDict[d.name.toUpperCase()] = d.serial;
		}
	});

	var deviceNames = [];
	for(var n in deviceDict){
		deviceNames.push(n);
	}

	deviceNames.sort();

	var select = `<select style="margin-left:10px;" id="deviceToSerial">
					 <option value="">Select a load balancer</option>`;

	for(var n in deviceNames){
		select += "<option value=\"" + deviceDict[deviceNames[n]] + "\">" + deviceNames[n] + "</option>";
	}

	select += "</select>";

	return select;
}
