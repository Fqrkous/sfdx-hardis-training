---
id: lab-2-2
title: "Lab 2.2 - Corriger une erreur de déploiement due à une dépendance manquante"
description: "Modifiez un flow Salesforce existant, puis lisez correctement un contrôle de déploiement de Pull Request en échec et ajoutez le champ que le package avait oublié."
level: 2
lab: 2
lang: fr
source_rev: "7f6e1b07b306775e877b850bd4e47f03cb7e9361"
screenshots:
  - annotated/vscode/package-xml-filtered
  - annotated/vscode/editor-field-file
  - annotated/vscode/pipeline-packages-menu--package-xml
  - annotated/web/github-pr-check-failed
  - annotated/web/github-pr-flow-diff
  - annotated/salesforce/flow-builder-crew-warning
  - annotated/salesforce/flow-builder-start-conditions
  - annotated/salesforce/flow-builder-formula
  - annotated/salesforce/flow-builder-add-element
  - annotated/vscode/pipeline-cards--new-user-story
  - annotated/vscode/metadata-retriever
  - annotated/vscode/pipeline-cards--save-publish
depends_on:
  commands: [hardis:work:new, hardis:work:save, hardis:project:deploy:smart]
  flags: [--check]
  config: []
  panels: [pipeline, packageXml]
  docs: [salesforce-devops-solve-deployment-errors, salesforce-devops-retrieve]
---

# Lab 2.2 - Corriger une erreur de déploiement due à une dépendance manquante

**Niveau** : 2 Contributeur avancé

**Durée** : ~35 min<!-- observed --> (observé : médiane 36 min, 16 participants, le plus rapide 17 min)<!-- /observed -->

**Vous allez** : modifier un flow qui tourne déjà en production, rencontrer votre premier contrôle de
déploiement en échec, lire l'erreur correctement, et trouver ce que votre package a oublié.

## La situation

> **US-021 - Warn the planner when a crew is too small**
>
> As a planner, I want one warning on the installation when the assigned crew is smaller than the
> panels need, so that I fix it before the van leaves, and not a new task every time I save.

Le flow existe déjà. `Installation Crew Warning` est arrivé avec l'application Helios quand vous avez
monté vos orgs au Niveau 1 : il crée une tâche pour le planificateur dès que moins de deux personnes
sont affectées, et il le fait à chaque enregistrement, ce dont les planificateurs se plaignent.
Vous le modifiez, vous le publiez, et le contrôle échoue avec une erreur à propos d'un champ que vous
avez pourtant sous les yeux dans l'org.

Ce lab parle de l'écart entre "ça existe dans mon org" et "c'est dans le package".

## Avant de commencer

- [ ] [Lab 2.1](2-1-backpromote-your-teammates-work.md) terminé
- [ ] `helios-dev` au niveau d'`integration`

## Les étapes

### 1. Prendre la story

Objectif : la User Story `US-021-crew-size-warning` démarrée, sur `helios-dev`.
Rappel : [Lab 1.3](../level-1-contributor-basics/1-3-start-a-user-story-on-a-git-branch.md)

#### À faire

1. Dans le panneau **DevOps Pipeline**, sous **Project Contribution Workflow** **(1)**, cliquez sur
   **New User Story** **(2)**, la même carte qu'au [Lab 1.3](../level-1-contributor-basics/1-3-start-a-user-story-on-a-git-branch.md)

   ![Les cartes de contribution du panneau DevOps Pipeline](../../_assets/annotated/vscode/pipeline-cards--new-user-story.png)

2. Répondez : type **Feature**, nom `US-021-crew-size-warning`, org `helios-dev`

#### Pourquoi

La cible est `integration` sans qu'on vous le demande, comme au Niveau 1.

#### Vous devriez voir

- La User Story `US-021-crew-size-warning` démarrée, avec `helios-dev` pour org et `integration`
  pour cible

### 2. Modifier le flow d'avertissement

Objectif : la nouvelle version d'`Installation Crew Warning` active dans `helios-dev`, qui prévient le
planificateur une seule fois.
Rappel : [Lab 1.4](../level-1-contributor-basics/1-4-build-a-custom-field-in-your-org.md)

