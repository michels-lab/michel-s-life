param(
  [Parameter(Mandatory=$true)][string]$IconPath,
  [Parameter(Mandatory=$true)][string]$OutputDir
)

$ErrorActionPreference = 'Stop'
try { Add-Type -AssemblyName System.Drawing.Common } catch { Add-Type -AssemblyName System.Drawing }

$resolved = (Resolve-Path $IconPath).Path
New-Item -ItemType Directory -Force $OutputDir | Out-Null

$icon = [System.Drawing.Icon]::new($resolved)
$source = $icon.ToBitmap()

function Save-StoreAsset {
  param(
    [string]$Name,
    [int]$Width,
    [int]$Height,
    [int]$MaxArtWidth = 0,
    [int]$MaxArtHeight = 0
  )

  if ($MaxArtWidth -le 0) { $MaxArtWidth = $Width }
  if ($MaxArtHeight -le 0) { $MaxArtHeight = $Height }

  $bmp = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  try {
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $scale = [Math]::Min($MaxArtWidth / $source.Width, $MaxArtHeight / $source.Height)
    $drawW = [Math]::Max(1, [int][Math]::Round($source.Width * $scale))
    $drawH = [Math]::Max(1, [int][Math]::Round($source.Height * $scale))
    $x = [int][Math]::Floor(($Width - $drawW) / 2)
    $y = [int][Math]::Floor(($Height - $drawH) / 2)
    $g.DrawImage($source, $x, $y, $drawW, $drawH)

    $path = Join-Path $OutputDir $Name
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created $Name ($Width x $Height)"
  }
  finally {
    $g.Dispose()
    $bmp.Dispose()
  }
}

try {
  Save-StoreAsset 'StoreLogo.png' 50 50
  Save-StoreAsset 'Square44x44Logo.png' 44 44
  Save-StoreAsset 'Square150x150Logo.png' 150 150
  Save-StoreAsset 'Wide310x150Logo.png' 310 150 150 150
}
finally {
  $source.Dispose()
  $icon.Dispose()
}
