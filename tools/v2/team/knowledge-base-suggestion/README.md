# Knowledge Base Suggestion

Folder-local architecture contract for the V2 Knowledge Base Suggestion team tool.
The tool will rank relevant internal documentation for a normalized mail context,
but this issue does not implement or integrate that behavior.

## Status

- Release tier: V2 later-release tool
- Audience: Team
- Integration status: Isolated and not mounted in the main application
- Owned path: `tools/v2/team/knowledge-base-suggestion/`

## Documents

- [Architecture](ARCHITECTURE.md) defines module responsibilities and dependency
  direction.
- [Specification](specs.md) defines the future tool contract and non-goals.
- [Data ownership](docs/data-ownership.md) defines mail, article, and suggestion
  data boundaries.
- [Integration constraints](docs/integration-constraints.md) defines allowed and
  forbidden dependencies.
- [Test plan](tests/test-plan.md) defines future contract-level coverage.

All future work for this tool must remain inside this directory until a separate
integration issue explicitly authorizes changes elsewhere.
