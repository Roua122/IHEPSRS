# ADR-002 — Architecture Style

Status: Accepted  
Date: 2026-10-01

## Context
The Analysis Baseline defines clear domains and external-system integration, but leaves
the physical application style to Design.

A 7-member academic team needs a structure that:
- demonstrates architecture/integration,
- supports parallel development,
- avoids operational complexity that does not add academic value.

## Decision

### Central IHEPSRS
Use a **Modular Monolith**.

Logical modules include:
- identity
- institutions
- programs
- persons/students
- postgraduate
- enrollments
- theses
- research
- publications
- integrations
- documents
- notifications
- audit
- reporting

### External Simulation
`Mock University SIS` is a **separate application/service**.

This gives the project a real integration boundary:

`Mock University SIS → REST Contract → IHEPSRS`

### Communication
- In-process calls between central modules where appropriate.
- REST for external integration.
- Events/worker patterns can be introduced only where the Prototype requires them.

## Why not Microservices now?
Microservices would add deployment, networking, observability, distributed transactions,
service discovery and local-environment overhead. Those costs are not necessary to prove
the project's core integration architecture.

## Future
A module may later be extracted into an independent service if Design evidence justifies it.
No extraction may change business semantics.
