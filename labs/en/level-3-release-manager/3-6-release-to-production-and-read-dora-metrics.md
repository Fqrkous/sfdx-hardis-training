---
id: lab-3-6
title: "Lab 3.6 - Release to production and read your DORA metrics"
description: "Release through preprod to your production org, verify it, then read deployment frequency, lead time and failure rate in the DORA metrics panel."
level: 3
lab: 6
lang: en
source_rev: ""
screenshots:
  - annotated/vscode/orgs-manager
  - annotated/vscode/pipeline-settings-menu-level3--dora
  - annotated/vscode/dora-metrics
  - annotated/vscode/dora-metrics-production
  - annotated/vscode/dora-metrics-export-menu
depends_on:
  commands: [hardis:doc:dora-report, hardis:project:deploy:smart]
  flags: [--data-only, --compare, --period, --refresh]
  config: [productionBranch, mergeTargets]
  panels: [pipeline, doraMetrics, commandExecution]
  docs: [salesforce-devops-deploy-major-branches, hardis/doc/salesforce-devops-dora-report]
---

# Lab 3.6 - Release to production and read your DORA metrics

**Level**: 3 Release Manager

**Time**: ~1 h<!-- observed --> (observed: median 1 h 01, 14 learners, fastest 20 min)<!-- /observed -->

**You will**: release to production, and then measure whether your pipeline is any good.

## The situation

UAT signed off. The release goes to production this evening.

This is the same mechanism as [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md), twice: `uat` into `preprod`, then `preprod` into `main`. With one
difference that is not technical: if you get it wrong, real people cannot do their jobs tomorrow.
Everything in this lab that looks like ceremony is there because somebody skipped it once.

## Before you start

- [ ] [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md) finished: `uat` carries the release and the testers signed it off
- [ ] `helios-preprod` and `helios-prod` connected, seeded, and configured as the `preprod` and
      `main` orgs in Lab 3.1
- [ ] JWT authentication working for `preprod` and `main`

## Steps

### 1. Check the three things that are worth checking

Goal: three answers before you create anything: UAT signed off, the manual steps known, production
where you think it is.
Refresher: [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md)

Before creating anything:

#### Do

