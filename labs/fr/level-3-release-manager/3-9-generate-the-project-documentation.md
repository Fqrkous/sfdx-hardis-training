---
id: lab-3-9
title: "Lab 3.9 - Générer la documentation du projet Salesforce"
description: "Générez une documentation lisible d'une org Salesforce non documentée avec sfdx-hardis : objets, flows, Apex et permissions, à partir des sources dans Git."
level: 3
lab: 9
lang: fr
source_rev: "85f8e2160c6e4b9e92853ed8100bb17e62568376"
screenshots:
  - annotated/vscode/documentation-workbench--generate-and-deploy
depends_on:
  commands: [hardis:doc:project2markdown]
  flags: []
  config: [docDeployToOrg, docDeployToCloudflare, mermaidTheme]
  panels: [documentationWorkbench, documentationConfig]
  docs: [salesforce-project-doc-generate]
---

# Lab 3.9 - Générer la documentation du projet Salesforce

**Niveau** : 3 Release Manager

**Durée** : ~5 min<!-- observed --> (observé : médiane 9 min, 14 participants, le plus rapide 5 min)<!-- /observed -->

**Vous allez** : produire une documentation lisible d'une org que personne n'a documentée depuis deux
ans, à partir des sources que vous avez déjà.

## La situation

Victor connaissait cette org. Victor est parti.

Ce qui existe : deux ans de métadonnées dans un repository git. Ce qui n'existe pas : la moindre
description de ce à quoi servent les objets, de la façon dont les flows s'articulent, ou de la
raison pour laquelle le planificateur se comporte comme il le fait.

Vous n'allez pas écrire cela à la main. L'essentiel peut être généré, et la part qui ne le peut pas
est exactement celle qui mérite le temps d'une personne.

## Avant de commencer

- [ ] [Lab 3.8](3-8-monitor-your-production-org.md) terminé
- [ ] Sur `integration`, à jour : la documentation décrit ce que l'équipe a mergé

## Les étapes

### 1. Ouvrir le Documentation Workbench

Objectif : le Documentation Workbench ouvert, avec toutes les parties incluses.

#### À faire

1. Depuis la Welcome page, cliquez sur la carte **Documentation Workbench**

   ![Le Documentation Workbench, avec les parties à inclure, le bouton Generate et les cibles de publication](../../_assets/annotated/vscode/documentation-workbench--generate-and-deploy.png)

2. Repérez les trois parties qui comptent :
   1. **Include** **(1)**, qui décide de ce qui est documenté. Huit cases : Objects, Flows & Process
      Builders, Profiles & Permissions, Automations, Lightning Pages, Apex, Lightning Web Components et
      Installed Packages. Tout coché est ce que vous voulez la première fois
   2. **Generate Documentation** **(2)**, le bouton qui produit les pages
   3. **Deploy Documentation** **(3)**, plus bas, qui les publie
3. À gauche d'**Include** se trouve une deuxième colonne, **Formats & History**. Laissez-la
   tranquille pour l'instant

#### Pourquoi

Tout dans ce lab se passe sur cet unique écran.

**With Flow History** est cochée par défaut dans **Formats & History**. Cette case est le sujet de
l'étape 4, et sans elle les pages de flow n'ont aucun diagramme d'historique.

#### Vous devriez voir

- Les huit cases d'**Include** toutes cochées, et **With Flow History** cochée

### 2. Générer

Objectif : un jeu de pages markdown sous `docs/`, produit depuis les sources.

#### À faire

1. Cliquez sur **Generate Documentation** **(2)**

#### Pourquoi

Il lit les sources de `force-app/` et produit un jeu de pages markdown sous `docs/`. Cela prend
quelques minutes sur un petit projet comme Helios.

#### Vous devriez voir

- Les pages sous `docs/`, une fois la génération terminée

### 3. Lire ce qu'il a produit

Objectif : vous connaissez les quatre sortes de pages, et combien de champs n'ont pas de description.

