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
  [string[]]$TaskAllowlist = @(),

  [Parameter(Mandatory = $false)]
  [string]$EvidenceFile = "",

  [Parameter(Mandatory = $false)]
  [string]$PlanFile = "",

  [Parameter(Mandatory = $false)]
  [string[]]$AdditionalFiles = @(),

  [Parameter(Mandatory = $false)]
  [string]$ExpectedReviewGate = "STAGE_7_OWNER_APPROVAL",

  [Parameter(Mandatory = $false)]
  [string]$OutputDir = "",

  [Parameter(Mandatory = $false)]
  [string]$RepoRoot = "",

  [Parameter(Mandatory = $false)]
  [string]$CloseoutCommit = "HEAD",

  [Parameter(Mandatory = $false)]
  [string]$RemoteName = "origin",

  [Parameter(Mandatory = $false)]
  [string]$RemoteBranch = "master",

  [Parameter(Mandatory = $false)]
  [string]$ExpectedRemoteSha = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Expand-DelimitedList {
  param(
    [Parameter(Mandatory = $false)][AllowEmptyCollection()][string[]]$RawItems = @(),
    [Parameter(Mandatory = $true)][string]$ErrorCodePrefix
  )
  $result = @()
  foreach ($raw in $RawItems) {
    if ([string]::IsNullOrWhiteSpace($raw)) {
      throw "${ErrorCodePrefix}: Blank entry provided."
    }
    $parts = @($raw -split "[,;]" | ForEach-Object { $_.Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if ($parts.Count -eq 0) {
      throw "${ErrorCodePrefix}: Blank entry provided."
    }
    $result += $parts
  }
  return ,$result
}

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

function Assert-NoReparsePointChain {
  param(
    [Parameter(Mandatory = $true)][string]$TargetPath,
    [Parameter(Mandatory = $false)][string]$StopAtRoot = ""
  )
  $fullTarget = [System.IO.Path]::GetFullPath($TargetPath)
  $stopClean = if ([string]::IsNullOrWhiteSpace($StopAtRoot)) {
    ""
  } else {
    [System.IO.Path]::GetFullPath($StopAtRoot).TrimEnd('\', '/')
  }

  $chain = New-Object "System.Collections.Generic.List[string]"
  $curr = $fullTarget
  while (-not [string]::IsNullOrWhiteSpace($curr)) {
    $chain.Add($curr)
    if ((-not [string]::IsNullOrWhiteSpace($stopClean)) -and [string]::Equals($curr.TrimEnd('\', '/'), $stopClean, [System.StringComparison]::OrdinalIgnoreCase)) {
      break
    }
    $parent = [System.IO.Path]::GetDirectoryName($curr)
    if ([string]::IsNullOrWhiteSpace($parent) -or [string]::Equals($parent, $curr, [System.StringComparison]::OrdinalIgnoreCase)) {
      break
    }
    $curr = $parent
  }

  for ($i = $chain.Count - 1; $i -ge 0; $i--) {
    $segmentPath = $chain[$i]
    if (Test-Path -LiteralPath $segmentPath) {
      $item = Get-Item -LiteralPath $segmentPath -Force
      $isReparse = (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
      $hasLinkType = ($null -ne $item.PSObject.Properties["LinkType"]) -and (-not [string]::IsNullOrWhiteSpace([string]$item.LinkType))
      if ($isReparse -or $hasLinkType) {
        throw "FORBIDDEN_REPARSE_POINT: Path '$TargetPath' traverses a symlink, junction, or reparse point at '$segmentPath'."
      }
    }
  }
}

function Test-IsUnderCanonicalRoot {
  param(
    [Parameter(Mandatory = $true)][string]$CandidateFullPath,
    [Parameter(Mandatory = $true)][string]$ApprovedRootFullPath
  )
  $cleanRoot = [System.IO.Path]::GetFullPath($ApprovedRootFullPath).TrimEnd('\', '/')
  $cleanCand = [System.IO.Path]::GetFullPath($CandidateFullPath).TrimEnd('\', '/')
  if ([string]::Equals($cleanCand, $cleanRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $true
  }
  $rootWithSep = $cleanRoot + [System.IO.Path]::DirectorySeparatorChar
  return $cleanCand.StartsWith($rootWithSep, [System.StringComparison]::OrdinalIgnoreCase)
}

function Assert-SafeCandidatePath {
  param(
    [Parameter(Mandatory = $true)][string]$RawPath,
    [Parameter(Mandatory = $false)][string]$NormalizedRelPath = ""
  )
  $rawNormalized = $RawPath.Replace("\", "/")
  if ($rawNormalized -match "(^|/)\.\.(/|$)") {
    throw "FORBIDDEN_PATH_TRAVERSAL: Path '$RawPath' contains parent traversal segment '..'."
  }

  $combined = ($RawPath + " " + $NormalizedRelPath).Replace("\", "/").ToLowerInvariant()
  $segments = $combined -split "[/\s]+"

  $forbiddenExactSegments = @(
    ".git",
    "node_modules",
    "pgdata",
    ".pgdata",
    "backups",
    ".ssh",
    ".aws",
    ".gnupg",
    ".kube",
    ".docker"
  )
  foreach ($seg in $segments) {
    if ($forbiddenExactSegments -contains $seg) {
      throw "FORBIDDEN_SENSITIVE_PATH: Path '$RawPath' contains forbidden segment '$seg'."
    }
    if ($seg -match "^\.env(\..+)?$") {
      throw "FORBIDDEN_SENSITIVE_PATH: Path '$RawPath' targets an environment file '$seg'."
    }
    if ($seg -in @(".npmrc", ".netrc", ".pgpass", "id_rsa", "id_ed25519")) {
      throw "FORBIDDEN_SENSITIVE_PATH: Path '$RawPath' targets credential file '$seg'."
    }
  }

  $forbiddenSubstrings = @(
    "apps/server/data",
    "apps/server/apps/server/data",
    "artifacts/playtest/runs",
    "pg_version",
    ".sqlite",
    ".sqlite3",
    ".db",
    ".pem",
    ".key",
    ".pfx",
    ".p12",
    ".kdbx",
    ".jks",
    ".keystore",
    "credential",
    "secret",
    "password"
  )
  foreach ($sub in $forbiddenSubstrings) {
    if ($combined.Contains($sub)) {
      throw "FORBIDDEN_SENSITIVE_PATH: Path '$RawPath' matches forbidden pattern '$sub'."
    }
  }
}

function Assert-SafeArchiveEntryPath {
  param([Parameter(Mandatory = $true)][string]$ArchivePath)
  if ([string]::IsNullOrWhiteSpace($ArchivePath)) {
    throw "INVALID_ARCHIVE_PATH: Archive entry path cannot be empty."
  }
  if ($ArchivePath.Contains("\") -or $ArchivePath.Contains(":") -or $ArchivePath.StartsWith("/") -or $ArchivePath.EndsWith("/") -or $ArchivePath.Contains("//")) {
    throw "INVALID_ARCHIVE_PATH: Archive entry path '$ArchivePath' contains invalid separators or root prefixes."
  }
  $parts = $ArchivePath -split "/"
  foreach ($part in $parts) {
    if ([string]::IsNullOrWhiteSpace($part) -or $part -eq "." -or $part -eq "..") {
      throw "INVALID_ARCHIVE_PATH: Archive entry path '$ArchivePath' contains forbidden traversal segment '$part'."
    }
  }
}

function Resolve-ApprovedExistingFile {
  param(
    [Parameter(Mandatory = $true)][string]$InputPath,
    [Parameter(Mandatory = $true)][string]$DefaultBaseDir,
    [Parameter(Mandatory = $true)][string[]]$ApprovedRoots
  )
  if ([string]::IsNullOrWhiteSpace($InputPath)) {
    throw "MISSING_INPUT_FILE: Empty file path provided."
  }
  Assert-SafeCandidatePath -RawPath $InputPath
  $candidate = if ([System.IO.Path]::IsPathRooted($InputPath)) {
    [System.IO.Path]::GetFullPath($InputPath)
  } else {
    [System.IO.Path]::GetFullPath((Join-Path $DefaultBaseDir $InputPath))
  }

  $matchedRoot = ""
  foreach ($root in $ApprovedRoots) {
    if (-not [string]::IsNullOrWhiteSpace($root)) {
      $cleanRoot = [System.IO.Path]::GetFullPath($root).TrimEnd('\', '/')
      $cleanCand = $candidate.TrimEnd('\', '/')
      $rootWithSep = $cleanRoot + [System.IO.Path]::DirectorySeparatorChar
      if ($cleanCand.StartsWith($rootWithSep, [System.StringComparison]::OrdinalIgnoreCase)) {
        $matchedRoot = $cleanRoot
        break
      }
    }
  }
  if ([string]::IsNullOrWhiteSpace($matchedRoot)) {
    throw "FORBIDDEN_EXTERNAL_PATH: Path '$InputPath' (resolved: '$candidate') is outside approved roots."
  }

  Assert-NoReparsePointChain -TargetPath $candidate
  $relToRoot = $candidate.Substring($matchedRoot.Length + 1).Replace("\", "/")
  Assert-SafeCandidatePath -RawPath $InputPath -NormalizedRelPath $relToRoot

  if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
    throw "MISSING_INPUT_FILE: File does not exist: '$InputPath' (resolved: '$candidate')."
  }
  return [PSCustomObject]@{
    FullPath    = $candidate
    MatchedRoot = $matchedRoot
    RelPath     = $relToRoot
  }
}

function Resolve-NormalizedRepoRelativePath {
  param(
    [Parameter(Mandatory = $true)][string]$RawPath,
    [Parameter(Mandatory = $true)][string]$RepoRootPath
  )
  Assert-SafeCandidatePath -RawPath $RawPath
  $candidate = if ([System.IO.Path]::IsPathRooted($RawPath)) {
    [System.IO.Path]::GetFullPath($RawPath)
  } else {
    [System.IO.Path]::GetFullPath((Join-Path $RepoRootPath $RawPath))
  }
  $cleanRepo = [System.IO.Path]::GetFullPath($RepoRootPath).TrimEnd('\', '/')
  $repoWithSep = $cleanRepo + [System.IO.Path]::DirectorySeparatorChar
  if (-not $candidate.StartsWith($repoWithSep, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "FORBIDDEN_EXTERNAL_PATH: Path '$RawPath' resolves outside repository root '$cleanRepo'."
  }
  Assert-NoReparsePointChain -TargetPath $candidate
  $rel = $candidate.Substring($cleanRepo.Length + 1).Replace("\", "/")
  Assert-SafeCandidatePath -RawPath $RawPath -NormalizedRelPath $rel
  return $rel
}

function ConvertFrom-GitPorcelainPath {
  param([Parameter(Mandatory = $true)][string]$RawPorcelainPath)
  $trimmed = $RawPorcelainPath.Trim()
  if ($trimmed.StartsWith('"') -and $trimmed.EndsWith('"') -and $trimmed.Length -ge 2) {
    $trimmed = $trimmed.Substring(1, $trimmed.Length - 2)
  }
  if ($trimmed.Contains(" -> ")) {
    $parts = $trimmed -split " -> "
    $trimmed = $parts[$parts.Count - 1].Trim()
  }
  return $trimmed.Replace("\", "/")
}

if ([string]::IsNullOrWhiteSpace($TaskId) -or ($TaskId -notmatch "^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$")) {
  throw "INVALID_TASK_ID: TaskId '$TaskId' must match ^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$."
}

$resolvedRepoRoot = if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..")).TrimEnd('\', '/')
} else {
  [System.IO.Path]::GetFullPath($RepoRoot).TrimEnd('\', '/')
}
Assert-NoReparsePointChain -TargetPath $resolvedRepoRoot
if (-not (Test-Path -LiteralPath (Join-Path $resolvedRepoRoot ".git"))) {
  throw "INVALID_REPO_ROOT: Could not locate .git at '$resolvedRepoRoot'."
}

$sysTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\', '/')
Assert-NoReparsePointChain -TargetPath $sysTemp

$defaultPacketRoot = Join-Path $sysTemp "tong-mon-8d-review-packets"
$trustedTempEvidenceRoot = Join-Path $defaultPacketRoot "trusted"
$userProfileDir = [Environment]::GetFolderPath("UserProfile")
$antigravityBrainRoot = if (-not [string]::IsNullOrWhiteSpace($userProfileDir)) {
  [System.IO.Path]::GetFullPath((Join-Path $userProfileDir ".gemini\antigravity\brain")).TrimEnd('\', '/')
} else {
  ""
}

$targetOutDir = if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $defaultPacketRoot
} else {
  [System.IO.Path]::GetFullPath($OutputDir).TrimEnd('\', '/')
}

if (-not (Test-IsUnderCanonicalRoot -CandidateFullPath $targetOutDir -ApprovedRootFullPath $sysTemp)) {
  throw "FORBIDDEN_OUTPUT_DIR: OutputDir '$targetOutDir' must reside under system temporary directory '$sysTemp'."
}
if (Test-IsUnderCanonicalRoot -CandidateFullPath $targetOutDir -ApprovedRootFullPath $resolvedRepoRoot) {
  throw "FORBIDDEN_OUTPUT_DIR: OutputDir '$targetOutDir' must be outside the Git working tree '$resolvedRepoRoot'."
}
Assert-NoReparsePointChain -TargetPath $targetOutDir

$expandedNewFiles = Expand-DelimitedList -RawItems $NewFiles -ErrorCodePrefix "INVALID_NEW_FILE"
$expandedTaskAllowlist = Expand-DelimitedList -RawItems $TaskAllowlist -ErrorCodePrefix "INVALID_TASK_ALLOWLIST"
$expandedAdditionalFiles = Expand-DelimitedList -RawItems $AdditionalFiles -ErrorCodePrefix "INVALID_ADDITIONAL_FILE"

$preStatus = @(& git -C $resolvedRepoRoot status --porcelain=v1 -uall)
if ($LASTEXITCODE -ne 0) {
  throw "GIT_ERROR: Failed to read git status."
}
$preStaged = @(& git -C $resolvedRepoRoot diff --cached --name-only)
if ($LASTEXITCODE -ne 0) {
  throw "GIT_ERROR: Failed to read staged git diff."
}

$gitUntrackedRelPaths = @()
foreach ($line in $preStatus) {
  if (-not [string]::IsNullOrWhiteSpace($line) -and $line.Length -ge 4) {
    $statusPrefix = $line.Substring(0, 2)
    $rawRel = ConvertFrom-GitPorcelainPath -RawPorcelainPath $line.Substring(3)
    if ($statusPrefix -eq "??") {
      $gitUntrackedRelPaths += $rawRel
    }
  }
}

$headShaOut = & git -C $resolvedRepoRoot rev-parse --verify "HEAD^{commit}" 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($headShaOut)) {
  throw "GIT_ERROR: Cannot resolve HEAD SHA."
}
$headSha = $headShaOut.Trim().ToLowerInvariant()

$baseSha = ""
$parentSha = $null
$verifiedRemoteSha = $null
$remoteRefLabel = $null
$localCommitSha = $headSha

if ($Stage -eq "CLOSEOUT") {
  if ([string]::IsNullOrWhiteSpace($EvidenceFile)) {
    throw "MISSING_EVIDENCE_FILE: Stage 'CLOSEOUT' requires -EvidenceFile."
  }
  if ($preStatus.Count -gt 0 -or $preStaged.Count -gt 0) {
    throw "DIRTY_TREE_IN_CLOSEOUT: Stage 'CLOSEOUT' requires a clean working tree and index."
  }
  if ($expandedNewFiles.Count -gt 0) {
    throw "FORBIDDEN_NEW_FILES_IN_CLOSEOUT: Stage 'CLOSEOUT' operates on committed history and must not include untracked -NewFiles."
  }

  $closeoutShaOut = & git -C $resolvedRepoRoot rev-parse --verify "$CloseoutCommit^{commit}" 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($closeoutShaOut)) {
    throw "INVALID_CLOSEOUT_COMMIT: Cannot resolve CloseoutCommit '$CloseoutCommit'."
  }
  $closeoutSha = $closeoutShaOut.Trim().ToLowerInvariant()
  if ($closeoutSha -ne $headSha) {
    throw "CLOSEOUT_HEAD_MISMATCH: CloseoutCommit '$closeoutSha' must match current HEAD '$headSha'."
  }
  $localCommitSha = $closeoutSha

  $parentShaOut = & git -C $resolvedRepoRoot rev-parse --verify "$closeoutSha^1^{commit}" 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($parentShaOut)) {
    throw "INVALID_CLOSEOUT_PARENT: Commit '$closeoutSha' does not have a verifiable first parent."
  }
  $parentSha = $parentShaOut.Trim().ToLowerInvariant()

  if ($PSBoundParameters.ContainsKey("BaseRef")) {
    $explicitBaseOut = & git -C $resolvedRepoRoot rev-parse --verify "$BaseRef^{commit}" 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($explicitBaseOut)) {
      throw "INVALID_BASE_REF: Cannot resolve BaseRef '$BaseRef'."
    }
    $explicitBaseSha = $explicitBaseOut.Trim().ToLowerInvariant()
    if ($explicitBaseSha -ne $parentSha) {
      throw "CLOSEOUT_BASE_MISMATCH: Explicit BaseRef '$BaseRef' ($explicitBaseSha) does not match parent ($parentSha) of commit ($closeoutSha)."
    }
  }
  $baseSha = $parentSha

  $lsRemoteOut = @(& git -C $resolvedRepoRoot ls-remote $RemoteName "refs/heads/$RemoteBranch" 2>$null)
  if ($LASTEXITCODE -ne 0 -or $lsRemoteOut.Count -eq 0 -or [string]::IsNullOrWhiteSpace($lsRemoteOut[0])) {
    throw "CLOSEOUT_REMOTE_UNVERIFIED: Unable to resolve '$RemoteName' branch '$RemoteBranch' via git ls-remote."
  }
  $lsParts = $lsRemoteOut[0].Trim() -split "\s+"
  if ($lsParts.Count -lt 1 -or $lsParts[0] -notmatch "^[0-9a-fA-F]{40}$") {
    throw "CLOSEOUT_REMOTE_UNVERIFIED: Invalid SHA output from git ls-remote for '$RemoteName/$RemoteBranch'."
  }
  $verifiedRemoteSha = $lsParts[0].ToLowerInvariant()
  $remoteRefLabel = "$RemoteName/$RemoteBranch"

  $trackingShaOut = & git -C $resolvedRepoRoot rev-parse --verify "refs/remotes/$RemoteName/$RemoteBranch^{commit}" 2>$null
  if ($LASTEXITCODE -eq 0 -and (-not [string]::IsNullOrWhiteSpace($trackingShaOut))) {
    $trackingSha = $trackingShaOut.Trim().ToLowerInvariant()
    if ($trackingSha -ne $verifiedRemoteSha) {
      throw "CLOSEOUT_REMOTE_MISMATCH: Local remote-tracking ref '$RemoteName/$RemoteBranch' ($trackingSha) differs from ls-remote ($verifiedRemoteSha)."
    }
  }

  if ($verifiedRemoteSha -ne $closeoutSha) {
    throw "CLOSEOUT_REMOTE_MISMATCH: Verified remote '$RemoteName/$RemoteBranch' SHA ($verifiedRemoteSha) does not match local closeout commit ($closeoutSha)."
  }
  if (-not [string]::IsNullOrWhiteSpace($ExpectedRemoteSha)) {
    $expectedClean = $ExpectedRemoteSha.Trim().ToLowerInvariant()
    if ($verifiedRemoteSha -ne $expectedClean) {
      throw "CLOSEOUT_REMOTE_MISMATCH: Verified remote SHA ($verifiedRemoteSha) does not match ExpectedRemoteSha ($expectedClean)."
    }
  }
} else {
  $baseShaOut = & git -C $resolvedRepoRoot rev-parse --verify "$BaseRef^{commit}" 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($baseShaOut)) {
    throw "INVALID_BASE_REF: Cannot resolve BaseRef '$BaseRef'."
  }
  $baseSha = $baseShaOut.Trim().ToLowerInvariant()

  if ($Stage -eq "PLAN") {
    if ([string]::IsNullOrWhiteSpace($PlanFile)) {
      throw "MISSING_PLAN_FILE: Stage 'PLAN' requires -PlanFile."
    }
    if ($expandedNewFiles.Count -gt 0) {
      throw "FORBIDDEN_NEW_FILES_IN_PLAN: Stage 'PLAN' is read-only and must not include -NewFiles."
    }
    if ($gitUntrackedRelPaths.Count -gt 0 -or $preStaged.Count -gt 0) {
      throw "DIRTY_TREE_IN_PLAN: Stage 'PLAN' requires zero untracked or staged files in working tree."
    }
  } else {
    if ([string]::IsNullOrWhiteSpace($EvidenceFile)) {
      throw "MISSING_EVIDENCE_FILE: Stage '$Stage' requires -EvidenceFile."
    }
  }
}

$evidenceApprovedRoots = @($resolvedRepoRoot, $defaultPacketRoot, $antigravityBrainRoot)
$additionalApprovedRoots = @($resolvedRepoRoot, $trustedTempEvidenceRoot, $antigravityBrainRoot)

$allCanonicalInputPaths = New-Object "System.Collections.Generic.HashSet[string]" ([System.StringComparer]::OrdinalIgnoreCase)

$resolvedEvidence = ""
if (-not [string]::IsNullOrWhiteSpace($EvidenceFile)) {
  $evObj = Resolve-ApprovedExistingFile -InputPath $EvidenceFile -DefaultBaseDir $resolvedRepoRoot -ApprovedRoots $evidenceApprovedRoots
  [void]$allCanonicalInputPaths.Add($evObj.FullPath)
  $resolvedEvidence = $evObj.FullPath
}

$resolvedPlan = ""
if (-not [string]::IsNullOrWhiteSpace($PlanFile)) {
  $planObj = Resolve-ApprovedExistingFile -InputPath $PlanFile -DefaultBaseDir $resolvedRepoRoot -ApprovedRoots $evidenceApprovedRoots
  if (-not $allCanonicalInputPaths.Add($planObj.FullPath)) {
    throw "DUPLICATE_INPUT_FILE: PlanFile '$PlanFile' duplicates another selected input file."
  }
  $resolvedPlan = $planObj.FullPath
}

$resolvedNewFiles = @()
$seenNewRelPaths = New-Object "System.Collections.Generic.HashSet[string]" ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($nf in $expandedNewFiles) {
  $nfObj = Resolve-ApprovedExistingFile -InputPath $nf -DefaultBaseDir $resolvedRepoRoot -ApprovedRoots @($resolvedRepoRoot)
  Assert-SafeArchiveEntryPath -ArchivePath $nfObj.RelPath
  if (-not $seenNewRelPaths.Add($nfObj.RelPath)) {
    throw "DUPLICATE_NEW_FILE: Duplicate NewFile '$($nfObj.RelPath)'."
  }
  if (-not $allCanonicalInputPaths.Add($nfObj.FullPath)) {
    throw "DUPLICATE_INPUT_FILE: NewFile '$($nfObj.RelPath)' duplicates another selected input file."
  }
  $resolvedNewFiles += [PSCustomObject]@{
    FullPath = $nfObj.FullPath
    RelPath  = $nfObj.RelPath
  }
}

$normalizedTaskAllowlist = @()
$seenAllowlistPaths = New-Object "System.Collections.Generic.HashSet[string]" ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($rawAllow in $expandedTaskAllowlist) {
  $normAllow = Resolve-NormalizedRepoRelativePath -RawPath $rawAllow -RepoRootPath $resolvedRepoRoot
  Assert-SafeArchiveEntryPath -ArchivePath $normAllow
  if (-not $seenAllowlistPaths.Add($normAllow)) {
    throw "DUPLICATE_TASK_ALLOWLIST_FILE: Duplicate entry '$normAllow' in -TaskAllowlist."
  }
  $normalizedTaskAllowlist += $normAllow
}

$resolvedAdditional = @()
$seenAdditionalLeafNames = New-Object "System.Collections.Generic.HashSet[string]" ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($af in $expandedAdditionalFiles) {
  $afObj = Resolve-ApprovedExistingFile -InputPath $af -DefaultBaseDir $resolvedRepoRoot -ApprovedRoots $additionalApprovedRoots
  if (-not $allCanonicalInputPaths.Add($afObj.FullPath)) {
    throw "DUPLICATE_ADDITIONAL_FILE: AdditionalFile '$af' duplicates another selected input file."
  }
  $leafName = [System.IO.Path]::GetFileName($afObj.FullPath)
  if (-not $seenAdditionalLeafNames.Add($leafName)) {
    throw "DUPLICATE_ADDITIONAL_FILE: Ambiguous or duplicate additional file leaf name '$leafName'."
  }
  $archiveAfPath = "additional/$leafName"
  Assert-SafeArchiveEntryPath -ArchivePath $archiveAfPath
  $resolvedAdditional += [PSCustomObject]@{
    FullPath    = $afObj.FullPath
    ArchivePath = $archiveAfPath
  }
}

$trackedDiffNamesRaw = if ($Stage -eq "CLOSEOUT") {
  @(& git -C $resolvedRepoRoot diff --name-only $parentSha $localCommitSha)
} else {
  @(& git -C $resolvedRepoRoot diff --name-only $baseSha)
}
if ($LASTEXITCODE -ne 0) {
  throw "GIT_ERROR: Failed to list tracked diff names."
}
$trackedDiffNames = @($trackedDiffNamesRaw | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { (ConvertFrom-GitPorcelainPath -RawPorcelainPath $_) })
$trackedDiffSet = New-Object "System.Collections.Generic.HashSet[string]" ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($tdn in $trackedDiffNames) {
  Assert-SafeCandidatePath -RawPath $tdn -NormalizedRelPath $tdn
  $fullTdn = [System.IO.Path]::GetFullPath((Join-Path $resolvedRepoRoot $tdn))
  Assert-NoReparsePointChain -TargetPath $fullTdn
  [void]$trackedDiffSet.Add($tdn)
}

if ($Stage -eq "PLAN" -and $trackedDiffNames.Count -gt 0) {
  throw "DIRTY_TREE_IN_PLAN: Stage 'PLAN' requires zero tracked modifications against '$baseSha'."
}

if ($Stage -eq "CLOSEOUT" -and $trackedDiffNames.Count -eq 0) {
  throw "EMPTY_CLOSEOUT_COMMIT: Commit '$localCommitSha' has zero changed files against parent '$parentSha'."
}

if ($Stage -ne "PLAN" -and $Stage -ne "CLOSEOUT") {
  foreach ($utRel in $gitUntrackedRelPaths) {
    if (-not $seenNewRelPaths.Contains($utRel)) {
      throw "MISSING_UNTRACKED_TASK_FILE: Untracked file '$utRel' in git status was omitted from -NewFiles."
    }
  }
  foreach ($nfRel in $seenNewRelPaths) {
    if ($trackedDiffSet.Contains($nfRel)) {
      throw "INVALID_NEW_FILE: File '$nfRel' is already tracked in git diff and must not be duplicated in -NewFiles."
    }
  }
}

if ($seenAllowlistPaths.Count -gt 0) {
  foreach ($tdn in $trackedDiffNames) {
    if (-not $seenAllowlistPaths.Contains($tdn)) {
      throw "UNAPPROVED_TASK_FILE: Changed file '$tdn' is not listed in -TaskAllowlist."
    }
  }
  foreach ($nfObj in $resolvedNewFiles) {
    if (-not $seenAllowlistPaths.Contains($nfObj.RelPath)) {
      throw "UNAPPROVED_TASK_FILE: Selected NewFile '$($nfObj.RelPath)' is not listed in -TaskAllowlist."
    }
  }
  foreach ($allowEntry in $normalizedTaskAllowlist) {
    $inTracked = $trackedDiffSet.Contains($allowEntry)
    $inNew = $seenNewRelPaths.Contains($allowEntry)
    if ((-not $inTracked) -and (-not $inNew)) {
      throw "MISSING_UNTRACKED_TASK_FILE: TaskAllowlist file '$allowEntry' is missing from tracked diff and -NewFiles."
    }
  }
}

New-Item -ItemType Directory -Force -Path $targetOutDir | Out-Null
Assert-NoReparsePointChain -TargetPath $targetOutDir
$stagingDir = Join-Path $targetOutDir ("stage_" + $TaskId + "_" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null

$zipFileName = "${TaskId}_REVIEW_PACKET.zip"
$zipFullPath = Join-Path $targetOutDir $zipFileName

try {
  $stagedEntries = @()
  $seenArchivePaths = New-Object "System.Collections.Generic.HashSet[string]" ([System.StringComparer]::OrdinalIgnoreCase)

  if ($Stage -ne "PLAN") {
    $patchArchiveName = "${TaskId}_tracked_diff.patch"
    Assert-SafeArchiveEntryPath -ArchivePath $patchArchiveName
    $patchDestPath = Join-Path $stagingDir $patchArchiveName
    if ($Stage -eq "CLOSEOUT") {
      & git -C $resolvedRepoRoot diff --binary --output="$patchDestPath" $parentSha $localCommitSha
    } else {
      & git -C $resolvedRepoRoot diff --binary --output="$patchDestPath" $baseSha
    }
    if ($LASTEXITCODE -ne 0 -or (-not (Test-Path -LiteralPath $patchDestPath -PathType Leaf))) {
      throw "GIT_DIFF_FAILED: Failed to export tracked diff patch."
    }
    $patchBytes = (Get-Item -LiteralPath $patchDestPath).Length
    if ($patchBytes -eq 0 -and $resolvedNewFiles.Count -eq 0) {
      throw "EMPTY_REVIEW_PACKET: Stage '$Stage' has zero tracked diff bytes and zero selected NewFiles."
    }
    [void]$seenArchivePaths.Add($patchArchiveName)
    $stagedEntries += [PSCustomObject]@{
      ArchivePath = $patchArchiveName
      DiskPath    = $patchDestPath
      Bytes       = $patchBytes
      Sha256      = Get-FileSha256Hex -FilePath $patchDestPath
    }
  }

  foreach ($nfObj in $resolvedNewFiles) {
    Assert-SafeArchiveEntryPath -ArchivePath $nfObj.RelPath
    if (-not $seenArchivePaths.Add($nfObj.RelPath)) {
      throw "DUPLICATE_ARCHIVE_ENTRY: Archive entry '$($nfObj.RelPath)' collides with an existing entry."
    }
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
    Assert-SafeArchiveEntryPath -ArchivePath $evArchiveName
    if (-not $seenArchivePaths.Add($evArchiveName)) {
      throw "DUPLICATE_ARCHIVE_ENTRY: Archive entry '$evArchiveName' collides with an existing entry."
    }
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
    Assert-SafeArchiveEntryPath -ArchivePath $planArchiveName
    if (-not $seenArchivePaths.Add($planArchiveName)) {
      throw "DUPLICATE_ARCHIVE_ENTRY: Archive entry '$planArchiveName' collides with an existing entry."
    }
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
    Assert-SafeArchiveEntryPath -ArchivePath $afObj.ArchivePath
    if (-not $seenArchivePaths.Add($afObj.ArchivePath)) {
      throw "DUPLICATE_ARCHIVE_ENTRY: Archive entry '$($afObj.ArchivePath)' collides with an existing entry."
    }
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
  Assert-SafeArchiveEntryPath -ArchivePath $manifestArchiveName
  if (-not $seenArchivePaths.Add($manifestArchiveName)) {
    throw "DUPLICATE_ARCHIVE_ENTRY: Archive entry '$manifestArchiveName' collides with an existing entry."
  }
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
    taskId                  = $TaskId
    stage                   = $Stage
    baseRef                 = $BaseRef
    baseSha                 = $baseSha
    headSha                 = $headSha
    localCommitSha          = $localCommitSha
    parentSha               = $parentSha
    verifiedRemoteSha       = $verifiedRemoteSha
    remoteRef               = $remoteRefLabel
    expectedReviewGate      = $ExpectedReviewGate
    generatedAtUtc          = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    taskAllowlist           = @($normalizedTaskAllowlist)
    trackedModifiedFiles    = @($trackedDiffNames)
    selectedNewFiles        = @($resolvedNewFiles | ForEach-Object { $_.RelPath })
    contentSafetyDisclaimer = "Path, root, and reparse-point checks do not guarantee arbitrary file contents are free of secrets."
    files                   = $manifestFilesArray
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

  $postStatus = @(& git -C $resolvedRepoRoot status --porcelain=v1 -uall)
  $postStaged = @(& git -C $resolvedRepoRoot diff --cached --name-only)
  if (($preStatus -join "`n") -ne ($postStatus -join "`n") -or ($preStaged -join "`n") -ne ($postStaged -join "`n")) {
    throw "GIT_STATE_MUTATED: Git working tree or index changed during packet export."
  }

  $zipSha256 = Get-FileSha256Hex -FilePath $zipFullPath
  $zipBytes = (Get-Item -LiteralPath $zipFullPath).Length

  $resultSummary = [ordered]@{
    status            = "OK"
    taskId            = $TaskId
    stage             = $Stage
    baseSha           = $baseSha
    headSha           = $headSha
    localCommitSha    = $localCommitSha
    parentSha         = $parentSha
    verifiedRemoteSha = $verifiedRemoteSha
    remoteRef         = $remoteRefLabel
    zipFileName       = $zipFileName
    zipPath           = $zipFullPath
    zipSha256         = $zipSha256
    zipBytes          = $zipBytes
    archiveEntries    = @($allArchiveExpectations | ForEach-Object {
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
