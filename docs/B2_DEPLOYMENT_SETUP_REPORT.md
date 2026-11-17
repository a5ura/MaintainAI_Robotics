# B.2 — Read-only hosting setup execution record

November 17, 2026 (America/New_York). **In progress — owner-assisted prerequisites. No hosted service or schema initialization is verified yet.**

## Authorization and baseline

Planning authorized B.2 setup at `f4cbad8565cd4ca3c8da617783b53f62900f6ee4`, the verified remote main merge of PR #24. Initial checkout was clean at `db60ed0ef1088c3fd6abb02ffe2c14454317366c` with an identical tracked tree. Setup branch: `setup/b2-readonly-hosting`, based on the approved merge commit.

The new authorization supersedes the prior report's prohibition on beginning setup. It does not authorize public API writes, public launch, paid upgrades/payment methods, existing data deletion or V2. Follow the [existing runbook](PHASE_B1_HOSTED_RUNBOOK.md) only within this scope: reuse the existing Neon project rather than step 2's new-project creation, and stop before step 12's write enablement. Keep automatic deployments disabled and `DEMO_READONLY=1` throughout.

## Owner-supplied account facts

These are accepted as owner-confirmed facts, not independently authenticated dashboard observations:

- Render Hobby and Neon Free; no linked payment methods.
- Zero reported monthly compute/bandwidth usage on both providers. New inspection queries may consume a small amount of Neon compute/transfer; no exact unchanged-usage claim is made afterward.
- Existing project `maintainai-robotics-v1`, AWS US East 2 (Ohio). Reuse it; no second Neon project is planned.
- Owner ran the read-only metadata transaction: selected database reported as `neondb`, public functions `0`, runtime role result `f` (false), BEGIN/COMMIT successful. A subsequent explicit count confirmed `non_system_relations = 0` on PostgreSQL `17.12 (14c6cec)`. No SQL error was reported.
- Laptop approved as independent backup destination. Owner verified PostgreSQL 17.12 clients and a fresh restricted directory: inheritance disabled True, access-rule count 2, other-account rules 0, free space 298.59 GB. Encryption/recovery-key handling and actual archive/recovery remain unverified; no encryption claim is made.

## Agent-verified preflight

- Approved main SHA fetched and confirmed; no production/configuration changes.
- Manifest remains one Free native Python service, auto-deploy false, read-only one, bounded pool four, pinned Python/Node, `/api/health`, and same-origin compiled frontend.
- Reviewed runbook, migration/seed implementation, restricted runtime SQL and security/capacity policies. Existing operator command is `python -m postgres.local`, with the direct owner connection loaded securely in that operator's environment. It is not an HTTP startup operation.
- No Render/Neon connector, configured provider secret/outbound identity, owner/runtime database URL or provider API key is available through this cloud task. No usable browser-control tool is exposed; a declared desktop capability is not evidence of an accessible authenticated session.
- Managed environment status reports enforced restricted egress without provider host grants. No provider connection was attempted or bypassed. `psql`, `pg_dump`, `pg_restore` and provider CLIs are unavailable here; no tools were installed.
- Do not request credentials in chat. Owner operations must keep connection strings, passwords and runtime secrets inside the provider dashboard or protected local operator context.

## Current gate status

| Gate                                                       | Status          | Next evidence                                                                                                                                                                |
| ---------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository revision and preserved manifest                 | PASS            | Exact approved SHA; existing files unchanged.                                                                                                                                |
| Account plan/no payment/initial usage                      | OWNER CONFIRMED | Preserve Free selection; stop on any payment/hold/paid prompt. Pipeline and storage/branch/history headroom still need confirmation.                                         |
| Target database relation inventory                         | OWNER CONFIRMED | `neondb`, PostgreSQL 17.12, zero non-system relations and public functions; runtime role absent. Protected backup prerequisites still pending before initialization.         |
| Protected independent laptop backup                        | PARTIAL         | Owner verified restricted folder, available space and client tools. Pre-initialization archive/list/checksum pending; full recovery, second copy and encryption not claimed. |
| Laptop direct database connection                          | OWNER VERIFIED  | Read-only metadata returned neondb / 17.12; psql client reports TLSv1.3 / TLS_AES_256_GCM_SHA384 under explicit verify-full/channel binding.                                 |
| Restricted runtime role and permissions                    | NOT STARTED     | Inventory existing role first; reviewed grants after schema setup. Owner must never be the API runtime role.                                                                 |
| One Render Free service / compatible region / exact origin | NOT STARTED     | Avoid duplicate resources; verify Free and disabled auto-deploy/previews. Resolve exact HTTPS origin before successful app startup; do not guess it.                         |
| Hosted build/HTTPS/readiness/read-only/usage               | NOT TESTED      | Only after prerequisites and authorized read-only service setup. No polling keep-alive.                                                                                      |
| Public writes / launch                                     | NOT AUTHORIZED  | Remain disabled; separate independent review required.                                                                                                                       |

