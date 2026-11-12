---
id: lab-3-5
title: "Lab 3.5 - Promouvoir en UAT et écrire les notes de version"
description: "Protégez ce que l'UAT garde pour elle avec package-no-overwrite, promouvez integration vers UAT, lisez ses deployment actions et écrivez les notes de version."
level: 3
lab: 5
lang: fr
source_rev: "442e46f4924bd6d3cc4609ac6e8d5f0b6c7f72d3"
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

# Lab 3.5 - Promouvoir en UAT et écrire les notes de version

**Niveau** : 3 Release Manager

**Durée** : ~50 min<!-- observed --> (observé : médiane 52 min, 15 participants, le plus rapide 19 min)<!-- /observed -->

**Vous allez** : protéger un réglage que l'UAT garde pour elle, faire votre première promotion entre
deux branches majeures, lire les deployment actions qu'elle transporte, et produire le document que
le métier lit vraiment.

## La situation

Tout ce que l'équipe a construit cette semaine est dans `integration`. Les testeurs métier
travaillent en UAT. Lundi matin, ils s'attendent à y trouver le travail de la semaine, avec une note
disant ce qui a changé.

Une promotion entre branches majeures n'est pas une Pull Request de contributeur. Elle transporte
plusieurs stories à la fois, elle peut transporter des deployment actions déclarées des semaines plus
tôt par des personnes différentes, et l'org dans laquelle elle déploie contient de vrais testeurs.

## Avant de commencer

- [ ] [Lab 3.4](3-4-merge-colliding-pull-requests.md) terminé : US-018 et US-019 mergées dans `integration`
- [ ] `helios-uat` connectée : la scratch org créée au Niveau 1, configurée comme org de `uat` depuis
- [ ] `SFDX_AUTH_URL_UAT` toujours dans votre fork : `uat` continue de se connecter avec, comme l'explique le [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md)

## Les étapes

### 1. Voir ce que vous êtes sur le point de livrer

Objectif : vous avez lu la liste de ce que transporte `integration`, qui est la livraison, avant de
créer quoi que ce soit.

#### À faire

1. Ouvrez le panneau **DevOps Pipeline** et cliquez sur le nœud `integration` du diagramme. Une
   fenêtre s'ouvre sur cette branche, intitulée **Pull Requests in integration**

   ![La fenêtre de branche d'integration, listant ce qu'elle transporte](../../_assets/annotated/vscode/pipeline-branch-modal-level3--what-it-carries.png)

2. Lisez **Pull Requests** **(1)**, la liste qui compte : chaque Pull Request mergée dans
   `integration` depuis la dernière promotion vers `uat`, avec qui l'a mergée et quand. Lisez-la
   avant de créer quoi que ce soit : si une story qui s'y trouve ne doit pas sortir cette semaine,
   c'est le moment, pas après le déploiement
3. Regardez **Deployment Actions** **(2)**, la liste des actions que ces Pull Requests
   transportaient, rassemblées au même endroit. L'étape 4 y revient

!!! warning "Vide, avec un sélecteur Go Live à la place ?"
    La fenêtre montre ce qui attend d'être promu vers l'étage suivant. Une branche qui n'a pas
    d'étage suivant, c'est-à-dire dont `mergeTargets` est vide, n'a rien à promouvoir : le panneau
    montre donc un sélecteur **Go Live** **(1)** et les notes de version d'un go-live déjà mergé
    dedans, à la place :

    ![La même fenêtre sur une branche sans cible de merge](../../_assets/annotated/vscode/pipeline-branch-modal-uat--no-merge-target.png)

    Sur `main`, c'est la vue normale et elle le restera toujours : la production est la fin du
    pipeline.

    Sur `integration`, cela veut dire que le fichier de branche a perdu sa cible de merge, qu'il
    avait depuis le Lab 1.2. Cliquez sur **Training: Level 3 > Set up my training environment**, qui
    la réécrit. Il rafraîchit l'org et l'URL de connexion d'un fichier qui existe déjà et laisse le
    reste tranquille, ce que vous avez posé au Lab 3.1 survit donc.

#### Pourquoi

Cette liste est la livraison. **Tickets** à côté est la même chose pour les stories, chacune avec son
titre, lu depuis le backlog que le projet déclare comme son système de ticketing. Un quatrième
onglet, **Apex Tests**, n'apparaît que sur un projet qui active `enableDeploymentApexTestClasses`, et
celui-ci ne le fait pas.

