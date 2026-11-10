---
id: lab-3-5
title: "Lab 3.5 - Promote to UAT and write the release notes"
description: "Protect what UAT keeps for itself with package-no-overwrite, promote integration to UAT, read its deployment actions and write the release notes."
level: 3
lab: 5
lang: en
source_rev: ""
screenshots:
  - annotated/vscode/devops-pipeline-level3--create-promotion
  - annotated/vscode/pipeline-branch-modal-level3--what-it-carries
  - annotated/vscode/pipeline-branch-modal-uat--no-merge-target
  - annotated/vscode/package-no-overwrite-edit--add-type
  - annotated/vscode/package-no-overwrite-add-type--type
  - annotated/web/github-pr-promotion-actions
  - annotated/web/github-pr-release-notes
depends_on:
  commands: [hardis:doc:release-notes, hardis:project:deploy:smart]
  flags: []
  config: [mergeTargets, availableTargetBranches, failValidationOnPendingManualActions]
  panels: [pipeline, deploymentAction]
  docs: [salesforce-devops-deploy-major-branches, hardis/doc/salesforce-devops-release-notes, salesforce-devops-config-overwrite]
---

# Lab 3.5 - Promote to UAT and write the release notes

**Level**: 3 Release Manager

**Time**: ~50 min<!-- observed --> (observed: median 52 min, 14 learners, fastest 19 min)<!-- /observed -->

**You will**: protect a setting UAT keeps for itself, make your first promotion between two major
branches, read the deployment actions it carries, and produce the document the business actually
reads.

## The situation

Everything the team built this week is in `integration`. The business testers work in UAT. Monday
morning they expect to find this week's work there, with a note saying what changed.

A promotion between major branches is not a contributor Pull Request. It carries several stories at
once, it may carry deployment actions declared weeks ago by different people, and the org it
deploys to has real testers in it.

## Before you start

- [ ] [Lab 3.4](3-4-merge-colliding-pull-requests.md) finished: US-018 and US-019 merged into `integration`
- [ ] `helios-uat` connected: the scratch org Level 1 created, configured as the `uat` org since then
- [ ] `SFDX_AUTH_URL_UAT` still in your fork: `uat` keeps logging in with it, as [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md) explains

## Steps

### 1. See what you are about to ship

Goal: you have read the list of what `integration` carries, which is the release, before you create
anything.

#### Do

1. Open the **DevOps Pipeline** panel and click the `integration` node in the diagram. A window opens
   on that branch, titled **Pull Requests in integration**

   ![The branch window of integration, listing what it carries](../../_assets/annotated/vscode/pipeline-branch-modal-level3--what-it-carries.png)

2. Read **Pull Requests** **(1)**, the list that matters: every Pull Request merged into
   `integration` since the last promotion to `uat`, with who merged it and when. Read it before you
   create anything: if a story in it should not go out this week, now is the moment, not after the
   deployment
3. Look at **Deployment Actions** **(2)**, the list of actions those Pull Requests carried, gathered
   in one place. Step 4 comes back to it

!!! warning "Empty, with a Go Live selector instead?"
    The window shows what is waiting to be promoted to the next stage. A branch that has no next
    stage, meaning its `mergeTargets` is empty, has nothing to promote, so the panel shows a **Go
    Live** selector **(1)** and the release notes of a go-live already merged into it instead:

    ![The same window on a branch with no merge target](../../_assets/annotated/vscode/pipeline-branch-modal-uat--no-merge-target.png)

    On `main` that is the normal view and always will be: production is the end of the pipeline.

    On `integration` it means the branch file lost its merge target, which it has had since Lab 1.2.
    Click **Training: Level 3 > Set up my training environment**, which writes it again. It
    refreshes the org and the login URL of a file that already exists and leaves the rest alone, so
    what you set in Lab 3.1 survives.

#### Why

