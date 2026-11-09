---
id: lab-3-11
title: "Lab 3.11 - Capstone: run a weekly release cycle"
description: "Run a full week as a Salesforce release manager with no step-by-step: review, integrate, promote to UAT, release to production and measure."
level: 3
lab: 11
lang: en
source_rev: ""
screenshots:
  - annotated/web/github-star-vscode-sfdx-hardis
  - annotated/vscode/welcome-custom-menu-3
depends_on:
  commands: [hardis:project:deploy:smart, hardis:doc:release-notes, hardis:doc:dora-report]
  flags: []
  config: [mergeTargets, productionBranch]
  panels: [pipeline, doraMetrics]
  docs: [salesforce-devops-release-home, salesforce-devops-setup-checklist]
---

# Lab 3.11 - Capstone: run a weekly release cycle

**Level**: 3 Release Manager

**Time**: ~1 h<!-- observed --> (observed: median 1 h 02, 12 learners, fastest 20 min)<!-- /observed -->

**You will**: do a whole week in one sitting, with no step-by-step, and end with something you could
show somebody.

## The situation

Monday morning. Two Pull Requests are waiting, the business expects a release on Thursday, and
nobody is going to tell you the order to do things in.

## Before you start

- [ ] Labs 3.1 to 3.10 finished
- [ ] All four pipeline orgs working, all four branches deploying

## The week

### Monday: take in what contributors sent you

Two Pull Requests wait. US-020, open since [Lab 3.4](3-4-merge-colliding-pull-requests.md) and still failing. And a new one from Romain:
**Training: Level 3** > **Simulate my teammates**, and pick **US-055 Install Date says which day it
means**.

Two more things are waiting, and not in a Pull Request: US-058, the warranty term, and
US-060, the scaffolding flag, sitting in `uat` since [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) because the promotion branch
went around them. The wording was approved over the weekend and the crews were briefed on Monday.
Nothing to do about them today, and Thursday is where it matters.

![The Level 3 training menu on the Welcome page](../../_assets/annotated/vscode/welcome-custom-menu-3.png)

For each of the two:

- Read the sfdx-hardis comment
- Read the diff with the four questions from [Lab 3.2](3-2-review-a-contributor-pull-request.md): does it match the story, does anything
  disappear, are permissions on a permission set, is it reversible
- Merge it or send it back with a comment, and say why

US-020 still fails its check. It stays with its author, with the failure named. Do not fix it
yourself: you review and merge what contributors send, and you do not write it for them.

### Tuesday: merge and deploy to integration

Merge what is ready, in an order you can justify. Watch the deployment, read what it sent and what
it skipped, and check the org afterwards.

### Wednesday: promote to UAT

Create the promotion from `integration` into `uat`. Read the deployment actions it carries before
merging, and do the manual steps afterwards.

Verify in `helios-uat` that the stories are usable, not only deployed.

### Thursday: release to production

Promote `uat` into `preprod` first, and check `helios-preprod` behaves. Then create the release, the Pull
Request from `preprod` into `main`, titled `Release ...`. Read the **Metadata** row of the sfdx-hardis comment and stop if anything is being
deleted that you were not expecting. Merge, watch, verify, do the manual steps.

Everything [Lab 3.7](3-7-hotfix-and-retrofit.md) put in at `preprod` is already in `main`, so this release should not be moving
it again. Read the **Metadata** row with that in mind: what goes out this week is Romain's help text,
the retrofits travelling up from `integration`, and US-058 and US-060, which have been waiting in
`uat` since [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md). A `deleted` count in that row is still the thing to stop on.

That promotion is also what ends the exception. US-057, US-059 and US-061 went to `preprod` on
their own last week; this one carries US-058 and US-060 the ordinary way, and `uat` and `preprod`
hold the same thing again. It merges without a conflict because [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) step 9 retrofitted the
promotion into `integration` the same day: the two files solved on the promotion branch meet their
originals with a common point git knows about. Check it rather than assume it: the `uat` node of
the diagram counts zero User Stories waiting once the promotion is merged, and `helios-preprod` has
a Warranty Years field on Panel Batch at last. A promotion branch that is never followed by a full
promotion is how a pipeline stops being a pipeline.

Then generate the release notes of the release to `main`, add the sentence at the top that says what
this release is for, and put them in the description of the Pull Request from `preprod` into
`main`, the way [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md) did for `uat`.

