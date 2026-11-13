---
id: lab-1-7
title: "Lab 1.7 - Capstone: deliver a User Story on your own"
description: "Deliver a Salesforce User Story end to end with no step-by-step: branch, build, retrieve, commit, Pull Request and deployment with sfdx-hardis."
level: 1
lab: 7
lang: en
source_rev: ""
screenshots:
  - annotated/web/github-star-sfdx-hardis
depends_on:
  commands: [hardis:work:new, hardis:work:save]
  flags: []
  config: [autoCleanTypes]
  panels: [pipeline, orgManager]
  docs: [salesforce-devops-use-home]
---

# Lab 1.7 - Capstone: deliver a User Story on your own

**Level**: 1 Contributor basics

**Time**: ~25 min<!-- observed --> (observed: median 27 min, 44 learners, fastest 7 min)<!-- /observed -->

**You will**: do the whole loop again with no step-by-step, which is the only way to find out
whether you learned it.

## The situation

Second ticket, second day. Nobody is going to walk you through this one.

> **US-016 - Let the crew leave notes on an installation**
>
> As a delivery crew member, I want a free text notes field and a list view of my open
> installations, so that I hand over cleanly to the next shift.
>
> Acceptance criteria:
>
> - A **Crew Notes** field exists on Installation, long text, editable by the crew
> - It is on the Installation page layout, where the crew can see it
> - An **Open Installations** list view exists on Installation, for every user
> - The crew permission set grants the field

## Before you start

- [ ] [Lab 1.6](1-6-pull-request-deployment-check-and-merge.md) finished: US-014 is merged into `integration` and deployed
- [ ] The Source Control panel shows nothing left uncommitted

## What to do

No numbered clicks this time. The loop, in order:

1. Start the User Story. Branch `US-016-crew-notes`, target `integration`, then **Scratch org**
   and **Reuse scratch org helios-dev**. Your org already has US-014, because you built it there
2. Build it in `helios-dev`
   - A **Long Text Area** field `Crew_Notes__c` on `Installation__c`, the data type the field
     wizard lists as **Text Area (Long)**, 4000 characters, with a description and help text
   - Grant it **Read** and **Edit** on `Helios Delivery Crew`, because a crew member writes notes.
     Nobody else gets it yet: the planners' turn comes in Level 2
   - On the Installation page layout
   - A list view on Installation called **Open Installations**, visible to all users, with
     **Filter by Owner** on **All installations**, filtered on a status that is not Completed, and
     showing the account, the status, the install date and Panels Required
3. Retrieve it. **Commit changes**, **Recent Changes**, **Search Metadata**, and take the
   field, the layout, the list view and the permission set. Nothing else. Commit them
4. Publish, and read the **Git Delta package.xml** report before pushing. Four things, all
   yours
5. Open the Pull Request into `integration` in your own fork, get it green, merge
6. Check the integration org after the deployment job

## The one thing that catches everybody

The permission set and the field travel together. If you retrieve the field and forget the
permission set, the deployment succeeds and nobody can see the field. If you retrieve the
permission set and forget the field, the deployment fails outright, because a permission set cannot
grant something that is not there. Take both, every time. It is the same pair you took in [Lab 1.5](1-5-retrieve-commit-and-publish-your-changes.md),
and the list view has the same habit: it names Panels Required, so it needs that field to be in the
target org already, which it is since [Lab 1.6](1-6-pull-request-deployment-check-and-merge.md).

## What you should see

In `helios-integration`, after the merge deployment:

- `Crew Notes` granted, **Read** and **Edit**, on the **Helios Delivery Crew** permission set:
  **Setup > Permission Sets > Helios Delivery Crew > Object Settings > Installations**. You will not
  see the field on the record yourself: you hold the planners' permission set, and this story does
  not grant it to them
- **Open Installations** in the list view picker on the Installations tab

## If it goes wrong

Everything you need is in Labs 1.3 to 1.6. The failures are the same ones, and the **If it goes wrong**
sections there cover them. Resist the urge to reread the whole lab: look up the one step you are
stuck on.