That list is the release. **Tickets** beside it is the same again for the stories, each with its
title, read from the backlog the project declares as its ticketing system. A fourth tab, **Apex
Tests**, appears only on a project that sets `enableDeploymentApexTestClasses`, and this one does
not.

#### You should now see

- The stories waiting in `integration`, under **Pull Requests**, and their actions under
  **Deployment Actions**
- In the footer, the two buttons step 7 uses: **(3)** generates the notes for what has already been
  promoted, **(4)** previews the notes for what has not

### 2. Protect what UAT keeps for itself

Goal: `Helios_Warehouse` in `helios-uat` pointing at the test warehouse, and listed in
`manifest/package-no-overwrite.xml` so that no promotion puts the production address back.
Refresher: [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md), [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md)

One component of the Helios app is meant to be different in every org: the remote site setting
`Helios_Warehouse`, the address of the warehouse stock system the panel batches are booked with.
Production talks to the real warehouse, UAT to the warehouse's test system. An admin set that address
in UAT by hand, and the repository holds the production one.

#### Do: see it for yourself

1. In `helios-uat`, open **Setup > Remote Site Settings**, open `Helios_Warehouse`, and click **Edit**
2. Set **Remote Site URL** to `https://warehouse-test.helios.invalid`, the way the UAT admin did, and
   click **Save**

#### Why

Now the promotion. It sends the whole package, remote site setting included, and would put the
production address back in UAT without a word. The overwrite manager is for exactly this:
anything listed in `manifest/package-no-overwrite.xml` is taken out of the deployment when the target
org already has it, and created when it does not.

Helios already has that file: it is the list every sfdx-hardis project starts with. It protects the
components an org keeps for itself almost everywhere, reports and dashboards maintained in
production, connected apps, named credentials, certificates. Remote site settings are not in it yet,
and you do not have to write XML to add them.

#### Do: add it to the list

1. In the **DevOps Pipeline** panel, open the **Deployment packages** menu, the one that opened
   **Package XML** in [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md), and pick **No Overwrite**. The package viewer opens on that list
2. Turn **Edit mode** on **(1)**, then click **Add Type** **(2)**

   ![The package viewer on the default no-overwrite list, in edit mode](../../_assets/annotated/vscode/package-no-overwrite-edit--add-type.png)

3. Type `RemoteSiteSetting`, the name Salesforce gives this kind of component, in **Metadata Type API
   Name** **(1)**, and click **Add** **(2)**

   ![The Add Metadata Type window of the package viewer](../../_assets/annotated/vscode/package-no-overwrite-add-type--type.png)

4. On the new **RemoteSiteSetting** row, click **Add member**, type `Helios_Warehouse`, and click
   **Add**. If you want to see the file, **Edit File** opens it as text
5. Click **Training: Level 3** > **Publish my pipeline configuration**, and merge its Pull Request
   once green, as in [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md)

#### Why this list

The viewer added a `RemoteSiteSetting` block to `manifest/package-no-overwrite.xml` for you. The
file has the shape of `manifest/package.xml`: one block per kind of component, its members listed by
name, or `*` for all of them. The list of what must never be overwritten is pipeline configuration,
like the rest, so it is published the same way.

Created where missing, never overwritten where present. A new org, a fresh sandbox for instance, has
no `Helios_Warehouse` yet, and the deployment creates it from the repository. From then on it
belongs to that org. The overwrite manager does not compare versions: present means protected.

#### You should now see

- `Helios_Warehouse` in `helios-uat` pointing at `https://warehouse-test.helios.invalid`
- A **RemoteSiteSetting** row holding `Helios_Warehouse` in the **No Overwrite** list, and the
  configuration Pull Request merged into `integration`

### 3. Create the promotion Pull Request

Goal: a promotion Pull Request from `integration` into `uat`, titled for the humans who will read it.
Refresher: [Lab 1.6](../level-1-contributor-basics/1-6-pull-request-deployment-check-and-merge.md)

