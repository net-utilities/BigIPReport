
$7zipPath = "C:\Program Files\7-Zip\7z.exe"
$ConfigurationFile = [xml](Get-Content "$PSScriptRoot\bigipreportconfig.xml")

$Version = $ConfigurationFile.Settings.version

#Make sure the Zip file does not exist
if(-not (Test-Path "$PSScriptRoot\Releases\BigipReport-$Version.zip")){

    #Get the content of the current bigipreport.ps1 file 
    $Ps1Content = Get-Content "$PSScriptRoot\bigipreport.ps1"

    $VersionFound = $false

    #Verify that version history has been populated for this release
    Foreach($Line in $Ps1Content){
        
        if($Line.contains($version)){
            $VersionFound = $true
            Break       
        }

        #Break at the start of the script code
        if(-not ($Line.startswith("#"))){
            Break
        }
    }

    #Add version to the file in order to allow users to store multiple versions without overwriting them
    Move-Item "$PSScriptRoot\bigipreport.ps1" "$PSScriptRoot\bigipreport-$version.ps1"
    
    #Zip the release and put it in .\Releases
    & $7ZipPath a -tzip $PSScriptRoot\Releases\BigipReport-$Version.zip "$PSScriptRoot\bigipreport-$Version.ps1" "$PSScriptRoot\bigipreportconfig.xml" "`"$PSScriptRoot\Move the content of this folder to the configured report root`"" "`"$PSScriptRoot\iRules`""
    
    #Restore the file name
    Move-Item "$PSScriptRoot\bigipreport-$version.ps1" "$PSScriptRoot\bigipreport.ps1"
} else {
    "A release with that name already exist. Forgot to update the XML version?"
}

#Halt before exit to show that everything has gone OK
$host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")