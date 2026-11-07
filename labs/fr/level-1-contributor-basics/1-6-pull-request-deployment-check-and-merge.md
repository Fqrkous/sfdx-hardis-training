---
id: lab-1-6
title: "Lab 1.6 - Ouvrir une Pull Request, passer le contrôle de déploiement, merger"
description: "Ouvrez une Pull Request GitHub, lisez le contrôle de déploiement sfdx-hardis et son commentaire, mergez, et regardez la CI/CD déployer votre modification dans l'org d'intégration."
level: 1
lab: 6
lang: fr
source_rev: "359f7c84d7517fcc018799c14368473cbd0e01ba"
screenshots:
  - annotated/web/github-pr-checks
  - annotated/web/github-pr-comment
  - annotated/vscode/pipeline-cards-first-pr--my-pull-request
  - annotated/vscode/pipeline-pr-window-validation
  - annotated/vscode/pipeline-pr-window-running
  - annotated/vscode/pipeline-pr-window-files
  - annotated/web/github-pr-merge
  - annotated/vscode/devops-pipeline--deployment-status
  - annotated/web/github-pr-deployed
  - annotated/vscode/work-save-completed
  - annotated/web/github-pr-merge-squash
depends_on:
  commands: [hardis:project:deploy:smart, hardis:git:artifacts:download]
  flags: [--check]
  config: [testLevel, apexTestsMinCoverageOrgWide, genericTicketingProviderRegex, genericTicketingProviderUrlBuilder, genericTicketingProviderDetailsUrlBuilder]
  panels: [pipeline]
  docs: [salesforce-devops-pull-request-github, salesforce-devops-handle-merge-request-results, salesforce-devops-solve-megalinter-errors, salesforce-devops-setup-integration-generic-ticketing]
---

# Lab 1.6 - Ouvrir une Pull Request, passer le contrôle de déploiement, merger

**Niveau** : 1 Contributeur, les bases

**Durée** : ~15 min<!-- observed --> (observé : médiane 19 min, 38 participants, le plus rapide 5 min)<!-- /observed -->

**Vous allez** : faire contrôler votre travail par un robot avant qu'un humain le fasse, lire ce
qu'il dit, et mettre US-014 dans l'org d'intégration partagée.

## La situation

Votre branche est sur GitHub. Vous demandez maintenant qu'elle soit mergée, et il se passe quelque
chose d'intéressant : avant que quiconque la regarde, un job prend vos modifications et répète le
déploiement dans l'org d'intégration. Salesforce compile tout et lance les tests, puis jette le
résultat au lieu de le garder, l'org reste donc exactement comme elle était. Le job lance aussi les
linters, et écrit tout le verdict sur la Pull Request.

C'est tout l'intérêt de cette façon de travailler. Vous apprenez que votre déploiement échoue pendant
qu'il est encore à vous de le corriger, pas le soir de la mise en production.

La Pull Request, en une phrase : elle demande qu'une branche soit fusionnée dans une autre, la
vôtre dans `integration` ici. C'est une page sur GitHub qui contient trois choses : ce que votre
branche change, le résultat de chaque contrôle qui a tourné dessus, et la conversation sur
l'opportunité de la merger. Rien ne bouge tant que quelqu'un ne clique pas sur Merge. Tout le monde
dit "PR".

## Avant de commencer

- [ ] [Lab 1.5](1-5-retrieve-commit-and-publish-your-changes.md) terminé : la branche est poussée sur votre fork (votre copie personnelle du repository du
      cours sur GitHub, par exemple `github.com/my-username/sfdx-hardis-training`)
- [ ] [Lab 1.2](1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md) terminé : **Set up my training environment** a activé Actions et posé l'identifiant de
      CI

## Les étapes

### 1. Ouvrir la Pull Request

Objectif : une Pull Request de `features/US-014-panels-required` vers `integration` de votre fork,
avec un titre et une description qu'un relecteur peut lire.
Rappel : [Lab 1.5](1-5-retrieve-commit-and-publish-your-changes.md)

#### À faire