Nothing is open between `integration` and `uat` yet: the promotion Pull Request is yours to create,
now. The number in the bubble at the corner of the `integration` box is not a Pull Request: it
counts the User Stories waiting there, the list you read in step 1.

#### Do

1. In the **DevOps Pipeline** diagram, click the **+ PR** chip **(1)** on the arrow from
   `integration` to `uat`. GitHub opens on a new Pull Request from `integration` into `uat`, both
   branches already filled in. Do not click **Create pull request** yet: the title comes first

   ![The + PR chip on the arrow from integration to uat](../../_assets/annotated/vscode/devops-pipeline-level3--create-promotion.png)

2. Back on the GitHub page, replace what **Add a title** proposes. Title the Pull Request for the
   humans who will read it, not for git, and call it a promotion:

   > Promotion 2026-09: crew capacity cap, quote PDF

3. Now click **Create pull request**
4. When you merge it, after step 4, merge it with a merge commit, never with a squash: click the
   arrow beside the green button, choose **Create a merge commit**, then click **Merge pull request**

!!! warning "Careful"
    GitHub remembers the method you used last, so after all the squashed feature Pull Requests the
    button may read **Squash and merge** until you switch it.

#### Why

The chip is there because no Pull Request is open on that arrow. Once you create one, the chip is
replaced by the Pull Request number and its status.

Release is the word for the Pull Request into `main`, production, and for nothing else. The
business reads "release" as "it is live", and a Pull Request into `uat` puts nothing live. Keep the
two words apart and a list of Pull Requests reads like the history of what reached production.

A promotion carries every commit of the stories it promotes, and the next promotion, the retrofit
and the release notes all need to find them one by one ([Lab 1.6](../level-1-contributor-basics/1-6-pull-request-deployment-check-and-merge.md)). The green check comment says the
same on its **How to merge** line: **use a merge commit, never squash**.

#### Why not the promotion button of the branch window

A branch window can also show a **Create promotion from <branch> (Beta)** button and a checkbox
on every row. This project turns that feature on ([Lab 3.1](3-1-configure-the-pipeline-up-to-production.md)), but `allowedPromotionSteps` allows
one step only, `uat` to `preprod`, so the window of `integration` has neither. You will meet
both on the window of `uat` in step 7.

That feature carries a subset of what is waiting, and it exists for the week the business
signs off one story and not the one next to it. What you are doing here is promoting
everything, which is what a plain Pull Request from one branch to the next carries, and what
you should be doing almost every week. [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) is the exception.

A story in the list should not go out? A plain promotion carries the whole branch, so a Pull Request
cannot be taken out of it. Leaving a story behind is what that promotion button is for: it creates a
promotion with the stories you tick, and creating one again replaces the one already open.
[Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) walks it.

#### You should now see

- The promotion Pull Request open from `integration` into `uat`, under your title
- On the diagram, the Pull Request number and its status in place of the **+ PR** chip

### 4. Read the deployment actions it carries

Goal: every deployment action the promotion carries read before merging, and the check green once
the deliverability step of US-026 is done in `helios-uat`.

#### Do

1. Once the check runs, open the sfdx-hardis comment. It counts the actions in the **Deployment
   actions** row of its table, and lists each one in the folded **🛠️ Deployment actions of this
   job**
2. Read its scope **(1)**, which is what a promotion adds on top: the folded **ℹ️ Where the
   deployment actions and test classes come from** says they are collected from the content of this
   Pull Request, and the folded **🎫 ... tickets · ... Pull Requests** lists every Pull Request it
   carries, each one a link

   ![The deployment actions collected on the promotion Pull Request](../../_assets/annotated/web/github-pr-promotion-actions.png)

3. Read it before merging, with the two things of the table below to look for
4. Do the click of the deliverability step of US-026 in `helios-uat`
5. Tick its box (or **Mark as done in uat** in the VS Code **Deployment Actions** tab)
6. Click **Re-run all jobs** on the check

