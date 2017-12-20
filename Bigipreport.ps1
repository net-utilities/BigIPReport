######################################################################################################################################
#
#		Copyright (C) 2016 Patrik Jonsson <patrik.jonsson#at#gmail-com>
#		
#		This script is free: you can redistribute it and/or modify
#		it under the terms of the GNU General Public License as published by
#		the Free Software Foundation, either version 3 of the License, or
#		(at your option) any later version.
#
#		This script is distributed in the hope that it will be useful,
#		but WITHOUT ANY WARRANTY; without even the implied warranty of
#		MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#		GNU General Public License for more details.
#		You should have received a copy of the GNU General Public License
#		along with this program.  If not, see <http://www.gnu.org/licenses/>
#
#		Version			Date			Change																	Author          Need Config update?
#		1.0			2013-02-04		Initial version																Patrik Jonsson  -
#		1.7			2013-06-07		Fixed a bug regarding SSL profiles											Patrik Jonsson  -
#		1.8			2013-06-12		Removed the default pool from the pool list if it was set to "None"			Patrik Jonsson  -
#		1.9			2013-06-12		Added a link to be able to go back to the report after showing iRules.		Patrik Jonsson  -
#		2.0			2013-06-12		Adding more load balancers.													Patrik Jonsson  -
#		2.1			2014-01-10		Fixing the re-initialization bug											Patrik Jonsson  -
#		2.2			2014-02-14		Adding send strings, receive strings, interval and timeout.					Patrik Jonsson  -
#		2.3			2014-02-19		Made the caching more efficient (100% more) and fixed gpi white spaces.		Patrik Jonsson  -
#									Adding additional comments.													Patrik Jonsson  -
#		2.4			2014-02-20		Adding case insensitive pool detection in irules.							Patrik Jonsson  -
#		2.5			2014-02-21		Fixing a bug allow single iRules in $Global:bigipirules.					Patrik Jonsson  -
#		2.6			2014-02-24		Fixing iRule table and new CSS.												Patrik Jonsson  -
#									Adding sorting of columns.													
#									Adding textarea for iRules.
#		2.7			2014-02-25		Fixing prettier HTML structure
#		2.8			2014-02-27		Fixing header filter														Patrik Jonsson  -
#		2.9			2014-03-09		Rewriting to use node object instead of dictionary							Patrik Jonsson  -
#									Fixing a bug that appeared when using Powershell 3.0
#		3.0			2015-07-21		Fixing pool verification													Patrik Jonsson  -
#		3.1			2015-07-22		Showing big monitors is easier												Patrik Jonsson  -
#									Adding functionality to hide certain information to save space.	
#		3.2			2015-07-23		Trying nested tables for pool member information							Patrik Jonsson  -
#		3.3			2015-07-25		Fixed better CSS															Patrik Jonsson  -
#									Fixed a loading screen
#									Adding member information in the table instead of popup
#		3.4							Add search highlighting														Patrik Jonsson  -
#									Add more entries per page													Patrik Jonsson  -
#		3.5			2015-07-29		Fixing the iRules syntax highlihting										Patrik Jonsson  -
#		3.6			2015-07-30		Fixing a drop down for iRule selection										Patrik Jonsson  -
#		3.7			2015-07-31		Added a lightbox for the iRules												Patrik Jonsson  -
#									Adding error reporting when the report fails
#		3.8			2015-11-11		Added TLS1.2 support														Patrik Jonsson  -
#									Changed the javascript so the monitors would not cross the screen edge.
#		3.9			2016-02-04		Fixed a bug when doing minimal configuration								Patrik Jonsson  -
#									Made the Bigip target list easier to configure (exchanged BigIPdict)
#		3.9.2		2016-02-25		Ending the version inflation. :)
#		3.9.2		2016-02-26		Changing the iRule pool regex to cater for explicit pool selections			Patrik Jonsson  -
#		3.9.3		2016-02-28		Fixed faster caching of monitors											Patrik Jonsson  -
#									Added client site checking for stale data									
#									Added member status to the report
#		3.9.4		2016-03-01		Adding support to show virtual server details irules						Patrik Jonsson  -
#									Adding generated strings to test the monitors
#									Added a pool details lightbox instead of the popup
#		3.9.5		2016-03-02		Adding support for latest jQuery											Patrik Jonsson  -
#									Fixed UTF8 json in order to support	Firefox
#									Cleaned CSS
#									Cleaned the javascript
#									Cleaned the HTML
#		3.9.6		2016-03-04		Caching the data in temp files when writing the html and jsons				Patrik Jonsson  -
#		3.9.7		2016-03-05		Adding a possibility to share searches										Patrik Jonsson  -
#		4.0			2016-03-07		Fixed the pool expand function where it does not expand for column			Patrik Jonsson  -
#									searches.
#									Fixed syntax highlighting for column searches
#		4.0.1		2016-03-11		Fixed an error in the javascript that used a future function not			Patrik Jonsson  -
#									included in the current version.
#		4.0.2		2016-03-14		Preparing for showing Virtual Server details								Patrik Jonsson  -
#		4.0.3		2016-03-23		Making the curl links compatible with the windows binary					Patrik Jonsson  -
#									Adding share link to show pool
#									Fixed a bug where monitors using tags as receive string would not show.
#		4.0.4		2016-05-13		Fixed a bug with a non-declared variable									Patrik Jonsson  -
#		4.0.5		2016-05-23		Made the update check more aggressive by request of devcentral users		Patrik Jonsson  -
#		4.0.6		2016-06-08		Making showing of irules easier to define									Patrik Jonsson  -
#		4.0.7		2016-06-09		Replacing config section with a config file									Patrik Jonsson  -
#                                   Using Powershell Strict mode to improve script quality
#		4.0.8		2016-06-10		Adding logging options														Patrik Jonsson  -
#									Adding checks and retries when writing the report
#		4.0.9		2016-06-14		Changed the pool regular expression to allow tab and multiple space			Patrik Jonsson  -
#		4.1.0		2016-06-20		Updated the report mails to be more structured (css and table)				Patrik Jonsson  -
#		4.1.1		2016-06-21		Made the report check for missing load balancers before compiling			Patrik Jonsson  -
#									the data
#		4.1.2		2016-06-23		Make it possible to store the report somewhere else than the site root		Patrik Jonsson  -
#									Adding option to add shares if the report script is running on a separate
#									server.
#									Adding log file pruning (max lines)
#		4.1.3		2016-07-01		Fixed an error in the pre-execution part. Updated some log information.		Patrik Jonsson  -
#		4.1.4		2016-07-11		Fixed a problem with the javascript files not referring the correct folder	Patrik Jonsson  -
#		4.2.0		2016-07-18		Added support to show virtual server details								Patrik Jonsson  -
#									Added support for showing irules
#									Added support for scanning data group lists
#									Changed value of irules on Virtual servers without irules to an empty 
#									array instead of none.
#		4.2.1		2016-07-19		Added an additional possible status to the pool details view				Patrik Jonsson  -
#		4.2.2		2016-08-10		Fixed a bug with error reporting											Patrik Jonsson  -
#									Made it easier to close larger irules
#       			2016-08-19	    Cleaning up CSS
#       			2016-08-19	    Fixed a bug in the data group list parser function
#		4.2.3		2016-08-29		Adding data group list parsing to json files								
#									Fixed so you can hide the compression column
#		4.2.4		2016-08-30		Fixed a bug in the data group list parser									Patrik Jonsson  -
#									Showing data group lists now works
#		4.2.5		2016-08-31		Rewrote the parser to use dictionaries instead								Patrik Jonsson  -
#									Parsing data group lists in irules now works
#		4.2.6		2016-09-01		Fixing css for data group list lightbox to match the rest					Patrik Jonsson  -
#		4.2.7		2016-09-06		Improving data group list parsing by skipping content in comments			Patrik Jonsson  -
#		4.2.8		2016-09-12		Added support for showing priority groups									Patrik Jonsson  -
#		4.2.9		2016-09-12		Showing persistence profile in virtual server details						Patrik Jonsson  -
#		4.3.0		2016-01-10		Fixing support for partitions single configuration objects
#		4.3.1		2017-03-02		Removing any route domain before comparing to NAT list						Patrik Jonsson  -
#		4.3.2		2017-03-02		Making the script do recursive calls instead of per partition. Much faster  Patrik Jonsson  -
#		4.3.3		2017-03-02		Adding basic ASM support													Patrik Jonsson  -
#		4.3.4		2017-03-07		Fixing a mistake where the wrong column setting was referred				Patrik Jonsson  -
#		4.3.5		2017-03-23		Improving the check for missing data										Patrik Jonsson  -
#		4.3.6		2017-03-23		Using stream writer intead of out-file for improved performance				Patrik Jonsson  -
#		4.3.7		2017-03-23		Removing virtual servers connected to orphaned pools from the post check.	Patrik Jonsson  -
#		4.3.8		2017-03-24		Only using/comparing objects local to the LB currently worked on (faster)	Patrik Jonsson  -
#		4.3.9		2017-04-06		Allowing orphaned objects in the JSON, fixing a bug when testing data		Patrik Jonsson  -
#		4.4.0		2017-06-21		Fixing issue with the API not returning empty irules						Patrik Jonsson  -
#		4.4.1		2017-07-05		Removing ASM, adding preferences											Patrik Jonsson  -
#		4.4.2		2017-07-08		Adding new logo and version number in the footer							Patrik Jonsson  -
#		4.4.3		2017-07-09		Moved preferences to its own window 										Patrik Jonsson  -
#		4.5.0		2017-07-12		Adding column toggle. Moving iRule selector to its own window.				Patrik Jonsson  -
#									Optimizing css
#		4.5.1		2017-07-15		Now also fetching information about the load balancers for future use 		Patrik Jonsson  -
#		4.5.2		2017-07-16		Re-adding basic ASM support for devices running version 12 and above.		Patrik Jonsson  -
#       4.5.3       2017-07-20      Fixing a bug when highlighting irules and the js folder is not located      Patrik Jonsson  -
#                                   in the root folder.
#		4.5.4		2017-07-21		Replacing old Javascript loader with one that is smoother when loading		Patrik Jonsson  -
#									larger sets of data
#		4.5.5		2017-07-22		Adding a reset filters button												Patrik Jonsson  -
#       4.5.6       2017-08-04      Adding VLAN information to the virtual server object                        Patrik Jonsson  -
#		4.5.7		2017-08-13		Adding icons 																Patrik Jonsson  -
#		4.5.8		2017-08-14		Adding filter icon 															Patrik Jonsson  -
#		4.5.9		2017-08-16		Adding traffic group to the virtual server object and showing it.			Patrik Jonsson  -
#		4.6.0		2017-08-17		Adding virtual server state icons 											Patrik Jonsson  -
#		4.6.1		2017-08-18		Fixing bug when extracting source NAT pool 									Patrik Jonsson  -
#		4.6.2		2017-08-18		Fixing a bug when extracting version information 							Patrik Jonsson  -
#		4.6.3		2017-08-19		Adding LB method, SNAT and NAT to pool details 								Patrik Jonsson  -
#		4.6.4		2017-08-24		Adding "All" to the pagination options										Patrik Jonsson  -
#		4.6.5		2017-09-08		Fixing a bug when dealing with modules that is not known. 					Patrik Jonsson  No
#									Also defining iRulesLX as a known module
#		4.6.6		2017-09-11		Adding virtual server and pool statistics				 					Patrik Jonsson  No
#		4.6.7		2017-09-12		Small CSS fix to make the pool details prettier								Patrik Jonsson  No
#		4.6.8		2017-09-20		Adding fix for duplicate detected data group lists.							Patrik Jonsson  No
#		4.6.9		2017-09-25		Preventing caching of Json.                         						Patrik Jonsson  No
#		4.7.0		2017-12-20		Adding options to export to the report to CSV. 								Patrik Jonsson	Yes
#		4.7.1		2017-12-20		Adding support for monitors using HEAD.										Patrik jonsson  No
#
#		This script generates a report of the LTM configuration on F5 BigIP's.
#		It started out as pet project to help co-workers know which traffic goes where but grew.
#
#		The html page uses "Data tables" to display and filter tables. It's an open source javascript project.
#		Source: https://datatables.net/
#
######################################################################################################################################

