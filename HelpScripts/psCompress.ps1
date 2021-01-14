#! /usr/bin/pwsh
#Requires -Version 6

# Compress and decompress byte array
function Get-CompressedGzipByteArray {
	[CmdletBinding()]
  Param (
   [Parameter(Mandatory,ValueFromPipeline,ValueFromPipelineByPropertyName)]
    [byte[]] $byteArray = $(Throw("-byteArray is required"))
  )
  Process {
    Write-Verbose "Get-CompressedByteArray"
    [System.IO.MemoryStream] $output = New-Object System.IO.MemoryStream
    $gzipStream = New-Object System.IO.Compression.GzipStream $output, ([IO.Compression.CompressionMode]::Compress)
    $gzipStream.Write( $byteArray, 0, $byteArray.Length )
    $gzipStream.Close()
    $output.Close()
    $tmp = $output.ToArray()
    Write-Output $tmp
  }
}

function Get-DecompressedGzipByteArray {
  [CmdletBinding()]
  Param (
	  [Parameter(Mandatory,ValueFromPipeline,ValueFromPipelineByPropertyName)]
    [byte[]] $byteArray = $(Throw("-byteArray is required"))
  )
	Process {
    Write-Verbose "Get-DecompressedByteArray"
    $input = New-Object System.IO.MemoryStream( , $byteArray )
    $output = New-Object System.IO.MemoryStream
    $gzipStream = New-Object System.IO.Compression.GzipStream $input, ([IO.Compression.CompressionMode]::Decompress)
    $gzipStream.CopyTo( $output )
    $gzipStream.Close()
    $input.Close()
    [byte[]] $byteOutArray = $output.ToArray()
    Write-Output $byteOutArray
  }
}

function Get-CompressedBrotliByteArray {
	[CmdletBinding()]
  Param (
   [Parameter(Mandatory,ValueFromPipeline,ValueFromPipelineByPropertyName)]
    [byte[]] $byteArray = $(Throw("-byteArray is required"))
  )
  Process {
    Write-Verbose "Get-CompressedByteArray"
    [System.IO.MemoryStream] $output = New-Object System.IO.MemoryStream
    $brotliStream = New-Object System.IO.Compression.BrotliStream $output, ([IO.Compression.CompressionMode]::Compress)
    $brotliStream.Write( $byteArray, 0, $byteArray.Length )
    $brotliStream.Close()
    $output.Close()
    $tmp = $output.ToArray()
    Write-Output $tmp
  }
}

function Get-DecompressedBrotliByteArray {
  [CmdletBinding()]
  Param (
	  [Parameter(Mandatory,ValueFromPipeline,ValueFromPipelineByPropertyName)]
    [byte[]] $byteArray = $(Throw("-byteArray is required"))
  )
	Process {
    Write-Verbose "Get-DecompressedByteArray"
    $input = New-Object System.IO.MemoryStream( , $byteArray )
    $output = New-Object System.IO.MemoryStream
    $brotliStream = New-Object System.IO.Compression.BrotliStream $input, ([IO.Compression.CompressionMode]::Decompress)
    $brotliStream.CopyTo( $output )
    $brotliStream.Close()
    $input.Close()
    [byte[]] $byteOutArray = $output.ToArray()
    Write-Output $byteOutArray
  }
}
[string] $text = "some text to encode some text to encode some text to encode some text to encode some text to encode some text to encode some text to encode"
Write-Host "Text: " ( $text | Out-String )

[System.Text.Encoding] $enc = [System.Text.Encoding]::UTF8
[byte[]] $encText = $enc.GetBytes( $text )

$compressedByteArray = Get-CompressedGzipByteArray -byteArray $encText

Write-Host "Encoded: " ($compressedByteArray.Length)
Write-Host "" ( $enc.GetString( $compressedByteArray ) | Format-Hex )

$decompressedByteArray = Get-DecompressedGzipByteArray -byteArray $compressedByteArray
Write-Host "Decoded: " ( $enc.GetString( $decompressedByteArray ) | Out-String )

$compressedByteArray = Get-CompressedBrotliByteArray -byteArray $encText
Write-Host "Encoded: " ($compressedByteArray.Length)
Write-Host "" ( $enc.GetString( $compressedByteArray ) | Format-Hex )

$decompressedByteArray = Get-DecompressedBrotliByteArray -byteArray $compressedByteArray
Write-Host "Decoded: " ( $enc.GetString( $decompressedByteArray ) | Out-String )