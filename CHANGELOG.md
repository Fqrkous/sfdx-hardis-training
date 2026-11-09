# Changelog

What changed in the course, for learners and trainers. The course has no versions: each section is
a day, newest first, and a change goes under the date of the day it is made.

## 2026-11-09

- The screenshots of the windows opened over the DevOps Pipeline (branch windows, Pull Request windows, deployment action editors) are taken again, with the new view switch behind them.
- Lab 1.2: the lab driver answers the question that a computer already signed in to GitHub gets first, *Fork the course into the GitHub account ...?*, which the lab describes, so the driver no longer stops on it.

## 2026-11-08

- Lab 1.1: the Browserforce dependency is named **sfdx-browserforce-plugin**, as its card in the Setup panel reads.
- Lab 1.2: the setup output shows the line that switches issues on in your fork, and the switch between **Major branches**, **Feature branches** and **Dev orgs** is no longer described as appearing once GitHub is connected: it is always there.
- Lab 1.3: a troubleshooting entry for the warning that `helios-dev` is not registered because issues are off in a fork set up before 2026-11-07, fixed by running **Set up my training environment** again.
- Labs 2.3, 2.4 and 2.9 link the new sfdx-hardis page of each deployment action type they use (Apex, Data, Schedule batch, Manual), which show these labs in their Learn by doing section.
- Lab 3.10: the conflict question screenshot lists the answers in the order the command asks them, and the lab says the risky answers leave the files they decided in the Pull Request and in the commit message of the story.
- **Set up my training environment** waits for a fork it has just created before switching issues on, and says what to do when it still cannot.
- DevOps Pipeline screenshots in Labs 1.2 to 3.10 show the **Major branches** / **Feature branches** / **Dev orgs** switch instead of the former toggle, on its own row above the diagram, and Lab 3.2 points at **Feature branches** on its picture.
- Guinea Run: the end credits thank Haim Knokh (SFDMU), Matthias Rolke (Browserforce) and Dave Renald Saavedra (scratch org snapshots), as the sfdx-hardis Special Thanks now do.

## 2026-11-07

- DevOps Pipeline: the **Show feature branches** toggle became a switch on the diagram between **Major branches**, **Feature branches** and **Dev orgs**. Labs 1.2, 2.3 and 3.2 follow it.
- Lab 1.3: New User Story also registers `helios-dev` in the development orgs list of your repository, and the setup of your training environment switches issues on in your fork, where that list lives.
- Lab 1.1: the Setup panel installs Browserforce too, now one of the dependencies of sfdx-hardis, and its screenshots show it.

## 2026-11-05

- Lab 3.10: the conflict question of the promotion shows its seven answers, including the new "solve now" and the two risky "keep the source version" ones, and the lab explains what those would have done to this week's promotion.

## 2026-11-02

- Guinea Run: pick a nickname and a guinea pig once, after your first world, and every new best score goes to the Hall of Fame on its own, with no GitHub account and nothing else about you stored.

## 2026-11-01

- Lab 3.8: the first question of **Install Org Monitoring** says to answer Yes, and the warning about the `workflow` permission comes before you click the button.
- Lab 3.8: the first run sends one email per check that found something, not a single one, and the panel lists **Warning** among the severities.
- Lab 3.8: a check card runs the check again from your computer, and the unsecured Connected Apps one gets No to both of its questions.
- Lab 3.8: the reason for silencing a check goes in the commit message, since the panel does not keep comments in the configuration file.
- Lab 3.9: step 5 asks for one paragraph on the Installation page, and has you find the reasons of the preparation buffer and of the crew capacity cap in the generated pages.

## 2026-10-31

- Lab 1.2: **Set up my training environment** lists its questions in the order it asks them, the GitHub sign-in or account first and the yes for `helios-prod` after.
- Lab 1.3: the user configuration file records the branch your User Story targets, not its org.
- Lab 1.5: Save / Publish shows one line per cleaning rule, four on this story, and none for Flow positions when the story has no Flow.
- Labs 1.6, 2.1, 2.2, 2.4 and 2.5: a step with several Why blocks gives each its own title, and French Lab 3.1 links to its step 12 again, so the MegaLinter comment of your Pull Requests no longer warns about 21 markdownlint errors in the course.
- Lab 2.1: the backpromote branch is named after the id of your org, as the picture shows, not after its alias.
- Lab 2.4: when MegaLinter's commit arrives after your last push, approve its workflows on the Pull Request, since there is nothing left to push.
- Labs 3.5 and 3.8: **Publish my pipeline configuration** asks for **Squash and merge**, as the check comment of its Pull Request does, instead of a merge commit.
- Labs 3.7 and 3.10: the retrofit story says how to reach `helios-dev`, **Scratch org** then **Reuse scratch org helios-dev**, since **Current org** is production by then.

## 2026-10-30

- Lab 3.4: the cleaning step names the **Auto-Cleaning types** setting as the panel shows it.
- Labs 3.6 and 3.7: the promotion, release and hotfix steps say to click **Create pull request** after the title.
- Lab 3.7: the retrofit branch is created in the order the questions come, target branch first.
- Lab 3.8: the monitoring repository is cloned with no folder open, as in Lab 1.2, with the address GitHub shows on an empty repository.

## 2026-10-28

