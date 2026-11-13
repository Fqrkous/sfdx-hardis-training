---
title: "Formation Salesforce DevOps gratuite et pratique"
description: "Formation Salesforce DevOps gratuite et pratique en trois niveaux : Git, Pull Requests, pipelines CI/CD et gestion des releases avec sfdx-hardis et VS Code."
id: home
lang: fr
source_rev: "e1850de9ea8e23b613746c6a973ed35ef2fe5864"
---

# Formation Salesforce DevOps avec sfdx-hardis

[![Formation Salesforce DevOps gratuite et pratique avec sfdx-hardis, en trois niveaux avec un badge chacun](../_assets/brand/course-banner-fr.png){ .course-banner }](level-1-contributor-basics/index.md)

Trois parcours gratuits qui vous emmènent de "je n'ai jamais utilisé Git" à "la pipeline, c'est moi
qui la gère".

[Commencer le Niveau 1](level-1-contributor-basics/index.md){ .md-button .md-button--primary }
[Voir les trois niveaux](#les-trois-niveaux){ .md-button }

Vous travaillerez sur un vrai repository, celui d'un installateur de panneaux solaires fictif,
**Helios Energy**, avec des orgs Salesforce gratuites livrées avec l'application et ses données.
Tout ce que vous faites ici est ce qu'une vraie équipe Salesforce fait tous les jours, avec les
mêmes outils.

Si Git est nouveau pour vous, c'est exactement le point de départ prévu. Le Niveau 1 définit les six
mots dont vous avez besoin, repository et fork compris, au moment où vous rencontrez chacun d'eux,
et l'extension VS Code lance les commandes Git à votre place.

![Le panneau DevOps Pipeline de sfdx-hardis dans VS Code, qui suit une Pull Request de la relecture à la production](../_assets/brand/devops-pipeline.gif){ .course-demo loading=lazy }

*Le panneau DevOps Pipeline de l'extension VS Code : c'est là que vous démarrez chaque User Story et
que vous suivez sa Pull Request jusqu'à la production.*

!!! info "Les outils restent en anglais"
    Le cours suppose que sfdx-hardis, son extension VS Code et votre org Salesforce sont en
    **anglais**, comme sur toutes les captures d'écran. Les noms de boutons, de panneaux et de
    menus sont donc laissés en anglais dans le texte : ce que vous lisez ici est exactement ce que
    vous voyez à l'écran.

## Les trois niveaux

| Niveau                                                                 | Pour qui                                                            | Durée  | Prérequis          | À la fin, vous savez                                                                                               |
|------------------------------------------------------------------------|---------------------------------------------------------------------|--------|--------------------|--------------------------------------------------------------------------------------------------------------------|
| [**1 - Contributeur, les bases**](level-1-contributor-basics/index.md) | Admins et développeurs qui rejoignent une équipe ayant une pipeline | 2 h    | Rien               | Prendre une User Story, la construire, la publier, obtenir une Pull Request verte, la merger                       |
| [**2 - Contributeur avancé**](level-2-contributor-advanced/index.md)   | Les mêmes, une fois les histoires faciles derrière eux              | 5 h 45 | Niveau 1           | Résoudre les erreurs de déploiement, déclarer des deployment actions, gérer les écrasements, résoudre les conflits |
| [**3 - Release Manager**](level-3-release-manager/index.md)            | Celui ou celle qui tient la pipeline, les orgs et les releases      | 9 h    | Niveaux 1 **et** 2 | Reprendre une org sans pipeline, relire et merger, livrer en UAT et en production, faire un hotfix, monitorer      |

Les niveaux 1 et 2 forment ensemble le parcours contributeur, et ils s'adressent **autant aux admins
qu'aux développeurs**. Nul besoin de connaître Git, la CLI Salesforce ou le DevOps : chaque étape est
un clic dans VS Code ou sur GitHub, avec une capture d'écran à l'appui. Vous pouvez vous arrêter
après le Niveau 1 et vous saurez livrer. Le Niveau 2, c'est là que vous apprenez quoi faire quand la
livraison se passe mal, ce qui représente l'essentiel du métier.

!!! tip "Développeurs : ouvrez les blocs Sous le capot"
    Chaque étape importante se termine par un bloc replié **Sous le capot** : la commande que le
    bouton a lancée, les fichiers qu'elle a écrits, et la décision qu'elle a prise à votre place. Un
    admin peut les sauter. Un développeur devrait tous les lire : c'est ainsi que vous apprenez ce
    que fait sfdx-hardis, et c'est ce dont vous aurez besoin le jour où vous le scripterez, où vous
    déboguerez une pipeline, ou où vous attaquerez le Niveau 3.

**Le Niveau 2 est obligatoire avant le Niveau 3.** Un release manager relit les erreurs de
déploiement, les conflits et les deployment actions des autres. Quelqu'un qui n'en a jamais résolu
un seul ne peut pas les relire.

## Ce qu'il vous faut

- Un ordinateur sur lequel vous avez le droit d'installer des logiciels. Le Lab 1.1 déroule ce qu'il
  faut installer, un téléchargement à la fois, captures d'écran comprises. Rien à installer, ou pas
  le droit ? [Agentforce Vibes](https://www.salesforce.com/agentforce/developers/vibe-coding/ide/) est VS Code dans un
  onglet, lancé depuis une sandbox de développement ou depuis l'org Developer Edition gratuite pour
  laquelle le Lab 1.2 vous inscrit, et le cours y fonctionne aussi, comme dans
  [Cursor](https://cursor.com/). Suivez-le dans VS Code, Agentforce Vibes ou Cursor, et gardez le
  même du début à la fin.
- Un compte [GitHub](https://github.com/), gratuit.
- Une org [Salesforce Developer Edition gratuite](https://developer.salesforce.com/signup) pour
  commencer, et une deuxième au Niveau 3. Le Lab 1.2 vous y inscrit, et crée à partir de celle-là
  les autres orgs dont le cours a besoin.
- Rien d'autre. Aucun service payant, aucune licence, aucune carte bancaire.

## Ce que vous obtenez

Un **badge Cloudity** par niveau, sur une page que vous pouvez partager. Il porte votre nom tel que
votre profil GitHub l'affiche, vos identifiants GitHub et Trailblazer, et la date. Voici les trois
que Marc B a obtenus :

![Badge de niveau 1 de Marc B](../_assets/badges/example-level-1.svg){ width="200" }
![Badge de niveau 2 de Marc B](../_assets/badges/example-level-2.svg){ width="200" }
![Badge de niveau 3 de Marc B](../_assets/badges/example-level-3.svg){ width="200" }

**Claim my badge**, dans le menu Training de chaque niveau, vérifie votre travail une dernière fois
et ouvre la demande pour vous. Un job rejoue ensuite tous les contrôles du niveau sur votre
repository et publie la page du badge.

C'est un badge, pas une certification. Il n'y a ni examen ni accréditation. Partagez-le dans
*Featured* sur LinkedIn, pas dans *Licenses & certifications*.

Votre badge apparaît aussi sur votre bannière Trailhead.
[Trailhead Banner](https://thb.nabondance.me/) dessine une image de couverture LinkedIn à partir
d'un nom d'utilisateur Trailblazer : le rang, les compteurs de badges, les certifications, et le
badge sfdx-hardis le plus élevé que vous avez réclamé. Tapez votre nom d'utilisateur Trailblazer,
générez l'image, et mettez-la en bannière de votre profil LinkedIn.

![Une bannière Trailhead, avec le badge sfdx-hardis Release Manager sur la rangée du haut](../_assets/badges/trailhead-banner.png)

## Sous le capot, à chaque fois

Chaque lab est écrit sous forme de clics dans l'extension VS Code, parce que c'est ainsi que le
produit est fait pour être utilisé. Chaque étape importante se termine ensuite par un bloc **Sous le
capot** qui nomme la commande exacte qui a tourné et les fichiers qu'elle a touchés, pour que vous
repartiez avec un modèle mental plutôt qu'un réflexe moteur.

## Commencer

[Niveau 1 - Contributeur, les bases](level-1-contributor-basics/index.md){ .md-button .md-button--primary }

## Qui est derrière ce cours

[Cloudity](https://cloudity.com/fr/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=home) est une société de conseil Salesforce. Elle développe sfdx-hardis
pour ses propres équipes de delivery, le publie en open source, et offre ce cours gratuitement. Rien
ici n'est une version d'essai : il n'existe pas de version payante du cours, ni du produit.

Ce que Cloudity vend, c'est le travail sur de vrais projets :
[Agentforce et Data Cloud](https://cloudity.com/fr/services/ia-et-data/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=home),
[Revenue Cloud](https://cloudity.com/fr/services/gestion-du-cycle-de-vie-des-revenus/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=home),
[Field Service](https://cloudity.com/fr/services/gestion-des-interventions-terrain/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=home),
[Marketing Cloud](https://cloudity.com/fr/services/engagement-marketing-et-personnalisation/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=home),
[intégration](https://cloudity.com/fr/services/implementation-et-integration-salesforce/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=home),
[services managés](https://cloudity.com/fr/services/services-manages/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=home),
et [Salesforce DevOps](https://sfdx-hardis.cloudity.com/salesforce-devops-home/#get-help-from-cloudity) avec les outils que ce cours enseigne.

[![Cloudity, conseil Salesforce : Agentforce, Data Cloud, Revenue Cloud, Field Service, Marketing Cloud, intégration, services managés, DevOps](../_assets/brand/cloudity-services-fr.png){ .cloudity-banner .wide-only loading=lazy }](https://cloudity.com/fr/services/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=home)
[![Cloudity, conseil Salesforce : Agentforce, Data Cloud, Revenue Cloud, Field Service, Marketing Cloud, intégration, services managés, DevOps](../_assets/brand/cloudity-services-fr-narrow.png){ .cloudity-banner .narrow-only loading=lazy }](https://cloudity.com/fr/services/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=home)

[Parler à Cloudity](https://cloudity.com/fr/contactez-nous/?utm_source=sfdx-hardis-training&utm_medium=referral&utm_campaign=home){ .md-button }

[Read this course in English](../en/index.md)
