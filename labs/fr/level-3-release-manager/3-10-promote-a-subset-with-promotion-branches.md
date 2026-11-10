---
id: lab-3-10
title: "Lab 3.10 - Promouvoir un sous-ensemble avec les promotion branches (Beta)"
description: "Transportez trois User Stories approuvées sur cinq de uat vers preprod avec une promotion branch sfdx-hardis, résolvez le conflit de cherry-pick qu'elle soulève, et mesurez ce que ce raccourci coûte."
level: 3
lab: 10
lang: fr
source_rev: "de634140193fe8bb335ec3e7bc2ef21ee127865e"
screenshots:
  - annotated/vscode/welcome-custom-menu-3
  - annotated/vscode/pipeline-config-danger--promotion-branches
  - annotated/vscode/pipeline-branch-modal-promotion--pick-what-goes
  - annotated/vscode/promotion-create-select--confirm
  - annotated/vscode/promotion-create-conflict--recommended
  - annotated/vscode/promotion-create-completed--prompt
  - annotated/web/github-pr-promotion-description
  - annotated/web/github-pr-promotion-markers
  - annotated/vscode/devops-pipeline-promotion--in-flight
  - annotated/vscode/promotion-conflict-editor--accept-incoming
depends_on:
  commands: [hardis:project:promotion:create, hardis:project:deploy:smart, hardis:doc:release-notes, hardis:work:new, hardis:work:save]
  flags: [on-conflict]
  config: [enablePromotionBranches, allowedPromotionSteps, mergeTargets, promotionConflictMarkersIgnoredFiles]
  panels: [pipeline, pipelineConfig, commandExecution]
  docs: [salesforce-devops-promotion-branches, salesforce-devops-retrofit, hardis/project/promotion/create]
---

# Lab 3.10 - Promouvoir un sous-ensemble avec les promotion branches (Beta)

**Niveau** : 3 Release Manager

**Durée** : ~1 h 40<!-- observed --> (observé : médiane 1 h 42, 14 participants, le plus rapide 39 min)<!-- /observed -->

**Vous allez** : livrer en preprod trois User Stories approuvées pendant que deux autres restent en
UAT, résoudre le conflit que l'une d'elles traîne avec elle, et remettre la pipeline d'aplomb
ensuite, avec la seule fonctionnalité de sfdx-hardis dont vous devriez espérer ne jamais avoir
besoin deux semaines de suite.

## La situation

Cinq stories sont arrivées cette semaine, et les cinq sont en UAT. La livraison est jeudi et la date
ne bouge pas : la bascule de l'entrepôt a besoin du nouveau statut en production avant le week-end.

| Story  | Auteur | Ce qu'elle fait                                                                                                                                                                                                                                                               | État        |
|--------|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| US-058 | Romain | Stocke la durée de garantie sur un panel batch. Elle fonctionne. Personne n'a validé la formulation, parce que la personne qui valide les formulations est absente jusqu'au milieu de la semaine prochaine                                                                    | Non validée |
| US-057 | Mariia | Donne aux planificateurs un statut *Awaiting Parts* pour une installation bloquée par une pièce manquante. Le responsable des opérations l'a testée mardi et l'a validée par écrit                                                                                            | Validée     |
| US-059 | Romain | Stocke le fournisseur sur un panel batch. Il l'a écrite le lendemain d'US-058, et a placé le nouveau champ juste sous la durée de garantie sur la présentation de page, parce que les deux viennent de la même facture. L'acheteur l'a validée mercredi                       | Validée     |
| US-060 | Mariia | Signale une installation qui a besoin d'un échafaudage. Elle fonctionne aussi, et le responsable des opérations la retient : les équipes n'ont pas été informées de ce qu'elles doivent faire d'un site signalé, et un signal que personne ne suit est pire que pas de signal | En attente  |
| US-061 | Mariia | Met le code du portail du site sur l'installation. Les chefs d'équipe l'ont testée mardi et la veulent avant le week-end                                                                                                                                                      | Validée     |

Vous avez donc une fenêtre de promotion qui contient trois stories approuvées et deux stories
auxquelles personne n'a dit oui, et la promotion ordinaire est tout ou rien. Elle transporte `uat`
telle qu'elle est, US-058 et US-060 comprises.

!!! warning "C'est l'exception, et elle doit le rester"
    Promouvoir des branches plutôt que des fonctionnalités est la manière recommandée, et tous les
    autres labs de ce niveau le font. Une version dont les stories ont été testées ensemble est la
    version qui a été testée.

    Une promotion branch casse cela volontairement. Après elle, `uat` et `preprod` ne contiennent
    plus la même chose, les orgs derrière divergent, et la production fait tourner une combinaison
    que personne n'a jamais testée dans son ensemble. C'est un coût réel, payé plus tard, en général
    par la personne d'astreinte.

    Utilisez-la quand une date ne peut pas bouger et qu'une validation n'est pas arrivée. N'en
    faites pas un processus : une équipe qui assemble une promotion branch toutes les semaines a un
    problème de validation, pas un problème d'outillage, et cela se corrige en amont.

## Avant de commencer

- [ ] [Lab 3.9](3-9-generate-the-project-documentation.md) terminé
- [ ] Les quatre branches déploient, et les quatre orgs sont connectées
- [ ] `enablePromotionBranches` et `allowedPromotionSteps` publiés au
      [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md), et remontés jusqu'à `preprod` par les promotions des Labs 3.5 et 3.6
- [ ] Rien en attente dans le panneau **Source Control** qui vous tienne encore à cœur
- [ ] **SF Merge Driver**, en bas à droite de VS Code, affiche un rond gris : le driver est éteint.
      Si le rond est vert, cliquez dessus pour l'éteindre, sinon il résout les conflits de
      l'étape 4 avant que vous ne les voyiez

## Les étapes

### 1. Vérifier que la fonctionnalité est active, et où elle est autorisée

Objectif : les deux réglages de promotion vérifiés avant de compter dessus.
Rappel : [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md)

Les deux réglages dont ce lab a besoin ont été publiés au [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md) et remontent la pipeline avec
chaque promotion depuis.

#### À faire

1. Ouvrez le panneau **DevOps Pipeline**, le menu engrenage, puis **Configure Pipeline Settings**
2. Choisissez la portée **Global Settings**, et ouvrez l'onglet **Danger Zone**

   ![La Danger Zone des Global Pipeline Settings, avec les deux réglages des promotion branches](../../_assets/annotated/vscode/pipeline-config-danger--promotion-branches.png)

3. Lisez la ligne en haut de cet onglet avant tout le reste : *Use these settings with caution, be
   sure to understand their impact as they drift from DevOps best practices.*
4. Vérifiez que **Enable promotion branches (Beta)** **(1)** affiche **Enabled** : la fonctionnalité
   est active pour tout le projet
5. Vérifiez que **Allowed promotion steps (Beta)** **(2)** contient une ligne, source `uat` et cible
   `preprod` : la seule étape sur laquelle un release manager peut ici assembler une promotion

#### Pourquoi

Le produit range cette fonctionnalité dans le même tiroir que les déploiements delta entre branches
majeures, et pour la même raison.

Les étapes autorisées ne sont pas de la paperasse. Elles sont la raison pour laquelle le bouton que
vous allez utiliser existe sur `uat` et pas sur `integration` : un sous-ensemble est une décision sur
ce qui part vers l'étape juste avant la production, et personne n'a besoin de la prendre en entrant
dans une org d'intégration qui est reconstruite depuis la branche de toute façon.
`sf hardis:project:promotion:create` refuse purement et simplement de tourner tant que la liste est
absente, plutôt que de deviner que chaque branche majeure peut promouvoir vers toutes les autres.

