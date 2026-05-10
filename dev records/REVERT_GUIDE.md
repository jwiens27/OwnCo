# REVERT_GUIDE.md

Guide for reverting the Windows EISDIR workaround patches after moving the project to the C: drive. Execute steps in order. Each step has a verification command — run it before proceeding to the next step.

---

## 0. Operating Rules

1. **Execute steps in order.** Each step builds on the previous one's verified state.
2. **Verify after every step.** If verification fails, stop and report. Do not continue.
3. **Do not improvise.** If a file mentioned here doesn't exist on disk, report that — don't guess what to do.
4. **Commit at every step boundary.** One commit per step, message format: `revert: step N — <description>`.
5. **The goal is a clean spec-compliant project.** When done, no trace of the EISDIR workaround should remain.

---

## 1. Move the Project to C:

### Step 1.1 — Close all open editors and terminals

Close VS Code, Cursor, any terminal sessions, and any file explorer windows pointing at `E:\bin\Roundtable`. Windows holds file locks aggressively; the move will fail if anything is open.

### Step 1.2 — Verify the destination doesn't exist

In PowerShell:

```powershell
Test-Path C:\dev\Roundtable
```

If this returns `True`, stop and ask. We will not overwrite anything.

If `C:\dev` doesn't exist, create it:

```powershell
New-Item -ItemType Directory -Path C:\dev -Force
```

### Step 1.3 — Move the project

```powershell
Move-Item -Path E:\bin\Roundtable -Destination C:\dev\Roundtable
```

### Step 1.4 — Verify the move

```powershell
Test-Path C:\dev\Roundtable\package.json
Test-Path E:\bin\Roundtable
```

Expected output:
- First command: `True`
- Second command: `False`

### Step 1.5 — cd into the new location

```powershell
cd C:\dev\Roundtable
```

All subsequent commands run from here.

### Step 1.6 — Wipe build artifacts

The `node_modules` and `.next` directories contain absolute paths from the old location. They must be regenerated.

```powershell
Remove-Item -Recurse -Force node_modules, .next, pnpm-lock.yaml -ErrorAction SilentlyContinue
```

`pnpm-lock.yaml` is removed because we want a clean install with the corrected paths. It will be regenerated.

### Step 1.7 — Reinstall dependencies

```powershell
pnpm install
```

This should complete without error. It may take several minutes.

### Step 1.8 — Verify the install

```powershell
pnpm typecheck
```

Expected: passes with no errors.

```powershell
pnpm test
```

Expected: passes (zero tests at this stage is fine).

**Do not run `pnpm build` yet.** The patches are still in place; we want to revert those before testing the build, so that when the build succeeds we know it's because the move fixed it, not because the patches are doing something.

### Step 1.9 — Commit

```powershell
git add -A
git commit -m "revert: step 1 — move project from E: to C: and reinstall"
```

---

## 2. Remove the Readlink Monkey-Patches

### Step 2.1 — Delete the patch script

```powershell
Remove-Item -Force scripts\patch-readlink.cjs
```

If the `scripts/` directory is now empty, remove it too:

```powershell
if ((Get-ChildItem scripts -ErrorAction SilentlyContinue).Count -eq 0) {
    Remove-Item -Force scripts
}
```

### Step 2.2 — Verify

```powershell
Test-Path scripts\patch-readlink.cjs
```

Expected: `False`.

### Step 2.3 — Revert package.json scripts

Open `package.json`. The `scripts` block should currently look something like this (with the `cross-env NODE_OPTIONS` prefix on `dev`, `build`, and `start`):

```json
"scripts": {
  "dev": "cross-env NODE_OPTIONS=\"--require C:/dev/Roundtable/scripts/patch-readlink.cjs\" next dev",
  "build": "cross-env NODE_OPTIONS=\"--require C:/dev/Roundtable/scripts/patch-readlink.cjs\" next build",
  "start": "cross-env NODE_OPTIONS=\"--require C:/dev/Roundtable/scripts/patch-readlink.cjs\" next start",
  ...
}
```

