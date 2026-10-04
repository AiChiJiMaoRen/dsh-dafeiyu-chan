param(
  [Parameter(Mandatory = $true)]
  [string]$InputDir,
  [string]$AssetDir = (Join-Path $env:USERPROFILE '.dsh\dsh-dafeiyu\deskpet-assets'),
  [ValidateSet('current','legacy')]
  [string]$Variant = 'current'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$chroma = Join-Path $repoRoot 'scripts\deskpet_chroma.py'
$sheets = Join-Path $repoRoot 'scripts\build_sheets.py'

if (-not (Test-Path -LiteralPath $InputDir -PathType Container)) {
  throw "Input directory does not exist: $InputDir"
}
 $VariantDir = Join-Path $AssetDir $Variant
New-Item -ItemType Directory -Path $VariantDir -Force | Out-Null

python $chroma $InputDir $VariantDir 256 120
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

python $sheets $VariantDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "DeskPet actions imported. Restart or hard-refresh dsh to load the new asset_version."
