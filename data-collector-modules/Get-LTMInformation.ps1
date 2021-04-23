
[System.Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidAssignmentToAutomaticVariable','')]
Param(
    $Global:ConfigurationFile = "$PSScriptRoot/bigipreportconfig.xml",
    $Global:PollLoadBalancer = $null,
    $Global:Location = $null
)

Set-StrictMode -Version Latest
if ($null -ne $Location) {
    # child process has both lb and location
    $ErrorActionPreference = "SilentlyContinue"
    $ProgressPreference = "SilentlyContinue"
    # PowerShell does not inherit PWD in pre v7
    Set-Location -Path $Location
    $PSScriptRoot = $Location
} else {
    # testing has just lb but no location
    $ErrorActionPreference = "Continue"
    $ProgressPreference = "SilentlyContinue"
    Set-Location -Path $PSScriptRoot
}

# Session object to store the session to the lb in
$Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# PowerShell does not apply PWD to the IO library
if ([IO.Directory]::GetCurrentDirectory() -ne $PSScriptRoot) {
    [IO.Directory]::SetCurrentDirectory($PSScriptRoot)
}

# Case sensitive dictionaries
function c@ {
    New-Object Collections.Hashtable ([StringComparer]::CurrentCulture)
}

# Variables for storing handled error messages
$Global:LoggedErrors = @()

# Load balancer data for the report
$Global:ReportObjects = c@ {};

#No BOM Encoding in the log file
$Global:Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False

################################################################################################################################################
#
#    Logs to console and file function
#
################################################################################################################################################

# Default until we load the config
$Global:Outputlevel = "Verbose"
Function log {
    Param ([string]$LogType = "info", [string]$Message = "")

    # Initiate the log header with date and time
    $CurrentTime = $(Get-Date -UFormat "%Y-%m-%d %H:%M:%S")
    $LogHeader = $CurrentTime + ' ' + $($LogType.toUpper()) + ' '

    if ($null -ne $Location) {
        # Child processes just log to stdout
        $LogLineDict = @{}

        $LogLineDict["datetime"] = $CurrentTime
        $LogLineDict["severity"] = $LogType.toupper()
        $LogLineDict["message"] = $Message

        Write-Output $LogLineDict | ConvertTo-Json -Compress
        return
    }

    # Log errors, warnings, info and success to loggederrors.json
    if ($LogType -eq "error" -Or $LogType -eq "warning" -Or $LogType -eq "info" -Or $LogType -eq "success") {
        $LogLineDict = @{}

        $LogLineDict["datetime"] = $CurrentTime
        $LogLineDict["severity"] = $LogType.toupper()
        $LogLineDict["message"] = $Message

        $Global:LoggedErrors += $LogLineDict
    }

    if (Test-Path variable:global:Bigipreportconfig) {
      if ($Global:Bigipreportconfig.Settings.LogSettings.Enabled -eq $true) {
        $LogFilePath = $Global:Bigipreportconfig.Settings.LogSettings.LogFilePath
        $LogLevel = $Global:Bigipreportconfig.Settings.LogSettings.LogLevel

        switch ($Logtype) {
            "error" { [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) }
            "warning" { [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) }
            "info" { if ($LogLevel -eq "Verbose") { [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) } }
            "success" { if ($LogLevel -eq "Verbose") { [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) } }
            "verbose" { if ($LogLevel -eq "Verbose") { [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) } }
            default { if ($LogLevel -eq "Verbose") { [System.IO.File]::AppendAllText($LogFilePath, "$LogHeader$Message`n", $Global:Utf8NoBomEncoding) } }
        }
      }
    }

    $ConsoleHeader = $CurrentTime + ' '

    switch ($logtype) {
        "error" { Write-Host $("$ConsoleHeader$Message") -ForegroundColor "Red" }
        "warning" { Write-Host $("$ConsoleHeader$Message") -ForegroundColor "Yellow" }
        "info" { if ($OutputLevel -eq "Verbose") { Write-Host $("$ConsoleHeader$Message") -ForegroundColor "Gray" } }
        "success" { if ($OutputLevel -eq "Verbose") { Write-Host $("$ConsoleHeader$Message") -ForegroundColor "Green" } }
        "verbose" { if ($OutputLevel -eq "Verbose") { Write-Host "$ConsoleHeader$Message" } }
        default { if ($OutputLevel -eq "Verbose") { Write-Host "$ConsoleHeader$Message" } }
    }
}

log verbose "Starting: PSCommandPath=$PSCommandPath ConfigurationFile=$ConfigurationFile PollLoadBalancer=$PollLoadBalancer Location=$Location PSScriptRoot=$PSScriptRoot"

#Check if the configuration file exists
if (Test-Path $ConfigurationFile) {
    #Read the file as xml
    [xml]$Global:Bigipreportconfig = Get-Content $ConfigurationFile

    #Verify that the file was succssfully loaded, otherwise exit
    if ($?) {
        $Outputlevel = $Global:Bigipreportconfig.Settings.Outputlevel
        log success "Successfully loaded the config file: $ConfigurationFile"
    } else {
        log error "Can't read the config file: $ConfigurationFile from $PSScriptRoot, or config file corrupt. Aborting."
        Exit
    }
} else {
    log error "Failed to load config file $ConfigurationFile from $PSScriptRoot. Aborting."
    Exit
}

#Declaring variables

#Create types used to store the data gathered from the load balancers
Add-Type @'

    using System.Collections;
    public class VirtualServer
    {
        public string name;
        public string description;
        public string ip;
        public string port;
        public string profiletype;
        public string defaultpool;
        public string httpprofile;
        public string[] sslprofileclient;
        public string[] sslprofileserver;
        public string compressionprofile;
        public string[] persistence;
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
        public string description;
        public string[] monitors;
        public Member[] members;
        public string loadbalancingmethod;
        public string actiononservicedown;
        public string allownat;
        public string allowsnat;
        public bool orphaned;
        public string loadbalancer;
        public string availability;
        public string enabled;
        public string status;
    }

    public class iRule {
        public string name;
        public string[] pools;
        public string[] datagroups;
        public string[] virtualservers;
        public string definition;
        public string loadbalancer;
    }

    public class Node {
        public string ip;
        public string name;
        public string description;
        public string loadbalancer;
    }

    public class Monitor {
        public string name;
        public string type;
        public string sendstring;
        public string receivestring;
        public string disablestring;
        public string loadbalancer;
        public string interval;
        public string timeout;
    }

    public class Datagroup {
        public string name;
        public string type;
        public Hashtable data;
        public string[] pools;
        public string loadbalancer;
    }

    public class PoolStatusVip {
        public string url;
        public string working;
        public string state;
    }

    public class ASMPolicy {
        public string name;
        public string learningMode;
        public string enforcementMode;
        public string[] virtualServers;
        public string loadbalancer;
    }

    public class CertificateDetails {
        public string commonName;
        public string countryName;
        public string stateName;
        public string localityName;
        public string organizationName;
        public string divisionName;
    }

    public class Certificate {
        public string fileName;
        public long expirationDate;
        public CertificateDetails subject;
        public string issuer;
        public string subjectAlternativeName;
        public string loadbalancer;
    }

    public class Loadbalancer {
        public string name;
        public string ip;
        public string version;
        public string build;
        public string baseBuild;
        public string model;
        public string category;
        public string serial;
        public bool active;
        public bool isonlydevice;
        public string color;
        public string sync;
        public Hashtable modules;
        public PoolStatusVip statusvip;
        public bool success = true;
        public string hasSupport = "unknown";
        public string supportErrorMessage;
    }
'@

$Global:ModuleToDescription = @{
    "asm"      = "The Application Security Module.";
    "apm"      = "The Access Policy Module.";
    "wam"      = "The Web Accelerator Module.";
    "wom"      = "The WAN Optimization Module.";
    "lc"       = "The Link Controller Module.";
    "ltm"      = "The Local Traffic Manager Module.";
    "gtm"      = "The Global Traffic Manager Module.";
    "unknown"  = "The module is unknown (or unsupported by iControl).";
    "woml"     = "The WAN Optimization Module (Lite).";
    "apml"     = "The Access Policy Module (Lite).";
    "em"       = "The Enterprise Manager Module.";
    "vcmp"     = "The Virtual Clustered MultiProcessing Module.";
    "tmos"     = "The Traffic Management part of the Core OS.";
    "host"     = "The non-Traffic Management = non-GUI part of the Core OS.";
    "ui"       = "The GUI part of the Core OS.";
    "monitors" = "Represents the external monitors - used for stats only.";
    "avr"      = "The Application Visualization and Reporting Module";
    "ilx"      = "iRulesLX"
}

#Enable of disable the use of TLS1.2
if ($Global:Bigipreportconfig.Settings.UseTLS12 -eq $true) {
    log verbose "Enabling TLS1.2"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}

#Make sure that the text is in UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Function Convert-MaskToCIDR([string] $dottedMask)
{
  $result = 0;
  # ensure we have a valid IP address
  [IPAddress] $ip = $dottedMask;
  $octets = $ip.IPAddressToString.Split('.');
  foreach($octet in $octets)
  {
    while(0 -ne $octet)
    {
      $octet = ($octet -shl 1) -band [byte]::MaxValue
      $result++;
    }
  }
  return $result;
}

#Region function Get-LTMInformation

#Function used to gather data from the load balancers
function Get-LTMInformation {
    Param(
        $LoadBalancerObjects
    )

    #Set some variables to make the code nicer to read
    $LoadBalancerName = $LoadBalancerObjects.LoadBalancer.name
    $LoadBalancerIP = $LoadBalancerObjects.LoadBalancer.ip

    $MajorVersion = $LoadBalancerObjects.LoadBalancer.version.Split(".")[0]

    #Region ASM Policies

    $LoadBalancerObjects.ASMPolicies = c@ {}

    #Check if ASM is enabled
    if ($LoadBalancerObjects.LoadBalancer.modules["asm"]) {

        log verbose "Getting ASM Policy information from $LoadBalancerName"
        try {
            $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/asm/policies"
        } Catch {
            $Line = $_.InvocationInfo.ScriptLineNumber
            log error "Unable to load ASM policies from $LoadBalancerName. (line $Line)"
        }

        Foreach ($Policy in $Response.items) {
            $ObjTempPolicy = New-Object -Type ASMPolicy

            $ObjTempPolicy.name = $Policy.fullPath
            if (Get-Member -inputobject $Policy -name 'enforcementMode') {
                $ObjTempPolicy.enforcementMode = $Policy.enforcementMode
            }
            if (Get-Member -inputobject $Policy -name 'learningMode') {
                $ObjTempPolicy.learningMode = $Policy.learningMode
            }
            if (Get-Member -inputobject $Policy -name 'virtualServers') {
                $ObjTempPolicy.virtualServers = $Policy.virtualServers
            }
            $ObjTempPolicy.loadbalancer = $LoadBalancerName

            $LoadBalancerObjects.ASMPolicies.add($ObjTempPolicy.name, $ObjTempPolicy)
        }
    }

    #EndRegion

    #Region Cache certificate information

    log verbose "Caching certificates from $LoadBalancerName"

    $LoadBalancerObjects.Certificates = c@ {}

    $Response = ""
    try {
        $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/sys/crypto/cert"
    } catch {
        $Line = $_.InvocationInfo.ScriptLineNumber
        log error "Error loading certificates from $LoadBalancerIP : $_ (line $Line)"
    }

    $unixEpochStart = new-object DateTime 1970, 1, 1, 0, 0, 0, ([DateTimeKind]::Utc)

    if (Get-Member -InputObject $Response -Name 'items') {
        Foreach ($Certificate in $Response.items) {
            $ObjSubject = New-Object -TypeName "CertificateDetails"

            if (Get-Member -inputobject $Certificate -name "commonName") {
                $ObjSubject.commonName = $Certificate.commonName
            }
            if (Get-Member -inputobject $Certificate -name "country") {
                $ObjSubject.countryName = $Certificate.country
            }
            if (Get-Member -inputobject $Certificate -name "state") {
                $ObjSubject.stateName = $Certificate.state
            }
            if (Get-Member -inputobject $Certificate -name "city") {
                $ObjSubject.localityName = $Certificate.city
            }
            if (Get-Member -inputobject $Certificate -name "ou") {
                $ObjSubject.organizationName = $Certificate.organization
            }
            if (Get-Member -inputobject $Certificate -name "ou") {
                $ObjSubject.divisionName = $Certificate.ou
            }

            $ObjCertificate = New-Object -TypeName "Certificate"

            $ObjCertificate.fileName = $Certificate.fullPath
            $expiration = [datetime]::ParseExact($Certificate.apiRawValues.expiration.Replace(' GMT', '').Replace("  ", " "), "MMM d H:mm:ss yyyy", [CultureInfo]::InvariantCulture)
            $ObjCertificate.expirationDate = ($expiration - $unixEpochStart).TotalSeconds
            $ObjCertificate.subject = $ObjSubject
            if (Get-Member -inputobject $Certificate -name "subjectAlternativeName") {
                $ObjCertificate.subjectAlternativeName = $Certificate.subjectAlternativeName.replace('DNS:', '')
            } else {
                $ObjCertificate.subjectAlternativeName = ""
            }
            if (Get-Member -inputobject $Certificate -name "issuer") {
                $ObjCertificate.issuer = $Certificate.issuer
            } else {
                $ObjCertificate.issuer = ""
            }
            $ObjCertificate.loadbalancer = $LoadBalancerName

            $LoadBalancerObjects.Certificates.add($ObjCertificate.fileName, $ObjCertificate)
        }
    }

    #EndRegion

    #Region Cache node data

    $LoadBalancerObjects.Nodes = c@ {}

    log verbose "Caching nodes from $LoadBalancerName"

    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/node"
    $Nodes = $Response.items

    Foreach ($Node in $Nodes) {
        $ObjTempNode = New-Object Node

        $ObjTempNode.ip = $Node.address
        $ObjTempNode.name = $Node.name
        if (Get-Member -inputobject $Node -name "description") {
            $ObjTempNode.description = [Regex]::Unescape($Node.description)
        } else {
            $ObjTempNode.description = ""
        }
        $ObjTempNode.loadbalancer = $LoadBalancerName

        if ($ObjTempNode.name -eq "") {
            $ObjTempNode.name = "Unnamed"
        }

        $LoadBalancerObjects.Nodes.add($ObjTempNode.name, $ObjTempNode)
    }

    #EndRegion

    #Region Caching monitor data

    $LoadBalancerObjects.Monitors = c@ {}

    log verbose "Caching monitors from $LoadBalancerName"

    $Monitors = $()
    Foreach ($MonitorType in ("http", "https", "icmp", "gateway-icmp", "real-server", "snmp-dca", "tcp-half-open", "tcp", "udp")) {
        $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/monitor/$MonitorType"
        [array]$Monitors += $Response.items
    }

    Foreach ($Monitor in $Monitors) {
        $ObjTempMonitor = New-Object Monitor

        $ObjTempMonitor.loadbalancer = $LoadBalancerName

        $ObjTempMonitor.name = $Monitor.fullPath
        $ObjTempMonitor.interval = $Monitor.interval
        $ObjTempMonitor.timeout = $Monitor.timeout
        $ObjTempMonitor.type = $Monitor.kind.Replace("tm:ltm:monitor:", "")

        if (Get-Member -inputobject $Monitor -name "send") {
            $ObjTempMonitor.sendstring = $Monitor.send
        } else {
            $ObjTempMonitor.sendstring = ""
        }
        if (Get-Member -inputobject $Monitor -name "recv") {
            $ObjTempMonitor.receivestring = $Monitor.recv
        } else {
            $ObjTempMonitor.receivestring = ""
        }

        if (Get-Member -inputobject $Monitor -name "recvDisable") {
            $ObjTempMonitor.disablestring = $Monitor.recvDisable
        } else {
            $ObjTempMonitor.disablestring = ""
        }

        $LoadBalancerObjects.Monitors.add($ObjTempMonitor.name, $ObjTempMonitor)
    }

    #EndRegion

    #Region Caching Pool information

    log verbose "Caching Pools from $LoadBalancerName"

    $LoadBalancerObjects.Pools = c@ {}

    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/pool?expandSubcollections=true"
    [array]$Pools = $Response.items

    $PoolStatsDict = c@ {}
    If ($MajorVersion -ge 12) {
        # Need 12+ to support members/stats
        $Response = Invoke-WebRequest -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/pool/members/stats" |
        ConvertFrom-Json -AsHashtable
        Foreach ($PoolStat in $Response.entries.Values) {
            $PoolStatsDict.add($PoolStat.nestedStats.entries.tmName.description, $PoolStat.nestedStats.entries)
        }
    }

    Foreach ($Pool in $Pools) {
        $ObjTempPool = New-Object -Type Pool
        $ObjTempPool.loadbalancer = $LoadBalancerName
        $ObjTempPool.name = $Pool.fullPath
        if (Get-Member -inputobject $Pool -name 'monitor') {
            # Split into words and take any that start with /
            # Could be at least "<monitor> and <monitor>" or "min 1 of { <monitor> <monitor> }"
            $objTempPool.monitors = [array]$Pool.monitor.split(' ') -match '\/[^ ]*'
        }
        $ObjTempPool.loadbalancingmethod = $Pool.loadBalancingMode
        $ObjTempPool.actiononservicedown = $Pool.serviceDownAction
        $ObjTempPool.allownat = $Pool.allowNat
        $ObjTempPool.allowsnat = $Pool.allowSnat
        if (Get-Member -inputobject $Pool -name 'description') {
            $ObjTempPool.description = [Regex]::Unescape($Pool.description)
        } else {
            $ObjTempPool.description = ""
        }
        if (!$PoolStatsDict[$Pool.fullPath]) {
            log verbose ("Polling stats for " + $Pool.fullPath)
            # < v12 does not support member/stats, poll stats for each pool
            $uri = "https://$LoadBalancerIP/mgmt/tm/ltm/pool/" + $Pool.fullPath.replace("/", "~") + "/stats?`$filter=partition%20eq%20" + $Pool.fullPath.Split("/")[1]
            $Response = Invoke-WebRequest -WebSession $Session -SkipCertificateCheck -Uri $uri | ConvertFrom-Json -AsHashtable
            try {
                $PoolStatsDict.add($Pool.fullPath, $Response.entries.Values.nestedStats.entries)
            } catch {
                $PoolStatsDict.add($Pool.fullPath, $Response.entries)
            }
        }
        $ObjTempPool.availability = $PoolStatsDict[$Pool.fullPath].'status.availabilityState'.description
        $ObjTempPool.enabled = $PoolStatsDict[$Pool.fullPath].'status.enabledState'.description
        $ObjTempPool.status = $PoolStatsDict[$Pool.fullPath].'status.statusReason'.description

        if ($Pool.membersReference.Count -gt 0) {
            $MemberStatsDict = c@ {}
            $search = 'https://localhost/mgmt/tm/ltm/pool/members/' + $Pool.fullPath.replace("/", "~") + '/members/stats'
            try {
                $MemberStats = $PoolStatsDict[$Pool.fullPath].$search.nestedStats.entries
            } catch {
                $uri = "https://$LoadBalancerIP/mgmt/tm/ltm/pool/" + $Pool.fullPath.replace("/", "~") + "/members/stats"
                $Response = Invoke-WebRequest -WebSession $Session -SkipCertificateCheck -Uri $uri | ConvertFrom-Json -AsHashtable
                try {
                    $MemberStats = $Response.entries
                } catch {
                    $MemberStats = c@ {}
                }
            }
            Foreach ($MemberStat in $MemberStats.Values) {
              if ($MemberStat.nestedStats.entries.nodeName.description.contains(':')) {
                # IPv6 has dot separator for port
                $MemberStatsDict.add($MemberStat.nestedStats.entries.nodeName.description + '.' + $MemberStat.nestedStats.entries.port.value, $MemberStat.nestedStats.entries)
              } else {
                # IPv4 has colon separator for port
                $MemberStatsDict.add($MemberStat.nestedStats.entries.nodeName.description + ':' + $MemberStat.nestedStats.entries.port.value, $MemberStat.nestedStats.entries)
              }
            }
            try {
                Foreach ($PoolMember in $Pool.membersReference.items) {
                    #Create a new temporary object of the member class
                    $ObjTempMember = New-Object Member
                    $ObjTempMember.Name = $PoolMember.fullPath
                    $ObjTempMember.ip = $PoolMember.address
                    if ($PoolMember.name -match ':.*\.') {
                      $ObjTempMember.Port = $PoolMember.name.split('.')[1]
                    } else {
                      $ObjTempMember.Port = $PoolMember.name.split(':')[1]
                    }
                    $ObjTempMember.Priority = $PoolMember.priorityGroup
                    $ObjTempMember.Status = $PoolMember.state

                    try {
                        $ObjTempMember.Availability = $MemberStatsDict[$PoolMember.fullPath].'status.availabilityState'.description
                    } catch {
                        $ObjTempMember.Availability = ""
                    }
                    $ObjTempMember.Enabled = $MemberStatsDict[$PoolMember.fullPath].'status.enabledState'.description
                    $ObjTempMember.currentconnections = $MemberStatsDict[$PoolMember.fullPath].'serverside.curConns'.value
                    $ObjTempMember.maximumconnections = $MemberStatsDict[$PoolMember.fullPath].'serverside.maxConns'.value

                    $ObjTempPool.members += $ObjTempMember
                }
            } catch {}
        }
        $LoadBalancerObjects.Pools.add($ObjTempPool.name, $ObjTempPool)
    }

    #EndRegion

    #Region Cache DataGroups

    log verbose "Caching datagroups from $LoadBalancerName"

    $LoadBalancerObjects.DataGroups = c@ {}
    $Pools = $LoadBalancerObjects.Pools.Keys | Sort-Object -Unique

    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/data-group/internal"
    $DataGroups = $Response.items

    Foreach ($DataGroup in $DataGroups) {

        $ObjTempDataGroup = New-Object -Type DataGroup
        $ObjTempDataGroup.name = $DataGroup.fullPath
        $ObjTempDataGroup.type = $DataGroup.type
        $ObjTempDataGroup.loadbalancer = $LoadBalancerName
        $Partition = $DataGroup.partition

        $Dgdata = New-Object System.Collections.Hashtable
        $TempPools = @()

        if (Get-Member -inputobject $DataGroup -name 'records') {
            Foreach ($Record in $DataGroup.records) {
                if (Get-Member -inputobject $Record -name 'data') {
                    $DgData.Add($Record.name, $Record.data)
                } else {
                    $DgData.Add($Record.name, "")
                    continue
                }

                # if data contains pool names, add to .pools and change type to Pools
                if ($record.data.contains("/")) {
                    $TempPool = $Record.data
                } else {
                    $TempPool = "/$Partition/" + $Record.data
                }

                if ($Pools -contains $TempPool) {
                    $TempPools += $TempPool
                }
            }
        }

        $ObjTempDataGroup.data = $Dgdata

        if ($TempPools.Count -gt 0) {
            $ObjTempDataGroup.pools = @($TempPools | Sort-Object -Unique)
            $ObjTempDataGroup.type = "Pools"
        } else {
            $ObjTempDataGroup.pools = @()
        }

        $LoadBalancerObjects.DataGroups.add($ObjTempDataGroup.name, $ObjTempDataGroup)
    }

    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/data-group/external"

    if (Get-Member -inputobject $Response -name 'items') {
        Foreach ($DataGroup in $Response.items) {

            $ObjTempDataGroup = New-Object -Type DataGroup
            $ObjTempDataGroup.name = $DataGroup.fullPath
            $ObjTempDataGroup.type = $DataGroup.type
            $ObjTempDataGroup.loadbalancer = $LoadBalancerName

            $LoadBalancerObjects.DataGroups.add($ObjTempDataGroup.name, $ObjTempDataGroup)
        }
    }

    #EndRegion

    #Region Cache iRules

    log verbose "Caching iRules from $LoadBalancerName"

    $DataGroups = $LoadBalancerObjects.DataGroups.Keys | Sort-Object -Unique

    $LoadBalancerObjects.iRules = c@ {}

    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/rule"
    $iRules = $Response.items

    $LastPartition = ''

    Foreach ($iRule in $iRules) {
        $ObjiRule = New-Object iRule

        $ObjiRule.name = $iRule.fullPath
        if (Get-Member -inputobject $iRule -name "apiAnonymous") {
            $ObjiRule.definition = $iRule.apiAnonymous
        } else {
            $ObjiRule.definition = ""
        }
        $ObjiRule.loadbalancer = $LoadBalancerName

        $Partition = $iRule.partition

        if ($Partition -ne $LastPartition) {
            $SearchPools = $Pools -replace "/$Partition/", ""
            $SearchDataGroups = $DataGroups -replace "/$Partition/", ""
        }

        $LastPartition = $Partition

        $MatchedPools = @($SearchPools | Where-Object { $ObjiRule.definition -match '(?<![\w-])' + [regex]::Escape($_) + '(?![\w-])' } | Sort-Object -Unique)
        $MatchedPools = $MatchedPools -replace "^([^/])", "/$Partition/`$1"
        $ObjiRule.pools = $MatchedPools

        $MatchedDataGroups = @($SearchDataGroups | Where-Object { $ObjiRule.definition -match '(?<![\w-])' + [regex]::Escape($_) + '(?![\w-])' } | Sort-Object -Unique)
        $MatchedDataGroups = $MatchedDataGroups -replace "^([^/])", "/$Partition/`$1"
        $ObjiRule.datagroups = $MatchedDataGroups

        $ObjiRule.virtualservers = @()

        $LoadBalancerObjects.iRules.add($ObjiRule.name, $ObjiRule)
    }

    #EndRegion

    #Region Cache profiles

    log verbose "Caching profiles from $LoadBalancerName"

    $ProfileLinks = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/profile"

    $ProfileDict = c@ {}

    Foreach ($ProfileLink in $ProfileLinks.items.reference.link) {
        $ProfileType = $ProfileLink.split("/")[7].split("?")[0]
        $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/profile/${ProfileType}"
        if (Get-Member -inputobject $Response -name 'items') {
            Foreach ($Profile in $Response.items) {
                $ProfileDict.add($Profile.fullPath, $Profile)
            }
        }
    }

    #EndRegion

    #Region Cache virtual address information

    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/virtual-address"
    $VirtualAddresses = $Response.items

    $TrafficGroupDict = c@ {}

    Foreach ($VirtualAddress in $VirtualAddresses) {
        $TrafficGroupDict.add($VirtualAddress.fullPath, $VirtualAddress.trafficGroup)
    }

    #EndRegion

    #Region Cache Virtual Server information

    log verbose "Caching Virtual servers from $LoadBalancerName"

    $LoadBalancerObjects.VirtualServers = c@ {}

    $Response = ""
    try {
        $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/virtual?expandSubcollections=true"
        [array]$VirtualServers = $Response.items

        $VirtualStatsDict = c@ {}
        $Response = Invoke-WebRequest -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/ltm/virtual/stats" |
        ConvertFrom-Json -AsHashtable
        Foreach ($VirtualStat in $Response.entries.Values) {
            $VirtualStatsDict.add($VirtualStat.nestedStats.entries.tmName.description, $VirtualStat.nestedStats.entries)
        }

        Foreach ($VirtualServer in $VirtualServers) {
            $ObjTempVirtualServer = New-Object VirtualServer

            $ObjTempVirtualServer.loadbalancer = $LoadBalancerName
            $ObjTempVirtualServer.name = $VirtualServer.fullPath
            if (Get-Member -inputobject $VirtualServer -name 'description') {
                $ObjTempVirtualServer.description = [Regex]::Unescape($VirtualServer.description)
            } else {
                $ObjTempVirtualServer.description = ""
            }
            # remove partition name if present (internal vs do not have a partition)
            $destination = $VirtualServer.destination -replace ".*/", ""
            if ($destination -match ':.*\.') {
              # parse ipv6 addresses deaf:beef::1.port
              $ObjTempVirtualServer.ip = $destination.split('.')[0]
              $ObjTempVirtualServer.port = $destination.split('.')[1]
            } else {
              # parse ipv4 addresses 10.0.0.1:port
              $ObjTempVirtualServer.ip = $destination.split(':')[0]
              $ObjTempVirtualServer.port = $destination.split(':')[1]
              if (($VirtualServer.mask -ne '255.255.255.255') -And ($VirtualServer.mask -ne 'any') ) {
                $cidr = Convert-MaskToCIDR($VirtualServer.mask)
                $ObjTempVirtualServer.ip += '/' + $cidr
              }
            }

            if (($ObjTempVirtualServer.port) -eq 0) {
                $ObjTempVirtualServer.port = "Any"
            }

            if (Get-Member -inputobject $VirtualServer -name 'pool') {
                $ObjTempVirtualServer.defaultpool = $VirtualServer.pool
            }

            #Set the ssl profile to None by default, then check if there's an SSL profile and

            $ObjTempVirtualServer.httpprofile = "None";
            $ObjTempVirtualServer.compressionprofile = "None";
            $ObjTempVirtualServer.profiletype = "Standard";

            Foreach ($Profile in $VirtualServer.profilesReference.items) {
                if ($ProfileDict[$Profile.fullPath]) {
                    switch ($ProfileDict[$Profile.fullPath].kind) {
                        "tm:ltm:profile:udp:udpstate" {
                            $ObjTempVirtualServer.profiletype = "UDP"
                        }
                        "tm:ltm:profile:http-compression:http-compressionstate" {
                            $ObjTempVirtualServer.compressionprofile = $Profile.fullPath
                        }
                        "tm:ltm:profile:client-ssl:client-sslstate" {
                            $ObjTempVirtualServer.sslprofileclient += $Profile.fullPath
                        }
                        "tm:ltm:profile:server-ssl:server-sslstate" {
                            $ObjTempVirtualServer.sslprofileserver += $Profile.fullPath
                        }
                        "tm:ltm:profile:fastl4:fastl4state" {
                            $ObjTempVirtualServer.profiletype = "Fast L4"
                        }
                        "tm:ltm:profile:fasthttp:fasthttpstate" {
                            $ObjTempVirtualServer.profiletype = "Fast HTTP"
                        }
                        "tm:ltm:profile:http:httpstate" {
                            $ObjTempVirtualServer.httpprofile = $Profile.fullPath
                        }
                        default {
                            #$ProfileDict[$Profile.fullPath].kind + "|" + $Profile.fullPath
                        }
                    }
                }
            }

            if ($null -eq $ObjTempVirtualServer.sslprofileclient) {
                $ObjTempVirtualServer.sslprofileclient += "None";
            }
            if ($null -eq $ObjTempVirtualServer.sslprofileserver) {
                $ObjTempVirtualServer.sslprofileserver += "None";
            }

            #Get the iRules of the Virtual server
            $ObjTempVirtualServer.irules = @();
            if (Get-Member -inputobject $VirtualServer -name 'rules') {
                Foreach ($rule in $VirtualServer.rules) {
                    $ObjTempVirtualServer.irules += $rule

                    $iRule = $LoadBalancerObjects.iRules[$rule]
                    if ($iRule) {
                        $iRule.virtualservers += $ObjTempVirtualServer.name
                        if ($iRule.pools.Count -gt 0) {
                            $ObjTempVirtualServer.pools += [array]$iRule.pools
                        }
                        Foreach ($DatagroupName in $iRule.datagroups ) {
                            $Datagroup = $LoadBalancerObjects.DataGroups[$DatagroupName]
                            if ($Datagroup -and $Datagroup.pools -and $Datagroup.pools.Count -gt 0) {
                                $ObjTempVirtualServer.pools += [array]$Datagroup.pools
                            }
                        }
                    } else {
                        log error "iRule $rule not found (zero length?) for ${ObjTempVirtualServer.name} on $LoadBalancerName"
                    }
                }
            }

            #Get the persistence profile of the Virtual server

            if (Get-Member -inputobject $VirtualServer -name 'persist') {
                $ObjTempVirtualServer.persistence += "/" + $VirtualServer.persist.partition + "/" + $VirtualServer.persist.name
                if (Get-Member -inputobject $VirtualServer -name 'fallbackPersistence') {
                    $ObjTempVirtualServer.persistence += $VirtualServer.fallbackPersistence
                }
            } else {
                $ObjTempVirtualServer.persistence += "None"
            }

            if ("" -ne $ObjTempVirtualServer.defaultpool) {
                $ObjTempVirtualServer.pools += $ObjTempVirtualServer.defaultpool
            }

            $ObjTempVirtualServer.pools = $ObjTempVirtualServer.pools | Sort-Object -Unique

            Try {
                $ObjTempVirtualServer.sourcexlatetype = $VirtualServer.sourceAddressTranslation.type
            } Catch {
                $ObjTempVirtualServer.sourcexlatetype = "OLDVERSION"
            }
            Try {
                $ObjTempVirtualServer.sourcexlatepool = $VirtualServer.sourceAddressTranslation.pool
            } Catch {
                $ObjTempVirtualServer.sourcexlatepool = ""
            }

            if ($Global:Bigipreportconfig.Settings.iRules.enabled -eq $false) {
                #Hiding iRules to the users
                $ObjTempVirtualServer.irules = @();
            }

            if (Get-Member -inputobject $VirtualServer -name 'vlans') {
                $ObjTempVirtualServer.vlans = $VirtualServer.vlans
            }

            if (Get-Member -inputobject $VirtualServer -name 'vlansEnabled') {
                $ObjTempVirtualServer.vlanstate = "enabled"
            } elseif (Get-Member -inputobject $VirtualServer -name 'vlansDisabled') {
                $ObjTempVirtualServer.vlanstate = "disabled"
            }

            $VirtualServerSASMPolicies = $LoadBalancerObjects.ASMPolicies.values | Where-Object { $_.virtualServers -contains $ObjTempVirtualServer.name }

            if ($null -ne $VirtualServerSASMPolicies) {
                $ObjTempVirtualServer.asmPolicies = $VirtualServerSASMPolicies.name
            }

            $ObjTempVirtualServer.trafficgroup = $TrafficGroupDict["/" + $VirtualServer.partition + "/" + $ObjTempVirtualServer.ip]

            $ObjTempVirtualServer.availability = $VirtualStatsDict[$ObjTempVirtualServer.name].'status.availabilityState'.description
            $ObjTempVirtualServer.enabled = $VirtualStatsDict[$ObjTempVirtualServer.name].'status.enabledState'.description

            #Connection statistics
            $ObjTempVirtualServer.currentconnections = $VirtualStatsDict[$ObjTempVirtualServer.name].'clientside.curConns'.value
            $ObjTempVirtualServer.maximumconnections = $VirtualStatsDict[$ObjTempVirtualServer.name].'clientside.maxConns'.value

            #CPU statistics
            $ObjTempVirtualServer.cpuavg5sec = $VirtualStatsDict[$ObjTempVirtualServer.name].'fiveSecAvgUsageRatio'.value
            $ObjTempVirtualServer.cpuavg1min = $VirtualStatsDict[$ObjTempVirtualServer.name].'oneMinAvgUsageRatio'.value
            $ObjTempVirtualServer.cpuavg5min = $VirtualStatsDict[$ObjTempVirtualServer.name].'fiveMinAvgUsageRatio'.value

            $LoadBalancerObjects.VirtualServers.add($ObjTempVirtualServer.name, $ObjTempVirtualServer)
        }
    } Catch {
        $Line = $_.InvocationInfo.ScriptLineNumber
        log error "Unable to cache virtual servers from $LoadBalancerName : $_ (line $Line)"
    }

    #EndRegion

    #Region Get Orphaned Pools
    log verbose "Detecting orphaned pools on $LoadBalancerName"

    try {
        $VirtualServerPools = $LoadBalancerObjects.VirtualServers.Values.Pools | Sort-Object -Unique
    } catch {
        $VirtualServerPools = $()
    }
    try {
        $DataGroupPools = $LoadBalancerObjects.DataGroups.Values.pools | Sort-Object -Unique
    } catch {
        $DataGroupPools = $()
    }

    Foreach ($PoolName in $LoadBalancerObjects.Pools.Keys) {
        If ($VirtualServerPools -NotContains $PoolName -and
            $DataGroupPools -NotContains $PoolName) {
            $LoadBalancerObjects.Pools[$PoolName].orphaned = $true
        }
    }
    #EndRegion
}
#EndRegion


function Get-DeviceInfo {
    Param($LoadBalancerIP)

    $DevStartTime = Get-Date

    $DeviceGroup = $Global:Bigipreportconfig.Settings.DeviceGroups.DeviceGroup | Where-Object { $_.Device -contains $PollLoadBalancer }

    $IsOnlyDevice = @($DeviceGroup.Device).Count -eq 1
    $StatusVIP = $DeviceGroup.StatusVip

    # Populate the global session object with an active session
    Get-AuthToken -LoadBalancer $PollLoadBalancer

    log info "Polling loadbalancer $PollLoadbalancer in device group $($DeviceGroup.name)"

    $ObjLoadBalancer = New-Object -TypeName "Loadbalancer"
    $ObjLoadBalancer.ip = $LoadBalancerIP
    $ObjLoadBalancer.statusvip = New-Object -TypeName "PoolStatusVip"
    $ObjLoadBalancer.isonlydevice = $IsOnlyDevice

    $BigIPHostname = ""
    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/sys/global-settings"
    $BigIPHostname = $Response.hostname

    log verbose "Hostname is $BigipHostname for $LoadBalancerIP"

    $ObjLoadBalancer.name = $BigIPHostname

    #Get information about ip, name, model and category
    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/sys/hardware"
    $Platform = $Response.entries.'https://localhost/mgmt/tm/sys/hardware/platform'.nestedStats.entries
    $systemInfo = $Response.entries.'https://localhost/mgmt/tm/sys/hardware/system-info'.nestedStats.entries

    $ObjLoadBalancer.model = $SystemInfo.psobject.properties.value.nestedStats.entries.platform.description
    $ObjLoadBalancer.category = $Platform.psobject.properties.value.nestedStats.entries.marketingName.description -replace "^BIG-IP ", ""

    If ($ObjLoadBalancer.category -eq "Virtual Edition") {
        # Virtual Editions is using the base registration keys as serial numbers
        $License = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/sys/license"
        #$RegistrationKeys = $F5.ManagementLicenseAdministration.get_registration_keys();
        $BaseRegistrationKey = $License.entries."https://localhost/mgmt/tm/sys/license/0".nestedStats.entries.registrationKey.description

        $Serial = "Z" + $BaseRegistrationKey.split("-")[-1]
    } else {
        $Serial = $SystemInfo.psobject.properties.value.nestedStats.entries.bigipChassisSerialNum.description
        $BoardSerial = $SystemInfo.psobject.properties.value.nestedStats.entries.hostBoardSerialNum.description
        if ($BoardSerial -ne " ") {
            $Serial += " " + $BoardSerial
        }
    }

    $ObjLoadBalancer.serial = $Serial

    If ($ObjLoadBalancer.category -eq "VCMP") {
        #$HostHardwareInfo = $F5.SystemSystemInfo.get_hardware_information() | Where-Object { $_.name -eq "host_platform" }

        if ($HostHardwareInfo.Count -eq 1) {
            $Platform = $HostHardwareInfo.versions | Where-Object { $_.name -eq "Host platform name" }

            if ($Platform.Count -gt 0) {
                # Some models includes the disk type for some reason: "C119-SSD". Removing it.
                $ObjLoadBalancer.model = $Platform.value -replace "-.+", ""
            }
        }
    }

    $ObjLoadBalancer.statusvip.url = $StatusVIP

    #Region Cache Load balancer information
    log verbose "Fetching information about $BigIPHostname"

    #Get the version information
    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/sys/version"

    $ObjLoadBalancer.version = $Response.entries.'https://localhost/mgmt/tm/sys/version/0'.nestedStats.entries.Version.description
    $ObjLoadBalancer.build = $Response.entries.'https://localhost/mgmt/tm/sys/version/0'.nestedStats.entries.Build.description
    #$ObjLoadBalancer.baseBuild = $VersionInformation.baseBuild
    $ObjLoadBalancer.baseBuild = "unknown"

    #Get failover status to determine if the load balancer is active
    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/cm/failover-status"

    $ObjLoadBalancer.active = $Response.entries.'https://localhost/mgmt/tm/cm/failover-status/0'.nestedStats.entries.status.description -eq "ACTIVE"
    $ObjLoadBalancer.color = $Response.entries.'https://localhost/mgmt/tm/cm/failover-status/0'.nestedStats.entries.color.description

    #Get sync status
    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/cm/sync-status"

    $ObjLoadBalancer.sync = $Response.entries.'https://localhost/mgmt/tm/cm/sync-status/0'.nestedStats.entries.color.description

    #Get provisioned modules
    $Response = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Uri "https://$LoadBalancerIP/mgmt/tm/sys/provision"

    $ModuleDict = c@ {}

    foreach ($Module in $Response.items) {
        if ($Module.level -ne "none") {
            if ($ModuleToDescription.keys -contains $Module.name) {
                $ModuleDescription = $ModuleToDescription[$Module.name]
            } else {
                $ModuleDescription = "No description found"
            }

            if (!($ModuleDict.keys -contains $Module.name)) {
                $ModuleDict.add($Module.name, $ModuleDescription)
            }
        }
    }

    $ObjLoadBalancer.modules = $ModuleDict

    $ObjLoadBalancer.success = $true

    $LoadBalancerObjects = c@ {}
    $LoadBalancerObjects.LoadBalancer = $ObjLoadBalancer

    $Global:ReportObjects.add($ObjLoadBalancer.ip, $LoadBalancerObjects)

    #Don't continue if this loadbalancer is not active
    If ($ObjLoadBalancer.active -or $ObjLoadBalancer.isonlydevice) {
        log verbose "Caching LTM information from $BigIPHostname"
        Get-LTMInformation -LoadBalancer $LoadBalancerObjects -Session $Session
        # Record some stats
        $StatsMsg = "$BigIPHostname Stats:"
        $StatsMsg += " VS:" + $LoadBalancerObjects.VirtualServers.Keys.Count
        $StatsMsg += " P:" + $LoadBalancerObjects.Pools.Keys.Count
        $StatsMsg += " R:" + $LoadBalancerObjects.iRules.Keys.Count
        $StatsMsg += " DG:" + $LoadBalancerObjects.DataGroups.Keys.Count
        $StatsMsg += " C:" + $LoadBalancerObjects.Certificates.Keys.Count
        $StatsMsg += " M:" + $LoadBalancerObjects.Monitors.Keys.Count
        $StatsMsg += " ASM:" + $LoadBalancerObjects.ASMPolicies.Keys.Count
        $StatsMsg += " T:" + $($(Get-Date) - $DevStartTime).TotalSeconds
        log success $StatsMsg
    } else {
        log info "$BigIPHostname is not active, and won't be indexed"
        return
    }
}

Function Get-AuthToken {

    Param($LoadBalancer)

    $User = $Env:F5_USERNAME
    $Password = $Env:F5_PASSWORD

    # If the environment environment variables are not set, use the configuration file instead
    if ($null -eq $User) {
        $User = $Global:Bigipreportconfig.Settings.Credentials.Username
    }
    if ($null -eq $Password) {
        $Password = $Global:Bigipreportconfig.Settings.Credentials.Password
    }

    #Create the string that is converted to Base64
    $Credentials = $User + ":" + $Password

    #Encode the string to base64
    $EncodedCreds = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($Credentials))

    #Add the "Basic prefix"
    $BasicAuthValue = "Basic $EncodedCreds"

    #Prepare the headers
    $Headers = @{
        "Authorization" = $BasicAuthValue
        "Content-Type"  = "application/json"
    }

    #Create the body of the post
    $Body = @{"username" = $User; "password" = $Password; "loginProviderName" = "tmos" }

    #Convert the body to Json
    $Body = $Body | ConvertTo-Json

    # REST login sometimes works, and sometimes does not. Try 3 times in case it's flakey
    $tries = 0
    while ($tries -lt 4) {
        try {
            $tries++
            $TokenRequest = Invoke-RestMethod -WebSession $Session -SkipCertificateCheck -Headers $Headers -Method "POST" -Body $Body -Uri "https://$LoadBalancer/mgmt/shared/authn/login"
            log success "Got auth token from $LoadBalancer"
            $AuthToken = $TokenRequest.token.token
            $TokenReference = $TokenRequest.token.name;
            $TokenStartTime = Get-Date -Date $TokenRequest.token.startTime

            # Add the token to the session
            $Session.Headers.Add('X-F5-Auth-Token', $AuthToken)
            $Body = @{ timeout = 7200 } | ConvertTo-Json

            # Extend the token to 120 minutes
            $Response = Invoke-RestMethod -WebSession $Session -Method Patch -SkipCertificateCheck -Uri https://$LoadBalancer/mgmt/shared/authz/tokens/$TokenReference -Body $Body | Out-Null
            $ts = New-TimeSpan -Minutes (120)
            $ExpirationTime = $TokenStartTime + $ts
            $Session.Headers.Add('Token-Expiration', $ExpirationTime)
            $tries = 99
        } catch {
            $Line = $_.InvocationInfo.ScriptLineNumber
            log error "Error getting auth token from $LoadBalancer : $_ (Line $Line, Tries $tries)"
        }
    }
    if ($tries -ne 99) {
        Exit
    }
}

Get-DeviceInfo -LoadBalancerIP $PollLoadBalancer

if ($null -eq $Location) {
    log verbose "Testing, so not writing results"
} else {
    # Output the polled load balancer to JSON data and send the parent process
    $Global:ReportObjects[$PollLoadBalancer] | ConvertTo-Json -Compress -Depth 10
}