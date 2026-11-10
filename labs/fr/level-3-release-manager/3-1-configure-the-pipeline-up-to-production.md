---
id: lab-3-1
title: "Lab 3.1 - Configurer la pipeline CI/CD jusqu'à la production"
description: "Étendez une pipeline Salesforce à deux étages jusqu'à la production : branches, protections, et chaque org authentifiée en JWT par Add or Reconnect a Major Org."
level: 3
lab: 1
lang: fr
source_rev: "4f8f62c54e89f9544a34f77408f47bd273af1de9"
screenshots:
  - annotated/vscode/devops-pipeline-fresh--one-column
  - annotated/vscode/devops-pipeline-level3-split
  - annotated/web/github-new-branch
  - annotated/web/github-branch-rules
  - annotated/web/github-branch-rule
  - annotated/vscode/pipeline-cards--new-user-story
  - annotated/vscode/pipeline-settings-menu--add-org
  - annotated/vscode/configure-auth-branch--branch-question
  - annotated/vscode/configure-auth-variables--secrets
  - annotated/web/github-secrets-actions
  - annotated/web/github-secret-new
  - annotated/web/github-secret-new--key
  - annotated/vscode/pipeline-config--target-branches
  - annotated/vscode/pipeline-config-user-stories--target-branches
  - annotated/vscode/pipeline-config-danger--promotion-branches
  - annotated/vscode/pipeline-config-branch-merge-target
  - annotated/vscode/pipeline-cards--save-publish
  - annotated/vscode/work-save-completed
  - annotated/vscode/devops-pipeline-level3--four-stages
  - annotated/vscode/scratch-org-pool
  - annotated/vscode/org-initialization
  - annotated/vscode/replacement-rules
depends_on:
  commands: [hardis:project:configure:auth, hardis:work:new]
  flags: []
  config: [availableTargetBranches, availableTargetBranchesLabels, productionBranch, mergeTargets, targetUsername, instanceUrl, orgAuthenticationMode, enablePromotionBranches, allowedPromotionSteps, poolConfig, orgInitSteps, replacementRules]
  panels: [pipeline, pipelineConfig, orgManager, commandExecution, promptInput, scratchOrgPool, orgInit, replacementRules]
  docs: [salesforce-devops-setup-home, salesforce-devops-setup-auth, salesforce-devops-setup-auth-github, salesforce-devops-setup-existing-org, salesforce-devops-setup-scratch-org-pool, salesforce-devops-org-initialization, salesforce-devops-config-replacement-rules]
---

# Lab 3.1 - Configurer la pipeline CI/CD jusqu'à la production

**Niveau** : 3 Release Manager

**Durée** : ~1 h 15<!-- observed --> (observé : médiane 1 h 18, 13 participants, le plus rapide 26 min)<!-- /observed -->

**Vous allez** : transformer une pipeline à deux étages en une pipeline à quatre étages qui atteint la
production, donner aux deux nouveaux étages leur org et un identifiant avec lequel un vrai projet peut
vivre, et publier tout cela de la façon dont toute modification atteint une branche majeure : par une
Pull Request.

## La situation

Ouvrez le panneau **DevOps Pipeline** et regardez ce que Victor a laissé.

![Le panneau DevOps Pipeline avec integration et uat seulement](../../_assets/annotated/vscode/devops-pipeline-fresh--one-column.png)

`integration` **(1)** et `uat`, chacune avec son org **(2)**. Le travail atteint les testeurs métier, et là il s'arrête. Il n'y a pas de
`preprod`, et `main`, la production, est une branche où rien ne déploie : toutes les livraisons
jusqu'ici ont atteint la production à la main, ce qui est exactement le genre de livraison dont
personne ne peut rien dire après coup.

Et les deux étages qui existent atteignent leurs orgs par un raccourci. La CI se connecte à
`helios-integration` et `helios-uat` avec `SFDX_AUTH_URL_INTEGRATION` et `SFDX_AUTH_URL_UAT`, deux
secrets contenant des refresh tokens OAuth de longue durée. Le Niveau 1 vous a dit que c'était une
exception pour des scratch orgs jetables. Trois choses ne vont pas avec eux sur un vrai projet :

1. Ils ne peuvent pas être renouvelés. En changer un veut dire se réauthentifier, en tant
   qu'humain, dans un navigateur
2. Ce sont des identifiants au porteur sans portée. Quiconque lit le secret dispose de tout ce
   dont cet utilisateur dispose, depuis n'importe où, jusqu'à révocation
3. Ils sont liés à une personne. Quand cette personne part ou que son token est réinitialisé, le
   pipeline s'arrête, et personne ne sait pourquoi

L'alternative est un flow JWT via une External Client App : un certificat que vous détenez, un
utilisateur pré-autorisé, aucun mot de passe nulle part, et une révocation en supprimant une
application. sfdx-hardis le met en place pour vous, org par org, et écrit la configuration de branche
au passage.

Deux orgs ici, toutes les orgs sur un vrai projet. Sur un vrai projet, chaque connexion de la CI
passe par le JWT, `integration` et `uat` compris. Ce lab le met en place pour deux orgs,
`helios-preprod` et `helios-prod`, parce que deux apprennent tout ce que quatre apprendraient.
`integration` et `uat` gardent leur raccourci du Niveau 1, ce qui vous épargne une heure à refaire
deux fois la même chose.

C'est votre première semaine. Rien de tout cela n'est inhabituel : la plupart des projets démarrent
avec les étages dont ils ont besoin le premier jour, et finir la pipeline attend le jour où quelqu'un
a besoin de livrer correctement.

## Avant de commencer

- [ ] Niveaux 1 et 2 terminés
- [ ] `helios-prod` toujours connectée dans **Orgs Manager**. C'est l'org Developer Edition à
      laquelle vous vous êtes inscrit au Niveau 1, et le Dev Hub de vos scratch orgs. À partir de ce
      lab, c'est aussi la production