Replace the entire `scripts` block with the spec-compliant version:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "format": "prettier --write ."
}
```

### Step 2.4 — Remove the cross-env dependency

`cross-env` was installed only to support the `NODE_OPTIONS` workaround. If it's not used anywhere else (it shouldn't be), remove it:

```powershell
pnpm remove cross-env
```

If pnpm reports `cross-env` is not a dependency, that's fine — skip this command and continue.

### Step 2.5 — Verify scripts work

```powershell
pnpm typecheck
```

Expected: passes.

```powershell
pnpm test
```

Expected: passes.

### Step 2.6 — The big test: pnpm build

```powershell
pnpm build
```

Expected: completes with no EISDIR errors. There may be warnings about empty stub pages or unused exports — those are acceptable at this stage.

**If the build fails with the EISDIR error again:**
- Verify you are in `C:\dev\Roundtable` and not still in the E: location: `Get-Location`
- Verify `node_modules` was actually wiped before the reinstall: `Test-Path node_modules\.pnpm` (should be True; if it doesn't exist at all, the install didn't complete)
- Verify Node.js is on a sane version: `node --version`. If on v24, install Node 20 LTS via `nvm-windows` and try again
- If still failing, stop and report — do not reintroduce the patches

### Step 2.7 — Commit

```powershell
git add -A
git commit -m "revert: step 2 — remove readlink monkey-patches and cross-env"
```

---

## 3. Resolve the lib/utils Duplication

The build report noted that both `lib/utils.ts` (created by shadcn) and `lib/utils/cn.ts` (created per the spec) exist with identical `cn` exports. We resolve this in favor of the shadcn-default location, since shadcn components import from `@/lib/utils` and changing that requires editing every shadcn component.

### Step 3.1 — Verify both files exist

```powershell
Test-Path lib\utils.ts
Test-Path lib\utils\cn.ts
```

Both should be `True`. If only one exists, skip to step 3.4.

### Step 3.2 — Verify the contents are equivalent

Open both files. Each should export a `cn` function combining `clsx` and `tailwind-merge`. If `lib/utils.ts` is missing the export or differs in any meaningful way, stop and report — there's drift we need to inspect.

### Step 3.3 — Migrate any imports from `@/lib/utils/cn` to `@/lib/utils`

Search the codebase for imports of `@/lib/utils/cn`:

```powershell
Select-String -Path "**/*.ts","**/*.tsx" -Pattern "@/lib/utils/cn" -SimpleMatch
```

For each result, edit the file to import from `@/lib/utils` instead.

If the search returns no results, no edits are needed.

### Step 3.4 — Delete the redundant file

```powershell
Remove-Item -Force lib\utils\cn.ts
```

### Step 3.5 — Verify

```powershell
pnpm typecheck
```

Expected: passes. If it fails with `Cannot find module '@/lib/utils/cn'`, you missed a file in step 3.3 — search again and migrate it.

```powershell
pnpm build
```

Expected: passes.

### Step 3.6 — Commit

```powershell
git add -A
git commit -m "revert: step 3 — consolidate lib/utils duplication"
```

---

## 4. Documentation and Future-Proofing

### Step 4.1 — Add a README note about Windows drive requirements

Open `README.md` (create it if it doesn't exist with `New-Item -ItemType File README.md`). Add or append the following section:

```markdown
## Development on Windows

This project must be cloned to a path on the **C: drive** when developing on Windows. Next.js has a tracked issue (vercel/next.js#45067) where `next build` fails with `EISDIR: illegal operation on a directory, readlink` when the project is on any other drive (D:, E:, etc.), regardless of Node.js version or filesystem format.

Recommended location: `C:\dev\Roundtable`.

If you must develop from another drive, use WSL2 — the Linux filesystem layer is not affected by this issue.

### Required Node.js version

Node.js 20 LTS. Use `nvm-windows` to manage versions:

```powershell
nvm install 20
nvm use 20
```

Node.js 24 is not LTS and has not been validated against this stack.
```

### Step 4.2 — Verify the build one more time end-to-end

A final clean test to confirm everything works from a fresh state:

```powershell
Remove-Item -Recurse -Force node_modules, .next -ErrorAction SilentlyContinue
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

All four commands should complete successfully.

### Step 4.3 — Commit

```powershell
git add -A
git commit -m "revert: step 4 — document Windows drive requirements"
```

---

## 5. Final Verification Checklist

Before declaring the revert complete, confirm all of the following:

- [ ] Project is located at `C:\dev\Roundtable` (or another path on C:)
- [ ] `E:\bin\Roundtable` no longer exists
- [ ] `scripts/patch-readlink.cjs` no longer exists
- [ ] `scripts/` directory either no longer exists or contains other legitimate files
- [ ] `package.json` scripts contain no `cross-env` or `NODE_OPTIONS` references
- [ ] `cross-env` is not in `package.json` dependencies or devDependencies
- [ ] `lib/utils.ts` exists and exports `cn`
- [ ] `lib/utils/cn.ts` does not exist
- [ ] No source files import from `@/lib/utils/cn`
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes with no EISDIR errors
- [ ] `README.md` documents the Windows drive requirement
- [ ] All four steps have been committed

If every box is checked, the revert is complete and the project is ready for Phase 2 of the build.

---

## What This Guide Does Not Touch

The following items from the build report are out of scope for this revert and should be addressed separately:

- The Tailwind 3 → Tailwind 4 deviation (accepted as the working baseline; do not attempt to revert)
- The Toast → Sonner substitution (accepted; do not revert)
- The Node.js version on the developer's machine (recommend Node 20 LTS, but switching is at the developer's discretion)
- The Phase 2 calculator engine work (begins after this revert is complete)

If a step in this guide produces an unexpected result, stop and report rather than improvising. A clean revert is more important than a fast one.