Set-StrictMode -Version 1.0

#Script version
$Global:ScriptVersion = "4.6.7"

#Variable for storing handled errors
$Global:LoggedErrors = @()

#Variable used to calculate the time used to generate the report.
$starttime = Get-Date

################################################################################################################################################
#
#	Load the configration file
#
################################################################################################################################################

#Check if the configuration file exists
if(Test-Path "$PSScriptRoot\bigipreportconfig.xml"){
	
	#Read the file as xml
	[xml]$Global:Bigipreportconfig = Get-Content "$PSScriptRoot\bigipreportconfig.xml"
	
	#Verify that the file was succssfully loaded, otherwise exit
	if($?){
		$Outputlevel = $Global:Bigipreportconfig.Settings.Outputlevel
		if($Outputlevel -eq "Verbose"){
			"Successfully loaded the config file"
		}
	} else {
		Write-Error "Can't read the config file, or config file corrupt. Aborting."
		Exit
	}
} else {
	Write-Error "Failed to load config file $PSScriptRoot\bigipreportconfig.xml. Aborting."
	Exit
}

################################################################################################################################################
#
#	Logs to console and file function
#
################################################################################################################################################

Function log {

	Param ([string]$LogType, [string]$message)
	
	#Initiate the log header with date and time
	$CurrentTime =  $(Get-Date -UFormat "%Y-%m-%d") + "`t" + $(Get-Date -Uformat "%H:%M:%S")
	$LogHeader = $CurrentTime+ "`t$LogType"
	
	if($LogType -eq "error"){
		$Global:LoggedErrors  += $message
	}

	if($Global:Bigipreportconfig.Settings.LogSettings.Enabled -eq $true){
	
		$LogFilePath = $Global:Bigipreportconfig.Settings.LogSettings.LogFilePath
		$LogLevel = $Global:Bigipreportconfig.Settings.LogSettings.LogLevel
		
		switch($logtype) { 
	        "error" { [System.IO.File]::AppendAllText($LogFilePath, $("$LogHeader`t$Message")) }
			"success" { if($LogLevel -eq "Verbose"){ [System.IO.File]::AppendAllText($LogFilePath, $("$LogHeader`t$Message")) }}
			"info" { if($LogLevel -eq "Verbose"){ [System.IO.File]::AppendAllText($LogFilePath, $("$LogHeader`t$Message")) }}
			default { if($LogLevel -eq "Verbose"){ [System.IO.File]::AppendAllText($LogFilePath, $("$LogHeader`t$Message")) } }
	    }
	}
	
	$ConsoleHeader = $CurrentTime
	
	switch($logtype) { 
        "error" 	{ Write-Host $("$ConsoleHeader`t$Message") -ForegroundColor "Red" }
		"success" 	{ if($OutputLevel -eq "Verbose"){ Write-Host $("$ConsoleHeader`t$Message") -ForegroundColor "Green" } }
		"info" 		{ if($OutputLevel -eq "Verbose"){ Write-Host "$ConsoleHeader`t$Message" } }
		default 	{ if($OutputLevel -eq "Verbose"){ Write-Host "$ConsoleHeader`t$Message" } }
    }
}

################################################################################################################################################
#
#	Function to send an error report if error reporting is configured
#
################################################################################################################################################



Function Send-Errors {


	#Check for errors when executing the script and send them
	If($error.Count -gt 0 -or $Global:LoggedErrors -gt 0){
		
		log info "There were errors while generating the report"
		
		if($Global:Bigipreportconfig.Settings.ErrorReporting.Enabled -eq $true){	
			
			$Errorsummary = @"
<html>
	<head>
		<style type="text/css">

			.errortable {
				margin:0px;padding:0px;
				box-shadow: 10px 10px 5px #888888;
				border-collapse: collapse;
				font-family:Ebrima;
			}
			.errortable table{
				border-collapse: collapse;
				border-spacing: 0;
				height:100%;
				margin:0px;
				padding:0px;
				border:1px solid #000000;
			}
			.errortable tr:nth-child(odd){ 
				background-color:#ffffff; 
				border-collapse: collapse;
			}
			.oddrow{ 
				background-color:#d3e9ff; 
			}
			.errortable td{
				vertical-align:middle;
				border:1px solid #000000;
				border-collapse: collapse;
				text-align:left;
				padding:7px;
				font-size:12px;
			}
			.headerrow {
				background-color:#024a91;
				border:0px solid #000000;
				border-collapse: collapse;
				text-align:center;
				font-size:14px;
				font-weight:bold;
				color:#ffffff;
			}
			.error {
				color:red;
			}

		</style>

	</head>
	<body>
"@
			
			if($Global:LoggedErrors.Count -gt 0){
				$Errorsummary += "<h4>The following handled errors was thrown during the execution</h4>"
				
				Foreach($HandledError in $Global:LoggedErrors){
					$Errorsummary += "<font class=""error"">" + $HandledError + "</font><br>"
				}
			}
					
			if($Error.Count -gt 0){		
				$Errorsummary += "<h4>The following exceptions was thrown during script execution</h4>"
				
				$Errorsummary += "<table class=""errortable""><thead><tr class=""headerrow""><th>Category</th><th>Linenumber</th><th>Line</th><th>Stacktrace</th></tr></thead><tbody>"
				
				Foreach($erroritem in $error){
					
					$Category = $Erroritem.Categoryinfo.Reason
					$StackTrace = $Erroritem.ScriptStackTrace
					$LineNumber = $Erroritem.InvocationInfo.ScriptLineNumber
					$PositionMessage = $ErrorItem.InvocationInfo.PositionMessage
					
					$Errorsummary += "<tr><td>$Category</td><td>$Linenumber</td><td>$PositionMessage</td><td>$Stacktrace</td></tr>"
					
				}
				
				$Errorsummary += "</tbody></table></body></html>"
			}
			log info "Sending report"
			$subject = "$(Get-Date -format d): BigIP Report generation has has failed"
	        $body = "$errorsummary"
	
	        Foreach($Recipient in $Global:Bigipreportconfig.Settings.ErrorReporting.Recipients.Recipient){
		        send-MailMessage -SmtpServer $Global:Bigipreportconfig.Settings.ErrorReporting.SMTPServer -To $Recipient -From $Global:Bigipreportconfig.Settings.ErrorReporting.Sender -Subject $subject -Body $body -BodyAsHtml
	        }
		} else {
			log error "No error mail reporting enabled/configured"
		}
	}
}





log info "Configuring the console window"

#Make the console larger and increase the buffer
$PShost = Get-Host
$PSWindow = $PShost.ui.rawui
$PSWindowSize = $PSWindow.buffersize
$PSWindowSize.height = 3000
$PSWindowSize.width = [math]::floor([decimal]$PSWindow.MaxPhysicalWindowSize.width)-5
$PSwindow.buffersize = $PSWindowSize
$PSWindowSize = $PSWindow.windowsize
$PSWindowSize.height = 50
$PSWindowSize.width = $PSWindowSize.width = [math]::floor([decimal]$PSWindow.MaxPhysicalWindowSize.width)-5
$PSWindow.windowsize = $PSWindowSize

################################################################################################################################################
#
#	Pre-execution checks
#
################################################################################################################################################

log info "Pre-execution checks"

$SaneConfig = $true

if($Global:Bigipreportconfig.Settings.Credentials.Username -eq $null -or $Global:Bigipreportconfig.Credentials.Username -eq ""){
	log error "No username configured"
	$SaneConfig = $false
}

if($Global:Bigipreportconfig.Settings.Credentials.Password -eq $null -or $Global:Bigipreportconfig.Credentials.Password -eq ""){
	log error "No password configured"
	$SaneConfig = $false
}

if($Global:Bigipreportconfig.Settings.Loadbalancers -eq $null -or $Global:Bigipreportconfig.Settings.Loadbalancers.Loadbalancer.Count -eq 0 -or $Global:Bigipreportconfig.Settings.Loadbalancers.Loadbalancer -eq "" ){
	log error "No load balancers configured"
	$SaneConfig = $false
}

if($Global:Bigipreportconfig.Settings.DefaultDocument -eq $null -or $Global:Bigipreportconfig.Settings.DefaultDocument-eq ""){
	log error "No default document cofigured"
	$SaneConfig = $false
}

if($Global:Bigipreportconfig.Settings.LogSettings -eq $null -or $Global:Bigipreportconfig.Settings.LogSettings.Enabled -eq $null ){
	log error "Mandatory fields from the LogSettings section has been removed"
	$SaneConfig = $false
}

if($Global:Bigipreportconfig.Settings.LogSettings.Enabled -eq "true" ){

	if($Global:Bigipreportconfig.Settings.LogSettings.LogFilePath -eq $null -or $Global:Bigipreportconfig.Settings.LogSettings.LogLevel -eq $null -or $Global:Bigipreportconfig.Settings.LogSettings.MaximumLines -eq $null) {
		log error "Logging has been enabled but all logging fields has not been configured"	
		$SaneConfig = $false
	}
}

if($Global:Bigipreportconfig.Settings.Outputlevel -eq $null -or $Global:Bigipreportconfig.Settings.Outputlevel -eq ""){
	log error "No Outputlevel configured"
	$SaneConfig = $false
}

Foreach($Share in $Global:Bigipreportconfig.Settings.Shares.Share){
	
	log info "Mounting $($Share.Path)"
	
	& net use $($Share.Path) /user:$($Share.Username) $($Share.Password) | Out-Null
	
	if($?){
		log success "Share $($Share.Path) was mounted successfully"
	} else {
		log error "Share $($Share.Path) could not be mounted"
		$SaneConfig = $false
	}
}

if($Global:Bigipreportconfig.Settings.iRules -eq $null -or $Global:Bigipreportconfig.Settings.iRules.Enabled -eq $null -or $Global:Bigipreportconfig.Settings.iRules.ShowiRuleLinks -eq $null){
	log error "Missing options in the global iRule section defined in the configuration file. Old config version of the configuration file?"
	$SaneConfig = $false
}

if($Global:Bigipreportconfig.Settings.iRules.ShowDataGroupListsLinks -eq $null){
	log error "Missing options for showing data group list links in the global irules section defined in the configuration file. Old config version of the configuration file?"
	$SaneConfig = $false
}



if($Global:Bigipreportconfig.Settings.iRules.Enabled -eq $true -and $Global:Bigipreportconfig.Settings.iRules.ShowiRuleLinks -eq $false -and $Global:Bigipreportconfig.Settings.iRules.ShowDataGroupListsLinks -eq $true){
	log error "You can't show data group lists without showing irules in the current version."
	$SaneConfig = $false
}
if($Global:Bigipreportconfig.Settings.ReportRoot -eq $null -or $Global:Bigipreportconfig.Settings.ReportRoot -eq ""){
	log error "No report root configured"
	$SaneConfig = $false
} elseif(-not (Test-Path $Global:Bigipreportconfig.Settings.ReportRoot)){
	log error "Can't access the site root $($Global:Bigipreportconfig.Settings.ReportRoot)"
	$SaneConfig = $false
}

#Initialize iControlSnapin
if(Get-PSSnapin -Registered | Where-Object { $_.Description.contains("iControl") }){
	if ( (Get-PSSnapin | Where-Object { $_.Name -eq "iControlSnapIn"}) -eq $null ){
		Add-PSSnapIn iControlSnapIn
		if($?){
			log success "Loaded F5 iControl snapin"
		} else {
			log error "Failed to load F5 iControl, aborting"
			$SaneConfig = $false
		}
	}
} else {
	log error "iControl Snapin could not be found, aborting"
	$SaneConfig = $false
}


