# IHEPSRS academic-prototype focused build/test evidence.
# Does NOT test real HTTP API, CodeQL, third-party deployments, KMS, or production security.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$evidenceDir = Join-Path ([System.IO.Path]::GetTempPath()) ('IHEPSRS-roa-duaa-qa-' + $stamp)
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

$checks = @(
    @{ Name = 'quality'; Arguments = @('quality') },
    @{ Name = 'defense-35-and-23'; Arguments = @('--filter', '@ihepsrs/api', 'thesis-defense:check') },
    @{ Name = 'security-14'; Arguments = @('--filter', '@ihepsrs/api', 'hardening-security:check') },
    @{ Name = 'supervision'; Arguments = @('--filter', '@ihepsrs/api', 'thesis:check') },
    @{ Name = 'pg-workflows'; Arguments = @('--filter', '@ihepsrs/api', 'pg-workflows:check') },
    @{ Name = 'iam003'; Arguments = @('--filter', '@ihepsrs/api', 'iam003:check') },
    @{ Name = 'iam004'; Arguments = @('--filter', '@ihepsrs/api', 'iam004:check') },
    @{ Name = 'iam005'; Arguments = @('--filter', '@ihepsrs/api', 'iam005:check') }
)

Push-Location $repoRoot
try {
    Get-Command pnpm -ErrorAction Stop | Out-Null
    Get-Command git -ErrorAction Stop | Out-Null

    $sha = & git rev-parse HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Cannot identify current Git revision' }
    Set-Content -Path (Join-Path $evidenceDir 'SHA.txt') -Value $sha
    Write-Host "Commit: $sha"
    Write-Host "Evidence directory: $evidenceDir"

    foreach ($check in $checks) {
        Write-Host ('RUN ' + $check.Name)
        $log = Join-Path $evidenceDir ($check.Name + '.log')
        $arguments = $check.Arguments

        # Windows PowerShell 5.1 can promote native stderr to a terminating error
        # when ErrorActionPreference is Stop. Rely on the actual exit code instead.
        $ErrorActionPreference = 'Continue'
        try {
            & pnpm @arguments 2>&1 | Out-File -FilePath $log -Encoding utf8
            $exit = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = 'Stop'
        }

        if ($exit -ne 0) {
            Get-Content -Path $log -Tail 40 | ForEach-Object { Write-Host $_ }
            throw ('FAILED ' + $check.Name + ' (exit=' + $exit + '); inspect ' + $log)
        }
        Get-Content -Path $log -Tail 2 | ForEach-Object { Write-Host $_ }
    }

    & git diff --check
    if ($LASTEXITCODE -ne 0) { throw 'git diff --check failed' }
    & git diff --cached --check
    if ($LASTEXITCODE -ne 0) { throw 'git diff --cached --check failed' }

    Write-Host "LOCAL FOCUSED GATES PASSED - $sha"
    Write-Host "Logs: $evidenceDir"
    Write-Host 'NOT YET ACCEPTED: real API demo, PR CI, CodeQL/SCA, ADR and owner sign-off.'
}
finally {
    Pop-Location
}