D'abord le champ dont le flow a besoin pour ne pas avertir deux fois :

| Paramètre     | Valeur                 |
|---------------|------------------------|
| Data Type     | **Checkbox**           |
| Field Label   | `Crew Warning Sent`    |
| Field Name    | `Crew_Warning_Sent__c` |
| Default Value | Décoché                |

#### À faire : créer le champ

1. Dans `helios-dev`, ouvrez **Setup > Object Manager > Installation > Fields & Relationships > New**,
   et remplissez-le avec le tableau ci-dessus
2. L'écran de sécurité au niveau du champ arrive avec **Visible** coché pour presque tous les profils,
   comme dans le [Lab 1.4](../level-1-contributor-basics/1-4-build-a-custom-field-in-your-org.md) : videz la colonne avec la case de son en-tête
3. Cochez **Visible** pour **System Administrator** seulement (*Administrateur système* dans une org
   en français)
4. Sur le dernier écran, décochez **Installation Layout**

#### Pourquoi

Personne d'autre que le flow n'a besoin de cette case, elle ne va donc sur aucune page.

Cette seule coche **Visible** est pour vous, pas pour le flow : Flow Builder ne propose que les champs
que la personne qui édite le flow peut lire, et sans elle **Crew Warning Sent** manque dans les listes
de Flow Builder ci-dessous. Le flow lui-même tourne en mode système et n'a besoin d'aucun droit.

#### À faire : modifier le flow

1. Ouvrez **Setup > Flows**, puis **Installation Crew Warning**. Trois modifications suivent, et
   l'image montre où chacune commence

   ![Le flow Installation Crew Warning dans Flow Builder](../../_assets/annotated/salesforce/flow-builder-crew-warning.png)

2. Élément **Start** : cliquez sur **Edit** **(1)** dessus. Un panneau s'ouvre, celui de la capture
   suivante, et ses numéros sont les siens : sous **Set Entry Conditions**, le flow tourne déjà
   quand `Crew Size` n'est pas nul **(1)**. Cliquez sur **Add Condition** **(2)** et
   ajoutez la seconde, `Panels Required`, **Is Null**, `False`. Ce panneau n'a pas de bouton
   **Done** : la condition est gardée au fil de la saisie, et le **X** **(3)** en haut à droite
   ferme le panneau

   ![Les conditions d'entrée de l'élément Start](../../_assets/annotated/salesforce/flow-builder-start-conditions.png)

3. La décision **Crew Too Small** lit une ressource de type formule, `crewTooSmall`. Ouvrez la
   **Toolbox** **(2)** en haut à gauche du canevas, et cliquez sur `crewTooSmall` sous **Formulas**
4. Mettez à jour sa **Description** **(1)**, `True when eight panels a person do not cover the job,
   and no warning was sent yet`
5. Remplacez sa **Formula** **(2)** par celle ci-dessous, puis **Done** **(3)**. Copiez-la plutôt
   que de la taper

   ![La fenêtre Edit Formula de la ressource crewTooSmall](../../_assets/annotated/salesforce/flow-builder-formula.png)

   ```text title="À taper"
   AND(
     {!$Record.Crew_Size__c} * 8 < {!$Record.Panels_Required__c},
     NOT({!$Record.Crew_Warning_Sent__c})
   )
   ```

6. Après **Create Warning Task**, cliquez sur le **+** **(3)** sur la ligne en dessous, et choisissez
   **Update Triggering Record** **(1)** sous **Shortcuts**

   ![Le menu Add Element, avec Update Triggering Record](../../_assets/annotated/salesforce/flow-builder-add-element.png)

7. Appelez l'élément `Mark Warning Sent`, donnez-lui une description, et mettez `Crew Warning Sent`
   à `True`
8. Reliez son chemin **fault** à l'élément `Log Fault` existant, comme l'élément de tâche
9. **Save As New Version** **(4)**. La fenêtre qui s'ouvre contient la description du flow :
   remplacez-la par `Warns the planner when the crew assigned to an installation is too small for
   the panels it needs.`
10. **Activate**, le bouton qui remplace **Deactivate** sur la nouvelle version

#### Pourquoi une nouvelle version