Ohio is the known Neon region, not a claim that Render offers the identical region. Inspect available Free Render regions later and choose an approved closest compatible region; external traffic and latency still matter.

## Owner step 1 — inspect the existing target without mutation

In the Neon console, select `maintainai-robotics-v1`, the production branch and the intended application database in **SQL Editor**. Do not use the Connect panel or share a connection string. Run only this read-only metadata transaction:

```sql
BEGIN READ ONLY;

SELECT current_database() AS selected_database;

SELECT c.relkind AS object_kind, count(*) AS object_count
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname <> 'information_schema'
  AND n.nspname !~ '^pg_'
GROUP BY c.relkind
ORDER BY c.relkind;

SELECT count(*) AS public_functions
FROM pg_catalog.pg_proc AS p
JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'public';

SELECT EXISTS (
  SELECT 1 FROM pg_catalog.pg_roles
  WHERE rolname = 'maintainai_runtime'
) AS runtime_role_exists;

COMMIT;
```

Return only the non-secret selected database name, object counts, public function count and runtime-role yes/no. Empty grouped results mean no matching relations were found; they do not prove a full database backup or complete absence of all possible database objects. Extension-provided objects may appear and require inspection, not deletion. If anything exists or the SQL errors, preserve it and inspect before initialization. Never run DROP, reset, migration or seed commands to make the inventory empty.

Subsequent steps will be provided individually after this result: remaining Free/storage/pipeline and protected backup prerequisites; pre-change archive and inventory review; approved schema/computed synthetic seed and idempotence checks; restricted role/password and runtime grants; exactly one read-only Render service at the reviewed revision; hosted validation/usage and completion report. No further owner action is requested yet.

## Execution/result boundary

No database was connected from this agent or initialized; no role, service, schema, seed, backup, payment or deployment was created. No API writes were enabled. No regression suites were repeated because production code is unchanged. Full Guided Demo diagnosis and confirmed ticket creation will remain blocked by the required hosted read-only mode; this limitation is already documented in [final hosting verification](PRE_B2_FINAL_HOSTING_VERIFICATION.md).

**Current result: TARGET RELATION INVENTORY OWNER-CONFIRMED; SETUP PENDING PROTECTED BACKUP PREREQUISITES. Public writes and release remain NO-GO.** This is a progress record, not a completed hosted deployment or final independent-review sign-off.

## Owner step 1 result and step 2 — installed backup clients

Owner verbally reported successful execution of the read-only transaction: `neondb`, public functions zero and runtime role false. “Runtime error exists F” is interpreted as the query's `runtime_role_exists = f`, not a reported runtime error. The relation result was not supplied explicitly; confirm zero result rows before any schema changes. These are owner-reported observations, not a connection made by this agent.

Next, in ordinary Windows PowerShell on the approved laptop, inspect installed PostgreSQL clients without installing, changing PATH, creating folders or connecting to a database:

```powershell
foreach ($tool in @('pg_dump', 'pg_restore', 'psql')) {
    $command = Get-Command $tool -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($command) {
        & $command.Source --version
    } else {
        Write-Output "$tool : not found on PATH"
    }
}

Get-ChildItem "$env:ProgramFiles\PostgreSQL" -Directory -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty Name
```

Reply with the tool/version output and any numbered PostgreSQL installation directories. No output from the last command simply means no directory was found at that standard installation location; a missing PATH command does not prove the tool is not installed elsewhere. No credentials, local records or full personal filesystem paths are needed. Backup-folder protection/capacity and the target server version will be checked before any backup or initialization command. No installation or configuration change is authorized by this inspection step.

## Owner step 2 result and step 3 — target version and explicit relation count

Owner supplied Windows PowerShell 5.1 output: `pg_dump`, `pg_restore` and `psql` were not found on PATH; the standard `Program Files\PostgreSQL` directory search returned no installation directories. This does not prove absence from every possible location. No client was installed and no PATH, application or database setting was changed. Protected backup capability remains pending.

Before proposing a specific compatible free client installation, obtain the target server version and resolve the ambiguous grouped inventory output with a count that always returns one row. In the same Neon project, production branch and intended database, run this SELECT only:

```sql
SELECT
  current_database() AS database_name,
  current_setting('server_version') AS postgres_version,
  (
    SELECT count(*)
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname <> 'information_schema'
      AND n.nspname !~ '^pg_'
  ) AS non_system_relations;
```

