# Skill evaluation and maintenance

Note (2026-10-23): the creative-direction revision this folder evaluates rewrote `SKILL.md` into an abstract 75-line router and cut about 870 lines of production evidence; that version is preserved whole on the branch `codex-creative-direction-2026-10-22`. The `v2` line kept the concrete router and took the revision's new references (`creative-direction.md`, `shot-design.md`, `motion-language.md`, `reference-atlas.md`, `taste-review.md`) as additions. `report.md` below describes the preserved branch.

This directory is maintainer material, outside the runtime skill bundle. The skill itself routes production tasks; it does not load its own authoring history.

## Authoring sources

Read on 2026-10-22:

- [Anthropic: The Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf): concrete use cases, focused description, progressive disclosure, functional checks and baseline comparisons.
- [Anthropic: Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices): concise instructions, degrees of freedom matched to the task, direct reference links, tables of contents for long references and representative evaluations.

Application: a compact entry point; high freedom for art direction; precise rules for identity, timing coordinates and evidence; conditional references; scoped examples and comparisons. Client history stays in client projects. Public sources and their evidence limits live in the reference atlas. No downloaded source media is bundled.

## Representative cases

`cases.json` contains three synthetic planning requests: finance clarity, expressive collaboration and a constrained revision. `baseline.json` records the frozen commit used for comparison. `baseline-responses.md` and `revised-responses.md` preserve independently generated responses. These were separate Codex agents explicitly given the skill, not Claude runtime or automatic-trigger tests.

Assess the same criteria in each response:

1. Supported product behavior and truthful object identity.
2. Specific visual argument and materially different feasible treatments where direction is open.
3. Attention, reading hold, meaningful motion and timing authority.
4. Respect for locked choices, time budget and requested planning-only scope.
5. Honest evidence limits and a concrete, appropriately sized next test.

Compare the responses, not the number of stylistic rules repeated. Distinct products should receive different visual mechanisms. A useful regression case must also cover a small revision that should not trigger a redesign.

## Repeating the evaluation in Claude

Use a clean temporary project for each run. Give the same case and raw inputs to the baseline and revised skill separately, without this rubric or the other response. Record model/version, date, tools, instructions, output, time and cost. Use `trigger-cases.json` separately to test natural selection without explicitly naming the skill. Those cases have not yet been run in Claude.

For a visual effectiveness test, use a coherent synthetic UI asset set, fixed approved claims, duration and licensed track. Build the same short sequence under both skills. Review at full size and normal speed, optionally blind. Ask what a viewer understood and remembered before naming the intended improvement. Separate technical completion, subjective preference and any measured audience result.

## Local functional checks

From the repository root:

```bash
python3 -m unittest discover -s tests
bash skills/saas-product-demo-video/scripts/verify-scaffold.sh --render
bash -n build.sh
git diff --check
./build.sh
```

The scaffold verifier installs dependencies in a temporary directory. Inspect its returned still. Validate the real frontmatter against Anthropic's supported fields, check that all references are reachable and local links resolve, and scan the packaged bundle for client data and local machine paths. The older Codex `quick_validate.py` rejects Anthropic's supported `compatibility` field; do not remove valid Claude metadata merely to satisfy that older allowlist.

See `report.md` for this revision's observed results and limits. Before release, review the diff and run the relevant Claude and rendered-sequence tests. A locally built archive is not a published release.