| What you see  | What it means for you                                                                                   |
|---------------|---------------------------------------------------------------------------------------------------------|
| A manual step | Somebody has to click something in UAT. That somebody is you, and it will not happen unless you plan it |
| A data import | Records will be written to UAT. Testers may have their own records there                                |

#### Why

Every action any contributor declared on any of the merged stories is collected into that one
table, with its label, its moment, its result with the reason in plain words, and a link back to the
Pull Request it came from. Anything needing a human gets a checklist of its own, above the
folded sections, headed **👋 To do by hand in `uat` before the deployment** or **after the
deployment**. The two checklists land on different jobs: the check job carries the before one
**(2)**, so you can act on it while deciding, and the merge job carries the after one. The
post-deployment actions **(3)** are counted **🕒 after the merge** on the check, with the reason
**Runs after the merge only**: a check changes nothing in the org, so they wait for the merge.

You cannot edit a contributor's action from here: it belongs to their Pull Request and to every org
after this one, so a wrong action is fixed in a new Pull Request rather than in this promotion.

The checklist is the exception, and it is not decoration. Tick a box once you have done the thing
in the org, and the next sfdx-hardis job reads the box back and records the action as done. Leave
it unticked and the next promotion will still be asking you for it.

A before step also holds the merge: while the deliverability step of US-026 is not marked as
done in `uat`, the check of the promotion stops red, right after its pre-deployment actions. Once
you have ticked it, the re-run records the step and goes green.

#### You should now see

- The check of the promotion green, with the deliverability step recorded as done in `uat`

### 5. Merge and watch the deployment

Goal: a green deployment to `uat`, with `Helios_Warehouse` left out of the package.

#### Do

1. Merge the promotion. The **Process Deployment (sfdx-hardis)** run starts, this time on `uat`.
   Expect several minutes
2. Read the log for the overwrite manager, above the deployment, among the lines that start
   with `[NoOverwrite]`:

   ```text title="Output"
   Type RemoteSiteSetting: 1 item(s) skipped because they already exist in the target org (protected), 0 item(s) to deploy
   ```

3. Open the folded **🛡️ Protected by `manifest/package-no-overwrite.xml` (1)** section of the Pull
   Request comment, and its table, **Protected components per metadata type**

#### Why

This is the first deployment to this org through the pipeline, so it will be larger than the ones to
integration: UAT is behind by everything the team has done.

The deliverability step is a pre-deploy one: its place is before the merge, as step 4 says,
and the check did not go green until you ticked it. This job skips it: *Skipping Set Email
Deliverability to All Email ...: already run in uat*.

`helios-uat` already has `Helios_Warehouse`, so the promotion left it out of the package, and the
**Final package.xml to deploy** printed right after it has one item fewer.

The Pull Request says it too, without the log: the comment of the check, and the one this
deployment writes, carry the folded protected section. Read it on the check, before merging: a
component you expected to deploy that shows up there is one the list protects by mistake.

#### You should now see

- A green **Process Deployment (sfdx-hardis)** run on `uat`
- **1** in the **🛡️ Not overwritten** column of the **RemoteSiteSetting** row

### 6. Verify with a tester's eyes

Goal: the two stories genuinely usable in `helios-uat`, not just deployed, and `Helios_Warehouse`
left alone.
Refresher: [Lab 2.3](../level-2-contributor-advanced/2-3-fix-broken-records-with-an-apex-deployment-action.md)

#### Do

1. Open `helios-uat`
2. On any installation, set `Status` to `Planned`, `Crew Capacity Cap` to 3 and `Crew Size` to 6,
   in the same edit, and save
3. Check the quote PDF permission is on the manager permission set
4. Open **Setup > Remote Site Settings** and look at `Helios_Warehouse`

#### Why

A crew larger than the cap is brought back down to the cap when you save. The rule runs when a
planned installation gets its crew, and UAT has none left planned since the crew size backfill of
[Lab 2.3](../level-2-contributor-advanced/2-3-fix-broken-records-with-an-apex-deployment-action.md), so you make one.

