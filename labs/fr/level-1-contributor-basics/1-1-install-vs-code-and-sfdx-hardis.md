---
id: lab-1-1
title: "Lab 1.1 - Installer VS Code, Git et sfdx-hardis"
description: "Installez Git, Node.js, VS Code et l'extension sfdx-hardis, puis laissez son panneau Setup installer la CLI Salesforce et les plugins sans taper une commande."
level: 1
lab: 1
lang: fr
source_rev: "1ce6da585afd0a877f290f1baac04e4b5274b7be"
screenshots:
  - annotated/web/git-download
  - annotated/web/vscode-download
  - annotated/web/nodejs-download
  - annotated/vscode/extensions-install
  - annotated/vscode/welcome--first-open
  - annotated/vscode/welcome--setup-button
  - annotated/vscode/setup
  - annotated/vscode/setup--ready
depends_on:
  commands: []
  flags: []
  config: []
  panels: [welcome, setup]
  docs: [salesforce-devops-use-install, vscode-extension]
---

# Lab 1.1 - Installer VS Code, Git et sfdx-hardis

**Niveau** : 1 Contributeur, les bases

**Durée** : ~15 min

**Vous allez** : transformer un ordinateur ordinaire en machine capable de faire du Salesforce
DevOps, sans taper une seule commande.

## La situation

Votre premier matin dans une équipe Salesforce, celle-ci ou une vraie. Avant qu'on puisse vous
confier un ticket, cinq choses doivent être sur votre machine, et la dernière installe la plupart
des autres à votre place.

La liste est la même que vous soyez ici pour la formation ou que vous rejoigniez un projet qui a
déjà une pipeline, et elle se moque du fournisseur git de ce projet : GitHub, GitLab, Azure DevOps
et Bitbucket fonctionnent tous pareil à partir d'ici.

!!! warning "Ce lab se suffit à lui-même"
    Si quelqu'un vous a envoyé ici pour vous équiper avant votre premier jour, terminez ce lab et
    arrêtez-vous. Le Lab 1.2 est là où commence la partie propre à la formation : orgs Salesforce
    gratuites, repository d'entraînement, données fictives. Rien de tout cela n'a sa place sur un
    vrai projet.

