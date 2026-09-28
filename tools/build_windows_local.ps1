param(
    [string]$BundleUrl = "https://github.com/realmichelduarte/michel-s-life-releases/releases/latest/download/AppBundle.zip",
    [string]$GoogleSecretFile = "",
    [switch]$SkipDependencyInstall
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"
if (Get-Variable PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $true
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$OutputBase = Join-Path $RepoRoot "local-release"
$TempRoot = Join-Path $env:TEMP ("michels-life-build-" + [Guid]::NewGuid().ToString("N"))
$WorkRoot = Join-Path $TempRoot "src"
$ExpectedGoogleSecretSha256 = "b3bd5879455e68562da33945ce1377369a961aead618a0c97df1dfa16e11c4c3"

function Write-Step([string]$Text) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

function Refresh-ProcessPath {
    $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $user = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = (($machine, $user) -join ";")
}

function Invoke-Native([string]$File, [string[]]$Arguments) {
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $File $($Arguments -join ' ')"
    }
}

function Install-WingetPackage([string]$Name, [string]$Id) {
    if ($SkipDependencyInstall) {
        throw "$Name is required but was not found. Re-run without -SkipDependencyInstall or install it manually."
    }
    $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
    if (-not $winget) {
        throw "$Name is required and winget is not available. Install $Name manually, then run this builder again."
    }
    Write-Host "Installing $Name with winget..." -ForegroundColor Yellow
    Invoke-Native $winget.Source @(
        "install", "--id", $Id, "--exact",
        "--accept-package-agreements", "--accept-source-agreements",
        "--silent"
    )
    Refresh-ProcessPath
}

function Resolve-Python {
    $cmd = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($cmd) {
        try {
            & $cmd.Source --version *> $null
            if ($LASTEXITCODE -eq 0) { return $cmd.Source }
        } catch {}
    }

    $common = @(
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "$env:ProgramFiles\Python312\python.exe"
    )
    foreach ($p in $common) {
        if (Test-Path $p) { return $p }
    }

    Install-WingetPackage "Python 3.12" "Python.Python.3.12"
    foreach ($p in $common) {
        if (Test-Path $p) { return $p }
    }
    $cmd = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    throw "Python 3.12 installation completed but python.exe could not be located. Close this window and run the builder again."
}

function Resolve-Node {
    $cmd = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    Install-WingetPackage "Node.js LTS" "OpenJS.NodeJS.LTS"
    $cmd = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $common = @("$env:ProgramFiles\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe")
    foreach ($p in $common) { if (Test-Path $p) { return $p } }
    throw "Node.js installation completed but node.exe could not be located. Close this window and run the builder again."
}

function Resolve-Dotnet {
    $cmd = Get-Command dotnet.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    Install-WingetPackage ".NET 8 SDK" "Microsoft.DotNet.SDK.8"
    $cmd = Get-Command dotnet.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $p = "$env:ProgramFiles\dotnet\dotnet.exe"
    if (Test-Path $p) { return $p }
    throw ".NET 8 SDK installation completed but dotnet.exe could not be located. Close this window and run the builder again."
}

function Resolve-Magick {
    $cmd = Get-Command magick.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $found = Get-ChildItem "$env:ProgramFiles\ImageMagick*" -Filter magick.exe -Recurse -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($found) { return $found.FullName }

    Install-WingetPackage "ImageMagick" "ImageMagick.ImageMagick"
    $cmd = Get-Command magick.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $found = Get-ChildItem "$env:ProgramFiles\ImageMagick*" -Filter magick.exe -Recurse -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($found) { return $found.FullName }
    throw "ImageMagick installation completed but magick.exe could not be located. Close this window and run the builder again."
}

function Resolve-InnoSetup {
    $cmd = Get-Command ISCC.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $candidates = @(
        "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
        "$env:ProgramFiles\Inno Setup 6\ISCC.exe",
        "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
    )
    foreach ($p in $candidates) { if (Test-Path $p) { return $p } }

    Install-WingetPackage "Inno Setup 6" "JRSoftware.InnoSetup"
    foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
    $cmd = Get-Command ISCC.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    throw "Inno Setup installation completed but ISCC.exe could not be located. Close this window and run the builder again."
}

function Get-GoogleOAuthSecret {
    if (-not [string]::IsNullOrWhiteSpace($env:GOOGLE_CLIENT_SECRET)) {
        return $env:GOOGLE_CLIENT_SECRET.Trim()
    }

    $candidate = $GoogleSecretFile
    if ([string]::IsNullOrWhiteSpace($candidate)) {
        $jsonDefault = Join-Path $RepoRoot "local-secrets\google_oauth.json"
        $txtDefault = Join-Path $RepoRoot "local-secrets\google_client_secret.txt"
        if (Test-Path $jsonDefault) { $candidate = $jsonDefault }
        elseif (Test-Path $txtDefault) { $candidate = $txtDefault }
    }

    if (-not [string]::IsNullOrWhiteSpace($candidate)) {
        if (-not (Test-Path $candidate)) {
            throw "Google OAuth credential file not found: $candidate"
        }
        return (Get-Content $candidate -Raw).Trim()
    }

    Write-Host ""
    Write-Host "Google OAuth is required for the official Michel's Life desktop build." -ForegroundColor Yellow
    Write-Host "You can avoid pasting it every time by saving the downloaded Desktop OAuth JSON as:" -ForegroundColor Yellow
    Write-Host "  local-secrets\google_oauth.json" -ForegroundColor White
    Write-Host ""
    $path = Read-Host "Full path to the Desktop OAuth JSON (press ENTER to paste only client_secret)"
    if (-not [string]::IsNullOrWhiteSpace($path)) {
        $cleanPath = $path.Trim('"')
        if (-not (Test-Path $cleanPath)) { throw "File not found: $cleanPath" }
        return (Get-Content $cleanPath -Raw).Trim()
    }

    $secure = Read-Host "Paste Google client_secret (input is hidden)" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)).Trim()
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