if(-not $SaneConfig){
	log info "There were errors during the config file sanity check"
	
	if($Global:Bigipreportconfig.Settings.ErrorReporting.Enabled -eq $true){
		log info "Attempting to sen an error report via mail"
		Send-Errors
	}
	
	log info "Exiting"
	Exit
} else {
	log success "Pre execution checks was successful"
}

################################################################################################################################################
#
#	Pre-execution checks
#
################################################################################################################################################




#Declaring variables

#Variables used for storing report data
$Global:BigIPDict = @{}
$Global:NATdict = @{}
$Global:virtualservers = @()
$Global:iRules = @()
$Global:pools = @()
$Global:nodes = @()
$Global:monitors = @()
$Global:DataGroupLists = @()
$Global:loadBalancers = @()
$Global:ASMPolicies = @()

#Make sure the site root ends with \
if(-not $Global:bigipreportconfig.Settings.ReportRoot.endswith("\")){
	$Global:bigipreportconfig.Settings.ReportRoot += "\"
}

#Build the path to the default document
$Global:reportpath = $Global:bigipreportconfig.Settings.ReportRoot + $Global:bigipreportconfig.Settings.Defaultdocument

#Build the json object paths
$Global:poolsjsonpath = $Global:bigipreportconfig.Settings.ReportRoot + "json\pools.json"
$Global:monitorsjsonpath = $Global:bigipreportconfig.Settings.ReportRoot + "json\monitors.json"
$Global:virtualserversjsonpath = $Global:bigipreportconfig.Settings.ReportRoot + "json\virtualservers.json"
$Global:irulesjsonpath = $Global:bigipreportconfig.Settings.ReportRoot + "json\irules.json"
$Global:datagrouplistjsonpath = $Global:bigipreportconfig.Settings.ReportRoot + "json\datagrouplists.json"


#Create types used to store the data gathered from the load balancers
Add-Type @'
public class VirtualServer
{
    public string name;
    public string ip;
	public string port;
	public string defaultpool;
	public string sslprofile;
	public string compressionprofile;
	public string persistence;
	public string[] irules;
	public string[] pools;
    public string[] vlans;
    public string trafficgroup;
    public string vlanstate;
	public string sourcexlatetype;
	public string sourcexlatepool;
	public string[] asmPolicies;
	public string availability;
	public string enabled;
	public string currentconnections;
	public string maximumconnections;
	public string cpuavg5sec;
	public string cpuavg1min;
	public string cpuavg5min;
	public string loadbalancer;
}
'@

Add-Type @'

public class Member {
	public string name;
	public string ip;
	public string port;
	public string availability;
	public string enabled;
	public string status;
	public long priority;
	public string currentconnections;
	public string maximumconnections;
}

public class Pool {
    public string name;
    public string[] monitors;
	public Member[] members;
	public string loadbalancingmethod;
	public string actiononservicedown;
	public string allownat;
	public string allowsnat;
	public string loadbalancer;
}
'@

Add-Type @'
public class iRule {
    public string name;
    public string[] pools;
	public string definition;
	public string loadbalancer;
}
'@

Add-Type @'
public class Node {
    public string ip;
    public string name;
	public string loadbalancer;
}
'@

Add-Type @'
public class Monitor {
    public string name;
    public string type;
	public string sendstring;
	public string receivestring;
	public string loadbalancer;
	public string interval;
	public string timeout;
}
'@


Add-Type @'
using System.Collections;

public class Datagrouplist {
    public string name;
    public string type;
	public Hashtable data;
	public string loadbalancer;
}
'@

Add-Type @'
	using System.Collections;

	public class Loadbalancer {
		public string name;
		public string version;
		public string build;
		public string baseBuild;
		public string model;
		public Hashtable modules;
	}

'@

Add-Type @'

	public class ASMPolicy {
		public string name;
		public string learningMode;
		public string enforcementMode;
		public string[] virtualServers;
		public string loadbalancer;
	}

'@

$Global:ModuleToShort = @{
	"TMOS_MODULE_ASM" = "ASM";
	"TMOS_MODULE_SAM" = "APM";
	"TMOS_MODULE_WAM" = "WAM";
	"TMOS_MODULE_WOM" = "WOM";
	"TMOS_MODULE_LC" = "LC";
	"TMOS_MODULE_LTM" = "LTM";
	"TMOS_MODULE_GTM" = "GTM";
	"TMOS_MODULE_WOML" = "WOML";
	"TMOS_MODULE_APML" = "APML";
	"TMOS_MODULE_EM" = "EM";
	"TMOS_MODULE_VCMP" = "VCMP";
	"TMOS_MODULE_UNKNOWN" = "UNKNOWN";
	"TMOS_MODULE_TMOS" = "TMOS";
	"TMOS_MODULE_HOST" = "HOST";
	"TMOS_MODULE_UI" = "UI";
	"TMOS_MODULE_MONITORS" = "MONITORS";
	"TMOS_MODULE_AVR" = "AVR";
	"TMOS_MODULE_ILX" = "ILX";
 }
 
$Global:ModuleToDescription = @{
	"ASM" = "The Application Security Module.";
	"APM" = "The Access Policy Module.";
	"WAM" = "The Web Accelerator Module.";
	"WOM" = "The WAN Optimization Module.";
	"LC" = "The Link Controller Module.";
	"LTM" = "The Local Traffic Manager Module.";
	"GTM" = "The Global Traffic Manager Module.";
	"UNKNOWN" = "The module is unknown (or unsupported by iControl).";
	"WOML" = "The WAN Optimization Module (Lite).";
	"APML" = "The Access Policy Module (Lite).";
	"EM" = "The Enterprise Manager Module.";
	"VCMP" = "The Virtual Clustered MultiProcessing Module.";
	"TMOS" = "The Traffic Management part of the Core OS.";
	"HOST" = "The non-Traffic Management = non-GUI part of the Core OS.";
	"UI" = "The GUI part of the Core OS.";
	"MONITORS" = "Represents the external monitors - used for stats only.";
	"AVR" = "The Application Visualization and Reporting Module";
	"ILX" = "iRulesLX"
}

$Global:LBMethodToString = @{
	"LB_METHOD_ROUND_ROBIN" = "Round Robin";
	"LB_METHOD_RATIO_Member" = "Ratio (Member)";
	"LB_METHOD_LEAST_CONNECTION_Member" = "Least Connections (Member)";
	"LB_METHOD_OBSERVED_Member" = "Observed (Member)";
	"LB_METHOD_PREDICTIVE_Member" = "Predictive (Member)";
	"LB_METHOD_RATIO_NODE_ADDRESS" = "Ratio (Node)";
	"LB_METHOD_LEAST_CONNECTION_NODE_ADDRESS" = "Least Connection (Node)";
	"LB_METHOD_FASTEST_NODE_ADDRESS" = "Fastest (node)";
	"LB_METHOD_OBSERVED_NODE_ADDRESS" = "Observed (node)";
	"LB_METHOD_PREDICTIVE_NODE_ADDRESS" = "Predictive (node)";
	"LB_METHOD_DYNAMIC_RATIO" = "Dynamic Ratio";
	"LB_METHOD_FASTEST_APP_RESPONSE" = "Fastest App Response";
	"LB_METHOD_LEAST_SESSIONS" = "Least sessions";
	"LB_METHOD_DYNAMIC_RATIO_Member" = "Dynamic Ratio (Member)";
	"LB_METHOD_L3_ADDR" = "L3 Address";
	"LB_METHOD_UNKNOWN" = "Unknown";
	"LB_METHOD_WEIGHTED_LEAST_CONNECTION_Member" = "Weighted Least Connection (Member)";
	"LB_METHOD_WEIGHTED_LEAST_CONNECTION_NODE_ADDRESS" = "Weighted Least Connection (Node)";
	"LB_METHOD_RATIO_SESSION" = "Ratio Sessions";
	"LB_METHOD_RATIO_LEAST_CONNECTION_Member" = "Ratio Least Connections (Member)";
	"LB_METHOD_RATIO_LEAST_CONNECTION_NODE_ADDRESS" = "Least Connections (Node)";
}

$Global:ActionOnPoolFailureToString = @{
	"SERVICE_DOWN_ACTION_NONE" = "None";
	"SERVICE_DOWN_ACTION_RESET" = "Reject";
	"SERVICE_DOWN_ACTION_DROP" = "Drop";
	"SERVICE_DOWN_ACTION_RESELECT" = "Reselect";
}

$Global:StateToString = @{
	"STATE_ENABLED" = "Yes";
	"STATE_DISABLED" = "No";
}


#Enable of disable the use of TLS1.2
if($Global:Bigipreportconfig.Settings.UseTLS12 -eq $true){
	log info "Enabling TLS1.2"
	[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}

#Make sure that the text is in UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

#If configured, read the NAT rules from the specified NAT File

if($Global:Bigipreportconfig.Settings.NATFilePath -ne ""){
	
	log info "NAT File has been configured"
	
	if(Test-Path -Path $Global:Bigipreportconfig.Settings.NATFilePath){
		
		$NATContent = Get-Content $Global:Bigipreportconfig.Settings.NATFilePath
		
		$NATContent | ForEach-Object {
			$arrLine = $_.split("=")	
			if($arrLine.Count -eq 2){
				$Global:NATdict[$arrLine[1]] = $arrLine[0]
			 } else {
			 	log error "Malformed NAT file content detected: Check $_"
			 }
		}
		
		if($NATdict.count -gt 0){
			log success "Loaded $($NATdict.count) NAT entries"
		} else {
			log error "No NAT entries loaded"
		}
	
	} else {
		log error "NAT file could not be found in location $($Global:Bigipreportconfig.Settings.NATFilePath)"
	}
}



#Region function cacheLTMinformation

#Function used to gather data from the load balancers
function cacheLTMinformation {
	Param(
		$f5,
		$loadbalancername,
		$LoadbalancerIP
	)
	
	$VersionInfo = $f5.SystemSystemInfo.get_product_information()

	#Declare temporary objects for this load balancer
	$LBVirtualservers = @()
	$LBPools = @()
	$LBNodes = @()
	$LBmonitors = @()
	$LBiRules = @()
	$LBDataGroupLists = @()
	$LBASMPolicies = @()
	
	#Regexp for parsing monitors from iRule definitions
	[regex]$poolregexp = "pool\s+([a-zA-Z0-9_\-\./]+)"
	
	$f5.SystemSession.set_active_folder("/");
	$f5.SystemSession.set_recursive_query_state("STATE_ENABLED");


	#Region Cache Load balancer information

	log info "Fetching information about the device"
	$loadBalancer = New-Object -Type Loadbalancer

	#Get the version information
	$versionInformation = ($f5.SystemSoftwareManagement.get_all_software_status()) | Where-Object { $_.active -eq "True" }

	#Get provisioned modules
	$modules = $f5.ManagementProvision.get_provisioned_list()

	$loadBalancer.name = $loadbalancername
	$loadBalancer.version = $versionInformation.version 
	$loadBalancer.build = $versionInformation.build
	$loadBalancer.baseBuild = $versionInformation.baseBuild

	$ModuleDict = @{}

	foreach($module in $modules){

		$moduleCode = [string]$module

		if($ModuleToShort.keys -contains $moduleCode){
			$moduleShortName = $ModuleToShort[$moduleCode]
		} else {
			$moduleShortName = $moduleCode.replace("TMOS_MODULE_", "")
		}
		
		if($ModuleToDescription.keys -contains $moduleShortName){
			$moduleDescription = $ModuleToDescription[$moduleShortName]
		} else {
			$moduleDescription = "No description found"
		}

		if(!($ModuleDict.keys -contains $moduleShortName)){
			$ModuleDict.add($moduleShortName, $moduleDescription)
		}
	}

	$LoadBalancer.modules = $ModuleDict

	$MajorVersion = $loadBalancer.version.Split(".")[0]
	$Minorversion = $loadBalancer.version.Split(".")[1]


	$Global:loadBalancers += $loadBalancer


	If($MajorVersion -gt 11){

		#Check if ASM is enabled
		if($ModuleDict.Keys -contains "ASM"){
				log info "Getting ASM Policy information"
			
			$AuthToken = Get-AuthToken -Loadbalancer $loadbalancername

			$headers = @{ "X-F5-Auth-Token" = $AuthToken; }

			$Response = Invoke-WebRequest -Method "GET" -Headers $headers -Uri "https://$loadbalancerip/mgmt/tm/asm/policies"
			$Policies = ($Response | ConvertFrom-Json).items

			Foreach($Policy in $Policies){

				$objTempPolicy = New-Object -Type ASMPolicy

				$objTempPolicy.name = $Policy.fullPath
				$objTempPolicy.enforcementMode = $Policy.enforcementMode
				$objTempPolicy.learningMode = $Policy.learningMode
				$objTempPolicy.virtualServers = $Policy.virtualServers
				$objTempPolicy.loadbalancer = $loadbalancername

				$LBASMpolicies += $objTempPolicy
			}

			$Global:ASMPolicies += $LBASMPolicies
		}
	}

	#EndRegion

	#Region Cache Node and monitor data
	
	#Cache information about iRules, nodes and monitors
	
	
	#Region Cache node data
		
	[array]$nodeaddresses = $f5.LocalLBNodeAddress.get_list()
	[array]$nodescreennames = $f5.LocalLBNodeAddress.get_screen_name($nodeaddresses)
	
	for($i=0;$i -lt ($nodeaddresses.Count);$i++){
		
		$objTempNode = New-Object Node
		
		$objTempNode.ip = [string]$nodeaddresses[$i]
		$objTempNode.name = [string]$nodescreennames[$i]
		$objTempNode.loadbalancer = $loadbalancername
				
		if($objTempNode.name -eq ""){
			$objTempNode.name = "Unnamed"
		}
		
		#Since the report does not fully support route domains, remove the %id.
		if($objTempNode.ip.Contains("%")){
			$objTempNode.ip = $objTempNode.ip.Split("%")[0]
		}
		
		
		$LBNodes += $objTempNode

	}
	
	$Global:nodes += $LBNodes
	
	#EndRegion
		
	#Region Caching monitor data
	log info "Caching monitors"
	
	[array]$MonitorList = $f5.LocalLBMonitor.get_template_list()		
	
	#Save the HTTP monitors separately since they have different properties
	[array]$HttpMonitors = $MonitorList | Where-Object { $_.template_type -eq "TTYPE_HTTP" -or $_.template_type -eq "TTYPE_HTTPS" }
	
	if($HttpMonitors.Count -gt 0){
		[array]$HttpmonitorsSendstrings = $f5.LocalLBMonitor.get_template_string_property($httpmonitors.template_name, $($HttpMonitors | ForEach-Object { 1 }))
		[array]$HttpmonitorsReceiveStrings = $f5.LocalLBMonitor.get_template_string_property($httpmonitors.template_name, $($HttpMonitors | ForEach-Object { 3 }))
		[array]$HttpmonitorsIntervals = $f5.LocalLBMonitor.get_template_integer_property($HttpMonitors.template_name,$($HttpMonitors | ForEach-Object { 1 }))
		[array]$HttpmonitorsTimeOuts = $f5.LocalLBMonitor.get_template_integer_property($HttpMonitors.template_name,$($HttpMonitors | ForEach-Object { 2 }))
	}
	
	#Save the monitors which has interval and timeout properties
	[array]$OtherMonitors = $MonitorList | Where-Object { @("TTYPE_ICMP", "TTYPE_GATEWAY_ICMP", "TTYPE_REAL_SERVER", "TTYPE_SNMP_DCA", "TTYPE_TCP_HALF_OPEN", "TTYPE_TCP", "TTYPE_UDP") -contains $_.template_type }
	
	if($OtherMonitors.Count -gt 0){
		[array]$OtherMonitorsIntervals = $f5.LocalLBMonitor.get_template_integer_property($OtherMonitors.template_name,$($OtherMonitors | ForEach-Object { 1 }))
		[array]$OtherMonitorsTimeouts = $f5.LocalLBMonitor.get_template_integer_property($OtherMonitors.template_name,$($OtherMonitors | ForEach-Object { 2 }))
	}
	
	#Save the rest here
	$NonCompatibleMonitors = $MonitorList | Where-Object { @("TTYPE_ICMP", "TTYPE_GATEWAY_ICMP", "TTYPE_REAL_SERVER", "TTYPE_SNMP_DCA", "TTYPE_TCP_HALF_OPEN", "TTYPE_TCP", "TTYPE_UDP", "TTYPE_HTTP", "TTYPE_HTTPS") -notcontains $_.template_type }
	
	For($i = 0;$i -lt $HttpMonitors.Count;$i++){
		
		$objTempMonitor = New-Object Monitor
		
		$objTempMonitor.name = $HttpMonitors[$i].template_name
		$objTempMonitor.sendstring = $HttpmonitorsSendstrings[$i].value
		$objTempMonitor.receivestring = $HttpmonitorsReceiveStrings[$i].value
		$objTempMonitor.interval = $HttpmonitorsIntervals[$i].value
		$objTempMonitor.timeout = $HttpmonitorsTimeOuts[$i].value
		$objTempMonitor.type = $HttpMonitors[$i].template_type
	
		$objTempMonitor.loadbalancer = $loadbalancername
		
		$LBMonitors += $objTempMonitor
	}
	
	For($i = 0;$i -lt $OtherMonitors.Count;$i++){
		
		$objTempMonitor = New-Object Monitor
		
		$objTempMonitor.name = $OtherMonitors[$i].template_name
		$objTempMonitor.sendstring = "N/A"
		$objTempMonitor.receivestring = "N/A"
		$objTempMonitor.interval = $OtherMonitorsIntervals[$i].value
		$objTempMonitor.timeout = $OtherMonitorsTimeouts[$i].value
		$objTempMonitor.type = $OtherMonitors[$i].template_type
		$objTempMonitor.loadbalancer = $loadbalancername
		
		$LBMonitors += $objTempMonitor
	}
	
	Foreach($monitor in $NonCompatibleMonitors){
	
		$objTempMonitor = New-Object Monitor
		
		$objTempMonitor.name = $monitor.template_name
		$objTempMonitor.sendstring = "N/A"
		$objTempMonitor.receivestring = "N/A"
		$objTempMonitor.interval = "N/A"
		$objTempMonitor.timeout = "N/A"
		$objTempMonitor.type = $monitor.template_type
		
		$objTempMonitor.loadbalancer = $loadbalancername
	
		$LBMonitors += $objTempMonitor
		
	}
	
	$Global:monitors += $LBMonitors
	
	#EndRegion
	
	#Region Cache Data group lists
	
	log info "Caching data group lists"

	[array]$AddressClassList = $f5.LocalLBClass.get_address_class_list()
	[array]$AddressClassKeys = $f5.LocalLBClass.get_address_class($AddressClassList)
	[array]$AddressClassValues = $f5.LocalLBClass.get_address_class_member_data_value($AddressClassKeys)

	#Get address type data group lists data
	For($i = 0;$i -lt $AddressClassList.Count;$i++){
		
		$ObjTempDataGroupList = New-Object -Type DataGroupList
		$ObjTempDataGroupList.name = $AddressClassList[$i]
		$ObjTempDataGroupList.type = "Address"
		
		$Dgdata = New-Object System.Collections.Hashtable
		
		for($x=0;$x -lt $AddressClassKeys[$i].members.Count;$x++){
			
			$Key = [string]$AddressClassKeys[$i].members[$x].Address + " " + [string]$AddressClassKeys[$i].members[$x].Netmask
			$Value = [string]$AddressClassValues[$i][$x]
			
			$Dgdata.Add($Key, $Value)
			
		}
		
		$ObjTempDataGroupList.data = $Dgdata
		$ObjTempDataGroupList.loadbalancer = $loadbalancername
		
		$Global:DataGroupLists += $ObjTempDataGroupList
		
	}

	$StringClassList = $f5.LocalLBClass.get_string_class_list()
	$StringClassKeys = $f5.LocalLBClass.get_string_class($StringClassList)
	$StringClassValues = $f5.LocalLBClass.get_string_class_member_data_value($StringClassKeys)

	For($i = 0;$i -lt $StringClassList.Count;$i++){
		
		$ObjTempDataGroupList = New-Object -Type DataGroupList
		$ObjTempDataGroupList.name = $StringClassList[$i]
		$ObjTempDataGroupList.type = "String"
		
		$Dgdata = New-Object System.Collections.Hashtable
		
		for($x=0;$x -lt $StringClassKeys[$i].members.Count;$x++){
			
			$Key = [string]$StringClassKeys[$i].members[$x]
			$Value = [string]$StringClassValues[$i][$x]
			
			$Dgdata.Add($Key, $Value)
		}
		
		$ObjTempDataGroupList.data = $Dgdata
		$ObjTempDataGroupList.loadbalancer = $loadbalancername
		
		$Global:DataGroupLists += $ObjTempDataGroupList
		
	}


	$ValueClassList = $f5.LocalLBClass.get_value_class_list()
	$ValueClassKeys = $f5.LocalLBClass.get_value_class($ValueClassList)
	$ValueClassValues = $f5.LocalLBClass.get_value_class_member_data_value($ValueClassKeys)

	For($i = 0;$i -lt $ValueClassList.Count;$i++){
		
		$ObjTempDataGroupList = New-Object -Type DataGroupList
		$ObjTempDataGroupList.name = $ValueClassList[$i]
		$ObjTempDataGroupList.type = "String"
		
		$Dgdata = New-Object System.Collections.Hashtable
		
		for($x=0;$x -lt $ValueClassKeys[$i].members.Count;$x++){
			
			$Key = [string]$ValueClassKeys[$i].members[$x]
			$Value = [string]$ValueClassValues[$i][$x]
			
			$Dgdata.Add($Key, $Value)
		}
		
		$ObjTempDataGroupList.data = $Dgdata
		$ObjTempDataGroupList.loadbalancer = $loadbalancername
		
		$Global:DataGroupLists += $ObjTempDataGroupList
		
	}

	#EndRegion
	#EndRegion
	
	#Region Caching Pool information
	
	log info "Caching Pools"
	
	[array]$Poollist = $f5.LocalLBPool.get_list()
	[array]$PoolMonitors = $f5.LocalLBPool.get_monitor_association($PoolList)
	[array]$PoolMembers = $f5.LocalLBPool.get_member_v2($PoolList)
	[array]$PoolMemberstatuses = $F5.LocalLBPool.get_member_object_status($PoolList, $Poolmembers)
	[array]$PoolMemberpriorities = $F5.LocalLBPool.get_member_priority($Poollist, $PoolMembers)
	[array]$PoolLBMethods = $F5.LocalLBPool.get_lb_method($PoolList)
	[array]$PoolActionOnServiceDown = $F5.LocalLBPool.get_action_on_service_down($PoolList)
	[array]$PoolAllowNAT = $F5.LocalLBPool.get_allow_nat_state($PoolList)
	[array]$PoolAllowSNAT = $F5.LocalLBPool.get_allow_snat_state($PoolList)
	[array]$PoolMemberStatistics = $F5.LocalLBPool.get_all_member_statistics($PoolList)
	
	for($i=0;$i -lt ($PoolList.Count);$i++){
	
		$objTempPool = New-Object -Type Pool
		$objTempPool.name = [string]$Poollist[$i]
		
		$PoolMonitors[$i].monitor_rule.monitor_templates | ForEach-Object {
			$monitorname = $_
			$objTempPool.monitors += $monitorname
		}

		$PoolMemberStatisticsDict = Get-PoolMemberStatisticsDictionary -PoolMemberStatsObjArray $PoolMemberStatistics[$i]
					
		For($x=0;$x -lt $PoolMembers[$i].count;$x++){
		
			#Create a new temporary object of the member class
			$objTempMember = New-Object Member
			
	    	#Populate the object
			$objTempMember.Name = $PoolMembers[$i][$x].address
			
			$objTempMember.ip = ($LBNodes | Where-Object { $_.name -eq $objTempMember.Name }).ip
			$objTempMember.Port = $PoolMembers[$i][$x].port
			$objTempMember.Availability = $PoolMemberstatuses[$i][$x].availability_status
			$objTempMember.Enabled = $PoolMemberstatuses[$i][$x].enabled_status
			$objTempMember.Status = $PoolMemberstatuses[$i][$x].status_description
			$objTempMember.Priority = $PoolMemberpriorities[$i][$x]
			
			#Remove the route domain id if it exists
			if($objTempMember.ip.contains("%")){
				$objTempMember.ip = $objTempMember.ip.Split("%")[0]
			}

			Try { 
				$Statistics = $PoolMemberStatisticsDict[$objTempMember.Name + ":" + [string]$objTempMember.port]
				$objTempMember.currentconnections = $Statistics["currentconnections"]
				$objTempMember.maximumconnections = $Statistics["maximumconnections"]
			} Catch {
				log "error" "Unable to get statistics for member $(objTempMember.Name):$(objTempMember.Port) in pool $($objTempPool.name)"
			}
			
			#Add the object to a list
			$objTempPool.members += $objTempMember
			
		}

		$objTempPool.loadbalancingmethod = $Global:LBMethodToString[[string]($PoolLBMethods[$i])]
		$objTempPool.actiononservicedown = $Global:ActionOnPoolFailureToString[[string]($PoolActionOnServiceDown[$i])]
		$objTempPool.allownat = $StateToString[[string]($PoolAllowNAT[$i])]
		$objTempPool.allowsnat = $StateToString[[string]($PoolAllowSNAT[$i])]
		$objTempPool.loadbalancer = $loadbalancername
		
		$LBPools += $objTempPool
	}
	
	$Global:Pools += $LBPools
	
	#EndRegion
	
	#Region Cache information about irules
			
	log info "Caching iRules"

	$f5.LocalLBRule.query_all_rules() | ForEach-Object {

		$objiRule = New-Object iRule
		
		$objiRule.name = $_.rule_name
		
		$partition = $objiRule.name.split("/")[1]
		
		$objiRule.loadbalancer = $loadbalancername

		$objiRule.definition = $($_.rule_definition)
		
		$tempPools = @()
		
		$poolregexp.Matches($objiRule.definition) | ForEach-Object {
			
			$tempPool = $_.Groups[1].value
					
			if(-not $tempPool.contains("/")){
				$tempPool = "/$partition/$tempPool"
			}
			
			if($LBPools | Where-Object { $_.name -eq $tempPool }) {								
				$tempPools += $tempPool
			}
							
		}
									
		$objiRule.pools = $tempPools | Select -Unique
			
		$LBiRules += $objiRule
	}
	
	$Global:iRules += $LBiRules
	
	#EndRegion	

	#Region Cache virtual address information

	$TrafficGroupDict = @{}

	[array]$virtualaddresslist = $f5.LocalLBVirtualAddressV2.get_list()
	[array]$virtualaddresstrafficgroups = $f5.LocalLBVirtualAddressV2.get_traffic_group($virtualaddresslist)

	for($i=0;$i -lt ($virtualaddresslist.Count);$i++){
		
		$VirtualAddress = $virtualaddresslist[$i]
		$TrafficGroup = $virtualaddresstrafficgroups[$i]

		$TrafficGroupDict.add($VirtualAddress, $TrafficGroup)

	}

	#EndRegion
	
	#Region Cache Virtual Server information
	
	log info "Caching Virtual servers"
	
	[array]$virtualserverlist = $f5.LocalLBVirtualServer.get_list()
	[array]$virtualserverdestinationlist = $f5.LocalLBVirtualServer.get_destination($virtualserverlist)
	[array]$virtualserverdefaultpoollist = $f5.LocalLBVirtualServer.get_default_pool_name($virtualserverlist)
	[array]$virtualserverprofilelist = $f5.LocalLBVirtualServer.get_profile($virtualserverlist)
	[array]$virtualserverirulelist = $f5.LocalLBVirtualServer.get_rule($virtualserverlist)
	[array]$virtualserverpersistencelist = $f5.LocalLBVirtualServer.get_persistence_profile($virtualserverlist)
    [array]$virtualservervlans = $f5.LocalLBVirtualServer.get_vlan($virtualserverlist);
	[array]$virtualserverdestination = $f5.LocalLBVirtualServer.get_destination($virtualserverlist)
	[array]$virtualserverstate = $F5.LocalLBVirtualServer.get_object_status($virtualserverlist)
	[array]$virtualserverstatistics = $f5.LocalLBVirtualServer.get_statistics($virtualserverlist)


	#Only supported since version 11.3
	Try {
		$virtualserversourceaddresstranslationtypelist = $f5.LocalLBVirtualServer.get_source_address_translation_type($virtualserverlist)
		$virtualserversourceaddresssnatpool = $f5.LocalLBVirtualServer.get_source_address_translation_snat_pool($virtualserverlist)
	} Catch {
		log info "Unable to get address translationlist"
	}
	
	for($i=0;$i -lt ($virtualserverlist.Count);$i++){
		
		$vsname = $virtualserverlist[$i]
		
		$objTempVirtualServer = New-Object VirtualServer
		
		#Set the name of the Virtual server
		$objTempVirtualServer.name = $vsname
		
		#Get the IP and port of the destination
		$objDst = $virtualserverdestinationlist[$i]
					
		$objTempVirtualServer.ip = [string]($objDst.Address)
		
		#Set the port to "Any" if it's 0
		if(($objDst.port) -eq 0){
			$objTempVirtualServer.port = "Any"
		} else {
			$objTempVirtualServer.port = [string]($objDst.port)
		}
		
		#Set the default pool
		$objTempVirtualServer.defaultpool = [string]$virtualserverdefaultpoollist[$i]
					
		#Set the ssl profile to None by default, then check if there's an SSL profile and 
		
        $objTempVirtualServer.sslprofile = "None";
		
		$virtualserverprofilelist[$i] | ForEach-Object {
			if([string]($_.profile_type) -eq "PROFILE_TYPE_CLIENT_SSL"){
				$objTempVirtualServer.sslprofile = $_.profile_name;
			}
		}
		
		$objTempVirtualServer.compressionprofile = "None";
		
		$virtualserverprofilelist[$i] | ForEach-Object {

			if([string]($_.profile_type) -eq "PROFILE_TYPE_HTTPCOMPRESSION"){
				$objTempVirtualServer.compressionprofile = $_.profile_name;
			}
		}
		
		#Get the iRules of the Virtual server
		$virtualserverirulelist[$i] | Sort-Object -Property priority | ForEach-Object {
			$tempName = $_.rule_name
			$objTempVirtualServer.irules += [string]$tempName
		}										
		
		if([string]($objTempVirtualServer.irules) -eq ""){
			$objTempVirtualServer.irules = @();
		}
		
		$objTempVirtualServer.loadbalancer = $loadbalancername
		
		#Get the persistence profile of the Virtual server
		
		if($virtualserverpersistencelist[$i] -ne $null){
			$objTempVirtualServer.persistence = [string]($virtualserverpersistencelist[$i].profile_name)
		} else {
			$objTempVirtualServer.persistence = "None"
		}
		
		#$objTempVirtualServer.irules
		$objTempVirtualServer.irules | ForEach-Object {
		
			$vsirulename = $_

			$iRule = $LBiRules | Where-Object { $_.name -eq $vsirulename}
			
			if($iRule.Count -gt 0){
				if($iRule.pools.Count -gt 0){
					$objTempVirtualServer.pools += [array]$iRule.pools | select -uniq
				}
			}
		}

		if($objTempVirtualServer.defaultpool -ne ""){
			$objTempVirtualServer.pools += $objTempVirtualServer.defaultpool
		}
		
		$objTempVirtualServer.pools = $objTempVirtualServer.pools | select -Unique
		
		Try{
			$objTempVirtualServer.sourcexlatetype = [string]$virtualserversourceaddresstranslationtypelist[$i]
			$objTempVirtualServer.sourcexlatepool = [string]$virtualserversourceaddresssnatpool[$i]
		} Catch {
			$objTempVirtualServer.sourcexlatetype = "OLDVERSION"
			$objTempVirtualServer.sourcexlatepool = "OLDVERSION"
		}
		
		
		if($Global:Bigipreportconfig.Settings.iRules.enabled -eq $false){
			#Hiding iRules to the users
			$objTempVirtualServer.irules = @();
		}

        if($virtualservervlans[$i].state -eq "STATE_DISABLED" -and $virtualservervlans[$i].vlans.count -eq 0){
            $objTempVirtualServer.vlanstate = "enabled"
        } elseif ($virtualservervlans[$i].state -eq "STATE_DISABLED") {
            $objTempVirtualServer.vlanstate = "disabled"
            $objTempVirtualServer.vlans = $virtualservervlans[$i].vlans
        } elseif ($virtualservervlans[$i].state -eq "STATE_ENABLED") {
            $objTempVirtualServer.vlanstate = "enabled"
            $objTempVirtualServer.vlans = $virtualservervlans[$i].vlans
        }

		$VSASMPolicies = $LBASMPolicies | Where-Object { $_.virtualServers -contains $vsname }

		if($VSASMPolicies -ne $null){
			$objTempVirtualServer.asmPolicies = $VSASMPolicies.name
		}

		$Partition = $objTempVirtualServer.name.split("/")[1]
		$Destination = $virtualserverdestination[$i].address

		$objTempVirtualServer.trafficgroup = $TrafficGroupDict["/$Partition/$Destination"]

		$objTempVirtualServer.availability = $virtualserverstate[$i].availability_status
		$objTempVirtualServer.enabled = $virtualserverstate[$i].enabled_status

		$VipStatistics = $virtualserverstatistics.statistics[$i].statistics

		#Connection statistics
		$objTempVirtualServer.currentconnections = Get-Int64 -High $($VipStatistics[8].value.high) -Low $($VipStatistics[8].value.low)
		$objTempVirtualServer.maximumconnections = Get-Int64 -High $($VipStatistics[9].value.high) -Low $($VipStatistics[9].value.low)
		
		#I don't remember seeing these in the older versions so I'll take the safe bet here
		Try {
			#CPU statistics
			$objTempVirtualServer.cpuavg5sec = Get-Int64 -High $($VipStatistics[38].value.high) -Low $($VipStatistics[38].value.low)
			$objTempVirtualServer.cpuavg1min = Get-Int64 -High $($VipStatistics[39].value.high) -Low $($VipStatistics[39].value.low)
			$objTempVirtualServer.cpuavg5min = Get-Int64 -High $($VipStatistics[40].value.high) -Low $($VipStatistics[40].value.low)
		} Catch {
			log "error" "Unable to get virtual server CPU statistics for $($objTempVirtualServer.name)"
		}

		$LBVirtualservers += $objTempVirtualServer

	}
	
	$Global:virtualservers += $LBVirtualservers
	
	#EndRegion
	
	#Region Get Orphaned Pools
	log info "Adding orphaned pools to the virtual server list"
	
	$VirtualserverPools = $LBVirtualservers.pools | select -Unique
	
	if($VirtualserverPools.count -gt 0){
	
		$OrphanedPools = $LBPools.name | Where-Object { $VirtualserverPools -notcontains $_ }

		foreach($OrphanPool in $OrphanedPools){
		
			$objTempVirtualServer = New-Object VirtualServer
			
			$objTempVirtualServer.name = "N/A (Orphan pool)"
			$objTempVirtualServer.ip = "N/A (Orphan pool)"
			$objTempVirtualServer.sslprofile = "None"
			$objTempVirtualServer.compressionprofile = "None"
			$objTempVirtualServer.persistence = "None"
			$objTempVirtualServer.irules = @()
			$objTempVirtualServer.pools = @($OrphanPool)
			$objTempVirtualServer.loadbalancer = $loadbalancername
			
			$Global:virtualservers += $objTempVirtualServer
		}
	}
	
	#EndRegion
}

#EndRegion

#Region Function Get-StatisticsDictionary

#Converts an F5 statistics object to a more accessible format

Function Get-PoolMemberStatisticsDictionary {

	Param($PoolMemberStatsObjArray)

	$StatisticsDictionary = @{}

	Foreach($PoolMemberStatsObj in $PoolMemberStatsObjArray.Statistics){

		$Member = $PoolMemberStatsObj.member.address + ":" + $PoolMemberStatsObj.member.port

		$Statistics = @{}

		$CurrentConnections = Get-Int64 -High $($PoolMemberStatsObj.statistics[4].value.high) -Low $($PoolMemberStatsObj.statistics[4].value.low)
		$MaximumConnections = Get-Int64 -High $($PoolMemberStatsObj.statistics[5].value.high) -Low $($PoolMemberStatsObj.statistics[5].value.low)

		$Statistics.add("currentconnections", $CurrentConnections)
		$Statistics.add("maximumconnections", $MaximumConnections)

		$StatisticsDictionary.add($Member, $Statistics)

	}

	Return $StatisticsDictionary
}

#EndRegion

#Region Function Get-Int64 

Function Get-Int64 {

	Param($High, $Low)

	Return ([math]::Pow($high, 32) + $low)

}

#EndRegion

#Region Function Get-AuthToken

Function Get-AuthToken {

	Param($Loadbalancer)

	$user = $Global:Bigipreportconfig.Settings.Credentials.Username
	$Password = $Global:Bigipreportconfig.Settings.Credentials.Password

	#Create the string that is converted to Base64
	$pair = $user + ":" + $Password
	 
	#Encode the string to base64
	$encodedCreds = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($pair))
	 
	#Add the "Basic prefix"
	$basicAuthValue = "Basic $encodedCreds"
	 
	#Prepare the headers
	$headers = @{
		"Authorization" = $basicAuthValue
		"Content-Type" = "application/json"
	}

	#Create the body of the post
	$body = @{"username" = $User; "password" = $Password; "loginProviderName" = "tmos" }
	 
	#Convert the body to Json
	$body = $Body | ConvertTo-Json
	 
	$response  = Invoke-WebRequest -Method "POST" -Headers $headers -Body $body -Uri "https://$Loadbalancer/mgmt/shared/authn/login" 
	 
	#Extract the token from the response
	$token = ($response.content | ConvertFrom-Json).Token.token
 	
 	Return $token
}

#EndRegion

#Region Function Get-iRules
	
Function Get-DefinedRules {

	$DefinedRules = $Bigipreportconfig.Settings.iRules.iRule

	$ruleObj = @()

	Foreach($Rule in ( $DefinedRules | Where-Object { $_.LoadBalancer -and $_.iRuleName } )){

		$tempRule = @{}

		$tempRule.add("loadBalancer", $Rule.loadBalancer)
		$tempRule.add("iRuleName", $Rule.iRuleName)

		$ruleObj += $tempRule
	}

	if($ruleObj.count -eq 0){
		"[]"
	} else {
		$ruleObj | ConvertTo-Json
	}

}

#EndRegion


#Region Function Translate-status
Function Translate-Member-Status {

	Param($Member)

	if($Member.Availability -eq "AVAILABILITY_STATUS_GREEN" -and $Member.Enabled -eq "ENABLED_STATUS_ENABLED"){
		Return '<span class="statusicon"><img src="./images/green-circle-checkmark.png" title="Pool member is up"/></span> <span class="textstatus">UP</span>'
	} elseif ($Member.Enabled -eq "ENABLED_STATUS_DISABLED_BY_PARENT" -and $Member.Status -eq "Pool member is available"){
		Return '<span class="statusicon"><img src="./images/black-circle-checkmark.png" title="Member available, but disabled by parent"/></span> <span class="textstatus">DISABLED</span>'
	} elseif ($Member.Status.contains("unable to connect") -or $Member.Status.contains("Could not connect")) {
		Return  '<span class="statusicon"><img src="./images/red-circle-cross.png" title="Could not connect, member down"/></span> <span class="textstatus">DOWN</span>'
	} elseif ($Member.Status.contains("Failed to succeed before deadline")) {
		Return '<span class="statusicon"><img src="./images/red-circle-cross.png" title="Failed to succed before deadline"/></span> <span class="textstatus">DOWN</span>'
	} elseif ($Member.Status -eq "Pool member is available, user disabled"){
		Return '<span class="statusicon"><img src="./images/black-circle-checkmark.png" title="Member is available, but disabled"/></span> <span class="textstatus">DISABLED</span>'
	} elseif ($Member.Availability -eq "AVAILABILITY_STATUS_RED" -and $Member.Enabled -eq "ENABLED_STATUS_ENABLED"){
		Return '<span class="statusicon"><img src="./images/red-circle-cross.png" title="Member is marked down by a monitor"/></span> <span class="textstatus">DOWN</span>'
	} elseif ($Member.Status -eq "Parent down"){
		Return '<span class="statusicon"><img src="./images/red-circle-cross.png" title="Parent monitor failed"/></span> <span class="textstatus">DOWN</span>'
	} elseif ($Member.Status -eq "Pool member does not have service checking enabled"){
		Return '<span class="statusicon"><img src="./images/blue-square-questionmark.png" title="Member has no monitor assigned"/></span> <span class="textstatus">UNKNOWN</span>'
	} elseif ($Member.Status -eq "Forced down"){
		Return '<span class="statusicon"><img src="./images/black-diamond-exclamationmark.png" tile="Member is forced down"/></span> <span class="textstatus">DISABLED</span>'
	} else {
		Return '<span class="statusicon"><img src="./images/blue-square-questionmark.png" title="Unknown status"/></span> <span class="textstatus">UNKNOWN</span>'
	}
}
#Endregion

#Region Function Translate-status
Function Translate-VirtualServer-Status {

	Param($virtualserver)

	if($virtualserver.enabled -eq "ENABLED_STATUS_ENABLED" -and $virtualserver.availability -eq "AVAILABILITY_STATUS_GREEN"){
	
		Return "<span class=`"statusicon`"><img src=`"./images/green-circle-checkmark.png`" title=`"Available (Enabled) - The virtual server is available`"/></span> <span class=`"textstatus`">UP</span>"
	
	} elseif($virtualserver.enabled -eq "ENABLED_STATUS_DISABLED" -and $virtualserver.availability -eq "AVAILABILITY_STATUS_BLUE"){
	
		Return "<span class=`"statusicon`"><img src=`"./images/black-circle-checkmark.png`" title=`"Unknown (Disabled) - The children pool member(s) either don't have service checking enabled, or service check results are not available yet`"/></span> <span class=`"textstatus`">DISABLED</span>"
	
	} elseif($virtualserver.enabled -eq "ENABLED_STATUS_ENABLED" -and $virtualserver.availability -eq "AVAILABILITY_STATUS_BLUE") {
	
		Return "<span class=`"statusicon`"><img src=`"./images/blue-square-questionmark.png`" title=`"Unknown (Enabled) - The children pool member(s) either don't have service checking enabled, or service check results are not available yet`"/></span> <span class=`"textstatus`">UNKNOWN</span>"
	
	} elseif($virtualserver.enabled -eq "ENABLED_STATUS_ENABLED" -and $virtualserver.availability -eq "AVAILABILITY_STATUS_RED"){
	
		Return "<span class=`"statusicon`"><img src=`"./images/red-circle-cross.png`" title=`"Offline (Enabled) - The children pool member(s) are down`"/></span> <span class=`"textstatus`">DOWN</span>"
	
	} elseif($virtualserver.enabled -eq "ENABLED_STATUS_DISABLED" -and $virtualserver.availability -eq "AVAILABILITY_STATUS_RED"){
	
		Return "<span class=`"statusicon`"><img src=`"./images/black-circle-checkmark.png`" title=`"Offline (Disabled) - The children pool member(s) are down`"/></span> <span class=`"textstatus`">DOWN</span>"
	
	}

}
#Endregion

#Region Call Cache LTM information
foreach($LoadbalancerIP in $Global:Bigipreportconfig.Settings.Loadbalancers.Loadbalancer) { 
	
	log info "Getting data from $LoadbalancerIP"
	
	$success = Initialize-F5.iControl -Username $Global:Bigipreportconfig.Settings.Credentials.Username -Password $Global:Bigipreportconfig.Settings.Credentials.Password -HostName $LoadbalancerIP
		
	if($?){
	
		log success "iControl session successfully established"
		
		$f5 = Get-F5.iControl
	
		log info "Getting hostname"
		
		$BigIPHostname = $F5.SystemInet.get_hostname()
		
		if($?){
			log info "Hostname is $BigipHostname"		
			$BigIPDict.add($LoadbalancerIP, $Bigiphostname)
		} else {
			log error "Failed to get hostname"
		}
	
		log info "Caching LTM information from $BigIPHostname"
		cacheLTMinformation -f5 $f5 -loadbalancername $BigIPHostname -LoadbalancerIP $LoadbalancerIP
		
	} else {
		log error "Failed to connect to $LoadbalancerIP"
	}
}

#EndRegion

#Region Function Test-ReportData

#Verify that data from all the load balancers has been indexed by checking the pools variable

function Test-ReportData {
	
	$Nonemissing = $true
	
	log info "Verifying load balancer data to make sure that no load balancer is missing"
	
	#For every load balancer IP we will check that no pools or virtual servers are missing
	Foreach($LoadbalancerIP in $Global:Bigipreportconfig.Settings.Loadbalancers.Loadbalancer) {
		
		#Check if the BigipDict contains an value for the key IP
		if($BigIPDict.ContainsKey($LoadbalancerIP)){

			$LoadbalancerName = $BigIPDict[$LoadbalancerIP]
			
			#Verify that the $Global:virtualservers contains the $LoadbalancerName
			if($Global:pools.Count -ne 0){
				if(!$Global:pools.loadbalancer.contains($LoadbalancerName)){
					log error "$LoadbalancerName does not have any pool data"
					$Nonemissing = $false
				}
			}			
			
			#Verify that the $Global:pools contains the $LoadbalancerName
			if(($Global:virtualservers | Where-Object { $_.name -ne "N/A (Orphan pool)" }).Count -ne 0){
				if(!$Global:virtualservers.loadbalancer.contains($LoadbalancerName)){
					log error "$LoadbalancerName does not have any virtual server data"
					$Nonemissing = $false
				}
			}
			
			#Verify that the $Global:monitors contains the $LoadbalancerName
			if($Global:monitors.Count -ne 0){			
				if(!$Global:monitors.loadbalancer.contains($LoadbalancerName)){
					log error "$LoadbalancerName does not have any monitor data"
					$Nonemissing = $false
				}
			}
			
			#Verify that the $Global:irules contains the $LoadbalancerName
			if($Global:irules.Count -ne 0){	
				if(!$Global:irules.loadbalancer.contains($LoadbalancerName)){
					log error "$LoadbalancerName does not have any irules data"
					$Nonemissing = $false
				}
			}
			
			#Verify that the $Global:nodes contains the $LoadbalancerName
			if($Global:nodes.Count -ne 0){	
				if(!$Global:nodes.loadbalancer.contains($LoadbalancerName)){
					log error "$LoadbalancerName does not have any nodes data"
					$Nonemissing = $false
				}
			}
			
			#Verify that the $Global:DataGroupLists contains the $LoadbalancerName
			if($Global:DataGroupLists.Count -ne 0){	
				if(!$Global:DataGroupLists.loadbalancer.contains($LoadbalancerName)){
					log error "$LoadbalancerName does not have any data group lists data"
					$Nonemissing = $false
				}
			}
			
		} else {
			log error "$LoadbalancerIP does not seem to have been indexed"
			$Nonemissing = $false
		}
	}
	
	Return $Nonemissing
}
#EndRegion

#Region Function Update-ReportData
Function Update-ReportData {
	
	[bool]$Status = $true
	
	#Move the temp files to the actual report files
	log info "Updating the report with the new data"
	
	Move-Item -Force $($Global:reportpath + ".tmp") $Global:reportpath
	
	if(!$?){ 
		log error "Failed to update the report file"	
		$Status  = $false
	}
	
	Move-Item -Force $($Global:poolsjsonpath + ".tmp") $Global:poolsjsonpath
	
	if(!$?){
		log error "Failed to update the temporary pools json file"
		$Status  = $false
	}
	
	Move-Item -Force $($Global:monitorsjsonpath + ".tmp") $Global:monitorsjsonpath
	
	if(!$?){ 
		log error "Failed to update the temporary monitor json file"
		$Status  = $false
	}

	Move-Item -Force $($Global:virtualserversjsonpath + ".tmp") $Global:virtualserversjsonpath
	
	if(!$?){ 
		log error "Failed to update the temporary virtual server json file"
		$Status  = $false
	}


	Move-Item -Force $($Global:irulesjsonpath + ".tmp") $Global:irulesjsonpath
	
	if(!$?){ 
		log error "Failed to update the temporary irules json file"
		$Status  = $false
	}
	
	Move-Item -Force $($Global:datagrouplistjsonpath + ".tmp") $Global:datagrouplistjsonpath
	
	if(!$?){ 
		log error "Failed to update the temporary data group lists json file"
		$Status  = $false
	}
	
	Return $Status
	
}

#EndRegion

#Region Function Write-TemporaryFiles
Function Write-TemporaryFiles {
	
	#This is done to save some downtime if writing the report over a slow connection
	#or if the report is really big.
	
	$Status = $true
	
	$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
    
	log info "Writing report temporary file to $($Global:reportpath + ".tmp")"
	
	$StreamWriter = New-Object System.IO.StreamWriter($($Global:reportpath + ".tmp"), $false, $Utf8NoBomEncoding,0x10000)
	$StreamWriter.Write($Global:html)
	
	if(!$?){ 
		log error "Failed to update the temporary report file"	
		$Status  = $false
	}
	
	$StreamWriter.dispose()
	
	log info "Writing temporary pools json object to $($Global:poolsjsonpath + ".tmp")"	
	
	$StreamWriter = New-Object System.IO.StreamWriter($($Global:poolsjsonpath + ".tmp"), $false, $Utf8NoBomEncoding,0x10000)
	$StreamWriter.Write($($Global:pools | ConvertTo-Json -Compress -Depth 5))
	
	if(!$?){ 
		log error "Failed to update the temporary pool json file"	
		$Status  = $false
	}
	
	$StreamWriter.dispose()
	
	log info "Writing temporary monitor json object to $($Global:monitorsjsonpath + ".tmp")"
	$StreamWriter = New-Object System.IO.StreamWriter($($Global:monitorsjsonpath + ".tmp"), $false, $Utf8NoBomEncoding,0x10000)
	$StreamWriter.Write($($Global:monitors | ConvertTo-Json -Compress -Depth 5))
	
	if(!$?){ 
		log error "Failed to update the temporary monitor json file"	
		$Status  = $false
	}

	$StreamWriter.dispose()
	
	log info "Writing temporary virtual server json object to $($Global:virtualserversjsonpath + ".tmp")"
	
	$StreamWriter = New-Object System.IO.StreamWriter($($Global:virtualserversjsonpath + ".tmp"), $false, $Utf8NoBomEncoding,0x10000)
	$StreamWriter.Write($($Global:virtualservers | ConvertTo-Json -Compress -Depth 5))
	
	if(!$?){ 
		log error "Failed to update the temporary virtual server json file"	
		$Status  = $false
	}
	
	$StreamWriter.dispose()
	
	if($Global:Bigipreportconfig.Settings.iRules.Enabled -eq $true){
		
		log info "Writing temporary irules json object to $($Global:irulesjsonpath + ".tmp")"
		
		$StreamWriter = New-Object System.IO.StreamWriter($($Global:irulesjsonpath + ".tmp"), $false, $Utf8NoBomEncoding,0x10000)
		$StreamWriter.Write($($Global:irules | ConvertTo-Json -Compress -Depth 5))
		
		if(!$?){ 
			log error "Failed to update the temporary irules json file"	
			$Status  = $false
		}
		
	} else {
		
		log info "iRule links disabled in config. Writing empty json object to $($Global:irulesjsonpath + ".tmp")"
		
		$StreamWriter = New-Object System.IO.StreamWriter($($Global:irulesjsonpath + ".tmp"), $false, $Utf8NoBomEncoding,0x10000)
		
		#Since rules has been disabled, only write those defined
		$ruleScope = $Global:irules | Where-Object { $_.name -in $Bigipreportconfig.Settings.iRules.iRule.iRuleName -and $_.loadbalancer -in $Bigipreportconfig.Settings.iRules.iRule.loadbalancer }

		if($ruleScope.count -eq 0){
			$StreamWriter.Write("[]")
		} else {
			$StreamWriter.Write($($ruleScope | ConvertTo-Json -Compress -Depth 5))
		}
		if(!$?){ 
			log error "Failed to update the temporary irules json file"	
			$Status  = $false
		}
	}
	
	$StreamWriter.dispose()
	
	if($Global:Bigipreportconfig.Settings.iRules.ShowDataGroupListsLinks -eq $true){
		
		log info "Writing temporary data group list json object to $($Global:datagrouplistjsonpath + ".tmp")"
		
		$StreamWriter = New-Object System.IO.StreamWriter($($Global:datagrouplistjsonpath + ".tmp"), $false, $Utf8NoBomEncoding,0x10000)
		$StreamWriter.Write($($Global:DataGroupLists | ConvertTo-Json -Compress -Depth 5))
		
		if(!$?){ 
			log error "Failed to update the temporary data group lists json file"	
			$Status  = $false
		}
	} else {
		
		log info "Data group list links disabled in config. Writing empty json object to $($Global:datagrouplistjsonpath + ".tmp")"
		
		$StreamWriter = New-Object System.IO.StreamWriter($($Global:datagrouplistjsonpath + ".tmp"), $false, $Utf8NoBomEncoding,0x10000)
		$StreamWriter.Write("[]")
		
		if(!$?){ 
			log error "Failed to update the temporary data group lists json file"	
			$Status  = $false
		}
	}
	
	$StreamWriter.dispose()	
	
	Return $Status
}

#EndRegion

#Region Check for missing data and if the report contains ASM profiles
if(-not (Test-ReportData)){
	log error "Missing load balancer data, no report will be written"
	Send-Errors
	Exit
}

log success "No missing loadbalancer data was detected, compiling the report"

if(($virtualservers.asmPolicies | Where-Object { $_.count -gt 0 }).Count -gt 0){
	$HasASMProfiles = $true
} else {
	$HasASMProfiles = $false
}

#EndRegion

#Global:html contains the report html data
#Add links to style sheets, jquery and datatables and some embedded javascripts

$Global:html = @'

<html>
	<head>

		<script type="text/javascript" language="javascript" src="./js/pace.js"></script>
		<script type="text/javascript" language="javascript" src="./js/jquery.min.js"></script>
		<script type="text/javascript" language="javascript" src="./js/jquery.dataTables.min.js"></script>
		
		<link href="./css/pace.css" rel="stylesheet" type="text/css"/>
		<link href="./css/jquery.dataTables.css" rel="stylesheet" type="text/css">
		<link href="./css/bigipreportstyle.css" rel="stylesheet" type="text/css">
		<link href="./css/sh_style.css" rel="stylesheet" type="text/css">
		
		<script type="text/javascript" language="javascript" src="./js/jquery.highlight.js"></script>
		<script type="text/javascript" language="javascript" src="./js/bigipreport.js"></script>
		<script type="text/javascript" language="javascript" src="./js/sh_main.js"></script>
		
		<script>
'@
		
		$ruleObj = Get-DefinedRules
		$Global:html += "`nvar definedRules = " + $ruleObj + ";`n"

		if($Global:Bigipreportconfig.Settings.iRules.enabled -eq $true){
			$Global:html += "var ShowiRules = true;"
		} else {
			$Global:html += "var ShowiRules = false;"
		}
		
		if($Global:Bigipreportconfig.Settings.iRules.ShowiRuleLinks -eq $true){
			$Global:html += "var ShowiRuleLinks = true;"
		} else {
			$Global:html += "var ShowiRuleLinks = false;"
		}

		if($Global:Bigipreportconfig.Settings.iRules.ShowDataGroupListsLinks -eq $true){
			$Global:html += "var ShowDataGroupListsLinks = true;"
		} else {
			$Global:html += "var ShowDataGroupListsLinks = false;"
		}

		if($Global:Bigipreportconfig.Settings.ExportLink.Enabled -eq $true){
			$Global:html += "var ShowExportLink = true;"
		} else {
			$Global:html += "var ShowExportLink = false;"
		}		


$Global:html += @'		
		</script>
	</head>
	<body>
		<div class="bigipreportheader"><img src="./images/bigipreportlogo.png"/></div>
'@

	#Show the div used to contain information generating by clicking at pool members
	$Global:html += @'
	
		<div id='allbigipsdiv' class="lbdiv" style="position:absolute;visibility:visible;width:100%";>
		<table id="allbigips" class="bigiptable">
			<thead>
				<tr>
					<th><input type="text" name="loadBalancer" value="Load Balancer" class="search_init" data-column-name="Load balancer" data-setting-name="showLoadBalancerColumn"/></th>
					<th><input type="text" name="vipName" value="VIP Name" class="search_init" data-column-name="Virtual server" data-setting-name="showVirtualServerColumn"/></th>
					<th><input type="text" name="ipPort" value="IP:Port" class="search_init" data-column-name="IP:Port" data-setting-name="showIPPortColumn" /></th>
'@

	if($HasASMProfiles){
		$Global:html += @'
					<th class="asmPoliciesHeaderCell"><input type="text" name="asmPolicies" size=6 value="ASM" class="search_init" data-column-name="ASM Policies" data-setting-name="showASMPoliciesColumn"/></th>
'@
	}

		$Global:html += @'
					<th class="sslProfileProfileHeaderCell"><input type="text" name="sslProfile" size=6 value="SSL" class="search_init" data-column-name="SSL Profile" data-setting-name="showSSLProfileColumn"/></th>
					<th class="compressionProfileHeaderCell"><input type="text" name="compressionProfile" size=6 value="Compression" class="search_init" data-column-name="Compression Profile" data-setting-name="showCompressionProfileColumn" /></th>
					<th class="persistenceProfileHeaderCell"><input type="text" name="persistenceProfile" size=6 value="Persistence" class="search_init" data-column-name="Persistence Profile" data-setting-name="showPersistenceProfileColumn"/></th>
					<th><input type="text" name="pool_members" value="Pool/Members" class="search_init" data-column-name="Pools/Members" data-setting-name="showPoolsMembersColumn"/></th>
				</tr>
			</thead>
			<tbody>
'@

#Initiate variables used for showing progress (in case the debug is set)
$vscount = $virtualservers.Count
$i = 0 

#Initiate variables to give unique id's to pools and members
$xPool = 0
$xMember = 0
$xVirtual = 0

foreach($LoadbalancerName in $BigIPDict.values){

	#Cache objects to make the search faster
	$LBvirtualservers = $Global:virtualservers | Where-Object { $_.loadbalancer -eq $loadbalancerName }
	$LBpools = $Global:pools | Where-Object { $_.loadbalancer -eq $loadbalancerName }
	$LBnodes = $Global:nodes | Where-Object { $_.loadbalancer -eq $loadbalancerName }
	$LBmonitors = $Global:monitors | Where-Object { $_.loadbalancer -eq $loadbalancerName }
	$LBiRules = $Global:irules | Where-Object { $_.loadbalancer -eq $loadbalancerName }
	$LBDataGroupLists = $Global:datagrouplists | Where-Object { $_.loadbalancer -eq $loadbalancerName }
	
	foreach($vs in $LBvirtualservers
	){
		
		$i++
		
		if($Outputlevel -eq "Verbose"){
			Write-Progress -activity "Generating HTML for $LoadbalancerName. $i virtual servers out of $vscount done." -status "Progress: " -PercentComplete (($i / $vscount)  * 100)
		}
		
		$Global:html += @"
					
					<tr class="virtualserverrow">
						<td class="loadbalancerCell" NOWRAP data-loadbalancer="$($vs.loadbalancer)">
							$(
								if($Global:Bigipreportconfig.Settings.HideLoadBalancerFQDN -eq $true){
									$vs.loadbalancer.split('.')[0]
								} else {
									$vs.loadbalancer
								}
							)
						</td>
"@

		if($vs.name -eq "N/A (Orphan pool)"){
			$Global:html += @"

						<td class="virtualServerCell">
							N/A (Orphan pool)
						</td>
"@

		} else {
			$Global:html += @"

						<td class="virtualServerCell">
							$(Translate-VirtualServer-Status -virtualserver $vs) <a href="javascript:void(0);" class="tooltip" data-originalvirtualservername="$($vs.name)" data-loadbalancer="$($vs.loadbalancer)" onClick="Javascript:showVirtualServerDetails(`$(this).attr('data-originalvirtualservername').trim(),`$(this).attr('data-loadbalancer').trim());">$($vs.name) <span class="detailsicon"><img src="./images/details.png"/></span><p>Click to see virtual server details</p></a> <span class="adcLinkSpan"><a href="https://$($vs.loadbalancer)/tmui/Control/jspmap/tmui/locallb/virtual_server/properties.jsp?name=$($vs.name)">Edit</a></span>
						</td>
"@
		}
		#Remove any route domain from the virtual server ip and store in vsipexrd in order to be able to compare with NAT translation list (which would not contain route domains)
		$vsipexrd = $vs.ip -replace "%[0-9]+$", ""
		
		if($NATdict.Contains($vsipexrd)){
			$Global:html += @"
			
						<td class="centeredCell">
							$($vs.ip + ":" + $vs.port)<br>Public IP:$($NATdict[$vsipexrd])
						</td>
"@
		} else {
			$Global:html += @"
			
						<td class="centeredCell">
							$($vs.ip + ":" + $vs.port)
						</td>
"@
		}

		if($HasASMProfiles){

			$Global:html += @"
						<td class="centeredCell">
"@

			if($vs.asmPolicies.count -gt 0){
				
				for($i = 0; $i -lt $vs.asmPolicies.Count; $i++){
					$ASMObj = $Global:ASMPolicies | Where-Object { $_.name -eq $vs.asmPolicies[$i] -and $_.loadbalancer -eq $vs.loadbalancer }

					if($ASMObj.enforcementMode -eq "blocking"){
						$vs.asmPolicies[$i] = $vs.asmPolicies[$i] + " (B)"
					} else {
						$vs.asmPolicies[$i] = $vs.asmPolicies[$i] + " (T)"
					}
				}

				$Global:html += $vs.asmPolicies -Join "<br>"

			} else {
				$Global:html += @'
							N/A
'@
			}

			$Global:html += @"
						</td>
"@

		}
		
		if($vs.sslprofile -ne "None"){
			$Global:html += @"
				
						<td class="centeredCell">
							Yes
						</td>
"@
		} else {
			$Global:html += @"
					
						<td class="centeredCell">
							No
						</td>
"@
		}
		

		if($vs.compressionprofile -ne "None"){
			$Global:html += @"
			
						<td class="centeredCell">
							Yes
						</td>
"@
		} else {
			$Global:html += @"
						
						<td class="centeredCell">
							No
						</td>
"@
			}
		
		$Global:html += @"
					
					<td class="centeredCell">
						$(
							if($vs.persistence -eq "None" ){
								"No"
							} else {
								"Yes"
							}
						)
					</td>
"@

		if(!($vs.pools | ?{ !($Global:Bigipreportconfig.Settings.PoolExceptions.PoolException -contains $_) })){
			$Global:html += @"
						
						<td>
							N/A
						</td>
"@
		} else {
			$firstpool = $true
			
			foreach($vspool in $vs.pools){
				if(!($Global:Bigipreportconfig.Settings.PoolExceptions.PoolException -Contains $vspool -or $vspool -eq "")){		
					
					$pool = $LBPools | where { $_.name -eq $vspool }
									
					if($firstpool){
						$xPool++;
						$Global:html += @"
											
						<td class="PoolInformation" data-vsid=$i>
							<div class="expand" id="expand-$i">
								<a href="javascript:void(0);"><img src="./images/chevron-down.png"/></a>
							</div>
							<div class="collapse" id="collapse-$i">
								<a href="javascript:void(0);"><img src="./images/chevron-up.png"/></a>
							</div>
							<div class="AssociatedPoolsInfo" data-vsid=$i id="AssociatedPoolsInfo-$i"> Click here to show $($vs.pools.Count) associated pools</div>
							<div id="PoolInformation-$i" class="pooltablediv">
							<table class="pooltable">
								<tr class="$pool-$xPool" onMouseOver="javascript:togglePoolHighlight(this);" onMouseOut="javascript:togglePoolHighlight(this);">
									<td rowspan=$($pool.members.Count) data-vsid=$i class="poolname" id=Pool$xPool>
											<a href="javascript:void(0);" class="tooltip" data-originalpoolname="$vspool" data-loadbalancer="$($vs.loadbalancer)" onClick="Javascript:showPoolDetails(`$(this).attr('data-originalpoolname').trim(), `$(this).attr('data-loadbalancer').trim());"> 
"@
						if($Global:Bigipreportconfig.Settings.PartitionInformation.ShowPoolPartition -eq $false){ 
							$Global:html += @"
								$($vspool.split("/")[2]) <span class="detailsicon"><img src="./images/details.png"/></span>
"@
						} else {
							$Global:html += @"
							$vspool <span class="detailsicon"><img src="./images/details.png"/></span>
"@											
						}
											$Global:html += @"
											<p>Click to see pool details</p></a>  
											<span class="adcLinkSpan"><a href="https://$($pool.loadbalancer)/tmui/Control/jspmap/tmui/locallb/pool/properties.jsp?name=$($pool.name)">Edit</a></span>
									</td>
"@
						$firstpool = $false
					} else {
						$xPool++;
						$Global:html += @"
							
								<tr class="$pool-$xPool" onMouseOver="javascript:togglePoolHighlight(this);" onMouseOut="javascript:togglePoolHighlight(this);">
									<td rowspan=$($pool.members.Count) class="poolname" id="Pool$xPool">
										
											<a href="javascript:void(0);" class="tooltip" data-originalpoolname="$vspool" data-loadbalancer="$($vs.loadbalancer)" onClick="Javascript:showPoolDetails(`$(this).attr('data-originalpoolname').trim(), `$(this).attr('data-loadbalancer').trim());">
"@

											if($Global:Bigipreportconfig.Settings.PartitionInformation.ShowPoolPartition -eq $false){ 
												$Global:html += @"
												$($vspool.split("/")[2]) <span class="detailsicon"><img src="./images/details.png"/></span>
"@
											} else {
												$Global:html += @"
												$vspool <span class="detailsicon"><img src="./images/details.png"/></span>
"@											
											}

											$Global:html += @"
											<p>Click to see pool details</p></a>  
											<span class="adcLinkSpan"><a href="https://$($pool.loadbalancer)/tmui/Control/jspmap/tmui/locallb/pool/properties.jsp?name=$($pool.name)">Edit</a></span>
									</td>
"@
					}
					
					$firstmember = $true

					foreach($Member in $pool.members){
						
						if($Member){
								
							if($Global:Bigipreportconfig.Settings.PartitionInformation.ShowPoolMemberPartition -eq $false){
								$MemberName = $Member.name.split("/")[2]
							} else {
								$MemberName = $Member.name
							}
							
							if($firstmember){
								
								$xMember++;
								
								$Global:html += @"
								
									<td class="PoolMember" id="Poolmember$xMember">
										$($MemberName + ":" + $Member.port) - $($Member.ip + ":" + $Member.port) - $(Translate-Member-Status -Member $Member)
									</td>
								</tr>
"@
								$firstmember = $false
							} else {
							
								$xMember++;
								
								$Global:html += @"
								
								<tr class="$pool-$xPool">
									<td class="PoolMember" id="Poolmember$xMember">
										$($MemberName + ":" + $Member.port) - $($Member.ip + ":" + $Member.port) - $(Translate-Member-Status -Member $Member)
									</td>
								</tr>
"@
							}
						}
						
					}
				}
			}
			$Global:html += @"
								</table>
								</div>
							</td>
"@
		}
		$Global:html += @"
						
						</tr>
"@
	}
}

$Global:html += @"

				</tbody>
			</table>
			<br>
			<font size=-1>
				<i>
					The report was generated on $($env:computername) using BigIP Report version $($Global:ScriptVersion). Script started at <span id="Generationtime">$starttime</span> and took $([int]($(Get-Date)-$starttime).totalminutes) minutes to finish. 
				</i>
			</font>

		</div>
"@


$Global:html += @"

	<div class="lightbox" id="firstlayerdiv">
		<div id="firstlayerdetailsheader" class="firstlayerdetailsheader"></div>
		<div class="innerLightbox">
			<div class="firstlayerdetailscontent" id="firstlayerdetailscontentdiv">
				
			</div>
		</div>
		<div id="firstlayerdetailsfooter" class="firstlayerdetailsfooter"></div>
	</div>
	
	<div class="lightbox" id="secondlayerdiv">
		<div class="secondlayerdetailsheader"></div>
		<div class="innerLightbox">
			<div class="secondlayerdetailscontent" id="secondlayerdetailscontentdiv">
				
			</div>
			
		</div>
		<div class="secondlayerdetailsfooter" id="secondlayerdetailsfooter"></div>
	</div>
	
	
	</body>
</html>
"@


# Time to write temporary files and then update the report

$TemporaryFilesWritten = $false

if(-not (Write-TemporaryFiles)){
	
	#Failed to write the temporary files
	log error "Failed to write the temporary files, waiting 2 minutes and trying again"
	Sleep 120
	
	if(Write-TemporaryFiles){
		$TemporaryFilesWritten = $true
		log success "Successfully wrote the temporary files"
	} else {
		log error "Failed to write the temporary files. No report has been created/updated"
	}
} else {
	$TemporaryFilesWritten = $true
	log success "Successfully wrote the temporary files"
}

if($TemporaryFilesWritten){
	#Had some problems with the move of the temporary files
	#Adding a sleep to allow the script to finish writing
	Sleep 10
	
	if(Update-ReportData){
		log success "The report has been successfully been updated"
	} else {
		
		#Failed, trying again after two minutes
		Sleep 120
		
		if(Update-ReportData){
			log success "The report has been successfully been updated"
		} else {
			log error "Failed to create/update the report"
		}
		
	}	
} else {
	log error "The writing of the temporary files failed, no report files will be updated"
}

Send-Errors

if($Global:Bigipreportconfig.Settings.LogSettings.Enabled -eq $true){
    
    $LogFile = $Global:Bigipreportconfig.Settings.LogSettings.LogFilePath
    
    if(Test-Path $LogFile){
         log info "Pruning logfile"
        
        $MaximumLines = $Global:Bigipreportconfig.Settings.LogSettings.MaximumLines

        $LogContent = Get-Content $LogFile
        $LogContent | Select -Last $MaximumLines | Out-File $LogFile
    }
}