!!! tip "Pas de VS Code ? Agentforce Vibes ou Cursor fonctionnent aussi"
    [Agentforce Vibes](https://www.salesforce.com/agentforce/developers/vibe-coding/ide/) est VS Code dans Google Chrome, lancé depuis une org Salesforce :
    une sandbox de développement, ou l'org Developer Edition gratuite pour laquelle le
    [Lab 1.2](1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md) vous inscrit, ce qui veut dire
    que ce chemin ne coûte rien et ne demande rien que vous ne créiez déjà ici. Tout ce cours y
    fonctionne. Deux différences et pas une
    de plus : la CLI Salesforce est déjà là, donc la partie du panneau Setup qui l'installe n'a rien
    à faire, et l'extension vient d'[Open VSX](https://open-vsx.org/extension/NicolasVuillamy/vscode-sfdx-hardis)
    et non du Visual Studio Marketplace. Chaque panneau, chaque bouton et chaque étape ci-dessous
    sont les mêmes, et les captures d'écran aussi : elles ont été prises dans VS Code de bureau, qui
    est le même éditeur.

    [Cursor](https://cursor.com/) fonctionne pareil, depuis le même Open VSX. Que vous utilisiez
    VS Code, Agentforce Vibes ou Cursor, la suite de ce lab est écrite pour ce que vous y voyez.

    Choisissez maintenant et gardez le même jusqu'à la fin du cours. Les scratch orgs que crée le
    Lab 1.2 ne sont connectées que dans l'éditeur qui les a créées. Lancez la mise en place depuis un
    autre éditeur, et l'environnement de formation n'en trouve aucune et en demande trois nouvelles,
    ce que le Dev Hub refuse tant que les trois premières sont actives.

## Avant de commencer

- [ ] Un ordinateur sur lequel vous pouvez installer des logiciels, et le droit de le faire, ou
      n'importe quelle org Salesforce depuis laquelle lancer Agentforce Vibes : une sandbox de
      développement, ou l'org Developer Edition gratuite du Lab 1.2

## Les étapes

### 1. Installer VS Code et l'extension

Objectif : Git, VS Code, Node.js et le pack d'extensions sfdx-hardis sur votre machine, et l'onglet
Welcome ouvert.

#### À faire : installer Git

1. Ouvrez la page de téléchargement de [Git](https://git-scm.com/downloads). Elle propose votre
   système d'exploitation en haut : sous Windows, prenez **Click here to download** **(1)**,
   l'installeur autonome 64 bits

  !!! tip "Dans Agentforce Vibes"
      Commencez aux extensions : passez les trois téléchargements ci-dessous et allez directement
      à [l'installation du pack d'extensions](#install-the-extension-pack), vers la fin de cette
      étape. Partout où ce lab dit de redémarrer VS Code, rechargez l'onglet du navigateur.

   ![La page de téléchargement de Git pour Windows](../../_assets/annotated/web/git-download.png)

2. Lancez l'installeur et acceptez toutes les valeurs par défaut qu'il propose. Si vous avez déjà
   Git, installez-le quand même : l'installeur reconnaît un Git existant et propose de le mettre à
   jour
3. Lisez deux écrans plutôt que de les cliquer au pas de course. Sur **Select Components**, laissez
   **Open Git Bash here** et **Open Git GUI here** cochés
4. Sur **Adjusting your PATH environment**, gardez l'option du milieu, celle qui est recommandée,
   **Git from the command line and also from 3rd-party software**, pour que VS Code trouve Git
5. Sous Windows, vérifiez que Git Bash est bien là : faites un clic droit sur n'importe quel
   dossier, le menu doit proposer **Open Git Bash here**. Dans VS Code, vous trouverez aussi
   **Git Bash** dans la liste déroulante du terminal, à côté de PowerShell. Si aucun des deux
   n'apparaît, relancez l'installeur Git et gardez les valeurs par défaut cette fois

!!! warning "Attention"
    Sous Windows, accepter toutes les valeurs par défaut compte plus qu'il n'y paraît. Si vous
    décochez les composants Git Bash, des pans entiers de ce cours échouent avec des erreurs qui
    n'ont l'air d'avoir aucun rapport avec Git.

#### Pourquoi Git, et pourquoi Git Bash

Git est l'outil qui enregistre chaque version d'un projet et la déplace entre votre portable et
l'endroit où votre équipe garde le projet, et tout le reste de ce cours repose dessus. Vous n'aurez
jamais à taper une commande Git : l'extension les lance pour vous, et vous montre laquelle elle a
lancée.

Vous l'avez peut-être déjà : beaucoup de machines l'ont. Le panneau Setup de l'étape 2 le contrôle
aussi, et vous dit s'il manque.

Les valeurs par défaut incluent Git Bash, un terminal de style Unix livré avec Git, et sfdx-hardis
s'en sert : plusieurs des commandes que l'extension lance pour vous sont des commandes shell que
l'invite de commandes Windows ne comprend pas. macOS et Linux ont déjà un shell Unix, il n'y a donc
rien à choisir de ce côté.

#### À faire : installer VS Code et Node.js

1. Ouvrez [Visual Studio Code](https://code.visualstudio.com/) et prenez le téléchargement qui
   correspond à votre machine. Sous Windows c'est le bouton **Windows** **(1)** ; les deux cartes à
   côté contiennent les versions macOS et Linux

   ![La page de téléchargement de Visual Studio Code, une carte par système d'exploitation](../../_assets/annotated/web/vscode-download.png)

2. Lancez son installeur. Il ne demande aucun choix : acceptez la licence et gardez toutes les
   valeurs par défaut qu'il propose
3. Ouvrez [Node.js](https://nodejs.org/). Il vous faut la version 22 au minimum, 24 recommandée.
   Deux choses à ne pas rater sur cette page. D'abord le sélecteur de version **(1)** : celle
   marquée **LTS** est le choix sûr, tant qu'elle affiche 22 ou plus
4. Ensuite **Windows Installer (.msi)** **(2)**, ou l'équivalent pour votre machine

   ![La page de téléchargement de Node.js, avec le sélecteur de version et les boutons d'installeur](../../_assets/annotated/web/nodejs-download.png)

5. Lancez l'installeur de Node.js comme celui de VS Code : acceptez la licence et gardez toutes les
   valeurs par défaut

!!! warning "Redémarrez VS Code après avoir installé Git ou Node.js"
    Les installeurs de Git et de Node.js s'ajoutent au PATH, la liste des endroits où votre machine cherche une
    commande. Un programme ne lit cette liste qu'à son démarrage : un VS Code déjà ouvert au moment
    de l'installation ne les trouve donc toujours pas, et le panneau Setup de l'étape 2 les signale
    manquants alors qu'ils sont là. Fermez VS Code complètement, toutes fenêtres comprises, et
    rouvrez-le.

    La même chose vaut pour un terminal que vous aviez déjà ouvert.

<a id="install-the-extension-pack"></a>

#### À faire : installer le pack d'extensions

1. Ouvrez VS Code et cliquez sur l'icône **Extensions** **(1)**. Elle se trouve dans la barre
   étroite de gauche, et ressemble à quatre petits carrés dont l'un est détaché
2. Tapez `hardis` dans la zone de recherche **(2)**
3. Cliquez sur **Install** sur **SFDX Hardis Extension Pack for Salesforce, by Cloudity** **(3)**,
   publié par Nicolas Vuillamy. Prenez le pack plutôt que l'extension seule juste au-dessus

   ![La vue Extensions de VS Code, avec hardis tapé dans la zone de recherche](../../_assets/annotated/vscode/extensions-install.png)

4. Si VS Code demande **Do you trust the publishers of these extensions?**, répondez **Trust
   Publishers & Install**
5. Une fois le pack installé, ouvrez l'icône d'engrenage à côté de lui et cochez **Auto Update**
6. Cliquez sur la nouvelle icône qui apparaît dans la barre de gauche **(1)** : l'onglet **Welcome**
   **(2)** s'ouvre

   ![VS Code avec l'onglet Welcome de sfdx-hardis ouvert](../../_assets/annotated/vscode/welcome--first-open.png)

#### Pourquoi le pack, et Auto Update

Deux choses se passent autour du clic sur Install, et toutes deux sont faciles à rater. Un pack
installe des extensions de plusieurs éditeurs, et il s'arrête à la question de confiance tant que
vous ne l'avez pas dit. Et le cours et le produit avancent ensemble : une extension en retard de
quelques versions est la première raison pour laquelle un panneau de ces labs ne ressemble pas à sa
capture.

Le pack installe sfdx-hardis lui-même ainsi que les outils qui vont avec : Git Graph, qui dessine vos
branches, le support YAML et Markdown que les fichiers de configuration utilisent, et le visualiseur
de logs Apex. Les niveaux suivants s'en servent, prenez donc le pack plutôt que l'extension seule.

!!! tip "Dans Agentforce Vibes"
    Les trois téléchargements sont déjà dans l'onglet : Git, Node.js et l'éditeur lui-même
    viennent avec. Une différence aux extensions : la vue Extensions d'un IDE dans le navigateur
    cherche dans [Open VSX](https://open-vsx.org/extension/NicolasVuillamy/vscode-sfdx-hardis) et
    non dans le Visual Studio Marketplace, et le pack est le même, sous le même nom. Recharger
    l'onglet du navigateur fait la même chose que redémarrer VS Code, c'est-à-dire permettre à
    l'éditeur de voir ce qui vient d'être installé.

#### Vous devriez voir

- Une nouvelle icône dans la barre de gauche, et l'onglet **Welcome** ouvert : c'est par cet onglet
  que commence chaque lab de ce cours

### 2. Laisser le panneau Setup installer le reste

Objectif : la CLI Salesforce et ses plugins installés, et chaque carte du panneau Setup verte.

Il vous faut la CLI Salesforce et quelques plugins. Vous n'allez pas les installer à la main :
l'extension a un panneau qui vérifie ce qui manque et l'installe.

#### À faire

1. Sur la Welcome page, repérez le bouton en haut à gauche du bandeau d'en-tête **(1)**. Il affiche
   **Check in progress** tant qu'il cherche, puis soit **Dependencies up to date**, soit
   **N update(s) needed**. Survolez-le et l'infobulle dit **Open Setup**

   ![L'en-tête de la Welcome page, avec à sa gauche le bouton d'état des dépendances](../../_assets/annotated/vscode/welcome--setup-button.png)

2. Attendez la fin du contrôle, puis cliquez : il ouvre le panneau Setup
3. Lisez le panneau : il liste chaque dépendance dont la pipeline a besoin, avec la version que vous
   avez et la version à jour. Node.js et **Git** **(3)** ont aussi chacun leur carte : le panneau
   contrôle ce que vous avez installé à l'étape 1 et le dit

   ![Le panneau Setup, listant chaque dépendance avec sa version](../../_assets/annotated/vscode/setup.png)

   L'image a été prise sur une machine où tout était déjà en place : chaque carte est verte et ne
   propose rien d'autre que **Re-check** **(2)**, et le bandeau du haut n'a rien à proposer **(1)**.
   Votre première exécution ne ressemblera pas à cela. Tout ce qui manque ou n'est pas à jour passe
   à l'orange et son bouton affiche **Install** ou **Upgrade**, et le bandeau du haut porte alors
   **Run pending installs** **(1)**

4. Cliquez sur **Run pending installs** **(1)** : il met toute la liste en file d'attente et rend
   compte de chaque élément au fur et à mesure

  !!! tip "Dans Agentforce Vibes"
      La carte **Salesforce CLI** est verte avant même que vous commenciez, et le panneau n'a plus
      que les plugins à installer : lancez le même **Run pending installs** et lisez la même liste ;
      elle est simplement plus courte.

5. Attendez la fin. Cela prend quelques minutes

!!! warning "Redémarrez VS Code une fois les installations terminées"
    La CLI Salesforce atterrit elle aussi sur le PATH, la même règle s'applique donc : fermez
    VS Code et rouvrez-le avant de continuer. Appuyez ensuite sur **Re-check** dans le panneau
    Setup. Tout ce qui était encore rouge pour cette raison passe au vert.

#### Pourquoi

Il n'y a pas de carte appelée Setup : le bouton porte l'état de vos dépendances.

Les dépendances qu'il faut connaître par leur nom :

- **Salesforce CLI** - le programme auquel parle chaque outil Salesforce de votre machine
- **sfdx-hardis** - le complément qui ajoute les commandes User Story à cette CLI
- **SFDMU** - charge et extrait des enregistrements, c'est ainsi que vos orgs reçoivent leurs données
- **sfdx-git-delta** - calcule ce qui a changé entre deux versions du projet, c'est ce que les
  déploiements envoient
- **sfdx-browserforce-plugin** (Browserforce) - modifie les paramètres de Setup qui ne se déploient
  pas, en cliquant dans Setup depuis un navigateur que personne ne voit, quand un déploiement le
  demande
- **Salesforce Extension Pack** - l'outillage Salesforce officiel pour VS Code

Les installations sont la partie la plus longue de ce lab, et la seule que vous ne referez jamais.

<details markdown="1"><summary>Sous le capot : ce que le panneau Setup vient de faire</summary>

Pour chaque dépendance manquante, il a lancé la commande npm toute simple que vous auriez lancée
vous-même, par exemple :

    npm install --global @salesforce/cli
    sf plugins install sfdx-hardis
    sf plugins install sfdmu
    sf plugins install sfdx-git-delta
    sf plugins install sfdx-browserforce-plugin

puis il a relancé `sf version` et `sf plugins` et comparé les réponses aux versions publiées sur le
registre npm. Cette comparaison est toute la raison d'être du panneau : une pipeline casse de façon
déroutante quand une personne a deux versions majeures de retard, et personne ne s'en aperçoit
jusqu'à ce qu'un déploiement échoue.

</details>

#### Vous devriez voir

- Chaque carte du panneau Setup verte après **Re-check**, sans plus rien à installer

## Ce que vous devez voir

Le panneau **Setup** sans rien à installer :

![Le panneau Setup une fois tout installé](../../_assets/annotated/vscode/setup--ready.png)

- [ ] Le résumé du haut **(1)** sans rien qui manque encore : il nomme tout ce qui manque encore,
      et manquant est le seul état qui vous bloque
- [ ] Chaque carte en dessous verte, **Salesforce CLI** **(2)** compris, sans rien d'autre à faire
      que **Re-check**

Un **Upgrade** orange sur l'une d'elles n'est pas un échec : cela veut dire qu'une version plus
récente existe, et le bouton ira la chercher quand vous en aurez envie.

C'est tout ce lab. Votre machine peut maintenant faire tourner tout ce que la suite du cours, et tout
projet Salesforce qui utilise sfdx-hardis, va lui demander.

## En cas de problème

**Le panneau Setup dit que la CLI Salesforce manque alors qu'il vient de l'installer.**
Elle a atterri quelque part qui n'était pas sur le PATH d'un terminal déjà ouvert. Fermez VS Code
complètement et rouvrez-le.

**L'extension n'apparaît pas après son installation.**
Rechargez la fenêtre : **View > Command Palette**, puis **Developer: Reload Window**.

**Le panneau Setup affiche une ligne rouge que vous n'arrivez pas à faire passer.**
Cliquez sur la ligne. Le panneau dit ce qu'il a tenté et ce qu'on lui a répondu, et ce message est
presque toujours la réponse.

## La suite

Si vous êtes venu ici pour équiper un vrai projet, vous avez fini : ouvrez le repository de votre
équipe et le panneau **DevOps Pipeline** vous dira le reste.

Si vous suivez la formation, le [Lab 1.2](1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md) vous construit un petit environnement de travail : une org
Salesforce gratuite, trois scratch orgs créées à partir d'elle, une copie du projet, et une pipeline.
C'est la dernière étape d'installation.

## Pour aller plus loin

- [Installer sfdx-hardis](https://sfdx-hardis.cloudity.com/salesforce-devops-use-install/)
- [L'extension VS Code](https://sfdx-hardis.cloudity.com/vscode-extension/)

[Suite : Lab 1.2 - Créer votre Dev Hub, vos scratch orgs et votre pipeline CI/CD](1-2-create-your-dev-hub-scratch-orgs-and-pipeline.md){ .md-button .md-button--primary }