### Friday: measure

Open the **DORA metrics** panel with **Generate DORA Metrics** in the gear menu of the **DevOps Pipeline**, as in [Lab 3.6](3-6-release-to-production-and-read-dora-metrics.md), and
read **Time to production** in the pipeline flow, the row of `main`, then the one of
`integration`. Export the report again, **Export** then **Markdown report**, and compare it with the baseline you took in [Lab 3.6](3-6-release-to-production-and-read-dora-metrics.md).

The panel compares each number with the previous period by itself, with an arrow. Your pipeline is
younger than the 90 days of a period, so the period before is empty and no arrow is drawn yet: this
week, the baseline file is still what you compare with.

Then read back over the week, and answer three questions for yourself, the ones a successor would
ask:

- What went out this week, and where are its release notes? In the description of the release Pull
  Request
- What did not, and why? US-020, sent back with its failure named
- What did you have to do by hand? Every manual step is a candidate for a deployment action next
  time

## What makes this the capstone

Nothing here is new. Every step is a lab you have done. What is new is that nobody told you the
order, and the order is the job.

Three decisions you had to make without a lab telling you:

1. Which Pull Requests go into this release and which wait
2. Whether the failing one blocks the release
3. Whether the manual steps are acceptable, or whether the release waits until somebody automates
   them

Those three are what a release manager is for. The tooling handles everything else, which is the
point of having it.

## What you should see

- Two Pull Requests reviewed, one merged, one sent back with a reason
- `integration`, `uat`, `preprod` and `main` all carrying the release, in that order, each through
  its own deployment
- Release notes in the description of the release Pull Request, with a human sentence at the top
- A second DORA report to compare with the baseline of [Lab 3.6](3-6-release-to-production-and-read-dora-metrics.md)
- `uat` counting zero User Stories waiting: US-058 and US-060 caught up with the three stories
  promoted ahead of them, and the pipeline is aligned again

## If it goes wrong

**A check fails and names a lab you are sure you did.**
Read what it says it looked for. The checks assert outcomes on the `integration` branch, not effort:
a story built in your org but never merged does not count, and neither does one merged into a branch
that is not `integration`.

**The [Lab 3.7](3-7-hotfix-and-retrofit.md) check says the hotfix is not in `integration`.**
The hotfix reached `main` in [Lab 3.7](3-7-hotfix-and-retrofit.md) part 2, and part 3 is what brings it back down. If you stopped
after the release, go back and do the retrofit: the check reads both branches, because a fix that
production has and `integration` has not is a fix the next story quietly removes.

**A teammate simulation says there is nothing to commit.**
That story is already merged. Each teammate story merges once per level, and the ones Level 3 uses
are listed in each lab. Nothing is wrong: move on.

**Thursday's promotion of `uat` into `preprod` reports conflicts.**
The retrofit of [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) step 9 is missing, and git meets the promotion's two files again with
nothing telling it which side was a decision. Do that retrofit now, from `preprod` into
`integration`, then promote `integration` into `uat` again before you promote `uat`: the conflict is
gone, because `uat` then carries the reconciliation.

**A deployment is green and the feature is not in the org.**
Open the log and find **Listing Post-deployment actions**. If it says none were defined, the actions
never ran, and [Lab 2.4](../level-2-contributor-advanced/2-4-ship-reference-data-and-a-batch-with-deployment-actions.md) explains what to do about it. A green job proves the metadata went in
and nothing else.

**The whole thing is too much to finish in one sitting.**
It is meant to be a week. Stop at the end of any day: each one ends with something merged, and
nothing carries an unfinished state into the next.

## Check your work

Welcome page > **Training: Level 3** > **Check my work**, then pick **Everything in level 3, capstone included**.

Eleven checks.

## Claim your badge

Welcome page > **Training: Level 3** > **Claim my badge**.

A Level 3 claim re-runs the Level 1 and Level 2 audits first. That is how the prerequisite is
enforced, because a Trailmix cannot gate anything. The command runs those same audits on your
machine before it opens anything, so you find out here rather than on the issue.

Then, as for the two other levels: it asks for your Trailblazer username, the last part of the
address of your Trailhead profile, and opens the claim form filled in. Pick your level in the
**Level** dropdown, which a link cannot prefill, then tick the three boxes and submit.

The badge is **sfdx-hardis Release Manager**.

