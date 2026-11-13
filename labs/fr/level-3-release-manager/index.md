---
title: "Niveau 3 - Release manager Salesforce DevOps"
description: "Tenez une pipeline CI/CD Salesforce avec sfdx-hardis : environnements, authentification JWT, promotions, notes de version, hotfixes, monitoring et métriques DORA."
id: l3-home
level: 3
lang: fr
source_rev: "75e9dcf35bded013cca6ededf3dc25db585fd59e"
---

# Niveau 3 - Release manager Salesforce DevOps

**Durée** : environ 9 h.<!-- observed --> Observé sur les Labs 3.1 à 3.11 : médiane 10 h 11, 14 participants, le plus rapide 2 h 56.<!-- /observed -->

**Prérequis** : le [Niveau 1](../level-1-contributor-basics/index.md) **et** le
[Niveau 2](../level-2-contributor-advanced/index.md). Les deux sont obligatoires, et l'audit du
badge les contrôle tous les deux avant de regarder quoi que ce soit ici.

## Pourquoi le Niveau 2 n'est pas facultatif

Un release manager relit les erreurs de déploiement, les deployment actions et les conflits des
autres. C'est exactement ce que le Niveau 2 vous fait traverser. Quelqu'un qui n'a jamais résolu une
erreur de déploiement ne peut pas juger si un contributeur a bien résolu la sienne, et les revues
qu'il fera porteront sur la mise en forme.

Si vous avez sauté le Niveau 2, faites-le. Ce sont quelques heures, et c'est la différence entre
approuver des Pull Requests et les comprendre.

## L'histoire

Victor Squeeker est parti. Il était le release manager, il a monté la pipeline il y a deux ans, et il
ne l'a jamais fini.

Ce dont vous héritez fonctionne, au sens où les contributeurs livrent dans `integration` tous les
jours et où le métier teste dans `uat`. Ce qu'il n'a pas :

- **Ni preprod ni production dans la pipeline.** Les branches existent. Rien n'y déploie
- **Pas d'authentification de CI correcte.** Il y a deux secrets de refresh token que quelqu'un a
  ajoutés à la hâte
- **Pas de monitoring.** Personne n'apprend qu'il y a un problème en production avant qu'un
  utilisateur n'appelle
- **Ni notes de version ni métriques.** Personne ne sait dire ce qui a été livré le mois dernier ni
  combien de temps cela a pris
- **Pas de documentation générée.** L'org a deux ans et la seule description qui en existe,
  c'était Victor

Votre première semaine consiste à finir la pipeline. Ensuite, vous la faites tourner.

## Le menu Training

Tout ce que ce cours vous demande de lancer en dehors des boutons du produit lui-même tient dans un
seul menu. Ouvrez la **Welcome page**, et sous **CUSTOM MENUS** cliquez sur la carte
**Training: Level 3**. Ses commandes prennent alors toute la page :

![Le menu de formation du niveau 3, ouvert sur la Welcome page](../../_assets/annotated/vscode/welcome-custom-menu-3.png)

Elles sont dix, et les labs les appellent par ces noms :