#### Vous devriez voir

- Les stories qui attendent dans `integration`, sous **Pull Requests**, et leurs actions sous
  **Deployment Actions**
- Dans le pied de page, les deux boutons qu'utilise l'étape 7 : **(3)** génère les notes de ce qui a
  déjà été promu, **(4)** prévisualise les notes de ce qui ne l'a pas été

### 2. Protéger ce que l'UAT garde pour elle

Objectif : `Helios_Warehouse` dans `helios-uat` pointant vers l'entrepôt de test, et listé dans
`manifest/package-no-overwrite.xml` pour qu'aucune promotion ne remette l'adresse de production.
Rappel : [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md), [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md)

Un composant de l'application Helios est censé être différent dans chaque org : le remote site
setting `Helios_Warehouse`, l'adresse du système de stock de l'entrepôt avec lequel les lots de
panneaux sont réservés. La production parle au vrai entrepôt, l'UAT au système de test de
l'entrepôt. Un admin a posé cette adresse en UAT à la main, et le repository porte celle de
production.

#### À faire : le voir vous-même

1. Dans `helios-uat`, ouvrez **Setup > Remote Site Settings**, ouvrez `Helios_Warehouse`, et cliquez
   sur **Edit**
2. Mettez **Remote Site URL** à `https://warehouse-test.helios.invalid`, comme l'a fait l'admin UAT,
   et cliquez sur **Save**

#### Pourquoi

Passons à la promotion. Elle envoie le package entier, remote site setting compris, et remettrait
l'adresse de production en UAT sans un mot. Le gestionnaire d'écrasement est fait exactement pour
cela : tout ce qui est listé dans `manifest/package-no-overwrite.xml` est retiré du déploiement quand
l'org cible le possède déjà, et créé quand elle ne l'a pas.

Helios a déjà ce fichier : c'est la liste avec laquelle démarre tout projet sfdx-hardis. Elle protège
les composants qu'une org garde pour elle presque partout, rapports et tableaux de bord maintenus en
production, connected apps, named credentials, certificats. Les remote site settings n'y sont pas
encore, et vous n'avez pas à écrire de XML pour les ajouter.

#### À faire : l'ajouter à la liste

1. Dans le panneau **DevOps Pipeline**, ouvrez le menu **Deployment packages**, celui qui ouvrait
   **Package XML** au [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md), et choisissez **No Overwrite**. Le visualiseur de package s'ouvre
   sur cette liste
2. Activez le **Edit mode** **(1)**, puis cliquez sur **Add Type** **(2)**

   ![Le visualiseur de package sur la liste no-overwrite par défaut, en mode édition](../../_assets/annotated/vscode/package-no-overwrite-edit--add-type.png)

3. Tapez `RemoteSiteSetting`, le nom que Salesforce donne à ce type de composant, dans **Metadata
   Type API Name** **(1)**, et cliquez sur **Add** **(2)**

   ![La fenêtre Add Metadata Type du visualiseur de package](../../_assets/annotated/vscode/package-no-overwrite-add-type--type.png)

4. Sur la nouvelle ligne **RemoteSiteSetting**, cliquez sur **Add member**, tapez
   `Helios_Warehouse`, et cliquez sur **Add**. Si vous voulez voir le fichier, **Edit File** l'ouvre
   en texte
5. Cliquez sur **Training: Level 3** > **Publish my pipeline configuration**, et mergez sa Pull
   Request une fois verte, comme au [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md)

#### Pourquoi cette liste

Le visualiseur a ajouté un bloc `RemoteSiteSetting` à `manifest/package-no-overwrite.xml` pour vous.
Le fichier a la forme de `manifest/package.xml` : un bloc par type de composant, ses membres listés
par nom, ou `*` pour tous. La liste de ce qui ne doit jamais être écrasé est de la configuration de
pipeline, comme le reste : elle se publie donc de la même façon.

Créé là où il manque, jamais écrasé là où il est. Une org neuve, une sandbox fraîche par exemple,
n'a pas encore de `Helios_Warehouse`, et le déploiement le crée depuis le repository. À partir de là
il appartient à cette org. Le gestionnaire d'écrasement ne compare pas les versions : présent veut
dire protégé.

#### Vous devriez voir

- `Helios_Warehouse` dans `helios-uat` pointant vers `https://warehouse-test.helios.invalid`
- Une ligne **RemoteSiteSetting** contenant `Helios_Warehouse` dans la liste **No Overwrite**, et la
  Pull Request de configuration mergée dans `integration`

