---
id: lab-3-4
title: "Lab 3.4 - Three Pull Requests in one release: review the merge order"
description: "Review the merge order of two Pull Requests that changed the same permission set, and send back a third that fails its check, as a release manager."
level: 3
lab: 4
lang: en
source_rev: ""
screenshots:
  - annotated/vscode/welcome-custom-menu-3
  - annotated/vscode/pipeline-config--cleaning-overwrite
depends_on:
  commands: [hardis:project:deploy:smart]
  flags: []
  config: [autoCleanTypes, useDeltaDeployment]
  panels: [pipeline, pipelineConfig, packageXml]
  docs: [salesforce-devops-config-cleaning, salesforce-devops-config-delta-deployment, salesforce-devops-config-overwrite]
---

# Lab 3.4 - Three Pull Requests in one release: review the merge order

**Level**: 3 Release Manager

**Time**: ~15 min<!-- observed --> (observed: median 16 min, 15 learners, fastest 6 min)<!-- /observed -->

**You will**: go back over the order two Pull Requests on the same file went in, check that
neither lost anything, and send back a third one that does not work.

## The situation

Friday afternoon. Three stories were planned for this week's release:

| Pull Request                          | Author             | Checks  | What it touches                            | Where it is now                 |
|---------------------------------------|--------------------|---------|--------------------------------------------|---------------------------------|
| US-018 Cap the crew size              | Mariia Pyvovarchuk | green   | the assign flow, `Helios_Delivery_Manager` | merged, in Level 2              |
| US-019 Quote PDF                      | Romain Panda       | green   | `Helios_Delivery_Manager`                  | merged, in the Level 2 capstone |
| US-020 Refactor InstallationScheduler | Mariia Pyvovarchuk | failing | `InstallationScheduler`                    | not opened yet                  |

Two of them edited the same permission set, and they are already in `integration`: you merged them
as a contributor in Level 2, without a release manager deciding anything. **Reset this level**
starts Level 3 from a branch that holds them too. So nothing collides in front of you in this lab.
What you do is the release manager's half of it, after the fact: was the order right, did the
second merge keep what the first one brought, and what happens to the third, which does not work.

On a real project the first two questions come before the merge. Asking them about two merges you
can still read in full is the cheapest way to learn to ask them.

## Before you start

- [ ] [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md) finished
- [ ] Nothing uncommitted

## Steps

### 1. Receive the one Pull Request still to come

Goal: the Pull Request of US-020 open into `integration`, its checks failing, and the two merged
Pull Requests of US-018 and US-019 open beside it.

#### Do

1. Open **Training: Level 3** > **Simulate my teammates**, then **US-020 Refactor InstallationScheduler**.
   It is on the Welcome page, where each level menu is a page of cards, and in the **SFDX HARDIS**
   view of the left bar, where each level is a folder you unfold. Either route runs the same thing

   ![The Level 3 training menu on the Welcome page](../../_assets/annotated/vscode/welcome-custom-menu-3.png)

2. Find the merged Pull Requests of US-018 and US-019, in the **Pull Requests** tab of the
   `integration` window of the DevOps Pipeline panel, or in the **Closed** list of the Pull Requests
   of your fork on GitHub. Keep both open, the next steps read them
3. Wait for the checks of US-020. They will fail

!!! warning "Careful"
    Do not simulate US-018 or US-019. Each teammate scenario is used once, and both are already in
    `integration`: the command would say "Nothing to commit" and open nothing.

#### You should now see

- Mariia's Pull Request into `integration`, opened for you: the command prints its address, and ends
  with an **Open the Pull Request** button at the bottom of the panel
- The checks of US-020 failing

### 2. Triage before you touch anything

Goal: the order a release manager would have picked, set against the order the merges really went
in.

Sort the three, in this order of questions.

#### Do

1. Which ones are green? A failing Pull Request is not a decision, it is a task for its author
2. Which ones touch the same file? US-018 and US-019 both edit `Helios_Delivery_Manager`
3. Which one is smaller? All else equal, merge the smaller one first
4. Compare with what happened: the **Pull Requests** tab of the `integration` window lists them in
   the order they went in

#### Why

Do not spend your Friday fixing Mariia's refactor. Whichever of US-018 and US-019 merged second
inherited whatever the first one did to that file, and step 5 is about what "inherits" turned out to
mean. The smaller one goes first because its author has less to redo if the other one lands badly.

The order a release manager would have picked: US-019 first (small, green, no dependants), then
US-018 (green, bigger), and US-020 goes back to Mariia. In Level 2, US-018 went first, because
[Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md) needed it there. Nothing broke, and step 5 shows why. Whether the
order mattered is a question you can only answer by reading what the second merge did.

