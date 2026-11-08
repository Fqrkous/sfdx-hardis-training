/**
 * Training > Set up my training environment.
 *
 * Everything that stands between one free Developer Edition org and a pipeline a
 * beginner can push a User Story through:
 *
 *   - the learner's own copy of the repository, with Actions on and the branches
 *     the pipeline uses
 *   - the Developer Edition org turned into a Dev Hub
 *   - three scratch orgs created from it: helios-dev to build in,
 *     helios-integration and helios-uat for the two stages of the pipeline
 *   - the Helios app and its data in each of them
 *   - integration and uat pointed at their orgs, and the CI credentials in the
 *     fork's secrets
 *   - integration and uat protected, so a Pull Request merges only once every
 *     GitHub Actions check on it finished green
 *
 * Why scratch orgs. Signing up for four Developer Edition orgs, confirming four
 * emails and connecting four orgs by hand is an afternoon a beginner spends on
 * something that is not the job. One signup and one connection is ten minutes,
 * and this command does the rest. The Developer Edition org itself stays out of
 * the pipeline until Level 3, where it becomes production.
 *
 * The limit to respect. A Developer Edition Dev Hub allows 3 active scratch orgs,
 * and only a few new ones a day. This command never creates a scratch org that
 * already exists and is still alive, so running it again costs nothing, and it
 * checks the allowance before asking for more.
 *
 * Design rules, the same ones seed.mjs follows:
 *   - Idempotent. Every step checks before it acts, so running it twice is
 *     harmless, and running it after a scratch org expired rebuilds that one.
 *   - It authenticates to one org only, the Dev Hub, and Orgs Manager does that.
 *     The scratch orgs are authenticated by the command that creates them.
 *   - It stops at the first failure and says which button to click instead. The
 *     course never asks anybody to type a command, so a failure has to end in
 *     something clickable.
 */
import fs from "fs";
import os from "os";
import path from "path";
import {
  ROOT, c, title, info, ok, warn, abort, run, runAsync, runJson, parseJsonOutput, git, gitOut,
  select, confirm, connectedOrgs, orgChoices, universe, ensureGh, confirmGhAccount, repoSlug, openUrl, removeTempDir,
  readProgress, writeProgress
} from "../lib/util.mjs";
import { deployAppToAll, grantManager, loadData, recordSeeded, alreadySeeded, workInEnglish } from "./seed.mjs";
import { REQUIRED_CHECKS, protectBranches, deleteMergedBranches, withProtectionLifted } from "../lib/protection.mjs";

const UPSTREAM = "hardisgroupcom/sfdx-hardis-training";
const SCRATCH_DEF = path.join("config", "project-scratch-def.json");
// The longest a scratch org can live. Setting the maximum is what lets a learner
// take the course over a few weeks without meeting an expired org.
const DURATION_DAYS = 30;
// The settings of the scratch definition that switch a Salesforce feature off, which a scratch
// org created before they were added still has on: see alignScratchOrgs.
const SHAPE_SETTINGS = ["fieldServiceSettings", "workDotComSettings"];
// Branches the fork needs for Levels 1 and 2. main exists in every fork, and
// preprod is created by the release manager in Lab 3.1, from main.
const PIPELINE_BRANCHES = ["integration", "uat"];
const STEPS = 8;
// How long step 2 waits for the learner to click the Actions banner of a new fork.
const ACTIONS_WAIT_MINUTES = 10;

/** The orgs this command owns, read from the universe so the labs and the code agree. */
function trainingOrgs() {
  const orgs = universe().orgs;
  const devHub = orgs.find((o) => o.kind === "developer-edition" && o.neededFrom === 1);
  const scratch = orgs.filter((o) => o.kind === "scratch");
  return { devHub, scratch };
}

/** The major branches Levels 1 and 2 use, each with its org and where it merges next. */
export function levelOnePipeline(aliasOf = (alias) => alias) {
  const { scratch } = trainingOrgs();
  const stages = scratch.filter((o) => o.branch && o.branchFrom === 1);
  return stages.map((stage, index) => ({
    branch: stage.branch,
    alias: aliasOf(stage.alias),
    mergeTargets: stages[index + 1] ? [stages[index + 1].branch] : []
  }));
}

const step = (n, text) => title(`${n} of ${STEPS}  ${text}`);

// -------------------------------------------------------------------- GitHub
function ghJson(args) {
  const res = run("gh", args, { capture: true, quiet: true });
  return res.code === 0 ? parseJsonOutput(res.stdout) : null;
}

/** The handle gh is signed in as, which is who the fork will belong to. */
function currentHandle() {
  const user = ghJson(["api", "user"]);
  return user?.login || null;
}

/**
 * A commit needs a name and an email, and a machine that has never made one has
 * neither. VS Code cannot set them, and this course sends nobody to a terminal,
 * so the GitHub account gh is signed in as fills them in.
 *
 * In this clone only, never with --global: nothing outside the course changes.
 * The address is the noreply one GitHub gives every account, so a learner's real
 * address never ends up in a public commit they did not think about.
 */
function ensureGitIdentity() {
  const configured = (key) => gitOut(["config", "--get", key]) !== "";
  if (configured("user.name") && configured("user.email")) {
    return;
  }
  const user = ghJson(["api", "user"]);
  if (!user?.login) {
    warn("Git has no name and email yet, and your GitHub account could not be read to fill them in.");
    info("  Your first commit will be refused. Sign in to GitHub again, then click this command again.");
    return;
  }
  const name = user.name || user.login;
  const email = `${user.id}+${user.login}@users.noreply.github.com`;
  run("git", ["config", "user.name", name], { quiet: true, capture: true });
  run("git", ["config", "user.email", email], { quiet: true, capture: true });
  ok(`Your commits in this folder are made as ${c.bold(name)} <${email}>.`);
}