function Normalize-GoogleOAuthSecret([string]$Raw) {
    $secret = $Raw.Trim()
    if ($secret.StartsWith("{")) {
        try {
            $config = $secret | ConvertFrom-Json
            $secret = [string]$config.installed.client_secret
        } catch {
            throw "Google OAuth input must be the raw Desktop client_secret or the downloaded Desktop OAuth JSON."
        }
    }
    if ([string]::IsNullOrWhiteSpace($secret)) {
        throw "Google OAuth client_secret resolved to an empty value."
    }

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [Text.Encoding]::UTF8.GetBytes($secret)
        $hashBytes = $sha.ComputeHash($bytes)
        $hash = -join ($hashBytes | ForEach-Object { $_.ToString("x2") })
    } finally {
        $sha.Dispose()
    }
    if ($hash -ne $ExpectedGoogleSecretSha256) {
        throw "The Google OAuth credential does not match the approved Michel's Life Desktop OAuth client."
    }
    return $secret
}

function Get-SourceRevision {
    $git = Get-Command git.exe -ErrorAction SilentlyContinue
    if (-not $git) { return "source-copy" }
    try {
        $rev = (& $git.Source -C $RepoRoot rev-parse --short HEAD 2>$null)
        if ($LASTEXITCODE -eq 0 -and $rev) { return ([string]$rev).Trim() }
    } catch {}
    return "source-copy"
}

$Python = $null
$Node = $null
$Dotnet = $null
$Magick = $null
$ISCC = $null
$finalOutput = $null
$version = $null