If your repository ends up in a state you cannot untangle, Welcome page > **Training: Level 1** > **Reset
this level** puts it back to the start of Level 1 and you can redo the capstone cleanly. Using it
is not failing. Not using it and giving up is.

## Check your work

Welcome page > **Training: Level 1** > **Check my work**, then pick **Everything in level 1, capstone included**.

Six checks should pass. The receipt lines it prints are your progress record, and the claim below
picks them up on its own.

## Claim your badge

You finished Level 1.

Welcome page > **Training: Level 1** > **Claim my badge**.

It checks the whole level again first and refuses to claim anything that does not pass: a claim that
would be rejected is a claim not worth opening. It then asks one question, your Trailblazer
username, because your badge page links to your Trailhead profile: it is the last part of the
address of that profile, and the command says where to find it. Then it opens the claim form of the training
repository in your browser, with the level, that username, your fork (your own copy of the course repository on GitHub, for example `github.com/my-username/sfdx-hardis-training`) and your receipts already in
it. One field is not filled in: pick your level in the **Level** dropdown, because GitHub does
not prefill a dropdown from a link and the form refuses to submit while it says *None*. Then tick
the three boxes and click **Create**.

Those three boxes are yours to tick, and nothing ticks them for you. They say your fork is public
and your GitHub handle becomes public in the training repository, which is a decision about your
name rather than a formality.

A job then clones your fork, re-runs every check above against it, and answers on the issue. Nobody
reviews it by hand, so it usually takes a couple of minutes. If something does not verify, the
comment names the exact lab and what it looked for, you fix it, and you edit the issue to run it
again.

Your fork has to be public for the audit to read it. If it is private, the command offers to
make it public.

!!! warning "It is a badge, not a certification"
    There is no exam and no accreditation here. Share it under *Featured* on LinkedIn, not under
    *Licenses & certifications*.

!!! tip "If the course helped you"
    [hardisgroupcom/sfdx-hardis](https://github.com/hardisgroupcom/sfdx-hardis)
    is the open source project this whole course is about. A star is how a project like it stays
    visible: open its page and click **Star** **(1)**, on the right of the repository name. Give it a
    star if you liked this course!

    ![The Star button of the sfdx-hardis repository on GitHub](../../_assets/annotated/web/github-star-sfdx-hardis.png)

!!! tip "Put it on your LinkedIn banner"
    [Trailhead Banner](https://thb.nabondance.me/) draws a
    LinkedIn cover image from a Trailblazer username, and it shows the highest sfdx-hardis training
    badge you claimed here. Type your username, generate the picture, and set it as your LinkedIn cover.

## What comes next

Level 1 taught you the loop when everything goes right. Level 2 is the other half: the deployment
that fails on a dependency you did not know about, the field that cannot be made required, the
teammate who edited the same flow as you.

It is recommended for any contributor, and required before Level 3.

[Continue to Level 2 - Contributor advanced](../level-2-contributor-advanced/index.md){ .md-button .md-button--primary }

## On a real project

Your own team has no pipeline like this one yet? Setting one up on an org with years of history in
it is what [Cloudity](https://sfdx-hardis.cloudity.com/salesforce-devops-home/#get-help-from-cloudity), the company behind sfdx-hardis and this course, does for its
customers: setup, training and support. It is one of its practices, next to Agentforce, Revenue
Cloud, Field Service and [the others](https://cloudity.com/services/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=capstone-1).

[![Cloudity, Salesforce consulting: Agentforce, Data Cloud, Revenue Cloud, Field Service, Marketing Cloud, Integration, Managed Services, DevOps](../../_assets/brand/cloudity-services-en.png){ .cloudity-banner .wide-only loading=lazy }](https://cloudity.com/services/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=capstone-1)
[![Cloudity, Salesforce consulting: Agentforce, Data Cloud, Revenue Cloud, Field Service, Marketing Cloud, Integration, Managed Services, DevOps](../../_assets/brand/cloudity-services-en-narrow.png){ .cloudity-banner .narrow-only loading=lazy }](https://cloudity.com/services/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=capstone-1)
