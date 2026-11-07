---
id: lab-1-4
title: "Lab 1.4 - Build a custom field in your Salesforce org"
description: "Create a custom field, grant it through a permission set and add it to the page layout in Salesforce Setup, in your own development scratch org."
level: 1
lab: 4
lang: en
source_rev: ""
screenshots:
  - annotated/vscode/orgs-manager-actions
  - annotated/salesforce/object-manager-fields
  - annotated/salesforce/permission-set-object-settings
  - annotated/salesforce/installation-record
depends_on:
  commands: []
  flags: []
  config: []
  panels: [orgManager]
  docs: [salesforce-devops-work-on-user-story, salesforce-devops-work-on-user-story-configuration]
---

# Lab 1.4 - Build a custom field in your Salesforce org

**Level**: 1 Contributor basics

**Time**: ~10 min<!-- observed --> (observed: median 12 min, 37 learners, fastest 6 min)<!-- /observed -->

**You will**: build US-014 the way an admin builds anything, by clicking in Salesforce Setup, and
check it against real records.

## The situation

You have a branch and an org. Now do the actual work. Nothing in this lab is specific to CI/CD:
this is ordinary Salesforce configuration. The only rule is where you do it: in `helios-dev`,
your own org, never in the shared one.

## Before you start

- [ ] [Lab 1.3](1-3-start-a-user-story-on-a-git-branch.md) finished: you are on `features/US-014-panels-required`
- [ ] The Status section of the sfdx-hardis panel shows the username of `helios-dev` as the current
      org: the one on the `helios-dev` row of **Orgs Manager**, since that section never shows an alias

## Steps

### 1. Open your org

Goal: `helios-dev` open in your browser, already logged in.
Refresher: [Lab 1.2](1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md)

#### Do

1. In **Orgs Manager**, find the row whose **ALIAS** column says `helios-dev`. Read the alias, not
   the address
2. At the end of that row, click the chevron. It opens everything you can do to that org, and the
   first entry is **Open** **(1)**. Click it

   ![The actions menu of the development org in Orgs Manager](../../_assets/annotated/vscode/orgs-manager-actions.png)

  !!! tip "In Agentforce Vibes"
      The org opens in a new tab of the same browser. VS Code may first ask whether to open the
      external website: answer **Open**. If no tab appears at all, update the extension.

#### Why

None of the addresses says what the org is for. The Developer Edition org has an `orgfarm-` string
Salesforce invented, and the scratch orgs have two random words and a number, so your four orgs look
alike everywhere except in the **ALIAS** column.

No password, no login page: the extension used the credential it stored when you connected the org
in [Lab 1.2](1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md).

Opening the org from this panel rather than from a bookmark is a habit worth forming. It is the
difference between "the org I meant" and "the org that happened to be open in that tab".

!!! tip "In Agentforce Vibes"
    VS Code runs in your browser, so the org cannot open next to it. Older versions of the
    extension ran the open command inside the tab's own environment, where no browser can be
    opened, and showed nothing.

#### You should now see

- Your browser on the org, already logged in

### 2. Create the field

Goal: a `Panels Required` number field on Installation, on its layout, and visible to no profile.

#### Do

1. In Salesforce: **Setup > Object Manager > Installation**, then **Fields & Relationships** **(1)**
   in the left column, then **New** **(2)**

   ![The Fields and Relationships page of the Installation object in Setup](../../_assets/annotated/salesforce/object-manager-fields.png)

   The list you see is the object before your change. `Panels Required` is what you are about to add
   to it.

2. Fill in the settings of the table below, Description and Help Text included
3. The field-level security screen arrives with **Visible** already ticked for nearly every profile.
   Clear them: the checkbox in the **Visible** column header toggles the whole column, so click it
   once to tick everything and again to leave nothing ticked
4. Click **Next**
5. On the page layout screen, **Installation Layout** is already ticked. Leave it
6. Click **Save**

| Setting        | Value                                                         |
|----------------|---------------------------------------------------------------|
| Data Type      | **Number**                                                    |
| Field Label    | `Panels Required`                                             |
| Length         | 4                                                             |
| Decimal Places | 0                                                             |
| Field Name     | `Panels_Required` (Salesforce fills this from the label)      |
| Description    | `How many panels the crew has to load for this installation.` |
| Help Text      | `Ask the planner if this is empty.`                           |
| Required       | no                                                            |

#### Why

The **Field Name** box is what Salesforce calls the API name, and it fills it from the label as you
type. It shows `Panels_Required`, without the `__c`: Salesforce adds that suffix to every custom
field when it saves, and the rest of this course, the metadata files included, calls the field
`Panels_Required__c`.

Fill in Description and Help Text: two seconds now, and the generated project documentation at
[Lab 3.9](../level-3-release-manager/3-9-generate-the-project-documentation.md) reads like something written by a person. Empty descriptions are the most common reason
that documentation is useless.

You clear the profiles because you are going to grant this through a permission set, not a profile,
and [Lab 2.6](../level-2-contributor-advanced/2-6-permission-sets-and-profiles.md) is about why that
distinction matters more than it looks.

**Installation Layout** ticked is what puts the field on the record.

#### You should now see

- The field saved, and `Panels Required` in the **Fields & Relationships** list of Installation

### 3. Grant it to the crew, and to the planners

Goal: `Panels Required` readable by the crew and editable by the planners, through their permission
sets.

The acceptance criteria say the crew must see it, and planners must fill it in. Nobody has it yet,
not even you: you granted nothing, and a field that no permission grants is invisible to everybody,
the administrator who created it included.

#### Do