Deployed and usable are different states, and the gap between them is almost always a permission or
a piece of reference data.

#### You should now see

- The crew size reading 3, and the installation moved on to `Scheduled`
- The quote PDF permission on the manager permission set
- `https://warehouse-test.helios.invalid` still set for `Helios_Warehouse`: the promotion left it
  alone

### 7. Generate the release notes

Goal: the release notes of the promotion generated, rewritten for the business, and in the
description of the promotion Pull Request.

#### Do: generate the notes

1. Open the **DevOps Pipeline** panel and click the `uat` node, the same way you clicked
   `integration` in step 1
2. Ignore the checkboxes and the **Create promotion from uat (Beta)** button of this window until
   [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md)
3. In the footer of that window, the left button now reads **Generate Promotion Notes for uat**.
   Click it
4. It asks one question, **Select the merge commit for this release or promotion**, listing the
   merges that landed on `uat`, newest first. Take the top one, **Merge pull request #N from
   *your-handle*/integration**: the promotion you have just merged

#### Why

This window has the checkboxes and the button step 3 mentioned, because `uat` is the source of the
one promotion step this project allows.

The notes cover what that merge brought into `uat`, and nothing before it.

The button is named after what the branch is. `uat` merges into `preprod`, so what arrived there is
a promotion. On a branch with no merge target, `main`, the same button reads **Generate Release
Notes for Latest Release in main**, and once you pick a go-live in the selector at the top of the
window it reads **Generate Release Notes for** that go-live.

Next to it, **Preview Upcoming Promotion Notes from uat** does the same thing for what has not been
promoted yet. It is the one to use on a Wednesday, when somebody asks
what Thursday's release will contain.

You get a markdown document listing the Pull Requests, their authors, their stories and the manual
steps, generated from the merge history rather than from anybody's memory. It lands under
`hardis-report/release-notes/`, in a folder named after the release tag and the date, or after the
target branch and the date when there is no tag, so here `uat-<date>`. Markdown and PDF every time,
plus a spreadsheet when there is anything to put in it.

On this promotion, the generated notes open like this:

```text title="Output"
# Promotion Notes - uat

| Metric           | Value |
|------------------|-------|
| Pull Requests    | 22    |
| Tickets          | 17    |
| Contributors     | 1     |
| Added / Modified | 38    |
```

There are more Pull Requests than tickets: the configuration Pull Request of step 2 and the
promotion itself carry no story, and some stories took two Pull Requests, like US-062 and its fix in
[Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md). The configuration of [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md) has a ticket of its own, US-050, because it went
through its own story. Yours depends on how you got here: a little over 20 after walking
Levels 1 and 2, far fewer after **Reset this level**, which starts Level 3 without their Pull
Requests.

Then come a table of the tickets, one of the Pull Requests with their authors and merge dates, the
metadata changed by type, and the deployment actions with their status in `uat`: the manual
deliverability step **success**, ticked before the merge, the imports and the schedule
**success**.

#### Do: write the release note

1. Read it, then write the release note from it, as a short text of your own. Do not paste the
   generated document
2. Start with two things the generator cannot know:
   1. One sentence at the top saying what this release is for. "Crews can no longer be
      over-staffed, and sales can generate quote PDFs."
   2. The manual steps, stated as instructions to a named person, not as a technical list
3. Under them, keep one line per story from the tickets table of the generated notes, reworded as
   what changes for the business, and name the generated file for whoever wants the rest
4. Open the promotion Pull Request you merged, **...** at the top right of its description,
   **Edit**, and paste the improved notes in place of the one-line description

   ![The improved release notes, in the description of the promotion Pull Request](../../_assets/annotated/web/github-pr-release-notes.png)

#### Why your own text

The generated document is a complete list, for whoever wants every detail, and it stays where it was
written. What the business reads is a short text of your own.

