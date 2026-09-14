# Contributing

Contributions and suggestions are welcome.

This repository is primarily a portfolio project focused on financial modeling, analytics and workflow automation. Changes should preserve reproducibility and make assumptions explicit.

## Guidelines

- Keep financial formulas documented.
- Separate configuration from calculation logic whenever possible.
- Never commit credentials, tokens or private spreadsheet IDs.
- Add or update tests when changing calculation logic.
- Document any new assumption that can materially affect results.
- Prefer small, focused commits.

## Commit style

```text
feat: add SAC amortization engine
fix: correct effective monthly rate conversion
refactor: isolate Monte Carlo logic
docs: document tax assumptions
test: add break-even rate scenarios
```
