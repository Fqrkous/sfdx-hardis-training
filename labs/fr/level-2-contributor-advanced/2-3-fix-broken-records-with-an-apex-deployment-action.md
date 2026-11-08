---
id: lab-2-3
title: "Lab 2.3 - Réparer des enregistrements cassés avec une deployment action Apex"
description: "Rendre un champ obligatoire se déploie au vert et casse les enregistrements existants. Réparez-les avec une deployment action Apex batch qui tient sur des millions d'enregistrements."
level: 2
lab: 3
lang: fr
source_rev: "48bd2882438ee43d61843fa5c36cde67c7e5613d"
screenshots:
  - annotated/vscode/pipeline-cards--my-pull-request
  - annotated/vscode/pipeline-cards--new-user-story
  - annotated/vscode/pipeline-workflow-cards
  - annotated/vscode/pipeline-edit-action-apex
  - annotated/vscode/pipeline-pr-actions-list
depends_on:
  commands: [hardis:work:save, hardis:project:deploy:smart]
  flags: []
  config: [commandsPostDeploy, apexScript, runOnlyOnceByOrg]
  panels: [pipeline, deploymentAction]
  docs: [salesforce-devops-work-on-user-story-deployment-actions, salesforce-devops-work-on-user-story-deployment-actions-apex]
---

# Lab 2.3 - Réparer des enregistrements cassés avec une deployment action Apex

**Niveau** : 2 Contributeur avancé

**Durée** : ~40 min<!-- observed --> (observé : médiane 44 min, 16 participants, le plus rapide 15 min)<!-- /observed -->

**Vous allez** : rencontrer un échec qu'aucune correction de métadonnée ne résout, et découvrir
l'outil qui existe pour cela : une deployment action.

## La situation

> **US-024 - Crew size becomes mandatory**
>
> As a planner, I want Crew Size to be mandatory on every installation, so that no job is scheduled
> without a crew.
>
> Critères d'acceptation :
>
> - Crew Size est obligatoire
> - Les enregistrements existants sont remplis avec la valeur par défaut de 2

Une case à cocher dans Setup. Puis deux choses arrivent, et c'est la seconde qui compte.

Le déploiement échoue, pour une raison qui n'a rien à voir avec vos données. Vous corrigez cela en
une minute. Le déploiement passe ensuite au vert, et vous venez de casser en silence trente
enregistrements d'installation pour tout le monde, sans que rien ne vous le dise nulle part.

Ce lab parle de l'écart entre un déploiement vert et un déploiement sûr.

## Avant de commencer

- [ ] [Lab 2.2](2-2-fix-a-missing-dependency-deployment-error.md) terminé et mergé
- [ ] `helios-dev` au niveau d'`integration`

## Les étapes

### 1. Prendre la story et faire la chose évidente

Objectif : Crew Size obligatoire dans `helios-dev`, et le champ publié sur une Pull Request.
Rappel : [Lab 1.3](../level-1-contributor-basics/1-3-start-a-user-story-on-a-git-branch.md), [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md)

#### À faire

1. **New User Story** **(2)**, sous **Project Contribution Workflow** **(1)** du panneau DevOps
   Pipeline. Nom `US-024-crew-size-required`, org `helios-dev`

   ![La carte New User Story du panneau DevOps Pipeline](../../_assets/annotated/vscode/pipeline-cards--new-user-story.png)

2. Dans `helios-dev` : **Setup > Object Manager > Installation > Fields & Relationships > Crew Size >
   Edit**, cochez **Required**
3. Dès que la case est cochée, Salesforce vous avertit au sujet des appels API et Apex et vous demande
   de confirmer. Cliquez sur **Confirm**, puis **Save**