- Lab 1.2: a troubleshooting entry for a Welcome page with no Training menus, when VS Code is not open on the course folder.
- Level 3: the page says how to sign up for a second Developer Edition org with the same email address, and that the org setup can pause on one number for minutes.
- Lab 3.1: the first picture shows your fork as it is, with no feature branches, and the step texts match the questions the command asks: the app name to keep, **System Administrator** to pick, and the end of the questions for `main`.
- Lab 3.1: a troubleshooting entry for `You need openssl to be locally installed`, and the Replacement rules paragraph says your fork has none.
- Your fork no longer runs the Guinea Run, links, translations and Hall of Fame checks of the course, which took up to half an hour of your GitHub Actions minutes per course update.

## 2026-10-27

- Guinea Run: in VS Code, your progress follows you in every project, and a save edited by hand sends the guinea pig back to the first world.
- Lab 2.6: the `no Layout named ...` troubleshooting entry names `FlowRecord-Flow Layout` as a layout to delete from the Profile.
- Lab 2.8: a troubleshooting entry says a red check on the Profile of the over-wide Pull Request is cleared by the reset, nothing to fix by hand.

## 2026-10-26

- Pipeline Pinball: a ball no longer gets stuck in a hole during multiball, Rollback now works and lights both outlanes, a ball below the Production floor waits until it is back in view, the admins show their faces, and the score display is easier to read.
- Guinea Run: on a phone, the map now offers to add the game to the home screen, and the offer stays until the game is really installed.
- Lab 2.7: step 1 builds the flat roof decision and its assignment click by click, with the names the pictures show, and both flow saves use **Save As New Version**.
- Lab 2.7 and Lab 2.1: the teammate step names the **Open the Pull Request** button at the bottom of the panel.
- Lab 2.6: step 3 says how to open the Pipeline Settings panel, and the settings are named by their panel labels, **Minimize Profiles** and **Auto-Remove User Permissions on profiles**, next to their keys in the configuration file.
- Lab 2.4: says to pull the MegaLinter commit that adds the last line of `export.json` before pushing the deployment actions, with a troubleshooting entry for a refused push.
- Guinea Run: once opened online, the game plays offline, and on a phone it can be added to the home screen; progress is no longer lost when the game is open in two tabs or two VS Code windows.
- Guinea Run: Pipeline Pinball runs at the same speed in Easy, Normal and Hard, since its points do not depend on the mode.
- Lab 1.2: **Set up my training environment** asks which GitHub account to fork into when this computer was already signed in to GitHub, and can switch to another one.
- Home page and Lab 1.1: keep the same editor (VS Code, Agentforce Vibes or Cursor) from start to finish, since the scratch orgs are connected only in the editor that created them.
- Lab 2.7: taking both sides of the permission set conflict gives two complete blocks with nothing to type, and the merge editor pictures show the real Helios file.
- Lab 2.4: **Create my lab records** says when `External_Id__c` is not marked External Id or a field cannot be edited, instead of blaming the profile.
- Lab 3.10: troubleshooting for a cherry-pick of US-059 that conflicts on one file only.
- Labs 2.7 and 3.10: check that the SF Merge Driver is off before you start, since it solves the conflicts these labs teach.
- Lab 3.11: how to stop the nightly crew capacity email in the orgs you keep.
- Guinea Run has a second bonus, Org-Man: a maze where four admins chase the guinea pig, deployment rockets that turn them blue, faster mazes as you go, and its own Hall of Fame board. It opens with Pipeline Pinball, once the ten worlds are done.

## 2026-10-24

- Guinea Run no longer invites you to send your scores again a few minutes after a send, which the Hall of Fame refused as unverified. The game says when you can send again, and a send that comes too soon gets an answer that says so.

## 2026-10-23

- Guinea Run invites you to send your scores as soon as one would enter the top 5 of a world, of the overall total or of Pipeline Pinball.
- Pipeline Pinball on a phone: the upper Production floor shows whole, and the messages and buttons fade while the ball passes under them.
- The Guinea Run Hall of Fame page is no longer in the site menu.
- The Guinea Run Hall of Fame page fits a phone screen: the avatar, handle and badge of a player share one column, and the boards no longer scroll sideways. Pipeline Pinball now comes right after the total, before the world boards.

## 2026-10-22

