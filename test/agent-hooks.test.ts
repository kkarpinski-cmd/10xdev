import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const LINT_HOOK = join(REPO_ROOT, ".cursor/hooks/lint-edited-file.sh");
const EOT_HOOK = join(REPO_ROOT, ".cursor/hooks/end-of-turn.sh");

interface HookResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runHook(script: string, payload: string, cwd: string, env: Record<string, string> = {}): HookResult {
  const result = spawnSync("bash", [script], {
    input: payload,
    encoding: "utf8",
    cwd,
    env: { ...process.env, ...env },
  });
  return { status: result.status, stdout: result.stdout || "", stderr: result.stderr || "" };
}

function initBareGitRepo(dir: string): void {
  for (const args of [["init"], ["config", "user.email", "hooks@test.local"], ["config", "user.name", "Hook Test"]]) {
    const r = spawnSync("git", args, { cwd: dir, encoding: "utf8" });
    expect(r.status).toBe(0);
  }
  writeFileSync(join(dir, "README.md"), "# temp\n");
  spawnSync("git", ["add", "README.md"], { cwd: dir, encoding: "utf8" });
  spawnSync("git", ["commit", "-m", "init"], { cwd: dir, encoding: "utf8" });
}

function addWorktree(): string {
  const path = mkdtempSync(join(tmpdir(), "jamset-hook-wt-"));
  const r = spawnSync("git", ["worktree", "add", "--detach", path, "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  expect(r.status).toBe(0);
  return path;
}

function removeWorktree(path: string): void {
  spawnSync("git", ["worktree", "remove", "--force", path], { cwd: REPO_ROOT, encoding: "utf8" });
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

function writeUnder(root: string, rel: string, body: string): string {
  const filePath = join(root, rel);
  mkdirSync(join(filePath, ".."), { recursive: true });
  writeFileSync(filePath, body);
  return filePath;
}

describe("agent hooks", () => {
  let worktree: string;

  beforeEach(() => {
    worktree = addWorktree();
    const modulesLink = join(worktree, "node_modules");
    if (!existsSync(modulesLink)) {
      symlinkSync(join(REPO_ROOT, "node_modules"), modulesLink, "dir");
    }
  });

  afterEach(() => {
    removeWorktree(worktree);
  });

  it("lint hook reports ESLint errors via additional_context", () => {
    const rel = "src/__hook_probe_broken__.ts";
    const abs = writeUnder(worktree, rel, "const hookProbeBrokenUnused = 1;\n");
    const payload = JSON.stringify({
      tool_name: "Write",
      tool_input: { file_path: abs },
      cwd: worktree,
      conversation_id: "conv-lint-broken",
    });
    const result = runHook(LINT_HOOK, payload, worktree, { CURSOR_PROJECT_DIR: worktree });
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout.trim()) as { additional_context?: string };
    expect(parsed.additional_context).toMatch(/ESLint reported errors/);
    expect(parsed.additional_context).toMatch(/hookProbeBrokenUnused/);
    rmSync(abs, { force: true });
  });

  it("lint hook passes on a clean lintable file", () => {
    const rel = "src/__hook_probe_clean__.ts";
    const abs = writeUnder(worktree, rel, "export const hookProbeClean = 1;\n");
    const payload = JSON.stringify({
      tool_input: { file_path: abs },
      cwd: worktree,
    });
    const result = runHook(LINT_HOOK, payload, worktree, { CURSOR_PROJECT_DIR: worktree });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
    rmSync(abs, { force: true });
  });

  it("lint hook skips non-lintable extensions", () => {
    const abs = writeUnder(worktree, "src/__hook_probe__.md", "hello\n");
    const payload = JSON.stringify({
      tool_input: { file_path: abs },
      cwd: worktree,
    });
    const result = runHook(LINT_HOOK, payload, worktree, { CURSOR_PROJECT_DIR: worktree });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
    rmSync(abs, { force: true });
  });

  it("lint hook passes when the file path does not exist", () => {
    const payload = JSON.stringify({
      tool_input: { file_path: join(worktree, "missing.ts") },
      cwd: worktree,
    });
    const result = runHook(LINT_HOOK, payload, worktree, { CURSOR_PROJECT_DIR: worktree });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("lint hook passes on empty or pathless payload", () => {
    expect(runHook(LINT_HOOK, "{}", worktree, { CURSOR_PROJECT_DIR: worktree }).stdout.trim()).toBe("");
    expect(runHook(LINT_HOOK, "not json", worktree, { CURSOR_PROJECT_DIR: worktree }).status).toBe(0);
    expect(runHook(LINT_HOOK, '{"tool_input":{}}', worktree, { CURSOR_PROJECT_DIR: worktree }).stdout.trim()).toBe("");
  });

  it("end-of-turn hook skips follow-up when loop_count is already 1", () => {
    const stubBin = join(worktree, "stub-bin");
    mkdirSync(stubBin);
    const npxStub = join(stubBin, "npx");
    writeFileSync(npxStub, `#!/usr/bin/env bash\nexit 1\n`);
    chmodSync(npxStub, 0o755);
    const rel = "src/__hook_loop_guard__.ts";
    writeUnder(worktree, rel, "export const hookLoopGuard = 1;\n");
    spawnSync("git", ["add", rel], { cwd: worktree, encoding: "utf8" });

    const payload = JSON.stringify({ status: "completed", loop_count: 1, cwd: worktree });
    const result = runHook(EOT_HOOK, payload, worktree, {
      CURSOR_PROJECT_DIR: worktree,
      PATH: `${stubBin}:${process.env.PATH ?? ""}`,
    });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");

    spawnSync("git", ["reset", "HEAD", rel], { cwd: worktree, encoding: "utf8" });
    rmSync(join(worktree, rel), { force: true });
  });

  it("end-of-turn hook passes when nothing changed", () => {
    const payload = JSON.stringify({ status: "completed", loop_count: 0, cwd: worktree });
    const result = runHook(EOT_HOOK, payload, worktree, { CURSOR_PROJECT_DIR: worktree });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  it("end-of-turn hook catches staged edits the per-edit hook never saw", () => {
    const stubBin = join(worktree, "stub-bin");
    mkdirSync(stubBin);
    const npxStub = join(stubBin, "npx");
    writeFileSync(
      npxStub,
      `#!/usr/bin/env bash
case "$*" in
  *eslint*) exit 1 ;;
  *vitest*) exit 0 ;;
  *astro*) exit 0 ;;
esac
exit 0
`,
    );
    chmodSync(npxStub, 0o755);

    const rel = "src/__hook_eot_shell__.ts";
    writeUnder(worktree, rel, "export const hookEotShell = 1;\n");
    spawnSync("git", ["add", rel], { cwd: worktree, encoding: "utf8" });

    const payload = JSON.stringify({ status: "completed", loop_count: 0, cwd: worktree });
    const result = runHook(EOT_HOOK, payload, worktree, {
      CURSOR_PROJECT_DIR: worktree,
      PATH: `${stubBin}:${process.env.PATH ?? ""}`,
    });
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout.trim()) as { followup_message?: string };
    expect(parsed.followup_message).toMatch(/ESLint errors in changed files/);

    spawnSync("git", ["reset", "HEAD", rel], { cwd: worktree, encoding: "utf8" });
    rmSync(join(worktree, rel), { force: true });
  });

  it("resolves a relative edited path against cwd", () => {
    const rel = "src/__hook_rel_broken__.ts";
    writeUnder(worktree, rel, "const hookRelBrokenUnused = true;\n");
    const payload = JSON.stringify({
      tool_input: { file_path: rel },
      cwd: worktree,
    });
    const result = runHook(LINT_HOOK, payload, worktree, { CURSOR_PROJECT_DIR: worktree });
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout.trim()) as { additional_context?: string };
    expect(parsed.additional_context).toMatch(/hookRelBrokenUnused/);
    rmSync(join(worktree, rel), { force: true });
  });

  it("does not lint files from a different git repository", () => {
    const other = mkdtempSync(join(tmpdir(), "jamset-other-repo-"));
    try {
      initBareGitRepo(other);
      const abs = writeUnder(other, "src/other-broken.ts", "const otherBrokenUnused = 1;\n");
      const payload = JSON.stringify({
        tool_input: { file_path: abs },
        cwd: worktree,
      });
      const result = runHook(LINT_HOOK, payload, worktree, { CURSOR_PROJECT_DIR: worktree });
      expect(result.status).toBe(0);
      expect(result.stdout.trim()).toBe("");
    } finally {
      rmSync(other, { recursive: true, force: true });
    }
  });

  it("surfaces missing npx instead of silent success on lint", () => {
    const rel = "src/__hook_npx__.ts";
    const abs = writeUnder(worktree, rel, "export const hookNpx = 1;\n");
    const payload = JSON.stringify({
      tool_input: { file_path: abs },
      cwd: worktree,
    });
    const result = runHook(LINT_HOOK, payload, worktree, {
      CURSOR_PROJECT_DIR: worktree,
      PATH: "/usr/bin:/bin",
    });
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout.trim()) as { additional_context?: string };
    expect(parsed.additional_context).toMatch(/npx not found/);
    rmSync(abs, { force: true });
  });

  it("hook scripts exist and are executable", () => {
    expect(existsSync(LINT_HOOK)).toBe(true);
    expect(existsSync(EOT_HOOK)).toBe(true);
    expect(readFileSync(LINT_HOOK, { encoding: "utf8" }).startsWith("#!")).toBe(true);
    expect(readFileSync(EOT_HOOK, { encoding: "utf8" }).startsWith("#!")).toBe(true);
  });
});