<details markdown="1"><summary>Sous le capot : pourquoi un réglage publié au Lab 3.1 compte maintenant</summary>

Les deux réglages sont au niveau projet, dans `config/.sfdx-hardis.yml` :

    enablePromotionBranches: true
    allowedPromotionSteps:
      - source: uat
        target: preprod

Le job de déploiement d'une Pull Request de promotion tourne sur la promotion branch, et une
promotion branch est coupée depuis sa cible : la configuration qu'il lit est donc celle que
porte `preprod`. Un réglage activé aujourd'hui dans `integration` ne serait pas dans `preprod` avant
qu'une promotion l'y porte, et d'ici là le job traiterait la Pull Request de promotion comme une
branche de fonctionnalité ordinaire : il déploierait quand même, et il ignorerait silencieusement
les stories que la branche déclare.

C'est pour cela que le réglage a été publié au [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md) avec le reste de la configuration du
pipeline, et pour cela qu'il est resté inerte depuis : sans aucune promotion branch dans le
repository, un projet avec la fonctionnalité active se comporte exactement comme un projet sans.

</details>

#### Vous devriez voir

- La fonctionnalité **Enabled**, et exactement une étape autorisée : `uat` vers `preprod`

### 2. Prendre les cinq stories, dans l'ordre, et les promouvoir comme d'habitude

Objectif : les cinq stories dans `uat`, déployées dans `helios-uat`.
Rappel : [Lab 3.2](3-2-review-a-contributor-pull-request.md), [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md)

Rien de nouveau ici, c'est donc écrit court.

#### À faire

1. Ouvrez **Welcome page** > **Training: Level 3** > **Simulate my teammates**

   ![Le menu Training Level 3 sur la Welcome page](../../_assets/annotated/vscode/welcome-custom-menu-3.png)

2. Prenez les cinq stories du tableau ci-dessous une à la fois, de haut en bas. Pour chacune, faites
   les tâches 3 et 4 avant de prendre la suivante
3. Relisez-la avec les quatre questions du [Lab 3.2](3-2-review-a-contributor-pull-request.md)
4. Mergez-la dans `integration` avec **Squash and merge**, comme toute Pull Request de fonctionnalité
   de ce cours. Vous n'avez pas à attendre son déploiement avant de prendre la suivante : ils se
   mettent en file sur `integration`
5. Quand la dernière est verte, promouvez `integration` vers `uat` comme au [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md) : la pastille **+ PR**
   sur la flèche, un titre lisible par un humain, puis un merge commit (**Create a merge commit**,
   sous la flèche du bouton vert)

| # | Story                                                 | Prérequis                 | Mergée |
|---|-------------------------------------------------------|---------------------------|--------|
| 1 | US-058 Record the warranty term on a panel batch      | -                         | [ ]    |
| 2 | US-057 Park an installation that is waiting for parts | -                         | [ ]    |
| 3 | US-059 Record the supplier of a panel batch           | US-058 dans `integration` | [ ]    |
| 4 | US-060 Flag an installation that needs scaffolding    | -                         | [ ]    |
| 5 | US-061 Record the gate code of a site                 | -                         | [ ]    |

!!! warning "Attention"
    Les Pull Requests de fonctionnalité utilisent **Squash and merge**. La promotion d'`integration`
    vers `uat` utilise un merge commit, jamais un squash.

#### Pourquoi cet ordre

L'ordre est la semaine telle qu'elle s'est passée, et il compte deux fois. US-059 a été écrite
par-dessus US-058 : Romain a coupé sa branche après le merge de la durée de garantie, et a placé le
champ fournisseur juste dessous. La simulation refuse de construire US-059 tant qu'US-058 n'est pas
dans `integration`, et vous le dit. Et l'ordre dans lequel les stories ont été mergées est l'ordre
dans lequel la fenêtre de `uat` les liste, que l'étape 4 lit de haut en bas.

<details markdown="1"><summary>Sous le capot : comment la simulation sait qu'US-059 a besoin d'US-058</summary>

Chaque story de coéquipier est un scénario sous `scripts/simulate/`, et
`us-059-supplier/scenario.json` porte une ligne que les autres n'ont pas :

    "basedOn": "us-058-warranty-term"

Avant de couper la branche depuis votre `integration`, la commande vérifie que chaque changement
d'US-058 y est : le fichier du champ, sa ligne sur la présentation de page, son droit sur le
permission set. Sans eux, le patch d'US-059 n'a aucune ligne où s'accrocher, puisqu'il place
`Supplier__c` après `Warranty_Years__c`. La vérification transforme un obscur « cannot be placed »
en une phrase qui nomme la story à merger d'abord.

</details>

#### Vous devriez voir

- Les cinq stories dans `uat`, déployées dans `helios-uat`

C'est le moment que toute vraie semaine finit par atteindre : tout est testable, et une partie
seulement est approuvée.

### 3. Décider, avant de toucher à quoi que ce soit

Objectif : une option choisie, et sa raison écrite.

Vous avez trois options et l'outil n'en sert qu'une. Sachez pourquoi vous choisissez celle-là.

| Option                                      | Ce qu'elle coûte                                                                                                                                                                                                                     | Quand elle est la bonne                                                                                                       |
|---------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Attendre les validations                    | La livraison glisse d'une semaine                                                                                                                                                                                                    | Presque toujours. C'est la seule option qui garde les orgs alignées                                                           |
| Sortir US-058 et US-060 de `uat`            | Deux reverts, chacun sur une feature branch à part qui passe par `integration` puis `uat` comme n'importe quelle story, jamais un commit directement sur `uat`, et les deux stories devront revenir plus tard, rebasées et retestées | Quand une story est vraiment mauvaise, pas simplement non validée                                                             |
| Transporter US-057, US-059 et US-061 seules | `uat` et `preprod` divergent jusqu'à la prochaine promotion complète, et il faut décrocher US-059 d'US-058                                                                                                                           | Quand la date est fixe, que les validations n'arriveront pas, et que les stories laissées derrière sont bien là où elles sont |

Cette semaine, c'est la troisième, et la raison est écrite : la bascule de l'entrepôt.

#### À faire

1. Écrivez cette raison quelque part où un successeur la trouvera. La Pull Request que vous allez
   créer est un bon endroit, et l'étape 7 y revient

#### Vous devriez voir

- La troisième option choisie, et sa raison, la bascule de l'entrepôt, prête à coller

### 4. Choisir ce qui part

Objectif : une promotion branch assemblée avec trois stories, et le conflit qu'elle sait venir
committé pour plus tard.
Rappel : [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md)

#### À faire : choisir les stories