- Guinea Run has a bonus table for those who finish all ten worlds: Pipeline Pinball, a pinball game with a mission per world and its own Hall of Fame board.
- The Hall of Fame answer on a score issue numbers the worlds from 0, as the game does.
- Sending your Guinea Run scores works from the GitHub mobile app too: it used to open a blank issue.
- Guinea Run, the game hidden in every page, is online: the Konami code or five taps on the guinea pig in the footer open it, on a computer or a smartphone.
- The guinea pig of Guinea Run squeaks with a new, shorter set of wheeks when it jumps.
- Guinea Run has Easy, Normal and Hard modes: Normal runs 1.5 times faster for 1.5 times the points, Hard twice as fast for twice the points.
- Guinea Run has a [Hall of Fame](https://sfdx-hardis-training.cloudity.com/hall-of-fame/): send your scores from the game to GitHub, and beat the bosses fast for a speed bonus.

## 2026-10-21

- Something small and furry now lives in the footer of every page.
- Every screenshot says it can be enlarged: "click to enlarge" at the end of its caption, and a magnifier when the mouse is over it.
- The comments under each page show the newest first. The Oldest button above them still switches back.
- The notes that only some learners need are tip boxes again, as before the step template: Agentforce Vibes and the other editors in Labs 1.1 to 1.4, and the star and LinkedIn banner asides of the three capstones. Lab 1.4 no longer sends anyone to a terminal to open an org.

## 2026-10-20

- Numbered tasks are only what every learner does: the Agentforce Vibes instructions, the ways back when something went wrong and the other ways in are now tip boxes inside the task they belong to.
- Every step of every lab reads the same way: its goal, what to do as numbered tasks with each screenshot under its task, why, and what you should now see, with a box to tick when it is done. Proposed by [fkramer690](https://github.com/fkramer690) in [#142](https://github.com/hardisgroupcom/sfdx-hardis-training/discussions/142).
- Labs 3.5, 3.6, 3.7 and 3.10 name the GitHub option to pick for a promotion: Create a merge commit, under the arrow of the green button.
- Lab 3.1 shows the DevOps Pipeline in the middle of step 8, and its two settings steps are numbered lists.
- Lab 3.3 says why a failed action has no Retry button, and why re-running the job on GitHub is not the same thing.
- Simulate my teammates ends with a button that opens the Pull Request it created.
- Lab 3.7 opens production from Orgs Manager, warns about hotfixes from integration at the top of step 2, and says what to do with a retrofit that brought nothing down.

## 2026-10-19

- Trainers: the lab drivers point to the training scenario of the `e2e` skill of sfdx-hardis, which replaces the `training-e2e` skill.
- Links to another site (GitHub, Salesforce, the sfdx-hardis documentation) open in a new tab, so the lab stays open.
- Lab 2.3 says to copy only its four Apex files, and explains the check that fails on the Lab 2.4 batch when it is copied too.
- Lab 3.8 says what to do when GitHub refuses a push during the configuration: never merge the monitoring branch into `main`, and store the two new secrets of each run.

- Lab 3.1 shows what the scratch org pool, org initialization and replacement rules are for, with a picture of each and its documentation page, without asking you to set them up.

## 2026-10-18

- Labs 3.1 and 3.6 follow the new gear menu of the DevOps Pipeline: Configure Pipeline Settings, Add or Reconnect a Major Org, Configure Org Initialization, Configure Replacement Rules and Generate DORA Metrics, with their screenshots taken again.
- Set up my training environment says what it waits for while it turns Dev Hub on, and stops with a clear message when the org does not answer.

## 2026-10-17

- Lab 3.4 says plainly that US-018 and US-019 are already merged when it starts, and reviews their merge order instead of promising a live collision.
- Lab 3.6 explains the conflict in `config/.sfdx-hardis.yml` on the first Pull Request into `preprod` when a course update was squashed, and Lab 3.1 warns about it.
- Update my course reminds you to merge its Pull Request with a merge commit whenever it hands it over to you.
- Contributors: Claude Code loads the MegaLinter skills and agents from the MegaLinter plugin, enabled in `.claude/settings.json`.

## 2026-10-16

- Lab 1.7 names the data type as the field wizard lists it, Text Area (Long).
- Lab 2.1 says to close the question that offers to merge `integration` into the finished Level 1 branch after Back.
- Lab 2.3 says that Salesforce asks to confirm as soon as Required is ticked, and that a record page shows "We hit a snag".
- Lab 2.4 and Lab 2.9 give the Record Name settings and the type of every field of their new objects.
- Lab 2.5 explains why the Apex Tests card of `helios-dev` and the check of the Pull Request can read a different coverage.
- Lab 2.6 says where to remove a layout the target org lacks when the lab's own Pull Request goes red.
- Lab 2.9 grants the new object and its fields before you create its records and edit the flow (feedback from a learner).
- Lab 3.5: **Publish my pipeline configuration** works when your local `integration` is behind GitHub, and names the file when your change collides with one merged there (feedback from a learner).
- The help page says to switch GitHub Actions back on before resetting a level (feedback from a learner).
- Lab 2.7 and Lab 3.10 give the whole merge message and the Continue button that ends a merge.
- Lab 3.1 names what the External Client App page shows, and commits the configuration as US-050 so the promotion of Lab 3.5 finds its ticket.
- Lab 3.10 no longer shows a stray heading in step 6, which the linter reported on every learner's first Pull Request.

## 2026-10-15

- Lab 2.8 makes the mess with twenty recent rows and the Admin Profile instead of every row, so the retrieve is short and skips the Agentforce rows (feedback from a learner).
- Lab 2.9 creates a tab with the Handover Item object, and lists its steps in the order they run, from the count to the merge (feedback from a learner).
- Lab 3.1 explains a Pull Request stuck on "Expected - Waiting for status to be reported" with no check running (feedback from a learner).
- The Statistics page and the times of the labs are recalculated after every badge awarded, not only on Mondays.

## 2026-10-14

- Lab 1.4 says that in Agentforce Vibes the org opens in a new browser tab, and what to do while the extension that opened nothing there is being updated (issue #163).
- Lab 2.8 says to untick the Agentforce rows before the select-all retrieve, not after it fails, and that this retrieve is long by design (feedback from a learner).
- Lab 2.6 and Lab 3.3 show the Deployment packages menu of the DevOps Pipeline panel, an icon whose name only appears on hover, with the picture Lab 1.5 already had (feedback from a learner).
- Lab 3.3 quotes the deployment comment of a failed action with its new verdict, "⚠️ Deployed to integration, but an action failed after the deployment".
- The three capstones and every badge page show the Cloudity services banner, as the home page and the Help page do.
- Levels 2 and 3 no longer show the amber "This level is in QA" banner: the three levels are released.

## 2026-10-13

- The Badges page lists the holders by badge, Release Manager first, with the date and time of each award and the latest one on top.
- The home page opens on a banner of the course and a Start button, and shows the DevOps Pipeline panel in motion before the list of levels.
- The home page, the Help page, the last lab of each level and every badge page say who offers the course: Cloudity, and what it does on real projects, from Agentforce and Revenue Cloud to Field Service, Managed Services and DevOps.
- Every page ends with one line about Cloudity in its footer, and each menu has a link to the Cloudity site in its language.
- In dark mode, the label of a purple button can be read again.
- Lab 2.2: an installation now shows its activities, so the task the flow creates can be seen on the record.
- Lab 2.3: step 8 says when to merge the Pull Request, and how.
- Lab 3.1: the step that configures `main` says to tick no merge target.
- Lab 3.9: how to read a generated page as a page in VS Code.
- Lab 3.10: the `uat` counter reads seven, then four, as on your fork, and the screenshots show the seven Pull Requests.
- The numbered marks of about thirty screenshots, in all three levels, are back on the button, field or line the step names, and no longer hide part of it.
- The Level 1 training menu is shown with its seven commands, **Update my course** included.
- Lab 2.8: the picture of the command list shows the whole **Reset selected list of items to merge** row.
- Lab 2.4: the data action in the pictures carries the label the lab asks you to type.
- Lab 2.4: step 1 names the permission set, and the troubleshooting says what to do when the check of step 5 stays green on a fork updated before 2026-10-07.

## 2026-10-12

- The comment that awards a badge now says to wait a few minutes before opening the badge page, the time for the site to be published again.
- Set up one of my training orgs now shows the errors of a failed deployment in its panel, and points to Lab 2.6 when the Helios Crew Profile is the cause instead of blaming the connection.
- Lab 3.5: the title of the promotion Pull Request comes before the click on Create pull request, and the lab says the release note is a short text you write from the generated notes, not a paste of them.
- Lab 3.7: Check your work names the lab to pick.
- Level 3 home page: a pointer to the troubleshooting of Lab 3.1 when seeding an org stops on the Helios Crew Profile.
- The course has its own address, <https://sfdx-hardis-training.cloudity.com>. The two addresses it had before redirect to it, so the links and badges you already shared keep working.
- A translation is now stamped with the content of the English page it was made from, not with a commit: French pages no longer read as behind after every squash merge.
- A lab or a level shows the time learners took once three of them went through it. Under that it keeps its estimate.
- A Pull Request opened on the course repository by mistake, instead of in your fork, is now closed at once with a comment saying where it belongs and how to open it there.
- Lab 1.6: what to do when the My Pull Request card still says the Pull Request does not exist, and a warning about the yellow GitHub banner that opens a Pull Request on the original repository instead of your fork.
- Lab 3.8 says what monitoring gives you (a metadata backup, which is not a data backup, indicators and alerts) and where each one is read. You now receive a real alert by email from the first run, and the lab says that a real project sends them to Slack, Microsoft Teams or Google Chat.
- Lab 3.8: new troubleshooting entry for an email that does not arrive.
- Labs 1.3 and 1.4 no longer tell you to look for `helios-dev` in the Status section, which shows a username and never an alias: compare it with the `helios-dev` row of Orgs Manager.
- Lab 1.5 says Save / Publish adds one commit of its own on this story, not two.
- Lab 1.7 mentions the Trailblazer username that Claim my badge asks for.
- The VS Code pictures were taken again on sfdx-hardis 8.17.0.
- Check my work no longer counts Lab 2.8 as done before you start it: it now looks for the layout change of the story in `integration`, and the lab tells you to open, then merge, its Pull Request.
- Lab 2.1 no longer says Signed Off By sits under Crew Notes on the record, a field you cannot see yourself.
- Lab 2.2 says how to clear the Visible column before ticking System Administrator.
- Lab 2.5 says where to paste each block of Apex, and that the fixed method replaces the first one.
- Lab 2.6: the Setup path of step 5 was cut in two on the site.
- Lab 2.7 mentions the two files of your teammate that wait under Staged Changes during the merge.
- Lab 2.9 mentions the Trailblazer username that Claim my badge asks for.
- Lab 2.8: the first pill of the command list picture no longer covers the row above it.
- Level 3 could not start for a learner coming from Level 2: the Helios Crew profile published in Lab 2.6 named page layouts and tabs that the two Developer Edition orgs do not have. New scratch orgs no longer have Field Service and the Thanks badges, and Set up my training environment switches both off in the scratch orgs you already have.
- Set up my training environment and Set up one of my training orgs set the language of your user to English in the Developer Edition orgs, so Salesforce names page layouts the same way in every org.
- Lab 2.6: new troubleshooting entry for a Profile refused with `no Layout named` or `no CustomTab named`: how to find which org differs, and what to change.
- Your fork now deletes a branch once its Pull Request is merged, so Labs 1.6 and 3.2 no longer ask you to. The major branches stay: a protected branch cannot be deleted.
- Lab 2.4 retrieves the All list view of Crew Capacity with the object, so the tab lists the 12 records in every org.
- Check my work no longer counts Lab 3.4 as done before Level 3 starts: it now also looks for the Pull Request of US-020 in your fork.
- Lab 3.1: new troubleshooting entry for the Confirm access page GitHub shows before saving a branch rule or a secret.
- Lab 3.3 no longer asks you to add your user to the Crew Leads group: the first action already put you there, and the step says so.
- Lab 3.3 has you check out `integration`, pull it and click Refresh before you open the Deployment Actions tab, not after: the tab reads the actions from your branch.
- Lab 3.6 says the Pipeline flow figures it quotes are those of the picture, not yours.
- Lab 3.8 says to squash the Pull Request of the monitoring repository setting, as its check comment asks, and names the second unsecured app a Developer Edition org lists.
- Lab 3.9 says where the Documentation Workbench opens from, and no longer speaks of a Pull Request this course never opens.
- Lab 3.10: the title of a folded block no longer shows a raw link, the red check is called by the name GitHub gives it, and the conflict question picture shows its four answers again.
- Lab 3.11 mentions the Trailblazer username that Claim my badge asks for.
- Pictures: the Deployment Actions comment of Lab 2.4 reads Retry, as the product does, and the promotion comment of Lab 3.5 shows the actions of a learner who walked Level 2.

## 2026-10-11

- New Statistics page on the site: how many learners start and finish each level, and the median time the labs really take next to the time they announce. Updated every week, and also readable in `STATS.md` of the repository.
- The time a lab or a level announces on the site is now the time learners were observed to take, rounded down, with the median and the fastest time next to it. The pages are rewritten from the figures every week. A lab fewer than three learners went through keeps its estimate.
- The Badges page says how many of each badge were awarded.
- Check my work: the receipt of a lab keeps the time it first passed, instead of the time of the last check.
- Lab 3.8: step 8 says that Publish my pipeline configuration opens its Pull Request itself, and a new troubleshooting entry covers the files a backup run from your computer leaves in the monitoring repository.
- Lab 3.1: new step giving `uat` its merge target to `preprod`, without which the diagram had no arrow between them. The confirmation of the secrets is described as the Yes or No question it is.
- Lab 2.9: the last step of the list no longer contradicts the order the three traps ask for.
- Labs 2.3 and 2.4: new troubleshooting entry for an action kept in a draft file, which the pipeline never runs.
- Lab 2.4: the manual step is declared for the validation and deployment jobs. Declared for the deployment job only, it never stopped the check, in this lab and again in Lab 3.5.
- Lab 3.5: the lab says that the promotion Pull Request is yours to create, what the number on the `integration` box counts, and how to leave a story out of a promotion.
- Labs 3.5, 3.7 and 3.8: new troubleshooting entries for a promotion check that is green with no step to do, a pipeline that shows `integration` alone, and a monitoring push GitHub refuses for a missing `workflow` permission.
- Lab 3.4 no longer mentions the setting that moves the no-overwrite list, which almost no project uses.
- Simulate my teammates: the hotfix of Lab 3.7 is cut from the `preprod` of your fork, even when the one on your computer is behind.
- Lab 3.6: the DORA metrics are read in the new DORA metrics panel of VS Code, one row per org of the pipeline, then exported as a Markdown report. No default org to set any more: the numbers come from the deployment jobs and the Pull Requests on GitHub.
- Lab 3.6: the Overview now opens on the pipeline flow, which says how long a User Story takes to reach production and where it waits. The lead time of `main` is the one of the User Stories, 5.7 days, where the release Pull Request alone read 0.1.
- Lab 3.6: new pictures of the gear menu, the Overview, the production tab and the Export menu, showing what a pipeline that released once looks like.
- Labs 3.5, 3.7, 3.11 and the Level 3 introduction follow the same change. Lab 3.7 says which branch the hotfix counts on.
- Lab 3.1: the gear menu picture shows the renamed DORA metrics entry.

## 2026-10-10

- Lab 1.6: the Pull Request window of VS Code is also shown while the check is still running, with the time the job has been going on, and a finished job says how long it took.

## 2026-10-09

- Lab 1.6: after the comment on GitHub, the lab opens the Pull Request window of VS Code, with the same comment and the Files button that lists the reports of the check.
- Lab 3.2: the list of the components of a Pull Request is opened from its window in VS Code, with the Files button, instead of from the job page on GitHub.

## 2026-10-08

- The labs follow the latest Pull Request comments: no Flows row, the deployment mode in the Metadata row, and a How to merge line on a green check.
- Every VS Code screenshot taken again on the current extension, and the Level 1 GitHub screenshots taken from a real walk with the new Pull Request comments.
- Lab 1.4: the Salesforce Setup screenshots show the new Setup look, and the record picture shows an installation with two pallets.
- Level 2 GitHub and Salesforce screenshots taken from a real walk with the new Pull Request comments: the failed check and the Flow diff of Lab 2.2, the Deployment Actions comment of Lab 2.4, Flow Builder in Labs 2.2 and 2.7, the Crew Capacity list of Lab 2.4.
- Lab 2.2: the Add Element menu of Flow Builder gained two rows, and the pill is back on Update Triggering Record.
- Lab 2.4: Create my lab records picks the lab and the org on its own, and the lab no longer asks you to pick them.
- Capstones: the Star screenshots show the button again, now on the right of the repository name.
- Level 3 GitHub and Salesforce screenshots taken from a real walk with the new Pull Request comments: branch rules and secrets of Lab 3.1, the files of Lab 3.2, the Deployment Actions comments of Lab 3.3, the promotion of Lab 3.5, the validation rule of Lab 3.7, the Run workflow menu of Lab 3.8, the promotion description and conflict comment of Lab 3.10.
- Lab 3.1: Save / Publish does not ask the target branch, New User Story already recorded it.
- Lab 3.2: the Metadata row counts the layout as one more component updated, not as the only one.
- Lab 3.4: US-019 is in the Level 3 start, so Simulate my teammates answers "Nothing to commit" whatever the route.
- Reset this level gives the Level 2 deployment actions a Pull Request of your fork, so the promotions of Level 3 run them again.
- Lab 3.7: step 3 shows the files of the hotfix Pull Request, not those of Lab 3.2.
- Lab 3.10: the conflict comment is quoted as it prints, and the uat window also lists the retrofit and the configuration, left unticked.
- The French labs follow every English change of the day.

## 2026-10-07

- The labs read the new sfdx-hardis Pull Request comments: a verdict on top, a table of checks, then only what needs you; their screenshots will be taken again once the course runs that version.
- Labs 1.5, 2.2 and 2.8: the Metadata Retriever screenshots show its new **Retrieve mode** list.
- Labs 2.6 and 2.8: the Metadata Retriever now brings Profiles back whole, with only the permissions they grant, and the labs say what that changes in the file you commit.
- Claim my badge no longer asks you to push a feature branch you squash merged and deleted on GitHub.
- Create my lab records no longer ends on "EPERM" on Windows after creating the records, and neither do the other Training commands that deploy from a temporary folder.
- Lab 2.1: the Backpromote panel lists four steps while it computes its plan, and the picture follows.
- Lab 3.3: about sixty components are deployed to integration by Level 3.
- Lab 3.5: the promotion notes count 17 tickets, the configuration story of Lab 3.1 among them.
- The hotfix teammate of Lab 3.7 commits a message that says what the fix does.
- The VS Code pictures taken again on sfdx-hardis 8.14, the promotion conflict question excepted: its previous picture shows every answer.

## 2026-10-06

- Lab 2.4: the Helios project turns on the stop of the check on a pending manual step, which sfdx-hardis no longer does by default.
- Clean up a training org says when a step failed instead of "nothing to remove", and retries when the org's address briefly does not answer.
- Lab 1.3: what to do when New User Story says the branch already exists.
- Lab 1.6: the checks table names the pills the picture carries, the check comment picture shows the Simulated deployment line, and the deployment one its table of changes.
- Level 1: the address of your fork is spelled out where a step opens it, not in every paragraph.
- Labs 1.6 and 3.5: the comment shows the code coverage first, and its protected metadata table is opened from a collapsed section.
- Labs 1.6 and 3.2: the Pull Request comment reads "Simulated deployment" on a check, with a table of the changes per type of component.
- Lab 3.5: the Pull Request comment shows the remote site setting protected by package-no-overwrite.xml.
- Lab 3.1: JWT is configured for preprod and production only, the configuration starts with a New User Story, and the second secret has its own picture.
- Labs 3.2, 3.3, 3.5, 3.6 and 3.11: integration and uat keep their auth URL secrets, and Lab 3.6 is where the JWT keys prove themselves.
- Reset this level also deletes the branches of that level's labs and sets up helios-dev and helios-integration again.
- Help: a new "Start the course over" section, linked from every level.
- Lab 2.1: what to answer when VS Code offers to merge the parent branch, and what to do when the backpromote refuses a required field.
- Simulate my teammates commits only its own files, and merges the Pull Request after a MegaLinter formatting fix.

## 2026-10-05

- Lab 3.8: the first monitoring run is green even with findings, and the lab says where to read them.
- A badge claim is answered once: the audit no longer posts the same comment twice on the issue.
- Lab 1.1: the Git installer options are named as the installer shows them, each installer is named where the lab talks about it, and the pill of the Extensions icon sits on that icon.
- Lab 1.2: a note says what a connected org and the default org are, and the Agentforce Vibes tip opens the GitHub CLI step instead of closing it.
- Lab 1.4: what to do when Open in Orgs Manager brings no browser tab.
- Lab 1.5: step 7 says which tab to go back to, with a picture of the two cleaning lines.
- Lab 2.2: the Start panel of Flow Builder has no Done button, the lab now closes it with its X.
- Set up my training environment creates your fork again. Its first step always stopped on "The fork could not be created", because the GitHub CLI refuses `--remote=false` once a repository is named, before it even contacts GitHub. When the fork does fail, the panel now shows what the GitHub CLI said above the usual reasons, and Lab 1.2 says to read it.
- Lab 2.1 works the same whether you did Level 1 or used Reset this level: you pick Romain's US-017, the only work your dev org lacks. The Backpromote panel can only start from a Pull Request of your fork, and after a reset your Level 1 stories are one commit, not Pull Requests, so "pick #1 US-014" could not be done. Step 1c checks that your dev org holds Level 1, which Romain's layout needs, and says how to put it there when you joined at Level 2. The lab also says which rows cannot be picked, that a number in brackets like (#77) is a Pull Request of the course repository, that the panel reads `integration` from GitHub without a pull, and that Romain's Pull Request has three files, not two.
- Every screenshot of VS Code was taken again with version 8.10.0 of the extension and 8.13.0 of sfdx-hardis, and its numbered pills put back in place. The GitHub pictures come from a brand new fork.
- Lab 3.3: the fix Pull Request of US-062 now ships the Crew Leads public group with the sources. Without it, the promotion to UAT of Lab 3.5 ended with a red deployment job, because the group only existed in the org where you created it by hand.
- Lab 3.6: the promotions to preprod and to production stop red until the email deliverability step is done in each org, ticked, and the check run again. The lab now says so, as Lab 3.5 does.
- Lab 2.1: the Backpromote list holds more than the three stories of the picture. The lab names the one to pick, #1 US-014, and says what the rows without a number are.
- Lab 2.4: at the red check, the two post-deployment actions read "not run in this org branch yet", not "skipped".
- Lab 3.5: the example release notes count 22 Pull Requests and 16 tickets, with the two Pull Requests Lab 3.3 gained.
- Save / Publish no longer ends by asking for a manual actions file: the project declares that manual steps are deployment actions, and sends you to the DevOps Pipeline panel.
- The MegaLinter comment of your Pull Requests no longer lists thousands of findings on the scripts of the course.
- Clean up a training org also removes the Crew Leads public group, so Lab 3.3 can be done again on the same org.

## 2026-10-04

- The screenshots of the DevOps Pipeline panel show it as the next VS Code extension draws it: a Pull Requests search button in the header, and a Pull Request window with General, Tickets, Deployment Actions, Validation, Code Quality and Deployment tabs.
- Lab 2.3: the picture of the feature branch and of the badge of its Pull Request shows the diagram again, with both marked.
- Labs 3.5 and 3.10: the branch windows show their Pull Requests as the list the next VS Code extension draws, with its text filter and a checkbox on each story.
- Lab 2.4: after declaring the three deployment actions, an explicit step says to commit their file and publish again, so the Pull Request carries them, and names the VS Code message that reminds you.
- Lab 3.3: the screenshot of the Deployment Actions tab shows the switch to the next promotion above the actions, and every item of the row menu.
- Labs 2.3 and 2.4: the deployment actions file shows the ids the editor generates, and says not to change them.

## 2026-10-03

- Lab 2.7: activate the flow after each change, and open its latest version to rebuild the flat roof rule, because Flow Builder can open an older one without Mariia's cap.
- Lab 2.8: what to do when the retrieve of every row stops on `GenOpAgentConfig`, a type Agentforce creates and the Salesforce CLI does not know yet. The next VS Code extension no longer lists the files of a Lightning Web Component one by one, which made that retrieve fail.
- Labs 2.4 and 3.5: a manual step declared before the deployment now stops the check until it is ticked or marked as done, then the check is run again.
- Lab 3.3 gains a Part 3: a teammate Pull Request whose post-deployment actions fail after the merge, recovered with Retry, a fix Pull Request and Mark as done from the Deployment Actions tab. It needs the next versions of sfdx-hardis and of the VS Code extension.
- Lab 2.3 shows the Deployment Actions tab as the next VS Code extension draws it: actions grouped by Pull Request, the type and the phase under the label.

## 2026-10-02

- The Training menu links and the User Story links of a new fork point to the course at its new address, <https://sfdx-hardis-training.github.io/>. A fork made earlier keeps working: the old address redirects.
- Lab 2.4 says where the two Apex classes are copied, and its Schedule Batch action finds `CrewCapacityBatch` in the list: the class is read from the project, and the lab explains the label it carries. It needs version 8.9.2 of the VS Code extension.
- Lab 2.5 names the two ways to the Org Monitoring Workbench, and says the Apex Tests card runs on the default org instead of asking for one.

## 2026-09-30

- **The course has a new address: <https://sfdx-hardis-training.github.io/>**, on its way to
  sfdx-hardis-training.cloudity.com once the domain is in place. Every old link keeps working:
  hardisgroupcom.github.io/sfdx-hardis-training now sends each page to the same page at the new
  address, and still serves the badge records, the story records and the share cards themselves, so
  a badge already claimed and a fork already made carry on as they are.
- The language picker works on the new address. It held a link that only existed under the old one.
- Lab 2.4 creates a Crew Capacity tab in the Helios Delivery app, so the records can be found in every org without typing a URL.

## 2026-09-29

- Lab 1.6 shows the counts a learner gets today, 36 sent and 7 changed, in its text and its two comment pictures.
- Pictures that show a later state of the course now say so: the pipeline of Lab 1.6, the Data Workbench of Lab 2.4 and the Merge Changes list of Lab 2.7.
- Lab 2.1 names the field the backpromote actually brings, Romain's Signed Off By.
- Lab 3.2 says the fixed Pull Request moves two fields to the second column, and Lab 3.5 explains why its notes count 20 Pull Requests.
- A badge claim now republishes the reset branches, so a retrofit in Labs 3.7 and 3.10 no longer brings badge files along.

## 2026-09-27

- Helios starts with the package-no-overwrite.xml every sfdx-hardis project gets, and Lab 3.5 adds the warehouse remote site setting to it.
- Pull Request checks are faster: MegaLinter no longer runs checkov and grype on the course.
- New **Create my lab records** entry in the Level 2 Training menu: Lab 2.4 no longer asks you to type the 12 Crew Capacity records, it creates them and you check them.
- The Apex code analyzer now blocks a Pull Request, as on a real project: Lab 2.5 shows the query in a loop refused, and the Apex samples the labs copy no longer carry findings.
- Lab 2.4 gives the SOQL query and the label to type when you create the data workspace, links SFDMU, and says how precise a manual action must be.
- Lab 2.8 step 4 says there is nothing to click, and Lab 2.9 says how to create the checklist records by hand.
- Clearer wording across the labs: retrieve, merge and bring back replace vaguer verbs, and the capstones ask for a GitHub star if you liked the course.

## 2026-09-26

- After **Reset this level** on Level 2, **Set up one of my training orgs** and every Pull Request into integration no longer fail on the Signed Off By field, which the start state granted before US-017 created it.
- Lab 2.1 walks through merging Romain's Pull Request click by click, with screenshots. In Level 2, **Simulate my teammates** prints the address of the teammate Pull Request and offers to merge it for you once its checks pass, and it knows when you already merged it yourself.
- **Claim my badge** no longer says your work is only on this computer when it is on your fork: after **Reset this level**, `integration` showed as not pushed, and so did branches pushed without tracking. The help page says how to claim from a fork made before this fix.
- The course site publishes again: the changes of 2026-09-25 below never reached it, because four labs named another lab without linking it.
- **Clean up a training org** works on an org that was used: it deletes the old versions of the Helios flows, and erases the objects instead of leaving them under Deleted Objects, where they made the next **Set up my training environment** fail.
- **Clean up a training org** also removes the External Client Apps of Lab 3.1, which stopped **Add/Configure Org** the next time Level 3 was walked on the same orgs.
- **Trigger my workflows** works after the Actions banner is clicked late: it no longer waits for the scheduled workflows GitHub keeps off on a fork.
- Labs 2.4, 3.5 and 3.6 say when a ticked manual action is recorded: by the next job that carries its Pull Request, so a pre-deployment step is done and ticked before the merge.
- Lab 2.2 keeps the new Crew Warning Sent field visible to the System Administrator profile, so Flow Builder can offer it, and says how to fix a field created without it.
- Lab 3.6 warns that a second DORA report on the same day replaces the baseline Lab 3.11 compares with.
- Lab 3.7 names the Quick Deploy line of the deployment comment, the one its picture marks.

## 2026-09-25

- Lab 3.8 answers the new question about the CI/CD repository that deploys to the org, and explains the `AGENTS.md` the nightly backup writes for coding agents.
- **Set up my training environment** waits for the one click GitHub asks for on a new fork, instead of reporting Actions on while no workflow ran.
- Check my work for Lab 1.2 fails when the fork runs none of its pipeline workflows.
- The monthly checks of the course no longer run on learners' forks.
- Lab 1.4 describes the Installation record page as it is: fields edited in place, no Details tab.
- Lab 1.5 no longer promises your branch in the pipeline diagram before its Pull Request exists.
- Lab 1.6 explains the MegaLinter warnings, and what to do when MegaLinter pushes a commit onto your branch.
- The badge claim says **Create**, the label of the GitHub button.
- **Simulate my teammates** no longer leaves a branch behind that made **Claim my badge** refuse Level 3.
- Lab 2.2 keeps the new checkbox off the layout, and asks for the flow description its picture shows.
- Lab 2.5 no longer promises a MegaLinter check with no findings.
- Lab 2.7 stages the rebuilt flow instead of committing it before the merge.
- Lab 2.8 gives the real size of the retrieved Admin profile.
- Lab 3.5 tests the crew cap on an installation it sets to Planned.
- Lab 3.7 squashes the hotfix, like every fix.
- Lab 3.11 counts eleven checks.
- Level 1 pictures of the DevOps Pipeline show a Level 1 fork, and the training menus show **Update my course**.
- Lab 2.1 pictures show the three stories a learner brings down, and Lab 2.3 the one action of its Pull Request.

## 2026-09-24

- The course has its own **Free training** page on the sfdx-hardis documentation site, linked from its menu, its home page and its guides.
- **Update my course** and **Reset this level** no longer fail on a course change to the workflow files: GitHub is asked once for the permission they need.
- Level 3: a new Lab 3.10 on promotion branches (Beta), and the capstone becomes Lab 3.11.
- Lab 3.10: two GitHub screenshots of a real promotion, the Pull Request description and the red check naming the files with conflict markers.
- Lab 3.10: the explanation of the cherry-pick conflict now matches what git writes, in the layout and in the permission set.
- Reset this level: the start branches are published from `main` automatically, so a reset always lands on the current labs.
- New **Update my course** in the Training menu of every level: brings the course changes made since you forked, through a Pull Request into `integration`, without losing your work.
- Every training command, and **Where am I?**, tells you when your fork is missing course changes it runs (lab pages, translations, the site and badges are ignored).
- Reset this level keeps the certificate keys of Lab 3.1, so a Level 3 pipeline still logs in to its orgs after a reset.
- **Update my course** goes to the end on its own: it waits for the checks of its Pull Request, merges it and brings the update to your computer.
- Badge pages: the LinkedIn button opens a post already written, the preview says which badge was earned, and a square picture can be downloaded to post the badge full size.

## 2026-09-23

- The QA banner shows only on the levels still in QA.
- Level 1 in French: fixes found by walking it end to end.
- Badges: the pages say the badges show up on Trailhead banners.
- Promotion branches are called Beta rather than experimental.
- Fixes found by an end to end walk of the whole course.
- The course runs in Agentforce Vibes, in a browser tab.

## 2026-09-22

- Badges: a second badge for a banner, the banner version on the badge page, and Release Manager as a superbadge.
- Every page shows in the language of the reader, and the badges got a new look.
- A Help page about Cloudity and open source, and the product documentation in the menu.
- One menu per language, and levels that start closed.
- Each lab declares what it does through the panels, so it can be walked automatically.

## 2026-09-21

- Every lesson runs from the VS Code panel, with no terminal behind it.
- The course is available in French, with English as the reference.
- Page views are measured on the course site.

## 2026-09-20

- First release: Salesforce DevOps with sfdx-hardis, 3 levels and 26 labs.
