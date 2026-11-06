param([switch]$ValidateOnly)

$ErrorActionPreference = 'Stop'
$seedDirectory = Join-Path $PSScriptRoot '../data/seed'
$manifestPath = Join-Path $seedDirectory 'manifest.json'
if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw 'Missing data/seed/manifest.json. Obtain a seed export as described in README.md.'
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$snapshotKey = if ($manifest.dashboardSnapshotKey) { $manifest.dashboardSnapshotKey } else { 'dashboard-snapshot.json' }
$files = @($snapshotKey) + @($manifest.infringementChunks)
if ($manifest.watermarksKey) { $files += $manifest.watermarksKey }
$files += 'manifest.json'

# Check the complete export before changing local storage; publish the manifest last.
foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath (Join-Path $seedDirectory $file) -PathType Leaf)) {
        throw "Missing seed file: $file. Restore the complete export before running seed:local."
    }
}
if ($ValidateOnly) {
    Write-Output "Validated $($files.Count) local seed files."
    exit 0
}
Push-Location (Join-Path $PSScriptRoot '..')
try {
    foreach ($file in $files) {
        & bunx wrangler r2 object put "hcc-parking-infringement-seed/parking-store/v1/$file" --file (Join-Path $seedDirectory $file) --local
        if ($LASTEXITCODE -ne 0) { throw "Local seed upload failed: $file" }
    }
} finally {
    Pop-Location
}
