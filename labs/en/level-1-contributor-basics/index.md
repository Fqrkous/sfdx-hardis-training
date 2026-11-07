---
title: "Level 1 - Salesforce DevOps contributor basics"
description: "Free hands-on Salesforce DevOps training for admins and developers: deliver your first User Story with Git, Pull Requests and sfdx-hardis in VS Code."
id: l1-home
level: 1
lang: en
---

# Level 1 - Salesforce DevOps contributor basics

**Time**: about 2 h, in one sitting or seven.<!-- observed --> Observed on Labs 1.3 to 1.7: median 1 h 26, 66 learners, fastest 32 min.<!-- /observed -->

**Before you start**: nothing. This is the first level.

## The story

You joined **Helios Energy** on Monday. They install residential solar panels across southern
Europe, sales runs on Salesforce, and the delivery crews track every installation in a custom app
called **Helios Delivery**.

The team already has a pipeline. There is a Git repository, an integration org, a Pull Request
check that deploys your work before anyone reviews it. Nobody is going to teach you Git: the
VS Code extension does the technical part, and by Friday you are expected to have delivered your
first story.

That is this level.

## Six words, before anything else

If you have never used Git, this is the whole vocabulary. Nothing in Level 1 assumes you knew it
beforehand, and you will not have to type a single Git command: the VS Code extension does that
part.

| Word             | What it means                                                                                                                                             |
|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Repository**   | One project folder, plus every version of it there has ever been. Often shortened to "repo". The Helios repo lives on GitHub.                             |
| **Fork**         | Your own copy of somebody else's repository, made in one click, under your GitHub account. You can change anything in it, and the original never notices. |
| **Clone**        | Downloading a repository onto your laptop, so VS Code can open it.                                                                                        |
| **Branch**       | A named line of work inside a repository. You change what you need on yours, and the team's version stays untouched until you merge.                      |
| **Commit**       | Recording a set of changes in the repository's history, with a message saying why.                                                                        |
| **Pull Request** | Asking for your branch to be folded into the team's. It is where the checks run and where a colleague reads what you did. Everyone says "PR".             |

## What you will do

| Lab                                                         | Title                                                 | Time   |
|-------------------------------------------------------------|-------------------------------------------------------|--------|
| [1.1](1-1-install-vs-code-and-sfdx-hardis.md)               | Install VS Code, Git and sfdx-hardis                  | 15 min |
| [1.2](1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md) | Create your Dev Hub, scratch orgs and CI/CD pipeline  | 30 min |
| [1.3](1-3-start-a-user-story-on-a-git-branch.md)            | Start a User Story on its own Git branch              | 10 min |
| [1.4](1-4-build-a-custom-field-in-your-org.md)              | Build a custom field in your Salesforce org           | 10 min |
| [1.5](1-5-retrieve-commit-and-publish-your-changes.md)      | Retrieve, commit and publish your Salesforce changes  | 15 min |
| [1.6](1-6-pull-request-deployment-check-and-merge.md)       | Open a Pull Request, pass the deployment check, merge | 15 min |
| [1.7](1-7-capstone-deliver-a-user-story-on-your-own.md)     | Capstone: deliver a User Story on your own            | 25 min |

## The Training menu

Everything this course asks you to run outside the product's own buttons lives in one menu. Open the
**Welcome page**, and under **CUSTOM MENUS** click the **Training: Level 1** card. Its commands take
over the page:

![The Level 1 training menu, opened on the Welcome page](../../_assets/annotated/vscode/welcome-custom-menu.png)

Seven of them, and the labs call them by these names:

| Command                            | What it does                                                                                                                                   |
|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| **Set up my training environment** | Forks the repository, creates your scratch orgs with the app, wires the pipeline                                                               |
| **Where am I?**                    | Says which level and lab you reached, and what to do next                                                                                      |
| **Check my work**                  | Verifies the lab you just finished                                                                                                             |
| **Trigger my workflows**           | Starts the checks of your Pull Request when your fork had Actions switched off                                                                 |
| **Claim my badge**                 | Checks the whole level, then opens your badge claim filled in                                                                                  |
| **Update my course**               | Brings the changes the course received since you forked it, through a Pull Request into `integration`                                          |
| **Reset this level**               | Starts Level 1 again: `integration`, and if you want the lab branches and the orgs ([Start the course over](../help.md#start-the-course-over)) |

There is one menu per level, and each holds only what that level needs, so nothing in front of you is
for a lab you have not reached.

The same commands are in the **SFDX HARDIS** view of the left bar, under **Training: Level 1**
**(1)**, one per line **(2)**. Either route runs the same thing, and the labs name the Welcome page
because a card is easier to point at than a row.

![The Level 1 training menu in the sfdx-hardis command list](../../_assets/annotated/vscode/sidebar-commands-custom-menu--training-menu.png)

## Three things that are true for the whole course

**You work in your own copy.** Everything in this course happens in a repository that belongs to
you and nobody else. Your changes, your mistakes, your fixes, and nothing you do reaches anybody
else's work. Lab 1.2 sets that copy up for you in one click, and explains why it has to be that way.

**You click, you do not type command lines.** Every action in these labs is a button in the VS Code extension.
Where a command appears, it is in an **Under the hood** block, which explains what the button did.
You never have to retype it.

**You can always start over.** If a lab goes wrong, Welcome page > **Training: Level 1** > **Reset this
level** puts `integration` back to the start of the level, and offers to clear the branches of its
labs and set your orgs up again. One botched lab does not end your course: [Start the course
over](../help.md#start-the-course-over) says what each answer does.

## If you get stuck

Every lab has an **If it goes wrong** section with the two or three failures we know happen.
Beyond that, the sfdx-hardis documentation at
[sfdx-hardis.cloudity.com](https://sfdx-hardis.cloudity.com/) is the reference, and each lab links
the exact pages for its topic.

[Start with Lab 1.1](1-1-install-vs-code-and-sfdx-hardis.md){ .md-button .md-button--primary }