Then give them to the people who read them. A merged Pull Request stays editable, and it is where
the release is: its link is what you send the business, and what the release notes of the next
promotion point back to.

<details markdown="1"><summary>Under the hood: what generated the notes, and what a promotion really is</summary>

The command was:

    sf hardis:doc:release-notes --mode post --target-branch uat

which walks the git history between two references, collects the merge commits, matches each one
with its Pull Request through the git provider API, and pulls the title, author, body and declared
deployment actions.

That API call is the part that can quietly fail. The command needs a git provider token, taken
from the environment (`GITHUB_TOKEN` or `CI_SFDX_HARDIS_GITHUB_TOKEN` on GitHub). With no token it
does not stop: it warns, collects zero Pull Requests, and writes you a perfectly formatted document
with nothing in it. An empty release note is more often a missing token than an empty release.

This is also why a promotion is never squashed. The notes find each story from the commit its
Pull Request left on `integration`, a merge commit or the single commit of a squash alike: that is
why a feature Pull Request can be squashed. A promotion squashed into `uat` would replace all of
those commits by one that no story produced, and the notes of `uat` would name the promotion and
nothing it carried.

A promotion is an ordinary Pull Request. There is no special promotion machinery in the default
setup: `integration` into `uat` is a branch merged into another branch, and the deployment job on
`uat` behaves like the one on `integration`. What differs is only what the configuration says about
`uat`: its org, its merge targets, and whether delta deployment applies between major branches
(`enableDeltaDeploymentBetweenMajorBranches`, off by default, because a promotion is the worst
moment to discover the target org drifted).

