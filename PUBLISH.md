# Publishing a release

A checklist for the maintainer. Nothing here runs on its own. Every command is
meant to be read, then run from the main checkout of the repo (not a worktree).

## Why squash, not merge or fast-forward

The `v2` branch was built in private. Its commit messages reference the
productions it was built on, by name, which the files never do. A plain
`git merge` or a fast-forward would push every one of those messages to the
public repo. A squash merge lands the tree as one commit with one clean
message, and the `v2` branch itself is never pushed.

`main` also carries one commit `v2` did not start from (the Claude Motion
link in the README, 2026-10-21). That change was cherry-picked onto `v2`, so
the squash applies cleanly.

## 1. Land v2 on main

```bash
cd ~/saas-product-demo-video-skill
git checkout main
git pull --ff-only origin main
git status --short          # expect nothing but the ignored .worktrees/
```

```bash
git merge --squash v2
```

```bash
git commit -F - <<'MSG'
v2.1.0: Agent Skills layout, scaffold, beat verdicts, Stage and Title, render-and-check loop

The skill moves to skills/saas-product-demo-video/ and installs through
npx skills add, as a Claude Code plugin, or as a .skill upload. A copyable
Remotion scaffold replaces the code templates and is typechecked in CI.
detect-beats.py returns a reliability verdict. Stage and Title carry motion
through the cut. Stills, contact sheets, cut strips, a jerk report and a copy
check run before the owner sees a frame. Iteration discipline from a 24-wave
production: switches, locked decisions, test beds, handoff template, 80
gotchas. See CHANGELOG.md.
MSG
```

## 2. Check main before anything leaves the machine

```bash
git grep -n -i "noamdorokho[v]\|/User[s]/" || echo "clean"
```

```bash
python3 -m unittest discover -s tests && bash skills/saas-product-demo-video/scripts/verify-scaffold.sh
```

```bash
./build.sh && unzip -l saas-product-demo-video.skill | grep -c -i "pycache\|\.pyc\|DS_Store"
```

Expect `clean`, `OK: scaffold and all optional components verified`, and `0`.

## 3. Push, tag, release

```bash
git push origin main
```

```bash
git tag -a v2.1.0 -m "v2.1.0: Agent Skills layout, scaffold, beat verdicts, Stage and Title, render-and-check loop" && git push origin v2.1.0
```

```bash
sed -n '/^## 2.1.0/,/^## 1.1.3/p' CHANGELOG.md | sed '1d;$d' > /tmp/release-notes.md && gh release create v2.1.0 ./saas-product-demo-video.skill --title "v2.1.0 - the v2 skill: scaffold, beat verdicts, render-and-check loop" --notes-file /tmp/release-notes.md
```

## 4. Afterwards

```bash
gh release view v2.1.0 --web
```

Point the `v2` worktree at the published tree so the next wave starts from
`main` (the old private history stays in the reflog for 90 days if you ever
need it):

```bash
git -C .worktrees/v2 reset --hard main
```

Branches to leave alone: `codex-creative-direction-2026-10-22` (an abstract
rewrite, preserved, not for publication) and
`noam/ree-1036-reconcile-...` (superseded by `v2`, nothing in it that `v2`
lacks; delete when convenient).

## If you would rather keep the history

`git merge --no-ff v2` instead of the squash publishes every private commit
message on `v2`. Only do that after rewriting them. Not recommended.