#### You should now see

- The order you would have picked: US-019, then US-018, and US-020 back to Mariia
- The order it really happened in, in the **Pull Requests** tab: US-018 first

### 3. Send US-020 back, properly

Goal: one review comment on US-020 that names the failure, says who owns it and what happens to the
release, and the Pull Request left open.

#### Do

1. Open US-020 and read the failure, under **Deployment errors** in the sfdx-hardis comment. Read it
   properly before you write anything, because it is not what the words "failing tests" suggest
2. Leave one review comment that does three things:

   > The check fails to compile `InstallationSchedulerTest`: `earliestInstallDate` returns a `Datetime`
   > now and the test still assigns it to a `Date`, in two places. No tests ran. Not blocking anything else, so US-019
   > and US-018 go out in this week's release and this one can land on Monday.

3. Leave the Pull Request open and move on

!!! warning "Do not fix a contributor's Pull Request yourself"
    It is faster once and expensive every time after. The author does not learn the failure, and you
    become the person every failing check is escalated to.

#### Why

It is a genuine failure, in her code, and it is hers to fix. `earliestInstallDate` now returns a
`Datetime`, and `InstallationSchedulerTest` still assigns it to a `Date`, in two places. The class
does not compile, so no test runs at all. What the sfdx-hardis comment gives you, under **Deployment
errors**, is a compilation error with a class name, twice, not a failed assertion.

The comment names the failure, says who owns it, says what happens to the release. On a real
project you would send it as **Request changes**. GitHub does not offer that on a Pull Request
opened from your own account, and in this fork the teammate Pull Requests are opened from yours, so
a plain comment does the job here.

#### You should now see

- US-020 still open, with your comment naming the compilation error of `InstallationSchedulerTest`

### 4. Read how US-019 went in

Goal: you know what US-019 changed in `Helios_Delivery_Manager`, and how little there was to it.
Refresher: [Lab 3.2](3-2-review-a-contributor-pull-request.md)

#### Do

1. Look at the diff of US-019 on `Helios_Delivery_Manager`
2. Read it the way [Lab 3.2](3-2-review-a-contributor-pull-request.md) taught you to review one, and note how little there was to it

#### Why

Green, small, nothing in its way. Had it still been open, you would have merged it on that reading.

Nothing here was hard, which is exactly why it is worth knowing what happened next.

#### You should now see

- One new `<fieldPermissions>` block for `Panel_Batch__c.Quote_Pdf_Url__c`, added near the bottom of
  the file where the `Panel_Batch__c` grants live

### 5. Find the conflict that never happened

Goal: you can say why git merged two edits of the same file without a word, and what to do when it
does stop.
Refresher: [Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md)

US-018 granted `Installation__c.Crew_Capacity_Cap__c`, near the top of the same file. US-019 granted
`Panel_Batch__c.Quote_Pdf_Url__c`, near the bottom. Two people, same file, same week.

#### Do

1. Open the file on `integration`

#### Why

Git merged them without a word. No conflict, no resolution, no second look.

That is not luck and it is not git being clever. A conflict needs the two edits to land in the same
place, within the few lines of context git compares. These two are about seventy lines apart in an
alphabetically sorted file, so git took both and moved on. [Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md) gave you the other case:
your `Crew_Notes__c` grant sat one line from Mariia's `Crew_Capacity_Cap__c`, git could not choose,
and it stopped and asked.

The release manager's takeaway is not "permission sets rarely conflict". It is this: a silent merge
is the common case, and a conflict is the rare one. Git warns you about the rare one. Nothing warns
you about the common one, so if you want to know that both grants survived, you have to go and look.
That is step 6, and on a real project it is a habit rather than a step.

When git does stop and ask, permission set conflicts are almost always take both: one field each,
and the permission set holds as many as it needs. Resolve it keeping both `<fieldPermissions>` blocks
in alphabetical order, then wait for the checks to run again. A conflict resolved in the web
editor is a new commit, and it has never been validated. Merging without re-validating is how a
resolution that dropped a closing tag reaches an org.

#### You should now see

- Both grants in the file on `integration`, in order, as if one person had written them

### 6. Look at the permission set in the org

Goal: `Helios_Delivery_Manager` in `helios-integration` carrying both new field permissions.

#### Do

1. In `helios-integration`, check `Helios_Delivery_Manager` has both new field permissions:
   `Crew_Capacity_Cap__c` on Installation and `Quote_Pdf_Url__c` on Panel Batch

#### You should now see

- `Crew_Capacity_Cap__c` on Installation and `Quote_Pdf_Url__c` on Panel Batch, both granted by
  `Helios_Delivery_Manager`