Quatre sortes de pages, et il vaut la peine de les distinguer :

| Page                            | Ce qu'elle contient                                                                                                              | Qui la lit                                                          |
|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| Pages d'objet                   | Chaque champ avec son type, sa description et son help text, les règles de validation, les types d'enregistrement, les relations | Un admin à qui on demande de modifier quelque chose                 |
| Pages de flow                   | Un diagramme lisible de chaque flow, plus ses conditions d'entrée et ses éléments                                                | Quiconque doit comprendre l'automatisation sans ouvrir Flow Builder |
| Pages Apex                      | Les classes, leurs méthodes, leur ApexDoc                                                                                        | Un développeur                                                      |
| Pages de packages et de profils | Ce qui est installé, ce que les permission sets accordent                                                                        | Un audit                                                            |

#### À faire

1. Ouvrez `docs/objects/Installation__c.md`
2. VS Code affiche un fichier markdown sous sa forme source : pour le lire comme une page, appuyez
   sur `Ctrl+Shift+V` (`Cmd+Shift+V` sur un Mac), ou faites un clic droit sur l'onglet du fichier et
   choisissez **Open Preview**. Faites de même pour chaque page que ce lab ouvre
3. Regardez combien de vides a votre org

#### Pourquoi

Les champs sans description produisent une ligne avec une cellule vide. C'est la sortie honnête,
et c'est l'argument pour les deux secondes qu'il faut pour les remplir.

#### Vous devriez voir

- Chaque champ que vous et vos collègues avez créé au fil des trois niveaux, avec les descriptions
  que vous avez écrites dans Setup

### 4. Regarder les diagrammes de flow

Objectif : le diagramme de `Installation_Assign_Crew` lu, et sa page d'historique trouvée.

#### À faire

1. Ouvrez la page de `Installation_Assign_Crew`
2. Ouvrez `Installation_Assign_Crew-history.md`, posé à côté

#### Pourquoi

Le flow est rendu sous forme de diagramme Mermaid : le déclencheur, les conditions d'entrée, les
décisions et leurs issues. Il est lisible par quelqu'un qui n'a jamais ouvert un flow Salesforce,
c'est-à-dire la plupart des gens qui vous demanderont ce qu'il fait.

La page d'historique montre comment le flow a changé au fil du temps, construite à partir de
l'historique git. Cela répond à "quand ce flow s'est-il mis à faire cela", ce qui est sinon un long
après-midi. Elle existe parce que **With Flow History** était cochée, ce qui passe `--with-history`
au générateur. Décochez-la et la page n'est tout simplement pas écrite.

#### Vous devriez voir

- Le flow sous forme de diagramme : le déclencheur, les conditions d'entrée, les décisions et leurs
  issues
- `Installation_Assign_Crew-history.md` à côté, montrant comment le flow a changé au fil du temps

### 5. Combler les pires lacunes à la main

Objectif : un paragraphe que seule une personne peut écrire, sur une page protégée de la génération
suivante.

Une documentation générée vous dit ce que l'org contient. Elle ne peut pas vous dire pourquoi.

#### À faire

1. Sur la page Installation, juste sous son titre, écrivez un paragraphe disant ce qu'est une
   installation dans le métier
2. Ouvrez la page de `InstallationScheduler` et celle de `Installation_Assign_Crew`, et trouvez
   pourquoi le délai de préparation existe et pourquoi le plafond de capacité d'équipe est là.
   Personne n'a à l'ajouter : ceux qui ont écrit la classe et le flow ont mis la raison dans leur
   commentaire et leur description, et le générateur l'a reprise
3. Protégez la page où vous avez écrit. Chaque page générée commence par deux lignes de commentaire,
   et la seconde dit `<!-- DO_NOT_OVERWRITE_DOC=FALSE -->`. Passez-la à `TRUE` sur la page
   Installation

