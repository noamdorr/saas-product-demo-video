# Creative-direction revision validation

Date: 2026-10-22. Baseline: `d69daf72de401cfd3daacfab451441c130718634`. No private project assets or research dossier were copied into the skill.

## Independent planning comparison

Separate Codex agents applied the frozen and revised skills to the same three synthetic requests, without seeing each other's response or the scoring rubric. Each response stayed under 550 words. This checks instruction behavior at planning time; it does not establish Claude behavior, automatic triggering or finished-video quality.

| Case | Baseline observation | Revised observation |
|---|---|---|
| Finance | Produced sound alternatives and truthful identity handling, but carried a mandatory-looking text reveal and camera drift into the plan; treated soundtrack/reference selection as production prerequisites | Explicitly separated operator action from automatic reconciliation, used stationary type and a real reading hold, and allowed a silent checkpoint |
| Collaboration | Already produced an appropriate simultaneous-drawing concept and respected the quiet phrase | Assigned motion roles to the marks, distinguished illustration from real controls and preserved quiet; proposed a longer rough checkpoint to include the late musical payoff |
| Bounded revision | Already preserved the accepted master and rejected a false same-record match | Retained those strengths and explicitly identified the case where locked copy would make the mismatch impossible to repair visually |

The new instructions reduced prescription conflicts; they did not invent all the good behavior in the baseline. The longer collaboration checkpoint is a tradeoff to assess in actual production, not automatically an improvement.

The independent evaluator identified three residual tensions: soundtrack listed as mandatory in a fallback checklist, duration subordinated to music and compulsory delegated review. These were corrected in the relevant references. The remainder of the skill was also checked for opposing mandatory backbeat, text and camera rules.

## Functional and structural evidence

- Anthropic-compatible YAML fields, name and length constraints: passed.
- Main entry point: 75 lines, 1,105 words at validation; 27 reference files directly discoverable.
- Local Markdown file links: resolved. Long-reference contents lists exclude headings in code examples.
- Explicit private-project identifiers and local machine paths: absent from the runtime skill scan.
- Existing offline wrapper tests: 4 passed.
- Scaffold plus all optional components: dependency installation and TypeScript check passed in an isolated temporary workspace; example still rendered successfully.
- Build shell syntax and Git whitespace checks: passed.
- Legacy Codex validator: passed on a temporary metadata view omitting only its unsupported `compatibility` field. The actual field was retained and checked against Anthropic's documented requirements.

Package integrity: ZIP CRC check passed; all 81 packaged files match the current source byte for byte, with no cache files or client markers. Archive size: 208,058 bytes. SHA-256: `9264a2a31017e4d6e90ed029e4ca65ef155c745c545abfbad340f5715ef4da78`.

The [scaffold still](scaffold-check.png) was visually inspected: the example headline, labels and button render legibly within frame, with the cursor at the button. This is an implementation smoke check, not an example of the new creative method.

## Remaining evidence boundary

No automatic Claude trigger test, Claude model comparison, full generated product film, music listening test or human preference study was performed. The new guidance is ready for use and further evaluation, not a guarantee of a premium result. Nothing was pushed or published.
