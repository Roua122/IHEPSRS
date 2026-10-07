# Security Architecture — Analysis-Derived

## Access Model
`Access Decision = Authenticated User + Role + Institution/Data Scope + Resource + Action + Record State.`

## Threat Model
| Threat Actor | سيناريو | الأصل/الأثر | Controls المطلوبة |
| --- | --- | --- | --- |
| External attacker | Credential stuffing / session theft | Accounts/Data disclosure | MFA، lockout/rate limit، secure cookies، session revoke، monitoring |
| Malicious/compromised integration | Cross-tenant write / forged event / replay | Student/registry integrity | System identity، institution scope، mTLS/OAuth2، signature/nonces/time window، messageId |
| Authorized insider | Excessive read/export / unauthorized change | Privacy/academic integrity | Least privilege، state-aware authorization، export limits، audit read/change، segregation |
| Web attacker | XSS/CSRF/Injection/SSRF | Account/data/server compromise | Encoding، anti-CSRF، parameterized queries، SSRF egress allowlist، validation |
| Malicious file uploader | Malware/polyglot/archive bomb | Repository/users | MIME/content scan، malware sandbox، size/decompression limits، quarantine |
| Attacker with leaked secret | API abuse | Integration integrity | Secret rotation≤90d، immediate revoke, per-source rate limits, incident response |
| Data tampering actor | Alter audit/approved record | Non-repudiation | Immutable versions، hash/tamper-evident audit، approval workflows |
| Availability attacker/failure | Flood/queue exhaustion/external outage | Service availability | Rate limit، queues/bulkheads، circuit breaker، backpressure، DR |

## Security Baseline
| المجال | Baseline قابل للاختبار |
| --- | --- |
| Encryption in transit | TLS 1.2+؛ منع clear-text protocols للبيانات الحساسة. |
| Encryption at rest | DB/backups/object storage الحساسة مشفرة بمفتاح منفصل. |
| Key/Secret management | Secrets خارج DB؛ rotation tracked؛ compromised key revoked immediately؛ access audited. |
| Session | Admin idle 15m/max 8h؛ users idle 30m/max 12h؛ re-auth sensitive; secure/httpOnly/SameSite cookies إن استخدمت. |
| Local auth | MFA؛ password≥12؛ breached/common password screening؛ temp lock after 5 failures/15m. |
| Web security | CSRF tokens/defense، output encoding/CSP عند التصميم، parameterized DB access، SSRF egress control، safe redirects. |
| API authorization | Authentication + scopes + institution/data scope + record state on every request؛ deny by default. |
| File upload | MIME/content validation، malware scan، checksum، quarantine، no executable serving، separate download authorization. |
| Incident handling | Critical alert→triage→contain→revoke→recover→postmortem؛ evidence preserved. |
| Vulnerability mgmt | SAST/SCA each build؛ DAST pre-release؛ pen test pre-production/major change؛ remediation SLAs from NFR-034. |
| Security monitoring | Authentication anomalies، scope violations، secret misuse، malware findings، privilege changes، bulk export alerts. |

## Monitoring
| Signal | Metric/Log | Baseline Alert |
| --- | --- | --- |
| Traffic | request_rate, integration_messages_received | Deviation >2x 7-day baseline for 15m on sensitive endpoints → warning |
| Errors | HTTP 5xx, INT failures, security denials | 5xx >2% for 5m → high; auth failures spike >3x baseline → security alert |
| Latency | P50/P95/P99 UI/API/integration | P95 > target for 10m → warning; 20m → high |
| Queue | queue_depth/oldest_message_age | oldest event message >15m or queue >10K → high |
| Retry | retry_rate | >5% messages in 15m → warning |
| Quarantine | quarantine_count | >100 open OR >1% of received in 15m → high |
| Freshness | now-last_successful_sync | event source >15m; daily batch >26h → warning/high |
| Storage | DB/object utilization | >75% warning؛ >85% high |
| Logs | Application/Security/Audit/Integration | separate streams, correlationId, PII minimization, retention by class |

## Physical design pending
Specific IAM/KMS/WAF/SIEM products are Design Decisions subject to these controls.