- [ ] Une org Developer Edition gratuite de plus, créée sur
      [developer.salesforce.com/signup](https://developer.salesforce.com/signup) exactement comme la
      première, et connectée dans **Orgs Manager** avec l'alias `helios-preprod`
- [ ] Les deux alimentées : Welcome page > **Training: Level 3** > **Set up one of my training
      orgs**, une fois pour `helios-preprod` et une fois pour `helios-prod`. La commande commence
      par passer votre utilisateur en anglais dans cette org, s'il ne l'est pas déjà : on travaille
      dans une seule langue dans toutes les orgs d'un pipeline, parce que Salesforce nomme les
      présentations de page qu'il crée dans la langue de l'utilisateur au travail, et qu'un profil
      attribue une présentation de page par son nom
- [ ] `SFDX_AUTH_URL_INTEGRATION` et `SFDX_AUTH_URL_UAT` toujours dans votre fork, comme depuis le
      Niveau 1 : ce lab n'y touche pas
- [ ] Sur `integration` dans VS Code, avec rien en attente dans le panneau **Source Control**

La CI, pas votre poste de travail. Votre propre connexion à ces orgs existe déjà et ne change pas :
Orgs Manager continue de fonctionner exactement comme avant. Ce que vous mettez en place ici, c'est
la façon dont un runner GitHub, qui n'est pas vous et n'a pas de navigateur, atteint chaque org.

## Les étapes

### 1. Décider la forme

Objectif : la forme de la pipeline décidée, en quatre réponses.

Quatre questions, et leurs réponses sont toute la pipeline :

| Question                                                                            | Réponse Helios                                                                             |
|-------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Quelles branches sont majeures, c'est-à-dire ont une org et un job de déploiement ? | `integration`, `uat`, `preprod`, `main`                                                    |
| Quelle branche peut merger dans quelle autre ?                                      | `integration` dans `uat`, `uat` dans `preprod`, `preprod` dans `main`. Rien n'en saute une |
| Quelle branche est la production ?                                                  | `main`                                                                                     |
| D'où part un correctif urgent ?                                                     | De `preprod`, pour qu'il n'emporte jamais ce qui attend encore dans `integration` et `uat` |

#### À faire

1. Lisez les quatre réponses, et énoncez chacune en une phrase. Si vous ne savez pas le faire, les
   configurer n'y changera rien

#### Pourquoi

`preprod` gagne sa place de deux façons. C'est la dernière répétition avant la production, une org
qui contient ce que la production contient et dans laquelle personne ne travaille : une livraison qui
s'y déploie proprement n'a presque plus de surprises devant elle. Et c'est de là que partent les
hotfixes, ce dont parle le [Lab 3.7](3-7-hotfix-and-retrofit.md).

L'ordre de ce lab découle d'une règle : une branche doit exister avant qu'une org puisse lui être
attachée. Les branches viennent donc d'abord, puis leur protection, puis leurs orgs.

#### Vous devriez voir

- Les quatre réponses, chacune dite dans une phrase à vous. Rien ne change encore dans votre fork :
  les étapes suivantes construisent ce qu'elles décrivent

### 2. Créer la branche preprod

Objectif : une branche `preprod` dans votre fork, partie de `main`, et récupérée par VS Code.

`main` existe déjà : c'est la branche par défaut de tout fork. `preprod` non, et elle part de `main`,
parce qu'elle contient ce que la production contient.

#### À faire

1. Dans votre fork (votre copie personnelle du repository du cours sur GitHub, par exemple
   `github.com/my-username/sfdx-hardis-training`), ouvrez la page **Branches** : le compteur de
   branches à côté du sélecteur de branche, ou `github.com/my-username/sfdx-hardis-training/branches`
2. Cliquez sur **New branch** en haut à droite
3. Tapez `preprod` comme nom **(1)**, laissez la source sur votre fork et `main` **(2)**, et cliquez
   sur **Create new branch** **(3)**

   ![La boîte New branch de GitHub, créant preprod à partir de main](../../_assets/annotated/web/github-new-branch.png)

4. Prévenez VS Code : dans le panneau **Source Control**, menu **...**, **Pull, Push** > **Fetch**

!!! warning "Une mise à jour du cours mergée en squash revient ici"
    `preprod` prend `main` tel que votre fork l'a. Si vous avez un jour cliqué **Sync fork**, le
    bouton que GitHub affiche sur la page d'un fork pour y copier le `main` le plus récent du cours, ce
    `main` contient des changements du cours plus récents que ceux dont votre `integration` est
    partie. Aucun souci tant que chaque mise à jour du cours est arrivée dans `integration` par
    **Update my course**, qui la merge avec un merge commit. Si vous avez un jour ouvert vous-même
    une Pull Request de mise à jour du cours et l'avez mergée avec **Squash and merge**, la première
    Pull Request de `uat` vers `preprod`, à l'[étape 2 du Lab 3.6](3-6-release-to-production-and-read-dora-metrics.md#2-repeter-en-preprod), s'arrêtera sur un
    conflit dans `config/.sfdx-hardis.yml`. Le Lab 3.6 donne la sortie sous **En cas de problème**.

#### Pourquoi

Les étapes suivantes listent les branches de votre fork, et une branche que VS Code n'a pas
récupérée n'est pas dans la liste.

#### Vous devriez voir

- `preprod` sur la page **Branches** de votre fork, à côté de `main`, `integration` et `uat`

### 3. Protéger preprod et main

Objectif : quatre règles de protection de branche, `integration`, `uat`, `preprod` et `main`,
chacune exigeant une Pull Request et les deux contrôles.
Rappel : [Lab 1.2](../level-1-contributor-basics/1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md)

À partir de maintenant, personne ne pousse sur une branche majeure : ni un contributeur, ni vous.

#### À faire

1. Dans votre fork (`github.com/my-username/sfdx-hardis-training`), cliquez sur **Settings** **(1)**,
   puis **Branches** **(2)** dans le menu de gauche. Les deux règles **(4)** sont celles que la mise
   en place de votre environnement a créées au [Lab 1.2](../level-1-contributor-basics/1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md)
2. Cliquez sur **Add rule** **(3)**

   ![Les réglages Branches d'un fork, avec le bouton Add rule et les deux règles existantes](../../_assets/annotated/web/github-branch-rules.png)

3. Regardez le formulaire. Il est long, et cinq choses y comptent. L'image est la règle
   d'`integration`, ouverte depuis la liste ci-dessus : elle montre donc les valeurs que vous êtes
   sur le point de poser

   ![Une règle de protection de branche exigeant une Pull Request et deux contrôles de statut, sans dérogation](../../_assets/annotated/web/github-branch-rule.png)

4. **Branch name pattern** **(1)** : `preprod`
5. Cochez **Require a pull request before merging** **(2)**, et décochez **Require approvals** en
   dessous : vous travaillez seul ici, et GitHub ne vous laisse jamais approuver votre propre Pull
   Request. Sur un vrai projet, demandez une approbation
6. Cochez **Require status checks to pass before merging** **(3)**. Une zone de recherche apparaît en
   dessous. Tapez `Simulate` et choisissez **Simulate Deployment to Major Org**, puis tapez `Mega` et
   choisissez **Mega-Linter**. Les deux atterrissent dans **Status checks that are required** : ce
   sont les deux contrôles que lance chaque Pull Request de ce cours

   La zone de recherche ne propose que les contrôles qui ont tourné sur ce repository dans les sept
   derniers jours. Les deux ont tourné sur vos Pull Requests du Niveau 2, ils y sont donc, sauf si
   vous avez fait une longue pause : dans ce cas ouvrez d'abord n'importe quelle Pull Request vers
   `integration`, et ses contrôles les remettent dans la liste

7. Cochez **Do not allow bypassing the above settings** **(4)**. Sans cela, le propriétaire du
   repository, c'est-à-dire vous, a encore une case pour pousser ou merger quand même
8. Cliquez sur **Create** en bas. Sur une règle existante, le même bouton affiche **Save changes**
   **(5)**
9. Cliquez de nouveau sur **Add rule**, pour `main`, avec les mêmes réglages

#### Pourquoi

Toute modification atteint `integration`, `uat`, `preprod` et `main` par une Pull Request dont les
contrôles sont verts, et GitHub l'impose au lieu de faire confiance à chacun pour s'en souvenir.
Depuis le [Lab 1.2](../level-1-contributor-basics/1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md), `integration` et `uat` fonctionnent ainsi : la mise en place de l'environnement
les a protégées. `preprod` et `main` sont à vous de protéger, et un release manager le fait le jour
où les branches rejoignent la pipeline, pas après le premier mauvais merge.

Votre fork vous donne une deuxième raison. Il supprime une branche une fois sa Pull Request mergée,
et une release est une Pull Request dont la source est `preprod`. Seule une branche protégée est
conservée : sans sa règle, `preprod` partirait avec votre première release.

<details markdown="1"><summary>Sous le capot : ce que la règle impose</summary>

Un contrôle requis est reconnu par le nom de son job, pas par le fichier de workflow.
`Simulate Deployment to Major Org` est le job de `.github/workflows/check-deploy.yml`, qui tourne sur
chaque Pull Request vers les quatre branches majeures. `Mega-Linter` est le job de
`.github/workflows/megalinter.yml`, qui tourne sur chaque push, donc sur le dernier commit de chaque
Pull Request ouverte depuis une branche de votre fork.

Un workflow qui ne tourne que quand certains fichiers changent, comme `link-check.yml` ici, ne doit
jamais être requis : une Pull Request qui ne touche pas ces fichiers l'attend pour toujours, et
GitHub l'affiche comme **Expected**, jamais comme en échec.

La même règle, posée par l'API GitHub, est ce que **Set up my training environment** a fait pour
`integration` et `uat` :

    gh api -X PUT repos/<your-handle>/sfdx-hardis-training/branches/preprod/protection \
      -F "required_pull_request_reviews[required_approving_review_count]=0" \
      -f "required_status_checks[contexts][]=Simulate Deployment to Major Org" \
      -f "required_status_checks[contexts][]=Mega-Linter" \
      -F "required_status_checks[strict]=false" -F enforce_admins=true -F restrictions=null

`strict=false` est un choix : `true` exigerait en plus que chaque Pull Request soit à jour par
rapport à sa cible avant d'être mergée, ce qui, sur une `integration` chargée, veut dire mettre à
jour chaque branche ouverte après chaque merge. GitLab, Azure DevOps et Bitbucket ont les mêmes
réglages sous d'autres noms : branches protégées, politiques de branche, contrôles de merge.

</details>

#### Vous devriez voir

- Quatre règles dans la liste : `integration`, `uat`, `preprod` et `main`

### 4. Démarrer une User Story pour la configuration

Objectif : la branche `features/US-050-pipeline-up-to-production`, partie d'`integration`, sur
laquelle vous êtes positionné.
Rappel : [Lab 1.3](../level-1-contributor-basics/1-3-start-a-user-story-on-a-git-branch.md)

#### À faire

1. Dans le panneau **DevOps Pipeline**, sous **Project Contribution Workflow** **(1)**, cliquez sur
   **New User Story** **(2)**, comme au [Lab 1.3](../level-1-contributor-basics/1-3-start-a-user-story-on-a-git-branch.md)

   ![La carte New User Story du panneau DevOps Pipeline](../../_assets/annotated/vscode/pipeline-cards--new-user-story.png)

2. Vérifiez que la première ligne indique **Automatically selected target branch is integration**.
   C'est juste : `preprod` n'entre dans cette liste qu'à l'étape 9
3. **What type of User Story do you want to create?** - **Feature: a new capability or an
   improvement**
4. **What is the name of your new User Story?** - `US-050-pipeline-up-to-production`. Le cours
   vérifie les noms de User Story selon le motif `US-nnn`, et US-050 est la story du backlog pour ce
   travail
5. **Which Salesforce org do you want to work in?** - la dernière réponse, celle sans aucune org :
   **🤠 I'm hardcore, I don't need an org !**

#### Pourquoi

Chaque fichier que ce lab écrit finit sur `integration`, et `integration` n'accepte que des Pull
Requests : la protection que vous venez de regarder est ce qui refuse le reste. Avant d'écrire le
moindre fichier, placez-vous donc sur une branche à vous. La configuration est une modification comme
une autre, elle remonte la pipeline avec le reste du travail, et elle a droit à une User Story comme
n'importe quelle modification.

Aucune org, parce que rien dans ce lab ne se construit dans une org : vous modifiez les fichiers du
projet, et les commandes écrivent elles-mêmes dans les orgs.

#### Vous devriez voir

- `features/US-050-pipeline-up-to-production`, créée par la commande à partir d'`integration`, et
  vous positionné dessus. Tout ce que les étapes suivantes écrivent atterrit là

### 5. Configurer preprod et son org : Add or Reconnect a Major Org

Objectif : la commande pour `preprod` en attente à la question 9, toutes les questions d'avant
répondues.

Passons aux orgs. Une seule commande fait tout pour une branche : elle écrit la configuration de
branche, l'org dans laquelle elle déploie et la branche dans laquelle elle merge, crée l'identifiant
avec lequel la CI se connecte, et déploie l'External Client App dans l'org. Vous la lancez une fois
par branche, en commençant par `preprod`.

#### À faire : lancer la commande

1. Dans le panneau **DevOps Pipeline**, cliquez sur l'engrenage **(1)** en haut à droite et
   choisissez **Add or Reconnect a Major Org** **(2)**

   ![Le menu engrenage du panneau DevOps Pipeline, ouvert sur Add or Reconnect a Major Org](../../_assets/annotated/vscode/pipeline-settings-menu--add-org.png)

2. Repérez où elle tourne : dans un panneau qui pose une question à la fois **(1)**, avec les
   réponses à cliquer en dessous **(2)**. La voici à la deuxième question, avec `helios-preprod`
   déjà choisie

   ![La commande Add or Reconnect a Major Org demandant quelle branche git configurer](../../_assets/annotated/vscode/configure-auth-branch--branch-question.png)

#### À faire : répondre aux questions

Elle pose une douzaine de questions, dans cet ordre :

1. **Please select or login into the org you want to configure the SF CLI Authentication** -
   `helios-preprod`. La commande en fait votre org par défaut. Si elle vous redemande l'org,
   choisissez encore `helios-preprod`
2. **What is the name of the git branch you want to configure Automated CI/CD deployments from?** -
   `preprod`. La liste est construite depuis les branches de votre fork, et les branches dont le nom
   contient un `/` sont écartées, c'est pourquoi votre branche de User Story n'est pas proposée
3. **What is the base URL or domain or the org you want to connect to, as preprod related
   org ?** Prenez **☢️ Other: Dev org, Production org or DevHub org (login.salesforce.com)** :
   `helios-preprod` est une org Developer Edition, qui se connecte comme le fait la production.
   Seules les scratch orgs et les sandboxes utilisent `test.salesforce.com`. Lisez la liste plutôt
   que d'appuyer sur Entrée
4. **What are the target git branches that preprod will be able to merge in?** - `main`. C'est le
   chemin de merge de l'étape 1, écrit sous `mergeTargets`
5. **What is the Salesforce username that will be used for deployments by CI server ?** - le nom
   d'utilisateur de `helios-preprod`, qu'elle vous propose déjà rempli
6. **How do you want to provide the SSL certificate?** - **Generate a self-signed certificate
   (default)**. L'autre réponse, signé par une autorité, ne génère rien et se contente d'afficher des
   instructions
7. **Do you want sfdx-hardis to configure the SF CLI External Client App or Connected App on your
   org ?** - oui
8. **Which JWT certificate storage mode do you want?** - **ClientId + decryption key as secret
   variables + encrypted certificate as file (default)**. L'autre mode met le certificat lui-même
   dans un troisième secret et supprime le fichier
9. **Please confirm when variables have been set** - n'y répondez pas encore. Celle-ci est un
   arrêt, et l'étape 6 est ce qu'elle attend. C'est une question **Yes** ou **No**
10. Lisez les trois questions qui suivent une fois que vous avez répondu **Yes**, et répondez-y à la
    fin de l'étape 6 ci-dessous : le nom de l'External Client App, un e-mail de contact, et le
    profil à pré-autoriser. Gardez le nom proposé, `sfdxhardispreprod`. Prenez **System
    Administrator** : les versions récentes de sfdx-hardis le sélectionnent pour vous, et si rien
    n'est sélectionné dans votre liste, sélectionnez-le. La
    liste affiche les noms de profils dans la langue de l'utilisateur de l'org : une org réglée en
    français liste donc `Administrateur système` à la place

#### Vous devriez voir

- Le panneau arrêté sur **Please confirm when variables have been set**, avec **Yes** et **No** à
  cliquer

### 6. Stocker les deux secrets, puis laisser la commande finir

Objectif : `SFDX_CLIENT_ID_PREPROD` et `SFDX_CLIENT_KEY_PREPROD` stockés dans votre fork, et la
commande terminée pour `preprod`.

La CI a besoin de deux secrets :

| Nom                       | Valeur                                   |
|---------------------------|------------------------------------------|
| `SFDX_CLIENT_ID_PREPROD`  | la consumer key affichée par la commande |
| `SFDX_CLIENT_KEY_PREPROD` | la passphrase affichée par la commande   |

#### À faire

1. Repérez les deux valeurs dont la CI a besoin, affichées juste au-dessus de la question 9 **(2)**,
   chacune avec un bouton de copie. Le panneau garde chaque question à laquelle vous avez répondu
   **(1)**, et les fichiers qu'il a écrits sont dans la barre de rapports en bas **(3)**

   ![La commande Add or Reconnect a Major Org affichant les deux secrets et attendant qu'ils soient stockés](../../_assets/annotated/vscode/configure-auth-variables--secrets.png)

2. Dans votre fork (`github.com/my-username/sfdx-hardis-training`), ouvrez **Settings > Secrets and
   variables > Actions (1)**, puis cliquez sur **New repository secret (2)**. La page liste les noms
   des secrets que le repository détient et jamais leurs valeurs **(3)**

   ![Là où un fork garde les valeurs que sa CI lit](../../_assets/annotated/web/github-secrets-actions.png)

3. Remplissez le premier secret, `SFDX_CLIENT_ID_PREPROD`, avec la consumer key. Chaque secret est
   un formulaire : le **Name (1)**, le **Secret (2)** collé depuis le panneau, puis **Add secret
   (3)**

   ![Le formulaire New secret, avec le nom et la valeur copiée depuis le panneau](../../_assets/annotated/web/github-secret-new.png)

4. Puis le second. Cliquez de nouveau sur **New repository secret**, et remplissez le même
   formulaire avec `SFDX_CLIENT_KEY_PREPROD` et la passphrase. C'est celui qu'on oublie, et sans lui
   la CI a une clé qu'elle ne peut pas ouvrir

   ![Le formulaire New secret rempli avec SFDX_CLIENT_KEY_PREPROD et la passphrase copiée depuis le panneau](../../_assets/annotated/web/github-secret-new--key.png)

5. Vérifiez que les deux noms sont dans la liste
6. Ouvrez `.github/workflows/process-deploy.yml` et lisez son bloc `env:` une fois, parce que sur
   votre propre projet ce bloc, c'est à vous de l'écrire
7. Répondez maintenant **Yes** à la question 9, répondez aux trois dernières questions, et laissez
   la commande créer l'application

!!! warning "Attention"
    Ne fermez pas le panneau avant d'avoir stocké les deux secrets : rien ne réaffiche les deux
    valeurs.

#### Pourquoi

Rien, pas même GitHub, ne peut vous remontrer une valeur stockée. C'est toute la raison pour
laquelle le panneau vous demande de ne pas le fermer.

Le suffixe des deux noms est le nom de la branche en majuscules. C'est toute la convention, et c'est
pourquoi les noms ne sont pas arbitraires.

L'avertissement orange sur votre YAML de pipeline : sous les deux valeurs, le panneau avertit que sur
GitHub un secret doit aussi être passé au job dans `.github/workflows/*.yml`. Il a raison, et c'est
l'étape que les gens oublient : un secret que GitHub détient et que le workflow ne lit jamais est un
secret dont le job ne dispose pas. Les workflows de ce cours passent déjà les huit,
`SFDX_CLIENT_ID_*` et `SFDX_CLIENT_KEY_*` pour les quatre branches, et ce lab en remplit quatre.

Ce qu'elle a écrit, et où :

| Quoi                                 | Où                                                                        | Ce que c'est                                          |
|--------------------------------------|---------------------------------------------------------------------------|-------------------------------------------------------|
| La configuration de branche          | `config/branches/.sfdx-hardis.preprod.yml`                                | `targetUsername`, `instanceUrl` et `mergeTargets`     |
| Une clé privée chiffrée              | `config/branches/.jwt/preprod.key`                                        | L'identifiant lui-même, destiné à être commité        |
| Un certificat                        | `preprod.crt` dans votre dossier personnel, supprimé après le déploiement | Ce qui est téléversé dans l'org                       |
| Une définition d'External Client App | déployée dans l'org par la commande                                       | Ce contre quoi Salesforce authentifie                 |
| Deux valeurs à stocker comme secrets | affichées dans le panneau de la commande                                  | `SFDX_CLIENT_ID_PREPROD` et `SFDX_CLIENT_KEY_PREPROD` |

La clé privée est chiffrée, avec une passphrase que la commande génère au hasard et que seul
votre secret détient. Le repository seul ne suffit pas à s'authentifier, et c'est ce qui rend
acceptable de commiter la clé.

#### Vous devriez voir

- `SFDX_CLIENT_ID_PREPROD` et `SFDX_CLIENT_KEY_PREPROD` dans la liste des secrets de votre fork
- La commande terminée, avec `config/branches/.sfdx-hardis.preprod.yml` et
  `config/branches/.jwt/preprod.key` écrits

### 7. Vérifier l'autorisation qu'elle a faite pour vous

Objectif : la pré-autorisation de l'External Client App de `preprod` vue une fois, pour savoir où
elle est.

L'étape contre laquelle tout le monde vous met en garde, pré-autoriser l'application, est celle que
la commande a déjà faite : l'External Client App qu'elle déploie porte
`Admin approved users are pre-authorized` et le profil que vous avez nommé à la dernière question.
Regardez-la une fois, pour savoir où elle est le jour où cela compte.

#### À faire

1. Dans `helios-preprod`, ouvrez **Setup > External Client App Manager**
2. Ouvrez l'application sous le nom que vous lui avez donné, `sfdxhardispreprod` si vous ne l'avez
   pas changé. Tout caractère autre qu'une lettre ou un chiffre a été remplacé par `_`
3. Au-dessus des onglets, vérifiez que **App Authorization** affiche *Admin approved users are
   pre-authorized*
4. Dans l'onglet **Policies**, sous **App Policies**, vérifiez que **Selected Profiles** liste le
   profil

#### Pourquoi

Cela compte à cause du seul chemin où ce n'est pas fait pour vous : si le déploiement de
l'application échoue et que la commande retombe sur l'affichage d'instructions manuelles, ces
instructions s'arrêtent au téléversement du certificat. Suivez-les à la lettre et la première
connexion de CI échoue avec `user hasn't approved this consumer`, un message exact qui se lit comme
un bug.

#### Vous devriez voir

- *Admin approved users are pre-authorized* sous **App Authorization**, et le profil sous
  **Selected Profiles**

### 8. La même chose pour main

Objectif : `main` configurée sur `helios-prod` avec ses deux secrets, et `uat` qui merge dans
`preprod`.

Même engrenage, **Add or Reconnect a Major Org**, une fois de plus, pour la production :

| Branche | Org           | Réponse pour l'URL de base                                                 | Merge dans     | Secrets                                       |
|---------|---------------|----------------------------------------------------------------------------|----------------|-----------------------------------------------|
| `main`  | `helios-prod` | **☢️ Other: Dev org, Production org or DevHub org (login.salesforce.com)** | ne cochez rien | `SFDX_CLIENT_ID_MAIN`, `SFDX_CLIENT_KEY_MAIN` |

#### À faire : configurer main

1. Dans le panneau **DevOps Pipeline**, cliquez sur l'engrenage et choisissez **Add or Reconnect a
   Major Org**, et répondez comme pour `preprod`, avec les valeurs du tableau ci-dessus
2. Une réponse diffère de celles de `preprod`. À **What are the target git branches that main will
   be able to merge in?**, la liste propose `integration`, `uat` et `preprod` : n'en cochez aucune
   et validez la réponse vide
3. Stockez les deux secrets, l'ID et la clé, comme à l'étape 6. Répondez ensuite **Yes** à
   **Please confirm when variables have been set**, puis aux trois dernières questions comme à
   l'étape 6 : gardez le nom `sfdxhardismain`, donnez votre e-mail, et prenez **System
   Administrator**
4. Regardez maintenant le panneau **DevOps Pipeline**. Il dessine deux morceaux séparés,
   `integration` → `uat` et `preprod` → `main`, sans rien entre `uat` et `preprod`. Ce trou est
   normal, et les tâches suivantes le comblent

   ![Le DevOps Pipeline au milieu de l'étape 8 : integration vers uat, et preprod vers main, sans flèche entre uat et preprod](../../_assets/annotated/vscode/devops-pipeline-level3-split.png)

!!! warning "Attention"
    Vérifiez l'org deux fois : pointer la production vers la mauvaise org est l'erreur la plus
    coûteuse disponible dans ce lab.

#### À faire : dire à uat où va son travail

1. Dans le panneau **DevOps Pipeline**, menu engrenage, cliquez sur **Configure Pipeline Settings**
2. Passez le sélecteur de portée en haut à droite sur **Branch: uat** **(1)**
3. Ouvrez l'onglet **Deployment** **(2)** et cliquez sur **Edit**
4. Dans **Merge target branches** **(3)**, saisissez `preprod`
5. Cliquez sur **Save** **(4)**, qui a pris la place d'**Edit**

   ![L'onglet Deployment des réglages de la branche uat, déverrouillé, avec preprod comme cible de merge](../../_assets/annotated/vscode/pipeline-config-branch-merge-target.png)

#### Pourquoi

`main` est la fin du pipeline, et ne merge dans rien.

Quatre secrets, deux External Client Apps, deux clés. Fastidieux une fois, puis plus jamais.

La commande a écrit que `preprod` se merge dans `main`. Rien n'a encore dit que `uat` se merge dans
`preprod` : jusqu'ici `uat` était la fin du pipeline, et son fichier de branche le dit. Sans cela le
diagramme ne dessine aucune flèche de `uat` vers `preprod`, et le [Lab 3.6](3-6-release-to-production-and-read-dora-metrics.md) n'a pas de pastille
**+ PR** où cliquer. L'étape 11 le publie avec le reste.

#### Vous devriez voir

- `SFDX_CLIENT_ID_MAIN` et `SFDX_CLIENT_KEY_MAIN` dans la liste des secrets de votre fork
- Le diagramme qui dessine une seule ligne de quatre branches, `integration` → `uat` → `preprod` →
  `main`, comme sur l'image de l'[étape 12](#12-regarder-le-diagramme-de-nouveau)

### 9. Laisser les contributeurs démarrer un hotfix

Objectif : `preprod` proposée aux contributeurs comme branche cible, avec son libellé.

Les contributeurs choisissent où va une User Story dans une liste, et `preprod` n'y est pas encore.
Les deux lignes à avoir à la fin :

| Ligne | Branche     | Libellé                                                               |
|-------|-------------|-----------------------------------------------------------------------|
| 1     | integration | `The shared integration org, where every contributor merges`          |
| 2     | preprod     | `Hotfixes on the production version, agreed with the release manager` |

#### À faire

1. Ouvrez le panneau **DevOps Pipeline**, le menu engrenage, **Configure Pipeline Settings**. Le
   titre de la page indique **Global Pipeline Settings**, et le sélecteur de portée **(1)** indique
   **Global Settings**

   ![L'écran Global Pipeline Settings, avec le sélecteur de portée, le bouton Edit et l'onglet User Stories](../../_assets/annotated/vscode/pipeline-config--target-branches.png)

2. Cliquez sur **Edit** **(2)**, puis sur l'onglet **User Stories** **(3)**
3. Repérez les deux champs qui comptent. Ce sont deux zones de texte distinctes, une valeur par
   ligne : **Available PR/MR target branches (1)** et **Labels for available PR/MR target branches
   (2)**

   ![Les deux listes de branches cibles de l'onglet User Stories, déverrouillées pour édition](../../_assets/annotated/vscode/pipeline-config-user-stories--target-branches.png)

4. Aujourd'hui chacune contient une seule ligne, celle qu'un contributeur choisit depuis le Niveau 1.
   Ajoutez une deuxième ligne à chacune, à la même position, comme dans le tableau ci-dessus
5. **Save (3)**

#### Pourquoi

Rien n'apparie les deux zones sinon leur ordre : la ligne 2 de l'une appartient donc à la ligne 2 de
l'autre.

`uat` et `main` ne sont pas dans cette liste, exprès. Personne ne construit une User Story contre
elles : le travail atteint `uat` par promotion depuis `integration`, et `main` par promotion depuis
`preprod`.

Vous cherchez la branche de production ? `productionBranch` n'a pas de champ dans le panneau de
réglages, et ce projet la porte déjà : `productionBranch: main`, dans le bloc Pipeline de
`config/.sfdx-hardis.yml`. Qu'un panneau couvre l'essentiel d'une configuration et pas la totalité
est normal, et c'est pourquoi les sections sous le capot de ce cours continuent de vous montrer le
fichier.

#### Vous devriez voir

- Deux lignes dans chaque zone : `integration` et son libellé, puis `preprod` et son libellé

### 10. Activer les promotion branches, pour une semaine que vous espérez ne pas avoir

Objectif : les promotion branches activées, avec une étape autorisée, `uat` vers `preprod`.

Un réglage de plus, sur le même panneau, et c'est le seul de ce lab que vous activez pour quelque
chose qui n'est pas encore arrivé.

La plupart des semaines, un release manager promeut une branche entière : tout ce qui est dans `uat`
part vers `preprod` ensemble, parce que c'est la version que les testeurs ont testée. Certaines
semaines, le métier valide une story et pas celle d'à côté, et la date de livraison ne bouge pas.
sfdx-hardis a une fonctionnalité en Beta pour cette semaine-là, les promotion branches, et le
[Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) est l'endroit où vous vous en servez.

#### À faire

1. Toujours dans **Pipeline Settings**, portée **Global Settings**, ouvrez l'onglet **Danger Zone**

   ![La Danger Zone des Global Pipeline Settings, avec les deux réglages des promotion branches](../../_assets/annotated/vscode/pipeline-config-danger--promotion-branches.png)

2. Lisez l'avertissement sur lequel l'onglet s'ouvre, *Use these settings with caution, be sure to
   understand their impact as they drift from DevOps best practices* : il vaut pour chaque réglage
   qui s'y trouve, celui-ci compris
3. Cliquez sur **Edit**
4. Activez **Enable promotion branches (Beta)** **(1)**
5. Ajoutez une ligne à **Allowed promotion steps (Beta)** **(2)** :
   - **Source branch** : `uat`
   - **Target branch** : `preprod`
6. Cliquez sur **Save**

#### Pourquoi

Le second réglage est exigé par le premier, et c'est une vraie décision plutôt que de la paperasse :
il dit qu'un release manager sur ce projet peut assembler un sous-ensemble en entrant dans `preprod`,
l'étape juste avant la production, et nulle part ailleurs. `sf hardis:project:promotion:create`
refuse de tourner tant que la liste est absente, au lieu de deviner que chaque branche majeure peut
promouvoir vers toutes les autres.

Rien ne change aujourd'hui. Avec la fonctionnalité active et aucune branche `promotion/...` dans
le repository, la pipeline se comporte exactement comme il y a une minute. Elle est activée
maintenant à cause de l'endroit où le réglage doit se trouver au [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md), et le bloc ci-dessous
explique pourquoi ce n'est pas évident.

<details markdown="1"><summary>Sous le capot : pourquoi cela ne peut pas attendre le lab qui en a besoin</summary>

`config/.sfdx-hardis.yml` a gagné :

    enablePromotionBranches: true
    allowedPromotionSteps:
      - source: uat
        target: preprod

Une promotion branch est coupée depuis sa branche **cible**, et le job de déploiement de sa Pull
Request lit donc la configuration que porte `preprod`, pas celle que porte `integration`. Une
configuration de projet n'atteint `preprod` qu'en remontant la pipeline avec les promotions, ce qui
sur ce cours arrive aux Labs 3.5 et 3.6.

Activez la fonctionnalité ici et elle arrive toute seule dans `uat`, `preprod` et `main`, avec le
reste de la configuration de la pipeline, à temps pour le [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md). Activez-la au [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md) et vous vous
devez trois merges avant de pouvoir vous en servir, ce qui est exactement le genre de détail qui fait
passer une fonctionnalité Beta pour cassée alors qu'elle est seulement en retard.

</details>

#### Vous devriez voir

- **Enable promotion branches (Beta)** activé, et une ligne dans **Allowed promotion steps (Beta)** :
  `uat` vers `preprod`

### 11. Publier la configuration par une Pull Request

Objectif : votre Pull Request de configuration mergée dans `integration`, et votre `integration`
mise à jour.
Rappel : [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md), [Lab 1.6](../level-1-contributor-basics/1-6-pull-request-deployment-check-and-merge.md)

Tout ce que vous avez fait est constitué de fichiers sur votre disque, sur la branche de User Story
de l'étape 4 : les deux nouveaux fichiers de branche, les deux clés, les branches cibles et les deux
réglages des promotion branches. Ils atteignent `integration` comme toute modification, par une Pull
Request aux contrôles verts. La protection de l'étape 3 refuserait tout le reste.

Vous les publiez comme vous avez publié une User Story au Niveau 1, avec les mêmes boutons.

#### À faire

1. Commitez-les. Dans le panneau **Source Control**, stagez les fichiers de configuration et
   commitez-les sous `US-050 Configure the pipeline up to production`, exactement comme vous stagiez
   de la métadonnée au [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md). Gardez le numéro de la story au début
2. Publiez. Dans le panneau **DevOps Pipeline**, cliquez sur la carte **Save / Publish** **(1)**,
   celle par laquelle chaque story est passée depuis le [Lab 1.5](../level-1-contributor-basics/1-5-retrieve-commit-and-publish-your-changes.md). Elle ne demande pas la branche
   cible : New User Story a enregistré `integration` à l'étape 4

   ![La carte Save / Publish du panneau DevOps Pipeline](../../_assets/annotated/vscode/pipeline-cards--save-publish.png)

3. Répondez que votre commit est prêt et qu'elle peut pousser : elle commite ce qui reste, lance le
   nettoyage, et pousse la branche
4. Ouvrez la Pull Request. Quand elle se termine, la barre d'actions du bas commence par **Create
   Pull Request** **(1)**. Cliquez : l'extension ouvre GitHub sur la page de Pull Request de cette
   branche, déjà pointée sur `integration`

   ![La fin de la commande Save / Publish, avec sa barre d'actions](../../_assets/annotated/vscode/work-save-completed.png)

   La même barre porte le `package.xml` généré par la commande **(2)** et les deployment actions de
   cette Pull Request **(3)**, comme au [Lab 1.6](../level-1-contributor-basics/1-6-pull-request-deployment-check-and-merge.md). Cette branche ne change aucune métadonnée, les deux
   sont donc courts

5. Vérifiez que le titre de la Pull Request commence aussi par le numéro de la story, quitte à le
   corriger
6. Quand les deux contrôles sont verts, mergez comme le dit la ligne **How to merge** du commentaire
   du contrôle : **Squash and merge**, comme pour toute User Story
7. Revenez sur `integration`, depuis le nom de branche en bas à gauche de VS Code, et faites **Pull**
   dans le panneau **Source Control**

#### Pourquoi

Le titre de la Pull Request devient le commit du squash, et c'est lui qui relie cette configuration à
US-050 dans les release notes du [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md), bien après la disparition du nom de branche.

Le contrôle de cette Pull Request se connecte à `helios-integration`, et il le fait toujours avec
`SFDX_AUTH_URL_INTEGRATION` : un contrôle vert ici ne dit donc rien de vos clés. Elles font leurs
preuves la première fois qu'une Pull Request entre dans `preprod` puis dans `main`, au
[Lab 3.6](3-6-release-to-production-and-read-dora-metrics.md), qui vous dit où regarder.

La configuration voyage quand même vers `uat`, `preprod` et `main` avec les promotions, sous la forme
de ce commit unique.

Le raccourci que ce cours garde pour plus tard : **Training: Level 3** > **Publish my pipeline
configuration** fait tout ce qui précède en un clic : branche, commit, push, Pull Request. Les Labs
3.5 et 3.8 s'en servent, maintenant que vous avez vu ce qu'il recouvre. Un vrai projet n'a pas une
telle entrée de menu, et c'est pourquoi ce lab le fait à la main.

<details markdown="1"><summary>Sous le capot : ce que fait vraiment le flow JWT</summary>

La commande a lancé :

    sf hardis:project:configure:auth

et chaque job de CI sur `preprod` ou `main` lance maintenant, avant toute chose :

    sf org login jwt \
      --client-id $SFDX_CLIENT_ID_PREPROD \
      --jwt-key-file <clé déchiffrée> \
      --username <targetUsername de la config de branche> \
      --instance-url <instanceUrl de la config de branche> \
      --alias preprod

La clé privée est déchiffrée au début du job avec `SFDX_CLIENT_KEY_PREPROD`, utilisée, et jamais
écrite quelque part de durable.

Comment le hook d'authentification choisit. Pour une branche `<B>`, il cherche d'abord
`SFDX_AUTH_URL_<B>`, dans cette orthographe puis en majuscules. S'il en trouve une, il s'en sert et
s'arrête, avant même que les variables JWT soient lues. Ce n'est que s'il n'y en a aucune qu'il
continue vers `SFDX_CLIENT_ID_<B>` plus la clé. Cet ordre est la raison pour laquelle `integration`
et `uat` continuent de fonctionner sans rien changer : leur secret d'auth URL est trouvé en premier,
et elles n'ont aucune clé à chercher.

La recherche JWT accepte aussi un `SFDX_CLIENT_ID` tout court sans suffixe, en dernier recours et
avec un avertissement dans le log : un secret unique sans suffixe resté d'une ancienne installation
répond pour toutes les branches.

`config/.sfdx-hardis.yml` indique toujours `orgAuthenticationMode: secretsOnly`, et c'est voulu. Ce
réglage dit seulement au panneau DevOps Pipeline quelle forme attendre, et aucune commande CLI ne le
lit : `encryptedCert` ferait avertir le panneau des clés manquantes d'`integration` et d'`uat`, qui
sur ce cours restent sur leur auth URL.

<!-- command-links:start -->
Documentation de la commande : [hardis:project:configure:auth](https://sfdx-hardis.cloudity.com/hardis/project/configure/auth/)
<!-- command-links:end -->

</details>

<details markdown="1"><summary>Sous le capot : les fichiers que vous venez de publier</summary>

`config/.sfdx-hardis.yml` a gagné :

    availableTargetBranches:
      - integration
      - preprod
    availableTargetBranchesLabels:
      - "The shared integration org, where every contributor merges"
      - "Hotfixes on the production version, agreed with the release manager"
    enablePromotionBranches: true
    allowedPromotionSteps:
      - source: uat
        target: preprod

et `config/branches/` contient maintenant quatre fichiers, chacun avec `targetUsername`,
`instanceUrl` et `mergeTargets`, plus un dossier `.jwt` avec deux clés chiffrées, `preprod.key` et
`main.key`.

Une branche majeure n'est déclarée "majeure" nulle part. Elle le devient en ayant un fichier de
configuration de branche avec une org dedans. C'est tout le mécanisme, et le savoir veut dire que
vous pouvez lire n'importe quel projet sfdx-hardis en deux minutes en listant `config/branches/`.
Chaque écran qui lit les branches majeures, le diagramme de la pipeline et le sélecteur de portée de
Pipeline Settings compris, lit ce dossier.

`sf hardis:project:create` aurait généré le squelette d'un nouveau projet : les workflows de chaque
fournisseur git, `.mega-linter.yml`, `projectName`, `developmentBranch` et `autoCleanTypes`. Il
n'écrit aucun fichier `config/branches/` et ne demande aucune org à part le Dev Hub : les fichiers
de branche sont le travail d'Add or Reconnect a Major Org, comme ci-dessus. La commande qui prend une org
existante sans aucun repository et produit le premier commit est `sf
hardis:org:retrieve:sources:dx`, le vrai point de départ de la plupart des projets.

<!-- command-links:start -->
Documentation des commandes : [hardis:project:create](https://sfdx-hardis.cloudity.com/hardis/project/create/), [hardis:org:retrieve:sources:dx](https://sfdx-hardis.cloudity.com/hardis/org/retrieve/sources/dx/)
<!-- command-links:end -->

</details>

#### Vous devriez voir

- Votre Pull Request de configuration mergée dans `integration`
- Votre `integration` qui récupère la configuration, mergée

### 12. Regarder le diagramme de nouveau

Objectif : la pipeline à quatre étages que vous avez construite, sur le diagramme.

#### À faire

1. Ouvrez le panneau **DevOps Pipeline** et cliquez sur **Refresh**. Voici la pipeline que vous
   avez construite :

   ![Le panneau DevOps Pipeline avec quatre branches majeures, chacune déployant dans son org](../../_assets/annotated/vscode/devops-pipeline-level3--four-stages.png)

#### Pourquoi

Ce diagramme est désormais la vérité sur ce projet, et ce que vous montrez du doigt quand une partie
prenante demande "alors, ça en est où ?". Les boutons **+ PR** sur les flèches sont les Pull Requests
de promotion, et le [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md) est la première fois que vous en cliquez un.

#### Vous devriez voir

1. **`integration`** **(1)**, là où les contributeurs mergent, avec la flèche de promotion qui en
   part
2. **`uat`** **(2)**, là où le métier valide
3. **`preprod`** **(3)**, la répétition de la production, et le point de départ des hotfixes
4. **`main`** **(4)**, la production
5. Les quatre orgs **(5)**, une par branche, dans l'ordre où le travail les traverse

## Trois réglages que ce cours laisse de côté

Helios est un petit projet, et trois réglages restent éteints pendant tout le cours. Vous les
rencontrerez sur un vrai projet. Chacun se règle une fois, en général par le release manager ou un
tech lead, et sa page de documentation explique comment. Rien à faire ici : regardez les images et
retenez qu'ils existent.

Pool de scratch orgs. Créer une scratch org et y charger le projet peut prendre vingt minutes. Un
pool en garde quelques-unes prêtes : un job planifié les crée et les initialise chaque nuit, et
**New User Story** en prend une en quelques secondes. Helios crée ses scratch orgs une seule fois,
dans **Set up my training environment**, il n'a donc pas de pool. Le panneau est **Scratch Org
Pool**, dans les commandes **Setup Configuration**. Voir
[Mettre en place un pool de scratch orgs](https://sfdx-hardis.cloudity.com/salesforce-devops-setup-scratch-org-pool/).

![Le panneau Scratch Org Pool, avec quatre scratch orgs prêtes sur cinq](../../_assets/annotated/vscode/scratch-org-pool.png)

Initialisation des orgs (Beta). Elle liste ce que reçoit chaque nouvelle scratch org ou sandbox,
dans l'ordre : packages, sources du projet, permission sets, données, scripts Apex. Le pool exécute
les mêmes étapes quand il se remplit. Menu engrenage du DevOps Pipeline, **Configure Org
Initialization**. Voir
[Initialiser les scratch orgs et les sandboxes](https://sfdx-hardis.cloudity.com/salesforce-devops-org-initialization/).

![Le panneau Org Initialization, avec les étapes que recevrait une nouvelle scratch org Helios](../../_assets/annotated/vscode/org-initialization.png)

Règles de remplacement (Beta). Certaines métadonnées doivent changer d'une org à l'autre : une URL
d'endpoint, un mot de passe lu dans un secret de la CI, une permission que la production ne doit pas
accorder. Une règle de remplacement modifie les fichiers juste avant chaque déploiement, pour l'org
visée, et le repository garde une seule version. Helios pourrait s'en servir : chaque org réserve ses
lots de panneaux auprès de son propre système d'entrepôt, et le remote site `Helios_Warehouse`
contient une seule URL dans git, là où une règle mettrait l'URL de chaque org. Votre fork n'a aucune
règle, et son panneau est vide : l'image montre ce qu'Helios aurait s'il s'en servait. Menu engrenage du DevOps Pipeline, **Configure Replacement Rules**. Voir
[Règles de remplacement](https://sfdx-hardis.cloudity.com/salesforce-devops-config-replacement-rules/).

![Le panneau Replacement Rules, avec l'URL d'entrepôt de chaque org Helios](../../_assets/annotated/vscode/replacement-rules.png)

## Ce que vous devez voir

- [ ] Quatre règles de protection de branche dans **Settings** > **Branches** de votre fork,
      `integration`, `uat`, `preprod` et `main`, chacune exigeant une Pull Request et les deux contrôles
- [ ] `config/branches/` sur `integration` contenant quatre fichiers et deux fichiers `.jwt/*.key`,
      `preprod.key` et `main.key`
- [ ] Quatre nouveaux secrets dans votre fork, `SFDX_CLIENT_ID_PREPROD`, `SFDX_CLIENT_KEY_PREPROD`,
      `SFDX_CLIENT_ID_MAIN` et `SFDX_CLIENT_KEY_MAIN`, à côté des deux secrets d'auth URL du Niveau 1
- [ ] Votre Pull Request de configuration mergée dans `integration`
- [ ] Le panneau DevOps Pipeline avec quatre colonnes
- [ ] `enablePromotionBranches` et une étape autorisée dans la Danger Zone de Pipeline Settings, qui ne
      font rien jusqu'au [Lab 3.10](3-10-promote-a-subset-with-promotion-branches.md)

## En cas de problème

**Add or Reconnect a Major Org s'arrête tout de suite sur `You need openssl to be locally installed to run this command.`**
La commande génère le certificat avec openssl, et VS Code ne le trouve pas. Sous Windows il est
fourni avec Git, dans son dossier `usr\bin`, qui n'est pas toujours dans le PATH. Tapez
`variables d'environnement` dans la recherche Windows, ouvrez **Modifier les variables
d'environnement pour votre compte**, et ajoutez `C:\Program Files\Git\usr\bin` à **Path**. Fermez
ensuite complètement VS Code, rouvrez-le, et relancez la commande.

**preprod n'est pas dans la liste de branches d'Add or Reconnect a Major Org.**
VS Code ne l'a pas récupérée. Panneau **Source Control**, menu **...**, **Pull, Push** > **Fetch**,
puis relancez la commande.

**La liste d'orgs propose une org `helios-` qui n'existe plus.**
Cela arrive quand une scratch org a expiré et que **Set up my training environment** en a construit
une nouvelle sous le même alias : la commande liste les orgs depuis un cache, et le cache contient
encore l'ancienne. La choisir fait s'arrêter la commande juste après "Selected Org", sans qu'aucune
question soit posée. La dernière réponse de la liste est la sortie :
**😱 I already authenticated my org but I don't see it !** vide ce cache. Relancez ensuite
**Add or Reconnect a Major Org** et la liste est juste.

**La colonne preprod apparaît sans org.**
Le fichier de branche a été écrit pour un autre nom de branche. Cherchez une faute de frappe dans
`config/branches/` : le nom du fichier doit correspondre exactement à la branche.

**`user hasn't approved this consumer`.**
Étape 7 : l'External Client App existe mais l'utilisateur n'est pas pré-autorisé.

**`invalid_grant: audience is invalid`.**
L'URL d'instance ne correspond pas au type d'org : `https://test.salesforce.com` pour une scratch
org ou une sandbox, `https://login.salesforce.com` pour une org Developer Edition. Vérifiez le
fichier de branche du job qui a échoué.

**Le job n'arrive pas à déchiffrer la clé.**
`SFDX_CLIENT_KEY_<BRANCHE>` manque, est fausse, ou a été copiée avec un saut de ligne à la fin.
Recréez-la.

**`client identifier invalid`.**
L'External Client App derrière cette consumer key n'a jamais été créée : la commande s'est arrêtée
après avoir affiché les deux valeurs. Relancez **Add or Reconnect a Major Org** pour cette branche, stockez les
deux nouvelles valeurs, et republiez.

**Add or Reconnect a Major Org s'arrête en demandant si vous avez supprimé l'External Client App.**
Vous lancez la commande une deuxième fois pour cette branche, et l'app qu'elle déploie est déjà dans
l'org : elle vous demande donc de retirer l'ancienne d'abord (*External Client App named
`sfdxhardis<branche>` already exists ... Have you deleted it?*). Dans l'org, **Setup > External
Client App Manager**, supprimez cette app, puis répondez oui. C'est le chemin normal dès que l'une
des entrées ci-dessus vous renvoie dans **Add or Reconnect a Major Org**.

**Add or Reconnect a Major Org s'arrête juste après "Selected Org", sans poser aucune question.**
La liste des orgs a proposé un org `helios-` qui n'existe plus, en général parce qu'un scratch org a
été reconstruit sous le même alias. Voir l'entrée ci-dessus : la dernière réponse de la liste,
**I already authenticated my org but I don't see it !**, vide ce cache.

**Save / Publish est refusé, et vous êtes encore sur `integration`.**
L'étape 4 a été sautée : les fichiers ont donc été écrits sur `integration`, qui n'accepte rien
directement. **Ctrl+Shift+P**, **Git: Create Branch...**, et nommez-la
`features/US-050-pipeline-up-to-production` : la nouvelle branche part de là où vous êtes, avec votre
commit et tout fichier pas encore commité. Puis relancez **Save / Publish**. Si au contraire un
fichier de configuration que vous avez modifié a aussi été modifié sur GitHub, tirez dans le panneau
**Source Control**, puis republiez.

**GitHub affiche une page Confirm access quand vous cliquez sur Create, ou sur Add secret.**
GitHub redemande qui vous êtes avant un changement sensible, quand vous ne l'avez pas confirmé
depuis quelques heures. Confirmez avec la méthode proposée, GitHub Mobile, une passkey ou un code
par e-mail. Regardez ensuite la liste : si la règle ou le secret n'y est pas, remplissez le
formulaire à nouveau.

**Le contrôle que vous voulez exiger n'est pas proposé.**
GitHub ne liste que les contrôles qui ont rendu compte sur ce repository dans les sept derniers
jours. Ouvrez une Pull Request vers `integration`, laissez ses contrôles tourner, et revenez à la
règle.

**La Pull Request attend sur `Expected - Waiting for status to be reported`, et son onglet Checks
est vide.**
Rien n'a tourné : GitHub n'a pas lancé les workflows de votre fork, donc les deux contrôles que ce
lab a rendus obligatoires n'ont jamais rendu compte, et le merge les attend. Ouvrez l'onglet
**Actions** de votre fork (`github.com/my-username/sfdx-hardis-training`). Un bandeau avec **I
understand my workflows, go ahead and enable them** veut dire qu'Actions est coupé : cliquez dessus.
Sans bandeau, ouvrez **Settings > Actions > General** et vérifiez qu'Actions est autorisé. Ensuite,
sur votre branche de User Story, lancez **Training: Level 1 > Trigger my workflows** : il vérifie
que les workflows ont le droit de tourner, et pousse une ligne, ce qui lance les contrôles d'une
Pull Request ouverte quand ils ne le pouvaient pas.

**Set up my training environment échoue avec `There is already a Child Relationship named
Installations on Account`.**
Vous avez nettoyé cet org avec **Clean up a training org** et vous y remettez l'app. Supprimer un
objet personnalisé ne l'efface pas : il reste dans **Setup > Objects and Fields > Deleted Objects**
et garde ses noms de relation réservés, donc l'app ne peut pas être recréée à côté de lui. Effacez-le
là, puis relancez **Set up my training environment**. Sur un scratch org, il est plus rapide de
laisser **Set up my training environment** en construire un nouveau.

**Set up one of my training orgs échoue sur `helios-prod`.**
La cause habituelle est une connexion expirée : reconnectez-la dans **Orgs Manager** sous le même
alias, et relancez.

**Set up one of my training orgs échoue sur `Profile Helios Crew`, avec `no Layout named ...` ou
`no CustomTab named ...`.**
Le profil que vous avez publié au [Lab 2.6](../level-2-contributor-advanced/2-6-permission-sets-and-profiles.md)
nomme une présentation de page ou un onglet que votre scratch org a et que cette org Developer
Edition n'a pas. C'est la première fois que ce profil rencontre une org d'un autre genre, d'où
l'erreur ici et pas plus tôt. La section **En cas de problème** du [Lab 2.6](../level-2-contributor-advanced/2-6-permission-sets-and-profiles.md) explique comment trouver
laquelle des deux orgs fait exception, et quoi changer. Une fois le correctif mergé dans
`integration`, revenez dessus, **Pull**, et relancez **Set up one of my training orgs**.

## Vérifiez votre travail

Welcome page > **Training: Level 3** > **Check my work**, puis choisissez le **Lab 3.1**.

## Pour aller plus loin

- [Guide d'installation](https://sfdx-hardis.cloudity.com/salesforce-devops-setup-home/)
- [Configurer l'authentification de la CI](https://sfdx-hardis.cloudity.com/salesforce-devops-setup-auth/)
- [Authentification GitHub Actions](https://sfdx-hardis.cloudity.com/salesforce-devops-setup-auth-github/)
- [Récupérer une org existante](https://sfdx-hardis.cloudity.com/salesforce-devops-setup-existing-org/)
- [Mettre en place un pool de scratch orgs](https://sfdx-hardis.cloudity.com/salesforce-devops-setup-scratch-org-pool/)
- [Initialiser les scratch orgs et les sandboxes (Beta)](https://sfdx-hardis.cloudity.com/salesforce-devops-org-initialization/)
- [Règles de remplacement (Beta)](https://sfdx-hardis.cloudity.com/salesforce-devops-config-replacement-rules/)

[Suite : Lab 3.2 - Relire et merger la Pull Request d'un contributeur](3-2-review-a-contributor-pull-request.md){ .md-button .md-button--primary }