1. **Setup > Permission Sets > Helios Delivery Crew**, then **Object Settings** **(1)** and
   **Installations**, then **Edit**

   ![Object Settings for Installations on the Helios Delivery Crew permission set](../../_assets/annotated/salesforce/permission-set-object-settings.png)

2. In **Field Permissions**, find `Panels Required` and tick **Read Access** **(2)**. This picture
   was taken before the field existed, so `Panels Required` is not in it yet: after your change it
   appears in that list, in alphabetical order
3. Leave **Edit Access** unticked, and click **Save**
4. Open the same screens on **Helios Delivery Manager**, the planners' permission set
5. Tick both **Read Access** and **Edit Access** on `Panels Required`, and click **Save**

!!! warning "Careful"
    Skip this and step 4 shows you nothing: you would be looking for a field your own permission set
    does not grant.

#### Why

**Field Permissions** is the table that matters, one row per field, and **Read Access** is the
column you are here for. A crew member reads how many panels to load, they do not decide the number.

**Helios Delivery Manager** is also the one **Set up my training environment** gave you, which is
how you see the Helios app at all. Planners are the people who decide the number.

#### You should now see

- On **Helios Delivery Crew**, **Read Access** ticked on `Panels Required`, and on **Helios Delivery
  Manager**, both **Read Access** and **Edit Access**

### 4. Put it where people will look

Goal: `Panels Required` on the Installation record page, with nothing more to build.

The field is on the layout, which is what old-style Salesforce pages use. The Installation record
page is a Lightning record page, and the column of fields on its left is that layout, so you are
already done.

#### Do

1. Open any installation: **App Launcher > Helios Delivery > Installations**, pick `INST-00001`
2. Look at the bottom of the column of fields

#### You should now see

- `Panels Required` there, empty, with the small **i** of the help text you wrote next to its name

### 5. Test it against real data

Goal: a `Panels Required` value saved on three installations.

Empty fields prove nothing. Put a number in.

#### Do

1. On `INST-00001`, read the **Panel delivery timeline** **(2)** on the right of the record. It lists
   the pallets booked for this installation with their quantities

   ![An installation record in the Helios Delivery app](../../_assets/annotated/salesforce/installation-record.png)

   The picture was taken before this story existed, so there is no Panels Required in its column
   yet. The installation it shows has two pallets, 23 and 16 panels: 39 is the number you would type
   there.

2. Click the pencil at the right of **Panels Required**, type the number the timeline adds up to,
   and click **Save** at the bottom of the page. This page has no **Edit** button: every field is
   edited in place, with its own pencil
3. Look at the two numbers side by side
4. Do the same on two more installations, so you have something to look at after the deployment.
   The **Installations** tab **(1)** is how you get back to the list from anywhere in the app

#### Why

Most installations have two or three pallets. On a real story you would ask the planner whether this
field should be typed in or worked out from the pallets. Here, typed in is the story, and that
question is exactly the one a good contributor asks before building anything.

#### You should now see

- On three installations, a `Panels Required` value that matches their timeline, saved without
  error

## What you should see

- [ ] On three installations: a `Panels Required` value, visible in the column of fields, saved
      without error
- [ ] And in VS Code, nothing at all. The repository does not know about any of this yet. Your
      changes live in one org and nowhere else, which is exactly the state [Lab 1.5](1-5-retrieve-commit-and-publish-your-changes.md) exists to end

## If it goes wrong

**Object Manager does not list Installation.**
You are in the wrong org. Check the Status section in VS Code, then reopen the org from **Orgs
Manager**.

**You click Open and no browser tab appears.**
Older versions of the extension could fail to open the org without saying why, and in Agentforce
Vibes they opened nothing at all: the command ran inside the tab's own environment, where no
browser can be opened. Update the extension, which is what **Auto Update** in
[Lab 1.1](1-1-install-vs-code-and-sfdx-hardis.md) is for, and click **Open** again. Until then,
outside Agentforce Vibes, there is a second way in: in the **Status** section of the sfdx-hardis
panel, under **Current Org**, click the first line, the address of the org. It opens your default
org, which is `helios-dev` here.

**Orgs Manager shows your scratch orgs as disconnected, and offers Reconnect instead of Open.**
Older versions of the extension read only the connection probe, which a scratch org never carries:
its Dev Hub answers for it instead. Update the extension, which is what **Auto Update** in
[Lab 1.1](1-1-install-vs-code-and-sfdx-hardis.md) is for, then click **Refresh** in the panel. The
orgs are fine either way, and **Reconnect** would have signed you in again for nothing.

**The field does not appear on the record page.**
You skipped the page layout step. **Setup > Object Manager > Installation > Page Layouts >
Installation Layout**, drag `Panels Required` into the Information section, **Save**.

**Save fails with a validation rule error.**
The Helios org has a rule that refuses moving an installation date into the past. If you edited the
date by accident, put it back to a future date.

**The permission set has no Object Settings for Installation.**
A permission set only lists an object once something in it is granted. Use **Field Permissions** at
the top of the page instead: pick `Installation` there, and the object appears with its fields.

## Check your work

Welcome page > **Training: Level 1** > **Check my work**, then pick **Lab 1.4**.

Nothing of your work has left the org yet, so the check reads the org itself: it asks `helios-dev`
whether `Panels_Required__c` exists on Installation and whether `Helios_Delivery_Crew` can read it.
The repository learns about the field in the next lab.

## Go deeper

- [Work in your org](https://sfdx-hardis.cloudity.com/salesforce-devops-work-on-user-story/)
- [Configuration guidelines](https://sfdx-hardis.cloudity.com/salesforce-devops-work-on-user-story-configuration/)

[Next: Lab 1.5 - Retrieve, commit and publish your Salesforce changes](1-5-retrieve-commit-and-publish-your-changes.md){ .md-button .md-button--primary }
