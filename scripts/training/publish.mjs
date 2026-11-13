/**
 * Training > Level 3 > Publish my pipeline configuration.
 *
 * The release manager owns the pipeline configuration: what the DevOps Pipeline
 * settings wrote, the certificates of Add or Reconnect a Major Org, the .forceignore and the
 * package-no-overwrite list. Nobody pushes to a major branch, the release manager
 * included, and the branch protection refuses it: configuration goes through a
 * Pull Request into integration like everything else, and reaches the other major
 * branches with the next promotions.
 *
 * This takes the configuration files that changed, and nothing else, onto a
 * branch of their own, config/pipeline-<date>, pushes it and opens the Pull
 * Request. The release manager merges it once its checks are green.
 */
import fs from "fs";
import os from "os";
import path from "path";
import { ROOT, c, title, info, ok, warn, abort, run, gitOut, confirm, repoSlug, stamp, openPullRequest, removeTempDir } from "../lib/util.mjs";

// What a release manager configures, and nothing else: a feature never goes this way
const CONFIGURATION = [
  "config/.sfdx-hardis.yml",
  "config/branches",
  ".forceignore",
  "manifest/package-no-overwrite.xml"
];
const BASE = "integration";

export default async function publish(args) {
  title("Publish my pipeline configuration");

  // git refuses a path that is neither on disk nor tracked: the no-overwrite list only
  // exists from Lab 3.5 on
  const paths = CONFIGURATION.filter((p) => fs.existsSync(path.join(ROOT, p)) || gitOut(["ls-files", "--", p]) !== "");
  const changed = gitOut(["status", "--porcelain", "--", ...paths])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (changed.length === 0) {
    ok("Nothing to publish: no configuration file changed on your disk.");
    return;
  }
  info("  The configuration you changed:");
  changed.forEach((line) => info(c.dim(`    ${line}`)));
  const others = gitOut(["status", "--porcelain"])
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !changed.includes(line));
  if (others.length > 0) {
    info("");
    info(c.dim("  Left out, because they are not configuration: a contributor brings them through a User Story."));
    others.forEach((line) => info(c.dim(`    ${line}`)));
  }
  const branch = args.branch || `config/pipeline-${stamp()}`;
  info("");
  const sure = args.yes === true || (await confirm(`Put it on a new branch, ${branch}, and open a Pull Request into ${BASE}?`, true));
  if (!sure) {
    info("Nothing was published.");
    return;
  }

  title("1 of 3  A branch for the configuration");
  run("git", ["fetch", "origin", BASE], { quiet: true });
  // The branch is built in a folder of its own, from the integration of GitHub, and
  // the changes travel as a patch: the learner's local integration is often behind
  // the Pull Requests merged on GitHub, and switching the working tree onto a newer
  // integration with uncommitted edits is what git refuses
  const patch = configurationPatch(paths);
  const worktree = fs.mkdtempSync(path.join(os.tmpdir(), "helios-config-"));
  const added = run("git", ["worktree", "add", "-b", branch, worktree, `origin/${BASE}`], { quiet: true, capture: true });
  if (added.code !== 0) {
    removeTempDir(worktree);
    abort(`The branch ${branch} could not be created from ${BASE}.`, gitError(added));
  }
  const applied = run("git", ["apply", "--3way", "--binary", "--whitespace=nowarn"], { cwd: worktree, quiet: true, capture: true, input: patch });
  if (applied.code !== 0) {
    const conflicts = run("git", ["diff", "--name-only", "--diff-filter=U"], { cwd: worktree, quiet: true, capture: true }).stdout.trim();
    dropBranch(branch, worktree);
    abort(
      `Your configuration could not be put on top of the ${BASE} of GitHub.`,
      conflicts
        ? `Your change and a change merged on GitHub touch the same lines of ${conflicts.split("\n").join(", ")}. Lab 3.5, If it goes wrong, gives the clicks to bring them together: Stash, Pull, Pop Latest Stash. Then run this again.`
        : gitError(applied)
    );
  }
  ok(`${branch}, made from the ${BASE} of your fork as it is on GitHub`);

  title("2 of 3  Committing the configuration");
  run("git", ["add", "--all", "--", ...paths], { cwd: worktree });
  const message = args.message || "Pipeline configuration, from the release manager";
  if (run("git", ["commit", "-m", message], { cwd: worktree }).code !== 0) {
    dropBranch(branch, worktree);
    abort("The configuration could not be committed.", "Git needs a name and an email first: Source Control panel, then commit once by hand.");
  }
  ok("Committed");

  title("3 of 3  Pushing it and opening the Pull Request");
  if (run("git", ["push", "-u", "origin", branch], { quiet: true, capture: true }).code !== 0) {
    dropBranch(branch, worktree);
    warn("The push was refused, so nothing was published. Your changes are still on your disk: run this again when you are online.");
    return;
  }
  run("git", ["worktree", "remove", "--force", worktree], { quiet: true, capture: true });
  removeTempDir(worktree);
  // The configuration is on its branch now: it comes back to the local files with the
  // merge, and leaving the edits on disk would make that Pull refuse to run
  undoLocalConfiguration(paths);
  ok("Pushed");
  const slug = repoSlug();
  const body = [
    "Pipeline configuration, from the release manager. Nothing in it is a feature.",
    "",
    ...changed.map((line) => `- \`${line.replace(/^\S+\s+/, "")}\``),
    "",
    "Merge it with **Squash and merge**, as the How to merge line of its check comment says: it arrives on integration as one commit, and travels to uat, preprod and main with the promotions."
  ].join("\n");
  const prUrl = openPullRequest({ slug, base: BASE, branch, title: message, body });
  if (!prUrl) {
    warn("The Pull Request could not be opened automatically.");
    info(`  Open it yourself: ${c.cyan(`https://github.com/${slug}/compare/${BASE}...${branch}?expand=1`)}`);
  } else {
    ok(`Pull Request opened into ${BASE}`);
    info(`  ${c.cyan(prUrl)}`);
  }

  title("Done");
  info(`  Wait for the checks of the Pull Request, then merge it with ${c.bold("Squash and merge")}, as its check comment says.`);
  info(`  Then Pull in the Source Control panel: your ${BASE} gets the configuration back, merged.`);
}