### 7. Understand what kept this survivable, and what is not there

Goal: you can point at the three mechanisms, and say which one is doing anything here.
Refresher: [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md)

Three mechanisms are worth being able to point at.

#### Do

1. Open **Pipeline Settings** from the DevOps Pipeline panel, and look at each one, because only the
   first is actually doing anything here

   ![Global Pipeline Settings, with the tabs that hold the cleaning, overwrite and delta settings](../../_assets/annotated/vscode/pipeline-config--cleaning-overwrite.png)

2. Cleaning: open the **Salesforce Project** tab **(1)** of **Global Settings**, and find
   **Auto-Cleaning types** (`autoCleanTypes`)
3. Delta deployment: open the global **Deployment** tab **(2)**, and read **Use Delta Deployment**
   **(3)**

#### Why

Cleaning (`autoCleanTypes`) is on, and it is why these two grants were two small blocks in a
permission set rather than two edits in a thousand-line Profile. A Profile conflict is a bad
afternoon. This is most of the reason the project bans permissions on Profiles.

The overwrite manager protects components that are deliberately different per org. Anything
listed in `manifest/package-no-overwrite.xml` is removed from the package when the target org
already has it, so a deployment cannot flatten a named credential that points at a different
endpoint in each environment. The project starts with the list every sfdx-hardis project gets. It
covers reports, dashboards, connected apps and credentials, Helios deploys none of those, so
nothing it deploys is protected yet: [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md) adds the first entry that matters, before the first promotion to `uat`. The list
is a file: you open it from the **Deployment packages** menu of the DevOps Pipeline panel, not
from a tab of this one.

Delta deployment is **Use Delta Deployment**, and [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md) showed you it is **Disabled** here. With it
on, each merge deploys the components that changed rather than the declared package. It is a speed
and blast-radius decision, not a safety net: it does not stop one merge overwriting another, because
both deployments send what their own commit contains.

<details markdown="1"><summary>Under the hood: the three mechanisms and where each one lives</summary>

| Mechanism         | Configuration                                 | What it does                                                                          |
|-------------------|-----------------------------------------------|---------------------------------------------------------------------------------------|
| Cleaning          | `autoCleanTypes` in `config/.sfdx-hardis.yml` | Rewrites the sources **at commit time**, in the contributor branch                    |
| Overwrite manager | `manifest/package-no-overwrite.xml`           | Removes components from the package **at deploy time**, when the org already has them |
| Delta             | `useDeltaDeployment`                          | Reduces the package to what changed since the last deployed commit                    |

The distinction between the first two is worth keeping straight, because they fail differently.

Cleaning is a **source** decision: what the repository is allowed to contain. When it drops
something, the component is genuinely not in the repository any more, and the diff shows it.

Overwrite is a **deployment** decision: what this particular org is allowed to receive. The
component stays in the repository, and it is simply not sent to an org that already has its own
version. A new org, which has nothing, receives it.

That is why a named credential belongs in the overwrite list and not in the cleaning rules: a fresh
org must get one, and an existing org must keep its own.

</details>

#### You should now see

- Cleaning on, on the **Salesforce Project** tab
- **Use Delta Deployment** reading **Disabled**, on the **Deployment** tab
- No tab for the overwrite list, which is a file

## What you should see

- [ ] US-019 and US-018 both in the `integration` history
- [ ] US-020 open, with a review that names the compilation error
- [ ] `Helios_Delivery_Manager` in `helios-integration` carrying both grants

## If it goes wrong

**Simulate my teammates says "Nothing to commit".**
That scenario is already in your `integration`. Expected for US-018 and US-019, which Level 3
starts with. For US-020, it means you received it already: its Pull Request is open in your fork.

**One of the two grants is missing from the permission set.**
Something took one side of the file wholesale, most likely a manual merge during Level 2. Put it
back in a follow-up Pull Request, not by editing the org.

**Two Pull Requests are waiting and both are green.**
Merge them one at a time, waiting for each deployment to finish. Merging two at once into the same
branch is how a release manager loses an evening.

## Check your work

Welcome page > **Training: Level 3** > **Check my work**, then pick **Lab 3.4**.

## Go deeper

- [Automated cleaning](https://sfdx-hardis.cloudity.com/salesforce-devops-config-cleaning/)
- [Delta deployments](https://sfdx-hardis.cloudity.com/salesforce-devops-config-delta-deployment/)
- [Overwrite management](https://sfdx-hardis.cloudity.com/salesforce-devops-config-overwrite/)

[Next: Lab 3.5 - Promote to UAT and write the release notes](3-5-promote-to-uat-and-write-release-notes.md){ .md-button .md-button--primary }