// ------------------------------------------------------------ the Dev Hub org
/**
 * The Developer Edition org the learner connected, when there is nothing to choose.
 *
 * Lab 1.2 tells them to name it helios-prod, so that alias wins. Somebody who
 * named it something else and has exactly one Org Farm org connected is not
 * asked either: that org is the only candidate. Anything else is a question.
 */
export async function findDevHub(orgs, preselected) {
  const { devHub } = trainingOrgs();
  const candidates = orgs.filter((o) => !o.isScratch);
  if (preselected) {
    return select("Which org is your Developer Edition org?", orgChoices(candidates), preselected, "org");
  }
  const byAlias = candidates.find((o) => (o.aliases || []).includes(devHub.alias));
  if (byAlias) {
    info(`Developer Edition org: ${c.green(devHub.alias)}`);
    return devHub.alias;
  }
  const orgFarm = candidates.filter((o) => /orgfarm/i.test(o.instanceUrl || ""));
  if (orgFarm.length === 1) {
    const chosen = orgFarm[0].alias || orgFarm[0].username;
    info(`Developer Edition org: ${c.green(chosen)} ${c.dim("(the only Org Farm org connected)")}`);
    return chosen;
  }
  return select("Which org is your Developer Edition org?", orgChoices(candidates), null);
}

const DEV_HUB_QUERY_TIMEOUT_MS = 2 * 60 * 1000;
// The deploy waits 10 minutes itself, this is only for a CLI that never returns
const DEV_HUB_DEPLOY_TIMEOUT_MS = 11 * 60 * 1000;
const DEV_HUB_BY_HAND = "Open the org, go to Setup > Dev Hub, switch Enable Dev Hub on, then click Set up my training environment again.";

/**
 * Turns Dev Hub on, which is one setting in Setup and cannot be turned off again.
 * On a throwaway Developer Edition org that costs nothing. It is deployed as
 * metadata rather than clicked, so nobody has to find the page.
 *
 * Every wait is announced before it starts, and the deploy says every minute
 * that it is still running: without that, a slow deploy and a stuck one look
 * the same in the panel.
 */
export async function ensureDevHub(alias) {
  info(`Checking whether ${c.bold(alias)} is a Dev Hub...`);
  const before = await isDevHub(alias);
  if (before === "timeout") {
    abort(`${alias} did not answer within ${DEV_HUB_QUERY_TIMEOUT_MS / 60000} minutes.`, DEV_HUB_BY_HAND);
  }
  if (before) {
    ok(`${c.bold(alias)} is already a Dev Hub.`);
    return;
  }
  info(`Turning Dev Hub on in ${c.bold(alias)}: deploying the Dev Hub setting, up to 10 minutes.`);
  info(c.dim(`    If it takes too long: open ${alias}, Setup > Dev Hub, switch Enable Dev Hub on, then click Set up my training environment again.`));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "helios-devhub-"));
  fs.mkdirSync(path.join(dir, "settings"));
  fs.writeFileSync(
    path.join(dir, "package.xml"),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
      "    <types>",
      "        <members>DevHub</members>",
      "        <name>Settings</name>",
      "    </types>",
      "    <version>64.0</version>",
      "</Package>",
      ""
    ].join("\n"),
    "utf8"
  );
  fs.writeFileSync(
    path.join(dir, "settings", "DevHub.settings"),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<DevHubSettings xmlns="http://soap.sforce.com/2006/04/metadata">',
      // The Dev Hub switch of Setup, under the name the Metadata API gives it
      "    <enableScratchOrgManagementPref>true</enableScratchOrgManagementPref>",
      "</DevHubSettings>",
      ""
    ].join("\n"),
    "utf8"
  );
  const started = Date.now();
  const ticker = setInterval(() => {
    const minutes = Math.round((Date.now() - started) / 60000);
    info(c.dim(`    Still deploying the Dev Hub setting (${minutes} min)...`));
  }, 60 * 1000);
  let res;
  try {
    res = await runAsync(
      "sf",
      ["project", "deploy", "start", "--metadata-dir", dir, "--target-org", alias, "--wait", "10", "--json"],
      { timeoutMs: DEV_HUB_DEPLOY_TIMEOUT_MS }
    );
  } finally {
    clearInterval(ticker);
    removeTempDir(dir);
  }
  if (res.timedOut) {
    warn(`The deploy of the Dev Hub setting to ${alias} did not end within ${DEV_HUB_DEPLOY_TIMEOUT_MS / 60000} minutes.`);
  } else if (res.code !== 0) {
    const json = parseJsonOutput(res.stdout);
    warn(json?.message || (res.stderr || res.stdout).trim().split("\n").slice(-5).join("\n"));
  }
  // The setting is saved before the objects behind it answer queries
  let after = false;
  if (res.code === 0) {
    info(`Waiting for Dev Hub to take effect in ${c.bold(alias)}, up to a minute...`);
    after = await isDevHub(alias);
    for (let attempt = 0; after !== true && attempt < 12; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      after = await isDevHub(alias);
    }
  }
  if (after !== true) {
    abort(`Dev Hub could not be turned on in ${alias}.`, DEV_HUB_BY_HAND);
  }
  // The org answers the query, but the CLI still has "not a Dev Hub" in the
  // auth file it wrote when the org was connected, and `sf org create scratch`
  // reads that file: without this refresh the very next step fails with
  // NotADevHubError on an org that is one.
  run("sf", ["org", "list", "--json"], { quiet: true, capture: true });
  ok(`${c.bold(alias)} is a Dev Hub now.`);
}

/**
 * True when the org answers the one query only a Dev Hub can, "timeout" when it
 * does not answer at all.
 */
async function isDevHub(alias) {
  const res = await runAsync(
    "sf",
    ["data", "query", "--query", "SELECT Id FROM ScratchOrgInfo LIMIT 1", "--target-org", alias, "--json"],
    { timeoutMs: DEV_HUB_QUERY_TIMEOUT_MS }
  );
  if (res.timedOut) {
    return "timeout";
  }
  return parseJsonOutput(res.stdout.trim())?.status === 0;
}