!!! tip "If the course helped you"
    [hardisgroupcom/vscode-sfdx-hardis](https://github.com/hardisgroupcom/vscode-sfdx-hardis) is the
    extension every click of this course went through. A star is how an open source project stays
    visible: open its page and click **Star** **(1)**, on the right of the repository name. Give it a star if you liked this
    course!

    ![The Star button of the vscode-sfdx-hardis repository on GitHub](../../_assets/annotated/web/github-star-vscode-sfdx-hardis.png)

!!! tip "Put it on your LinkedIn banner"
    [Trailhead Banner](https://thb.nabondance.me/) draws a LinkedIn cover image from a Trailblazer
    username, and it shows the highest sfdx-hardis training badge you claimed here. Type your
    username, generate the picture, and set it as your LinkedIn cover.

## What to do with all this

Three things worth doing in the week after you finish, in order of usefulness:

One: take the setup checklist to your own project. The
[setup checklist](https://sfdx-hardis.cloudity.com/salesforce-devops-setup-checklist/) is the list
of everything a real pipeline needs. You have now done most of it once. Go through it against
whatever project you actually work on and count what is missing.

Two: delete your training orgs, or keep them deliberately. The scratch orgs delete themselves
after 30 days. The two Developer Edition orgs holding a fictional solar company are fine to keep as a
place to try things, and `helios-prod` stays a Dev Hub you can create scratch orgs from. If you keep
them, delete the `SFDX_AUTH_URL_INTEGRATION` and `SFDX_AUTH_URL_UAT` secrets, which [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md) left in
place, and remember the JWT certificates in your fork (your own copy of the course repository on GitHub, for example `github.com/my-username/sfdx-hardis-training`) are real credentials to real orgs.
The nightly crew capacity job of [Lab 2.4](../level-2-contributor-advanced/2-4-ship-reference-data-and-a-batch-with-deployment-actions.md) keeps running in every org it was scheduled in, and
emails you a summary each night. **Training: Level 3** > **Clean up a training org** stops it, and
removes the Helios app and its data from the org you pick. To keep Helios and lose only the email,
open **Setup** > **Scheduled Jobs** in the org and click **Del** on the row of the job, `Helios crew capacity nightly` if you kept the
name of the lab.

Three: keep promotion branches as the exception. [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) had you assemble one, and this
week put the pipeline back. On a real project the pressure runs the other way: the first subset is
agreed for a good reason, the second because the first one worked, and after a quarter nobody can
say what any org contains. If you find yourself assembling one every week, the thing to fix is the
sign-off, not the tooling.

## When you would rather not do it alone

You now know what a release cycle costs: somebody in the seat, every week. When nobody on your team
can hold it, [Cloudity](https://sfdx-hardis.cloudity.com/salesforce-devops-home/#get-help-from-cloudity), the company behind sfdx-hardis and this course, sets the
pipeline up, trains the team, and provides a release manager as a service. Its
[Managed Services](https://cloudity.com/services/managed-services/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=capstone-3) go further and run the org for you.

The same company delivers Agentforce, Data Cloud, Revenue Cloud and Field Service projects:
[see everything Cloudity does](https://cloudity.com/services/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=capstone-3).

[![Cloudity, Salesforce consulting: Agentforce, Data Cloud, Revenue Cloud, Field Service, Marketing Cloud, Integration, Managed Services, DevOps](../../_assets/brand/cloudity-services-en.png){ .cloudity-banner .wide-only loading=lazy }](https://cloudity.com/services/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=capstone-3)
[![Cloudity, Salesforce consulting: Agentforce, Data Cloud, Revenue Cloud, Field Service, Marketing Cloud, Integration, Managed Services, DevOps](../../_assets/brand/cloudity-services-en-narrow.png){ .cloudity-banner .narrow-only loading=lazy }](https://cloudity.com/services/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=capstone-3)

## Thank you

If a lab was unclear, wrong, or assumed something it should not have, say so: open an issue on the
training repository. The labs that are hardest to follow are usually the ones nobody reported.

## Go deeper

- [Release Manager Guide](https://sfdx-hardis.cloudity.com/salesforce-devops-release-home/)
- [Setup checklist for a real project](https://sfdx-hardis.cloudity.com/salesforce-devops-setup-checklist/)
- [Promotion branches (Beta)](https://sfdx-hardis.cloudity.com/salesforce-devops-promotion-branches/)