Le flow est actif, Flow Builder ouvre donc la version qui tourne : chaque modification que vous faites
est enregistrée comme une nouvelle version, et l'ancienne continue de tourner jusqu'à ce que vous
activiez la vôtre.

Une personne pose environ huit panneaux par jour : l'équipe est trop petite quand huit panneaux
par personne ne couvrent pas le chantier, et l'avertissement ne part que s'il n'a pas déjà été
envoyé. La description du flow change puisque le flow ne prévient plus à chaque enregistrement.

#### Pourquoi le flow a un fault path

Un élément d'enregistrement qui n'en a pas échoue en silence : le flow s'arrête, l'utilisateur ne
voit rien, et la Task censée avertir le planificateur n'apparaît jamais. Sur un vrai projet, le
fault path envoie le message quelque part où quelqu'un le lit. Ici il se contente de le
garder, parce que ce que la pipeline contrôle est qu'un fault path existe. Le flow d'origine
en avait déjà un, et votre nouvel élément le suit.

#### À faire : tester

1. Ouvrez une installation, mettez `Panels Required` à 40 et `Crew Size` à 2, enregistrez. Si la
   tâche tarde à s'afficher, cliquez sur **Refresh** dans le panneau d'activités
2. Enregistrez à nouveau

#### Pourquoi vous ne voyez pas la case

C'est la story qui fonctionne, dans votre org. La case à cocher elle-même reste invisible : aucun
permission set ne l'accorde, parce que personne d'autre que le flow n'en a besoin, et la seule
personne qui peut la lire est l'administrateur qui a construit le flow.

#### Vous devriez voir

- Une tâche à droite de l'enregistrement, dans le panneau d'activités sous la **Panel delivery
  timeline**, dans sa section **Upcoming & Overdue**
- Pas de deuxième tâche après le second enregistrement

### 3. Publier le flow, et regarder le contrôle échouer

Objectif : le flow sur une Pull Request vers `integration`, et son contrôle de déploiement rouge.
Rappel : [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md)

#### À faire : publier

1. Faites un retrieve du flow comme le Niveau 1 vous l'a appris : **DevOps Pipeline > Commit changes**,
   **Recent Changes**, **Search Metadata**
2. La story porte sur le flow, cochez donc le flow `Installation_Crew_Warning`, et récupérez-le
3. Commitez-le depuis **Source Control**
4. Puis **Save / Publish** **(1)**

   ![La carte Save / Publish du panneau DevOps Pipeline](../../_assets/annotated/vscode/pipeline-cards--save-publish.png)

5. Poussez, ouvrez la Pull Request vers `integration` dans votre fork (votre copie personnelle du
   repository du cours sur GitHub, par exemple `github.com/my-username/sfdx-hardis-training`), et
   attendez

!!! warning "Regardez ce que vous n'avez pas récupéré"
    Le retriever a aussi listé `Installation__c.Crew_Warning_Sent__c`, le champ que vous avez créé en
    premier. Vous l'avez laissé décoché, et rien n'a rien dit. Continuez et publiez quand même : tout
    l'intérêt de ce lab est de rencontrer l'échec qui suit, et d'apprendre à le lire.

#### À faire : lire les commentaires

