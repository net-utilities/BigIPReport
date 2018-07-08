#Based on the tables in https://support.f5.com/csp/article/K9476

$F5HardwareMatrix = [xml](Get-Content C:\Temp\hw.html)

$DeviceJSON = @{}

Foreach($DeviceRow in $F5HardwareMatrix.div.table.tbody.tr){
    $DeviceCells = $DeviceRow.td

    $Type = $DeviceCells[1]
    $SoftwareVersion = $DeviceCells[2]

    If(-not $DeviceJSON.ContainsKey($Type)){
        $TypeDict = @{}
        $TypeDict.add("softwareVersion", @())
        $TypeDict.softwareVersion += $SoftwareVersion -Split ", "
        $TypeDict.icon = "./images/deviceicons/"

        #We're only interested in version 11
        if(($TypeDict.softwareVersion[0] -Match "12")){
            $DeviceJSON.add($Type, $TypeDict)
        }
    }
}

$F5HardwareMatrix = [xml](Get-Content C:\Temp\vpr.xml)

<#
Foreach($DeviceRow in $F5HardwareMatrix.div.table.tbody.tr){
    $DeviceCells = $DeviceRow.td


    if($DeviceCells.Count -eq 5){
        $ChassisTypeArr = $DeviceCells[0].a.'#text' -Split "/"
    }

    $Type = $ChassisTypeArr[1]

    $TypeDict = @{}
    $TypeDict.add("softwareVersion", @())
    $TypeDict.icon = "./images/deviceicons/"

    If(-not $DeviceJSON.ContainsKey($Type)){
        #$DeviceJSON.add($Type, $TypeDict)
    }
}
#>

ConvertTo-Json -Depth 5 $DeviceJSON
#| Out-File "C:\BigIPReport\Move the content of this folder to the configured report root\json\knowndevices.json"