// ------------------------------------------------------------ scratch orgs
/** Scratch orgs the Dev Hub may still create today, and may keep alive at once. */
function scratchAllowance(devHub) {
  const res = runJson("sf", ["org", "list", "limits", "--target-org", devHub, "--json"]);
  const limit = (name) => (res?.result || []).find((l) => l.name === name);
  return { active: limit("ActiveScratchOrgs"), daily: limit("DailyScratchOrgs") };
}

/**
 * Creates the scratch orgs that do not exist yet, all at once, and returns the
 * username of every one of them. An alias that names an org that is not a live
 * scratch org of this Dev Hub is taken over: it is a leftover, often from an
 * older version of this course that used Developer Edition orgs everywhere.
 */
export async function ensureScratchOrgs(devHub, aliases) {
  const orgs = connectedOrgs();
  const hubUsername = (orgs.find((o) => (o.aliases || []).includes(devHub) || o.username === devHub) || {}).username;
  const usernames = {};
  const kept = [];
  const missing = [];
  for (const alias of aliases) {
    const existing = orgs.find((o) => (o.aliases || []).includes(alias));
    const alive = existing && existing.isScratch && existing.connected &&
      (!existing.devHubUsername || !hubUsername || existing.devHubUsername === hubUsername);
    if (alive) {
      usernames[alias] = existing.username;
      kept.push(existing.username);
      ok(`${c.bold(alias)} already exists${existing.expirationDate ? `, until ${existing.expirationDate}` : ""}.`);
    } else {
      if (existing) {
        info(c.dim(`    ${alias} names an org that is not a live scratch org of ${devHub}. A new one takes the name.`));
      }
      missing.push(alias);
    }
  }
  if (missing.length === 0) {
    return usernames;
  }

  const { active, daily } = scratchAllowance(devHub);
  const short = (limit) => limit && limit.remaining < missing.length;
  if (short(active) || short(daily)) {
    const used = active ? active.max - active.remaining : 0;
    // Naming them is what lets somebody tell a leftover of this course from an
    // org another team or a CI job keeps alive on the same Dev Hub.
    const holders = short(active)
      ? (runJson("sf", ["data", "query", "--target-org", devHub, "--json", "--query",
        "SELECT SignupUsername FROM ActiveScratchOrg"])?.result?.records || []).map((r) => r.SignupUsername)
      : [];
    const which = short(active)
      ? `${devHub} already keeps ${used} of its ${active.max} active scratch org${active.max === 1 ? "" : "s"} alive` +
        (holders.length > 0 ? `: ${holders.join(", ")}` : "")
      : `${devHub} has created all the scratch orgs it may create today (${daily.max})`;
    abort(
      `${missing.length} scratch org(s) are needed, and ${which}.`,
      short(active)
        ? `Open ${devHub}, App Launcher > Active Scratch Orgs, and delete the ones this course does not use. Then click Set up my training environment again.\n` +
          "  If they belong to somebody else, a CI job for instance, leave them: sign up for a new Developer Edition org instead, and connect it as helios-prod."
        : "The allowance comes back within 24 hours. Click Set up my training environment again tomorrow: everything already done is kept."
    );
  }

  info(`Creating ${missing.join(", ")} from ${c.bold(devHub)}, all at once.`);
  info(c.dim("    Each one takes a few minutes. Nothing prints until they are ready."));
  const results = await Promise.all(
    missing.map(async (alias) => ({
      alias,
      res: await runAsync("sf", [
        "org", "create", "scratch",
        "--definition-file", SCRATCH_DEF,
        "--alias", alias,
        "--target-dev-hub", devHub,
        "--duration-days", String(DURATION_DAYS),
        "--wait", "30",
        "--json"
      ])
    }))
  );
  const failures = [];
  for (const { alias, res } of results) {
    const json = parseJsonOutput(res.stdout);
    const username = json?.result?.username;
    if (res.code === 0 && username) {
      usernames[alias] = username;
      ok(`${c.bold(alias)} is created, for ${DURATION_DAYS} days.`);
    } else {
      failures.push(alias);
      warn(`${alias} could not be created: ${json?.message || (res.stderr || res.stdout).trim().split("\n").pop()}`);
    }
  }
  // Before the stop below: an org this run created has the features of the definition, and the
  // next run, which keeps it, must not take it for an older one
  rememberShape(Object.values(usernames).filter((username) => !kept.includes(username)));
  if (failures.length > 0) {
    abort(
      `${failures.length} scratch org(s) could not be created.`,
      "Click Set up my training environment again: the orgs that were created are kept, and only the missing ones are retried."
    );
  }
  return usernames;
}

/**
 * Switches off, in the scratch orgs created before the scratch definition did
 * it, the Salesforce features a Developer Edition org does not have.
 *
 * A scratch org comes with Field Service and the Thanks badges on, and a
 * Developer Edition org with both off. A Profile retrieved whole lists the page
 * layout and the tab of every object of its org, those two features' included,
 * so the Profile of Lab 2.6 could not be deployed to the two Developer Edition
 * orgs of Level 3. The definition switches them off in a new scratch org; this
 * does the same in one that already exists, once.
 */
