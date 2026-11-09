---
title: "Level 3 - Salesforce DevOps release manager"
description: "Own a Salesforce CI/CD pipeline with sfdx-hardis: environments, JWT authentication, promotions, release notes, hotfixes, monitoring and DORA metrics."
id: l3-home
level: 3
lang: en
---

# Level 3 - Salesforce DevOps release manager

**Time**: about 9 h 15.<!-- observed --> Observed on Labs 3.1 to 3.11: median 10 h 30, 11 learners, fastest 2 h 56.<!-- /observed -->

**Before you start**: [Level 1](../level-1-contributor-basics/index.md) **and** [Level 2](../level-2-contributor-advanced/index.md). Both
are required, and the badge audit checks both before it looks at anything here.

## Why Level 2 is not optional

A release manager reviews other people's deployment errors, deployment actions and conflicts. Those
are exactly what Level 2 puts you through. Somebody who has never solved a deployment error cannot
judge whether a contributor solved theirs properly, and the reviews they give will be about
formatting.

If you skipped Level 2, do it. It is a few hours and it is the difference between approving Pull
Requests and understanding them.

## The story

Victor Squeeker left. He was the release manager, he set the pipeline up two years ago, and he
never finished it.

What you inherit works, in the sense that contributors deliver into `integration` every day and the
business tests in `uat`. What it does not have:

- **No preprod and no production in the pipeline.** The branches exist. Nothing deploys to them
- **No proper CI authentication.** There are two refresh-token secrets somebody added in a hurry
- **No monitoring.** Nobody finds out about a problem in production until a user calls
- **No release notes and no metrics.** Nobody can say what shipped last month or how long it took
- **No generated documentation.** The org is two years old and the only description of it is Victor

Your first week is finishing the pipeline. Then you run it.

## The Training menu

Everything this course asks you to run outside the product's own buttons lives in one menu. Open the
**Welcome page**, and under **CUSTOM MENUS** click the **Training: Level 3** card. Its commands take
over the page:

![The Level 3 training menu, opened on the Welcome page](../../_assets/annotated/vscode/welcome-custom-menu-3.png)

Ten of them, and the labs call them by these names:

| Command                               | What it does                                                                                                                                   |
|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| **Set up my training environment**    | Rebuilds a scratch org that expired, and points the pipeline at it                                                                             |
| **Where am I?**                       | Says which level and lab you reached, and what to do next                                                                                      |
| **Set up one of my training orgs**    | Deploys the Helios app and its data into an org you choose                                                                                     |
| **Simulate my teammates**             | Creates the teammate branches and Pull Requests a lab needs                                                                                    |
| **Publish my pipeline configuration** | Opens a Pull Request into `integration` with the configuration you changed                                                                     |
| **Check my work**                     | Verifies the lab you just finished                                                                                                             |
| **Claim my badge**                    | Checks the whole level, then opens your badge claim filled in                                                                                  |
| **Update my course**                  | Brings the changes the course received since you forked it, through a Pull Request into `integration`                                          |
| **Reset this level**                  | Starts Level 3 again: `integration`, and if you want the lab branches and the orgs ([Start the course over](../help.md#start-the-course-over)) |
| **Clean up a training org**           | Removes the Helios app and its data from an org                                                                                                |

There is one menu per level, and each holds only what that level needs, so nothing in front of you is
for a lab you have not reached.

The same commands are in the **SFDX HARDIS** view of the left bar, under **Training: Level 3**.
Either route runs the same thing.

## What you will do

| Lab                                                       | Title                                                        | Time   |
|-----------------------------------------------------------|--------------------------------------------------------------|--------|
| [3.1](3-1-configure-the-pipeline-up-to-production.md)     | Configure the CI/CD pipeline up to production                | 2 h    |
| [3.2](3-2-review-a-contributor-pull-request.md)           | Review and merge a contributor Pull Request                  | 25 min |
| [3.3](3-3-deploy-to-integration-and-read-the-log.md)      | Read the deployment log, and what .forceignore hides from it | 1 h 20 |
| [3.4](3-4-merge-colliding-pull-requests.md)               | Three Pull Requests in one release: review the merge order   | 15 min |
| [3.5](3-5-promote-to-uat-and-write-release-notes.md)      | Promote to UAT and write the release notes                   | 50 min |
| [3.6](3-6-release-to-production-and-read-dora-metrics.md) | Release to production and read your DORA metrics             | 1 h    |
| [3.7](3-7-hotfix-and-retrofit.md)                         | Production is broken: hotfix and retrofit                    | 35 min |
| [3.8](3-8-monitor-your-production-org.md)                 | Monitor your production org                                  | 15 min |
| [3.9](3-9-generate-the-project-documentation.md)          | Generate the Salesforce project documentation                | 5 min  |
| [3.10](3-10-promote-a-subset-with-promotion-branches.md)  | Promote a subset with promotion branches (Beta)              | 1 h 25 |
| [3.11](3-11-capstone-run-a-weekly-release-cycle.md)       | Capstone: run a weekly release cycle                         | 1 h    |

## One more org

Levels 1 and 2 ran on one Developer Edition org, `helios-prod`, and the three scratch orgs it
created: `helios-dev`, `helios-integration` and `helios-uat`. This level adds production and the
stage before it, and needs one more signup.

Before Lab 3.1, sign up for one more free Developer Edition org at
[developer.salesforce.com/signup](https://developer.salesforce.com/signup) and connect it in **Orgs
Manager** with the alias `helios-preprod`. Then seed both Developer Edition orgs with
**Training: Level 3 > Set up one of my training orgs**: `helios-preprod`, and `helios-prod`, which
until now only created the others and held nothing. If it stops on `Profile Helios Crew`, the
**If it goes wrong** section of [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md) says why.

Salesforce refuses a second Developer Edition org on an email address that already has one. Give
the same address with a `+` and a word before the `@`, for example `myname+preprod@gmail.com`:
the mail still reaches your inbox, and Salesforce sees a new address. Sign up from a private window,
signed out of Trailhead, or the page shows a short form that only asks for a country.

The setup takes a few minutes per org, and its counter (`49/64` for example) can stay on one number
for several of them near the end. Leave VS Code alone until it says the app is deployed. If VS Code
says the window appears to be stuck, pick **Wait**.

`helios-prod` gets the same sources as the other orgs. Nothing seeds a deployment history, and the
seeding itself is not a deployment of the pipeline, so the DORA metrics of Lab 3.6 hold only the
deployment jobs your own merges ran.

If a scratch org expired since Level 2, **Training: Level 3 > Set up my training environment**
rebuilds it first.

## Your role changes

In Levels 1 and 2 you built User Stories and opened their Pull Requests. A release manager does
not. Your teammates open the Pull Requests, **Simulate my teammates** plays them, and you review
them, merge them or send them back. What you create yourself is the pipeline: its configuration,
which **Publish my pipeline configuration** sends to `integration` through a Pull Request, and the promotions from one major
branch to the next, `integration` to `uat`, `uat` to `preprod`, `preprod` to `main`.

[Start with Lab 3.1](3-1-configure-the-pipeline-up-to-production.md){ .md-button .md-button--primary }
