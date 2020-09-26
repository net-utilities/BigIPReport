#! /usr/bin/pwsh
###Requires -Version 5

# ThreadJob sample with json feedback from threads
# by Tim Riker <Tim@Rikers.org>

# requires ThreadJob which is included in 6.x, and available for 5.x
# to install, as adminstrator, run: Install-Module -Name ThreadJob
# to verify run: Get-Command Start-ThreadJob | select name

#Param(    $Params = $null,$Location = $null)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Global:Location = $false
function log {
    Param ([string]$Severity, $Message, [string]$DateTime)
    if (-not $DateTime) {
        $DateTime = $(Get-Date -UFormat "%Y-%m-%d %H:%M:%S")
    }
    $Args
    if ($Global:Location) {
        $log=@{datetime=$DateTime; severity=$Severity; message=$Message}
        $log | ConvertTo-Json -Compress
    }
    Write-Host $DateTime $Severity $Message
}

if ($Args) {
    #log verbose "foo"
    #$Global:Location = ""
    log verbose "PSCommandPath=$PSCommandPath"
    "PSScriptRoot=$PSScriptRoot"
    #"Global:Location=$Global:Location"
    return
    $Args.count
    $Args[0]
    Invoke-WebRequest -Uri https://ddddrikers.org/t.txt | ConvertTo-Json -compress
    try {
        $Data = ConvertFrom-Json $Args[0]
    } catch {
        "catch"
        return
    }
    "ok"
    return
    $Data.Location
    return
    #$Input.GetType()
    #$Input
    #$Input.Count
    #$input.Keys
    #"foo"
    #return
    #if ($null -ne $Global:Location) {
    #    Set-Location $Global:Location
    #    $PSScriptRoot=$Global:Location
    #}
    #$Input
    #$Args
    #$arr = @($Input)
    #log verbose $Input
    #$output=@{output=1;input=$arr[0]}
    #$totaltime=0;
    #Foreach($round in 0..3){
    #    $time=Get-Random -Minimum 0.1 -Maximum 5.0
    #    $totaltime+=$time
    #    log normal ("job="+$arr.num+"`r`nround=$round`r`ntime=$time")
    #    Get-Random -Minimum 0.1 -Maximum 5.0 | Start-Sleep
    #}
    #$output.output=@{result=($arr.num * 10);totaltime=$totaltime}
    #$output | ConvertTo-Json -Compress
    #return
} else {

    try {
        $oldPreference = $ErrorActionPreference
        $ErrorActionPreference = "Stop"
        $null = Get-Command Start-ThreadJob
    } catch {
        "Start-ThreadJob is required"
        "As Administrator, try: Install-Module -Name ThreadJob"
        exit
    } Finally {
        $ErrorActionPreference=$oldPreference
    }

    $logs=@()
    $results=@{}
    $Jobs=@()
    log verbose $PSCommandPath
    Get-Job | Remove-Job
    Measure-Command {
        ForEach($num in 0..1) {
            $Arguments=@{num=$num;name="Job-$num";Location=$PSScriptRoot}
            #$test="test"
            #$Jobs += Start-Job -Name $Device -FilePath $PSCommandPath -ArgumentList $ConfigurationFile,$Device,$PSScriptRoot

            $json = $Arguments|ConvertTo-Json -Compress
            log verbose $json
            #$Jobs += Start-ThreadJob -FilePath "small.ps1" -ArgumentList $json
            $Jobs += Start-Job -FilePath $PSCommandPath -ArgumentList $json

    #        $Jobs += Start-ThreadJob -ThrottleLimit 2 -Name $params.name -InputObject $params -ScriptBlock {
    #            function internallog {
    #                Param ([string]$LogType, [string]$Message)
    #                $CurrentTime = $(Get-Date -UFormat "%Y-%m-%d %H:%M:%S")
    #                $log=@{datetime=$CurrentTime; severity=$LogType; message=$Message}
    #                $log | ConvertTo-Json -Compress
    #            }
    #            $output=@{output=1;input=$arr[0]}
    #            $totaltime=0;
    #            Foreach($round in 0..3){
    #                $time=Get-Random -Minimum 0.1 -Maximum 5.0
    #                $totaltime+=$time
    #                internallog "normal" ("job="+$arr.num+"`r`nround=$round`r`ntime=$time")
    #                Get-Random -Minimum 0.1 -Maximum 5.0 | Start-Sleep
    #            }
    #            $output.output=@{result=($arr.num * 10);totaltime=$totaltime}
    #            $output | ConvertTo-Json -Compress
    #        }
        }
exit
        # loop getting information from jobs
        do {
            $remaining=0
            $completed=0
            $failed=0
            foreach($Job in $Jobs){
                #Write-Host $Job.Name
                if ($Job.State -eq "Completed") {
                    $completed++
                } elseif ($Job.State -eq "Failed") {
                    $failed++
                } else {
                    $remaining++
                }
                if ($Job.HasMoreData) {
                    $lines=Receive-Job -Job $Job
                    Foreach($line in $lines) {
                        try {
                            $obj=ConvertFrom-Json $line
                            # process contents of $obj, if log, add to global log and echo to screen, else store results.
                            if($obj.datetime) {
                                log $obj.
                            } elseif ($obj.input.name) {
                                $results.add($obj.input.name,$obj)
                            }
                        } catch {
                            log error ($Job.Name + ':unparsed:' + $line)
                        }
                    }
                }
            }
            Write-Host -NoNewLine "Remaining: $remaining, Completed: $completed, Failed: $failed`r"
            Start-Sleep .1
        } until ($remaining -eq 0)

        # wait for jobs to shut down
        #$Jobs | Wait-Job
        #$Jobs | Remove-Job
    } | Select-Object TotalSeconds
    #$logs | ConvertTo-Json
    #$results | ConvertTo-Json
}