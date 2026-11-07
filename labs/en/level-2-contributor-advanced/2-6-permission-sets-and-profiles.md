---
id: lab-2-6
title: "Lab 2.6 - Permission sets, profiles and why a grant disappears"
description: "A permission granted on a Profile vanishes after a green deployment. Learn how sfdx-hardis cleans profiles, and grant access with a permission set."
level: 2
lab: 6
lang: en
source_rev: ""
screenshots:
  - annotated/vscode/pipeline-cards--new-user-story
  - annotated/vscode/pipeline-packages-menu--package-xml
  - annotated/vscode/pipeline-config
depends_on:
  commands: [hardis:mdapi:read, hardis:work:save]
  flags: [--active-only]
  config: [autoCleanTypes, minimizeProfiles, autoRemoveUserPermissions]
  panels: [metadataRetriever, pipelineConfig, packageXml]
  docs: [salesforce-devops-work-on-user-story-profiles]
---

# Lab 2.6 - Permission sets, profiles and why a grant disappears

**Level**: 2 Contributor advanced

**Time**: ~30 min<!-- observed --> (observed: median 31 min, 16 learners, fastest 10 min)<!-- /observed -->

**You will**: chase a permission that vanishes between a green deployment and the target org, and
find out it was removed on purpose.

## The situation

> **US-033 - Crews can read the panel batch cost**
>
> As a delivery crew member, I want to see the cost of the batch I am installing, so that I report
> damage with the right value.

You grant the permission, publish, the check is green, the deployment is green, and the permission
is not in the integration org. Nothing failed. Nothing warned you.

This is the failure mode that makes people distrust a pipeline, and it is entirely explainable.

## Before you start

- [ ] [Lab 2.5](2-5-pass-code-quality-and-apex-test-coverage.md) finished and merged
- [ ] `helios-dev` level with `integration`

## Steps

### 1. Take the story and do it the way an admin would

Goal: the Cost grant made on the Helios Crew profile, published and merged.
Refresher: [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md)

#### Do

1. Click **New User Story** **(2)**, under **Project Contribution Workflow** **(1)** of the DevOps
   Pipeline panel. Name `US-033-batch-cost-visibility`, org `helios-dev`

   ![The New User Story card of the DevOps Pipeline panel](../../_assets/annotated/vscode/pipeline-cards--new-user-story.png)

2. Find the Profile the crews log in with: in the **DevOps Pipeline** panel, open the **Deployment
   packages** menu **(1)**, the icon of a box with an arrow in the header, which shows its name only
   when you hover it, then **Package XML** **(2)**, as in
   [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md). The
   **Profile** row lists both, `Admin` and `Helios Crew`

   ![The Deployment packages menu of the DevOps Pipeline panel, with Package XML](../../_assets/annotated/vscode/pipeline-packages-menu--package-xml.png)

3. In `helios-dev`, the quick way: **Setup > Object Manager > Panel Batch > Fields & Relationships >
   Cost > Set Field-Level Security**, tick **Visible** for the **Helios Crew** profile, **Save**
4. Retrieve it the usual way: **Commit changes**, **Recent Changes**, **Search Metadata**, tick the
   `Helios Crew` Profile, retrieve, and commit it from **Source Control**
5. Then **Save / Publish**, push, Pull Request, green, merge

#### Why

The crews log in with the **Helios Crew** profile. It is one of the two Profiles this repository
carries, next to `Admin`, the System Administrator profile.

That is how most people grant a permission, and it is what this lab is built on.

The file is much longer than the one in the repository. The **Retrieve mode** of the Metadata
Retriever reads **Auto**: it retrieves a Profile whole, every permission it grants in `helios-dev`,
so your new grant on `Cost` is in it, along with everything else the profile can do.

#### You should now see

- The `Helios Crew` Profile, much longer than before, committed and merged with a green check

### 2. Discover that nothing happened

Goal: the grant missing from `helios-integration`, after a deployment that says it worked.

#### Do

1. Open `helios-integration` and check the field-level security of **Panel Batch > Cost**
2. Go back to the Pull Request and read the deployment comment, and its folded **📋** table

#### Why

What was deployed is not what you committed, though.

#### You should now see

- The **Helios Crew** column not ticked: the permission is not there
- The deployment comment saying **✅ Deployed to `integration`**, and its folded **📋** table
  counting a **Profile** among the components that changed