export async function alignScratchOrgs(usernames) {
  const shape = scratchShape();
  const done = readProgress().scratchShapes || {};
  const todo = Object.keys(usernames).filter((alias) => done[usernames[alias]] !== shape.id);
  if (todo.length === 0) {
    return;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "helios-shape-"));
  fs.mkdirSync(path.join(dir, "settings"));
  fs.writeFileSync(
    path.join(dir, "package.xml"),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
      "    <types>",
      ...shape.settings.map((setting) => `        <members>${setting.name}</members>`),
      "        <name>Settings</name>",
      "    </types>",
      "    <version>64.0</version>",
      "</Package>",
      ""
    ].join("\n"),
    "utf8"
  );
  for (const setting of shape.settings) {
    fs.writeFileSync(
      path.join(dir, "settings", `${setting.name}.settings`),
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<${setting.name}Settings xmlns="http://soap.sforce.com/2006/04/metadata">`,
        ...Object.entries(setting.values).map(([key, value]) => `    <${key}>${value}</${key}>`),
        `</${setting.name}Settings>`,
        ""
      ].join("\n"),
      "utf8"
    );
  }
  const results = await Promise.all(
    todo.map(async (alias) => ({
      alias,
      res: await runAsync("sf", ["project", "deploy", "start", "--metadata-dir", dir, "--target-org", alias, "--wait", "10", "--json"])
    }))
  );
  removeTempDir(dir);
  const aligned = [];
  for (const { alias, res } of results) {
    if (res.code === 0) {
      aligned.push(usernames[alias]);
      ok(`${c.bold(alias)} has the same Salesforce features as a Developer Edition org.`);
    } else {
      // Not fatal: the org works, and only a Profile retrieved whole from it would show the difference
      warn(`${alias} keeps Field Service and the Thanks badges on: ${parseJsonOutput(res.stdout)?.message || "the settings could not be deployed"}`);
    }
  }
  rememberShape(aligned);
}

/** The feature settings of the scratch definition, and an id that changes when they do. */
function scratchShape() {
  const definition = JSON.parse(fs.readFileSync(path.join(ROOT, SCRATCH_DEF), "utf8"));
  const settings = SHAPE_SETTINGS.filter((key) => definition.settings?.[key]).map((key) => ({
    // fieldServiceSettings in the definition is the FieldService setting of the Metadata API
    name: key.charAt(0).toUpperCase() + key.slice(1).replace(/Settings$/, ""),
    values: definition.settings[key]
  }));
  return { settings, id: JSON.stringify(settings) };
}

/** Records the scratch orgs that have the features of the current definition. */
function rememberShape(scratchUsernames) {
  if (scratchUsernames.length === 0) {
    return;
  }
  const progress = readProgress();
  const { id } = scratchShape();
  progress.scratchShapes = progress.scratchShapes || {};
  scratchUsernames.forEach((username) => {
    progress.scratchShapes[username] = id;
  });
  writeProgress(progress);
}

/** Deploys the app into every scratch org that has not had it yet, then its permissions and data. */
export async function seedScratchOrgs(usernames, options = {}) {
  const todo = Object.keys(usernames).filter((alias) => options.force || !alreadySeeded(alias, usernames[alias]));
  Object.keys(usernames)
    .filter((alias) => !todo.includes(alias))
    .forEach((alias) => ok(`${c.bold(alias)} already has the Helios app and its data.`));
  if (todo.length === 0) {
    return;
  }

  info(`Deploying the Helios Delivery app into ${todo.join(", ")}.`);
  info(c.dim("    A few minutes, all three at once."));
  const failed = await deployAppToAll(todo);
  if (failed.length > 0) {
    failed.forEach(({ target, output }) => {
      warn(`The deployment to ${target} failed:`);
      info(c.dim(output.split("\n").slice(-25).join("\n")));
    });
    abort(
      "The Helios app could not be deployed everywhere.",
      "Click Set up my training environment again: orgs that are already done are skipped."
    );
  }
  ok("The app is deployed.");

  const owner = options.ownerName || null;
  for (const alias of todo) {
    if (owner) {
      nameAdminUser(alias, usernames[alias], owner);
    }
    if (!grantManager(alias, { quiet: true })) {
      warn(`The Helios Delivery Manager permission set could not be assigned in ${alias}.`);
    }
    info(`Loading the sample data into ${c.bold(alias)}.`);
    const data = loadData(alias, { quiet: true });
    if (!data.ok) {
      info(c.dim(data.output.split("\n").slice(-25).join("\n")));
      abort(
        `The data load into ${alias} failed.`,
        "Click Set up my training environment again: the load is an upsert and repeats safely."
      );
    }
    recordSeeded(alias, usernames[alias]);
    ok(`${c.bold(alias)} holds the app, your permission set and the sample data.`);
  }
}

/**
 * The first and last name of the person who signed up for the Dev Hub.
 *
 * A scratch org's own user is called "User User". Every change a learner makes
 * is recorded under that name, and a list of changes where every row says
 * "User User" teaches nothing about reading who did what.
 */
export function devHubOwnerName(devHub) {
  const display = runJson("sf", ["org", "display", "--target-org", devHub, "--json"]);
  const username = display?.result?.username;
  if (!username) {
    return null;
  }
  const res = runJson("sf", [
    "data", "query", "--query", `SELECT FirstName, LastName FROM User WHERE Username = '${username}'`,
    "--target-org", devHub, "--json"
  ]);
  const user = res?.result?.records?.[0];
  return user?.LastName ? { firstName: user.FirstName || "", lastName: user.LastName } : null;
}

/** Gives the scratch org's user the learner's name. Cosmetic, so a failure is silent. */
function nameAdminUser(alias, username, owner) {
  const quote = (value) => String(value).replace(/'/g, "");
  run("sf", [
    "data", "update", "record", "--sobject", "User",
    "--where", `Username='${quote(username)}'`,
    "--values", `FirstName='${quote(owner.firstName)}' LastName='${quote(owner.lastName)}'`,
    "--target-org", alias
  ], { quiet: true, capture: true });
}

/**
 * Makes the project know its Dev Hub and your development org.
 *
 * New User Story lists the scratch orgs of the default Dev Hub, and every
 * command without an explicit org acts on the default org. Both are local to
 * this folder, in the git-ignored .sf directory, so nothing is committed.
 */
function pointProjectAt(devHub, devAlias) {
  run("sf", ["config", "set", `target-dev-hub=${devHub}`, `target-org=${devAlias}`], { quiet: true, capture: true });
  ok(`This project now uses ${c.bold(devHub)} as its Dev Hub and ${c.bold(devAlias)} as its default org.`);
}

// --------------------------------------------------------------- the fork
async function ensureFork(handle) {
  step(1, "Your own copy of the repository");

  const slug = repoSlug();
  if (slug && slug.toLowerCase() !== UPSTREAM.toLowerCase()) {
    ok(`origin already points at ${c.bold(slug)}.`);
    git(["fetch", "origin"], { quiet: true });
    ensurePipelineBranches();
    return slug;
  }

  const fork = `${handle}/sfdx-hardis-training`;
  const existing = ghJson(["repo", "view", fork, "--json", "name"]);
  if (existing) {
    info(`You already have a fork at ${c.bold(fork)}.`);
  } else {
    info(`Forking ${c.bold(UPSTREAM)} into your account.`);
    // No --default-branch-only: this course needs every branch, and that option
    // is the single most common way a learner ends up with a fork that cannot
    // work. The web form calls it "Copy the main branch only".
    // No --remote either: gh refuses that flag (any value) once a repository is
    // named, before it contacts GitHub. Named, it adds no remote anyway, and the
    // remotes are set below.
    // Captured, because the panel only shows what goes through info() and warn():
    // what gh prints itself lands in an output channel nobody has open.
    const res = run("gh", ["repo", "fork", UPSTREAM, "--clone=false"], { capture: true });
    if (res.code !== 0) {
      // Three lines and a link beat "fork it by hand": the web form has one box
      // that has to be unticked, and a learner who misses it gets a fork the
      // course cannot work in.
      warn("The fork could not be created from here.");
      // gh's own words first: a local error must not read as "GitHub refused it"
      const said = (res.stderr || res.stdout).trim();
      if (said) {
        info("");
        info("  The GitHub CLI said:");
        for (const line of said.split(/\r?\n/)) {
          info(`    ${line}`);
        }
      }
      info("");
      info("  When GitHub refuses it, the usual reasons are a repository of that name");
      info("  already in your account, an organisation that does not allow forks, or a");
      info("  sign-in without permission to create repositories.");
      info("");
      info("  Make it yourself, it is one screen:");
      info(`    1. Open ${c.cyan(`https://github.com/${UPSTREAM}/fork`)}`);
      info("    2. Leave the owner on your own account and the name as it is");
      info(`    3. ${c.bold('Untick "Copy the main branch only"')}. The course needs every branch`);
      info("    4. Click Create fork, and wait for the page to land on your copy");
      info("");
      abort("The fork could not be created.", "Make it as described above, then run this again.");
    }
    ok(`Your fork is ${c.bold(fork)}.`);
  }

  // The clone was made from the shared repository, so origin still points there
  // and no push would ever be allowed. The fork becomes origin and the shared
  // repository stays reachable as upstream.
  if (gitOut(["remote"]).split("\n").includes("upstream")) {
    git(["remote", "remove", "upstream"], { quiet: true });
  }
  git(["remote", "rename", "origin", "upstream"]);
  git(["remote", "add", "origin", `https://github.com/${fork}.git`]);
  // A fork that was created a second ago can refuse the first read
  let fetched = git(["fetch", "origin"]);
  for (let attempt = 0; fetched.code !== 0 && attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    fetched = git(["fetch", "origin"], { quiet: true });
  }
  if (fetched.code !== 0) {
    abort(
      "Your fork exists but git could not read it.",
      "Sign in to GitHub in VS Code (Accounts, bottom left) and run this again."
    );
  }
  ok(`origin is now ${c.bold(fork)}, and the shared repository is upstream.`);
  ensurePipelineBranches();
  return fork;
}

/**
 * GitHub switches issues off on every new fork, and sfdx-hardis keeps the list of the development
 * orgs (Lab 1.3 registers helios-dev in it) in an issue of the repository: without them, New User
 * Story warns that it could not register the org. Never stops the setup.
 */
async function ensureIssues(slug) {
  // A fork that was created a second ago can refuse the first read, as in ensureFork
  let repo = ghJson(["api", `repos/${slug}`]);
  for (let attempt = 0; !repo && attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    repo = ghJson(["api", `repos/${slug}`]);
  }
  if (!repo) {
    warn(
      `Could not read the settings of ${slug}, so issues may still be off there. ` +
        "On GitHub: Settings > General > Features, tick Issues, or run Set up my training environment again."
    );
    return;
  }
  if (repo.has_issues) {
    return;
  }
  const res = run("gh", ["repo", "edit", slug, "--enable-issues"], { capture: true, quiet: true });
  if (res.code === 0) {
    ok(`Issues switched on in ${c.bold(slug)}: sfdx-hardis keeps the list of your development orgs in one.`);
  } else {
    warn(
      `Issues could not be switched on in ${slug}. ` +
        "On GitHub: Settings > General > Features, tick Issues, or run Set up my training environment again."
    );
  }
}

/**
 * integration and uat, created from the state a Level 1 learner starts
 * from when the fork does not carry them yet. main exists in every fork.
 */
export function ensurePipelineBranches() {
  const base = ["origin/training/start-level-1", "origin/main"].find((ref) => gitOut(["rev-parse", "--verify", "--quiet", ref]));
  for (const branch of PIPELINE_BRANCHES) {
    if (gitOut(["ls-remote", "--heads", "origin", branch])) {
      continue;
    }
    if (!base || git(["push", "origin", `${base}:refs/heads/${branch}`], { quiet: true, capture: true }).code !== 0) {
      abort(
        `The ${branch} branch could not be created in your fork.`,
        "Check that VS Code can push to GitHub (Accounts, bottom left), then run this again."
      );
    }
    ok(`Created the ${c.bold(branch)} branch in your fork.`);
  }
  git(["fetch", "origin"], { quiet: true, capture: true });
}

// ------------------------------------------------------------- actions on
// The workflow files of the fork, read from its default branch, or null when
// they cannot be read. One name per line rather than JSON: the contents API
// answers with an array, and parseJsonOutput reads objects only.
function workflowFiles(slug) {
  const res = run("gh", ["api", `repos/${slug}/contents/.github/workflows`, "-q", ".[].name"], {
    capture: true,
    quiet: true
  });
  if (res.code !== 0) {
    return null;
  }
  return res.stdout
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter((name) => /\.ya?ml$/.test(name));
}

/**
 * Every workflow of the fork that GitHub parked, put back to work.
 *
 * A fork arrives with Actions allowed and its workflows in `disabled_fork`,
 * which is a different switch from the repository permission above. It has an
 * API of its own: enable each parked workflow, then read them back.
 *
 * A brand new fork is one step earlier: it lists no workflow at all, because
 * GitHub registers them only once the owner clicks the banner of the Actions
 * tab, and that banner has no API. An empty list next to workflow files is that
 * banner, not a fork with nothing left to enable: reading it as success is how
 * the push of step 7 started no job at all.
 *
 * Returns { parked, banner }: the names still parked, empty when they all run,
 * and whether the banner is what holds them. Returns null when GitHub could not
 * be read, which says nothing either way.
 */
function enableForkWorkflows(slug) {
  const listed = ghJson(["api", `repos/${slug}/actions/workflows`, "--paginate"]);
  if (!Array.isArray(listed?.workflows)) {
    return null;
  }
  const workflows = listed.workflows;
  if (workflows.length === 0) {
    const files = workflowFiles(slug);
    return files === null ? null : { parked: files, banner: files.length > 0 };
  }
  for (const workflow of workflows) {
    if (workflow.state === "active") {
      continue;
    }
    run("gh", ["api", "-X", "PUT", `repos/${slug}/actions/workflows/${workflow.id}/enable`], {
      capture: true,
      quiet: true
    });
  }
  const after = ghJson(["api", `repos/${slug}/actions/workflows`, "--paginate"]);
  // A read that fails says nothing either way, and claiming success on it is
  // how a learner ends up with a Pull Request nothing ever checks
  const read = Array.isArray(after?.workflows) ? after.workflows : workflows;
  const parked = read.filter((workflow) => workflow.state !== "active").map((workflow) => workflow.name);
  return { parked, banner: false };
}

async function ensureActions(slug, { wait = true } = {}) {
  step(2, "Actions turned on");

  const permissions = ghJson(["api", `repos/${slug}/actions/permissions`]);
  if (permissions?.enabled !== true) {
    run("gh", [
      "api", "-X", "PUT", `repos/${slug}/actions/permissions`,
      "-F", "enabled=true", "-f", "allowed_actions=all"
    ], { capture: true, quiet: true });
  }

  const enabled = ghJson(["api", `repos/${slug}/actions/permissions`])?.enabled === true;
  let state = enabled ? enableForkWorkflows(slug) : null;

  // The banner has no API: the learner clicks it, and this waits for that
  // click. Now rather than at the end, because step 7 pushes to integration and
  // that push only starts its deployment job once the workflows run. Only for
  // the banner: a workflow GitHub refused to enable has no banner to click.
  if (wait && state?.banner) {
    const url = `https://github.com/${slug}/actions`;
    info("    GitHub keeps the workflows of a new fork switched off until you say otherwise.");
    info(`    Your browser opens ${c.cyan(url)}: click`);
    info(`    ${c.bold("I understand my workflows, go ahead and enable them")}, then come back here.`);
    openUrl(url);
    info(c.dim(`    Waiting for that click, up to ${ACTIONS_WAIT_MINUTES} minutes...`));
    const until = Date.now() + ACTIONS_WAIT_MINUTES * 60 * 1000;
    while (state?.parked.length !== 0 && Date.now() < until) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      // A read that fails, a network blip or a rate limit, keeps what was known
      state = enableForkWorkflows(slug) || state;
    }
  }

  const parked = state?.parked || [];
  if (enabled && state && parked.length === 0) {
    ok("Actions are on, and every workflow of your fork runs.");
    return true;
  }

  // Two different switches, and the second one is the one a learner meets as an
  // empty Checks tab on a Pull Request that looks perfectly fine.
  warn(
    !enabled
      ? "Actions could not be turned on from here."
      : state
        ? `Actions are on, but ${parked.length} workflow(s) are still parked: ${parked.join(", ")}.`
        : "Actions are on, but GitHub did not say whether the workflows of your fork run."
  );
  info(`    Open ${c.cyan(`https://github.com/${slug}/actions`)} and click`);
  info(`    ${c.bold("I understand my workflows, go ahead and enable them")}.`);
  info("    It is one click. Then run this command again, which checks that they run.");
  info("");
  info("    If a Pull Request is already open, its checks will not start on their own");
  info(`    afterwards. Run ${c.bold("Training > Trigger my workflows")} once and they will.`);
  return false;
}

// ------------------------------------------------------- the branch config
/**
 * The file a stage carries, keeping what a later level added to it.
 *
 * Level 3 gives uat a preprod merge target, and preprod and main a login URL of
 * their own. Rewriting the file whole on every setup would quietly undo that
 * work, and the learner would find out from a failed deployment. So an existing
 * file only has its org and its login URL refreshed, and everything else it
 * carries is left alone.
 */
function mergeBranchConfigText(previous, stage, username) {
  if (!previous.trim()) {
    return branchConfigText(stage, username);
  }
  let text = previous;
  const set = (key, value) => {
    const line = `${key}: ${value}`;
    const pattern = new RegExp(`^${key}:.*$`, "m");
    text = pattern.test(text) ? text.replace(pattern, line) : `${text.replace(/\s*$/, "")}\n${line}\n`;
  };
  set("targetUsername", username);
  // A scratch org logs in like a sandbox. An org somebody pointed elsewhere on
  // purpose, a Developer Edition at Level 3, keeps the URL it was given.
  // An empty value is the course template, not a choice somebody made
  if (!/^instanceUrl:[ \t]*["']?https?:/m.test(text) || /test\.salesforce\.com/.test(text)) {
    set("instanceUrl", "https://test.salesforce.com");
  }
  if (!/^mergeTargets:[ \t]*(\[[ \t]*[^\]\s]|\r?\n[ \t]*-)/m.test(text) && stage.mergeTargets.length > 0) {
    set("mergeTargets", `[${stage.mergeTargets.join(", ")}]`);
  }
  return text;
}

function branchConfigText(stage, username) {
  return [
    `# Which org the ${stage.branch} branch deploys to, and where its work goes next.`,
    "# Written by Set up my training environment, and editable in the",
    `# DevOps Pipeline panel: gear menu > Pipeline Settings, scope Branch: ${stage.branch}.`,
    `targetUsername: ${username}`,
    // A scratch org logs in through test.salesforce.com, like a sandbox. The CI
    // job of Levels 1 and 2 does not read it, the JWT login of Level 3 does.
    "instanceUrl: https://test.salesforce.com",
    `mergeTargets: [${stage.mergeTargets.join(", ")}]`,
    ""
  ].join("\n");
}

/**
 * Writes one file per stage, on integration, and pushes them.
 *
 * integration carries the configuration of every major branch, because the
 * pipeline panel and the deployment job read it from whichever branch they are
 * on. The badge job clones the fork and re-runs the checks against what is in
 * it, so a setting that never left the machine counts as not done. Doing it here
 * also spares the learner a commit straight to a major branch, which the rest of
 * the course tells them never to make.
 */
export function writeBranchConfigs(pipeline, usernames, slug = null) {
  const files = pipeline.map((stage) => ({
    relative: `config/branches/.sfdx-hardis.${stage.branch}.yml`,
    stage,
    username: usernames[stage.alias]
  }));
  const original = gitOut(["rev-parse", "--abbrev-ref", "HEAD"]);
  let published = true;

  // Written on the development branch only. uat receives them with its first
  // promotion, in Lab 3.5: a copy committed on uat as well would conflict with
  // every later change to the same files on integration (Lab 3.1), and
  // the pipeline panel and the audit read them from integration anyway.
  for (const stage of pipeline.slice(0, 1)) {
    const branch = stage.branch;
    if (gitOut(["rev-parse", "--abbrev-ref", "HEAD"]) !== branch) {
      const checkout = gitOut(["rev-parse", "--verify", "--quiet", branch])
        ? git(["checkout", branch], { quiet: true, capture: true })
        : git(["checkout", "-b", branch, "--track", `origin/${branch}`], { quiet: true, capture: true });
      if (checkout.code !== 0) {
        warn(`Could not switch to ${branch}: you have changes git would have to overwrite.`);
        info(`    Commit or discard them in the Source Control panel, then run this again.`);
        published = false;
        continue;
      }
    }
    git(["pull", "--ff-only", "origin", branch], { quiet: true, capture: true });

    const changed = [];
    for (const file of files) {
      const absolute = path.join(ROOT, file.relative);
      const previous = fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : "";
      const content = mergeBranchConfigText(previous, file.stage, file.username);
      if (previous !== content) {
        fs.mkdirSync(path.dirname(absolute), { recursive: true });
        fs.writeFileSync(absolute, content, "utf8");
        changed.push(file.relative);
      }
    }
    if (changed.length > 0) {
      git(["add", "--", ...changed], { quiet: true });
      const committed = run("git", ["commit", "-m", "Point the pipeline at my training orgs", "--", ...changed], { capture: true, quiet: true });
      if (committed.code !== 0) {
        warn(`Could not commit the branch configuration on ${branch}.`);
        info("    Git needs a name and an email first: Source Control panel, then commit once by hand.");
        published = false;
        continue;
      }
    }
    const unpushed = gitOut(["log", "--oneline", `origin/${branch}..${branch}`]) !== "";
    // From the second run on, the branch is protected and refuses a direct push:
    // this one is the course fixing its own configuration, so it goes through.
    const pushed = () => withProtectionLifted(slug, [branch], () => git(["push", "origin", branch], { quiet: true, capture: true }));
    if (unpushed && pushed().code !== 0) {
      warn(`Committed on ${branch}, but could not push it.`);
      info("    Push it from the Source Control panel when you can.");
      published = false;
      continue;
    }
    ok(changed.length > 0 ? `${c.bold(branch)} now names the org of every branch, and is pushed.` : `${c.bold(branch)} was already right.`);
  }

  // Leave the learner on integration, where Lab 1.3 starts. Coming from main, the
  // branch the clone opened on, there is nothing to go back to.
  const home = original === "main" || original === "HEAD" ? pipeline[0].branch : original;
  if (gitOut(["rev-parse", "--abbrev-ref", "HEAD"]) !== home) {
    git(["checkout", home], { quiet: true, capture: true });
  }
  return published;
}

// ----------------------------------------------------------- the secrets
export function setSecrets(slug, pipeline) {
  for (const stage of pipeline) {
    const secret = `SFDX_AUTH_URL_${stage.branch.toUpperCase()}`;
    const auth = runJson("sf", ["org", "auth", "show-sfdx-auth-url", "--target-org", stage.alias, "--json"]);
    const url = auth?.result?.sfdxAuthUrl;
    if (!url || !url.startsWith("force://")) {
      abort(
        `Could not read an auth URL for ${stage.alias}.`,
        "Click Set up my training environment again. If it fails the same way, the scratch org may have expired."
      );
    }
    const res = run("gh", ["secret", "set", secret, "--repo", slug, "--body", url], { quiet: true, capture: true });
    if (res.code !== 0) {
      // The value is printed so the secrets form can be filled without a terminal.
      // It is a refresh token for a throwaway scratch org, in the learner's own
      // repository, and Level 3 replaces it with a certificate.
      warn(`Could not write the ${secret} secret from here.`);
      info(`    Open https://github.com/${slug}/settings/secrets/actions`);
      info(`    New repository secret, named ${c.bold(secret)}, with this value:`);
      info("");
      info(`    ${url}`);
      info("");
      continue;
    }
    ok(`${secret} is set on ${c.bold(slug)}.`);
  }
  info(c.dim("    Each holds a long-lived refresh token for a throwaway scratch org."));
  info(c.dim("    Lab 3.1 uses JWT certificates for preprod and main, and leaves these two as they are."));
}

// --------------------------------------------------------------------- main
export default async function init(args) {
  const { devHub: devHubDef, scratch } = trainingOrgs();
  const pipeline = levelOnePipeline();
  const devAlias = scratch.find((o) => o.branch === null).alias;

  title("Set up my training environment");
  info("From your one Developer Edition org to a pipeline you can push a User Story through:");
  info("  your copy of the repository, three scratch orgs holding the Helios app,");
  info(`  and the ${pipeline.map((s) => s.branch).join(" and ")} branches deploying to two of them.`);
  info("");
  info(c.dim("This exists for the course only. On a real project the orgs and the pipeline are"));
  info(c.dim("already there, and nobody asks a new contributor to build them on their first day."));
  info("");

  const signedInNow = await ensureGh();
  // Before anything reads the account: the fork, and the name of the commits.
  // Only while there is no fork yet: once origin is the fork, it is in the
  // account it is in, and asking again would only make a learner doubt it.
  const slugBefore = repoSlug();
  const forkMade = slugBefore && slugBefore.toLowerCase() !== UPSTREAM.toLowerCase();
  if (!forkMade && !signedInNow) {
    if (!(await confirmGhAccount(args.account, { assumeYes: args.yes === true }))) {
      info("Nothing was changed. Click Set up my training environment again when you know which account to use.");
      return;
    }
  }
  const handle = currentHandle();
  if (!handle) {
    abort("Could not read your GitHub account.", "Click Set up my training environment again.");
  }
  info(`Signed in to GitHub as ${c.bold(handle)}.`);
  ensureGitIdentity();

  const orgs = connectedOrgs().filter((o) => o.connected);
  if (orgs.filter((o) => !o.isScratch).length === 0) {
    abort(
      "No connected org was found.",
      `Connect your Developer Edition org in the Orgs Manager panel first, and name it ${devHubDef.alias}. Lab 1.2 shows how.`
    );
  }
  const devHub = await findDevHub(orgs, args.org);

  info(c.dim(`    Your user in ${devHub} will work in English from now on, like the scratch orgs and the labs.`));
  if (!args.yes && !(await confirm(`Build your training environment from ${devHub}?`, true))) {
    info("Nothing was changed.");
    return;
  }

  const slug = await ensureFork(handle);
  await ensureIssues(slug);
  // --no-actions-wait: for automation with no browser, where nobody can click the banner
  const actionsOn = await ensureActions(slug, { wait: args["no-actions-wait"] !== true });

  step(3, "Your Dev Hub");
  await ensureDevHub(devHub);
  // Before the scratch orgs, which are all created in English: see workInEnglish.
  if (!workInEnglish(devHub)) {
    warn(`The language of your user in ${devHub} could not be set to English. Set it yourself: your picture, top right > Settings > Language & Time Zone.`);
  }

  step(4, "Your three scratch orgs");
  const usernames = await ensureScratchOrgs(devHub, scratch.map((o) => o.alias));
  await alignScratchOrgs(usernames);
  pointProjectAt(devHub, devAlias);

  step(5, "The Helios app in each of them");
  await seedScratchOrgs(usernames, { force: args.reseed === true, ownerName: devHubOwnerName(devHub) });

  // Before the branch configuration, because pushing that starts the deployment
  // job of integration straight away: written after, the job runs with no
  // credential and the learner's pipeline is red before Lab 1.3.
  step(6, "The credentials the CI jobs use");
  // Lab 3.1 moves only preprod and main to JWT, and integration and uat keep these
  // secrets: running this again, to rebuild an expired scratch org, writes them
  // again. A fork that walked the earlier Lab 3.1 moved all four branches to JWT
  // (encryptedCert) and deleted the secrets, and must not get the shortcut back.
  const projectConfig = gitOut(["show", `origin/${pipeline[0].branch}:config/.sfdx-hardis.yml`]);
  if (/^orgAuthenticationMode:[ \t]*["']?encryptedCert/m.test(projectConfig)) {
    ok("The pipeline logs in with JWT keys since Lab 3.1: no auth URL secret is written.");
  } else {
    setSecrets(slug, pipeline);
  }

  step(7, "Which org each branch deploys to");
  const published = writeBranchConfigs(pipeline, usernames, slug);

  // After the branch configuration, which is pushed straight to integration:
  // protecting the branch first would refuse that push.
  step(8, "Changes through a Pull Request, merged once green");
  info(c.dim(`    A Pull Request into ${pipeline.map((s) => s.branch).join(" or ")} merges only once ${REQUIRED_CHECKS.join(" and ")} are green.`));
  const protectedBranches = protectBranches(slug, pipeline.map((s) => s.branch));
  // Only once the major branches are protected: that is what keeps them when a
  // promotion, whose source is a major branch, is merged.
  if (protectedBranches) {
    deleteMergedBranches(slug, pipeline.map((s) => s.branch));
  }

  title("Done");
  info(`Your fork:               https://github.com/${slug}`);
  info(`Your Dev Hub:            ${devHub}`);
  info(`Where you build:         ${devAlias}`);
  for (const stage of pipeline) {
    info(`${`${stage.branch} deploys to:`.padEnd(25)}${stage.alias}`);
  }
  info("");
  if (!actionsOn) {
    warn("One thing is left for you: turn Actions on, as printed above.");
  }
  if (!published) {
    warn("The branch configuration is not published yet: see the messages above.");
  }
  if (!protectedBranches) {
    warn("A branch is not protected yet: see the messages above.");
  }
  info(c.dim(`The scratch orgs live ${DURATION_DAYS} days. When one expires, click this again: it rebuilds only that one.`));
}