| Commande                              | Ce qu'elle fait                                                                                                                                          |
|---------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Set up my training environment**    | Reconstruit une scratch org qui a expiré, et pointe la pipeline dessus                                                                                   |
| **Where am I?**                       | Dit à quel niveau et à quel lab vous en êtes, et ce qu'il faut faire ensuite                                                                             |
| **Set up one of my training orgs**    | Déploie l'application Helios et ses données dans une org que vous choisissez                                                                             |
| **Simulate my teammates**             | Crée les branches et Pull Requests de collègues dont un lab a besoin                                                                                     |
| **Publish my pipeline configuration** | Ouvre une Pull Request vers `integration` avec la configuration que vous avez modifiée                                                                   |
| **Check my work**                     | Vérifie le lab que vous venez de terminer                                                                                                                |
| **Claim my badge**                    | Contrôle le niveau entier, puis ouvre votre demande de badge déjà remplie                                                                                |
| **Update my course**                  | Apporte les changements reçus par le cours depuis votre fork, par une Pull Request vers `integration`                                                    |
| **Reset this level**                  | Recommence le Niveau 3 : `integration`, et si vous le voulez les branches des labs et les orgs ([Recommencer le cours](../help.md#recommencer-le-cours)) |
| **Clean up a training org**           | Retire l'application Helios et ses données d'une org                                                                                                     |

Il y a un menu par niveau, et chacun ne contient que ce dont ce niveau a besoin : rien de ce que vous
avez sous les yeux ne concerne un lab que vous n'avez pas encore atteint.

Les mêmes commandes sont dans la vue **SFDX HARDIS** de la barre de gauche, sous
**Training: Level 3**. Les deux chemins lancent la même chose.

## Ce que vous allez faire

| Lab                                                       | Titre                                                          | Durée  |
|-----------------------------------------------------------|----------------------------------------------------------------|--------|
| [3.1](3-1-configure-the-pipeline-up-to-production.md)     | Configurer la pipeline CI/CD jusqu'à la production             | 1 h 35 |
| [3.2](3-2-review-a-contributor-pull-request.md)           | Relire et merger la Pull Request d'un contributeur             | 25 min |
| [3.3](3-3-deploy-to-integration-and-read-the-log.md)      | Lire le log de déploiement, et ce que .forceignore lui cache   | 1 h 15 |
| [3.4](3-4-merge-colliding-pull-requests.md)               | Trois Pull Requests pour une release : revoir l'ordre de merge | 15 min |
| [3.5](3-5-promote-to-uat-and-write-release-notes.md)      | Promouvoir en UAT et écrire les notes de version               | 50 min |
| [3.6](3-6-release-to-production-and-read-dora-metrics.md) | Livrer en production et lire vos métriques DORA                | 1 h    |
| [3.7](3-7-hotfix-and-retrofit.md)                         | La production est cassée : hotfix et retrofit                  | 35 min |
| [3.8](3-8-monitor-your-production-org.md)                 | Monitorer votre org de production                              | 10 min |
| [3.9](3-9-generate-the-project-documentation.md)          | Générer la documentation du projet Salesforce                  | 5 min  |
| [3.10](3-10-promote-a-subset-with-promotion-branches.md)  | Promouvoir un sous-ensemble avec les promotion branches (Beta) | 1 h 35 |
| [3.11](3-11-capstone-run-a-weekly-release-cycle.md)       | Épreuve finale : mener un cycle de release hebdomadaire        | 1 h    |

## Une org de plus

Les niveaux 1 et 2 ont tourné sur une org Developer Edition, `helios-prod`, et les trois scratch orgs
qu'elle a créées : `helios-dev`, `helios-integration` et `helios-uat`. Ce niveau ajoute la production
et l'étape qui la précède, et demande une inscription de plus.

Avant le Lab 3.1, inscrivez-vous à une org Developer Edition gratuite de plus sur
[developer.salesforce.com/signup](https://developer.salesforce.com/signup) et connectez-la dans
**Orgs Manager** avec l'alias `helios-preprod`. Alimentez ensuite les deux orgs Developer Edition
avec **Training: Level 3 > Set up one of my training orgs** : `helios-preprod`, et `helios-prod`,
qui jusqu'ici ne faisait que créer les autres et ne contenait rien. S'il s'arrête sur
`Profile Helios Crew`, la section **En cas de problème** du
[Lab 3.1](3-1-configure-the-pipeline-up-to-production.md) dit pourquoi.

Salesforce refuse une deuxième org Developer Edition sur une adresse email qui en a déjà une.
Donnez la même adresse avec un `+` et un mot avant le `@`, par exemple `monnom+preprod@gmail.com` :
le mail arrive toujours dans votre boîte, et Salesforce y voit une nouvelle adresse. Inscrivez-vous
depuis une fenêtre de navigation privée, déconnecté de Trailhead, sinon la page affiche un formulaire
court qui ne demande qu'un pays.

L'installation prend quelques minutes par org, et son compteur (`49/64` par exemple) peut rester
sur le même nombre plusieurs minutes vers la fin. Laissez VS Code tranquille jusqu'à ce qu'il dise
que l'application est déployée. Si VS Code dit que la fenêtre semble bloquée, choisissez **Wait**.

`helios-prod` reçoit les mêmes sources que les autres orgs. Rien n'alimente un historique de
déploiement, et l'alimentation elle-même n'est pas un déploiement du pipeline : les métriques DORA
du Lab 3.6 ne contiennent donc que les jobs de déploiement que vos propres merges ont lancés.

Si une scratch org a expiré depuis le Niveau 2, **Training: Level 3 > Set up my training
environment** la reconstruit d'abord.

## Votre rôle change

Aux niveaux 1 et 2, vous construisiez des User Stories et ouvriez leurs Pull Requests. Un release
manager ne le fait pas. Vos collègues ouvrent les Pull Requests, **Simulate my teammates** les joue,
et vous les relisez, les mergez ou les renvoyez. Ce que vous créez vous-même, c'est la pipeline : sa
configuration, que **Publish my pipeline configuration** envoie vers `integration` par une Pull
Request, et les promotions d'une branche majeure à la suivante, `integration` vers `uat`, `uat` vers
`preprod`, `preprod` vers `main`.

[Commencer par le Lab 3.1](3-1-configure-the-pipeline-up-to-production.md){ .md-button .md-button--primary }