### 3. Read your own diff

Goal: the commit that took your grant back out, and the setting that made it.

Your commit had the permission in it. You saw it in the diff before you clicked Commit.

#### Do

1. Open the **Source Control** panel and look at the history of your branch
2. Read the commit **Save / Publish** made after yours, `chore(sfdx-hardis): clean sfdx project`
3. Find the setting that made it: open the **DevOps Pipeline** panel, then **Configure Pipeline
   Settings** in the gear menu at its top right, and click the **Salesforce Project** tab. The
   setting is **Auto-Cleaning types**, and its list holds **Minimize Profiles**. Step 6 comes back
   to this panel, with its picture

#### Why

The commit takes the permission you added straight back out, along with every other section of the
file that a Permission Set could carry. What is left is what only a Profile can hold.

That is a cleaning rule this project switched on. The panel shows it by its label, **Minimize
Profiles** in **Auto-Cleaning types**. The project configuration file, `config/.sfdx-hardis.yml`,
stores it by its key, `minimizeProfiles` in the `autoCleanTypes` list, and that key is the name the
documentation and the rest of this lab use.

#### You should now see

- The cleaning commit removing your grant from the Profile
- **Minimize Profiles** listed in **Auto-Cleaning types**, on the **Salesforce Project** tab

### 4. Understand why a project would ever do that

Goal: you can say why the pipeline keeps permissions off Profiles. This step has no clicks.

#### Why

Profiles are the single worst metadata type to version, for three reasons that all bite at once:

1. They are enormous and they are shared. One Profile file lists every object, field, tab, app
   and class permission in the org. Two people touching two unrelated stories both produce a
   thousand-line diff of the same file, and they conflict every time
2. A retrieved Profile can say no to what it did not have. Retrieved the standard way, it lists
   the fields and objects of your package with `false` wherever the profile had no access when you
   retrieved it. If a colleague granted one of them since, deploying your file switches theirs
   off, silently. The Metadata Retriever's **Auto** mode leaves those `false` lines out
3. What you retrieve depends on how, and from where. Retrieved the standard way, a Profile only
   holds the permissions of the components retrieved with it. Retrieved whole, as the Metadata
   Retriever does in **Auto**, it holds everything the profile has in the org it came from. Either
   way, the same Profile looks different depending on who retrieved it, from which org, and when

`minimizeProfiles` strips from Profiles everything that a Permission Set could carry instead,
leaving Profiles to hold only what genuinely cannot live anywhere else: login hours, IP ranges,
default record types, page layout assignments.

So the pipeline did not lose your work. It refused to carry it, because carrying it would eventually
delete somebody else's.

#### Why the Profiles stay in the repository all the same

Removing Profiles from the sources would be the wrong conclusion. A user logs in with a
Profile, and what only a Profile holds, the default app, the page layout of each object, the tab
settings, the login hours, has to be the same in every org. So `Admin` and `Helios Crew` stay in
`force-app/main/default/profiles/`, stay in `manifest/package.xml`, and are deployed with
everything else.

They carry no field, object, class or Flow permission on purpose, and no user permission
except on `Admin`. A Profile retrieved whole lists hundreds of user permissions, and Salesforce
adds and removes some at every release, three times a year: a full Profile committed in spring
can fail to deploy in autumn on a permission that no longer exists. `minimizeProfiles` takes
those permissions out every time somebody publishes a Profile. What stays can still be long,
because a Profile retrieved whole lists the tab setting and the page layout of every object of
the org: those are exactly what only a Profile can hold.

Those lines are also where a Profile stays tied to the org it came from. It names each page
layout and each tab, standard objects included, and an org that does not have one of them
refuses the whole Profile. It deploys everywhere in this course because your orgs are built to
hold the same objects, under the same names. *If it goes wrong*, below, shows how to find out
which org differs when they do not.

#### You should now see

- The three reasons, and what a Profile still holds, in your own words

### 5. Do it the way the project expects

Goal: `Cost` readable through the **Helios Delivery Crew** permission set in `helios-integration`.

Redo the grant where it belongs. Your first Pull Request is merged, so this is a second one for the
same story.

#### Do