try {
    Write-Step "1/9  Checking free local build tools"
    $Python = Resolve-Python
    $Node = Resolve-Node
    $Dotnet = Resolve-Dotnet
    $Magick = Resolve-Magick
    $ISCC = Resolve-InnoSetup

    Write-Host "Python: $Python"
    Write-Host "Node:   $Node"
    Write-Host ".NET:   $Dotnet"
    Write-Host "Magick: $Magick"
    Write-Host "Inno:   $ISCC"

    Write-Step "2/9  Creating isolated temporary build workspace"
    New-Item -ItemType Directory -Force $WorkRoot | Out-Null
    $excludeDirs = @(".git", "artifacts", "local-release", ".vs", "node_modules", "local-secrets", "bin", "obj")
    $roboArgs = @($RepoRoot, $WorkRoot, "/MIR", "/NFL", "/NDL", "/NJH", "/NJS", "/NP")
    foreach ($d in $excludeDirs) { $roboArgs += @("/XD", (Join-Path $RepoRoot $d)) }
    $roboArgs += @("/XF", "*.pfx", "*.p12", ".env", "AppBundle.zip")
    & robocopy.exe @roboArgs | Out-Null
    if ($LASTEXITCODE -gt 7) { throw "Failed to create temporary build workspace. Robocopy exit code: $LASTEXITCODE" }

    Push-Location $WorkRoot
    try {
        Write-Step "3/9  Running source validation + bilingual audit"
        Invoke-Native $Python @("tools/materialize_host_source.py")
        Invoke-Native $Python @("tools/release_smoke_test.py")
        Invoke-Native $Python @("tools/validate_generated_index.py", "--index", "src/MichelsLife/frontend/index.html")
        Invoke-Native $Node @("--check", "src/MichelsLife/frontend/i18n.js")
        Invoke-Native $Node @("tools/spanish_copy_source_audit.mjs")
        Invoke-Native $Node @("tools/ui_i18n_generated_corpus_smoke.mjs")
        Invoke-Native $Python @("tools/store_smoke_test.py")

        [xml]$proj = Get-Content "src/MichelsLife/MichelsLife.csproj"
        $propertyGroup = $proj.Project.PropertyGroup | Where-Object { $_.Version } | Select-Object -First 1
        $version = [string]$propertyGroup.Version
        if ([string]::IsNullOrWhiteSpace($version)) { throw "Could not resolve Michel's Life version from the project file." }
        Write-Host "Building Michel's Life v$version" -ForegroundColor Green

        Write-Step "4/9  Downloading current visual AppBundle"
        $bundle = Join-Path $WorkRoot "src\MichelsLife\AppBundle.zip"
        Invoke-WebRequest -UseBasicParsing -Uri $BundleUrl -OutFile $bundle
        if (-not (Test-Path $bundle)) { throw "AppBundle.zip download failed." }

        Write-Step "5/9  Generating Michel's Life Windows icon"
        $assetsDir = Join-Path $WorkRoot "src\MichelsLife\Assets"
        New-Item -ItemType Directory -Force $assetsDir | Out-Null
        $iconPath = Join-Path $assetsDir "michels_life_icon.ico"
        Invoke-Native $Magick @(
            "-background", "none",
            "branding/michels_life_logo.webp",
            "-define", "icon:auto-resize=256,128,64,48,32,16",
            $iconPath
        )

        Write-Step "6/9  Packaging canonical bilingual frontend"
        Invoke-Native $Python @("tools/enable_i18n.py", "--index", "src/MichelsLife/frontend/index.html")
        Invoke-Native $Python @("tools/validate_generated_index.py", "--index", "src/MichelsLife/frontend/index.html")
        Invoke-Native $Python @("tools/replace_bundle_index.py", "--bundle", $bundle, "--index", "src/MichelsLife/frontend/index.html")
        Invoke-Native $Python @("tools/inject_bundle_asset.py", "--bundle", $bundle, "--source", "src/MichelsLife/frontend/i18n.js", "--arcname", "i18n.js")
        Invoke-Native $Python @("tools/inject_bundle_asset.py", "--bundle", $bundle, "--source", "branding/michel_duarte_avatar.jpg", "--arcname", "assets/michel_duarte_avatar.jpg")
        Invoke-Native $Python @("tools/inject_bundle_asset.py", "--bundle", $bundle, "--source", "branding/michels_life_logo.webp", "--arcname", "assets/michels_life_logo.webp")

        Write-Step "7/9  Injecting Google OAuth credential only inside temporary workspace"
        $googleRaw = Get-GoogleOAuthSecret
        $googleSecret = Normalize-GoogleOAuthSecret $googleRaw
        $secretPath = Join-Path $WorkRoot "src\MichelsLife\BuildSecrets.cs"
        $secretSource = Get-Content $secretPath -Raw
        if (-not $secretSource.Contains("__BUILD_SECRET_GOOGLE__")) {
            throw "BuildSecrets.cs does not contain the expected local build placeholder."
        }
        $escaped = $googleSecret.Replace("\", "\\").Replace('"', '\"')
        $secretSource = $secretSource.Replace("__BUILD_SECRET_GOOGLE__", $escaped)
        [IO.File]::WriteAllText($secretPath, $secretSource, [Text.UTF8Encoding]::new($false))
        $googleSecret = $null
        $googleRaw = $null

        Write-Step "8/9  Compiling portable EXE and installer"
        $publishDir = Join-Path $WorkRoot "artifacts\publish"
        New-Item -ItemType Directory -Force $publishDir | Out-Null
        Invoke-Native $Dotnet @("restore", "src/MichelsLife/MichelsLife.csproj")
        Invoke-Native $Dotnet @(
            "publish", "src/MichelsLife/MichelsLife.csproj",
            "-c", "Release",
            "-r", "win-x64",
            "--self-contained", "true",
            "-p:PublishSingleFile=true",
            "-p:IncludeNativeLibrariesForSelfExtract=true",
            "-o", $publishDir
        )

        $publishedExe = Join-Path $publishDir "MichelsLife.exe"
        if (-not (Test-Path $publishedExe)) { throw "Published MichelsLife.exe was not created." }

        Add-Type -AssemblyName System.Drawing
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($publishedExe)
        if (-not $icon -or $icon.Width -lt 16 -or $icon.Height -lt 16) {
            throw "The compiled EXE does not expose a valid Windows application icon."
        }
        Write-Host "Windows icon verified: $($icon.Width)x$($icon.Height)" -ForegroundColor Green

        $artifactsDir = Join-Path $WorkRoot "artifacts"
        $portableName = "MichelsLife-v$version.exe"
        $portablePath = Join-Path $artifactsDir $portableName
        Copy-Item $publishedExe $portablePath -Force

        $hash = (Get-FileHash $portablePath -Algorithm SHA256).Hash.ToLowerInvariant()
        "$hash  $portableName" | Set-Content ($portablePath + ".sha256") -Encoding ASCII

        Invoke-Native $ISCC @(
            "/DMyAppVersion=$version",
            "/DPublishDir=$publishDir",
            "installer/MichelsLife.iss"
        )

        $installerPath = Join-Path $artifactsDir "MichelsLife-Setup-v$version.exe"
        if (-not (Test-Path $installerPath)) { throw "Inno Setup did not create the installer." }

        Write-Step "9/9  Copying finished release to local-release"
        $finalOutput = Join-Path $OutputBase ("v" + $version)
        if (Test-Path $finalOutput) { Remove-Item $finalOutput -Recurse -Force }
        New-Item -ItemType Directory -Force $finalOutput | Out-Null

        Copy-Item $portablePath $finalOutput -Force
        Copy-Item ($portablePath + ".sha256") $finalOutput -Force
        Copy-Item $installerPath $finalOutput -Force
        Copy-Item $bundle (Join-Path $finalOutput "AppBundle.zip") -Force
        Copy-Item $iconPath (Join-Path $finalOutput "michels_life_icon.ico") -Force

        $revision = Get-SourceRevision
        @"
Michel's Life local Windows build
Version: $version
Source: $revision
Built: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss K")
GitHub Actions used: NO
GitHub billing required: NO
Bilingual generated corpus audit: PASSED
"@ | Set-Content (Join-Path $finalOutput "BUILD_INFO.txt") -Encoding UTF8
    }
    finally {
        Pop-Location
    }

    Write-Host ""
    Write-Host "SUCCESS: Michel's Life was built locally without GitHub Actions." -ForegroundColor Green
    Write-Host "Installer:" -ForegroundColor Green
    Write-Host "  $(Join-Path $finalOutput ('MichelsLife-Setup-v' + $version + '.exe'))" -ForegroundColor White
    Write-Host ""
    Start-Process explorer.exe $finalOutput
}
catch {
    Write-Host ""
    Write-Host "LOCAL BUILD FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Nothing was published to GitHub. Your source repo was not modified by the temporary build." -ForegroundColor Yellow
    exit 1
}
finally {
    if (Test-Path $TempRoot) {
        try { Remove-Item $TempRoot -Recurse -Force -ErrorAction SilentlyContinue } catch {}
    }
}