4. Faites un retrieve du champ avec **Commit changes** (le champ, rien d'autre), et commitez-le
5. **Save / Publish**, poussez, et ouvrez la Pull Request

#### Pourquoi

Salesforce ne dit pas un mot sur vos données, alors que la plupart des installations de votre org
n'ont pas de crew size. Retenez-le : c'est tout ce lab.

#### Vous devriez voir

- Crew Size obligatoire dans `helios-dev`
- Une Pull Request ouverte pour le champ, avec son contrôle en cours

### 2. Lire le premier échec

Objectif : les permission sets corrigés et publiés à nouveau.

Le contrôle échoue, et le commentaire sfdx-hardis nomme deux composants :

```text title="Résultat"
Helios_Delivery_Crew     You cannot deploy to a required field: Installation__c.Crew_Size__c
Helios_Delivery_Manager  You cannot deploy to a required field: Installation__c.Crew_Size__c
```

Pas un mot sur vos données. Le problème vient des permission sets.

#### À faire

1. Faites un retrieve des permission sets : **Commit changes**, cochez `Helios_Delivery_Crew` et
   `Helios_Delivery_Manager`, récupérez. Source Control montre chacun d'eux perdant son entrée
   `Crew_Size__c` et rien d'autre
2. Commitez
3. **Save / Publish** à nouveau

#### Pourquoi

Un champ *universally required* n'a pas de sécurité au niveau du champ à accorder : il est visible
et obligatoire pour tout le monde, par définition. Donc à l'instant où le champ devient obligatoire,
chaque entrée de sécurité au niveau du champ qui le mentionne devient invalide, et le déploiement
refuse les permission sets plutôt que le champ.

La correction prend une minute, et l'org l'a déjà faite : dans `helios-dev` les entrées ont disparu
des deux permission sets à l'instant où le champ est devenu obligatoire. Le commentaire sfdx-hardis
le disait même, dans l'astuce repliée sous chaque erreur, avec un lien vers la règle.

#### Pourquoi c'est une bonne erreur

Elle est précise, elle nomme les deux composants fautifs, et la correction est évidente une fois
la règle connue. La plupart des erreurs de déploiement Salesforce sont ainsi : elles ont l'air de
parler de ce que vous avez modifié, et elles parlent de quelque chose qui y faisait référence.

#### Vous devriez voir

- Les deux permission sets sans leur entrée `Crew_Size__c`, publiés sur la Pull Request

### 3. Le regarder passer au vert, et comprendre pourquoi c'est le problème

Objectif : vous avez vu, dans `helios-dev`, les enregistrements qu'un contrôle vert s'apprête à casser.

Le contrôle passe.

!!! warning "Attention"
    Ne mergez pas encore.

#### À faire

1. Ouvrez `helios-dev`, trouvez une installation sans crew size
2. Changez n'importe quoi dessus, et enregistrez. L'enregistrement refuse :

   ```text title="Résultat"
   We hit a snag.
   Review the following fields
     • Crew Size
   ```

#### Pourquoi

Le même refus s'écrit `Required fields are missing: [Crew_Size__c]` quand il vient d'Apex ou de
l'API, et c'est ainsi qu'un script le rencontre.

Salesforce impose un champ obligatoire à l'enregistrement, pas sur les données déjà présentes. Il
a parfaitement accepté de rendre le champ obligatoire alors que la plupart des installations
l'avaient vide, et le contrôle vert dit la même chose : `helios-integration` a trente installations
sans crew size, et le déploiement rendrait chacune d'elles impossible à enregistrer. Pas seulement
pour vous, pour tout le monde, pour n'importe quelle modification, jusqu'à ce que quelqu'un leur
mette un crew size.

Rien n'a échoué. Aucun contrôle n'est passé au rouge. Mergez maintenant, et la première personne à
l'apprendre est un planificateur qui n'arrive pas à enregistrer un enregistrement.

Tout ce que vous devez faire à la main dans une org, vous devrez le faire dans toutes les orgs.
C'est à cela que sert une deployment action.

#### Vous devriez voir

- Un contrôle vert sur la Pull Request, et une installation de `helios-dev` impossible à enregistrer

### 4. Découper la story en deux mouvements

Objectif : la correction prévue en deux mouvements, tous deux dans cette Pull Request. Cette étape
n'a pas de clic.

La forme de la correction, et c'est la forme de la plupart des problèmes du type "les données sont
en travers" :

1. Rendre les données valides
2. Rendre le champ obligatoire

#### Pourquoi

Les deux peuvent voyager dans la même Pull Request, tant que la première tourne dans chaque org que
la story atteint. C'est exactement ce qu'est une deployment action : quelque chose que le
pipeline lance autour du déploiement, dans chaque org, sans que personne ouvre Setup.

#### Vous devriez voir

- Les deux mouvements, dans cet ordre : les données d'abord, le champ obligatoire ensuite

### 5. Ajouter le remplissage

Objectif : le batch, son test et le script qui le démarre, dans votre projet.

Vous n'avez pas à l'écrire.

#### À faire

1. Dans l'Explorer, par copier-coller, copiez ces quatre fichiers depuis `scripts/apex/samples/` du
   repository dans `force-app/main/default/classes/` :

   - `CrewSizeBackfillBatch.cls` et `CrewSizeBackfillBatch.cls-meta.xml` : le batch. Il donne l'équipe
     par défaut de deux personnes à toute installation qui n'en a pas
   - `CrewSizeBackfillBatchTest.cls` et `CrewSizeBackfillBatchTest.cls-meta.xml` : son test. Salesforce
     ne déploie pas d'Apex sans test, et le [Lab 2.5](2-5-pass-code-quality-and-apex-test-coverage.md) parle de cette barrière

2. Puis le script que l'action lance : créez le fichier `scripts/apex/backfill-crew-size.apex` et
   copiez-y ceci

   ```apex title="À modifier dans le fichier"
   // Starts the backfill as a batch: the script returns at once, and Salesforce
   // works through the installations without a crew size, 200 at a time.
   Id jobId = Database.executeBatch(new CrewSizeBackfillBatch(), 200);
   System.debug('Crew size backfill started, batch job ' + jobId);
   ```

!!! warning "Attention"
    Ces quatre-là et aucun autre, et copiés, pas déplacés. Le dossier contient aussi `CrewCapacityBatch`
    et son test, qui sont pour le [Lab 2.4](2-4-ship-reference-data-and-a-batch-with-deployment-actions.md) : ils ont besoin d'un objet que cette story n'apporte pas,
    le check de votre Pull Request échoue dessus, et le [Lab 2.4](2-4-ship-reference-data-and-a-batch-with-deployment-actions.md) les copie depuis ce dossier.

#### Pourquoi un batch

Trente installations dans `helios-integration`, mais une org de production peut en contenir des
millions, et une deployment action tourne aussi en production. Un script qui met à jour tous les
enregistrements d'un coup s'arrête à la première limite de gouverneur Salesforce rencontrée :
10 000 enregistrements mis à jour dans une transaction, dix secondes de traitement. Le travail part
donc dans un batch, que Salesforce déroule par lots de 200 enregistrements, chacun dans sa propre
transaction, quelle que soit la taille de la table.

Deux choses à remarquer, parce que ce sont elles qui rendent cela sûr à lancer en production :

- Le batch ne touche que les enregistrements réellement faux (`WHERE Crew_Size__c = null`)
- Le script dit ce qu'il a démarré, pour que le log de déploiement soit lisible après coup

#### Vous devriez voir

- Les quatre fichiers de classe sous `force-app/main/default/classes/`, et `scripts/apex/backfill-crew-size.apex`

### 6. Le déclarer comme deployment action

Objectif : le remplissage déclaré comme deployment action de votre Pull Request.

Ouvrez le panneau **DevOps Pipeline**. Il y a deux chemins vers votre Pull Request, et les deux
arrivent au même endroit.

#### À faire : ouvrir votre Pull Request

1. Dans le diagramme, qui s'ouvre sur **Feature branches**, votre propre branche est à côté des
   branches majeures : votre branche de feature **(1)**, et sur la flèche qui en part la pastille
   numérotée **(2)**. Cliquez sur la pastille

   ![Le panneau DevOps Pipeline, avec la branche de feature et la pastille de sa Pull Request](../../_assets/annotated/vscode/pipeline-workflow-cards.png)

  !!! tip "Un autre chemin"
      Au lieu du diagramme, faites défiler jusqu'à **Project Contribution Workflow** et cliquez
      sur la carte **My Pull Request** **(1)**, qui pointe toujours vers la Pull Request de la
      branche sur laquelle vous êtes.

      ![La carte My Pull Request du panneau DevOps Pipeline](../../_assets/annotated/vscode/pipeline-cards--my-pull-request.png)

#### À faire : ajouter l'action

1. La Pull Request s'ouvre. Allez sur son onglet **Deployment Actions**, et cliquez sur **Add New
   Action**
2. Dans la boîte **Edit Deployment Action**, mettez le **Type** **(1)** sur **Apex**

   ![La boîte Edit Deployment Action, remplie pour un script Apex](../../_assets/annotated/vscode/pipeline-edit-action-apex.png)

3. Remplissez-la avec le tableau ci-dessous. **Apex Script** **(2)** est une liste déroulante de ce
   qu'il a trouvé sous `scripts/apex/`, pas un chemin en texte libre : le fichier doit donc exister
   dans votre branche avant d'y apparaître. **Run Only Once By Org** **(3)** est le commutateur juste
   en dessous
4. **Save**

| Champ                | Valeur                                         |
|----------------------|------------------------------------------------|
| Label                | `Backfill Crew Size on existing installations` |
| When                 | **After Metadata Deployment**                  |
| Apex Script          | `backfill-crew-size.apex`                      |
| Execution Contexts   | **Deployment job only**                        |
| Target orgs          | **All target orgs**                            |
| Run Only Once By Org | **oui**                                        |

#### Pourquoi Deployment job only

**Deployment job only**, parce que le contrôle de Pull Request est une répétition : il valide la
métadonnée et ne change rien dans l'org. Un script qui met à jour trente enregistrements le fait pour
de vrai, il attend donc le merge. Le contrôle liste quand même l'action dans son commentaire, marquée
sautée, pour que le relecteur la voie venir.

#### Pourquoi Run Only Once By Org

Cochez-le dès que le script est une correction ponctuelle plutôt que quelque chose qui doit se
produire à chaque déploiement. sfdx-hardis note ce qu'il a lancé dans chaque org : le remplissage
part donc une fois en intégration, une fois en UAT, une fois en production, et plus jamais.
Laissez-le décoché pour un script qui ne fait aucun mal s'il tourne deux fois et qui est censé
tourner à chaque déploiement.

#### Vous devriez voir

- L'action dans la liste de l'onglet **Deployment Actions**, dont le compteur **(1)** a augmenté
  d'une unité
- **Add New Action** **(2)** toujours là pour la suivante, et votre ligne **(3)** qui porte une
  pastille **Post-Deploy** sous son libellé

![L'onglet Deployment Actions de la Pull Request, listant les actions qu'elle porte](../../_assets/annotated/vscode/pipeline-pr-actions-list.png)

### 7. Vérifier l'ordre

Objectif : vous savez pourquoi le remplissage tourne après le déploiement, et ce que cela coûte.
Cette étape n'a pas de clic.

#### Pourquoi après

L'action tourne après le déploiement, et ici ce n'est pas un détail. Le script démarre
`CrewSizeBackfillBatch`, et cette classe voyage dans le déploiement même auquel l'action est
attachée : avant le déploiement, l'org cible ne l'a pas, et un script qui s'en sert ne compile pas.

Pendant quelques minutes après le déploiement, les installations sans crew size ne peuvent pas être
enregistrées, comme vous l'avez vu dans `helios-dev`. Puis le batch leur en a donné un. Cette fenêtre
est le prix de l'ordre, et sur une table de plusieurs millions de lignes, elle mérite d'être annoncée
aux planificateurs avant la mise en production.

#### Pourquoi : comment décider pre ou post, à chaque fois

Demandez-vous ce que l'action a besoin de trouver déjà présent. Une action qui utilise une
classe, un objet ou un champ que la story apporte est post-deploy : ils n'existent qu'une fois le
déploiement fait, et c'est le cas de ce lab et du [Lab 2.4](2-4-ship-reference-data-and-a-batch-with-deployment-actions.md). Le pre-deploy est pour ce qui doit
arriver avec l'org telle qu'elle était, avant que quoi que ce soit change : désactiver un job
planifié avec lequel le déploiement entrerait en collision, par exemple. La réponse n'est jamais
une habitude, c'est cette question.

#### Vous devriez voir

- Votre action réglée sur **After Metadata Deployment**, avec la pastille **Post-Deploy** de l'étape 6

### 8. Le commiter, et le regarder tourner

Objectif : la Pull Request mergée, et chaque installation de `helios-integration` qui porte un crew size.
Rappel : [Lab 1.6](../level-1-contributor-basics/1-6-pull-request-deployment-check-and-merge.md)

Des fichiers attendent dans **Source Control**, aucun commité : les quatre fichiers de classe et le
script Apex que vous avez créés à l'étape 5, et l'action que l'éditeur a écrite sous
`scripts/actions/`, dans un fichier nommé d'après votre Pull Request.

#### À faire

1. Commitez-les tous, puis **Save / Publish**
2. Le contrôle repasse, et son commentaire a maintenant une ligne **Deployment actions** dans son
   tableau : votre remplissage, **🕒 1 after the merge**. Ouvrez la section repliée **🛠️ Deployment
   actions of this job (1)** en dessous : le remplissage, **after** le déploiement, avec la raison
   **Runs after the merge only**
3. Mergez la Pull Request : sur sa page GitHub, choisissez **Squash and merge**, puis cliquez sur
   **Squash and merge** et **Confirm squash and merge**, comme au [Lab 1.6](../level-1-contributor-basics/1-6-pull-request-deployment-check-and-merge.md)
4. Ouvrez le log du job de déploiement vers `integration` dans l'onglet **Actions** : vous y trouvez
   le déploiement, puis l'action qui démarre, puis la ligne `System.debug` de votre script,
   `Crew size backfill started, batch job ...`

#### Pourquoi

Le contrôle montre le remplissage en attente, parce que c'est le job de validation et qu'il ne
change rien dans l'org. Le job de déploiement vers `integration` le lance, pour de vrai, juste après
le déploiement.

`helios-dev` a toujours ses crew sizes vides, et c'est normal : le prochain backpromote lance les
actions des Pull Requests qu'il rapatrie, celle-ci comprise.

<details markdown="1"><summary>Sous le capot : où l'action est stockée et comment elle tourne</summary>

L'éditeur a écrit un fichier YAML nommé d'après votre Pull Request, sous `scripts/actions/` :

    commandsPostDeploy:
      - id: 3f6d0a52-24b1-4c1a-9a0e-5b7f02400001
        label: Backfill Crew Size on existing installations
        type: apex
        parameters:
          apexScript: scripts/apex/backfill-crew-size.apex
        context: process-deployment-only
        runOnlyOnceByOrg: true

L'`id` est celui que l'éditeur a généré en créant l'action : le vôtre est différent. Ne le changez jamais : c'est grâce à lui que sfdx-hardis sait dans quelles orgs l'action a déjà tourné.

`sf hardis:project:deploy:smart` le lit, et autour du déploiement Salesforce il :

1. Rassemble les actions de chaque Pull Request incluse dans ce déploiement
2. Lance celles de `commandsPreDeploy`, dans l'ordre, dont cette story n'a aucune
3. Déploie la métadonnée
4. Lance celles de `commandsPostDeploy`
5. Note dans l'org cible quelles actions `runOnlyOnceByOrg` sont déjà parties, pour que le
   déploiement suivant les saute

`context` décide quels jobs la lancent : `all` pour le job de validation comme pour le job de
déploiement, ou `check-deployment-only` / `process-deployment-only` pour l'un des deux. Les orgs dans
lesquelles elle tourne sont une paire de clés séparée, `includeTargetBranches` et
`excludeTargetBranches`. Laissez-les de côté et l'action tourne sur toutes les cibles, ce qu'une
correction de données veut en général. Un script "réinitialiser l'utilisateur d'intégration de la
sandbox" nomme d'habitude ses branches.

Parce que les actions vivent dans le repository et voyagent avec la Pull Request, la même séquence
se rejoue en UAT et en production des mois plus tard, sans que personne se souvienne qu'elle
existait. C'est toute la valeur de la chose : la connaissance est dans le repository, pas dans la
tête de quelqu'un.

<!-- command-links:start -->
Documentation de la commande : [hardis:project:deploy:smart](https://sfdx-hardis.cloudity.com/hardis/project/deploy/smart/)
<!-- command-links:end -->

</details>

#### Vous devriez voir

- Une minute après le déploiement, chaque installation de `helios-integration` qui porte un crew
  size, et personne n'a ouvert Setup

## Ce que vous devez voir

- [ ] Le commentaire de la Pull Request listant la deployment action qu'il a lancée, au-dessus du
      résultat du déploiement
- [ ] `Crew Size` obligatoire dans `helios-integration`, avec les trente installations portant une valeur
- [ ] Une installation que vous pouvez toujours enregistrer, ce qui est tout l'objectif
- [ ] Aucune étape manuelle effectuée par qui que ce soit dans quelque org que ce soit

## En cas de problème

**Le fichier d'actions s'appelle `.sfdx-hardis.draft.yml`, ou le check s'arrête sur *Draft deployment actions file found*.**
Vous avez ajouté l'action alors que le panneau ne connaissait aucune Pull Request pour votre
branche : la carte **My Pull Request** indiquait *Pull Request not created yet*, et l'action a été
gardée dans un brouillon. Le pipeline ne lit que `scripts/actions/.sfdx-hardis.` suivi du numéro de
la Pull Request et de `.yml` : un brouillon, ou un fichier renommé à votre idée, n'est jamais
exécuté. Une fois votre Pull Request créée, rouvrez le panneau **DevOps Pipeline** et cliquez sur
**Refresh** : il renomme le brouillon d'après votre Pull Request et vous le dit dans une
notification. Committez le fichier renommé, puis **Save / Publish**.

**L'action n'apparaît pas dans l'onglet Deployment Actions.**
Le panneau lit la Pull Request depuis votre fork (votre copie personnelle du repository du cours sur
GitHub, par exemple `github.com/my-username/sfdx-hardis-training`). Si la Pull Request a été ouverte
vers le repository d'origine, il ne peut pas la voir. Fermez-la et rouvrez-la avec la bonne base.

**Le script Apex échoue avec `Invalid type: CrewSizeBackfillBatch`.**
La classe n'est pas dans l'org où le script a tourné. Soit l'action tourne **avant** le déploiement,
alors que la classe n'existe pas encore, soit les fichiers de classe n'ont pas été commités avec la
story.

**Le check échoue avec `ApexClass CrewCapacityBatch: Invalid type: Crew_Capacity__c`.**
Le batch du [Lab 2.4](2-4-ship-reference-data-and-a-batch-with-deployment-actions.md) est parti dans `force-app/main/default/classes/` avec celui de ce lab, et
`manifest/package.xml` liste `CrewCapacityBatch` et `CrewCapacityBatchTest`. Supprimez leurs quatre
fichiers de `force-app/main/default/classes/`, gardez-en une copie dans `scripts/apex/samples/`
(remettez-la si vous les avez déplacés), retirez leurs deux lignes `<members>` de
`manifest/package.xml`, commitez et poussez : le check repart.

**Le déploiement échoue toujours sur les permission sets.**
Ils portent encore des `fieldPermissions` pour `Installation__c.Crew_Size__c`. Un champ obligatoire
ne peut en avoir aucune. Republiez depuis une org où le champ est déjà obligatoire, ou supprimez les
deux blocs à la main.

**Le script a tourné, et les enregistrements sont toujours impossibles à enregistrer une minute plus
tard.**
Le batch tourne encore, ou il a échoué. Dans l'org, **Setup > Apex Jobs** liste
`CrewSizeBackfillBatch` avec son statut et ses erreurs.

**L'action a tourné mais rien n'a changé.**
`runOnlyOnceByOrg` est coché et elle a déjà tourné dans cette org lors d'une tentative précédente.
C'est le comportement correct. Décochez-le temporairement si vous avez besoin de relancer pendant vos
essais.

## Vérifiez votre travail

Welcome page > **Training: Level 2** > **Check my work**, puis choisissez le **Lab 2.3**.

## Pour aller plus loin

- [Deployment actions](https://sfdx-hardis.cloudity.com/salesforce-devops-work-on-user-story-deployment-actions/)
- [Run an Apex script](https://sfdx-hardis.cloudity.com/salesforce-devops-work-on-user-story-deployment-actions-apex/)

[Suite : Lab 2.4 - Livrer des données de référence et un batch avec des deployment actions](2-4-ship-reference-data-and-a-batch-with-deployment-actions.md){ .md-button .md-button--primary }