1. **New User Story**, name `US-033-crew-permission-set`, org `helios-dev`
2. In `helios-dev`: **Setup > Permission Sets > Helios Delivery Crew > Object Settings > Panel
   Batches > Edit**, tick **Read Access** on `Cost`, **Save**
3. Retrieve the **Permission Set** this time, commit it, **Save / Publish**, and open the Pull
   Request
4. Wait for the check to go green, and merge
5. Check `helios-integration`: **Setup > Permission Sets > Helios Delivery Crew > Object Settings >
   Panel Batches**

#### Why

Nothing to tidy up: the Profile you published in step 1 stays in the repository, cleaned, and it
keeps being deployed as it always was.

Every crew member holds that permission set, whatever their Profile.

#### You should now see

- The **Git Delta package.xml** report naming `Helios_Delivery_Crew`
- In `helios-integration`, `Cost` readable on the permission set

### 6. Look at the other protection while you are here

Goal: you know which setting cleans what, and on which tab of the settings each one lives.

#### Do

1. Open the **DevOps Pipeline** panel, then **Configure Pipeline Settings** in the gear menu, as in
   step 3
2. Leave the scope selector **(1)** on **Global Settings**: these are project rules, identical for
   every branch

   ![The Global Pipeline Settings panel, on its Deployment tab](../../_assets/annotated/vscode/pipeline-config.png)

3. Find the two settings of the table below on the **Salesforce Project** tab **(2)**

| In the panel                                                  | In `config/.sfdx-hardis.yml`       | Tab                            | What it protects against                                                                    |
|---------------------------------------------------------------|------------------------------------|--------------------------------|---------------------------------------------------------------------------------------------|
| **Minimize Profiles**, in the list of **Auto-Cleaning types** | `autoCleanTypes: minimizeProfiles` | **Salesforce Project** **(2)** | A Profile carrying permissions that belong on a Permission Set                              |
| **Auto-Remove User Permissions on profiles**                  | `autoRemoveUserPermissions`        | **Salesforce Project** **(2)** | Specific user permissions that must never travel between orgs at all, whatever carries them |

#### Why

The settings are grouped in tabs. Two of them do the job you just met, and it is worth knowing
which is which.

Both run on your machine, when you publish: they decide what your commit carries. The tab beside
them, **Deployment** **(3)**, decides how the pipeline sends it to each org. That one belongs to the
release manager, and Level 3 is where you meet it.

<details markdown="1"><summary>Under the hood: what cleaning actually did to the file</summary>

The cleaning pass of `hardis:work:save` ran over the Profile you had committed, and for
`minimizeProfiles` it rewrote its XML in a commit of its own.

Whole sections are deleted, because a Permission Set can carry all of them:

`agentAccesses`, `classAccesses`, `customMetadataTypeAccesses`, `customPermissions`,
`externalDataSourceAccesses`, `fieldPermissions`, `flowAccesses`, `objectPermissions`,
`pageAccesses`, `ServicePresenceStatusAccesses`.

Three sections are thinned rather than deleted, keeping only the entries a Permission Set cannot
express:

| Section                   | What survives                                                                |
|---------------------------|------------------------------------------------------------------------------|
| `recordTypeVisibilities`  | only the entries marked `default` (or `personAccountDefault`)                |
| `applicationVisibilities` | only the default app, and apps explicitly hidden (`visible` false)           |
| `userPermissions`         | only permissions explicitly turned off, plus everything on the Admin profile |

And some sections are never touched, because nothing else can hold them: `loginHours`,
`loginIpRanges`, `layoutAssignments`, `tabVisibilities`, `custom`, `userLicense`.

So a Profile still does a job in this pipeline. It is just a much smaller one.

Nothing was removed from your org. The cleaning changes what the repository carries, never what
Salesforce holds. Your admin-style grant is still in `helios-dev`, which is exactly why the lab
asks you to do it again on the Permission Set rather than to fix the file by hand.

The rule to take away: if a permission can live on a Permission Set, put it there. This is not
an sfdx-hardis opinion, it is what Salesforce has been recommending for years, and this pipeline
enforces it rather than hoping.