1. Ouvrez le panneau **DevOps Pipeline** et cliquez sur le nœud `uat`. La fenêtre qui s'ouvre est
   celle que le [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md) utilisait pour lire une fenêtre de promotion, avec deux choses dessus qui ne
   servaient à rien jusqu'ici : une case à cocher sur chaque ligne de User Story **(1)**, et
   **Create promotion from uat (Beta)** dans le pied de la fenêtre **(2)**

   ![La fenêtre de branche d'uat, avec les cases à cocher et le bouton Create promotion](../../_assets/annotated/vscode/pipeline-branch-modal-promotion--pick-what-goes.png)

2. La fenêtre liste les cinq stories de la plus récente à la plus ancienne : US-061, US-060, US-059,
   US-057, US-058. Cochez la première, la troisième et la quatrième, US-061, US-059 et US-057, et
   laissez US-060 et US-058 tranquilles
3. Laissez aussi décochées les Pull Requests plus anciennes en dessous : le retrofit du [Lab 3.7](3-7-hotfix-and-retrofit.md) et
   la configuration du [Lab 3.8](3-8-monitor-your-production-org.md)
4. Le libellé du bouton compte ce que vous avez coché : **Create promotion from uat (3 selected)
   (Beta)**. Cliquez dessus
5. Un onglet d'exécution de commande s'ouvre. Il liste ce qui attend dans `uat`, puis pose une seule
   question, **Select the Pull Requests to carry in the promotion branch**, avec vos trois stories
   déjà cochées **(1)**. Relisez la liste une fois et confirmez **(2)**

   ![Le panneau d'exécution de commande, arrêté sur la sélection à confirmer, avec les trois stories cochées](../../_assets/annotated/vscode/promotion-create-select--confirm.png)

#### Pourquoi

Les cases à cocher et le bouton apparaissent tous les deux parce que `uat` est la source d'une étape
de promotion autorisée et que `preprod` en est la cible. Le panneau a passé votre choix à la
commande, et la commande vous demande de le confirmer plutôt que de le prendre pour acquis.

Lisez ensuite le log, parce qu'il fait quelque chose que vous feriez à la main sinon, et cette fois
il ne va pas jusqu'au bout tout seul :

```text title="Résultat"
3 Pull Request(s) selected for the promotion
Creating promotion branch promotion/uat/preprod/2026-09-24-0930 from origin/preprod...
Cherry-picking #62 US-057 Park an installation that is waiting for parts (my-username) [7c41ab9]...
Cherry-picking #63 US-059 Record the supplier of a panel batch (my-username) [d1e90e9]...
Cherry-pick of #63 US-059 Record the supplier of a panel batch (my-username) [d1e90e9] conflicts.
This User Story probably depends on another one that is not part of the promotion. Conflicting files:
force-app/main/default/layouts/Panel_Batch__c-Panel Batch Layout.layout-meta.xml
force-app/main/default/permissionsets/Helios_Delivery_Manager.permissionset-meta.xml
```

Les numéros sont ceux du fork du cours ; les vôtres diffèrent, et ce sont les noms des stories
qu'il faut lire. Les cherry-picks vont de la plus ancienne à la plus récente, donc US-057 est passée
proprement, et US-059 s'est arrêtée : elle a été écrite par-dessus US-058, et `preprod` n'a jamais
vu US-058.

#### À faire : répondre à la question du conflit

1. La commande demande quoi faire d'US-059, et propose sept réponses **(1)**. Prenez la première,
   **Recommended: commit this User Story and every following conflict with their conflict markers,
   without asking again**

   ![Le panneau d'exécution de commande, arrêté sur la question du conflit, avec la réponse recommandée en premier](../../_assets/annotated/vscode/promotion-create-conflict--recommended.png)

!!! warning "Attention"
    Ne choisissez pas **leave this User Story out** parce que ça a l'air plus propre. L'acheteur a
    validé US-059, et une promotion qui laisse tomber en silence une story approuvée parce que git
    l'a trouvée encombrante est une promotion dont la Pull Request ment sur la semaine.

#### Pourquoi cette réponse

La promotion est assemblée en entier, conflit compris, et vous le résolvez en une passe sur la
branche ensuite, à l'étape 6. Les autres réponses, dans l'ordre où la question les liste, sont pour
d'autres semaines : committer celle-ci avec ses marqueurs mais redemander au prochain conflit,
résoudre ce conflit tout de suite dans l'éditeur pendant que la commande attend, laisser la story de
côté, les deux réponses risquées ci-dessous, ou tout arrêter et tout défaire.

Les deux réponses marquées **(risky)** gardent le côté `uat` de chaque ligne en conflit, et personne
ne relit ce qu'elles ont décidé. Ici, elles garderaient la ligne et le droit Warranty Years que
l'étape 6 supprime à la main, et qui appartiennent à US-058, une story que cette promotion laisse
de côté. Cette semaine, la validation le verrait quand même, parce que `preprod` n'a pas de champ
`Warranty_Years__c` et que le déploiement échoue. Avec un champ qui existe déjà dans `preprod`,
rien ne le verrait : les fichiers sont seulement listés, sous un avertissement dans la description
de la Pull Request et à la fin du message de commit de la story, pour que quelqu'un les relise avant
le merge.

Le log continue jusqu'au bout :

```text title="Résultat"
Conflict handling: commit-with-markers-all
#63 US-059 Record the supplier of a panel batch (my-username) [d1e90e9] committed with conflict markers in: force-app/main/default/layouts/Panel_Batch__c-Panel Batch Layout.layout-meta.xml, force-app/main/default/permissionsets/Helios_Delivery_Manager.permissionset-meta.xml. Solve them on the branch before merging
Cherry-picking #65 US-061 Record the gate code of a site (my-username) [5b7e2c1]...
Pushing promotion branch promotion/uat/preprod/2026-09-24-0930...
Creating the Pull Request from promotion/uat/preprod/2026-09-24-0930 to preprod...
Promotion Pull Request created: https://github.com/my-username/sfdx-hardis-training/pull/66
Promotion branch promotion/uat/preprod/2026-09-24-0930 assembled with 3 User Story(ies): #62, #63, #65
1 User Story(ies) carry conflict markers to solve before the Pull Request can be merged: force-app/main/default/layouts/Panel_Batch__c-Panel Batch Layout.layout-meta.xml, force-app/main/default/permissionsets/Helios_Delivery_Manager.permissionset-meta.xml
A prompt to solve the committed conflicts with a coding agent (Claude Code, Codex, Copilot...) is saved in hardis-report/promotion-conflicts-prompt-2026-09-24-0931.md and embedded in the Pull Request description
```

US-061 est passée proprement après le conflit, alors qu'elle touche la même présentation de page
Installation qu'US-060, l'autre story laissée derrière : un conflit exige les deux changements sur
les mêmes lignes du même fichier, et Mariia a mis le code du portail en haut de la présentation de
page et le signal d'échafaudage plus bas.

<details markdown="1"><summary>Sous le capot : ce que le bouton a lancé, ce que le nom de la branche veut dire, et ce qu'est un conflit ici</summary>

Le bouton a lancé, dans le panneau d'exécution de commande :

    sf hardis:project:promotion:create --source-branch uat --target-branch preprod --pull-requests 62,63,65

`--target-branch` a été passé plutôt que demandé parce que `allowedPromotionSteps` ne laisse à `uat`
qu'une seule cible. Avec plusieurs cibles autorisées, la commande aurait posé la question. La
réponse que vous avez donnée à la question du conflit est ce que `--on-conflict commit-with-markers`
fait pour chaque conflit d'une exécution, et c'est ainsi qu'un agent ou une pipeline la donne.

La branche est nommée `promotion/<source>/<cible>/<YYYY-MM-DD>-<HHMM>`, en UTC, et un `-2`, `-3`
n'est ajouté que si cette minute est déjà prise. La forme est fixe et non configurable : les jobs de
déploiement, le diagramme de la pipeline et les notes de version reconnaissent tous une promotion à ça.

Elle est coupée depuis `origin/preprod`, pas depuis `uat`. C'est toute l'astuce : une branche qui
part de la cible et ne reçoit que les commits choisis ne peut pas transporter ce que vous n'avez pas
choisi. Les commits sont copiés avec `git cherry-pick -x`, qui garde le message d'origine et ajoute
une ligne `(cherry picked from commit ...)`, de sorte que la copie peut être remontée jusqu'au
commit de `uat` dont elle vient.

Un cherry-pick réécrit le SHA du commit, et c'est pour cela que la Pull Request doit déclarer en
toutes lettres ce qu'elle transporte : plus rien dans git ne relie la copie à la Pull Request dont
elle vient.

Le conflit, c'est git qui est exact, pas git qui est difficile. Le commit d'US-059 dit « après la
ligne Warranty Years de la présentation de page, ajoute une ligne Supplier », et « à côté du droit
Warranty Years du permission set, ajoute un droit Supplier ». Sur `preprod` il n'y a ni ligne
Warranty Years ni droit Warranty Years sur quoi s'appuyer, donc git s'arrête et écrit les deux
versions dans le fichier, entre des marqueurs : ce que `preprod` a du côté `<<<<<<< HEAD`, c'est à
dire rien à cet endroit, et ce que la story apporte du côté `>>>>>>>`, l'entrée Warranty Years et
l'entrée Supplier ensemble. Git coupe le bloc là où les lignes cessent de coïncider, pas là où un
élément XML commence : dans la présentation de page, les deux lignes qui ouvrent la ligne Warranty
Years ouvrent aussi la ligne qui suit sur `preprod`, donc elles restent juste au-dessus des
marqueurs, et le côté entrant va du champ Warranty Years aux lignes d'ouverture de la ligne qui
suit Supplier. La réponse recommandée committe les fichiers exactement comme ça, pour que la
branche puisse être poussée, la Pull Request ouverte, et la décision prise là où on peut la relire.

<!-- command-links:start -->
Documentation de la commande : [hardis:project:promotion:create](https://sfdx-hardis.cloudity.com/hardis/project/promotion/create/)
<!-- command-links:end -->

</details>

#### Vous devriez voir

- Les deux derniers avertissements de l'exécution **(1)**, qui disent ce qu'il reste à faire
- Dans la barre du bas, les deux choses dont vous avez besoin ensuite : le prompt pour un agent de
  code, enregistré comme fichier de rapport **(2)**, et **Open the promotion Pull Request** **(3)**

![La fin de l'exécution, avec les deux avertissements sur les marqueurs et le fichier du prompt à côté du bouton de la Pull Request](../../_assets/annotated/vscode/promotion-create-completed--prompt.png)

### 5. Lire ce qu'elle a créé

Objectif : vous savez ce que la Pull Request de promotion déclare, pourquoi son contrôle est rouge,
et où la promotion apparaît dans la pipeline.

#### À faire : lire la Pull Request

1. Cliquez sur **Open the promotion Pull Request**. Elle s'intitule
   `Promotion uat to preprod (2026-09-24-0930)`, et sa description contient la seule chose qui fait
   marcher tout le reste, plus, cette semaine, un avertissement :

   ````markdown title="Résultat"
   Promotion branch `promotion/uat/preprod/2026-09-24-0930` carrying 3 User Stories approved in `uat`,
   cherry-picked for `preprod`.

   > ⚠️ **Conflicts to solve before merging.** 1 User Story was committed with git conflict markers
   > (`<<<<<<<`, `=======`, `>>>>>>>`) left in the files listed below. Solve them on this branch, by hand
   > or with a coding agent, and push: the validation job fails until they are gone.

   ```yaml
   promotionPullRequests: [62, 63, 65]
   ```

   ## Carried Pull Requests

   | Pull Request | Title                                                 | Author      | Source branch                         | Commit    |
   |--------------|-------------------------------------------------------|-------------|---------------------------------------|-----------|
   | #62          | US-057 Park an installation that is waiting for parts | my-username | `training/mate-us-057-awaiting-parts` | `7c41ab9` |
   | #63          | US-059 Record the supplier of a panel batch           | my-username | `training/mate-us-059-supplier`       | `d1e90e9` |
   | #65          | US-061 Record the gate code of a site                 | my-username | `training/mate-us-061-gate-code`      | `5b7e2c1` |

   Tickets: US-057, US-059, US-061

   ## Committed with conflict markers

   - US-059 Record the supplier of a panel batch (#63)
     - `force-app/main/default/layouts/Panel_Batch__c-Panel Batch Layout.layout-meta.xml`
     - `force-app/main/default/permissionsets/Helios_Delivery_Manager.permissionset-meta.xml`

   <details>
   <summary>Prompt for a coding agent (Claude Code, Codex, Copilot...) to solve the conflicts</summary>
   ...
   </details>

   _Created with `sf hardis:project:promotion:create`. Do not squash this Pull Request when merging it._
   ````

   ![La description de la promotion Pull Request sur GitHub, avec l'avertissement, le bloc de déclaration, le tableau des Pull Requests portées et le prompt replié](../../_assets/annotated/web/github-pr-promotion-description.png)

2. Lisez la description avec le tableau ci-dessous
3. Ouvrez les **Checks** de la Pull Request. Le check **Simulate Deployment to Major Org** est rouge,
   et le commentaire sfdx-hardis dit pourquoi : son verdict indique **❌ Cannot merge into `preprod`: Git
   conflict markers in the promotion branch**, et un paragraphe en dessous nomme les fichiers :

   > Nothing was deployed: the promotion branch `promotion/uat/preprod/2026-09-24-0930` still
   > contains git conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) in 2 file(s). Solve them on the
   > branch, by hand or with the prompt for a coding agent embedded in this Pull Request description
   > (also saved in `hardis-report/`), then commit and push: the job runs again from there.
   >
   > - `force-app/main/default/layouts/Panel_Batch__c-Panel Batch Layout.layout-meta.xml`
   > - `force-app/main/default/permissionsets/Helios_Delivery_Manager.permissionset-meta.xml`

   ![Le commentaire sfdx-hardis du check rouge, qui nomme les deux fichiers contenant encore des marqueurs de conflit](../../_assets/annotated/web/github-pr-promotion-markers.png)

| Partie de la description        | Ce que c'est                                                                                                                                                                    | Qu'en faire                                                                                                                                                      |
|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| L'avertissement                 | 1 story a été committée avec des marqueurs de conflit dans les fichiers listés                                                                                                  | L'étape 6 les résout                                                                                                                                             |
| Le bloc yaml                    | La déclaration, et chaque job qui tourne sur cette Pull Request la lit                                                                                                          | Gardez-le, et ne retouchez pas les numéros à la main : la commande a écrit ce qu'elle a réellement cherry-pické                                                  |
| Carried Pull Requests           | Les stories qu'elle transporte. La colonne Author est le compte GitHub qui a ouvert chaque Pull Request, la colonne Title vient de la Pull Request elle-même                    | Lisez-le                                                                                                                                                         |
| Committed with conflict markers | US-059 et ses deux fichiers                                                                                                                                                     | Les fichiers de l'étape 6                                                                                                                                        |
| Le prompt replié                | Tout le conflit, rédigé pour un agent de code : la branche à récupérer, la story et son commit d'origine, les deux fichiers, et les règles d'un merge de métadonnées Salesforce | L'étape 6 l'utilise, ou le même texte dans `hardis-report/promotion-conflicts-prompt-<date>.md`, le fichier de rapport que le panneau de commande vous a proposé |
| La dernière ligne               | Ne pas squasher cette Pull Request au merge                                                                                                                                     | L'étape 7 merge avec un merge commit                                                                                                                             |

#### Pourquoi

Le bloc yaml est la façon dont les trois stories gardent, dans `preprod`, tout ce qu'elles auraient
eu dans une promotion ordinaire : leurs deployment actions s'exécutent, leurs classes de test Apex
sont sélectionnées, leurs tickets sont mis à jour, et les notes de version de `preprod` nomment les
stories plutôt que la promotion qui les a transportées. Supprimez ce bloc et il vous reste une
branche avec des commits dessus et aucune idée de ce à quoi ils servent.

La colonne Author est votre propre identifiant et non celui de Mariia ou de Romain : le coéquipier a
écrit le commit, `Simulate my teammates` a ouvert la Pull Request avec votre compte. La fenêtre de
branche du panneau affiche l'auteur du commit, et c'est pour cela que les deux ne disent pas la même
chose.

La colonne Title vient de la Pull Request, lue via l'API du git provider. La commande exige
cette connexion et refuse de démarrer sans elle : une promotion se comporte ainsi de la même façon
sur GitHub, GitLab, Bitbucket et Azure DevOps, et chaque ligne portée nomme sa vraie story. Ici
vous ne voyez jamais ce refus : l'extension transmet sa propre connexion GitHub, ouverte depuis le
[Lab 1.2](../level-1-contributor-basics/1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md). Hors de VS Code, un agent ou un job doit recevoir le token
(`GITHUB_TOKEN`, dans l'environnement ou dans un fichier `.env` à la racine du repository).

Le contrôle rouge est le filet de sécurité : un marqueur dans un fichier XML est parfois toléré par
git et toujours fatal pour Salesforce, donc le job s'arrête avant de déployer quoi que ce soit, et
le dit là où vous regardez plutôt que d'échouer en silence dans un log.

#### À faire : lire la pipeline

1. Retournez dans le panneau **DevOps Pipeline** et regardez le diagramme. La promotion en vol est
   dessinée sur la flèche entre `uat` et `preprod` **(1)**, avec son numéro de Pull Request et son
   contrôle rouge, là où se trouvait la pastille **+ PR**
2. Lisez le compteur sur le nœud `uat` **(2)** : il affiche toujours sept

   ![La promotion ouverte dessinée sur la flèche de uat vers preprod](../../_assets/annotated/vscode/devops-pipeline-promotion--in-flight.png)

#### Pourquoi sept

La promotion n'est pas une branche de votre pipeline, c'est quelque chose qui se déplace entre deux
d'entre elles, et cela vit exactement le temps de sa Pull Request. Rien n'a encore bougé. Le
compteur compte des Pull Requests : les cinq stories, plus le retrofit du [Lab 3.7](3-7-hotfix-and-retrofit.md) et la
configuration du [Lab 3.8](3-8-monitor-your-production-org.md) qui se trouvent sous elles dans la fenêtre. Une promotion ouverte est une
proposition. Mergez-la, revenez, et le compteur affiche quatre, parce qu'une Pull Request n'apparaît
qu'à un seul endroit : à partir de là US-057, US-059 et US-061 sont listées dans la fenêtre de
`preprod`, la branche qu'elles ont atteinte, et plus dans celle de `uat`, la branche qu'elles ont
quittée.

#### Vous devriez voir

- Un contrôle rouge sur la Pull Request de promotion, qui nomme les deux fichiers contenant des
  marqueurs
- La promotion dessinée sur la flèche de `uat` vers `preprod`, et sept sur le nœud `uat`

### 6. Résoudre le conflit sur la promotion branch

Objectif : dans les deux fichiers, l'entrée Supplier gardée et l'entrée Warranty Years laissée
dehors, et le contrôle vert.
Rappel : [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md), [Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md)

La commande vous a laissé sur la promotion branch : la barre d'état, en bas à gauche de VS Code,
affiche `promotion/uat/preprod/2026-09-24-0930`. C'est là que va la correction.

Décidez d'abord de ce qu'est la correction, parce qu'aucune des deux voies ci-dessous ne la décide
pour vous. La règle que le prompt donne à un agent de code est la règle que vous appliquez à la
main :

> Keep the intent of the story while preserving everything else that exists in `preprod`. A conflict
> usually means the story depends on another story that is not part of this promotion: in that case,
> bring in only the minimum the promoted story needs, never the whole other story.

L'intention d'US-059, c'est un champ Supplier, sur la présentation de page et accordé aux managers.
Ce dont elle a besoin d'US-058 : rien. Une ligne fournisseur n'a pas besoin d'une ligne garantie
au-dessus d'elle pour fonctionner. Dans les deux fichiers, la réponse est donc la même : garder
l'entrée Supplier, et laisser l'entrée Warranty Years dehors.

| Fichier                                  | Garder                                 | Laisser dehors               |
|------------------------------------------|----------------------------------------|------------------------------|
| Présentation de page Panel Batch         | la ligne Supplier, après Cost          | la ligne Warranty Years      |
| Permission set `Helios_Delivery_Manager` | le droit Supplier, après Serial Prefix | le droit `Warranty_Years__c` |

!!! warning "Attention"
    Reprendre les entrées Warranty Years serait pire qu'un mauvais merge : `preprod` n'a pas de champ
    `Warranty_Years__c`, donc une présentation de page ou un permission set qui le nomme échoue au
    déploiement.

Deux façons de le faire. La première est celle que le produit recommande, la seconde marche sur
n'importe quelle machine.

#### À faire : avec un agent de code

1. Cliquez sur le fichier de rapport **Prompt for a coding agent to solve the promotion conflicts**
   dans la barre du panneau de commande : il ouvre
   `hardis-report/promotion-conflicts-prompt-2026-09-24-0931.md`
2. Sélectionnez tout son contenu et copiez-le
3. Ouvrez le chat de votre agent de code dans VS Code, Claude Code, GitHub Copilot Chat en mode
   agent, Codex ou un autre, collez le prompt, et envoyez-le
4. Lisez son compte-rendu, puis ouvrez le commit sur la Pull Request et vérifiez qu'il a fait ce que
   dit le tableau ci-dessus : Supplier dedans, Warranty Years dehors, rien d'autre touché

L'agent récupère la branche, lit le commit d'origine de la story, modifie les deux fichiers, lance
la recherche de marqueurs que le prompt demande, committe avec un message qui dit ce qu'il a gardé,
et pousse. Un agent qui a repris Warranty Years, ou gardé les deux côtés, se corrige comme on
corrigerait un coéquipier : dites-le lui, et relisez.

#### À faire : à la main, dans l'éditeur

1. Ouvrez la présentation de page : dans l'**Explorer**, `force-app` > `main` > `default` >
   `layouts` > `Panel_Batch__c-Panel Batch Layout.layout-meta.xml`. VS Code colore le bloc de
   conflit et dessine quatre petits liens au-dessus : **Accept Current Change**, **Accept Incoming
   Change**, **Accept Both Changes**, **Compare Changes**

   ![La présentation de page Panel Batch ouverte dans l'éditeur, avec le bloc de conflit et ses liens Accept](../../_assets/annotated/vscode/promotion-conflict-editor--accept-incoming.png)

2. Cliquez sur **Accept Incoming Change** **(1)** : le côté courant, `preprod`, n'avait rien à cet
   endroit, et le côté entrant est la story. Il reste deux lignes là où il y avait un conflit,
   Warranty Years puis Supplier
3. Supprimez les quatre lignes de la ligne Warranty Years **(2)**, pour que le bloc se lise comme
   ci-dessous, et enregistrez. Copiez-le d'ici plutôt que de le taper : personne ne demande d'écrire
   du XML de mémoire

   ```xml title="À modifier dans le fichier"
               <layoutItems>
                   <behavior>Edit</behavior>
                   <field>Cost__c</field>
               </layoutItems>
               <layoutItems>
                   <behavior>Edit</behavior>
                   <field>Supplier__c</field>
               </layoutItems>
               <layoutItems>
                   <behavior>Edit</behavior>
                   <field>External_Id__c</field>
               </layoutItems>
   ```

4. Faites de même dans `permissionsets` > `Helios_Delivery_Manager.permissionset-meta.xml` :
   **Accept Incoming Change**, puis supprimez les cinq lignes du droit
   `Panel_Batch__c.Warranty_Years__c`, pour que le droit Supplier suive celui de Serial Prefix :

   ```xml title="À modifier dans le fichier"
       <fieldPermissions>
           <editable>true</editable>
           <field>Panel_Batch__c.Serial_Prefix__c</field>
           <readable>true</readable>
       </fieldPermissions>
       <fieldPermissions>
           <editable>true</editable>
           <field>Panel_Batch__c.Supplier__c</field>
           <readable>true</readable>
       </fieldPermissions>
       <hasActivationRequired>false</hasActivationRequired>
   ```

5. Cherchez `<<<<<<<` une dernière fois dans les deux fichiers
6. Committez depuis le panneau **Source Control**, comme le [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md) l'a appris : mettez les deux
   fichiers en attente avec leur **+**, et écrivez un message qui dit ce que vous avez gardé, parce
   que la personne qui relit cette Pull Request lit la résolution dans le commit, pas dans le diff :

   ```text title="À taper"
   fix: solve cherry-pick conflicts of promotion/uat/preprod/2026-09-24-0930

   Panel Batch layout (#63): preprod had no Warranty Years row; the story added Supplier under it; kept Supplier after Cost, left Warranty Years out
   Helios_Delivery_Manager (#63): preprod had no Warranty Years grant; the story added the Supplier grant next to it; kept Supplier, left Warranty Years out
   ```

7. **Commit**, puis **Sync Changes** pour pousser

#### À faire : vérifier l'exécution verte, quelle que soit la voie prise

1. Le push relance le contrôle. Attendez qu'il passe au vert
2. Ouvrez la section repliée **ℹ️ Where the deployment actions and test classes come from** en bas
   du commentaire sfdx-hardis. Sa première ligne est celle d'une promotion ordinaire,

   > ℹ️ `promotion/uat/preprod/2026-09-24-0930` is a promotion branch carrying 3 Pull Request(s)
   > declared in its description.

   suivie de ce que le job a rassemblé depuis elles
3. Ouvrez la section repliée **🎫** à côté. Elle liste les trois Pull Requests, celles de US-057,
   US-059 et US-061. Sur le fork du cours ce sont les Pull Requests 62, 63 et 65 ; les vôtres portent
   d'autres numéros

!!! warning "Attention"
    Si cette ligne manque, ou si elle dit qu'aucune des Pull Requests déclarées n'a pu être utilisée,
    arrêtez-vous et corrigez avant de merger. Cela veut dire que le job n'a pas lu la déclaration, et
    que le déploiement sur le point de partir, ce sont les métadonnées sans rien de ce qui va avec.

<details markdown="1"><summary>Sous le capot : ce que font les liens, ce que le job cherche, et ce que le prompt demande à un agent</summary>

Les quatre liens viennent de VS Code, pas de sfdx-hardis. Ils sont dessinés sur tout fichier qui
contient les trois marqueurs, que git pense ou non qu'un merge est en cours, et c'est pour cela
qu'ils marchent sur un conflit que quelqu'un a committé exprès. **Accept Current Change** garde le
côté `<<<<<<< HEAD`, **Accept Incoming Change** le côté `>>>>>>>`, **Accept Both Changes** les deux,
l'un après l'autre, et chacun d'eux retire les marqueurs. Aucun ne sait que le côté entrant contient
deux entrées et qu'une seule a sa place, et c'est la partie que vous avez faite.

Le job de contrôle lance `git grep` sur les marqueurs d'ouverture et de fermeture (`<<<<<<<` et
`>>>>>>>`, puisqu'une ligne de `=======` est légitime en markdown), sur tous les fichiers suivis de
la branch, et arrête le déploiement avec le commentaire que vous avez lu à l'étape 5. Il lit les
fichiers tels qu'ils sont extraits, jamais l'historique git, donc il fonctionne sur le clone
superficiel qu'un job de CI fait. Les deux fichiers du [Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md) contiennent des marqueurs comme matériel
pédagogique, donc ce projet les liste dans `promotionConflictMarkersIgnoredFiles` de
`config/.sfdx-hardis.yml` et le job les laisse tranquilles.

Le prompt demande à l'agent quatre choses qu'un relecteur peut vérifier : ne toucher que les
fichiers avec marqueurs, garder un XML bien formé avec une entrée par nom d'API, prouver qu'il ne
reste aucun marqueur avec le même `git grep`, et committer avec une ligne par fichier disant ce que
le côté cible avait, ce que la story a ajouté et ce qui a été gardé. « Solved conflicts » n'est pas
une ligne qu'il a le droit d'écrire. Le message de commit ci-dessus a cette forme, écrit à la main.

</details>

#### Vous devriez voir

- Le contrôle vert, avec la ligne de la promotion branch et les trois Pull Requests listées

### 7. Ajouter la raison, merger, et vérifier la sélectivité dans l'org

Objectif : la raison sur la Pull Request, la promotion mergée, et seulement les trois stories
choisies dans `helios-preprod`.

#### À faire

1. **Éditez la description** et mettez votre raison au-dessus du texte généré, dans une phrase
   utilisable par la personne qui lira ça dans six mois :

   > Warehouse cutover on Monday needs the Awaiting Parts status in production. US-058 stays in UAT
   > until the wording is approved, expected Wednesday next week, and US-060 until the crews have
   > been briefed.

2. Mergez avec un merge commit : **Create a merge commit**, sous la flèche du bouton vert
3. Attendez que l'exécution **Process Deployment (sfdx-hardis)** sur `preprod` passe au vert
4. Ouvrez `helios-preprod` et vérifiez les deux moitiés de ce que vous avez fait, avec le tableau
   ci-dessous

| Où, dans Setup                                                                   | Présent                                                                                    | Absent                                                                             |
|----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| **Object Manager** > **Installation** > **Fields & Relationships**               | **Status** propose **Awaiting Parts**, et il y a un champ **Gate Code** : US-057 et US-061 | Pas de champ **Scaffolding Required** : US-060 n'y est pas                         |
| **Object Manager** > **Panel Batch** > **Fields & Relationships**                | Un champ **Supplier** : US-059                                                             | Pas de champ **Warranty Years** : US-058 n'y est pas, et c'est tout l'objet du lab |
| **Object Manager** > **Panel Batch** > **Page Layouts** > **Panel Batch Layout** | Supplier juste après Cost, là où vous l'avez mis                                           | -                                                                                  |

!!! warning "Attention"
    Jamais de squash. Les commits cherry-pickés et leurs lignes de traçabilité sont ce que la
    prochaine promotion, le retrofit et les notes de version lisent tous. La ligne **How to merge**
    du commentaire vert du contrôle le dit aussi.

#### Pourquoi deux vérifications

Déployé et *seulement* ce que vous avez choisi est déployé sont deux vérifications différentes, et
ce lab est celui où la seconde compte.

#### Vous devriez voir

- Un déploiement vert sur `preprod`, et le tableau ci-dessus vrai dans `helios-preprod`

### 8. Compter ce que cela a coûté

Objectif : vous savez dire à voix haute ce qui est vrai maintenant. Cette étape n'a aucun clic.

Regardez la pipeline maintenant :

- `uat` contient cinq stories. `preprod` en contient trois
- `helios-uat` et `helios-preprod` ne sont plus la même org, et elles resteront différentes jusqu'à
  la prochaine promotion complète
- La production est sur le point de faire tourner une combinaison de métadonnées qui n'a jamais été
  testée dans son ensemble nulle part : ce que `preprod` contient aujourd'hui n'existait dans aucune
  org ce matin
- Les deux fichiers que vous avez résolus à l'étape 6 disent maintenant des choses différentes sur
  `preprod` et sur `uat`, et git le remarquera de nouveau

#### Pourquoi

Rien de tout cela n'est un bug. C'est le prix, et vous l'avez payé délibérément pour une date fixe.
Le mode de défaillance n'est pas de le payer une fois : c'est de le payer toutes les semaines, sans
bruit, jusqu'à ce que plus personne ne sache ce que contient chacune des quatre orgs.

Trois habitudes gardent cela honnête :

1. La Pull Request de promotion dit pourquoi. Vous l'avez fait à l'étape 7
2. La promotion est retrofitée tout de suite. L'étape 9, et elle n'est pas facultative cette
   semaine
3. L'exception se termine. La prochaine promotion ordinaire de `uat` fait remonter US-058 et
   US-060, et la pipeline est alignée de nouveau. Le [Lab 3.11](3-11-capstone-run-a-weekly-release-cycle.md) est cette promotion : les deux
   stories attendent encore dans `uat` lundi matin, et elles partent avec tout le reste

#### Vous devriez voir

- Les quatre faits ci-dessus, et les trois habitudes, dans vos propres mots

### 9. Retrofiter la promotion dans integration, tout de suite

Objectif : `preprod` redescendue dans `integration`, tant que le conflit est petit et que vous vous
souvenez encore de ce que vous avez décidé.
Rappel : [Lab 3.7](3-7-hotfix-and-retrofit.md), [Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md)

Le dernier point de l'étape 8 est la raison de cette étape. Sur `uat`, la présentation de page dit
« Cost, Warranty Years, Supplier ». Sur `preprod`, depuis votre correction, elle dit « Cost,
Supplier ». Quand le [Lab 3.11](3-11-capstone-run-a-weekly-release-cycle.md) promeut `uat` vers `preprod` en entier, git retrouve ces deux
lignes et signale les deux mêmes fichiers en conflit, sur une Pull Request entre deux branches
majeures sur lesquelles personne n'a le droit de pousser. La sortie est celle que la documentation
des promotion branches prescrit après chaque promotion, et celle que le
[Lab 3.7](3-7-hotfix-and-retrofit.md) a apprise après le hotfix.

#### À faire

1. **New User Story**, comme au [Lab 3.7](3-7-hotfix-and-retrofit.md) étape 7 : type **Retrofit**, nom `US-059-retrofit`, cible
   `integration`, org `helios-dev` (**Scratch org**, puis **Reuse scratch org helios-dev**)
2. **Git: Fetch** puis **Git: Merge...** depuis la Command Palette, comme au [Lab 3.7](3-7-hotfix-and-retrofit.md) étape 8, et
   choisissez **origin/preprod** cette fois, sous **remote branches**
3. Le merge s'arrête sur les deux mêmes fichiers, qui apparaissent sous **Merge Changes** dans le
   panneau **Source Control**. Ouvrez chacun avec **Resolve in Merge Editor**, l'éditeur du
   [Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md), et lisez les deux volets : **Current**, c'est `integration`, avec l'entrée Warranty
   Years, **Incoming**, c'est `preprod`, sans rien à cet endroit
4. Cliquez sur **Accept Current** sur le bloc, dans les deux fichiers, puis **Complete Merge**.
   Cette fois la réponse est l'inverse de l'étape 6
5. Les deux fichiers atterrissent sous **Staged Changes** avec le message
   `Merge remote-tracking branch 'origin/preprod' into retrofit/US-059-retrofit` déjà écrit, et le
   bouton bleu en dessous affiche **Continue** tant qu'un merge est en cours, comme au
   [Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md). Cliquez dessus
6. **Save / Publish User Story** comme au [Lab 3.7](3-7-hotfix-and-retrofit.md) étape 9, et ouvrez la Pull Request vers
   `integration`, intitulée `Retrofit: the promotion of US-057, US-059 and US-061 back down into integration`
7. Attendez son contrôle, et mergez-la avec un merge commit (**Create a merge commit**), comme le
   demande la ligne **How to merge** de son commentaire

#### Pourquoi Accept Current

`integration` est là où vit US-058 et d'où elle sera validée, donc ses lignes restent. Rien d'autre
n'entre en conflit, parce que les trois stories promues sont le même contenu des deux côtés.

<details markdown="1"><summary>Sous le capot : une Pull Request qui ne change aucun fichier, et pourquoi elle compte quand même</summary>

    git checkout -b retrofit/US-059-retrofit origin/integration
    git fetch origin
    git merge origin/preprod
    # garder le côté integration des deux fichiers, puis committer
    git push -u origin retrofit/US-059-retrofit

Le retrofit n'apporte rien de nouveau en contenu : chaque ligne que `preprod` contient,
`integration` l'avait déjà, et les deux lignes qui lui manquent sont celles que vous avez choisi de
laisser dehors. Ce que le commit de merge enregistre, c'est que `preprod`, telle qu'elle est après
la promotion, a été regardée et réconciliée. À partir de là, git a pour les deux branches un point
commun plus récent que la promotion, et le prochain merge entre elles part de ce point plutôt que de
la semaine d'avant, quand aucune des deux branches n'avait aucune des cinq stories.

Sans lui, la promotion de `uat` vers `preprod` au [Lab 3.11](3-11-capstone-run-a-weekly-release-cycle.md) entre en conflit sur la présentation
de page et le permission set : `preprod` dit « ajoute Supplier après Cost », `uat` dit « ajoute
Warranty Years puis Supplier après Cost », et git ne sait pas que l'un des deux était une décision.
Avec lui, cette promotion merge proprement et fait remonter US-058 et US-060 de manière ordinaire.

La règle du pouce est celle du [Lab 3.7](3-7-hotfix-and-retrofit.md) : le travail monte, et la seule chose qui descend est un
retrofit, fait le jour même de ce qu'il retrofite.

</details>

<details markdown="1"><summary>Sous le capot : ce qui arrive à US-058 et US-060 ensuite, et à quoi ressemble une promotion vue d'en haut</summary>

Rien de spécial. US-058 et US-060 sont des User Stories mergées dans `uat` qui n'ont pas été
promues, exactement comme n'importe quelle autre story la veille d'une livraison, et la prochaine
Pull Request de `uat` vers `preprod` les transporte de manière ordinaire.

Ce sur quoi sfdx-hardis doit faire attention, ce sont les trois autres, qui sont dans les deux
branches par des chemins différents : mergées dans `uat`, cherry-pickées dans `preprod`. La
prochaine promotion de `uat` fera aussi remonter les commits d'origine, et git mergera proprement
parce que le contenu y est déjà, et parce que le retrofit de l'étape 9 lui a dit où les deux
branches étaient d'accord pour la dernière fois. Le diagramme de la pipeline et les notes de version
savent tous les deux qu'elles ont déjà été promues (`promotedAway`), chacune est donc listée une
seule fois, sur la branche qu'elle a réellement atteinte, et les notes de la livraison suivante ne
les annoncent pas deux fois.

La même expansion fonctionne un niveau plus haut : quand `preprod` est promue vers `main`, le commit
de merge qui arrive transporte la promotion, pas les stories en dessous. sfdx-hardis lit la
déclaration de la promotion et remet les trois stories dans le périmètre par leur nom, pour que
leurs deployment actions s'exécutent en production aussi.

</details>

#### Vous devriez voir

- Une Pull Request de retrofit mergée dans `integration`. Son onglet **Files changed** est vide, et
  c'est normal : le bloc ci-dessus dit pourquoi

## Ce que vous devez voir

- [ ] Une Pull Request mergée intitulée `Promotion uat to preprod (<date>-<heure>)`, depuis une branche
      nommée `promotion/uat/preprod/<date>-<heure>`, avec un contrôle rouge passé au vert par un commit
- [ ] Un bloc `promotionPullRequests` dans sa description qui nomme US-057, US-059 et US-061 et rien
      d'autre, avec votre raison écrite au-dessus
- [ ] Une exécution **Process Deployment (sfdx-hardis)** verte sur `preprod`
- [ ] **Awaiting Parts** dans la liste de sélection Status, un champ Gate Code sur Installation et
      un champ Supplier sur Panel Batch dans `helios-preprod`, et ni Warranty Years ni
      Scaffolding Required là-bas
- [ ] Aucun `<<<<<<<` restant dans les deux fichiers sur `preprod`
- [ ] Une Pull Request de retrofit mergée dans `integration` sans aucun fichier modifié
- [ ] Le nœud `uat` du diagramme qui compte quatre Pull Requests encore en attente : US-058, US-060,
      le retrofit du [Lab 3.7](3-7-hotfix-and-retrofit.md) et la configuration du [Lab 3.8](3-8-monitor-your-production-org.md)

## En cas de problème

**Simulate my teammates refuse US-059 et nomme US-058.**
US-059 a été écrite par-dessus US-058, et votre `integration` ne la contient pas encore. Mergez
d'abord la Pull Request d'US-058, puis reprenez US-059. L'étape 2 donne l'ordre exactement pour
cette raison.

**La fenêtre d'uat n'a ni cases à cocher ni bouton Create promotion.**
Soit la fonctionnalité est inactive dans la configuration que lit votre workspace, soit
`allowedPromotionSteps` ne nomme pas `uat` comme source avec `preprod` comme cible. L'étape 1 montre
les deux. Une étape qui pointe vers une branche dans laquelle la pipeline ne merge pas n'ouvre rien,
et c'est volontaire.

**La commande s'arrête en disant que les étapes autorisées manquent.**
`allowedPromotionSteps` est obligatoire dès que `enablePromotionBranches` est actif. Ce n'est pas une
valeur par défaut que sfdx-hardis accepte d'inventer : entre quelles branches un release manager peut
promouvoir est une décision sur votre pipeline.

**Le cherry-pick d'US-059 n'est pas entré en conflit, ou sur un seul fichier.**
Quelque chose l'a résolu pour vous, en général le SF Merge Driver : son élément en bas à droite de
VS Code affiche un rond vert, et un clic l'éteint. Ouvrez l'onglet **Files changed** de la Pull Request et cherchez `Warranty_Years__c`
dans la présentation de page et le permission set. S'il a voyagé, le déploiement échoue sur un champ
que `preprod` n'a pas : retirez-le sur la promotion branch comme l'étape 6 le fait, et poussez. S'il
n'a pas voyagé, la promotion est juste telle quelle, et le retrofit de l'étape 9 peut quand même
s'arrêter sur les deux fichiers.

**Il n'y a pas de liens Accept au-dessus du bloc de conflit.**
Le fichier est ouvert en aperçu ou le bloc est hors de vue. Cliquez dans le fichier, allez à la
ligne `<<<<<<< HEAD` : les liens sont juste au-dessus. Ils viennent de l'extension intégrée **Merge
Conflict** de VS Code, qui est active sauf si quelqu'un l'a désactivée.

**Le contrôle est toujours rouge après votre push.**
Cherchez `<<<<<<<`, `=======` et `>>>>>>>` dans les deux fichiers, et lisez le commentaire
sfdx-hardis : il nomme le fichier qui en contient encore un. S'il nomme les deux fichiers du
[Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md) à la place, le job a fait tourner un sfdx-hardis plus ancien que celui qui lit
`promotionConflictMarkersIgnoredFiles` : ces fichiers contiennent des marqueurs comme matériel
pédagogique, et une version à jour les laisse tranquilles.

**Le commentaire sfdx-hardis ne parle pas de promotion branch.**
Le job de déploiement a lu une configuration avec la fonctionnalité inactive. Vérifiez que `preprod`
porte bien `enablePromotionBranches: true` dans `config/.sfdx-hardis.yml` : la branche que le job lit
est la promotion branch, qui a été coupée depuis `preprod`.

**La commande s'arrête en disant qu'elle a besoin de la connexion au git provider.**
La promotion est assemblée à partir des Pull Requests de `uat`, et seul le git provider les nomme
de façon fiable, donc la commande refuse de deviner sans lui. Dans VS Code, cette connexion est la
session GitHub du [Lab 1.2](../level-1-contributor-basics/1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md), et l'extension la transmet toute seule : reconnectez-vous si
elle a été révoquée. Un agent ou un job reçoit `GITHUB_TOKEN`, dans l'environnement ou dans un
fichier `.env` à la racine du repository, gardé hors de git.

**Le déploiement est beaucoup plus gros que trois stories.**
Regardez depuis quoi la branche a été coupée. Une promotion branch construite alors que `preprod`
était en retard emporte l'écart avec elle. C'est une raison de promouvoir normalement plus souvent,
pas une raison de construire une plus grosse promotion.

**Le merge du retrofit entre en conflit sur plus que les deux fichiers.**
Quelqu'un a changé autre chose sur `integration` depuis la promotion, et la réponse est celle du
[Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md) : garder les deux intentions, fichier par fichier. Sur les deux fichiers de ce lab,
**Accept Current** est toute la réponse.

**Check my work dit qu'integration et preprod ne sont toujours pas d'accord.**
Le retrofit de l'étape 9 manque, ou il a été mergé en gardant le côté `preprod`. Refaites-le depuis
**New User Story**, et prenez le côté **Current** dans l'éditeur de merge.

## Vérifiez votre travail

Welcome page > **Training: Level 3** > **Check my work**, puis choisissez **Lab 3.10**.

Il cherche les trois stories promues sur `preprod`, une promotion branch dans son historique, aucun
marqueur de conflit restant dans ses métadonnées, et une `integration` capable de reprendre
`preprod` sans conflit. Quelle que soit la façon dont vous avez résolu le conflit, à la main, avec
un agent, ou dans un autre éditeur, ça passe.

## Pour aller plus loin

- [Promotion branches (Beta)](https://sfdx-hardis.cloudity.com/salesforce-devops-promotion-branches/)
- [hardis:project:promotion:create](https://sfdx-hardis.cloudity.com/hardis/project/promotion/create/)
- [Retrofit](https://sfdx-hardis.cloudity.com/salesforce-devops-retrofit/), l'étape qui suit chaque
  promotion branch
- [Hotfixes](https://sfdx-hardis.cloudity.com/salesforce-devops-hotfixes/), qui est le bon outil pour
  un correctif urgent qui n'est jamais passé par `uat`

[Suite : Lab 3.11 - Épreuve finale : mener un cycle de release hebdomadaire](3-11-capstone-run-a-weekly-release-cycle.md){ .md-button .md-button--primary }