Return only those three fields. No credentials or connection strings are needed. The count includes non-system tables, views, indexes, sequences and other relations; it is not a complete inventory of every database object. A nonzero count triggers inspection, never deletion. No schema initialization proceeds until target inspection and protected backup prerequisites are satisfied. Any proposed substantial laptop installation will be concrete and separately presented for approval first.

## Owner step 3 result — PostgreSQL 17.12, zero relations

Owner supplied the one-row SQL result: database `neondb`, server `17.12 (14c6cec)`, `non_system_relations = 0`. This resolves the earlier ambiguous grouped query result. Together with the earlier public-functions count zero and runtime role false, no existing application relation or runtime role has been reported. This is owner-executed catalog evidence, not an agent-authenticated connection or a complete audit of every schema/extension/role. No initialization has been performed.

## Proposed owner step 4 — client-tools-only laptop installation (subsequently approved below)

Official sources checked November 17, 2026:

- [PostgreSQL Windows downloads](https://www.postgresql.org/download/windows/) links the EDB installer and binary archive distributions; the current release list includes 17.12.
- [EDB Windows installation documentation](https://www.enterprisedb.com/docs/supported-open-source/postgresql/installing/windows/) documents a separate **Command Line Tools** component including `psql`, `pg_dump` and `pg_restore`. The installer requires administrator privileges. PostgreSQL Server, pgAdmin and Stack Builder are separate selectable components.

Proposed change: use the free PostgreSQL **17.12 Windows x86-64 installer** reached through the official PostgreSQL page, install **Command Line Tools only**, and leave PostgreSQL Server, pgAdmin and Stack Builder unselected. Review the installer summary before installation; stop if server/data-directory/port/database-service setup is still requested. Do not modify existing application files or databases, start a local PostgreSQL server, change PATH, add paid software/accounts or accept billing. Use explicit tool paths afterward. Record actual versions and verify tools run before using any connection.

This is a proposed laptop software installation, not an action executed or approved in this step. The earlier instruction to request approval before substantial local environment changes is respected. Await owner confirmation before installation guidance proceeds. No claim is made that this installation alone supplies protected backup permissions/encryption/capacity or a tested restore; those prerequisites remain pending.

## Owner authorization and step 4 execution instructions

Owner explicitly authorized **only PostgreSQL 17.12 Command Line Tools**, excluding PostgreSQL Server, pgAdmin and Stack Builder, and required successful installation verification before proceeding. This resolves the installation-approval prerequisite; no additional permission is needed for this bounded component selection. Actual installation remains owner-executed and unverified.

1. Open the [EDB community PostgreSQL download page](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) linked by PostgreSQL's official Windows download page. Choose **17.12 → Windows x86-64**, not another major version or a paid EDB product. No payment or account enrollment is part of this step.
2. Run the official installer; use the standard `C:\Program Files\PostgreSQL\17` location unless an existing installation conflicts. At **Select Components**, keep **Command Line Tools** selected and clear **PostgreSQL Server**, **pgAdmin 4** and **Stack Builder**.
3. Review the final component summary and complete only this installation. Stop before installing if exclusions cannot be selected or server password, data-directory, port or service setup is requested. Do not launch Stack Builder, change PATH, overwrite an existing installation, install other components or alter the running application/databases.
4. In ordinary PowerShell, verify the installed binaries by explicit path:

```powershell
$pgTools = 'C:\Program Files\PostgreSQL\17\bin'
& "$pgTools\pg_dump.exe" --version
& "$pgTools\pg_restore.exe" --version
& "$pgTools\psql.exe" --version
```

All three commands should run successfully and report **17.12**. If the chosen installation directory differed, adjust only `$pgTools` to its `bin` directory. Return the three version lines or the error; no database connection/password is involved. Do not continue to backup, schema, seed or Render setup before verification. This progress record does not claim that any laptop installation has actually completed.

## Owner step 4 verification — all three clients execute as 17.12

Owner supplied PowerShell output from `C:\Program Files\PostgreSQL\17\bin`: `pg_dump (PostgreSQL) 17.12`, `pg_restore (PostgreSQL) 17.12`, and `psql (PostgreSQL) 17.12`. This verifies that the three installed client executables run and match the target major/minor version. It is not an independent audit of installer components or a successful database connection/backup. No PostgreSQL server, pgAdmin or Stack Builder installation was authorized. No next installation is required.

## Owner step 5 — fresh restricted backup directory

Use the same PowerShell window. Create one uniquely named backup directory under the current user's Local AppData, outside the application/SQLite directory. Restrict this new directory to the current operator's account and Windows SYSTEM; do not change ACLs on any existing directory. The explicit collision check and failing creation stop before any permission mutation if the path already exists. This uses the already-approved laptop backup destination and included Windows tools, without another installation.

```powershell
$backupDir = Join-Path $env:LOCALAPPDATA ('MaintainAI-B2-Backup-' + [guid]::NewGuid().ToString('N'))
if (Test-Path -LiteralPath $backupDir) { throw 'Folder already exists; stop.' }
New-Item -ItemType Directory -Path $backupDir -ErrorAction Stop | Out-Null
$backupSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
icacls.exe $backupDir /inheritance:r /grant:r ("*" + $backupSid + ":(OI)(CI)F") "*S-1-5-18:(OI)(CI)F" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Backup folder permissions failed; stop.' }
$backupAcl = Get-Acl -LiteralPath $backupDir -ErrorAction Stop
$backupRules = @($backupAcl.GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier]))
$otherRules = @($backupRules | Where-Object { $_.IdentityReference.Value -notin @($backupSid, 'S-1-5-18') })
[pscustomobject]@{
    InheritanceDisabled = $backupAcl.AreAccessRulesProtected
    AccessRuleCount = $backupRules.Count
    OtherAccountRules = $otherRules.Count
    FreeGB = [math]::Round((Get-Item -LiteralPath $backupDir).PSDrive.Free / 1GB, 2)
}
```

Expected access results: inheritance disabled True, two access rules, zero other-account rules. Return only this summary or any error; keep the full personal folder path private. Keep the PowerShell window open so `$backupDir` remains available for later backup commands. No dump or schema operation occurs in this step. These ACLs restrict ordinary filesystem access; they do not encrypt the archive, prevent privileged administrator override, or verify existing drive encryption. Drive protection/recovery handling and remaining provider headroom must still be settled before the first backup/initialization. Do not record this proposed directory as successfully created until the owner returns results.

## Owner step 5 result — restricted directory and available space

Owner supplied successful PowerShell results: `InheritanceDisabled=True`, `AccessRuleCount=2`, `OtherAccountRules=0`, `FreeGB=298.59`; no `icacls` error was reported. The fresh directory remains in the owner's `$backupDir` variable; its private path was not requested or recorded. This verifies the planned directory-access and capacity checks, not archive creation, drive encryption, a second copy or recovery. The runbook requires protected storage; these ACLs provide its filesystem-access restriction without claiming encryption. Encryption remains an evidence limitation, not a silently added requirement to activate or buy disk encryption. No dump, database/schema initialization or Render setup has occurred.

## Owner step 6 — direct, certificate-verified read-only connection

Use Neon **Connect** for the existing project, production branch, `neondb` and its owner role. Turn **Connection pooling off** for the operator connection. Read the hostname and role fields locally; never send the password/connection string to chat. Keep `$backupDir` and `$pgTools` in the current PowerShell session.

```powershell
$neonDirectHost = (Read-Host 'Direct Neon hostname only (pooling OFF)').Trim()
$neonOwnerRole = (Read-Host 'Owner role shown in Neon').Trim()
if ($neonDirectHost -notmatch '^[A-Za-z0-9.-]+\.neon\.tech$' -or $neonDirectHost -match '-pooler\.') {
    throw 'Use only the direct Neon hostname, not a connection string or pooler.'
}
& "$pgTools\psql.exe" -X --set=ON_ERROR_STOP=1 --pset=pager=off --host=$neonDirectHost --port=5432 --username=$neonOwnerRole --dbname='dbname=neondb sslmode=verify-full sslrootcert=system channel_binding=require' --password --command="SELECT current_database() AS database_name, current_setting('server_version') AS postgres_version, ssl AS tls FROM pg_stat_ssl WHERE pid = pg_backend_pid();"
if ($LASTEXITCODE -ne 0) { throw 'Connection verification failed; stop.' }
```

Enter the database password only at `psql`'s hidden terminal prompt. This command uses no password in arguments, history or Git, bypasses local `psqlrc`, and executes only a SELECT. It may wake the Free compute and consume a small amount of allowance. A successful connection is required before a backup command; the original expected metadata was `neondb`, PostgreSQL 17.12 and `tls=t`; the later successful `tls=f` result below corrects the use of this database-side field as a client TLS criterion. Explicit verify-full/system-root/channel-binding parameters follow the reviewed runbook. Windows trust-store/client behavior is being tested, not assumed; stop on any CA, hostname, channel-binding or other connection error without weakening TLS. Return only the three non-secret result fields, or error text with hostnames/roles/connection details redacted. No schema changes are requested.

## Owner step 6 result — Windows certificate validation blocker

Owner reported three failed `psql` attempts to the direct Neon endpoint with `sslmode=verify-full sslrootcert=system channel_binding=require`: TCP resolution/connection reached the named host, then `SSL error: certificate verify failed`. The explicit failure guard also fired. No successful authenticated connection or SQL execution is established by these attempts; this error does not establish a wrong password. Do not repeat the unchanged command or weaken verification. No password or full secret URL was supplied to this task; the endpoint/role identifiers are omitted from this report.

Official sources checked November 17, 2026:

- [PostgreSQL 17 sslrootcert behavior](https://www.postgresql.org/docs/17/libpq-connect.html#LIBPQ-CONNECT-SSLROOTCERT): `system` loads the SSL implementation's trusted roots; their location depends on build/platform, not necessarily the Windows certificate store.
- [PostgreSQL Windows EDB report](https://www.postgresql.org/message-id/422884FC-F4B0-404E-9F58-E4CF7757B416@mackerron.co.uk): EDB PostgreSQL 17 on Windows reproduces this error with missing OpenSSL CA roots; a curl/Mozilla CA bundle resolves that reported instance. This is relevant primary-source troubleshooting, not proof of this laptop's exact cause.
- [curl CA Extract](https://curl.se/docs/caextract.html) publishes a Mozilla-derived PEM bundle and SHA-256 file over HTTPS. A same-publisher checksum verifies download consistency, not an independent signature. The extracted bundle is not claimed to reproduce all browser-specific trust constraints.

### Step 6A — verified scoped CA bundle and one read-only retry

Use existing Windows/PowerShell tools to download public CA data into a uniquely named file within the verified restricted backup directory. No software, global root store, OpenSSL configuration, server/database setting or paid resource is installed/changed. HTTPS validation remains enabled for downloads. Keep full certificate and hostname verification plus channel binding for Neon. The temporary libpq environment setting is restored in `finally`; no password environment variable or `setx` is used.

Run the entire block once in the existing PowerShell session:

```powershell
$previousCa = $env:PGSSLROOTCERT
$previousTls = [Net.ServicePointManager]::SecurityProtocol
try {
    if (-not $backupDir -or -not $pgTools -or -not $neonDirectHost -or -not $neonOwnerRole) {
        throw 'Required session variables are missing; stop.'
    }
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $neonCaFile = Join-Path $backupDir ('mozilla-ca-' + [guid]::NewGuid().ToString('N') + '.pem')
    if (Test-Path -LiteralPath $neonCaFile) { throw 'CA file already exists; stop.' }
    Invoke-WebRequest -UseBasicParsing -Uri 'https://curl.se/ca/cacert.pem' -OutFile $neonCaFile -TimeoutSec 30 -ErrorAction Stop
    Invoke-WebRequest -UseBasicParsing -Uri 'https://curl.se/ca/cacert.pem.sha256' -OutFile "$neonCaFile.sha256" -TimeoutSec 30 -ErrorAction Stop
    $expectedHash = [regex]::Match((Get-Content -LiteralPath "$neonCaFile.sha256" -Raw), '(?i)\b[0-9a-f]{64}\b').Value
    $neonCaSha256 = (Get-FileHash -LiteralPath $neonCaFile -Algorithm SHA256 -ErrorAction Stop).Hash
    if (-not $expectedHash -or $neonCaSha256 -ne $expectedHash) {
        throw 'CA checksum verification failed; stop.'
    }
    Write-Output 'CA checksum verified.'
    $env:PGSSLROOTCERT = $neonCaFile
    & "$pgTools\psql.exe" -X --set=ON_ERROR_STOP=1 --pset=pager=off --host=$neonDirectHost --port=5432 --username=$neonOwnerRole --dbname='dbname=neondb sslmode=verify-full channel_binding=require connect_timeout=15' --password --command="SELECT current_database() AS database_name, current_setting('server_version') AS postgres_version, ssl AS tls FROM pg_stat_ssl WHERE pid = pg_backend_pid();"
    if ($LASTEXITCODE -ne 0) { throw 'Verified connection failed; stop.' }
}
finally {
    $env:PGSSLROOTCERT = $previousCa
    [Net.ServicePointManager]::SecurityProtocol = $previousTls
}
```

The connection omits the old explicit `sslrootcert=system` so libpq reads the scoped verified PEM path; environment handling avoids path quoting/escaping issues in connection strings. The .NET TLS 1.2 selection applies only to this PowerShell process's HTTPS downloads and is restored afterward. Password entry remains at the hidden `psql` terminal prompt. Return only checksum-success status plus the database/version/TLS row, or redacted error text. If download/hash or connection verification still fails, stop to inspect the specific trust/clock/issuer/network issue rather than accepting the presented leaf certificate or disabling verification. No schema, seed or backup command is included. A later `pg_dump` must repeat scoped CA selection and verify the retained file hash, because `finally` restores the prior environment.

**Checkpoint before owner retry result: native Windows certificate-verified Neon connectivity was not yet demonstrated.** The subsequent result and client-side verification follow below. No backup, initialization, role creation, Render service or deployment has been performed. Public writes and release remain NO-GO.

## Owner step 6A result — successful query; backend SSL field is not a client TLS gate

Owner returned a successful `psql` row: `database_name=neondb`, `postgres_version=17.12 (14c6cec)`, `tls=f`, one row. This establishes owner-reported authenticated query success, but the submitted output did not include the checksum-success line or client connection details. Do not claim an independently inspected CA file or measured TLS protocol/cipher from this row.

Correction to earlier guidance: expecting `pg_stat_ssl.ssl=t` as definitive proof of this laptop's TLS connection was inappropriate for a proxied service. [PostgreSQL statistics](https://www.postgresql.org/docs/17/monitoring-stats.html#MONITORING-PG-STAT-SSL-VIEW) describe the backend connection; [Neon security documentation](https://neon.com/docs/security/security-overview) identifies the proxy in front of Postgres and requires TLS for Internet connections. A false database-side value is consistent with a separate proxy-to-compute leg; it does not prove an unencrypted laptop-to-provider connection. This audit has not independently observed the provider's internal network or TLS termination. Verify the actual client connection directly rather than changing provider settings or weakening TLS.

### Step 6B — psql client connection information

Retain the verified local CA and recheck its hash against the value held from step 6A. Reconnect with explicit `verify-full` and required channel binding, and ask the client for `\conninfo` rather than querying backend SSL statistics. This is a psql metadata command and does not modify the database. [psql connection information](https://www.postgresql.org/docs/17/app-psql.html#APP-PSQL-META-COMMAND-CONNINFO) is the appropriate client-side check.

```powershell
$previousCa = $env:PGSSLROOTCERT
try {
    if (-not $neonCaFile -or -not $neonCaSha256 -or -not $pgTools -or -not $neonDirectHost -or -not $neonOwnerRole) {
        throw 'Required session variables are missing; stop.'
    }
    $currentCaHash = (Get-FileHash -LiteralPath $neonCaFile -Algorithm SHA256 -ErrorAction Stop).Hash
    if ($currentCaHash -ne $neonCaSha256) { throw 'CA file changed; stop.' }
    $env:PGSSLROOTCERT = $neonCaFile
    & "$pgTools\psql.exe" -X --set=ON_ERROR_STOP=1 --pset=pager=off --host=$neonDirectHost --port=5432 --username=$neonOwnerRole --dbname='dbname=neondb sslmode=verify-full channel_binding=require connect_timeout=15' --password --command='\conninfo'
    if ($LASTEXITCODE -ne 0) { throw 'Client connection check failed; stop.' }
}
finally {
    $env:PGSSLROOTCERT = $previousCa
}
```

Enter the database password only at the hidden terminal prompt. Return only the `SSL connection` line containing protocol and cipher (TLS 1.2 or 1.3 expected), or a redacted error; no full hostname, user identifier, password or secret connection string is requested. If SSL information is missing, do not label the TLS check passed. The explicit client verification options remain in force; no fallback, global setting, backup, schema/seed, runtime role, Render service or deployment is performed in this step.

**Checkpoint before step 6B result: authenticated read-only query owner-reported successful; client TLS details were pending before backup. Public writes and release remained NO-GO.**

## Owner step 6B result — client TLS 1.3 confirmed

Owner returned the `psql` client line: `SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off, ALPN: postgresql)`. Together with the supplied command's explicit `verify-full` and required channel binding, verified retained CA hash, successful exit guard and prior database/version query, this is owner-executed evidence of a certificate/hostname-verified laptop-to-Neon connection. It does not establish the provider's internal-hop policy, a complete backup or a hosted Render connection. No credentials, full endpoint or personal file paths are recorded.

## Owner step 7 — pre-initialization custom archive and local checks

Prerequisites now observed: owner-approved laptop, restricted new directory, 298.59 GB free at its check, matching 17.12 client tools, empty target relation inventory and successful verified client connection. Use the existing session variables and retain scoped CA selection. This step reads Neon and creates new local archive/metadata files only; it does not initialize schema/seed, restore into any database, create roles/resources or enable public API writes.

```powershell
$previousCa = $env:PGSSLROOTCERT
try {
    if (-not $backupDir -or -not $pgTools -or -not $neonCaFile -or -not $neonCaSha256 -or -not $neonDirectHost -or -not $neonOwnerRole) {
        throw 'Required session variables are missing; stop.'
    }
    $currentCaHash = (Get-FileHash -LiteralPath $neonCaFile -Algorithm SHA256 -ErrorAction Stop).Hash
    if ($currentCaHash -ne $neonCaSha256) { throw 'CA file changed; stop.' }
    $initialBackup = Join-Path $backupDir ('pre-initialization-' + [guid]::NewGuid().ToString('N') + '.dump')
    foreach ($path in @($initialBackup, "$initialBackup.list.txt", "$initialBackup.sha256", "$initialBackup.metadata.json")) {
        if (Test-Path -LiteralPath $path) { throw 'Backup output already exists; stop.' }
    }
    $env:PGSSLROOTCERT = $neonCaFile
    & "$pgTools\pg_dump.exe" --host=$neonDirectHost --port=5432 --username=$neonOwnerRole --dbname='dbname=neondb sslmode=verify-full channel_binding=require connect_timeout=15' --password --format=custom --no-owner --file=$initialBackup
    if ($LASTEXITCODE -ne 0) { throw 'Backup failed; stop. Any partial file is not verified.' }
    $archiveInfo = Get-Item -LiteralPath $initialBackup -ErrorAction Stop
    if ($archiveInfo.Length -le 0) { throw 'Backup file is empty; stop.' }
    & "$pgTools\pg_restore.exe" --list --file="$initialBackup.list.txt" $initialBackup
    if ($LASTEXITCODE -ne 0) { throw 'Archive listing failed; stop.' }
    $listInfo = Get-Item -LiteralPath "$initialBackup.list.txt" -ErrorAction Stop
    if ($listInfo.Length -le 0) { throw 'Archive listing is empty; stop.' }
    $initialBackupHash = (Get-FileHash -LiteralPath $initialBackup -Algorithm SHA256 -ErrorAction Stop).Hash
    Set-Content -LiteralPath "$initialBackup.sha256" -Encoding ASCII -Value ($initialBackupHash + '  ' + [IO.Path]::GetFileName($initialBackup)) -ErrorAction Stop
    [ordered]@{
        phase = 'pre-initialization'
        database = 'neondb'
        observed_server_version = '17.12 (14c6cec)'
        approved_commit = 'f4cbad8565cd4ca3c8da617783b53f62900f6ee4'
        schema_state = 'pre-application-initialization'
        created_at = (Get-Date).ToString('o')
        archive_bytes = $archiveInfo.Length
        sha256 = $initialBackupHash
    } | ConvertTo-Json | Set-Content -LiteralPath "$initialBackup.metadata.json" -Encoding UTF8 -ErrorAction Stop
    [pscustomobject]@{
        BackupCreated = $true
        BackupBytes = $archiveInfo.Length
        SHA256 = $initialBackupHash
        ArchiveListPassed = $true
    } | Format-List
}
finally {
    $env:PGSSLROOTCERT = $previousCa
}
```

Enter the password only at `pg_dump`'s hidden prompt. Return only the final summary or redacted error; keep the archive, list and full paths local/private, and keep this PowerShell window open. No existing file is overwritten or deleted; failures retain any new partial files as unverified. SHA-256 records archive identity; a successful table-of-contents listing is not a full-data or fresh-destination recovery test. Actual recovery remains pending. The archive can contain ownership/grant metadata: `pg_dump --no-owner` is ignored for custom archives, so any future authorized restore must explicitly pass `pg_restore --no-owner` as the runbook requires. No passwords/global-role dump is requested.

This is the reviewed runbook's initial archive process translated to the already-approved Windows tools, not production code or an architecture change. Actual archive creation remains pending owner output. Public writes and release remain NO-GO; do not proceed to initialization until this result is checked.

## Owner step 7 result — pre-initialization archive created

Owner returned:

```text
BackupCreated     : True
BackupBytes       : 1678
SHA256            : 5F462522A4C6EE80C9A6AE020F6F12DB1C1B709FB55CD835E6083E50A6541CCE
ArchiveListPassed : True
```

This is owner-executed evidence that a custom archive was created in the restricted laptop folder and its table of contents was readable. The SHA-256 identifies the exact archive. The small size is consistent with the earlier zero-application-relation inventory, but size alone proves neither contents nor recoverability. A full fresh-destination restore remains untested. Keep the archive/list/checksum/metadata private; do not replace it with a provider snapshot. No schema/seed or Render changes were reported in this step.

### Preparing faithful Windows operator initialization

The runbook's `python -m postgres.local` applies the approved SQL migration and calls the existing computed seed initializer. The owner has only approved PostgreSQL client tools, so a reviewed temporary psql artifact can carry those same migration bytes and captured initializer statements without installing Python/dependencies on the laptop or touching its running application. This is a transport adaptation for the authorized operator action, not a new application migration path. The diagnosis must be computed by the existing backend functions, never manually rewritten.

Artifact preparation and focused disposable-cloud verification are in progress. It must lock consistently, refuse an unexpected/nonempty target before installing, reject unsupported schemas, preserve all data, run atomically, and demonstrate an idempotent repeat on the initial synthetic dataset. Do not execute a candidate until its source equivalence, guards, exact hash and verification are recorded. Public API writes remain disabled; no Render provisioning or database initialization is yet claimed.

## Step 8 preparation — reviewed initialization artifact ready for owner execution

Prepared [B2_INITIALIZE.sql](evidence/b2/B2_INITIALIZE.sql) with [source provenance](evidence/b2/operator-initialization-source.json) and [focused validation](evidence/b2/operator-initialization-validation.json). The SQL is **20,834 bytes**, SHA-256 **`70ce5df9880e1d827c5db1420c9aded515be5c856aa3e2137d7a922b8db61f94`**. Its original migration is byte-identical to baseline (`805df91e03a227cbb487d1cbdfcb9a05a1705858ac08e6954c791aaa8de101b2`); all 24 values across the five native initializer statements were independently compared with the unchanged source. Seed diagnosis `D-b72ecee0befca3b36c6c9ad9` stores exactly 4,468 UTF-8 bytes, SHA-256 `c37067b9c3f3a27e8aeda4af51901bf08591e24c3298c5ec3df32ecda857a03d`. No diagnostic value was invented or manually rewritten.

Focused new-artifact validation: **8 PASS, 0 FAIL** on cloud PostgreSQL **17.11 (Debian 17.11-1.pgdg12+2)** using the existing project's pinned PostgreSQL 17 image. This is not a Neon/Windows execution claim. A newly created container had no external network or published ports, tmpfs data and no user-mounted volume. It was removed after checks; no existing container/data was touched. Checks covered fresh initialization and exact computed seed; idempotent records across all nine table fingerprints; unsupported-version refusal; wrong database refusal; existing-relation/data preservation; existing-public-function preservation; full transactional DDL/seed rollback on an injected failure; and unchanged operator artifact hash. Existing full application regressions were not repeated because no production files changed.

Independent source review found no execution-blocking issue for this verified-empty target. The packet is specific to database `neondb`, PostgreSQL major 17, supported schema v1 and the pristine initial seed. Its repeated run intentionally aborts after real usage adds records/counters. It is not a general repair/migration script. Although migration definitions contain the approved FK/trigger DELETE semantics, no destructive DELETE/DROP/TRUNCATE/reset statement is executed. Preserve the original restricted role script unchanged for the later role step.

Owner handoff uses a documentation-only commit on the existing setup branch to make exact file bytes downloadable from GitHub; no main merge or production change is authorized. The native source-chat file viewer was unavailable, so no successful local file-panel download is claimed. Only this progress report and the three operator-evidence files are included in that packet. The deployed application must still use the approved baseline `f4cbad8565cd4ca3c8da617783b53f62900f6ee4`; the operator-evidence commit is not a new application release.

### Owner execution prerequisites and expected output

Use the existing PowerShell session and the same verified Neon project/production-branch owner endpoint. The artifact cannot independently identify provider project/branch solely from the database name. Download the exact commit-pinned SQL into a new file under `$backupDir`; verify its expected SHA-256 before execution, recheck the initial archive against `5F462522A4C6EE80C9A6AE020F6F12DB1C1B709FB55CD835E6083E50A6541CCE`, and recheck the retained CA hash. Invoke `psql -X --set=ON_ERROR_STOP=1 --file=<verified-file>` with explicit `verify-full`, required channel binding, scoped `PGSSLROOTCERT` and a hidden password prompt. No command may weaken TLS or point at existing laptop SQLite records.

This authorized operator operation will create the reviewed schema and computed historical synthetic seed atomically, with an advisory lock and refusal guards. It does not create the runtime role, change provider billing, create Render resources, enable API writes or approve public launch. No additional laptop installation is required. This is a psql file; do not paste its meta-commands into Neon's SQL Editor.

Expected committed results:

| Table                   | Rows |
| ----------------------- | ---- |
| postgres_schema         | 1    |
| equipment               | 2    |
| diagnoses               | 1    |
| tickets                 | 1    |
| ticket_history          | 2    |
| equipment_ticket_counts | 2    |
| request_budgets         | 0    |
| snapshot_manifests      | 0    |
| snapshot_chunks         | 0    |

The script prints these counts and the exact diagnosis digest plus `T-SEED-001 / Resolved / version 1`, followed by `COMMIT`. Only a successful psql exit and COMMIT allow calling initialization complete. Request only count/reference output or a redacted error, never credentials or dumps. The immediate pristine-state repeat and a fresh independent read-back will follow once initial success is reported.

**Current result: pre-initialization archive/list/checksum OWNER VERIFIED; initialization packet validated in disposable cloud and ready. Actual Neon initialization, runtime role, Render build/deployment and full recovery remain pending. Public writes and release remain NO-GO.**
