# GIT_SOP.md — Source Control Standard Operating Procedure
## ASHRAE Greater Central Oklahoma Chapter Website

---

## 1. Repository Overview

| Item | Value |
|---|---|
| Remote URL | https://github.com/jwiens27/ASHRAE-COK-Webpage.git |
| Primary branch | `main` |
| Active development branch | `dev` |
| Feature branches | `feature/<short-description>` (see Section 5) |

**Rule of thumb:** `main` is always deployable. `dev` is where active work happens. You never commit directly to `main`.

---

## 2. One-Time Setup (Per Developer)

```bash
# Clone the repo
git clone https://github.com/jwiens27/ASHRAE-COK-Webpage.git
cd ASHRAE-COK-Webpage

# Set your identity if not already configured globally
git config user.name "Your Name"
git config user.email "your@email.com"

# Confirm remotes
git remote -v
```

After cloning, copy `.env.example` to `.env` and fill in your credentials. Never commit `.env`.

---

## 3. Branch Definitions

### `main`
- Reflects the current stable, production-ready state of the site.
- No direct commits. Ever.
- Updated only by merging from `dev` after a phase milestone or significant stable checkpoint is reached.
- Each merge into `main` should be tagged with a version (see Section 6).

### `dev`
- The day-to-day working branch.
- All regular development commits go here.
- Should always be in a runnable state — broken code should not sit in `dev` for long.
- Merged into `main` at the end of a phase or when a stable release is ready.

---

## 4. Daily Development Workflow

This is the routine for any normal coding session.

```bash
# 1. Start by pulling the latest changes
git checkout dev
git pull origin dev

# 2. Do your work — edit files, add features, fix bugs

# 3. Stage your changes
git add .
# or stage specific files:
git add src/pages/index.astro

# 4. Commit with a clear message (see Section 7)
git commit -m "Add upcoming events section to homepage"

# 5. Push to remote
git push origin dev
```

If two developers are working simultaneously, always pull before you start and before you push to reduce merge conflicts.

---

## 5. Feature Branch Workflow

Use a feature branch when working on a self-contained piece of work — a new page, a significant component, or a multi-session effort. This keeps `dev` stable while the feature is in progress.

**When to use a feature branch:**
- Building a new page (e.g., About, Membership)
- Adding a major new component (e.g., calendar grid, event detail page)
- Any work expected to take more than one sitting to complete

**When NOT to use a feature branch:**
- Quick copy edits or small style tweaks
- Fixing a minor bug that takes one commit
- Config changes or dependency updates

### Creating and Working on a Feature Branch

```bash
# 1. Make sure dev is up to date first
git checkout dev
git pull origin dev

# 2. Create and switch to your feature branch
git checkout -b feature/about-page

# 3. Do your work and commit normally
git add .
git commit -m "Build About page layout and board member section"

# 4. Push the feature branch to remote (for backup and visibility)
git push origin feature/about-page

# 5. When the feature is complete, merge back into dev
git checkout dev
git pull origin dev                  # pull any changes made while you were working
git merge feature/about-page

# 6. Push the updated dev
git push origin dev

# 7. Delete the feature branch — it has served its purpose
git branch -d feature/about-page                  # delete local
git push origin --delete feature/about-page       # delete remote
```

### Feature Branch Naming

Use lowercase with hyphens. Be specific enough that the branch name communicates what it contains.

| Good | Avoid |
|---|---|
| `feature/calendar-grid` | `feature/new-stuff` |
| `feature/event-detail-page` | `feature/janes-work` |
| `feature/membership-page` | `feature/wip` |
| `fix/nav-dropdown-mobile` | `fix/bug` |

Use `fix/` prefix instead of `feature/` when the branch exists solely to resolve a bug.

---

## 6. Merging Dev into Main (Release Checkpoints)

Only do this at a stable milestone — end of a phase, or when `dev` has been tested and is confirmed working.

```bash
# 1. Make sure dev is clean and pushed
git checkout dev
git pull origin dev

# 2. Switch to main and pull
git checkout main
git pull origin main

# 3. Merge dev into main
git merge dev

# 4. Tag the release
git tag -a v1.0 -m "Phase 1 complete — static shell with Sanity integration"

# 5. Push main and the tag
git push origin main
git push origin --tags
```

### Version Tagging Convention

| Tag | Meaning |
|---|---|
| `v0.1` | Initial scaffold — static shell only |
| `v1.0` | Phase 1 complete |
| `v2.0` | Phase 2 complete |
| Patch: `v1.1`, `v1.2` | Hotfixes or minor updates to a stable phase |

---

## 7. Commit Message Guidelines

Write commit messages as a short, plain-English summary of *what changed and why*, not *how*.

**Format:** One line, under 72 characters, imperative tone ("Add", "Fix", "Update" — not "Added", "Fixed", "Updated").

**Good examples:**
```
Add EventCard component with date and location fields
Fix dropdown menu not closing on outside click
Update footer disclaimer to match ASHRAE policy wording
Wire Sanity client to calendar page
Remove placeholder text from homepage hero
Add event schema to Sanity with required fields
```

**Avoid:**
```
updates                          # too vague
fixed stuff                      # meaningless
WIP                              # don't commit broken work to dev
changed some files               # describes nothing
```

If a commit genuinely needs more explanation, add a body separated by a blank line:
```
Fix mobile nav layout on small screens

The dropdown was overflowing the viewport at 375px. Switched to
right-aligned absolute positioning to keep it within bounds.
```

---

## 8. What Never Gets Committed

These are enforced by `.gitignore` but worth stating explicitly:

- `.env` — contains secret keys and project IDs
- `node_modules/` — reconstructed via `npm install`
- `dist/` — build output, generated on demand
- `.astro/` — Astro's internal cache

If you accidentally stage any of these, unstage before committing:
```bash
git reset HEAD .env
```

If a secret was already committed, treat it as compromised — rotate the key immediately, then remove it from history.

---

## 9. Resolving Merge Conflicts

When two developers edit the same file:

```bash
# Git will mark conflicts in the file like this:
<<<<<<< HEAD
  your version of the code
=======
  the other developer's version
>>>>>>> dev

# 1. Open the file, decide which version is correct (or combine them)
# 2. Remove all the conflict markers
# 3. Stage the resolved file
git add src/layouts/BaseLayout.astro

# 4. Complete the merge
git commit -m "Resolve merge conflict in BaseLayout nav"
```

When in doubt, talk to the other developer before resolving — don't silently overwrite their work.

---

## 10. Quick Reference

```bash
# See what's changed
git status
git diff

# See recent commit history
git log --oneline -10

# Undo last commit but keep the changes staged
git reset --soft HEAD~1

# Discard all uncommitted changes (destructive — use carefully)
git checkout -- .

# See all branches
git branch -a
```

---

*End of GIT_SOP.md*
