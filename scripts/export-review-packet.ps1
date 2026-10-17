[CmdletBinding(PositionalBinding = $false)]
param(
  [Parameter(Mandatory = $true)]
  [string]$TaskId,

  [Parameter(Mandatory = $true)]
  [ValidateSet("PLAN", "BUILD", "REVIEW", "VERIFY", "DOC_SYNC", "OWNER_APPROVAL", "CLOSEOUT")]
  [string]$Stage,

  [Parameter(Mandatory = $false)]
  [string]$BaseRef = "HEAD",

  [Parameter(Mandatory = $false)]
  [string[]]$NewFiles = @(),

  [Parameter(Mandatory = $false)]
  [string]$EvidenceFile = "",

  [Parameter(Mandatory = $false)]
  [string]$PlanFile = "",

  [Parameter(Mandatory = $false)]
  [string[]]$AdditionalFiles = @(),

  [Parameter(Mandatory = $false)]
  [string]$ExpectedReviewGate = "STAGE_7_OWNER_APPROVAL",

  [Parameter(Mandatory = $false)]
  [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-StreamSha256Hex {
  param([Parameter(Mandatory = $true)][System.IO.Stream]$Stream)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hashBytes = $sha.ComputeHash($Stream)
    return ([System.BitConverter]::ToString($hashBytes)).Replace("-", "").ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Get-FileSha256Hex {
  param([Parameter(Mandatory = $true)][string]$FilePath)
  $fs = [System.IO.File]::OpenRead($FilePath)
  try {
    return Get-StreamSha256Hex -Stream $fs
  } finally {
    $fs.Dispose()
  }
}

function Assert-SafeCandidatePath {
  param(
    [Parameter(Mandatory = $true)][string]$RawPath,
    [Parameter(Mandatory = $false)][string]$NormalizedRelPath = ""
  )
  $combined = ($RawPath + " " + $NormalizedRelPath).Replace("\", "/").ToLowerInvariant()
  $segments = $combined -split "[/\s]+"

  $forbiddenExactSegments = @(
    ".git",
    "node_modules",
    "pgdata",
    ".pgdata",
    "backups"
  )
  foreach ($seg in $segments) {
    if ($forbiddenExactSegments -contains $seg) {
      throw "FORBIDDEN_SENSITIVE_PATH: Path '$RawPath' contains forbidden segment '$seg'."
    }
    if ($seg -match "^\.env(\..+)?$") {
      throw "FORBIDDEN_SENSITIVE_PATH: Path '$RawPath' targets an environment file '$seg'."
    }
  }

  $forbiddenSubstrings = @(
    "apps/server/data",
    "apps/server/apps/server/data",
    "artifacts/playtest/runs",
    "pg_version",
    ".sqlite",
    ".db",
    ".pem",
    ".key",
    ".pfx",
    ".p12",
    "credential",
    "secret"
  )
  foreach ($sub in $forbiddenSubstrings) {
    if ($combined.Contains($sub)) {
      throw "FORBIDDEN_SENSITIVE_PATH: Path '$RawPath' matches forbidden pattern '$sub'."
    }
  }
}

function Resolve-ExistingFileStrict {
  param(
    [Parameter(Mandatory = $true)][string]$InputPath,
    [Parameter(Mandatory = $true)][string]$BaseDir
  )
  if ([string]::IsNullOrWhiteSpace($InputPath)) {
    throw "MISSING_INPUT_FILE: Empty file path provided."
  }
  Assert-SafeCandidatePath -RawPath $InputPath
  $candidate = if ([System.IO.Path]::IsPathRooted($InputPath)) {
    [System.IO.Path]::GetFullPath($InputPath)
  } else {
    [System.IO.Path]::GetFullPath((Join-Path $BaseDir $InputPath))
  }
  Assert-SafeCandidatePath -RawPath $candidate
  if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
    throw "MISSING_INPUT_FILE: File does not exist: '$InputPath' (resolved: '$candidate')."
  }
  return $candidate
}

if ([string]::IsNullOrWhiteSpace($TaskId) -or ($TaskId -notmatch "^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$")) {
  throw "INVALID_TASK_ID: TaskId '$TaskId' must match ^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$."
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..")).TrimEnd('\', '/')
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot ".git"))) {
  throw "INVALID_REPO_ROOT: Could not locate .git at '$repoRoot'."
}

$preStatus = @(& git -C $repoRoot status --porcelain=v1 -uall)
if ($LASTEXITCODE -ne 0) {
  throw "GIT_ERROR: Failed to read git status."
}
$preStaged = @(& git -C $repoRoot diff --cached --name-only)
if ($LASTEXITCODE -ne 0) {
  throw "GIT_ERROR: Failed to read staged git diff."
}

$baseShaOut = & git -C $repoRoot rev-parse --verify "$BaseRef^{commit}" 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($baseShaOut)) {
  throw "INVALID_BASE_REF: Cannot resolve BaseRef '$BaseRef'."
}
$baseSha = $baseShaOut.Trim()

