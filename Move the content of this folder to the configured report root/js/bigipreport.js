	/*************************************************************************************************************************************************************************************

		BigIP-report Javascript

	*************************************************************************************************************************************************************************************/

	var asInitVals = new Array();

	var siteData = {};
	var oTable;

	/*************************************************************************************************************************************************************************************

		Waiting for all pre-requisite objects to load

	*************************************************************************************************************************************************************************************/

	$(window).load(function() {
		// Animate loader off screen
	    
	    //Prevent caching of ajax requests
	    $(document).ready(function() {
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
				If you're running the report on IIS7.x or older it's not able to handle Json files without a tweak to the MIME files settings.<br><a href="https://loadbalancing.se/bigip-report/#The_script_reports_missing_JSON_files">Detailed instructions are available here</a>.<br>

				<h4>File permissions or network issues</h4>
				Script has had issues when creating the files due to lack of permissions or network issues.<br>
				Double check your script execution logs, web folder content and try running the script manually.<br>

				<h3>Please note that while you can close these details, the report won't function as it should until these problems has been solved.</h3>

			</div>`
		);

		$("#firstlayerdetailsfooter").html('<a class="lightboxbutton" href="javascript:void(0);" onClick="javascript:$(\'.lightbox\').fadeOut()">Close error details</a>');


		let addJSONLoadingFailure = function(jqxhr){
			
			//Remove the random query string not to confuse people
			let url = this.url.split("?")[0];

			$("#jsonloadingerrordetails").append(`
					<div class="failedjsonitem"><span class="error">Failed object:</span><span class="errordetails"><a href="` + url + `">` + url + `</a></span>
					<br><span class="error">Status code:</span><span class="errordetails"> ` + jqxhr.status + `</span>
					<br><span class="error">Reason:</span><span class="errordetails"> ` + jqxhr.statusText + "</div>"
			)

			$("#firstlayerdiv").fadeIn();
		}

		$.when(
			// Get pools
			$.getJSON("./json/pools.json", function(result){
				siteData.pools = result;
			}).fail(addJSONLoadingFailure),
			//Get the monitor data
			$.getJSON("./json/monitors.json", function(result){
				siteData.monitors = result;
			}).fail(addJSONLoadingFailure),
			//Get the virtual servers data
			$.getJSON("./json/virtualservers.json", function(result){
				siteData.virtualservers = result;
			}).fail(addJSONLoadingFailure),
			//Get the irules data
			$.getJSON("./json/irules.json", function(result){
				siteData.irules = result;
			}).fail(addJSONLoadingFailure),
			//Get the datagroup list data
			$.getJSON("./json/datagrouplists.json", function(result){
				siteData.datagrouplists = result;
			}).fail(addJSONLoadingFailure),
			$.getJSON("./json/loadbalancers.json", function(result){
				siteData.loadbalancers = result;
			}).fail(addJSONLoadingFailure),
			$.getJSON("./json/defaultpreferences.json", function(result){
				siteData.defaultPreferences = result;
			}).fail(addJSONLoadingFailure)
		).then(function() {

			/********************************************************************************************************************************************************************************************

				All pre-requisite things has loaded

			********************************************************************************************************************************************************************************************/

			/*************************************************************************************************************

				Load preferences

			**************************************************************************************************************/

			loadPreferences();

			/*************************************************************************************************************
			
				Test the status VIPs

			*************************************************************************************************************/	
			
			initializeStatusVIPs();

			/*************************************************************************************************************
			
				This attaches an on click event to all Poolinformation cells (the cell in the main data table 
				containing pool information that makes sure that the pool details lightbox is shown when 
				clicking on the	pool details cell without the cell content collapsing
				
			**************************************************************************************************************/
			
			
			$(".PoolInformation").click(function(e) {
				if($(e.target).attr("class") != "tooltip"){
					togglePool(e.target);
				}
			})
			
			
			
			/*************************************************************************************************************
			
				Initiate data tables, add a search all columns header and save the standard table header values
			
			**************************************************************************************************************/
			
			$("thead input.search_init").each( function (i) {
					asInitVals[i] = this.value;
			} );
			
			
			oTable = $('#allbigips').DataTable( {

				"iDisplayLength": 15,
				"oLanguage": {
					"sSearch": "Search all columns:"
				},
				"dom": '<"top">frt<"bottom"ilp><"clear">',
				"lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]]
			} );
			
			
			/*************************************************************************************************************
			
				Attaches a function to the main data table column filters that 
				removes the text from the input windows when clicking on them
				and adds the possibility to filter per column
			
			**************************************************************************************************************/
			
			$("thead input").focus( function () {
				if ( this.className == "search_init" )
				{
					this.className = "search_entered";
					this.value = "";
				}
			} );
			
			//Prevents sorting the columns when clicking on the sorting headers
			$('.search_init').on('click', function(e){
			   e.stopPropagation();    
			});
			
			$('.search_entered').on('click', function(e){
			   e.stopPropagation();    
			});
			
			
			$("thead input").blur( function (i) {
				if ( this.value == "" ){
					this.className = "search_init";
					this.value = asInitVals[$("thead input").index(this)];
				}
			} );
			
			/* Initiate the syntax highlighting for irules*/
			sh_highlightDocument('./js/', '.js');
			
			/*************************************************************************************************************
			
				This section inserts the reset filters button and it's handlers
			
			**************************************************************************************************************/			

			$("#allbigips_filter").append("<a id=\"resetFiltersButton\" class=\"resetFiltersButton\" href=\"javascript:void(0);\">Reset filters</a>")

			$("#resetFiltersButton").on("click", function(){

				$("input[type='search']").val("");

				$("thead input").each(function(){
					this.className = "search_init";
					this.value = asInitVals[$("thead input").index(this)];
				});

	 			oTable.search('')
	 				.columns().search('')
	 				.draw();
			});


			/*************************************************************************************************************
			
				This section inserts a share link
			
			**************************************************************************************************************/	
			
			$("#allbigips_filter").append('<a href="javascript:void(0);" onMouseClick="" onMouseOver="javascript:showShareLink()" class="sharelink">Share search<p>CTRL + C to copy<br><input id="sharelink" value=""></p></a>');
			
			/*************************************************************************************************************
			
				This section inserts a button that exports the report to CSV
			
			**************************************************************************************************************/	
			
			if(ShowExportLink){
				$("#allbigips_filter").append("<a id=\"exportCSVButton\" class=\"exportCSVButton\" href=\"javascript:void(0);\">Export to CSV</a>");
				$("#exportCSVButton").on("click", downloadCSV);
			}

			/*************************************************************************************************************
			
				This section inserts the iRules button if any rules are defined
			
			**************************************************************************************************************/	
			
			if(definedRules.length > 0){
				$("#allbigips_filter").append("<a id=\"irulesButton\" class=\"irulesButton\" href=\"javascript:void(0);\">Show defined iRules</a>")

				$("#irulesButton").on("click", function(){

					var ruleTable = "";

					ruleTable += "<table class=\"definedRulesTable\"><thead>";
					ruleTable += "<tr><th>Load balancer</th><th>Name</th><th>Associated Pools</th><th>&nbsp;</th>";
					ruleTable += "</thead>";
					ruleTable += "<tbody>";

					for(i in definedRules){

						var loadBalancer = definedRules[i].loadBalancer;
						var iRuleName = definedRules[i].iRuleName;

						iRule = getiRule(iRuleName, loadBalancer);

						//Test for missing rule by testing for an empty object ("{}")
						if(Object.keys(iRule).length === 0 && iRule.constructor === Object){
							ruleTable += "<tr class=\"missingRule\"><td>" + loadBalancer + "</td><td>" + iRuleName + "</td><td>This rule was defined but not found.<br>Make sure the configuration is correct.<br>Please note that it's case sensitive.</td><td>N/A</td></tr>"
						} else {

							ruleTable += "<tr class=\"definedRuleRow\" data-rule-name=\"" + iRuleName + "\" data-rule-loadbalancer=\"" + loadBalancer + "\"><td>" + iRule.loadbalancer + "</td><td>" + iRule.name + "</td><td>"

							if(iRule.pools !== null){
								
								for(x in iRule.pools){
									
									if(x !== 0){
										ruleTable += "<br>"
									}

									ruleTable += "<a href=\"javascript:showPoolDetails('" + iRule.pools[x] + "', '" + loadBalancer + "', 'second')\">" + iRule.pools[x] + "</a>"							}

							} else {
								ruleTable += "N/A";
							}

							ruleTable += "</td><td><a href=\"javascript:void(0);\" class=\"definedRuleButton\" data-rule-name=\"" + iRuleName + "\" data-rule-loadbalancer=\"" + loadBalancer + "\">Show definition</a></td></tr>";
						}
						
					}

					ruleTable += "</tbody></table>";

					//Prepare the header
					$("#firstlayerdetailsheader").html("Pre-defined iRules")

					//Set the footer
					$('.firstlayerdetailsfooter').html("<a class=\"lightboxbutton\" href=\"javascript:void(0);\" onClick=\"javascript:$('.lightbox').fadeOut();\">Close preferences</a>");

					//Inject the html
					$("#firstlayerdetailscontentdiv").html(ruleTable);

					//Attach event handlers
					$(".definedRuleButton").on("click", function(){

						var iRuleName = $(this).attr("data-rule-name");
						var loadBalancer = $(this).attr("data-rule-loadbalancer");
						showiRuleDetails(iRuleName, loadBalancer);

					});

					//Show the first light box layer
					$("#firstlayerdiv").fadeIn();

				})
			}

			/*************************************************************************************************************
			
				This section inserts a preferences button and attaches even handlers to it
			
			**************************************************************************************************************/	
			
			$("#allbigips_filter").append("<a id=\"preferencesButton\" class=\"preferencesButton\" href=\"javascript:void(0);\">Site preferences</a>")

			$("#preferencesButton").on("click", showPreferences);

			$("#allbigips_filter").append("<div style=\"float:right\"><span id=\"toggleHeader\">Toggle columns:<span><span id=\"columnToggleButtons\"></span></div>")

			$("#allbigips thead th input").each(function(){

				var columnID = $(this).attr("data-setting-name");

				var toggleLinkData = "";

				if(localStorage.getItem(columnID) === "true"){
					buttonClass = "visibleColumnButton";
				} else {
					buttonClass = "hiddenColumnButton";
				}

				toggleLinkData += "<a href=\"javascript:void(0)\" class=\"" + buttonClass + "\" id=\"" + columnID + "\">" + $(this).attr("data-column-name") + "</a>";

				$("#columnToggleButtons").append(toggleLinkData);

				$("#" + columnID).on("click", function(){

					var preferenceName = $(this).attr("id")

					if(localStorage.getItem(preferenceName) === "false"){
						$(this).addClass("visibleColumnButton").removeClass("hiddenColumnButton");
						localStorage.setItem(preferenceName, "true");
					} else {
						$(this).addClass("hiddenColumnButton").removeClass("visibleColumnButton");
						localStorage.setItem(preferenceName, "false");		
					}

					toggleColumns();

				});

			});

			/*************************************************************************************************************
			
				This section adds the update check button div and initiates the update checks
			
			**************************************************************************************************************/	
			
			//Add the div containing the update available button
			$("#preferencesButton").after($('<span id="updateavailablespan"></span>'));
			
			//Check if there's a new update every 30 minutes
			setInterval(function(){
				$.ajax(document.location.href, {
					type : 'HEAD',
					success : function (response, status, xhr) {

						var currentreport = Date.parse(document.lastModified);
						var latestreport = new Date(xhr.getResponseHeader('Last-Modified')).getTime();
						var currenttime  = new Date();

						timesincelatestgeneration = Math.round((((currenttime - latestreport) % 86400000) % 3600000) / 60000)
						timesincerefresh = Math.round((((latestreport - currentreport) % 86400000) % 3600000) / 60000)

						if( timesincerefresh > 240){
							if(timesincelatestgeneration > 5){
								$("#updateavailablespan").html('<a href="javascript:document.location.reload()" class="criticalupdateavailable">Update available</a>');
							}
						} else if ( timesincerefresh != 0){
							if(timesincelatestgeneration > 5){
								$("#updateavailablespan").html('<a href="javascript:document.location.reload()" class="updateavailable">Update available</a>');
							}
						}

					}
					}); 
			},1800000 );
			
			/****************************************************************************************************************************** 
			
				Lightbox related functions
			
			******************************************************************************************************************************/
			
			
			/* Hide the lightbox if clicking outside the information box*/
			$('body').on('click', function(e){
				if(e.target.className == "lightbox"){
					$('.lightbox').hide();
				}
			});
			
			/* Center the lightbox */
			jQuery.fn.center = function () {
				this.css("position","absolute");
				//this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + $(window).scrollTop()) + "px");
				this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
				return this;
			}
			
			/****************************************************************************************************************************** 
			
				Add custom data tables functions
			
			******************************************************************************************************************************/

			
			//Expand pool matches  and hightlight them
			oTable.on( 'draw', function () {

				var body = $( oTable.table().body() );

				highlightAll(oTable);
				
				
				hidePools();
				toggleColumns();

				if(localStorage.getItem("showAdcLinks") === "false"){
					$(".adcLinkSpan").hide();
				} else {
					$(".adcLinkSpan").show();
				}

				if(oTable.search() != ""){
					expandPoolMatches(body, oTable.search());
				}

				setPoolTableCellWidth();
						
			} );
			
			//Filter columns on key update
			oTable.columns().every( function () {
				
				var that = this;
				
				$( 'input', this.header() ).on( 'keyup change', function () {
					that
						.search( this.value )
						.draw();
						expandPoolMatches($( oTable.table().body()), this.value)
						highlightAll(oTable);
				} );		
				
			} );
			
			/*************************************************************************************************************
			
				If any search parameters has been sent, populate the search
			
			**************************************************************************************************************/	
					
			//Make sure that all pools are hidden 
			populateSearchParameters(oTable);
			oTable.draw();

		});
	});

	function initializeStatusVIPs(){

		// Also initialize the ajaxQueue
		siteData.memberStates = {}
		siteData.memberStates.ajaxQueue = 0;
		siteData.memberStates.ajaxFailures = [];
		
		var loadbalancers = siteData.loadbalancers;

		for(var i in loadbalancers){
			
			var loadbalancer = loadbalancers[i];

			if(loadbalancer.statusvip.url !== null){
				testStatusVIP(loadbalancer);
			} else {
				$("span#realtimenotconfigured").text(parseInt($("span#realtimenotconfigured").text()) + 1);
				loadbalancer.statusvip.working = false;
				loadbalancer.statusvip.reason = "None configured";
			}
		}

	}

	function testStatusVIP(loadbalancer){

		var name = loadbalancer.name;

		// Find a pool with members on this load balancer
		var pool = false;
		var pools = siteData.pools;

		for(var i in pools){
			if(pools[i].loadbalancer === name && pools[i].members){
				pool = pools[i];
				break;
			}
		}

		if(!pool){
			loadbalancer.statusvip.working = false;
			loadbalancer.statusvip.reason = "No pools with members found";
		} else {
			
			siteData.memberStates.ajaxQueue++;

			$.ajax({
			  dataType: "json",
			  url: loadbalancer.statusvip.url + pool.name,
			  success: function(lb){
			  	$("span#realtimetestsuccess").text(parseInt($("span#realtimetestsuccess").text()) + 1);
			  	loadbalancer.statusvip.working = true;
				loadbalancer.statusvip.reason = "";
				siteData.memberStates.ajaxQueue--;
			  },
			  timeout: 2000
			})					
			.fail(function(jqxhr){
				$("span#realtimetestfailed").text(parseInt($("span#realtimetestfailed").text()) + 1);
				loadbalancer.statusvip.working = false;
				loadbalancer.statusvip.reason = jqxhr.statusText;
				siteData.memberStates.ajaxQueue--;
			})
			.complete(function(){

				if(siteData.memberStates.ajaxQueue === 0){
					
					//Initiate pool status updates
					var pollCurrentView = function(){
						resetClock();
						$("span#ajaxqueue").text($("table.pooltable tr td.poolname:visible").length);
						$("table.pooltable tr td.poolname:visible").each(function(){
							getPoolStatus(this);
						});
					}

					pollCurrentView()

					setInterval(function(){
						if(siteData.memberStates.ajaxQueue === 0){
							pollCurrentView();
						} else {
							resetClock();
							console.log("Did not finish the previous refresh in time.")
						}
					}, (AJAXREFRESHRATE * 1000));
				}

			});
		}
	}


	function resetClock(){

		var countDown = AJAXREFRESHRATE;

		$("span#realtimenextrefresh").html(", refresh in <span id=\"refreshcountdown\">" + countDown + "</span> seconds");

		var clock = setInterval(function(){
			countDown--;
			if(countDown === 0){
				clearTimeout(clock)
			}
			$("span#realtimenextrefresh").html(", refresh in <b>" + countDown + "</b> seconds");

		}, 1000);

	}

	function getPoolStatus(poolCell) {

		if(siteData.memberStates.ajaxQueue >= AJAXMAXQUEUE){
			setTimeout(function(){
				getPoolStatus(poolCell)
			}, 200);

		} else {

			var poolLink = $(poolCell).find("a.tooltip");
			var loadbalancerName = $(poolLink).attr("data-loadbalancer");
			
			var loadbalancer = getLoadbalancer(loadbalancerName);

			increaseAjaxQueue();

			if(loadbalancer && loadbalancer.statusvip.working === true){

				var poolName = $(poolLink).attr("data-originalpoolname");
				var poolId = $(poolCell).attr("id");

				var pool = getPool(poolName, loadbalancerName);
				var url = loadbalancer.statusvip.url + pool.name
				
				$.ajax({
				  dataType: "json",
				  url: url,
				  success: function(data){
				  	if(data.success){

				  		decreaseAjaxQueue();

				  		for(var memberStatus in data.memberstatuses){

				  			var statusSpan = $("td.PoolMember[data-pool=\"" + poolId + "\"] span[data-member=\"" + memberStatus + "\"]");

				  			setMemberState(statusSpan, data.memberstatuses[memberStatus])

				  			// Update the pool json object
				  			var members = pool.members;

				  			for(i in members){
				  				var member = members[i];
				  				var ipport = member.ip + ":" + member.port;
				  				if(ipport === memberStatus){
				  					member.realtimestatus = data.memberstatuses[memberStatus];
				  				}
				  			}
				  		}

				  	}
				  },
				  timeout: 2000
				})					
				.fail(function(jqxhr){
					// To be used later in the console
					// siteData.memberStates.ajaxFailures.push({ url: url, code: jqxhr.status, reason: jqxhr.statusText })
					decreaseAjaxQueue()
					return false;
				});
				
			} else {
				decreaseAjaxQueue();
			}
		}
		
	}

	function decreaseAjaxQueue(){

		siteData.memberStates.ajaxQueue--;

		//Decrease the total queue
		$("span#ajaxqueue").text($("span#ajaxqueue").text() - 1);
	}

	function increaseAjaxQueue(){
		siteData.memberStates.ajaxQueue++;
	}

	function setMemberState(statusSpan, memberStatus){
		
		var statusIcon = $(statusSpan).find("span.statusicon");
		var textStatus = $(statusSpan).find("span.textstatus");

		var icon, title, textStatus;

		switch(memberStatus) {
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

		var html = "<span class=\"statusicon\"><img src=\"./images/" + icon + "\" title=\"" + title + "\"/></span><span class=\"textstatus\">" + textStatus + "</span>";
		$(statusIcon).fadeOut(200).html(html).fadeIn(200);

	}

	function getLoadbalancer(loadbalancer){

		var loadbalancers = siteData.loadbalancers;

		for(var i in loadbalancers){
			if(loadbalancers[i].name === loadbalancer){
				return loadbalancers[i];
			}
		}

		return false;
	}

	/********************************************************************************************************************************************************************************************

		Functions used by the main data table

	********************************************************************************************************************************************************************************************/


	/****************************************************************************************************************************** 
		Highlight all matches
	******************************************************************************************************************************/

	function highlightAll(oTable){
		
		var body = $( oTable.table().body() );
		
		body.unhighlight();
		body.highlight( oTable.search() );  
			
		oTable.columns().every( function () {
		
			var that = this;
			
			columnvalue = $('input', this.header()).val()
			
			if(asInitVals.indexOf(columnvalue) == -1){
				body.highlight(columnvalue);
			}	
		});
	}

	/****************************************************************************************************************************** 
		Gets the query strings and populate the table
	******************************************************************************************************************************/

	function populateSearchParameters(oTable){
		
		var vars = {};
		var hash;
		
		if(window.location.href.indexOf('?') >= 0){
			
			//Split the query string and create a dictionary with the parameters
			var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
			
			for(var i = 0; i < hashes.length; i++){
				hash = hashes[i].split('=');
				vars[hash[0]] = hash[1];
			}
			
			//Populate the search and column filters
			for(var key in vars){
				
				value = vars[key];
				
				//If it's provided, populate and search with the global string
				if(key == "global_search"){
					if($('#allbigips_filter input[type="search"]')){
						$('#allbigips_filter input[type="search"]').val(vars[key]);
						oTable.search(vars[key]);
						oTable.draw();
					}
				} else {
					//Validate that the key is a column filter and populate it
					if($('input[name="' + key + '"]').length){
						$('input[name="' + key + '"]').val(value);
					}
				}
			}
			
			//Filter the table according to the column filters
			oTable.columns().every( function () {
		
				var that = this;
				
				columnvalue = $('input', this.header()).val();
				
				if(asInitVals.indexOf(columnvalue) == -1){
					$('input', this.header()).addClass('search_entered').removeClass('search_init');
					this.search(columnvalue);
					this.draw();
					expandPoolMatches($(oTable.table().body()), columnvalue)
					highlightAll(oTable);
				}
			});
			
			if(vars['showpool']){
				poolname = vars['showpool'].split('@')[0];
				loadbalancer = vars['showpool'].split('@')[1];
				
				showPoolDetails(poolname, loadbalancer);
			}
			
		}
	}

	function showPreferences(){

		//Prepare the header
		$("#firstlayerdetailsheader").html("BigIP Report Preferences")

		//Set the footer
		$('.firstlayerdetailsfooter').html("<a class=\"lightboxbutton\" href=\"javascript:void(0);\" onClick=\"javascript:$('.lightbox').fadeOut();\">Close preferences</a>");

		//Prepare the content
		var settingsContent = "<table class=\"settingsTable\">";

		settingsContent += "<thead>";
		settingsContent += "<tr><th colspan=2>Generic settings</th>";
		settingsContent += "</thead>";
		
		settingsContent += "<tbody>";
		settingsContent += "<tr><td>Expand all pool members</td><td><input type=\"checkbox\" id=\"autoExpandPools\"></td></tr>";
		settingsContent += "<tr><td>Direct links to Big-IP objects</td><td><input type=\"checkbox\" id=\"adcLinks\"></td></tr>";
		settingsContent += "</tbody>";

		settingsContent += "</table>";

		settingsContent += "</div>";

		//Populate the content
		$("#firstlayerdetailscontentdiv").html(settingsContent);

		//Populate the settings according to the local storage or default settings of none exist
		$("#autoExpandPools").prop("checked", localStorage.getItem("autoExpandPools") === "true");
		$("#adcLinks").prop("checked", localStorage.getItem("showAdcLinks") === "true");

		//Event handler for auto expand pools
		$("#autoExpandPools").on("click", function(){
				localStorage.setItem("autoExpandPools", this.checked);
				oTable.draw();
		});

		//Event handler for showing ADC edit links
		$("#adcLinks").on("click", function(){
				localStorage.setItem("showAdcLinks", this.checked);
				oTable.draw();
		});

		//Make sure that the check boxes are checked according to the settings
		$("#allbigips thead th input").each(function(){
			var columnID = $(this).attr("data-setting-name");
			$("#" + columnID).prop("checked", localStorage.getItem(columnID) === "true");
		});

		$(".columToggle").on("click", function(){
			localStorage.setItem(this.getAttribute("id"), this.checked);
			toggleColumns();
		});

		//Show the first light box layer
		$("#firstlayerdiv").fadeIn();

	}

	function toggleColumns(){

		$("#allbigips thead th input").each(function(index, tHeader){

			var settingName = tHeader.getAttribute("data-setting-name");
			index += 1

			if(localStorage.getItem(settingName) === "false"){
				$(this).parent().hide();
				$("#allbigips > tbody > tr.virtualserverrow > td:nth-child(" + index + "\)").hide();
			} else {
				$(this).parent().show();
				$("#allbigips > tbody > tr.virtualserverrow > td:nth-child(" + index + "\)").show();
			}

		});

	}


	function generateShareLink(){
		
		var base = window.location.origin + window.location.pathname;
		
		var sharequery = '?';
		var first = true;
		
		$('.search_entered').each(function(){
			if(asInitVals.indexOf(this.value) == -1){
				if(first){
					sharequery += this.name + '=' + this.value;
					first = false
				} else {
					sharequery += '&' + this.name + '=' + this.value;
				}
			}
		});
		
		if($('#allbigips_filter label input').val() != ""){
			if(first){
				sharequery += "global_search" + '=' + $('#allbigips_filter label input').val();
				first = false
			} else {
				sharequery += '&' + "global_search" + '=' + $('#allbigips_filter label input').val();
			}
		}
		
		return(base + sharequery);
		

	}

	function showShareLink(){
		
		var link = generateShareLink();
		$('#sharelink').val(link);
		$('#sharelink').focus();
		$('#sharelink').select();
		
	}

	function showPoolShareLink(pool){

		var link = generateShareLink();
		
		link += "&showpool=" + pool;
		
		$('#sharepoollink').val(link);
		$('#sharepoollink').focus();
		$('#sharepoollink').select();
		
	}


	/****************************************************************************************************************************** 
		Expands all pool matches in the main table when searching
	******************************************************************************************************************************/


	function expandPoolMatches(resultset, searchstring){
		
		if(localStorage.autoExpandPools !== "true"){
			$(resultset).children().children().filter("td:contains('" + searchstring + "')").each(function(){
				if(this.className == "PoolInformation"){
					togglePool(this);
				}
			});
		}
	}

	/****************************************************************************************************************************** 
		Collapses all pool cells in the main table
	******************************************************************************************************************************/

	function hidePools(){
		if(localStorage.autoExpandPools === "true"){
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

	function togglePool(e){
		
		id = $(e).attr('data-vsid');
		
		//Store the current window selection
		var selection = window.getSelection();
		
		//If no text is selected, go ahead and expand or collapse the pool
		if(selection.type != "Range") {
			if($("#PoolInformation-" + id).is(":visible")){
				$('#AssociatedPoolsInfo-' + id).show();
				$('#expand-' + id).show();
				$('#collapse-' + id).hide();
				$('#PoolInformation-' + id).hide()
			} else {
				$('#AssociatedPoolsInfo-' + id).hide();
				$('#expand-' + id).hide();
				$('#collapse-' + id).show();
				$('#PoolInformation-' + id).show()
			}
		}

	}

	/****************************************************************************************************************************** 
		Set the max width of the pool cells in order to make the member column align
	******************************************************************************************************************************/

	function setPoolTableCellWidth(){

		var maxwidth=0

		$('.poolname').each(function(i, obj) {
			if(obj.offsetWidth > maxwidth){
				maxwidth = obj.offsetWidth
			}
		});

		$('.poolname').each(function(i, obj) {
			if(obj.offsetWidth < maxwidth){
				obj.style.width = maxwidth
			}
		});

		var maxwidth=0
		$('.PoolMember').each(function(i, obj) {
			if(obj.offsetWidth > maxwidth){
				maxwidth = obj.offsetWidth
			}
		});

		$('.PoolMember').each(function(i, obj) {
			if(obj.offsetWidth < maxwidth){
				obj.style.width = maxwidth
			}
		});
	}

	/****************************************************************************************************************************** 
		Handles the highlight of content when searching
	******************************************************************************************************************************/

	function togglePoolHighlight(e){
		if(e.style.backgroundColor == ""){
			$('.' + e.className).css('background-color','#BCD4EC');
		} else {
			$('.' + e.className).css('background-color','');
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
			enabled: ""
		};
		
		switch(member.availability){
			case "AVAILABILITY_STATUS_GREEN":
				translatedstatus['availability'] = "UP";
				break;
			case "AVAILABILITY_STATUS_BLUE":
				translatedstatus['availability'] = "UNKNOWN";
				break;
			default:
				translatedstatus['availability'] = "DOWN";		
		}
		
		switch(member.enabled){
			case "ENABLED_STATUS_ENABLED":
				translatedstatus['enabled'] = "Enabled";
				break;
			case "ENABLED_STATUS_DISABLED_BY_PARENT":
				translatedstatus['enabled'] = "Disabled by parent";
				break;
			case "ENABLED_STATUS_DISABLED":
				translatedstatus['enabled'] = "Member disabled";
				break;
			default:  
				translatedstatus['enabled'] = "Unknown";
		}
		
		return translatedstatus;
		
	}

	/**********************************************************************************************************************
		Put the cursor in the input field holding the command and selects the text
	**********************************************************************************************************************/

	function selectMonitorInpuText(e){
		$(e).find("p input").focus();
		$(e).find("p input").select();	
	}

	/**********************************************************************************************************************
		Takes a monitor send string as parameter and returns a request object
	**********************************************************************************************************************/

	function getMonitorRequestParameters(sendstring){
		
		var sendstringarr = sendstring.split(" ");
		
		var request = { 
				verb : "",
				uri : "",
				headers : []
		}
		
		request['verb'] = sendstringarr[0];
		request['uri'] = sendstringarr[1].replace('\\r\\n', '');
		
		var headers = sendstring.split('\\r\\n');
		
		if(headers.length > 1){
			
			for(i=1;i<headers.length;i++){
				
				var header = headers[i];
				
				if(header.indexOf(":") >= 0){
					if(header.split(":").length == 2){
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

	function showVirtualServerDetails(virtualserver, loadbalancer){
		
		var virtualservers = siteData.virtualservers;
		var matchingvirtualserver = "";
		
		//Find the matching pool from the JSON object
		for(var i in virtualservers){
			if(virtualservers[i].name == virtualserver && virtualservers[i].loadbalancer == loadbalancer) {
				matchingvirtualserver = virtualservers[i]
			}		
		}
		
		//If a pool was found, populate the pool details table and display it on the page
		if(matchingvirtualserver != ""){
					
			switch(matchingvirtualserver.sourcexlatetype){
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

			//Build the table and headers
			$(".firstlayerdetailsheader").html(matchingvirtualserver.name);

			var table = '<table width="100%">';
			table += '	<tbody>';
			
			//First row containing simple properties in two cells which in turn contains subtables
			table += '		<tr>';
			table += '			<td valign="top">';
			
			//Subtable 1
			table += '				<table class="virtualserverdetailstable">';
			table += '					<tr><th>Name</th><td>' + matchingvirtualserver.name + '</td></tr>';
			table += '					<tr><th>IP:Port</th><td>' + matchingvirtualserver.ip + ':' + matchingvirtualserver.port + '</td></tr>';
			table += '					<tr><th>Default pool</th><td>' + defaultPool + '</td></tr>';
			table += '					<tr><th>Traffic Group</th><td>' + trafficGroup + '</td></tr>';
			table += '				</table>';
			table += '			</td>';
			
			//Subtable 2
			table += '			<td valign="top">';
			table += '				<table class="virtualserverdetailstable">';
			table += '					<tr><th>Client SSL Profile</th><td>' + matchingvirtualserver.sslprofile + '</td></tr>';
			table += '					<tr><th>Server SSL Profile</th><td>' + matchingvirtualserver.sslprofile + '</td></tr>';
			table += '					<tr><th>Compression Profile</th><td>' + matchingvirtualserver.compressionprofile + '</td></tr>';
			table += '					<tr><th>Persistence Profile</th><td>' + matchingvirtualserver.persistence + '</td></tr>';        
			table += '					<tr><th>Source Translation</th><td>' + xlate + '</td></tr>';
			table += '				</table>';
			table += '			</td>';
			table += '		</tr>';
			table += '	</tbody>';
			table += '</table>';
			table += '<br/>';

			table += '<table class="virtualserverdetailstable">';
			table += '	<tr><th>Current Connections</th><th>Maximum Connections</th><th>5 second average CPU usage</th><th>1 minute average CPU usage</th><th>5 minute average CPU usage</th></tr>';
			table += '	<tr><td>' + matchingvirtualserver.currentconnections + '</td><td>' + matchingvirtualserver.maximumconnections + '</td><td>' + matchingvirtualserver.cpuavg5sec + '</td><td>' + matchingvirtualserver.cpuavg1min + '</td><td>' + matchingvirtualserver.cpuavg5min + '</td></tr>';
			table += '</table>';

			table += '<br/>'
			
			if(ShowiRules == true){
				if(matchingvirtualserver.irules.length > 0 && ShowiRules ){
					//Add the assigned irules
					table += '<table class="virtualserverdetailstable">';
					
					if(ShowiRuleLinks){
						table += '	<tr><th>iRule name</th><th>Matched data group lists</td></tr>';
					} else {
						table += '	<tr><th>iRule name</th></tr>';
					}
					
					for(var i in matchingvirtualserver.irules){
						
						// If iRules linking has been set to true show iRule links 
						// and parse data group lists
						if(ShowiRuleLinks){
							
							var iruleobj = getiRule(matchingvirtualserver.irules[i], loadbalancer);

	                        if(Object.keys(iruleobj).length === 0) {                            
	                            table += '	<tr><td>' + matchingvirtualserver.irules[i] + '</td><td>N/A (empty rule)</td></tr>';
	                        } else {
	                            
	                            var matcheddatagrouplists = ParseDataGroupLists(iruleobj);
	                            
	                            if(Object.keys(matcheddatagrouplists).length == 0){
	                                var datagrouplistdata = ["N/A"];
	                            } else {
	                                
	                                var datagrouplistdata = [];
	                                
	                                for(var dg in matcheddatagrouplists){
	                                    
	                                    var name = matcheddatagrouplists[dg].name;
	                                    
	                                    if(name.indexOf("/") >= 0){
	                                        name = name.split("/")[2];
	                                    }
	                                    
	                                    if(ShowDataGroupListsLinks){
	                                        datagrouplistdata.push('<a href="javascript:void(0);" onClick="Javascript:showDataGroupListDetails(\'' + matcheddatagrouplists[dg].name + '\', \'' + loadbalancer + '\')">' + name + '</a>');
	                                    } else {
	                                        datagrouplistdata.push(name)
	                                    }
	                                }
	                            }

	                            table += '	<tr><td><a href="javascript:void(0);" onClick="Javascript:showiRuleDetails(\'' + iruleobj.name + '\', \'' + loadbalancer + '\')">' + iruleobj.name + '</a></td><td>' + datagrouplistdata.join("<br>") + '</td></tr>';
	                        }
	                    } else {
							table += '	<tr><td>' + matchingvirtualserver.irules[i] + '</td></tr>';
						}
					}
					
					table += '</table>';
				}
			}

		} else {
			var table = `<div id="objectnotfound">
				<h1>No matching Virtual Server was found</h1>

				<h4>What happened?</h4>
				When clicking the report it will parse the JSON data to find the matching Virtual Server and display the details. However, in this case it was not able to find any matching Virtual Server.
				
				<h4>Possible reason</h4>
				This might happen if the report is being updated as you navigate to the page. If you see this page often though, please report a bug <a href="https://devcentral.f5.com/codeshare/bigip-report">DevCentral</a>.

				<h4>Possible solutions</h4>
				Refresh the page and try again.

			</div>`
		}

		$('.firstlayerdetailsfooter').html('<a class="lightboxbutton" href="javascript:void(0);" onClick="javascript:$(\'.lightbox\').fadeOut();">Close virtual server details</a>');
		$("#firstlayerdetailscontentdiv").html(table);
		$("#firstlayerdiv").fadeIn();

	}

	/**********************************************************************************************************************
		Returns a matching irules object from the irules json data
	**********************************************************************************************************************/

	function getiRule(irule, loadbalancer){
		
		var irules = siteData.irules;
		var matchingirule = {};

		//Find the matching irule from the JSON object
		for(var i in irules){
			if(irules[i].name == irule && irules[i].loadbalancer == loadbalancer) {
				matchingirule = irules[i];
			}
		}
		
		return matchingirule;
	}

	/**********************************************************************************************************************
		Shows the irule details light box
	**********************************************************************************************************************/

	function showiRuleDetails(irule, loadbalancer){
		
		//Get the rule object from the json file
		matchingirule = getiRule(irule, loadbalancer)
		
		//If an irule was found, prepare the data to show it
		if(matchingirule != ""){
			//Populate the header
			$(".secondlayerdetailsheader").html(matchingirule.name);
			
			//Save the definition to a variable for some classic string mangling
			var definition = matchingirule.definition
			
			//Replace those tags with to be sure that the content won't be interpreted as HTML by the browser
			definition = definition.replace(/</g, "&lt;").replace(/>/g, "&gt;")
			
			//Check if data group list links are wanted. Parse and create links if that's the base
			if(ShowDataGroupListsLinks == true) {
				
				//Then get the matching data group lists, if any
				connecteddatagrouplists = ParseDataGroupLists(matchingirule)
				
				//Check if any data group lists was detected in the irule
				if(Object.keys(connecteddatagrouplists).length > 0){
					//There was, let's loop through each
					for(var dg in connecteddatagrouplists){
						//First, prepare a regexp to replace all instances of the data group list with a link
						var regexp = new RegExp("\\s" + dg + "(\\s|\])", "g");
						//Prepare the link
						var dglink = ' <a href="javascript:void(0);" onClick="Javascript:showDataGroupListDetails(\'' + connecteddatagrouplists[dg].name + '\', \'' + loadbalancer + '\')">' + dg + '</a> ';
						//Do the actual replacement
						definition = definition.replace(regexp, dglink);
					}
				}
			}
			
			//Prepare the div content
			divcontent = '\
			<div class="iRulesContent">\
					<pre class="sh_tcl">' + definition + '</pre>\
				</div>\
			</div>';
		}
		
		//Add the close button to the footer
		$('.secondlayerdetailsfooter').html('<a class="lightboxbutton" href="javascript:void(0);" onClick="javascript:$(\'#secondlayerdiv\').fadeOut()">Close irule details</a>');
		//Add the div content to the page
		$("#secondlayerdetailscontentdiv").html(divcontent);
		//Add syntax highlighting
		sh_highlightDocument('./js/', '.js');
		//Show the div
		$("#secondlayerdiv").fadeIn();

	}



	/**********************************************************************************************************************
		Parse data group lists
	**********************************************************************************************************************/


	function ParseDataGroupLists(irule){

		/*
			Disclaimer. I know this one is very ugly, but since the commands potentially can do multiple levels 
			of brackets	I could not think of a better way
		*/

		var bracketcounter = 0;
		var tempstring = "";
		var detecteddict = {};	

		var irulepartition = irule.name.split("/")[1];
		var loadbalancer = irule.loadbalancer;
		
		//Go through the iRule and check for brackets. Save the string between the brackets.
		for(i=0;i<irule.definition.length;i++){
						
			if(irule.definition[i] == "[" && bracketcounter == 0){
				//A bracket has been found and if the bracketcounter is 0 this is the start of a command
				bracketcounter = 1;
			} else if(irule.definition[i] == "[") {
				//A bracket has been found and since the bracket counter is larger than 0 this is a nested command.
				bracketcounter +=1;
			} else if(irule.definition[i] == "#"){
				
				//Comment detected. Increase i until a new line has been detected or the end of the definition has been reached
				while(irule.definition[i] != "\n" && i != irule.definition.length){
					i++;
				}

				bracketcounter = 0;
				startindex = 0;
				tempstring = "";
				continue;
			}
			
			
			//The start of a command has been identified, save the character to a string
			if(bracketcounter > 0){
				tempstring += irule.definition[i];
			}
			
			if(irule.definition[i] == "]"){
				//if an end bracket comes along, decrease the bracket counter by one
				bracketcounter += -1
				
				//If the bracket counter is 0 after decreasing the bracket we have reached the end of a command
				if(bracketcounter == 0){
					
					//Separate the different words in the command with a regexp
					//Regexp based on the allowed characters specified by F5 in this article:
					//https://support.f5.com/kb/en-us/solutions/public/6000/800/sol6869.html
					var commandarray = tempstring.match(/[a-zA-Z0-9-_./]+/g)
					
					if(commandarray != null){
						//The actual command is the first word in the array. Later we'll be looking for class.
						var command = commandarray[0];
						
						//The subcommand is the second word. If class has been identified this will be match.
						var subcommand = commandarray[1];
						
						//Set an initial value of dg
						var dg = ""
						
						//If the command is class. I've chosen not to include matchclass for now since it is being deprecated
						if(command == "class"){
							switch(subcommand){
								case "lookup":
								case "match":
								case "element":
								case "type":
								case "exists":
								case "size":
								case "startsearch":
									//These types always has the data group list in the last element
									var dg = commandarray[commandarray.length-1]
									break;
								case "anymore":
								case "donesearch":
									//These types always has the data group list in the third element
									var dg = commandarray[2]
									break;
								case "search":
								case "names":
								case "get":
								case "nextelement":
									//Exclude options and find the data group list
									for(x=2;x<commandarray.length;x++){
										if(commandarray[x][0] != "-"){
											dg = commandarray[x];
										}
										
									}
									break;
							}
							
							if(dg != ""){
								
								if(ShowDataGroupListsLinks == false){
									var matchingdatagrouplist = {};
									matchingdatagrouplist["name"] = dg;
								} else if(dg.indexOf("/") >= 0){  
								//Check if a full path to a data group list has been specified and if it's legit
									
									//Possible match of a data group list with full pathname
									matchingdatagrouplist = getDataGroupList(dg, loadbalancer);

									if(matchingdatagrouplist == ""){
										//This did not match an existing data group list
										continue			
									}
								} else if ( getDataGroupList("/" + irulepartition + "/" + dg, loadbalancer) != "") {
									//It existed in the irule partition
									matchingdatagrouplist = getDataGroupList("/" + irulepartition + "/" + dg, loadbalancer);
								} else if (getDataGroupList("/Common/" + dg, loadbalancer) != ""){
									//It existed in the Common partition
									matchingdatagrouplist = getDataGroupList("/Common/" + dg, loadbalancer);
								} else {
									//No data group list was matched
									continue
								}

								//Check if the data group list has been detected before
								//If it hasn't, add it to the array of detected data group lists
								if(matchingdatagrouplist.name in detecteddict){
									continue;
								} else {
									//Update the dictionary
									detecteddict[matchingdatagrouplist.name] = matchingdatagrouplist;
								}
							}
						}
					}
					
					tempstring = "";
				}
				
			}
			
			if(irule.definition[i] == "\n"){
				bracketcounter = 0;
				startindex = 0;
				tempstring = "";
			}
		}
		
		return(detecteddict);
	}


	/**********************************************************************************************************************
		Returns a matching data group list object from the data group list json data
	**********************************************************************************************************************/

	function getDataGroupList(datagrouplist, loadbalancer){
		
		var datagrouplists = siteData.datagrouplists;
		var matchingdatagrouplist = "";
		
		//Find the matching data group list from the JSON object
		for(var i in datagrouplists){
			if(datagrouplists[i].name == datagrouplist && datagrouplists[i].loadbalancer == loadbalancer) {
				matchingdatagrouplist = datagrouplists[i];
			}
		}
		
		return matchingdatagrouplist;
	}


	/**********************************************************************************************************************
		Displays a data group list in a lightbox
	**********************************************************************************************************************/

	function showDataGroupListDetails(datagrouplist, loadbalancer){
		
		//Get a matching data group list from the json data
		matchingdatagrouplist = getDataGroupList(datagrouplist, loadbalancer)
		
		//If a pool was found, populate the pool details table and display it on the page
		if(matchingdatagrouplist != ""){
			
			$(".secondlayerdetailsheader").html(matchingdatagrouplist.name);
			
			divcontent = "<div class=datagrouplistcontentdiv>" +
							"<span class=\"dgtype\">Type: " + matchingdatagrouplist.type + "</span><br><br>";
							"<span class=\"dgtype\">Type: " + matchingdatagrouplist.type + "</span><br><br>";
			
			divcontent += "<table class=\"datagrouplisttable\">\
								<thead>\
									<tr><th class=\"keyheader\">Key</th><th class=\"valueheader\">Value</th></tr>\
								</thead>\
								<tbody>"
			
			if(Object.keys(matchingdatagrouplist).length == 0){
				divcontent += "<tr class=\"emptydg\"><td colspan=\"2\">Empty data group list</td></tr>"
			} else {
				for(var i in matchingdatagrouplist.data){
					divcontent += "<tr><td class=\"dgkey\">" + i + "</td><td class=\"dgvalue\">" + matchingdatagrouplist.data[i] + "</td></tr>";
				}
			}
			
			divcontent += "</tbody></table\">"
			
			divcontent += '</div>';

		}
		
		$('#secondlayerdetailsfooter').html('<a class="lightboxbutton" href="javascript:void(0);" onClick="javascript:$(\'#secondlayerdiv\').fadeOut()">Close data group list details</a>');
		$("#secondlayerdetailscontentdiv").html(divcontent);
		$("#secondlayerdiv").fadeIn();

	}


	/**********************************************************************************************************************
		Shows the pool details light box
	**********************************************************************************************************************/

	function showPoolDetails(pool, loadbalancer, layer = "first"){

		var pools = siteData.pools;
		var matchingpool = "";
		
		//Find the matching pool from the JSON object
		for(var i in pools){
			if(pools[i].name == pool && pools[i].loadbalancer == loadbalancer) {
				matchingpool = pools[i]
			}		
		}
		
		//If a pool was found, populate the pool details table and display it on the page
		if(matchingpool != ""){
			
			//Build the table and headers
			$("." + layer + "layerdetailsheader").html(matchingpool.name);
			
			var table = '<table class="pooldetailstable">';
			table += '<thead><tr><th>Load Balancing Method</th><th>Action On Service Down</th><th>Allow NAT</th><th>Allow SNAT</th></tr></thead>';
			table += '<tbody>';
			table += '<tr><td>' + matchingpool.loadbalancingmethod + '</td><td>' + matchingpool.actiononservicedown + '</td><td>' + matchingpool.allownat + '</td><td>' + matchingpool.allowsnat + '</td></tr>';
			table += '</tbody>';
			table += '</table>';

			table += '<br>'

			table += '<div class="monitordetailsheader">Member details</div>'
			table += '<table class="pooldetailstable">';
			table += '	<thead><tr><th>Member Name</th><th>Member IP</th><th>Port</th><th>Priority Group</th><th>Connections</th><th>Max Connections</th><th>Member Availability</th><th>Enabled</th><th>Member Status Description</th><th>Realtime Availability</th></tr></thead><tbody>';
			
			poolmonitors = matchingpool.monitors

			matchingmonitors = [];
			
			var monitors = siteData.monitors;

			for(var i in poolmonitors){
				
				for(var x in monitors){
					if(monitors[x].name == poolmonitors[i] && monitors[x].loadbalancer == loadbalancer){
						matchingmonitors.push(monitors[x]);
					}
				}
			}		
			
			var members = matchingpool.members;
			
			for(var i in members){
				
				member = members[i];
				memberstatus = translateStatus(member);
				
				table += "<tr><td>" + member.name + "</td><td>" + member.ip + "</td><td>" + member.port + "</td><td>" + member.priority + "</td><td>" + member.currentconnections + "</td><td>" + member.maximumconnections + "</td><td>" + memberstatus["availability"] + "</td><td>" + memberstatus["enabled"] + "</td><td>" + member.status + "</td><td>" + (member.realtimestatus || "N/A").toUpperCase() + "</td></tr>";
			
			}
			
			table += '</tbody></table>';
			table += '<br>';
			
			if(matchingmonitors.length > 0){
				
				table += '<div class="monitordetailsheader">Assigned monitors</div>'
				
				for(var i in matchingmonitors){
					
					matchingmonitor = matchingmonitors[i];
					
					matchingmonitor.receivestring = matchingmonitor.receivestring.replace('<', '&lt;').replace('>', '&gt;');
					
					table += '	<table class="monitordetailstable">';
					table += '	<thead><tr><th colspan=2>' + matchingmonitor.name + '</th></thead><tbody>';
					table += '	<tr><td class="monitordetailstablerowheader"><b>Type</td><td>' + matchingmonitor.type + '</b></td></tr>'
					table += '	<tr><td class="monitordetailstablerowheader"><b>Send string</td><td>' + matchingmonitor.sendstring + '</b></td></tr>'
					table += '	<tr><td class="monitordetailstablerowheader"><b>Receive string</b></td><td>' + matchingmonitor.receivestring + '</td></tr>'
					table += '	<tr><td class="monitordetailstablerowheader"><b>Interval</b></td><td>' + matchingmonitor.interval + '</td></tr>'
					table += '	<tr><td class="monitordetailstablerowheader"><b>Timeout</b></td><td>' + matchingmonitor.timeout + '</td></tr>'
					table += '	</table>';
					
					
					table += '	<table class="membermonitortable">';
					table += '	<thead><tr><th>Member Name</th><th>Member ip</th><th>Member Port</th><th>HTTP Link</th><th>Curl Link</th><th>Netcat Link</th></thead><tbody>';
				
					for(var x in members){
					
						member = members[x];
						memberstatus = translateStatus(member);
															
						var protocol = '';
						
						if(matchingmonitors[i].type.indexOf("HTTPS") >=0){
							protocol = 'https';
						} else if(matchingmonitors[i].type.indexOf("HTTP") >=0){
							protocol = 'http';
						}
						
						if(protocol != ''){
							
							sendstring = matchingmonitors[i].sendstring;
							
							requestparameters = getMonitorRequestParameters(sendstring)
							globheader = requestparameters;
							if(requestparameters['verb'] === "GET" || requestparameters['verb'] === "HEAD"){
														
								var curlcommand = 'curl';

								if (requestparameters['verb'] === "HEAD"){
						            curlcommand += " -I"
						        }
								
								for(var x in requestparameters['headers']){
									header = requestparameters['headers'][x];
									headerarr = header.split(":");
									headername = headerarr[0].trim();
									headervalue = headerarr[1].trim();
									
									curlcommand += ' --header &quot;' + headername + ': ' + headervalue + '&quot;';
								}
								
								curlcommand += ' ' + protocol + '://' + member.ip + ':' + member.port + requestparameters['uri'];
													
								var netcatcommand = "echo -ne \"" + sendstring + "\" | nc " + member.ip + " " + member.port;
								
								var url = protocol + '://' + member.ip + ':' + member.port + requestparameters['uri'];
								
								var httplink = '<a href="javascript:void(0);" target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)" data-type="http">HTTP<p>HTTP Link (CTL+C)<input id="curlcommand" class="monitorcopybox" type="text" value="' + url +'"></p></a>';
								
								var curllink = '<a href="javascript:void(0);" target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)" data-type="curl">Curl<p>Curl command (CTRL+C)<input id="curlcommand" class="monitorcopybox" type="text" value="' + curlcommand +'"></p></a>';
								
								var netcatlink = '<a href="javascript:void(0); target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)" data-type="netcat">Netcat<p>Netcat command (CTRL+C)<input id="curlcommand" class="monitorcopybox" type="text" value=\'' + netcatcommand +'\'></p></a>';
								
								table += '<tr><td>' + member.name + '</td><td>' + member.ip + '</td><td>' + member.port + '</td><td>' + httplink + '</td><td>' + curllink + '</td><td>' + netcatlink + '</td></tr>';
								
							} else {
								table += '<tr><td>' + member.name +'</td><td>' + member.ip  + '</td><td>' + member.port + '</td><td>N/A</td><td>N/A</td><td>N/A</td></tr>';
							}
						} else {
							table += '<tr><td>' + member.name +'</td><td>' + member.ip  + '</td><td>' + member.port + '</td><td>N/A</td><td>N/A</td><td>N/A</td></tr>';
						}
					}
					
					table += '	</table>';
					table += '	<br>';
					
				}
			
				
				table += '</tbody></table>';
			}
			
			
			$("#" + layer + "layerdetailsfooter").html('<a class="lightboxbutton" href="javascript:void(0);" onClick="javascript:$(\'.lightbox\').fadeOut()">Close pool details</a><a href="javascript:void(0);" onMouseClick="" onMouseOver="javascript:showPoolShareLink(\'' + pool +'@' + loadbalancer + '\')" class="sharepoollink">Share pool details<p>CTRL + C to copy<br><input id="sharepoollink" value=""></p></a>');

		} else {
			var table = `<div id="objectnotfound">
				<h1>No matching Pool was found</h1>

				<h4>What happened?</h4>
				When clicking the report it will parse the JSON data to find the matching pool and display the details. However, in this case it was not able to find any matching pool.
				
				<h4>Possible reason</h4>
				This might happen if the report is being updated as you navigate to the page. If you see this page often though, please report a bug <a href="https://devcentral.f5.com/codeshare/bigip-report">DevCentral</a>.

				<h4>Possible solutions</h4>
				Refresh the page and try again.

			</div>`
		}

		$("#" + layer + "layerdetailscontentdiv").html(table);
		$("#" + layer + "layerdiv").fadeIn();

	}

	function loadPreferences(){
		
		var defaultPreferences = siteData.defaultPreferences;

		for(var k in defaultPreferences){
			if(localStorage.getItem(k) === null){ localStorage.setItem(k, defaultPreferences[k]) }
		}

	}


	function getPool(pool, loadbalancer){

		var pools = siteData.pools;

		for(var i in pools){
			if(pools[i].name === pool && pools[i].loadbalancer === loadbalancer){
				return pools[i];
			}
		}

		return false;
	}

	function getVirtualServer(vs, loadbalancer){

		var virtualservers = siteData.virtualservers;

		for(var i in virtualservers){
			if(virtualservers[i].name === vs && virtualservers[i].loadbalancer === loadbalancer){
				return virtualservers[i];
			}
		}

		return false;
	}

	function generateCSV(){

		var csv = "name;ip;port;sslprofile;compressionprofile;persistenceprofile;availability;enabled;currentconnections;cpuavg5sec;cpuavg1min;cpuavg5min;defaultpool;associated-pools;loadbalancer\n";

		$("#allbigips tbody tr.virtualserverrow").each(function(){
			
			var line = "";

			vsname = $(this).find("td.virtualServerCell a").attr("data-originalvirtualservername") || "N/A (Orphan pool)"

			if(vsname !== "N/A (Orphan pool)"){

				var loadbalancer = $(this).find("td.virtualServerCell a").attr("data-loadbalancer");

				vs = getVirtualServer(vsname, loadbalancer)

				var line = vs.name + ";" + (vs.ip || "") + ";" + (vs.port || "") + ";" + (vs.sslprofile || "None") + ";" + (vs.compressionprofile || "None") + ";" + (vs.persistenceprofile || "None") + ";" + vs.availability + ";" + vs.enabled + ";" + vs.currentconnections + ";" + vs.cpuavg5sec + ";" + vs.cpuavg1min + ";" + vs.cpuavg5min + ";" + (vs.defaultpool || "None") + ";";

				var firstpool = true;

				for(var p in vs.pools){
				
					if(!firstpool){ line += "|"} else { firstpool = false }
					
					pool = getPool(vs.pools[p], vs.loadbalancer);
					
				}
				
				
			} else {

				var poolname = $(this).find("td.poolname a").attr("data-originalpoolname");
				var loadbalancer = $(this).find("td.poolname a").attr("data-loadbalancer");
				
				line = "N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);N/A (Orphan pool);";

				pool = getPool(poolname, loadbalancer);

			}

			line += pool.name + ": "

			var first = true;
			var firstmember = true;

			for(var m in pool.members){
			    if(!firstmember){ line += ", "} else { firstmember = false;}
				var member = pool.members[m]
				line += member.name + ":" + member.port + " (" + member.name + ":" + member.port + ")";
			}

			line += ";" + pool.loadbalancer;

			csv += line + "\n";

		})

		return(csv);
	}

	function downloadCSV() {
	  	
	  	var text = generateCSV();

	  	var d = new Date();

	  	var year = d.getFullYear();
	  	var month = d.getMonth();
	  	var day = d.getDay();

	  	if(month < 10){ month = "0" + month }
	  	if(day < 10){ day = "0" + day }

	  	var filename =  year + "-" + month + "-" + day + "-bigipreportexport.csv";

		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);

	}