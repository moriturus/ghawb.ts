# Security Policy

## Supported Versions

Only the latest release is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| Older   | :x:                |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

To report a vulnerability, open a GitHub Security Advisory:

> <https://github.com/moriturus/ghawb.ts/security/advisories/new>

The maintainer will acknowledge reports within **7 days** and provide an initial assessment within **14 days**.

## Scope

This project generates YAML workflow files — it does not execute them. The following guidelines clarify what is considered in scope:

- **In scope:** security concerns about generated workflow content, such as expression injection risks or unsafe patterns in rendered YAML.
- **Out of scope:** GitHub Actions runtime security, which is GitHub's responsibility.
