# Foundation Fix v4.1 QA

- JSON syntax: PASS
- YAML syntax: PASS
- Backend TS config migrated away from node10: PASS
- Deprecated backend baseUrl removed: PASS
- Backend rootDir set: PASS
- Node types configured: PASS
- Contracts package build added: PASS
- Root dev filter removed: PASS
- Web build no longer uses problematic `tsc -b`: PASS
- pnpm blocked build is explicitly denied: PASS

Runtime compilation must be re-run on the team machine after applying this patch.