1. Le contrôle échoue. Ouvrez le commentaire sfdx-hardis sur la Pull Request : il s'ouvre sur
   **❌ Cannot merge into `integration`: 1 deployment error**, et nomme le composant sous
   **❌ Deployment errors** **(1)**

   ![Le commentaire sfdx-hardis d'un contrôle de déploiement en échec](../../_assets/annotated/web/github-pr-check-failed.png)

   ```text title="Résultat"
   Installation_Crew_Warning field integrity exception: unknown (The field "Crew_Warning_Sent__c"
   for the object "Installation__c" doesn't exist.)
   ```

2. Plus bas, ouvrez la ligne repliée **📋 1 component failed, ... would change in the org** **(2)** :
   un tableau des composants, par type, avec votre flow dans son groupe **❌ Failed**
3. Ouvrez le deuxième commentaire, publié juste en dessous : **🔀 Flow Installation Crew Warning**, le
   diff visuel du flow. Il dessine le flow, et colore ce que votre story a modifié. Le nouvel élément
   **Mark Warning Sent** est en vert **(1)**
4. Au-dessus du schéma, lisez le tableau **properties changed** : chaque propriété modifiée avec sa
   valeur avant et après, la description **(2)**, la formule **(3)**. Les tableaux complets du flow
   sont repliés sous **All properties and elements**

   ![Le diff visuel du flow Installation Crew Warning, publié sur la Pull Request](../../_assets/annotated/web/github-pr-flow-diff.png)

#### Pourquoi

Un flow est une métadonnée comme les autres dans ce commentaire. Ce qu'il a en plus, c'est un
deuxième commentaire à lui, le diff visuel. Un relecteur lit votre modification de flow là, sans
ouvrir Flow Builder ni son XML.

Votre Pull Request ne peut pas être mergée tant que ce contrôle est rouge : `integration` la refuse,
pour vous comme pour n'importe qui.

#### Vous devriez voir

- Un contrôle rouge sur la Pull Request, et une erreur qui dit que `Crew_Warning_Sent__c` n'existe pas

Lisez cela deux fois. Le champ existe. Vous le voyez dans l'org. Vous l'avez créé il y a dix
minutes et le flow que vous venez de tester le lit.

### 4. Lire le package avant de lire quoi que ce soit d'autre

Objectif : vous savez pourquoi le déploiement a échoué : le package ne porte pas le champ.
Rappel : [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md)

Quand un déploiement dit que quelque chose n'existe pas, la première question n'est jamais "est-ce
dans l'org". C'est "est-ce dans le package".

#### À faire

1. Ouvrez le package : dans le panneau **DevOps Pipeline**, le menu **Deployment packages** **(1)**,
   puis **Package XML** **(2)**, comme au [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md)

   ![Le menu Deployment packages du panneau DevOps Pipeline, avec Package XML](../../_assets/annotated/vscode/pipeline-packages-menu--package-xml.png)

2. Tapez `crew_warning` dans sa zone de filtre **(1)**

   ![Le visualiseur de package filtré sur Crew_Warning, avec la seule ligne Flow](../../_assets/annotated/vscode/package-xml-filtered.png)

3. Regardez là où vivent les champs, `force-app/main/default/objects/Installation__c/fields/` : le
   champ n'y est pas

#### Pourquoi

On envoie à l'org d'intégration un flow qui lit un champ que le package ne porte pas, et l'org
d'intégration n'a pas ce champ non plus. Du point de vue de Salesforce, l'erreur est exactement
juste.

Le package est construit à partir de ce que vos commits ont changé, et le champ n'a jamais été
commité. Il n'existe qu'à un seul endroit, `helios-dev`, et une pipeline ne lit jamais l'org d'un
développeur.

#### Vous devriez voir

- Il reste une ligne, **Flow** **(2)** : le package porte votre flow
- Aucune ligne **CustomField** : le package ne porte pas `Installation__c.Crew_Warning_Sent__c`

### 5. Récupérer ce dont le flow dépend

Objectif : le champ `Crew_Warning_Sent__c` dans votre projet, à côté du flow.

#### À faire

1. Ouvrez le panneau **Metadata Retriever**

   ![Le panneau Metadata Retriever, avec son sélecteur d'org, ses filtres et le bouton Search Metadata](../../_assets/annotated/vscode/metadata-retriever.png)

2. Vérifiez que l'org en haut à droite **(1)** est `helios-dev`
3. Tapez `Crew_Warning_Sent__c` dans **Metadata Name** **(2)**
4. Cliquez sur **Search Metadata** **(3)**
5. Cochez le champ dans les résultats et récupérez-le

#### Pourquoi

L'habitude à retenir : quand vous modifiez quelque chose qui lit un autre composant, récupérez
aussi ce composant. Un flow lit des champs, une présentation de page les affiche, un permission set
les accorde. Tout ce qui est nouveau parmi eux voyage avec la story, ou la story ne se déploie pas.

#### Vous devriez voir

- Le champ sous `force-app/main/default/objects/Installation__c/fields/` **(1)**, dans la vue
  **Explorer** de VS Code

![Le fichier du champ rapatrié dans l'Explorer, ouvert dans l'éditeur](../../_assets/annotated/vscode/editor-field-file.png)

### 6. Publier à nouveau

Objectif : le contrôle vert, et la Pull Request mergée dans `integration`.

Le champ est maintenant dans `force-app/`.

#### À faire

1. Commitez-le depuis **Source Control**
2. **Save / Publish** à nouveau
3. Poussez, et attendez le contrôle
4. Mergez

<details markdown="1"><summary>Sous le capot : pourquoi l'erreur disait ce qu'elle disait</summary>

Le job de contrôle a lancé :

    sf hardis:project:deploy:smart --check

qui a remis `manifest/package.xml` à Salesforce comme déploiement de validation : la liste que Save /
Publish tient à jour à partir du diff git entre votre branche et `integration`. Salesforce a compilé
le flow, cherché `Installation__c.Crew_Warning_Sent__c` dans le package et dans l'org cible, ne
l'a trouvé ni dans l'un ni dans l'autre, et a refusé.

Le point important est l'ordre des deux questions :

1. Est-ce dans le package ? `manifest/package.xml`, et derrière lui le diff git : ce que vous
   avez récupéré et commité
2. Est-ce dans l'org cible ? Ne posez celle-ci qu'une fois que la réponse à la première est oui

La plupart des erreurs de déploiement qui disent "does not exist" relèvent de la question 1, et la
plupart des gens passent vingt minutes sur la question 2 d'abord.

Le flow est parti comme une nouvelle version. Un flow est versionné dans l'org : Flow Builder a
enregistré le vôtre en version 2, et le déploiement envoie sa définition. L'org d'intégration garde
sa version 1 en historique, inactive, exactement comme `helios-dev` le fait.

<!-- command-links:start -->
Documentation de la commande : [hardis:project:deploy:smart](https://sfdx-hardis.cloudity.com/hardis/project/deploy/smart/)
<!-- command-links:end -->

</details>

#### Vous devriez voir

- `manifest/package.xml` qui liste à la fois le champ et le flow
- Le contrôle vert

## Ce que vous devez voir

- [ ] `manifest/package.xml` listant `Installation__c.Crew_Warning_Sent__c` et
      `Installation_Crew_Warning`
- [ ] Le contrôle de la Pull Request vert
- [ ] Après le merge, le flow présent et actif dans `helios-integration`

## En cas de problème

**Flow Builder ne propose pas Crew Warning Sent.**
Vous avez créé le champ avec **Visible** décoché pour tous les profils : vous ne pouvez pas le lire, et
Flow Builder ne liste que les champs que vous pouvez lire. **Setup > Object Manager > Installation >
Fields & Relationships > Crew Warning Sent > Set Field-Level Security**, cochez **Visible** pour
**System Administrator** (*Administrateur système* dans une org en français), **Save**. Rechargez ensuite Flow Builder :
le champ apparaît dans la liste de **Update Triggering Record**, et la formule `crewTooSmall`
l'accepte.

**La récupération ne ramène rien.**
Le sélecteur d'org du Metadata Retriever pointe vers une autre org. Il doit indiquer `helios-dev`, là
où vous avez créé le champ.

**Le contrôle échoue maintenant parce que le flow est inactif.**
Salesforce refuse, dans certaines configurations, de déployer un flow actif par-dessus un flow actif
de même version. Désactivez l'ancienne version dans l'org cible, ou incrémentez la version du flow
dans votre org et récupérez à nouveau.

**Le contrôle échoue sur un champ de Task.**
Votre élément Create Records renseigne un champ que l'org d'intégration n'a pas, parce que vous en
avez choisi un propre à votre org. Simplifiez : le sujet et le WhatId suffisent.

## Vérifiez votre travail

Welcome page > **Training: Level 2** > **Check my work**, puis choisissez le **Lab 2.2**.

## Pour aller plus loin

- [Résoudre les erreurs de déploiement](https://sfdx-hardis.cloudity.com/salesforce-devops-solve-deployment-errors/)
- [Problèmes de récupération de sources](https://sfdx-hardis.cloudity.com/salesforce-devops-retrieve/)

[Suite : Lab 2.3 - Réparer des enregistrements cassés avec une deployment action Apex](2-3-fix-broken-records-with-an-apex-deployment-action.md){ .md-button .md-button--primary }