/** The configuration changes on disk, new files included, as a patch against the local HEAD. */
function configurationPatch(paths) {
  const tracked = run("git", ["diff", "HEAD", "--binary", "--", ...paths], { quiet: true, capture: true }).stdout;
  const untracked = gitOut(["ls-files", "--others", "--exclude-standard", "--", ...paths])
    .split("\n")
    .filter(Boolean)
    // --no-index exits 1 when the files differ, which they always do here
    .map((file) => run("git", ["diff", "--no-index", "--binary", "--", "/dev/null", file], { quiet: true, capture: true }).stdout);
  return [tracked, ...untracked].join("");
}

/** What git said, which names the file, instead of a guess: the learner only sees the panel. */
function gitError(res) {
  const said = `${res.stderr}\n${res.stdout}`
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("hint:"));
  return said.length > 0 ? `Git said: ${said.join(" ")}` : "Run it again, and if it fails the same way, ask in the discussion of the lab.";
}

/** Removes the folder and the local branch of a publication that stopped half way. */
function dropBranch(branch, worktree) {
  run("git", ["worktree", "remove", "--force", worktree], { quiet: true, capture: true });
  removeTempDir(worktree);
  run("git", ["branch", "-D", branch], { quiet: true, capture: true });
}

/** Puts the published configuration files back as the local HEAD has them. */
function undoLocalConfiguration(paths) {
  const tracked = gitOut(["diff", "HEAD", "--name-only", "--", ...paths]).split("\n").filter(Boolean);
  if (tracked.length > 0) {
    run("git", ["restore", "--source=HEAD", "--staged", "--worktree", "--", ...tracked], { quiet: true, capture: true });
  }
  gitOut(["ls-files", "--others", "--exclude-standard", "--", ...paths])
    .split("\n")
    .filter(Boolean)
    .forEach((file) => fs.rmSync(path.join(ROOT, file), { force: true }));
}
