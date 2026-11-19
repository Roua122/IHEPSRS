# TASK-HRD-003 — Performance/capacity verification

Baseline reference: NFR-001 (UI P95 ≤ 3s), NFR-002 (standard internal API P95 ≤ 1.5s), NFR-003 (capacity design assumptions), NFR-004 (2,000 concurrent, horizontal scale to 5,000), NFR-005 (99.5% monthly availability), NFR-006 (external failure isolation), NFR-007 (configurable new institution).

These targets **cannot be certified by this standalone in-memory demo**. An actual performance verification requires an agreed load profile, deployed integrated API, reproducible dataset, load tool, API-gateway and browser measurements, P95, error rate, concurrency and environment specification. Record measurements and pass/fail separately; do not treat a single laptop response as proof of production capacity. The included 8 automated tests verify functional behavior, not the national-scale capacity goals.