1. Retournez au panneau où **Save / Publish** s'est terminé au [Lab 1.5](1-5-retrieve-commit-and-publish-your-changes.md). Tout en bas se trouve une
   barre d'actions : cliquez sur la première, **Create Pull Request** **(1)**

   ![La fin de la commande Save / Publish, avec sa barre d'actions](../../_assets/annotated/vscode/work-save-completed.png)

  !!! tip "Panneau fermé ?"
      Rien n'est perdu, et il y a deux chemins de retour. Relancez **Save / Publish my User
      Story** : chaque étape vérifie avant d'agir, il n'y a plus rien à commiter ni à pousser, et
      elle se termine sur la même barre d'actions. Ou ouvrez votre fork
      (`github.com/my-username/sfdx-hardis-training`) sur GitHub : il affiche une bannière qui
      propose d'ouvrir une Pull Request pour la branche que vous venez de pousser.

2. Vérifiez deux choses avant de cliquer, à chaque fois sans exception :

   1. **base** est `integration`, dans votre fork
   2. **compare** est `features/US-014-panels-required`

3. Remplacez le titre, qui indique **Features/us 014 panels required**, par la première ligne du
   message de commit que vous avez écrit au [Lab 1.5, étape 4](1-5-retrieve-commit-and-publish-your-changes.md), `US-014 Panels
   Required on Installation`
4. Remplacez entièrement le contenu de la zone de description. Sous **What this changes**, collez le
   reste de ce même message de commit, le paragraphe qui explique pourquoi ; renseignez
   l'identifiant de la story ; et dites où le relecteur doit regarder
5. Supprimez les lignes de commentaire et tout titre sous lequel vous n'avez rien à mettre
6. Cliquez sur **Create pull request**

!!! warning "Vérifiez le repository de base"
    GitHub met par défaut comme base d'une Pull Request de fork le repository d'origine. Si la base
    dit `hardisgroupcom/sfdx-hardis-training`, cliquez dessus et remplacez-la par votre propre fork.
    Une Pull Request ouverte en amont ne peut pas atteindre votre org, ne passera jamais au vert, et
    ajoute du bruit dans un repository qu'utilisent quelques centaines d'autres apprenants.

#### Pourquoi

**Create Pull Request** ouvre GitHub sur la bonne page, avec la base et la tête déjà renseignées.

Deux autres éléments de cette barre méritent d'être connus dès maintenant, parce que des labs
suivants s'en servent. **(2)** est le `package.xml` généré par la commande, celui que vous avez lu au
[Lab 1.5, étape 6](1-5-retrieve-commit-and-publish-your-changes.md#6-lire-le-package-avant-de-pousser). **(3)** ouvre les Deployment Actions de cette Pull Request, ce dont parle tout le
[Lab 2.3](../level-2-contributor-advanced/2-3-fix-broken-records-with-an-apex-deployment-action.md). La pastille **+ PR** que vous avez peut-être remarquée dans le diagramme DevOps
Pipeline est pour les branches majeures, pas pour votre branche de feature.

GitHub invente le titre à partir du nom de branche dès qu'une branche porte plus d'un commit, et la
vôtre en porte deux, celui que vous avez écrit et celui qu'a ajouté Save / Publish.

La zone de description n'est pas vide : ce repository fournit un template de Pull Request, et
GitHub l'y place pour vous. Un template est un rappel de ce qu'il faut écrire, pas quelque chose à
rendre tel quel. La description est ce que le relecteur lit en premier.

#### Vous devriez voir

- Votre Pull Request ouverte dans votre fork, base `integration`, titrée `US-014 Panels Required on
  Installation`

### 2. Regarder les contrôles tourner

Objectif : les deux contrôles de votre Pull Request qui tournent, tout seuls.

#### À faire

1. Ouvrez l'onglet **Checks** **(1)**. Deux des contrôles comptent ici, et les deux démarrent tout
   seuls : les deux du tableau ci-dessous

   ![L'onglet Checks d'une Pull Request, listant les jobs qui ont tourné](../../_assets/annotated/web/github-pr-checks.png)

2. Cliquez sur l'un ou l'autre pour lire son log pendant qu'il tourne

| Contrôle                                      | Ce qu'il fait                                                                                  |
|-----------------------------------------------|------------------------------------------------------------------------------------------------|
| **Simulate Deployment (sfdx-hardis)** **(2)** | Déploie votre métadonnée dans `helios-integration` en mode validation, et lance les tests Apex |
| **Mega-Linter** **(3)**                       | Lance les linters de qualité de code sur le repository                                         |

!!! warning "Aucun contrôle du tout ? Actions est désactivé sur votre fork"
    Si l'onglet Checks est vide et que rien ne démarre jamais, GitHub n'a pas activé Actions sur
    votre copie du repository. Il le fait pour tout nouveau fork, et c'est volontaire : un fork
    pourrait sinon lancer les workflows de quelqu'un d'autre dans votre compte dès sa création.
    **Set up my training environment** les active quand il le peut, et le dit quand il ne le peut
    pas.

    Ouvrez l'onglet **Actions** de votre fork (`github.com/my-username/sfdx-hardis-training`) et
    cliquez sur **I understand my workflows, go ahead and enable them**. Un seul clic. Revenez
    ensuite ici et lancez **Training: Level 1 > Trigger my workflows** : il pousse une modification
    d'une ligne sur votre branche, et c'est ce qui fait démarrer les contrôles sur une Pull Request
    ouverte pendant qu'Actions était désactivé.

    C'est une affaire de fork, et rien que de fork. Sur un vrai projet, vous rejoignez un
    repository dont l'automatisation tourne déjà, et il n'y a rien à activer.

#### Vous devriez voir

- Le contrôle de déploiement qui tourne environ deux minutes : dans son log, vous pouvez le voir
  s'authentifier avec votre secret, calculer ce qui a changé, et lancer le déploiement

### 3. Lire le commentaire sfdx-hardis

Objectif : vous savez lire le verdict du contrôle de déploiement, sur GitHub et dans VS Code.

Quand le contrôle de déploiement se termine, sfdx-hardis écrit un commentaire sur l'onglet
**Conversation**. C'est la chose la plus utile de la page.

#### À faire : sur GitHub

1. Ouvrez l'onglet **Conversation** et trouvez le commentaire sfdx-hardis

   ![Le commentaire sfdx-hardis sur une Pull Request](../../_assets/annotated/web/github-pr-comment.png)

2. Lisez le verdict **(1)**, sous la bannière : **✅ Ready to merge into `integration`**, une ligne
   qui dit que le déploiement a seulement été simulé dans l'org `integration`, donc que rien n'y a
   changé, et **How to merge: use Squash and merge, so the User Story arrives as one commit**.
   L'étape 4 fait exactement cela
3. Lisez **Apex tests** **(2)**, une ligne du tableau **Check | Result** sous le verdict : la
   couverture, face à l'objectif que fixe ce projet
4. Lisez **Metadata** **(3)**, la première ligne de ce tableau : ce qui changerait,
   `7 components would change (1 created, 6 updated), 36 validated`
5. Plus bas, cliquez sur **📋 7 components would change in the org** pour ouvrir un tableau de ces
   changements, par type de composant : le champ est la ligne **CustomField**
6. Ouvrez les tickets **(4)**, repliés sous **🎫 1 ticket** vers le bas : les stories qu'il a
   reconnues dans votre nom de branche et vos messages de commit, chacune avec son titre et un lien
   vers sa page dans le backlog

#### Pourquoi

La ligne Metadata n'est pas une liste de vos fichiers : sfdx-hardis envoie le package entier,
`manifest/package.xml`, et Salesforce répond quelle part en diffère. Le composant créé est votre
champ, et les composants mis à jour incluent la présentation de page et les deux permission sets que
vous avez modifiés.

Le tableau a une ligne de plus, **Quick Deploy** : le job de merge peut réutiliser cette validation,
donc les tests Apex ne tourneront pas une deuxième fois. L'étape 5 le montre à l'œuvre. Le
commentaire se termine par le nom du job qui l'a écrit.

Vos chiffres peuvent différer d'une unité ou deux. L'image est un vrai commentaire d'une vraie
exécution de ce lab, gardé tel quel. Un composant que Salesforce range légèrement différemment dans
votre org peut passer de inchangé à mis à jour, et ce n'est pas un problème : ce qui compte, c'est
que votre champ soit celui qui est créé.

<details markdown="1"><summary>Sous le capot : d'où viennent les titres des stories</summary>

Le cours n'a pas d'outil de ticketing : son backlog est le système de ticketing.
`config/.sfdx-hardis.yml` le déclare avec trois clés du fournisseur de ticketing générique :

- `genericTicketingProviderRegex: "(US-[0-9]{3})"` trouve `US-014` dans le nom de branche et les
  commits
- `genericTicketingProviderUrlBuilder` en fait le lien, `.../BACKLOG/US-014/`
- `genericTicketingProviderDetailsUrlBuilder` pointe sur `.../BACKLOG/US-014.json`, un petit fichier
  que le site du cours publie pour chaque story. sfdx-hardis lit son `subject` et l'écrit à côté du
  lien

Un vrai projet pointe ces clés vers son propre outil de ticketing, ou utilise le connecteur JIRA,
Azure Boards ou ServiceNow à la place.

</details>

#### À faire : le même commentaire, sans quitter VS Code

1. Revenez dans VS Code et ouvrez le panneau **DevOps Pipeline**
2. Sous **Project Contribution Workflow**, la carte **My Pull Request** **(1)** porte maintenant le
   nom de votre Pull Request. Cliquez dessus

   ![La carte My Pull Request du panneau DevOps Pipeline, qui nomme la Pull Request de US-014](../../_assets/annotated/vscode/pipeline-cards-first-pr--my-pull-request.png)

  !!! tip "Carte pas à jour ?"
      Si la carte affiche encore *Pull Request not created yet*, cliquez sur **Refresh** dans sa
      barre du haut, et la carte se met à jour.

3. Lisez la fenêtre qui s'ouvre sur votre Pull Request :

   1. Les onglets **(1)** : **Validation** est le contrôle de déploiement, **Code Quality** est
      Mega-Linter, et **Deployment** se remplit une fois le merge fait. **Tickets** contient la
      story trouvée dans le nom de votre branche
   2. Le job **(2)** : son résultat, sa durée, **Open job** pour son log sur GitHub,
      **Open comment** pour le commentaire sur GitHub, et **Files**
   3. Le commentaire **(3)**, celui que vous venez de lire, mot pour mot

   ![La fenêtre d'une Pull Request dans VS Code, sur son onglet Validation](../../_assets/annotated/vscode/pipeline-pr-window-validation.png)

  !!! tip "Ouverte pendant qu'un contrôle tournait ?"
      La fenêtre le dit, et vous n'avez pas besoin de GitHub pour savoir où en est le contrôle :

      1. L'onglet **(1)** porte un spinner tant que son job tourne, **Code Quality** compris, et
         l'étape **Validation** au-dessus des onglets bouge
      2. Le job en cours **(2)** vient en premier : quand il a démarré, depuis combien de temps
         il tourne, compté chaque seconde, et **Open job** pour son log sur GitHub
      3. En dessous **(3)**, ce que l'exécution précédente a laissé. Sur une première Pull
         Request il n'y a encore rien : le commentaire arrive quand le job se termine

      ![La fenêtre d'une Pull Request dans VS Code pendant que son contrôle de déploiement tourne](../../_assets/annotated/vscode/pipeline-pr-window-running.png)

#### Pourquoi la carte peut être en retard

Si la carte affiche encore *Pull Request not created yet*, le panneau montre ce qu'il savait avant
que vous la créiez. Elle se met aussi à jour toute seule en moins d'une minute.

La fenêtre rassemble ce que GitHub répartit sur plusieurs pages. Votre numéro n'est pas `#46`, et
votre commentaire commence par la bannière vue sur GitHub.

Pendant qu'un contrôle tourne, rien à cliquer : la fenêtre interroge GitHub toutes les vingt
secondes. Quand le job se termine, sa ligne disparaît et le commentaire prend sa place, avec la
durée du job.

#### À faire : ouvrir les fichiers gardés par le contrôle

1. Cliquez sur **Files** **(1)**. Le contrôle a gardé ses rapports, et sfdx-hardis les liste sous le
   job **(2)**

  !!! tip "Pas de bouton Files ?"
      Votre sfdx-hardis est trop ancien. Ouvrez le panneau **Setup** du
      [Lab 1.1](1-1-install-vs-code-and-sfdx-hardis.md) : quand la carte `sfdx-hardis` affiche
      **Upgrade**, cliquez dessus, puis rouvrez la fenêtre. **Open job** mène aux mêmes fichiers
      en attendant : le **Summary** de l'exécution, puis **Artifacts**.

2. Cliquez sur l'un d'eux pour l'ouvrir dans VS Code : `deployment-components.csv` est la liste
   derrière **7 components would change**, une ligne par composant

   ![Le bouton Files du job de validation, ouvert sur les rapports que le job a gardés](../../_assets/annotated/vscode/pipeline-pr-window-files.png)

#### Pourquoi garder les fichiers

Vous n'aurez pas besoin de ces fichiers aujourd'hui. Ils sont là pour le jour où un contrôle passe
au rouge et où le commentaire ne suffit pas, et ils vous évitent un détour par GitHub.

<details markdown="1"><summary>Sous le capot : d'où viennent les fichiers</summary>

Le job de contrôle publie son dossier `hardis-report` sur GitHub, sous la forme d'un artifact nommé
**sfdx-hardis reports**. **Files** lance `sf hardis:git:artifacts:download` avec l'adresse du job :
la commande demande à GitHub les artifacts de cette exécution, les télécharge et les décompresse
dans `hardis-report/job-artifacts/` de votre projet. Git ignore ce dossier, donc les copies ne
finissent jamais dans un commit. Recliquez sur **Files** plus tard et rien n'est téléchargé deux
fois, sauf si le job a tourné de nouveau.

GitHub ne garde pas les artifacts indéfiniment. Une fois disparus, les fichiers déjà téléchargés
restent, et un job que vous n'avez jamais ouvert indique que ses fichiers ont expiré.

<!-- command-links:start -->
Documentation de la commande : [hardis:git:artifacts:download](https://sfdx-hardis.cloudity.com/hardis/git/artifacts/download/)
<!-- command-links:end -->

</details>

#### Vous devriez voir

- Le commentaire qui affiche **✅ Ready to merge into `integration`**, avec votre champ comme
  composant créé
- Le même commentaire dans la fenêtre de votre Pull Request dans VS Code

### 4. Merger

Objectif : US-014 mergée dans `integration`, en un seul commit.

#### À faire

1. Attendez que les deux contrôles soient verts, et que le commentaire dise **Ready to merge**
2. De retour sur l'onglet **Conversation**, faites défiler jusqu'en bas : la boîte de merge affiche
   **All checks have passed** et **No conflicts with base branch**, et le bouton est actif

   ![La boîte de merge d'une Pull Request, tous les contrôles passés](../../_assets/annotated/web/github-pr-merge.png)

3. Cliquez sur la petite flèche à droite du bouton vert **(1)**, et choisissez **Squash and merge**
   **(2)**

   ![Le menu de méthode de merge d'une Pull Request, avec Squash and merge](../../_assets/annotated/web/github-pr-merge-squash.png)

4. Vérifiez l'étiquette du bouton, puis cliquez sur **Squash and merge** et **Confirm squash and
   merge**

  !!! tip "La branche est toujours là ?"
      Cliquez sur **Delete branch**, et cochez **Settings > General > Automatically delete head
      branches** dans votre fork.

!!! warning "Le squash est pour les Pull Requests de feature, et pour rien d'autre"
    **Squash and merge** est juste dans exactement un cas : une Pull Request venant d'une branche
    de feature, une User Story ou un correctif, vers sa branche majeure. Partout ailleurs, servez-
    vous du **Merge pull request** simple : un retrofit, une branche de promotion, et toute Pull
    Request d'une branche majeure vers la suivante (`integration` vers `uat`, `uat` vers `preprod`,
    `preprod` vers `main`). Ces merges doivent garder les commits tels quels, parce que la promotion
    suivante et le retrofit suivant comparent les branches commit par commit, et un squash à cet
    endroit fait croire à git que le travail n'a jamais été mergé. Le Niveau 3 y revient.

!!! warning "Le bandeau jaune qui suit"
    Une fois qu'`integration` a bougé, la page d'accueil de votre fork peut afficher un bandeau
    jaune : **integration had recent pushes**, avec un bouton **Compare & pull request**. N'y touchez
    pas. Il propose d'envoyer `integration` vers le repository d'origine, celui que tous les
    participants ont forké, et ce n'est jamais ce que vous voulez. Si vous en avez ouvert une par
    erreur, **Close pull request** en bas de sa page l'annule, et rien de ce qui est à vous n'est
    perdu : votre branche `integration` vit dans votre fork et y reste.

#### Pourquoi

Le bouton est actif *parce que* les deux contrôles sont verts. La mise en place de votre
environnement au [Lab 1.2](1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md) a protégé `integration` : tant qu'un contrôle tourne ou est rouge, la
boîte affiche **Merging is blocked** et le bouton reste gris, pour vous comme pour n'importe qui
d'autre. C'est la règle de toute vraie pipeline, et ici GitHub l'impose au lieu de faire confiance à
chacun pour lire les contrôles d'abord.

Le squash transforme les commits de votre branche en un seul commit sur `integration`, titré comme
votre Pull Request. La story apparaît comme une seule ligne dans l'historique d'`integration` au lieu
de tous les commits intermédiaires que vous avez faits en la construisant, et une ligne est ce que
lit le release manager quand il promeut. GitHub retient la méthode que vous avez choisie la dernière
fois, c'est pourquoi vous vérifiez l'étiquette du bouton avant chaque merge.

Vous n'avez pas à supprimer la branche : votre fork le fait au merge, et GitHub le dit sous la
zone de merge. Une branche mergée qui traîne est une chose de plus dans la liste de tout le monde,
sans aucun bénéfice, et un vrai projet active donc le même réglage. Si la branche est toujours là,
votre fork a été mis en place avant que le cours n'active ce réglage.

#### Pourquoi le commentaire du linter peut afficher un avertissement

MegaLinter lit tout le repository, pas seulement votre modification, et signale tout ce qui enfreint
les règles de qualité du projet. Il écrit son verdict sur la Pull Request de la même façon que le
contrôle de déploiement. Votre modification n'en enfreint aucune, le contrôle est donc vert, et le
commentaire peut quand même afficher **Success with warnings**, avec une ligne ⚠️ pour un linter
que le projet garde non bloquant, comme l'auditeur des fichiers de workflow GitHub Actions. Qu'une
trouvaille fasse échouer le job ou non est un choix que le projet fait dans `.mega-linter.yml`,
et un job qui échoue bloque le merge, comme le contrôle de déploiement. Le
[Lab 2.5](../level-2-contributor-advanced/2-5-pass-code-quality-and-apex-test-coverage.md) vous fait rencontrer une trouvaille qui ne fait qu'avertir, et un contrôle
qui bloque.

#### Vous devriez voir

- La Pull Request mergée dans `integration`, et GitHub qui dit sous la zone de merge que la branche
  a été supprimée

### 5. Regarder le vrai déploiement

Objectif : US-014 déployée dans `helios-integration`, et `Panels Required` sur une installation de
cette org.

Merger dans `integration` démarre un deuxième job, et celui-là n'est pas un contrôle : il déploie
pour de vrai.

#### À faire

1. Revenez dans VS Code et ouvrez le panneau **DevOps Pipeline**. Regardez la pastille **(1)** sur
   la flèche qui va de la branche `integration` vers son org : pendant le déploiement, cette
   pastille le dit et clignote. La légende sous le diagramme **(2)** dit ce que chaque couleur
   signifie

   ![Le panneau DevOps Pipeline, avec le statut du déploiement sur la flèche vers l'org](../../_assets/annotated/vscode/devops-pipeline--deployment-status.png)

2. Pour voir le log, cliquez sur la pastille : GitHub s'ouvre sur le log de cette exécution,
   **Process Deployment (sfdx-hardis)**, qui prend environ trois minutes. Vous n'avez pas besoin de
   le lire aujourd'hui
3. Quand le déploiement se termine, lisez le deuxième commentaire qu'il écrit sur la Pull Request
   que vous venez de merger :

   ![Le commentaire que sfdx-hardis écrit après le déploiement de merge](../../_assets/annotated/web/github-pr-deployed.png)

   1. Le verdict **(1)** : **✅ Deployed to `integration`**, et cette fois l'org a vraiment changé
   2. **Metadata** **(2)**, sous la même forme que ce que le contrôle annonçait, avec en plus la
      façon dont il a été déployé : **✅ Full Quick Deploy: 7 components changed (1 created, 6
      updated)** là où le contrôle disait `7 components would change`
   3. **Apex tests** **(3)** : **Already run during the validation**

4. Ouvrez `helios-integration` depuis **Orgs Manager** et regardez une installation

#### Pourquoi

La flèche est l'écran à regarder, et celui que vous garderez ouvert sur un vrai projet : il répond à
"est-ce que mon travail est dans l'org" sans quitter l'éditeur. La capture a été prise plus loin dans
le cours, avec les branches des collègues à gauche d'`integration`. La vôtre ne montre que
`integration` et `uat`.

Le log est là pour le jour où quelque chose échoue, et le [Lab 3.3](../level-3-release-manager/3-3-deploy-to-integration-and-read-the-log.md) est le lab qui en lit un ligne
par ligne.

*Full*, parce que ce projet envoie le package entier à chaque fois. *Quick Deploy*, parce que le job
de merge n'est pas parti de rien : il a déployé la validation que le contrôle de Pull Request avait
déjà faite, et c'est pourquoi il a pris deux minutes plutôt que cinq. Le Quick Deploy a repris
l'exécution des tests du contrôle, donc aucun test n'a tourné à nouveau.

Vous avez construit le champ dans une org et il est arrivé dans une autre, et vous n'avez rien
déployé à la main.

`helios-uat` ne l'a pas, et ne doit pas encore l'avoir. Le travail passe d'`integration` à `uat`
quand un release manager le promeut, plusieurs stories à la fois, et c'est le Niveau 3.

<details markdown="1"><summary>Sous le capot : ce qu'ont lancé les deux jobs</summary>

Le contrôle de Pull Request a lancé :

    sf hardis:project:deploy:smart --check

`--check` est un **déploiement de validation** : Salesforce compile tout, lance les tests et rend
compte de ce qu'il ferait, puis jette le résultat. Votre org n'est pas modifiée. C'est pourquoi on
peut le lancer sans risque à chaque push.

Le job après le merge a lancé la même commande **sans** `--check`, sur la même org. Même code, même
configuration, à un flag près. Un contrôle qui passe suivi d'un déploiement qui échoue est rare, et
quand cela arrive c'est presque toujours parce que quelqu'un a modifié l'org cible à la main entre
les deux.

Les deux jobs s'authentifient d'abord, via le hook sfdx-hardis qui lit `SFDX_AUTH_URL_INTEGRATION`,
le secret que **Set up my training environment** a écrit au [Lab 1.2](1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md). Les fichiers de workflow sont
dans `.github/workflows/`, et ils valent d'être lus une fois : une trentaine de lignes chacun.

Le niveau de test vient de `config/.sfdx-hardis.yml` :

    testLevel: RunLocalTests
    apexTestsMinCoverageOrgWide: 80

`RunLocalTests` lance tous les tests de l'org sauf ceux des packages gérés. 75 % est le minimum
Salesforce, et ce projet demande 80, comme la plupart des vrais.

<!-- command-links:start -->
Documentation de la commande : [hardis:project:deploy:smart](https://sfdx-hardis.cloudity.com/hardis/project/deploy/smart/)
<!-- command-links:end -->

</details>

#### Vous devriez voir

- `Panels Required` sur une installation dans `helios-integration`
- `helios-uat` sans lui, pour l'instant

## Ce que vous devez voir

- [ ] La Pull Request mergée, avec un commentaire sfdx-hardis vert au-dessus du merge
- [ ] L'exécution **Process Deployment (sfdx-hardis)** verte dans l'onglet Actions
- [ ] `Panels Required` présent sur l'objet Installation dans `helios-integration`

C'est une boucle de livraison complète. Chaque story, pendant tout le temps que vous passerez sur ce
projet, sera cette boucle.

## En cas de problème

**La carte My Pull Request affiche encore *Pull Request not created yet*.**
Trois causes, dans l'ordre où elles arrivent :

- le panneau n'a pas regardé depuis que vous avez créé la Pull Request. Cliquez sur **Refresh** dans
  la barre du haut du panneau **DevOps Pipeline**
- VS Code est sur une autre branche. La carte parle de la branche sur laquelle vous êtes : regardez
  en bas à gauche de la barre d'état, et si elle n'indique pas `features/US-014-panels-required`,
  cliquez dessus et choisissez cette branche
- la Pull Request a été ouverte sur le repository d'origine au lieu de votre fork. Son adresse
  commence alors par `github.com/hardisgroupcom/`, et la carte ne regarde que dans votre fork.
  Fermez-la là-bas, et rouvrez-la comme le dit l'étape 1, avec **base** dans votre propre fork

Aucune n'arrête le lab : les contrôles, le commentaire et le merge des étapes 2 à 4 se passent tous
sur GitHub, et c'est là que le lab est vérifié.

**Les contrôles ne démarrent jamais.**
Actions est encore désactivé sur votre fork (`github.com/my-username/sfdx-hardis-training`). GitHub
cache cet interrupteur derrière une bannière qu'aucune commande ne peut atteindre : ouvrez l'onglet
**Actions** de votre fork et cliquez sur **I understand my workflows, go ahead and enable them**.
Relancer **Set up my training environment** ne le fera pas à votre place : il n'y a pas d'API
derrière cette bannière.

Votre branche a été poussée pendant qu'ils étaient désactivés, donc rien ne s'est exécuté dessus.
**Poussez-la à nouveau**, avec un commit de plus sur la branche, et les deux contrôles démarrent.
Rouvrir la Pull Request ne suffit pas : cela relance le contrôle de déploiement, alors que
Mega-Linter s'exécute au push, et le merge reste bloqué sur le contrôle qui n'est jamais venu.

**Le contrôle échoue à l'authentification :** *No authentication found for org integration*.
Le secret manque, est mal nommé, ou est tronqué. Il doit s'appeler exactement
`SFDX_AUTH_URL_INTEGRATION` et sa valeur doit commencer par `force://`. La réparation la plus rapide
est **Training: Level 1 > Set up my training environment**, qui le réécrit. Ouvrez ensuite l'onglet
**Checks** de votre Pull Request et cliquez sur **Re-run all jobs**.

**Le contrôle échoue avec `INVALID_CROSS_REFERENCE_KEY` sur le permission set.**
Le permission set accorde un champ qui n'est pas dans votre package. Vous avez récupéré le permission
set sans le champ. Refaites le [Lab 1.5, étape 3](1-5-retrieve-commit-and-publish-your-changes.md#3-prendre-les-votres-laisser-le-reste) et prenez les deux.

**Le contrôle reste bloqué sur "Expected".**
Le workflow attend un job qui ne tournera jamais, en général parce que la base de la Pull Request
est le repository d'origine et non votre fork.
Fermez-la et rouvrez-la avec la bonne base.

**La boîte de merge dit Merging is blocked, et le bouton est gris.**
Un contrôle requis tourne encore, ou il a échoué. Attendez-le, ou ouvrez-le depuis l'onglet
**Checks**, corrigez sur votre branche ce qu'il signale, et repoussez : les contrôles retournent tout
seuls. Il n'y a pas de contournement, et ce n'est pas censé en avoir.

**Un commit que vous n'avez pas fait, `chore(megalinter): apply linters fixes`, est sur votre branche.**
MegaLinter a reformaté un fichier de votre Pull Request et a poussé le résultat. GitHub ne relance
pas les contrôles pour un commit poussé par son propre robot : ils manquent ou sont rouges dessus, et
le merge reste bloqué. Faites **Pull** dans le panneau **Source Control** pour ramener le commit du
robot sur votre ordinateur, puis lancez **Training: Level 1 > Trigger my workflows** : c'est un push de votre
part qui relance les contrôles.

**Le déploiement réussit mais le champ n'est pas dans l'org.**
Ouvrez la section repliée **📋 ... components would change in the org** du commentaire, sous le
tableau des contrôles. Si elle n'a pas de
ligne **CustomField**, c'est que le champ n'est pas dans `manifest/package.xml`, et le [Lab 1.5, étape 6](1-5-retrieve-commit-and-publish-your-changes.md#6-lire-le-package-avant-de-pousser) est là où vous le lisez.

## Vérifiez votre travail

Welcome page > **Training: Level 1** > **Check my work**, puis choisissez le **Lab 1.6**.

## Pour aller plus loin

- [Créer la Pull Request sur GitHub](https://sfdx-hardis.cloudity.com/salesforce-devops-pull-request-github/)
- [Lire les résultats de la Pull Request](https://sfdx-hardis.cloudity.com/salesforce-devops-handle-merge-request-results/)
- [Résoudre les erreurs MegaLinter](https://sfdx-hardis.cloudity.com/salesforce-devops-solve-megalinter-errors/)

[Suite : Lab 1.7 - Épreuve finale : livrer une User Story tout seul](1-7-capstone-deliver-a-user-story-on-your-own.md){ .md-button .md-button--primary }
