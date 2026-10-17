[CmdletBinding(PositionalBinding = $false)]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Add-Type -AssemblyName System.IO.Compression.FileSystem

$exporterScript = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\export-review-packet.ps1"))
if (-not (Test-Path -LiteralPath $exporterScript -PathType Leaf)) {
  throw "TEST_SETUP_ERROR: Exporter script not found at '$exporterScript'."
}

$sysTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\', '/')
$packetRoot = Join-Path $sysTemp "tong-mon-8d-review-packets"
$trustedDir = Join-Path $packetRoot "trusted"
$fixtureBase = Join-Path $packetRoot ("test_suite_" + [guid]::NewGuid().ToString("N"))
$outDir = Join-Path $fixtureBase "packets_out"
$outsideDir = Join-Path $sysTemp ("tong-mon-8d-untrusted-" + [guid]::NewGuid().ToString("N"))
$trustedExtra = ""
$dupDirA = ""
$dupDirB = ""

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$testResults = @()
$vnTitle = "T" + [char]0x00F4 + "ng M" + [char]0x00F4 + "n 8D - Tu Ti" + [char]0x00EA + "n Chi L" + [char]0x1ED9
$vnRealmLine = "Luy" + [char]0x1EC7 + "n Kh" + [char]0x00ED + " -> Th" + [char]0x00E1 + "nh C" + [char]0x1EA3 + "nh"

function Write-Utf8File {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string]$Content
  )
  $dir = [System.IO.Path]::GetDirectoryName($FilePath)
  if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  [System.IO.File]::WriteAllBytes($FilePath, $utf8NoBom.GetBytes($Content))
}

function Assert-ThrowsCode {
  param(
    [Parameter(Mandatory = $true)][string]$TestName,
    [Parameter(Mandatory = $true)][string]$ExpectedSubstring,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )
  $threw = $false
  $actualMessage = ""
  try {
    & $Action | Out-Null
  } catch {
    $threw = $true
    $actualMessage = $_.Exception.Message
  }
  if (-not $threw) {
    throw "ASSERTION_FAILED [$TestName]: Expected error containing '$ExpectedSubstring', but command succeeded."
  }
  if ($actualMessage -notlike "*$ExpectedSubstring*") {
    throw "ASSERTION_FAILED [$TestName]: Expected error containing '$ExpectedSubstring', got '$actualMessage'."
  }
  return [PSCustomObject]@{
    test     = $TestName
    status   = "PASS"
    expected = $ExpectedSubstring
  }
}