<!-- command-links:start -->
Command documentation: [hardis:work:save](https://sfdx-hardis.cloudity.com/hardis/work/save/)
<!-- command-links:end -->

</details>

#### You should now see

- **Auto-Cleaning types**, with **Minimize Profiles** in it, and **Auto-Remove User Permissions on
  profiles** on the **Salesforce Project** tab **(2)**, and
  the **Deployment** tab **(3)** beside it

## What you should see

- [ ] `Cost` granted on the **Helios Delivery Crew** permission set in `helios-integration`
- [ ] `Admin` and `Helios Crew` still in `force-app/main/default/profiles/`, with no field permission
      in them

## If it goes wrong

**The permission set edit does not show the Cost field.**
The field is not in the permission set's object settings until the object is granted. Grant read on
**Panel Batch** first.

**The deployment fails with `INSUFFICIENT_ACCESS` on the permission set.**
The CI user cannot grant a permission it does not have itself. Assign **Helios Delivery Manager** to
the integration org user, which **Training: Level 2 > Set up one of my training orgs** does.

**The Profile comes back a thousand lines long.**
A Profile retrieved whole keeps, after the cleaning, the tab settings and the page layout of every
object of the org, its default app and record types, and on `Admin` its user permissions: those
stay on purpose. If it still carries field, object or class permissions, it was committed after a retrieve and never went through the cleaning. Check
that **Minimize Profiles** is still listed in **Auto-Cleaning types**, on the **Salesforce Project** tab of **Pipeline Settings**, then
**Save / Publish** again. Do not shorten the file by hand.

**A deployment refuses the Profile with `no Layout named ...` or `no CustomTab named ...`.**
It can happen on this Pull Request, or much later, the first time the Profile reaches an org of
Level 3. The Profile assigns a page layout, or shows a tab, that the target org does not have. The
message names it, as `Object-Layout name`: start there.

1. **Is it yours?** Search the repository for the layout name (`Ctrl+Shift+F`). If a file holds
   it, the layout only misses from `manifest/package.xml`, which is the error of
   [Lab 2.2](2-2-fix-a-missing-dependency-deployment-error.md). If no file holds it, Salesforce
   created it in the org the Profile was retrieved from, and nobody decided it
2. **Why does one org have it and not the other?** Open **Setup > Object Manager** in both orgs and
   look for the object, then for its **Page Layouts**. There are three usual answers:

   | What you find in the target org                       | The cause                                                                                                                    |
   |-------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
   | The object is not there                               | A Salesforce feature is on in one org and off in the other. `ServiceAppointment` and its neighbours come with Field Service  |
   | The object is there, its layout has a translated name | The layout was created by a user working in another language: `Présentation Crew Capacity` instead of `Crew Capacity Layout` |
   | The object is there, with no layout or another one    | The two orgs were not created at the same time, or somebody renamed or deleted the layout by hand                            |

3. **Fix the cause, not the message.** A feature: make the orgs agree, by switching it on in the
   target org before the deployment, which is a manual action for the release manager, or off in
   the org you build in, and retrieve the Profile again. A language: set your user to English in
   the target org, **your picture > Settings > Language & Time Zone**, and rename the layout
   there. Anything else, on an object your project does not use: the line has no business in the
   repository. `FlowRecord-Flow Layout` is one of them: some orgs carry a layout on the standard
   `FlowRecord` object, others have none. Open the Profile file, delete the `<layoutAssignments>` block that names the
   layout, or the `<tabVisibilities>` block that names the tab, commit, and **Save / Publish**:
   on the branch of this lab when it is its own Pull Request that went red, in a **Fix** User
   Story when the Profile is already merged

Salesforce reports one missing name per deployment, so a second one can hide behind the first.

If the list has dozens of names, all standard objects, your scratch orgs were created before this
course switched Field Service and the Thanks badges off in them. **Training: Level 2 > Update my
course**, then **Training: Level 1 > Set up my training environment** again: it switches both off
in the scratch orgs you have, and deletes nothing. Then a **Fix** User Story from `helios-dev`,
retrieve `Helios Crew` again as in step 1, and **Save / Publish**.

## Check your work

Welcome page > **Training: Level 2** > **Check my work**, then pick **Lab 2.6**.

## Go deeper

- [Profiles and Permission Sets](https://sfdx-hardis.cloudity.com/salesforce-devops-work-on-user-story-profiles/)

[Next: Lab 2.7 - Resolve a Git merge conflict with a teammate](2-7-resolve-a-git-merge-conflict.md){ .md-button .md-button--primary }