$headShaOut = & git -C $repoRoot rev-parse HEAD 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($headShaOut)) {
  throw "GIT_ERROR: Cannot resolve HEAD SHA."
}
$headSha = $headShaOut.Trim()

$sysTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\', '/')
$targetOutDir = if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  Join-Path $sysTemp "tong-mon-8d-review-packets"
} else {
  [System.IO.Path]::GetFullPath($OutputDir).TrimEnd('\', '/')
}

$sysTempPrefix = $sysTemp.ToLowerInvariant() + "\"
$targetCheck = ($targetOutDir + "\").ToLowerInvariant()
$repoPrefix = $repoRoot.ToLowerInvariant() + "\"

if (-not $targetCheck.StartsWith($sysTempPrefix)) {
  throw "FORBIDDEN_OUTPUT_DIR: OutputDir '$targetOutDir' must reside under system temporary directory '$sysTemp'."
}
if ($targetCheck.StartsWith($repoPrefix)) {
  throw "FORBIDDEN_OUTPUT_DIR: OutputDir '$targetOutDir' must be outside the Git working tree '$repoRoot'."
}

$expandedNewFiles = @()
foreach ($rawNf in $NewFiles) {
  if ([string]::IsNullOrWhiteSpace($rawNf)) {
    throw "INVALID_NEW_FILE: Blank entry in -NewFiles."
  }
  $parts = @($rawNf -split "[,;]" | ForEach-Object { $_.Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($parts.Count -eq 0) {
    throw "INVALID_NEW_FILE: Blank entry in -NewFiles."
  }
  $expandedNewFiles += $parts
}

$expandedAdditionalFiles = @()
foreach ($rawAf in $AdditionalFiles) {
  if ([string]::IsNullOrWhiteSpace($rawAf)) {
    throw "INVALID_ADDITIONAL_FILE: Blank entry in -AdditionalFiles."
  }
  $parts = @($rawAf -split "[,;]" | ForEach-Object { $_.Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($parts.Count -eq 0) {
    throw "INVALID_ADDITIONAL_FILE: Blank entry in -AdditionalFiles."
  }
  $expandedAdditionalFiles += $parts
}

if ($Stage -eq "PLAN") {
  if ([string]::IsNullOrWhiteSpace($PlanFile)) {
    throw "MISSING_PLAN_FILE: Stage 'PLAN' requires -PlanFile."
  }
  if ($expandedNewFiles.Count -gt 0) {
    throw "FORBIDDEN_NEW_FILES_IN_PLAN: Stage 'PLAN' is read-only and must not include -NewFiles."
  }
} else {
  if ([string]::IsNullOrWhiteSpace($EvidenceFile)) {
    throw "MISSING_EVIDENCE_FILE: Stage '$Stage' requires -EvidenceFile."
  }
}

$resolvedEvidence = if (-not [string]::IsNullOrWhiteSpace($EvidenceFile)) {
  Resolve-ExistingFileStrict -InputPath $EvidenceFile -BaseDir $repoRoot
} else {
  ""
}

$resolvedPlan = if (-not [string]::IsNullOrWhiteSpace($PlanFile)) {
  Resolve-ExistingFileStrict -InputPath $PlanFile -BaseDir $repoRoot
} else {
  ""
}

$resolvedNewFiles = @()
$seenNewRelPaths = New-Object "System.Collections.Generic.HashSet[string]" ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($nf in $expandedNewFiles) {
  $fullNf = Resolve-ExistingFileStrict -InputPath $nf -BaseDir $repoRoot
  if (-not ($fullNf.ToLowerInvariant().StartsWith($repoPrefix))) {
    throw "OUTSIDE_REPO_NEW_FILE: NewFile '$nf' must reside inside repository root '$repoRoot'."
  }
  $relNf = $fullNf.Substring($repoRoot.Length + 1).Replace("\", "/")
  Assert-SafeCandidatePath -RawPath $nf -NormalizedRelPath $relNf
  if (-not $seenNewRelPaths.Add($relNf)) {
    throw "DUPLICATE_NEW_FILE: Duplicate NewFile '$relNf'."
  }
  $resolvedNewFiles += [PSCustomObject]@{
    FullPath = $fullNf
    RelPath  = $relNf
  }
}

$resolvedAdditional = @()
$seenAdditionalNames = New-Object "System.Collections.Generic.HashSet[string]" ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($af in $expandedAdditionalFiles) {
  $fullAf = Resolve-ExistingFileStrict -InputPath $af -BaseDir $repoRoot
  $leafName = [System.IO.Path]::GetFileName($fullAf)
  if (-not $seenAdditionalNames.Add($leafName)) {
    throw "DUPLICATE_ADDITIONAL_FILE: Duplicate additional file name '$leafName'."
  }
  $resolvedAdditional += [PSCustomObject]@{
    FullPath    = $fullAf
    ArchivePath = "additional/$leafName"
  }
}

$trackedDiffNamesRaw = @(& git -C $repoRoot diff --name-only $baseSha)
if ($LASTEXITCODE -ne 0) {
  throw "GIT_ERROR: Failed to list tracked diff names against '$baseSha'."
}
$trackedDiffNames = @($trackedDiffNamesRaw | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { $_.Trim().Replace("\", "/") })
foreach ($tdn in $trackedDiffNames) {
  Assert-SafeCandidatePath -RawPath $tdn -NormalizedRelPath $tdn
}

if ($Stage -eq "PLAN" -and $trackedDiffNames.Count -gt 0) {
  throw "DIRTY_TREE_IN_PLAN: Stage 'PLAN' requires zero tracked modifications against '$baseSha'."
}

New-Item -ItemType Directory -Force -Path $targetOutDir | Out-Null
$stagingDir = Join-Path $targetOutDir ("stage_" + $TaskId + "_" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null

$zipFileName = "${TaskId}_REVIEW_PACKET.zip"
$zipFullPath = Join-Path $targetOutDir $zipFileName

try {
  $stagedEntries = @()

  if ($Stage -ne "PLAN") {
    $patchArchiveName = "${TaskId}_tracked_diff.patch"
    $patchDestPath = Join-Path $stagingDir $patchArchiveName
    & git -C $repoRoot diff --binary --output="$patchDestPath" $baseSha
    if ($LASTEXITCODE -ne 0 -or (-not (Test-Path -LiteralPath $patchDestPath -PathType Leaf))) {
      throw "GIT_DIFF_FAILED: Failed to export tracked diff patch."
    }
    $patchBytes = (Get-Item -LiteralPath $patchDestPath).Length
    if ($patchBytes -eq 0 -and $resolvedNewFiles.Count -eq 0) {
      throw "EMPTY_REVIEW_PACKET: Stage '$Stage' has zero tracked diff bytes and zero selected NewFiles."
    }
    $stagedEntries += [PSCustomObject]@{
      ArchivePath = $patchArchiveName
      DiskPath    = $patchDestPath
      Bytes       = $patchBytes
      Sha256      = Get-FileSha256Hex -FilePath $patchDestPath
    }
  }

  foreach ($nfObj in $resolvedNewFiles) {
    $destNfPath = Join-Path $stagingDir ($nfObj.RelPath.Replace("/", [System.IO.Path]::DirectorySeparatorChar))
    $destNfDir = [System.IO.Path]::GetDirectoryName($destNfPath)
    if (-not (Test-Path -LiteralPath $destNfDir)) {
      New-Item -ItemType Directory -Force -Path $destNfDir | Out-Null
    }
    [System.IO.File]::Copy($nfObj.FullPath, $destNfPath, $true)
    $stagedEntries += [PSCustomObject]@{
      ArchivePath = $nfObj.RelPath
      DiskPath    = $destNfPath
      Bytes       = (Get-Item -LiteralPath $destNfPath).Length
      Sha256      = Get-FileSha256Hex -FilePath $destNfPath
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($resolvedEvidence)) {
    $evArchiveName = "${TaskId}_verification_evidence.md"
    $evDestPath = Join-Path $stagingDir $evArchiveName
    [System.IO.File]::Copy($resolvedEvidence, $evDestPath, $true)
    $stagedEntries += [PSCustomObject]@{
      ArchivePath = $evArchiveName
      DiskPath    = $evDestPath
      Bytes       = (Get-Item -LiteralPath $evDestPath).Length
      Sha256      = Get-FileSha256Hex -FilePath $evDestPath
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($resolvedPlan)) {
    $planArchiveName = "${TaskId}_plan.md"
    $planDestPath = Join-Path $stagingDir $planArchiveName
    [System.IO.File]::Copy($resolvedPlan, $planDestPath, $true)
    $stagedEntries += [PSCustomObject]@{
      ArchivePath = $planArchiveName
      DiskPath    = $planDestPath
      Bytes       = (Get-Item -LiteralPath $planDestPath).Length
      Sha256      = Get-FileSha256Hex -FilePath $planDestPath
    }
  }

  foreach ($afObj in $resolvedAdditional) {
    $destAfPath = Join-Path $stagingDir ($afObj.ArchivePath.Replace("/", [System.IO.Path]::DirectorySeparatorChar))
    $destAfDir = [System.IO.Path]::GetDirectoryName($destAfPath)
    if (-not (Test-Path -LiteralPath $destAfDir)) {
      New-Item -ItemType Directory -Force -Path $destAfDir | Out-Null
    }
    [System.IO.File]::Copy($afObj.FullPath, $destAfPath, $true)
    $stagedEntries += [PSCustomObject]@{
      ArchivePath = $afObj.ArchivePath
      DiskPath    = $destAfPath
      Bytes       = (Get-Item -LiteralPath $destAfPath).Length
      Sha256      = Get-FileSha256Hex -FilePath $destAfPath
    }
  }

  $sortedEntries = @($stagedEntries | Sort-Object -Property ArchivePath)

  $manifestArchiveName = "${TaskId}_manifest.json"
  $manifestDestPath = Join-Path $stagingDir $manifestArchiveName

  $manifestFilesArray = @()
  foreach ($entry in $sortedEntries) {
    $manifestFilesArray += [ordered]@{
      archivePath = $entry.ArchivePath
      sha256      = $entry.Sha256
      bytes       = $entry.Bytes
    }
  }

  $manifestObject = [ordered]@{
    taskId               = $TaskId
    stage                = $Stage
    baseRef              = $BaseRef
    baseSha              = $baseSha
    headSha              = $headSha
    expectedReviewGate   = $ExpectedReviewGate
    generatedAtUtc       = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    trackedModifiedFiles = @($trackedDiffNames)
    selectedNewFiles     = @($resolvedNewFiles | ForEach-Object { $_.RelPath })
    files                = $manifestFilesArray
  }

  $manifestJson = ($manifestObject | ConvertTo-Json -Depth 8) + "`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllBytes($manifestDestPath, $utf8NoBom.GetBytes($manifestJson))

  $allArchiveExpectations = @($sortedEntries) + @(
    [PSCustomObject]@{
      ArchivePath = $manifestArchiveName
      DiskPath    = $manifestDestPath
      Bytes       = (Get-Item -LiteralPath $manifestDestPath).Length
      Sha256      = Get-FileSha256Hex -FilePath $manifestDestPath
    }
  )

  if (Test-Path -LiteralPath $zipFullPath) {
    Remove-Item -LiteralPath $zipFullPath -Force
  }

  $zipStream = New-Object System.IO.FileStream($zipFullPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
  try {
    $zipArchive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create, $true)
    try {
      foreach ($item in $allArchiveExpectations) {
        $zipEntry = $zipArchive.CreateEntry($item.ArchivePath, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryOutStream = $zipEntry.Open()
        try {
          $inStream = [System.IO.File]::OpenRead($item.DiskPath)
          try {
            $inStream.CopyTo($entryOutStream)
          } finally {
            $inStream.Dispose()
          }
        } finally {
          $entryOutStream.Dispose()
        }
      }
    } finally {
      $zipArchive.Dispose()
    }
  } finally {
    $zipStream.Dispose()
  }

  $verifyArchive = [System.IO.Compression.ZipFile]::OpenRead($zipFullPath)
  try {
    if ($verifyArchive.Entries.Count -ne $allArchiveExpectations.Count) {
      throw "ZIP_VALIDATION_FAILED: Expected $($allArchiveExpectations.Count) entries, found $($verifyArchive.Entries.Count)."
    }
    foreach ($expected in $allArchiveExpectations) {
      $foundEntry = $verifyArchive.GetEntry($expected.ArchivePath)
      if ($null -eq $foundEntry) {
        throw "ZIP_VALIDATION_FAILED: Missing expected entry '$($expected.ArchivePath)' in archive."
      }
      $entryReadStream = $foundEntry.Open()
      try {
        $actualSha = Get-StreamSha256Hex -Stream $entryReadStream
      } finally {
        $entryReadStream.Dispose()
      }
      if ($actualSha -ne $expected.Sha256) {
        throw "ZIP_VALIDATION_FAILED: SHA-256 mismatch for '$($expected.ArchivePath)' (expected $($expected.Sha256), got $actualSha)."
      }
    }
  } finally {
    $verifyArchive.Dispose()
  }

  $postStatus = @(& git -C $repoRoot status --porcelain=v1 -uall)
  $postStaged = @(& git -C $repoRoot diff --cached --name-only)
  if (($preStatus -join "`n") -ne ($postStatus -join "`n") -or ($preStaged -join "`n") -ne ($postStaged -join "`n")) {
    throw "GIT_STATE_MUTATED: Git working tree or index changed during packet export."
  }

  $zipSha256 = Get-FileSha256Hex -FilePath $zipFullPath
  $zipBytes = (Get-Item -LiteralPath $zipFullPath).Length

  $resultSummary = [ordered]@{
    status         = "OK"
    taskId         = $TaskId
    stage          = $Stage
    baseSha        = $baseSha
    headSha        = $headSha
    zipFileName    = $zipFileName
    zipPath        = $zipFullPath
    zipSha256      = $zipSha256
    zipBytes       = $zipBytes
    archiveEntries = @($allArchiveExpectations | ForEach-Object {
      [ordered]@{
        archivePath = $_.ArchivePath
        sha256      = $_.Sha256
        bytes       = $_.Bytes
      }
    })
  }

  Write-Output ($resultSummary | ConvertTo-Json -Depth 6)
} finally {
  if (Test-Path -LiteralPath $stagingDir) {
    Remove-Item -LiteralPath $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