try {
  New-Item -ItemType Directory -Force -Path $fixtureBase | Out-Null
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  New-Item -ItemType Directory -Force -Path $trustedDir | Out-Null
  New-Item -ItemType Directory -Force -Path $outsideDir | Out-Null

  $remoteBare = Join-Path $fixtureBase "remote.git"
  $repoDir = Join-Path $fixtureBase "repo"
  New-Item -ItemType Directory -Force -Path $remoteBare | Out-Null
  New-Item -ItemType Directory -Force -Path $repoDir | Out-Null

  & git -C $remoteBare init --bare -b master | Out-Null
  & git -C $repoDir init -b master | Out-Null
  & git -C $repoDir config user.name "Test Runner" | Out-Null
  & git -C $repoDir config user.email "test@example.com" | Out-Null
  & git -C $repoDir remote add origin $remoteBare | Out-Null

  Write-Utf8File -FilePath (Join-Path $repoDir "docs\README.md") -Content ("# " + $vnTitle + "`nBaseline v0.2`n")
  Write-Utf8File -FilePath (Join-Path $repoDir "src\index.ts") -Content "export const REALM = 'Pham Nhan';`n"
  & git -C $repoDir add . | Out-Null
  & git -C $repoDir commit -m "chore: initial fixture commit" | Out-Null
  & git -C $repoDir push -u origin master | Out-Null
  $initialSha = (& git -C $repoDir rev-parse HEAD).Trim().ToLowerInvariant()

  $planFile = Join-Path $fixtureBase "plan_doc.md"
  Write-Utf8File -FilePath $planFile -Content "# Stage 1 Plan`nRead-only plan fixture.`n"

  $t01Json = & $exporterScript -TaskId "FIXTURE_PLAN" -Stage "PLAN" -RepoRoot $repoDir -PlanFile $planFile -OutputDir $outDir
  $t01Obj = $t01Json | ConvertFrom-Json
  if ($t01Obj.status -ne "OK" -or $t01Obj.archiveEntries.Count -ne 2) {
    throw "ASSERTION_FAILED [T01_PLAN_POSITIVE]: Unexpected PLAN packet output."
  }
  $testResults += [PSCustomObject]@{ test = "T01_PLAN_POSITIVE"; status = "PASS"; expected = "OK (2 entries)" }

  Write-Utf8File -FilePath (Join-Path $repoDir "docs\README.md") -Content ("# " + $vnTitle + "`n" + $vnRealmLine + "`n")
  Write-Utf8File -FilePath (Join-Path $repoDir "src\newFeature.ts") -Content "export const DAO = 'Kiem Dao';`n"
  $evidenceFile = Join-Path $fixtureBase "verify_evidence.md"
  Write-Utf8File -FilePath $evidenceFile -Content "# Verification Evidence`nAll gates passed.`n"
  $trustedExtra = Join-Path $trustedDir ("extra_" + [guid]::NewGuid().ToString("N") + ".txt")
  Write-Utf8File -FilePath $trustedExtra -Content "Trusted temporary verification log.`n"

  $testResults += Assert-ThrowsCode -TestName "T03_FIX1_MISSING_UNTRACKED_IN_GIT_STATUS" -ExpectedSubstring "MISSING_UNTRACKED_TASK_FILE" -Action {
    & $exporterScript -TaskId "FIXTURE_OMIT" -Stage "VERIFY" -RepoRoot $repoDir -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  $testResults += Assert-ThrowsCode -TestName "T04A_FIX1_ALLOWLIST_MISSING_NEWFILE" -ExpectedSubstring "MISSING_UNTRACKED_TASK_FILE" -Action {
    & $exporterScript -TaskId "FIXTURE_ALLOW_A" -Stage "VERIFY" -RepoRoot $repoDir -NewFiles @("src/newFeature.ts") -TaskAllowlist @("docs/README.md", "src/newFeature.ts", "src/missingFile.ts") -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  $testResults += Assert-ThrowsCode -TestName "T04B_FIX1_ALLOWLIST_UNAPPROVED_CHANGED_FILE" -ExpectedSubstring "UNAPPROVED_TASK_FILE" -Action {
    & $exporterScript -TaskId "FIXTURE_ALLOW_B" -Stage "VERIFY" -RepoRoot $repoDir -NewFiles @("src/newFeature.ts") -TaskAllowlist @("src/newFeature.ts") -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  $t02Json = & $exporterScript `
    -TaskId "FIXTURE_VERIFY" `
    -Stage "VERIFY" `
    -RepoRoot $repoDir `
    -NewFiles @("src/newFeature.ts") `
    -TaskAllowlist @("docs/README.md", "src/newFeature.ts") `
    -AdditionalFiles @($trustedExtra) `
    -EvidenceFile $evidenceFile `
    -OutputDir $outDir
  $t02Obj = $t02Json | ConvertFrom-Json
  if ($t02Obj.status -ne "OK" -or $t02Obj.archiveEntries.Count -ne 5) {
    throw "ASSERTION_FAILED [T02_VERIFY_POSITIVE]: Expected 5 entries in VERIFY packet."
  }

  $zipVerify = [System.IO.Compression.ZipFile]::OpenRead($t02Obj.zipPath)
  try {
    $patchEntry = $zipVerify.GetEntry("FIXTURE_VERIFY_tracked_diff.patch")
    $sr = New-Object System.IO.StreamReader($patchEntry.Open(), [System.Text.Encoding]::UTF8)
    $patchText = $sr.ReadToEnd()
    $sr.Close()
    if (-not $patchText.Contains($vnRealmLine)) {
      throw "ASSERTION_FAILED [T02_UTF8_VIETNAMESE]: Vietnamese UTF-8 text corrupted in patch."
    }
  } finally {
    $zipVerify.Dispose()
  }
  $testResults += [PSCustomObject]@{ test = "T02_VERIFY_POSITIVE_AND_UTF8"; status = "PASS"; expected = "OK (5 entries + UTF-8 Vietnamese)" }

  $outsideFile = Join-Path $outsideDir "arbitrary_external.txt"
  Write-Utf8File -FilePath $outsideFile -Content "External file content.`n"

  $testResults += Assert-ThrowsCode -TestName "T05A_FIX2_EXTERNAL_ADDITIONAL_FILE_REJECTED" -ExpectedSubstring "FORBIDDEN_EXTERNAL_PATH" -Action {
    & $exporterScript -TaskId "FIXTURE_EXT_ADD" -Stage "VERIFY" -RepoRoot $repoDir -NewFiles @("src/newFeature.ts") -AdditionalFiles @($outsideFile) -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  $testResults += Assert-ThrowsCode -TestName "T05B_FIX2_EXTERNAL_EVIDENCE_FILE_REJECTED" -ExpectedSubstring "FORBIDDEN_EXTERNAL_PATH" -Action {
    & $exporterScript -TaskId "FIXTURE_EXT_EV" -Stage "VERIFY" -RepoRoot $repoDir -NewFiles @("src/newFeature.ts") -EvidenceFile $outsideFile -OutputDir $outDir
  }

  $junctionPath = Join-Path $repoDir "sub_junction"
  New-Item -ItemType Junction -Path $junctionPath -Target $outsideDir | Out-Null
  try {
    $testResults += Assert-ThrowsCode -TestName "T06A_FIX2_JUNCTION_IN_REPO_REJECTED" -ExpectedSubstring "FORBIDDEN_REPARSE_POINT" -Action {
      & $exporterScript -TaskId "FIXTURE_JUNC_IN" -Stage "VERIFY" -RepoRoot $repoDir -NewFiles @("src/newFeature.ts", "sub_junction/arbitrary_external.txt") -EvidenceFile $evidenceFile -OutputDir $outDir
    }
  } finally {
    if (Test-Path -LiteralPath $junctionPath) {
      [System.IO.Directory]::Delete($junctionPath, $false)
    }
  }

  $outJunction = Join-Path $fixtureBase "out_junction"
  New-Item -ItemType Junction -Path $outJunction -Target $outsideDir | Out-Null
  try {
    $testResults += Assert-ThrowsCode -TestName "T06B_FIX2_JUNCTION_OUTPUT_DIR_REJECTED" -ExpectedSubstring "FORBIDDEN_REPARSE_POINT" -Action {
      & $exporterScript -TaskId "FIXTURE_JUNC_OUT" -Stage "VERIFY" -RepoRoot $repoDir -NewFiles @("src/newFeature.ts") -EvidenceFile $evidenceFile -OutputDir $outJunction
    }
  } finally {
    if (Test-Path -LiteralPath $outJunction) {
      [System.IO.Directory]::Delete($outJunction, $false)
    }
  }

  $testResults += Assert-ThrowsCode -TestName "T07A_FIX2_PATH_TRAVERSAL_REJECTED" -ExpectedSubstring "FORBIDDEN_PATH_TRAVERSAL" -Action {
    & $exporterScript -TaskId "FIXTURE_TRAV" -Stage "VERIFY" -RepoRoot $repoDir -NewFiles @("src/../../outside.txt") -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  $testResults += Assert-ThrowsCode -TestName "T07B_FIX2_SENSITIVE_ENV_REJECTED" -ExpectedSubstring "FORBIDDEN_SENSITIVE_PATH" -Action {
    & $exporterScript -TaskId "FIXTURE_ENV" -Stage "VERIFY" -RepoRoot $repoDir -NewFiles @(".env.local") -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  $testResults += Assert-ThrowsCode -TestName "T07C_FIX2_SENSITIVE_PGDATA_REJECTED" -ExpectedSubstring "FORBIDDEN_SENSITIVE_PATH" -Action {
    & $exporterScript -TaskId "FIXTURE_PG" -Stage "VERIFY" -RepoRoot $repoDir -NewFiles @("apps/server/data/pgdata/PG_VERSION") -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  $dupDirA = Join-Path $trustedDir "dupA"
  $dupDirB = Join-Path $trustedDir "dupB"
  $dupFileA = Join-Path $dupDirA "same_name.txt"
  $dupFileB = Join-Path $dupDirB "same_name.txt"
  Write-Utf8File -FilePath $dupFileA -Content "A`n"
  Write-Utf8File -FilePath $dupFileB -Content "B`n"

  $testResults += Assert-ThrowsCode -TestName "T07D_FIX2_AMBIGUOUS_DUPLICATE_ADDITIONAL_REJECTED" -ExpectedSubstring "DUPLICATE_ADDITIONAL_FILE" -Action {
    & $exporterScript -TaskId "FIXTURE_DUP_ADD" -Stage "VERIFY" -RepoRoot $repoDir -NewFiles @("src/newFeature.ts") -AdditionalFiles @($dupFileA, $dupFileB) -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  $testResults += Assert-ThrowsCode -TestName "T09C_FIX3_CLOSEOUT_DIRTY_TREE_REJECTED" -ExpectedSubstring "DIRTY_TREE_IN_CLOSEOUT" -Action {
    & $exporterScript -TaskId "FIXTURE_CLOSE_DIRTY" -Stage "CLOSEOUT" -RepoRoot $repoDir -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  & git -C $repoDir add "docs/README.md" "src/newFeature.ts" | Out-Null
  & git -C $repoDir commit -m "feat: add Dao constant and update README" | Out-Null
  $committedSha = (& git -C $repoDir rev-parse HEAD).Trim().ToLowerInvariant()

  $testResults += Assert-ThrowsCode -TestName "T09A_FIX3_CLOSEOUT_UNPUSHED_REMOTE_MISMATCH_REJECTED" -ExpectedSubstring "CLOSEOUT_REMOTE_MISMATCH" -Action {
    & $exporterScript -TaskId "FIXTURE_CLOSE_UNPUSHED" -Stage "CLOSEOUT" -RepoRoot $repoDir -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  & git -C $repoDir push origin master | Out-Null

  $testResults += Assert-ThrowsCode -TestName "T09B_FIX3_CLOSEOUT_EXPECTED_REMOTE_SHA_MISMATCH_REJECTED" -ExpectedSubstring "CLOSEOUT_REMOTE_MISMATCH" -Action {
    & $exporterScript -TaskId "FIXTURE_CLOSE_BAD_SHA" -Stage "CLOSEOUT" -RepoRoot $repoDir -ExpectedRemoteSha $initialSha -EvidenceFile $evidenceFile -OutputDir $outDir
  }

  $t08Json = & $exporterScript `
    -TaskId "FIXTURE_CLOSEOUT" `
    -Stage "CLOSEOUT" `
    -RepoRoot $repoDir `
    -ExpectedRemoteSha $committedSha `
    -TaskAllowlist @("docs/README.md", "src/newFeature.ts") `
    -EvidenceFile $evidenceFile `
    -OutputDir $outDir
  $t08Obj = $t08Json | ConvertFrom-Json
  if (
    $t08Obj.status -ne "OK" -or
    $t08Obj.localCommitSha -ne $committedSha -or
    $t08Obj.parentSha -ne $initialSha -or
    $t08Obj.verifiedRemoteSha -ne $committedSha -or
    $t08Obj.archiveEntries.Count -ne 3
  ) {
    throw "ASSERTION_FAILED [T08_FIX3_CLOSEOUT_POSITIVE]: Unexpected CLOSEOUT packet metadata."
  }
  $testResults += [PSCustomObject]@{ test = "T08_FIX3_CLOSEOUT_POSITIVE"; status = "PASS"; expected = "OK (local=remote=$committedSha, parent=$initialSha)" }

  $summary = [ordered]@{
    suiteStatus = "ALL_PASSED"
    totalTests  = $testResults.Count
    results     = $testResults
  }
  Write-Output ($summary | ConvertTo-Json -Depth 5)
} finally {
  if ((-not [string]::IsNullOrWhiteSpace($trustedExtra)) -and (Test-Path -LiteralPath $trustedExtra)) {
    Remove-Item -LiteralPath $trustedExtra -Force -ErrorAction SilentlyContinue
  }
  if ((-not [string]::IsNullOrWhiteSpace($dupDirA)) -and (Test-Path -LiteralPath $dupDirA)) {
    Remove-Item -LiteralPath $dupDirA -Recurse -Force -ErrorAction SilentlyContinue
  }
  if ((-not [string]::IsNullOrWhiteSpace($dupDirB)) -and (Test-Path -LiteralPath $dupDirB)) {
    Remove-Item -LiteralPath $dupDirB -Recurse -Force -ErrorAction SilentlyContinue
  }
  if ((-not [string]::IsNullOrWhiteSpace($fixtureBase)) -and (Test-Path -LiteralPath $fixtureBase)) {
    Remove-Item -LiteralPath $fixtureBase -Recurse -Force -ErrorAction SilentlyContinue
  }
  if ((-not [string]::IsNullOrWhiteSpace($outsideDir)) -and (Test-Path -LiteralPath $outsideDir)) {
    Remove-Item -LiteralPath $outsideDir -Recurse -Force -ErrorAction SilentlyContinue
  }
}