!!! warning "Attention"
    La génération suivante laisse une page `TRUE` tranquille, et réécrit toutes les autres pages
    depuis les sources, paragraphe compris.

#### Pourquoi

Ce paragraphe vaut plus que les quarante autres pages, et il est la raison pour laquelle ce lab se
trouve à la fin d'un niveau plutôt qu'au début. Une raison écrite dans les métadonnées elles-mêmes,
en commentaire dans le code ou en description, n'a pas besoin de protection : chaque génération la
reprend.

Sur un projet qui commite sa documentation, la ligne `DO_NOT_OVERWRITE_DOC=TRUE` est ce qui garde
les mots d'une personne en vie d'une exécution nocturne à l'autre.

#### Vous devriez voir

- Un paragraphe que vous avez écrit, sur la page Installation, qui dit `<!-- DO_NOT_OVERWRITE_DOC=TRUE -->`

### 6. La publier

Objectif : vous connaissez les trois façons de publier, et pourquoi ce cours ne publie et ne commite
rien.

#### À faire

1. Regardez la section **Deploy Documentation** **(3)**. Elle propose trois cartes, chacune avec le
   même bouton **Deploy** :
   - **Deploy to Cloudflare Pages** la publie sous forme de site, comme la documentation sfdx-hardis
     elle-même est publiée
   - **Deploy to Confluence** la publie dans un espace Confluence, et demande un token d'API Confluence
     configuré au préalable
   - **Deploy to Salesforce** construit le HTML et le téléverse comme ressource statique, avec une page
     Visualforce et un onglet personnalisé, pour que la documentation soit accessible depuis
     l'intérieur de Salesforce. C'est plafonné par la limite de 5 Mo des ressources statiques, cela
     convient donc à un petit projet
2. Pour ce lab, générez et lisez : ne cliquez sur aucune

#### Pourquoi

Les mêmes trois existent comme clés de configuration, `docDeployToCloudflare`, `docDeployToConfluence`
et `docDeployToOrg`, et c'est ainsi que le workflow de monitoring republie la documentation chaque
nuit sans que personne clique. Celles de Cloudflare et de Salesforce s'excluent mutuellement :
activez les deux et seule celle de Salesforce tourne.

Publier est une décision de projet, et commiter aussi : ce cours garde
`docs/` et le `mkdocs.yml` généré hors de git (`.gitignore` les liste), parce qu'ils sont
reconstruits depuis les sources dès que quelqu'un le demande, et qu'un release manager ne fait pas
passer de fonctionnalités, ni leur documentation, par des Pull Requests à lui.

#### Vous devriez voir

- Rien à commiter : **Source Control** ne montre aucune modification issue de la génération

### 7. En faire une habitude, pas un événement

Objectif : vous savez où la documentation est régénérée sans que personne ait à y penser.
Rappel : [Lab 3.8](3-8-monitor-your-production-org.md)

Une documentation générée une fois est périmée en un mois.

#### Pourquoi

La génération est une commande, elle peut
donc tourner selon une planification comme le fait le monitoring, et le monitoring du [Lab 3.8](3-8-monitor-your-production-org.md) le fait
déjà : sa sauvegarde nocturne régénère la documentation de la production avant de se terminer.
Publier celle-là, avec les clés ci-dessus, est la façon dont un projet obtient une documentation que
personne n'a à penser à mettre à jour.

<details markdown="1"><summary>Sous le capot : qui lit quoi</summary>

La commande était :

    sf hardis:doc:project2markdown

qui lit :

- les répertoires de packages déclarés dans `sfdx-project.json`, donc `force-app/` : objets, champs,
  flows, Apex, permission sets, packages
- `manifest/` pour une page décrivant les manifestes eux-mêmes
- `config/.sfdx-hardis.yml` pour la configuration de projet qu'elle documente, qui devient
  `docs/sfdx-hardis-params.md` et `docs/sfdx-hardis-branches-and-orgs.md`