1. One: is UAT genuinely signed off? Not "the deployment was green". Somebody tested it and said
   yes. On this project that person is you, and you did it in [Lab 3.5 step 6](3-5-promote-to-uat-and-write-release-notes.md#6-verify-with-a-testers-eyes)
2. Two: what manual steps will this carry? Look at the deployment actions of the stories going out
3. Three: is production where you think it is? Open `helios-prod` and look

#### Why

A manual step in production is something you will do, live, in front of nobody, at whatever time the
release is. Know about it now.

On a real project, admins change production by hand between two releases, and [Lab 3.7](3-7-hotfix-and-retrofit.md) is about
exactly that. Assume nothing.

#### You should now see

- The manual steps of the release, known before you create anything
- `helios-prod` carrying what the course seeded into it and nothing else yet

### 2. Rehearse in preprod

Goal: the release deployed to `helios-preprod` and checked there, before production.
Refresher: [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md), [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md)

#### Do

1. Click the **+ PR** chip on the arrow from `uat` to `preprod`, in the DevOps Pipeline diagram, the
   same way you created the promotion in [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md). GitHub opens on the Pull Request from `uat` into
   `preprod`
2. Title it plainly, then click **Create pull request**:

   > Promotion 2026-09 to preprod

3. Look at the first JWT login of the course once: open the check from **Checks**, expand **Login &
   Simulate deployment**, and look for `sf org login jwt`
4. Its first check stops red, on purpose. Do the click of the deliverability step of US-026 in
   `helios-preprod`
5. Tick its box in the sfdx-hardis comment (or **Mark as done in preprod** in the VS Code
   **Deployment Actions** tab), then **Re-run all jobs** on the check. It goes green
6. Read the check, merge, and watch the **Process Deployment (sfdx-hardis)** run on `preprod`
7. Open `helios-preprod` and do the checks of step 6 there first

#### Why

Its check job is the first one to log into `helios-preprod`, and it does so with the key and the
secrets of [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md). The `sf org login jwt` line, and the job carrying on past it, are your
`preprod` key working, even on the first run, which stops red further down for another reason.

That reason is the one of the promotion to `uat` in [Lab 3.5 step 4](3-5-promote-to-uat-and-write-release-notes.md): the deliverability step of US-026
runs before the deployment, and nobody has done it in `helios-preprod`.

This is what `preprod` is for. It holds what production holds, nobody works in it, and a release
that deploys there cleanly and behaves has very little left to surprise you with in production. A
release that fails here has cost you nothing.

#### You should now see

- `sf org login jwt` in the log of the check, and the job carrying on past it
- A green **Process Deployment (sfdx-hardis)** run on `preprod`, and the release behaving in
  `helios-preprod`

### 3. Create the production Pull Request

Goal: the production Pull Request from `preprod` into `main`, with a green check to read.

#### Do

1. Click the **+ PR** chip on the arrow from `preprod` to `main`, from `preprod` into `main`
2. Title it plainly, then click **Create pull request**:

   > Release 2026-09 to production

3. In the log of its check job, look for `sf org login jwt`, as in step 2
4. Its first check stops red for the same reason as in step 2. Do the click in production, tick the
   box, and click **Re-run all jobs**

#### Why

Its check job is the first JWT login into `helios-prod`. And `helios-prod` is the last org where
nobody has done the deliverability step.

#### You should now see

- The green check that follows the re-run, ready to read

### 4. Read the check like it matters

Goal: you know whether this release deletes anything in production, and how long it will take.
Refresher: [Lab 3.2](3-2-review-a-contributor-pull-request.md)

#### Do

1. When the check finishes, read the sfdx-hardis comment the way [Lab 3.2](3-2-review-a-contributor-pull-request.md) taught
2. Add the two questions of the table below, which only apply to production

| Question                 | Where to look                                                                                                                              |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Does it delete anything? | The `deleted` figure in the **Metadata** row, shown only when something goes. A deletion in production is permanent and takes data with it |
| How long will it take?   | The check duration is a reasonable estimate. If it is 40 minutes, that is 40 minutes during which the org is being modified                |

!!! warning "Careful"
    If that `deleted` figure is there and you were not expecting it, stop. The comment will not tell
    you what is going: `manifest/destructiveChanges.xml` and the diff will. Find out what it is and
    who intended it.

#### Why

Stopping on an unexpected deletion is not being careful, that is the job.

#### You should now see

- Your answer to both questions: a `deleted` figure or none, and the duration of the check

### 5. Merge, and stay

Goal: a green deployment on `main`, watched to its end, and its post-deployment manual steps done.
Refresher: [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md)

#### Do

1. Merge. The **Process Deployment (sfdx-hardis)** run starts, this time on `main`
2. Watch it
3. When it finishes, do the post-deployment manual steps, if any, then check the org

#### Why

Not because you can do anything while it runs, but because knowing whether it failed at
minute two or minute thirty-five changes what you do next.

The pre-deployment ones belong before the merge: do them, tick their boxes in the check comment,
then merge, and the deployment job records them, as in [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md).

#### You should now see

- A green **Process Deployment (sfdx-hardis)** run on `main`

### 6. Verify in production

Goal: the two stories working in `helios-prod`, and something that already worked still working.

#### Do

1. Open **Orgs Manager** and find `helios-prod` by its alias **(2)**
2. Check it says **Connected** **(3)**, then **Open** from the actions menu at the end of its row. A
   disconnected row offers **Reconnect** in that same menu; **Add Org** **(1)** is for an org the
   table does not have

   ![The Orgs Manager table, with the alias and connection state of each org](../../_assets/annotated/vscode/orgs-manager.png)

3. Then check, the same as UAT and with more care, that the two stories work
4. Check something that was already working still works: open an installation, check the timeline
   component, save a record

#### Why

That last check exists because the most common production incident after a release is not the new
feature failing. It is an old one.

#### You should now see

- The two stories working in `helios-prod`
- An installation that opens, its timeline component, and a record that saves

### 7. Now measure the pipeline

Goal: the DORA metrics of your pipeline on screen, and their frame, flow and five numbers read.
Refresher: [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md), [Lab 1.2](../level-1-contributor-basics/1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md)

You have shipped. The question a release manager gets asked next is "how are we doing", and it
deserves a better answer than a feeling.

#### Do

1. Open the **DevOps Pipeline** panel, click the gear **(1)** at the top right, and choose
   **Generate DORA Metrics** **(2)**

   ![The gear menu of the DevOps Pipeline panel, open on Generate DORA Metrics](../../_assets/annotated/vscode/pipeline-settings-menu-level3--dora.png)

2. A **DORA metrics** tab opens and says, for a few seconds, that it is reading deployment jobs and
   Pull Requests from GitHub. It lands on its **Overview** tab

   ![The Overview tab of the DORA metrics panel, with the pipeline flow and one row per major org](../../_assets/annotated/vscode/dora-metrics.png)

3. Read the frame before the numbers:

   - The period **(1)** is **Last 90 days** unless you pick 30, 180 or 365
   - The line under the title **(2)** names the repository and the dates of the period, then says
     where the data of a branch starts when that is more than a week after the period does. Here it
     says so for all four branches: your pipeline is younger than the period it is measured over
   - **Pipeline flow** **(3)** follows your User Stories from one org to the next. You read it in
     a moment, below
   - **Needs attention** **(4)** is there only when sfdx-hardis has something to point at, each line
     with the branch it is about and, when there is something to open, an **Open** button. It knows
     five cases: the last deployment job of a branch failed, Pull Requests have been open for more
     than 7 days, the failure rate is above 10 % and rose by 5 points since the period before, nothing
     was deployed for 30 days, User Stories have been waiting in an org for more than 30 days. If you
     sent US-020 back more than a week ago, it is on that list, and rightly so: a Pull Request nobody
     merges and nobody closes is a decision somebody is not making
   - The table **(5)** holds one row per major org, in the order of the pipeline, with `main` marked
     **production**. A row opens the tab of its branch, the one of `main` being **(6)**

4. Read **Pipeline flow** from left to right:

   - Each box is an org of the pipeline. It says how many User Stories are in that org and went no
     further, and how long the oldest has been there. Yours all read **Nothing waiting**: you have
     just released everything. On a real project this is where a release manager looks first, and a
     click on a box lists the User Stories waiting in it
   - Between two boxes, the arrow carries the median wait: the days between the deployment of a User
     Story in one org and its deployment in the next. Yours waited **4 d** in `integration`,
     **0.8 d** in `uat` and **0.2 d** in `preprod`. The longest of them is marked **Longest wait**
   - **Time to production (median)**, on the right, is the whole trip: from the creation of the Pull
     Request of a User Story to the end of the job that deployed it to production. **5.7 d, High**,
     over the ten User Stories you delivered
   - **Slowest changes to reach production** opens the list behind that number, each User Story with
     the day it reached each org. The slowest is the first one you ever merged: it waited for the
     pipeline to exist

5. Read the five numbers each row carries, with the table below. Each one is rated **Elite**,
   **High**, **Medium** or **Low**, on the same scale for every branch, or reads **No data**

| Column                   | What it actually counts                                                                          | What good looks like                                                                        |
|--------------------------|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| **Deployments per week** | Successful runs of the deployment job of the branch, divided by the length of the period         | Weekly is fine. Quarterly means every release is enormous                                   |
| **Lead time (median)**   | Per User Story that reached the org: the creation of its Pull Request, to its deployment there   | Days, not weeks. A long lead time means work is sitting somewhere                           |
| **Failure rate**         | Failed deployment jobs, divided by failed plus succeeded. A cancelled job is in neither          | Below 15 %. Above that, the check is not catching what it should                            |
| **Recovery (median)**    | Hours from a failed deployment job to the next one that succeeds on the same branch              | Hours                                                                                       |
| **Rework**               | Pull Requests from a fix branch, or successes within a day of a failure, whichever is the larger | Low. Read the note below before you expect [Lab 3.7](3-7-hotfix-and-retrofit.md) to move it |

#### Why

You used **Configure Pipeline Settings** and **Add or Reconnect a Major Org** of the same menu in
[Lab 3.1](3-1-configure-the-pipeline-up-to-production.md). **Configure Org Initialization** and **Configure Replacement Rules** are two settings this
course does not use: [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md#three-settings-this-course-does-not-use) says what
they are for.

The sentence the tab shows while it loads is the whole design. Nothing is asked of any org, so there
is no default org to set first, and two people on the same project read the same numbers. What the
panel needs is the connection to GitHub you gave the extension in [Lab 1.2](../level-1-contributor-basics/1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md).

Pipeline flow answers the question the table cannot: how long does a User Story take to reach
production, and where does it wait. The figures quoted above are the ones of the picture, a learner
who spread the course over a week: yours follow the days your own course took and the number of
User Stories you delivered, and a course done in one sitting reads hours, not days.

A User Story is followed from the Pull Requests alone. Merging `integration` into `uat` carries
every User Story that was in `integration` at that moment, and the days are counted from there.

The column between the first two, named after the number of weeks in the period, draws the
deployments of the branch week by week.

Two of those are not what the names suggest, and it is worth knowing which. Failure rate is the
failure rate of a job: a release that deployed green and broke production on Tuesday does not
appear in it. Recovery is the gap between a red deployment job and the next green one, not
between an incident and its fix. They measure your pipeline, not your org. And the pipeline is all
they see: a deployment made around it, a change set or the seeding **Set up one of my training
orgs** did, is counted nowhere.

#### You should now see

- The **Overview** tab with the **Pipeline flow**, every box reading **Nothing waiting**
- One row per major org, `main` marked **production**

### 8. Read what is there, and know what is missing

Goal: each number of the production tab read for what it really says, and your history found in
`integration`.
Refresher: [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md)

#### Do

1. Click the `main` row, or the **main (production)** tab **(1)**

   ![The main (production) tab of the DORA metrics panel, after one release](../../_assets/annotated/vscode/dora-metrics-production.png)

2. Read the tab: the five numbers as tiles **(2)**, the deployments of each week as bars, green for
   succeeded and red for failed **(3)**, the failed deployments with the time each took to recover
   **(4)**, and the supplementary metrics **(5)**
3. Scroll down for the rest of those, and for two lists that open on a click: the Pull Requests that
   took more than 7 days to merge, and the hotfix Pull Requests
4. Read it number by number, because each one is true and none of them means what a hurried reader
   would take from it:

   - **Deployments: 0.1 / week, Low**. One successful job, divided by a period of 90 days that was
     empty until this week. The rating is about the period, not about you. Pick **Last 30 days** and
     the same single deployment weighs three times as much
   - **Lead time (median): 5.7 d, High**. The time your User Stories took to reach production, each
     one from the creation of its own Pull Request: the number **Time to production** showed on the
     Overview. Under it, **Pull Requests of this branch alone: 0.1 d** is the life of the release Pull
     Request, from the **+ PR** chip to the end of its deployment job. A couple of hours, and it would
     rate Elite. Quoting that one as your lead time would be flattering and wrong: the release was
     quick, the User Stories it carried had been waiting for days
   - **Failure rate: 0 %, Elite**, and **Rework: 0 %, Elite**, over one deployment. One red job next
     week and the first reads 50 %
   - **Recovery (median): No data**. Nothing failed on `main`, so there is nothing to recover from.
     **No data** is the honest answer, not an error

5. Now open the `integration` tab

#### Why

You have shipped once, and this tab says exactly that.

The picture is one learner's evening, and yours will differ in the detail: the dates, a second job
on `main` if you merged twice. The shape will not.

`integration` is where your history is. Over ten deployments, the single failure of [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md) is
ten points of failure rate. Small numbers move in big steps.

That is the honest version of this step, and it is also the point. DORA metrics on a pipeline that
has released once are an empty baseline. They become useful at the fourth or fifth release, when
the numbers have somewhere to move from: the panel then draws an arrow next to each one and prints
its value over the previous period. Today the period before is empty, so there is no arrow.

#### You should now see

- On `main`, one deployment, and no arrow next to any number
- On `integration`, one deployment for every Pull Request merged since you started, and the red job
  of [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md) in **Failed deployments**, with the time until the next green job

### 9. Keep the baseline

Goal: a DORA report in `docs/dora/`, the baseline [Lab 3.11](3-11-capstone-run-a-weekly-release-cycle.md) compares the next one with.

#### Do

1. Open **Export** **(1)** and choose **Markdown report** **(2)**

   ![The Export menu of the DORA metrics panel, open on Markdown report](../../_assets/annotated/vscode/dora-metrics-export-menu.png)

2. When the command panel has finished, its **DORA Metrics Report** button opens the file
3. Keep the file where it is

!!! warning "Careful"
    The file is named after the day, so a second export on the same day replaces it: if you go on to
    [Lab 3.11](3-11-capstone-run-a-weekly-release-cycle.md) today, note the numbers of `integration` and `main` first, or copy the file under another
    name.

#### Why

The numbers on screen are read again each time, so the baseline has to be a file. The other entry,
**PDF report**, writes a PDF as well.

The report is a file, `docs/dora/dora-report-<date>.md`, and **Check my work** looks for it. It is
rebuilt from the jobs and the Pull Requests whenever you export again, so nothing is committed, and
[Lab 3.11](3-11-capstone-run-a-weekly-release-cycle.md) compares the next one with this one.

<details markdown="1"><summary>Under the hood: where the DORA numbers come from</summary>

The panel ran:

    sf hardis:doc:dora-report --agent --data-only --compare --period 90 --json

and **Export** ran the same command without those flags, in the command panel:

    sf hardis:doc:dora-report --period 90

It has **one** source, the git provider, which is the thing to know about it. Until sfdx-hardis
8.16 the deployments were read from the org; they no longer are, and the command does not log into
any org:

- **A deployment is a run of the deployment job of a major branch**, the one a merge starts. On
  GitHub that is a run of the **Process Deployment (sfdx-hardis)** workflow triggered by a push to
  the branch. Runs that no merge started, a scheduled one for instance, are not deployments
- **A validation is the deployment check of a Pull Request**, here a run of **Simulate Deployment
  (sfdx-hardis)**. The **Validation success rate** of the supplementary metrics is built on them
- **The Pull Requests** merged into each major branch, and the ones still open

The jobs are told apart by their name. In a project that renamed them, when no run of a branch is
named as a deployment, every run a push to that branch started counts as one.

It measures every major branch, which means every `config/branches/.sfdx-hardis.<branch>.yml` of
the project, when a person runs it. In a CI job it measures the branch of the job, and `--branches`
names them explicitly. Then, per branch:

- **A merge is deployed** by the successful job of its merge commit, or, when the provider does
  not say which one that is, by the first successful job started within 14 days of the merge. With
  neither, the merge date stands for the deployment
- **Lead time** is counted per User Story: from the creation of its Pull Request to its deployment
  in the org of the tab, whatever merge brought it there. The line under it keeps the older
  reading, the Pull Requests merged into that branch alone, which is also what a notification to
  Grafana carries
- **Rework** takes the larger of two counts, the Pull Requests whose branch starts with `hotfix`,
  `fix` or `bugfix`, and the successful jobs that follow a failed one within 24 hours, and divides
  it by the deployments
- **A cancelled job** is counted apart and enters no rate
- **A job run again on the same commit** replaces its previous result on some providers. On
  GitHub, **Re-run all jobs** keeps the run and its last result, so the checks that stopped red on
  purpose in steps 2 and 3 count as green

How a User Story is followed. No git history is read, only the Pull Requests:

- A Pull Request from a major branch into the next one (`uat` into `preprod`) carries every User
  Story that was in its source branch when it was merged
- A promotion Pull Request, the selective kind of [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md), carries the Pull Requests listed in
  its description and nothing else
- A hotfix merged straight into `preprod` is counted from `preprod`. The merge that brings it
  back down to `integration` does not send it through the pipeline a second time
- A change cherry-picked by hand is not followed, and neither is one merged more than 90 days
  before the period

The steps between the orgs are the `mergeTargets` of each `config/branches/.sfdx-hardis.<branch>.yml`.

One thing to check on any project. Rework recognises a corrective change by its branch name.
This project names its fix branches `fix/`, so the hotfix you ship in [Lab 3.7](3-7-hotfix-and-retrofit.md) counts, in the
**Rework** of `preprod`, the branch it is merged into. Rename that prefix to something else and the
metric quietly reads zero, with no warning. A number built on branch names is only as good as the
naming convention, which is worth checking before quoting one at anybody.

What the three flags of the panel do:

- `--data-only` returns the numbers and writes nothing: no report, no CSV, no notification. The
  panel draws that answer as it comes and computes nothing itself, so the panel and the report
  cannot disagree
- `--compare` also computes the period of the same length just before, which is where the arrows
  and the previous values come from, and what lets a branch say when its data starts
- `--period` is the list at the top of the panel

Finished jobs do not change, so sfdx-hardis keeps them in `~/.sfdx/sfdx-hardis-cache/dora`, one file
per repository, and asks the provider only for the jobs of the last two days and the new ones.
**Refresh** adds `--refresh`, which reads everything again. The panel also keeps its last answer,
to have something to show while the next one is being read.

**Export** writes the report in `hardis-report/`, copies it to `docs/dora/`, and adds a CSV of the
jobs behind the numbers. A run on one branch also sends a notification, to Slack, Teams or Grafana
when one is configured; a run on your four branches sends none.

Without a git provider the command fails: there is no fallback on `git log` any more, and no number
is better than a wrong one. It also fails, saying which right is missing, when the token cannot
read the CI jobs. On GitHub that right is **Actions: Read**.

The numbers are honest in a way a dashboard somebody fills in by hand never is. Nobody can improve
deployment frequency by editing a spreadsheet. They are also narrower than the DORA names suggest,
and a release manager quoting them should know which part they cover.

<!-- command-links:start -->
Command documentation: [hardis:doc:dora-report](https://sfdx-hardis.cloudity.com/hardis/doc/dora-report/)
<!-- command-links:end -->

</details>

#### You should now see

- The command panel writing the report for the same period: a summary of every branch, then a
  chapter per branch
- `docs/dora/dora-report-<date>.md` on your disk

## What you should see

- [ ] `preprod` and `main` carrying the release
- [ ] A green **Process Deployment (sfdx-hardis)** run on `preprod`, then one on `main`
- [ ] The stories working in `helios-prod`
- [ ] The **DORA metrics** panel with a row for each of your four branches, and one deployment on `main`
- [ ] A DORA report in `docs/dora/`

## If it goes wrong

**The Pull Request from `uat` into `preprod` has a conflict in `config/.sfdx-hardis.yml`.**
Two things together cause it. Your `preprod` came from a `main` newer than the course your
`integration` started from (**Sync fork** on GitHub moves `main`), and a course update reached
`integration` as a **Squash and merge** instead of the merge commit **Update my course** makes. Git
then cannot see that both branches carry the same course changes, and it stops where your pipeline
settings sit next to a line the course changed. Nothing is lost: `uat` holds the right file. Bring
`preprod` into `uat` through a branch of its own, from the **Command Palette** of VS Code:

1. **Git: Fetch**
2. **Git: Create Branch From...**, pick **origin/uat**, and name it `fix/merge-preprod-into-uat`
3. **Git: Merge...**, and pick **origin/preprod**, under **remote branches**
4. Open `config/.sfdx-hardis.yml` under **Merge Changes**, click **Accept Current Change** above each
   conflict, save, click **+** on its row, then **Commit**. Current is `uat`, which already has the
   course changes and your settings
5. **Publish Branch**, then on GitHub open its Pull Request into `uat`, wait for the checks, and
   merge it with a merge commit (**Create a merge commit**, under the arrow of the green button),
   never a squash: a squash brings the conflict back

The Pull Request into `preprod` then has no conflict. Its check runs again and stops on the
deliverability step, as step 2 says.

**The deployment to production fails on a component that worked in preprod.**
Production has drifted, or has something preprod does not: an extra validation rule, a record type,
real data that violates a new constraint. Read the error. This is the single most common production
deployment failure, and it is the argument for keeping preprod as close to production as you can.

**The deployment half-succeeded.**
Salesforce deployments are atomic per deployment, so this usually means a post-deploy action failed
after a successful deployment. The metadata is in, the action is not. Re-run the action, do not
re-run the deployment.

**The DORA metrics panel says "Upgrade sfdx-hardis".**
The panel needs sfdx-hardis 8.17.0 or later. Click **Open Setup**, upgrade sfdx-hardis there, then
**Try Again**.

**The panel says "Connect to your git provider".**
The extension has no connection to GitHub in this VS Code. Click **Connect to Git** and sign in, as
in [Lab 1.2](../level-1-contributor-basics/1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md). The panel reads the numbers as soon as it is connected.

**The panel says "DORA metrics could not be read".**
The message under that title is the one of sfdx-hardis, and it names the cause. The one to know on
a real project says the git provider token cannot read the CI jobs: on GitHub, the token lacks
**Actions: Read** on the repository. Fix the token, then click **Try Again**.

**A number reads "No data".**
Nothing to measure, which is not an error: **Recovery** on a branch where no deployment failed, or
every number of a branch that was not deployed in the period.

**The release you just merged is not in the numbers.**
Only finished jobs are counted. Wait for the **Process Deployment (sfdx-hardis)** run to end, then
click **Refresh**.

**Check my work says no DORA report was exported.**
Reading the panel writes no file. Do step 9: **Export**, then **Markdown report**.

## Check your work

Welcome page > **Training: Level 3** > **Check my work**, then pick **Lab 3.6**.

## Go deeper

- [Deploy to major orgs](https://sfdx-hardis.cloudity.com/salesforce-devops-deploy-major-branches/)
- [DORA Metrics](https://sfdx-hardis.cloudity.com/hardis/doc/salesforce-devops-dora-report/)

[Next: Lab 3.7 - Production is broken: hotfix and retrofit](3-7-hotfix-and-retrofit.md){ .md-button .md-button--primary }