There is a Beta feature for teams who have to promote a **subset** of what is waiting, rather than
everything: [promotion
branches](https://sfdx-hardis.cloudity.com/salesforce-devops-promotion-branches/). [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) uses
it, deliberately late, because it makes sense once you have done a few releases the ordinary way.

<!-- command-links:start -->
Command documentation: [hardis:doc:release-notes](https://sfdx-hardis.cloudity.com/hardis/doc/release-notes/)
<!-- command-links:end -->

</details>

#### You should now see

- The sentence **(1)** saying what the promotion is for, in the business's words
- The manual step **(2)** naming who does it, where, and what breaks if nobody does
- Then a short table of what to test, and a pointer to the full generated list for whoever wants it

## What you should see

- [ ] The `uat` branch carrying everything `integration` had
- [ ] A green **Process Deployment (sfdx-hardis)** run on `uat`
- [ ] Both stories working in `helios-uat`
- [ ] `Helios_Warehouse` in `helios-uat` still pointing at the test warehouse
- [ ] The release notes in the description of the promotion Pull Request

## If it goes wrong

**Publish my pipeline configuration stops on "A file you changed differs on GitHub too".**
Your local `integration` is behind the one of GitHub: the Pull Requests you merged there since your
last **Pull** are not on your disk, and one of them changed a file you just edited. The scripts of
your fork date from before 2026-10-16, when **Publish my pipeline configuration** needed your local
copy to be up to date. Click **Update my course**, merge its Pull Request, then run **Publish my
pipeline configuration** again: it now builds its branch from the `integration` of GitHub, whatever
your local copy holds. Your edit is still on your disk, nothing to redo.

**Publish my pipeline configuration says your change and a change merged on GitHub touch the same lines.**
Somebody changed the same lines of that file on GitHub since your last **Pull**, and git will not
guess which version wins. Bring the two together on your disk, from the **...** menu of the Source
Control panel:

1. **Stash** > **Stash (Include Untracked)**: your edits are put aside
2. **Pull**: your `integration` catches up with GitHub
3. **Stash** > **Pop Latest Stash**: your edits come back, and the file shows as a conflict
4. Open it, click **Accept Both Changes** above the conflict, save, and click **+** on its row

Then run **Publish my pipeline configuration** again.

**The check of the promotion is green at once, with no deliverability step to do.**
Two causes. Open the folded **🛠️ Deployment actions of this job** of the check comment first. When
the row of **Set Email Deliverability to All Email** reads *skipped: Runs after the merge only*,
your step of [Lab 2.4](../level-2-contributor-advanced/2-4-ship-reference-data-and-a-batch-with-deployment-actions.md) was saved with **Execution Contexts** on **Deployment job only**, and the
sfdx-hardis your check ran then left it out. Nothing is lost: do the click in `helios-uat` now,
merge, and tick its box in the comment of the deployment job. The current sfdx-hardis stops the
check on such a step whatever its context.

When the step is not listed at all, the actions of Level 2 travel with no Pull Request of this promotion. sfdx-hardis collects deployment
actions from the Pull Requests a promotion carries, and **Reset this level** puts the Level 2 stories
in `integration` as one commit that no Pull Request of your fork made. Its last step gives their
actions a Pull Request of your fork, **Deployment actions of the earlier levels**, and merges it once
its checks pass. Look for it in the **Pull requests** tab of your fork:

- **Open with green checks**: if GitHub still shows it as a draft, tick the box of **Set Email
  Deliverability to All Email** in its check comment, the one of `integration` you did in [Lab 2.4](../level-2-contributor-advanced/2-4-ship-reference-data-and-a-batch-with-deployment-actions.md),
  then click **Ready for review**. Merge it with **Merge pull request**. The promotion Pull Request
  takes the new commit of `integration`, and its check runs again, red this time, as step 4 says
- **Missing**: your reset ran without that step, the case for a fork whose scripts date from before
  2026-10-08. Nothing is wrong with your pipeline: go on, and steps 4, 5 and 7 show fewer actions
  than this lab describes. Before your next reset, run **Update my course**

**The deployment job to uat is red on "Put the delivery managers in the Crew Leads group".**
Your fork dates from before 2026-10-05, when Mariia's fix in [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md) did not ship the Crew Leads public group
yet: `helios-uat` has none, and her first action looks for it. The metadata is deployed, so do not
deploy again. Recover it the way [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md) taught: create the group in `helios-uat` (**Setup** >
**Public Groups** > **New**, group name `Helios_Crew_Leads`), then in the **DevOps Pipeline** panel
click `uat`, **Deployment Actions** tab, **Retry** on the failed action, and answer **Run all the
next actions**. Create the same group in `helios-preprod` and `helios-prod` before their promotions
in [Lab 3.6](3-6-release-to-production-and-read-dora-metrics.md).

**The check fails with authentication errors for uat.**
`SFDX_AUTH_URL_UAT` is missing or out of date, often because `helios-uat` expired and was rebuilt.
**Training: Level 3 > Set up my training environment** rebuilds what expired and writes the secret
again. Then **Re-run all jobs** on the check.

**The deployment fails on something that worked in integration.**
The orgs differ. Usually UAT is missing a feature, a licence, or a component somebody deleted there
by hand. Read the error and check the org.

**The promotion Pull Request shows hundreds of files.**
That is expected on a first promotion: UAT is behind by the whole history. It settles after this
one.

**The release notes are empty.**
Three causes, in order of likelihood: the wrong merge commit was picked, so check that the top of
the list was the promotion; no git provider token in the environment, so the Pull Request lookup
returned nothing and only warned; or the merges were squashed, so there is no link to look up.

## Check your work

Welcome page > **Training: Level 3** > **Check my work**, then pick **Lab 3.5**.

## Go deeper

- [Deploy to major orgs](https://sfdx-hardis.cloudity.com/salesforce-devops-deploy-major-branches/)
- [Release Notes](https://sfdx-hardis.cloudity.com/hardis/doc/salesforce-devops-release-notes/)

[Next: Lab 3.6 - Release to production and read your DORA metrics](3-6-release-to-production-and-read-dora-metrics.md){ .md-button .md-button--primary }