- l'historique git, pour les diagrammes du "qu'est-ce qui a changé et quand", quand
  `--with-history` est passé

et écrit du markdown sous `docs/`, plus un `mkdocs.yml` pour que le résultat soit un site et non un
tas de fichiers. Elle ne remplace pas un `mkdocs.yml` que vous auriez déjà, mais elle le modifie :
elle réécrit le bloc `nav` et ajoute les scripts, styles et fonctionnalités de thème dont les pages
générées ont besoin. Une navigation que vous auriez écrite à la main est donc reconstruite à
l'exécution suivante, ce qui vaut d'être su avant d'y passer une soirée.

Les diagrammes de flow sont du Mermaid, généré depuis le XML du flow. Cela veut dire qu'ils sont du
texte dans le repository : ils se diffent, se relisent et se versionnent comme tout le reste, et ils
ne se décalent jamais par rapport au flow qu'ils décrivent.

Deux commandes voisines à connaître :

- `sf hardis:doc:override-prompts` permet à un projet de remplacer les prompts d'IA utilisés quand
  les descriptions sont générées plutôt que lues
- `sf hardis:doc:plugin:generate` est ce qui génère la documentation de sfdx-hardis elle-même, ce qui
  est une preuve d'existence raisonnable que la sortie est lisible

Si le projet a un fournisseur d'IA configuré, le générateur peut aussi écrire les descriptions
manquantes plutôt que de laisser des vides. Utile, et pas un substitut au paragraphe de
l'étape 5 : un modèle peut décrire ce qu'est un champ, pas pourquoi le métier en a besoin.

<!-- command-links:start -->
Documentation des commandes : [hardis:doc:project2markdown](https://sfdx-hardis.cloudity.com/hardis/doc/project2markdown/), [hardis:doc:override-prompts](https://sfdx-hardis.cloudity.com/hardis/doc/override-prompts/), [hardis:doc:plugin:generate](https://sfdx-hardis.cloudity.com/hardis/doc/plugin/generate/)
<!-- command-links:end -->

</details>

#### Vous devriez voir

- La sauvegarde nocturne du repository de monitoring du [Lab 3.8](3-8-monitor-your-production-org.md) comme l'endroit où la
  documentation de la production est régénérée

## Ce que vous devez voir

- [ ] Un dossier `docs/` avec des pages d'objets, de flows et d'Apex
- [ ] `docs/objects/Installation__c.md` listant chaque champ des trois niveaux
- [ ] Un diagramme lisible de `Installation_Assign_Crew`
- [ ] Un paragraphe que vous avez écrit vous-même, sur une page marquée
      `DO_NOT_OVERWRITE_DOC=TRUE`
- [ ] Rien à commiter : **Source Control** ne montre aucune modification issue de la génération

## En cas de problème

**La génération échoue sur un flow.**
Un flow avec un élément inhabituel peut faire trébucher le générateur de diagrammes. La page est
quand même produite, sans le diagramme. Signalez-le comme une issue sur sfdx-hardis si vous en
rencontrez un.

**Les pages d'objets sont presque vides.**
Les sources sont là mais les descriptions non. C'est l'org, pas l'outil.

**Source Control liste des centaines de nouveaux fichiers sous `docs/`.**
Il ne devrait en lister aucun : ce cours garde `docs/` et `mkdocs.yml` hors de git. Vérifiez que
`.gitignore` les liste toujours, et ne les commitez pas. Un projet qui commite sa documentation a
une première Pull Request énorme, et des petites ensuite.

## Vérifiez votre travail

Welcome page > **Training: Level 3** > **Check my work**, puis choisissez le **Lab 3.9**.

## Pour aller plus loin

- [Générer la documentation](https://sfdx-hardis.cloudity.com/salesforce-project-doc-generate/)

[Suite : Lab 3.10 - Promouvoir un sous-ensemble avec les promotion branches (Beta)](3-10-promote-a-subset-with-promotion-branches.md){ .md-button .md-button--primary }