### 3. Créer la Pull Request de promotion

Objectif : une Pull Request de promotion d'`integration` vers `uat`, intitulée pour les humains qui
la liront.
Rappel : [Lab 1.6](../level-1-contributor-basics/1-6-pull-request-deployment-check-and-merge.md)

Rien n'est encore ouvert entre `integration` et `uat` : la Pull Request de promotion, c'est à vous
de la créer, maintenant. Le nombre dans la bulle au coin de la boîte `integration` n'est pas une
Pull Request : il compte les User Stories qui y attendent, la liste lue à l'étape 1.

#### À faire

1. Dans le diagramme **DevOps Pipeline**, cliquez sur la pastille **+ PR** **(1)** de la flèche
   d'`integration` vers `uat`. GitHub s'ouvre sur une nouvelle Pull Request d'`integration` vers
   `uat`, les deux branches déjà renseignées. Ne cliquez pas encore sur **Create pull request** : le
   titre vient d'abord

   ![La pastille + PR sur la flèche d'integration vers uat](../../_assets/annotated/vscode/devops-pipeline-level3--create-promotion.png)

2. De retour sur la page GitHub, remplacez ce que propose **Add a title**. Intitulez la Pull Request
   pour les humains qui la liront, pas pour git, et appelez-la une promotion :

   > Promotion 2026-09: crew capacity cap, quote PDF

3. Cliquez maintenant sur **Create pull request**
4. Quand vous la mergez, après l'étape 4, mergez-la avec un merge commit, jamais avec un squash :
   cliquez sur la flèche à côté du bouton vert, choisissez **Create a merge commit**, puis cliquez
   sur **Merge pull request**

!!! warning "Attention"
    GitHub retient la méthode utilisée en dernier, donc après toutes les Pull Requests de
    fonctionnalité mergées en squash, le bouton peut afficher **Squash and merge** tant que vous ne
    le changez pas.

#### Pourquoi

La pastille est là parce qu'aucune Pull Request n'est ouverte sur cette flèche. Dès que vous en créez
une, la pastille est remplacée par le numéro de la Pull Request et son statut.

Release est le mot réservé à la Pull Request vers `main`, la production, et à rien d'autre. Le
métier lit "release" comme "c'est en ligne", et une Pull Request vers `uat` ne met rien en ligne.
Gardez les deux mots distincts et une liste de Pull Requests se lit comme l'histoire de ce qui a
atteint la production.

Une promotion transporte chaque commit des stories qu'elle promeut, et la promotion suivante, le
retrofit et les notes de version ont tous besoin de les retrouver un par un ([Lab 1.6](../level-1-contributor-basics/1-6-pull-request-deployment-check-and-merge.md)). Le
commentaire vert du contrôle dit la même chose sur sa ligne **How to merge** : **use a merge commit,
never squash**.

#### Pourquoi pas le bouton de promotion de la fenêtre de branche

Une fenêtre de branche peut aussi afficher un bouton **Create promotion from <branche> (Beta)**
et une case à cocher sur chaque ligne. Ce projet active cette fonctionnalité
([Lab 3.1](3-1-configure-the-pipeline-up-to-production.md)), mais `allowedPromotionSteps` n'autorise qu'une seule étape, `uat` vers
`preprod` : la fenêtre d'`integration` n'a donc ni l'un ni l'autre. Vous les rencontrerez tous
les deux sur la fenêtre d'`uat` à l'étape 7.

Cette fonctionnalité transporte un sous-ensemble de ce qui attend, et elle existe pour la
semaine où le métier valide une story et pas celle d'à côté. Ce que vous faites ici, c'est tout
promouvoir, ce que transporte une simple Pull Request d'une branche vers la suivante, et ce que
vous devriez faire presque toutes les semaines. Le [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) est l'exception.

Une story de la liste ne doit pas partir ? Une promotion ordinaire transporte toute la branche : on
ne peut pas en retirer une Pull Request. Laisser une story de côté, c'est le rôle de ce bouton de
promotion : il crée une promotion avec les stories que vous cochez, et en créer une nouvelle remplace
celle qui est déjà ouverte. Le [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) le déroule.

#### Vous devriez voir

- La Pull Request de promotion ouverte d'`integration` vers `uat`, sous votre titre
- Sur le diagramme, le numéro de la Pull Request et son statut à la place de la pastille **+ PR**

### 4. Lire les deployment actions qu'elle transporte

Objectif : chaque deployment action que porte la promotion lue avant le merge, et le contrôle vert
une fois l'étape de délivrabilité de US-026 faite dans `helios-uat`.

#### À faire

1. Une fois le contrôle lancé, ouvrez le commentaire sfdx-hardis. Il compte les actions dans la
   ligne **Deployment actions** de son tableau, et liste chacune dans la section repliée **🛠️
   Deployment actions of this job**
2. Lisez sa portée **(1)**, ce qu'une promotion ajoute par-dessus : la section repliée **ℹ️ Where
   the deployment actions and test classes come from** dit qu'elles sont rassemblées depuis le
   contenu de cette Pull Request, et la section repliée **🎫 ... tickets · ... Pull Requests** liste
   chaque Pull Request qu'elle transporte, chacune un lien

   ![Les deployment actions rassemblées sur la Pull Request de promotion](../../_assets/annotated/web/github-pr-promotion-actions.png)

3. Lisez-le avant de merger, avec les deux choses du tableau ci-dessous à chercher
4. Faites le clic de l'étape de délivrabilité de US-026 dans `helios-uat`
5. Cochez sa case (ou **Mark as done in uat** dans l'onglet **Deployment Actions** de VS Code)
6. Cliquez sur **Re-run all jobs** sur le contrôle

| Ce que vous voyez    | Ce que cela veut dire pour vous                                                                         |
|----------------------|---------------------------------------------------------------------------------------------------------|
| Une étape manuelle   | Quelqu'un doit cliquer quelque chose en UAT. Ce quelqu'un, c'est vous, et cela n'arrivera pas sans plan |
| Un import de données | Des enregistrements vont être écrits en UAT. Les testeurs peuvent y avoir les leurs                     |

#### Pourquoi

Chaque action que n'importe quel contributeur a déclarée sur n'importe laquelle des stories mergées
est rassemblée dans ce seul tableau, avec son libellé, son moment, son résultat avec la raison en
clair, et un lien de retour vers la Pull Request d'où elle vient. Tout ce qui demande un humain
reçoit sa propre liste de cases, au-dessus des sections repliées, intitulée **👋 To do by hand in
`uat` before the deployment** ou **after the deployment**. Les deux listes atterrissent sur des jobs
différents : le job de contrôle porte celle d'avant **(2)**, pour que vous puissiez agir pendant que
vous décidez, et le job de merge porte celle d'après. Les actions post-déploiement **(3)** sont
comptées **🕒 after the merge** sur le contrôle, avec la raison **Runs after the merge only** : un
contrôle ne change rien dans l'org, elles attendent donc le merge.

Vous ne pouvez pas modifier l'action d'un contributeur depuis ici : elle appartient à sa Pull Request
et à toutes les orgs qui suivent celle-ci, une mauvaise action se corrige donc dans une nouvelle Pull
Request et non dans cette promotion.

La liste de cases est l'exception, et ce n'est pas de la décoration. Cochez une case une fois que
vous avez fait la chose dans l'org, et le job sfdx-hardis suivant relit la case et note l'action
comme faite. Laissez-la décochée et la promotion suivante vous la redemandera.

Une étape avant retient aussi le merge : tant que l'étape de délivrabilité de US-026 n'est pas
marquée comme faite dans `uat`, le contrôle de la promotion s'arrête en rouge, juste après ses
actions de pré-déploiement. Une fois la case cochée, la relance enregistre l'étape et passe au vert.

#### Vous devriez voir

- Le contrôle de la promotion vert, avec l'étape de délivrabilité enregistrée comme faite dans `uat`

### 5. Merger et regarder le déploiement

Objectif : un déploiement vert vers `uat`, avec `Helios_Warehouse` laissé hors du package.

#### À faire

1. Mergez la promotion. L'exécution **Process Deployment (sfdx-hardis)** démarre, cette fois sur
   `uat`. Comptez plusieurs minutes
2. Lisez le log à la recherche du gestionnaire d'écrasement, au-dessus du déploiement, parmi les
   lignes qui commencent par `[NoOverwrite]` :

   ```text title="Résultat"
   Type RemoteSiteSetting: 1 item(s) skipped because they already exist in the target org (protected), 0 item(s) to deploy
   ```

3. Ouvrez la section repliée **🛡️ Protected by `manifest/package-no-overwrite.xml` (1)** du
   commentaire de la Pull Request, et son tableau, **Protected components per metadata type**

#### Pourquoi

C'est le premier déploiement vers cette org par la pipeline : il sera donc plus gros que ceux vers
integration, l'UAT est en retard de tout ce que l'équipe a fait.

L'étape de délivrabilité est une étape pre-deploy : sa place est avant le merge, comme le dit
l'étape 4, et le contrôle n'est pas passé au vert avant que vous ne l'ayez cochée. Ce job la saute :
*Skipping Set Email Deliverability to All Email ...: already run in uat*.

`helios-uat` a déjà `Helios_Warehouse`, la promotion l'a donc laissé hors du package, et le
**Final package.xml to deploy** affiché juste après a un élément de moins.

La Pull Request le dit aussi, sans le log : le commentaire du contrôle, et celui qu'écrit ce
déploiement, portent la section repliée des composants protégés. Lisez-la sur le contrôle, avant de
merger : un composant que vous pensiez déployer et qui apparaît là est un composant que la liste
protège par erreur.

#### Vous devriez voir

- Une exécution **Process Deployment (sfdx-hardis)** verte sur `uat`
- **1** dans la colonne **🛡️ Not overwritten** de la ligne **RemoteSiteSetting**

### 6. Vérifier avec des yeux de testeur

Objectif : les deux stories réellement utilisables dans `helios-uat`, pas seulement déployées, et
`Helios_Warehouse` laissé tranquille.
Rappel : [Lab 2.3](../level-2-contributor-advanced/2-3-fix-broken-records-with-an-apex-deployment-action.md)

#### À faire

1. Ouvrez `helios-uat`
2. Sur n'importe quelle installation, mettez `Status` à `Planned`, `Crew Capacity Cap` à 3 et
   `Crew Size` à 6 dans la même modification, et enregistrez
3. Vérifiez que la permission du PDF de devis est sur le permission set des managers
4. Ouvrez **Setup > Remote Site Settings** et regardez `Helios_Warehouse`

#### Pourquoi

Une équipe plus grande que le plafond est ramenée au plafond à l'enregistrement. La règle s'exécute
quand une installation planifiée reçoit son équipe, et UAT n'en a plus aucune au statut planifié
depuis le remplissage de la taille d'équipe du [Lab 2.3](../level-2-contributor-advanced/2-3-fix-broken-records-with-an-apex-deployment-action.md) : vous en créez donc une.

Déployé et utilisable sont deux états différents, et l'écart entre eux est presque toujours une
permission ou une donnée de référence.

#### Vous devriez voir

- La taille d'équipe qui affiche 3, et l'installation passée à `Scheduled`
- La permission du PDF de devis sur le permission set des managers
- `https://warehouse-test.helios.invalid` toujours en place pour `Helios_Warehouse` : la promotion ne
  l'a pas touché

### 7. Générer les notes de version

Objectif : les notes de version de la promotion générées, réécrites pour le métier, et dans la
description de la Pull Request de promotion.

#### À faire : générer les notes

1. Ouvrez le panneau **DevOps Pipeline** et cliquez sur le nœud `uat`, comme vous aviez cliqué sur
   `integration` à l'étape 1
2. Ignorez les cases à cocher et le bouton **Create promotion from uat (Beta)** de cette fenêtre
   jusqu'au [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md)
3. Dans le pied de page de cette fenêtre, le bouton de gauche affiche maintenant **Generate
   Promotion Notes for uat**. Cliquez dessus
4. Il pose une question, **Select the merge commit for this release or promotion**, en listant les
   merges qui ont atterri sur `uat`, du plus récent au plus ancien. Prenez celui du haut, **Merge
   pull request #N from *votre-pseudo*/integration** : la promotion que vous venez de merger

#### Pourquoi

Cette fenêtre a les cases à cocher et le bouton dont parlait l'étape 3, parce qu'`uat` est la source
de la seule étape de promotion que ce projet autorise.

Les notes couvrent ce que ce merge a apporté dans `uat`, et rien d'avant.

Le bouton est nommé d'après ce qu'est la branche. `uat` merge dans `preprod` : ce qui y est arrivé
est donc une promotion. Sur une branche sans cible de merge, `main`, le même bouton affiche
**Generate Release Notes for Latest Release in main**, et une fois que vous choisissez un go-live
dans le sélecteur en haut de la fenêtre, il affiche **Generate Release Notes for** ce go-live.

À côté, **Preview Upcoming Promotion Notes from uat** fait la même chose pour ce qui n'a pas encore
été promu. C'est celui à utiliser un mercredi, quand quelqu'un demande ce que contiendra la livraison
de jeudi.

Vous obtenez un document markdown listant les Pull Requests, leurs auteurs, leurs stories et les
étapes manuelles, généré depuis l'historique des merges plutôt que depuis la mémoire de quelqu'un. Il
atterrit sous `hardis-report/release-notes/`, dans un dossier nommé d'après le tag de version et la
date, ou d'après la branche cible et la date quand il n'y a pas de tag, donc ici `uat-<date>`.
Markdown et PDF à chaque fois, plus un tableur quand il y a de quoi le remplir.

Sur cette promotion, les notes générées s'ouvrent ainsi :

```text title="Résultat"
# Promotion Notes - uat

| Metric           | Value |
|------------------|-------|
| Pull Requests    | 22    |
| Tickets          | 17    |
| Contributors     | 1     |
| Added / Modified | 38    |
```

Il y a plus de Pull Requests que de tickets : la Pull Request de configuration de l'étape 2 et la
promotion elle-même ne portent aucune story, et certaines stories ont pris deux Pull Requests, comme
US-062 et son correctif au [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md). La configuration du [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md) a son propre ticket, US-050,
parce qu'elle est passée par sa propre story. Le vôtre dépend de votre parcours : un peu plus de 20 après les
Niveaux 1 et 2, beaucoup moins après **Reset this level**, qui démarre le Niveau 3 sans leurs Pull
Requests.

Viennent ensuite un tableau des tickets, un des Pull Requests avec leurs auteurs et dates de merge,
les métadonnées modifiées par type, et les deployment actions avec leur statut dans `uat` : l'étape
manuelle de délivrabilité **success**, cochée avant le merge, les imports et la planification
**success**.

#### À faire : écrire la note de version

1. Lisez-les, puis écrivez la note de version à partir d'elles, en un texte court, le vôtre. Ne
   collez pas le document généré
2. Commencez par deux choses que le générateur ne peut pas connaître :
   1. Une phrase en haut disant à quoi sert cette livraison. "Les équipes ne peuvent plus être
      surdimensionnées, et les commerciaux peuvent générer des PDF de devis."
   2. Les étapes manuelles, formulées comme des instructions à une personne nommée, pas comme une
      liste technique
3. En dessous, gardez une ligne par story du tableau des tickets des notes générées, reformulée en ce
   qui change pour le métier, et nommez le fichier généré pour qui veut le reste
4. Ouvrez la Pull Request de promotion que vous avez mergée, **...** en haut à droite de sa
   description, **Edit**, et collez les notes améliorées à la place de la description d'une ligne

   ![Les notes de version améliorées, dans la description de la Pull Request de promotion](../../_assets/annotated/web/github-pr-release-notes.png)

#### Pourquoi votre propre texte

Le document généré est une liste complète, pour qui veut chaque détail, et il reste là où il a été
écrit. Ce que le métier lit est un texte court, le vôtre.

Puis donnez-les aux gens qui les lisent. Une Pull Request mergée reste modifiable, et c'est là
qu'est la livraison : son lien est ce que vous envoyez au métier, et ce vers quoi les notes de
version de la promotion suivante renvoient.

<details markdown="1"><summary>Sous le capot : ce qui a généré les notes, et ce qu'est vraiment une promotion</summary>

La commande était :

    sf hardis:doc:release-notes --mode post --target-branch uat

qui parcourt l'historique git entre deux références, rassemble les commits de merge, fait
correspondre chacun à sa Pull Request via l'API du fournisseur git, et en tire le titre, l'auteur, le
corps et les deployment actions déclarées.

Cet appel d'API est la partie qui peut échouer en silence. La commande a besoin d'un token de
fournisseur git, pris dans l'environnement (`GITHUB_TOKEN` ou `CI_SFDX_HARDIS_GITHUB_TOKEN` sur
GitHub). Sans token, elle ne s'arrête pas : elle avertit, rassemble zéro Pull Request, et vous écrit
un document parfaitement mis en forme et vide. Une note de version vide est plus souvent un token
manquant qu'une livraison vide.

C'est aussi pourquoi une promotion n'est jamais squashée. Les notes retrouvent chaque story
depuis le commit que sa Pull Request a laissé sur `integration`, commit de merge ou commit unique
d'un squash indifféremment : c'est pourquoi une Pull Request de feature peut être squashée. Une
promotion squashée dans `uat` remplacerait tous ces commits par un seul qu'aucune story n'a produit,
et les notes d'`uat` nommeraient la promotion et rien de ce qu'elle transportait.

Une promotion est une Pull Request ordinaire. Il n'y a pas de machinerie de promotion spéciale
dans l'installation par défaut : `integration` dans `uat` est une branche mergée dans une autre
branche, et le job de déploiement sur `uat` se comporte comme celui sur `integration`. Ce qui diffère
est seulement ce que la configuration dit d'`uat` : son org, ses cibles de merge, et si le
déploiement delta s'applique entre branches majeures
(`enableDeltaDeploymentBetweenMajorBranches`, désactivé par défaut, parce qu'une promotion est le
pire moment pour découvrir que l'org cible a dérivé).

Il existe une fonctionnalité en Beta pour les équipes qui doivent promouvoir un **sous-ensemble** de
ce qui attend, plutôt que tout : les [branches de
promotion](https://sfdx-hardis.cloudity.com/salesforce-devops-promotion-branches/). Le
[Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) s'en sert, délibérément tard, parce que cela prend son sens une fois que vous avez
fait quelques livraisons de la façon ordinaire.

<!-- command-links:start -->
Documentation de la commande : [hardis:doc:release-notes](https://sfdx-hardis.cloudity.com/hardis/doc/release-notes/)
<!-- command-links:end -->

</details>

#### Vous devriez voir

- La phrase **(1)** qui dit à quoi sert la promotion, dans les mots du métier
- L'étape manuelle **(2)** qui nomme qui la fait, où, et ce qui casse si personne ne la fait
- Puis un court tableau de ce qu'il faut tester, et un pointeur vers la liste générée complète pour
  qui la veut

## Ce que vous devez voir

- [ ] La branche `uat` portant tout ce qu'`integration` avait
- [ ] Une exécution **Process Deployment (sfdx-hardis)** verte sur `uat`
- [ ] Les deux stories fonctionnelles dans `helios-uat`
- [ ] `Helios_Warehouse` dans `helios-uat` pointant toujours vers l'entrepôt de test
- [ ] Les notes de version dans la description de la Pull Request de promotion

## En cas de problème

**Publish my pipeline configuration s'arrête sur "A file you changed differs on GitHub too".**
Votre `integration` locale est en retard sur celle de GitHub : les Pull Requests que vous y avez
mergées depuis votre dernier **Pull** ne sont pas sur votre disque, et l'une d'elles a modifié un
fichier que vous venez de changer. Les scripts de votre fork datent d'avant le 2026-10-16, quand
**Publish my pipeline configuration** avait besoin d'une copie locale à jour. Cliquez sur **Update
my course**, mergez sa Pull Request, puis relancez **Publish my pipeline configuration** : il
construit maintenant sa branche depuis l'`integration` de GitHub, quel que soit l'état de votre
copie locale. Votre modification est toujours sur votre disque, rien à refaire.

**Publish my pipeline configuration dit que votre modification et une modification mergée sur GitHub touchent les mêmes lignes.**
Quelqu'un a modifié les mêmes lignes de ce fichier sur GitHub depuis votre dernier **Pull**, et git
ne devine pas quelle version l'emporte. Réunissez les deux sur votre disque, depuis le menu **...**
du panneau Source Control :

1. **Stash** > **Stash (Include Untracked)** : vos modifications sont mises de côté
2. **Pull** : votre `integration` rattrape GitHub
3. **Stash** > **Pop Latest Stash** : vos modifications reviennent, et le fichier apparaît en conflit
4. Ouvrez-le, cliquez sur **Accept Both Changes** au-dessus du conflit, enregistrez, et cliquez sur
   **+** sur sa ligne

Relancez ensuite **Publish my pipeline configuration**.

**Le check de la promotion est vert tout de suite, sans étape de délivrabilité à faire.**
Deux causes. Ouvrez d'abord la section repliée **🛠️ Deployment actions of this job** du commentaire
du check. Quand la ligne de **Set Email Deliverability to All Email** indique *skipped: Runs after
the merge only*, votre étape du [Lab 2.4](../level-2-contributor-advanced/2-4-ship-reference-data-and-a-batch-with-deployment-actions.md) a été enregistrée avec **Execution Contexts** sur **Deployment job
only**, et le sfdx-hardis de votre check l'a alors laissée de côté. Rien n'est perdu : faites le
clic dans `helios-uat` maintenant, mergez, et cochez sa case dans le commentaire du job de
déploiement. Le sfdx-hardis actuel arrête le check sur une telle étape, quel que soit son contexte.

Quand l'étape n'est pas listée du tout, les actions du Niveau 2 ne voyagent avec aucune Pull Request de cette promotion. sfdx-hardis
collecte les deployment actions dans les Pull Requests qu'une promotion transporte, et **Reset this
level** met les stories du Niveau 2 dans `integration` en un seul commit qu'aucune Pull Request de
votre fork n'a fait. Sa dernière étape donne à leurs actions une Pull Request de votre fork,
**Deployment actions of the earlier levels**, et la merge une fois ses checks passés. Cherchez-la
dans l'onglet **Pull requests** de votre fork :

- **Ouverte avec des checks verts** : si GitHub la montre encore comme un brouillon (draft), cochez
  la case de **Set Email Deliverability to All Email** dans son commentaire de check, celle
  d'`integration` que vous avez faite au [Lab 2.4](../level-2-contributor-advanced/2-4-ship-reference-data-and-a-batch-with-deployment-actions.md), puis cliquez sur **Ready for review**. Mergez-la
  avec **Merge pull request**. La Pull Request de promotion reçoit le nouveau commit
  d'`integration`, et son check repart, rouge cette fois, comme le dit l'étape 4
- **Absente** : votre reset a tourné sans cette étape, le cas d'un fork dont les scripts datent
  d'avant le 2026-10-08. Votre pipeline n'a rien de faux : continuez, et les étapes 4, 5 et 7
  montrent moins d'actions que ce lab ne le décrit. Avant votre prochain reset, lancez **Update my
  course**

**Le job de déploiement vers uat est rouge sur « Put the delivery managers in the Crew Leads group ».**
Votre fork date d'avant le 2026-10-05, quand le correctif de Mariia au [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md) ne livrait pas encore le
groupe public Crew Leads : `helios-uat` n'en a pas, et sa première action le cherche. Les
métadonnées sont déployées, donc ne redéployez pas. Rattrapez-le comme le [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md) l'a montré : créez
le groupe dans `helios-uat` (**Setup** > **Public Groups** > **New**, nom de groupe
`Helios_Crew_Leads`), puis dans le panneau **DevOps Pipeline** cliquez sur `uat`, onglet
**Deployment Actions**, **Retry** sur l'action en échec, et répondez **Run all the next
actions**. Créez le même groupe dans `helios-preprod` et `helios-prod` avant leurs promotions du
[Lab 3.6](3-6-release-to-production-and-read-dora-metrics.md).

**Le contrôle échoue avec des erreurs d'authentification pour uat.**
`SFDX_AUTH_URL_UAT` manque ou n'est plus à jour, souvent parce que `helios-uat` a expiré et a été
reconstruite. **Training: Level 3 > Set up my training environment** reconstruit ce qui a expiré et
réécrit le secret. Puis **Re-run all jobs** sur le contrôle.

**Le déploiement échoue sur quelque chose qui marchait en integration.**
Les orgs diffèrent. En général il manque en UAT une fonctionnalité, une licence, ou un composant que
quelqu'un y a supprimé à la main. Lisez l'erreur et vérifiez l'org.

**La Pull Request de promotion montre des centaines de fichiers.**
C'est attendu sur une première promotion : l'UAT est en retard de tout l'historique. Cela se calme
après celle-là.

**Les notes de version sont vides.**
Trois causes, par ordre de probabilité : le mauvais commit de merge a été choisi, vérifiez donc que
le haut de la liste était bien la promotion ; pas de token de fournisseur git dans l'environnement,
la recherche de Pull Requests n'a donc rien renvoyé et s'est contentée d'avertir ; ou les merges ont
été squashés, il n'y a donc aucun lien à retrouver.

## Vérifiez votre travail

Welcome page > **Training: Level 3** > **Check my work**, puis choisissez le **Lab 3.5**.

## Pour aller plus loin

- [Déployer vers les orgs majeures](https://sfdx-hardis.cloudity.com/salesforce-devops-deploy-major-branches/)
- [Notes de version](https://sfdx-hardis.cloudity.com/hardis/doc/salesforce-devops-release-notes/)

[Suite : Lab 3.6 - Livrer en production et lire vos métriques DORA](3-6-release-to-production-and-read-dora-metrics.md){ .md-button .md-button--primary }
