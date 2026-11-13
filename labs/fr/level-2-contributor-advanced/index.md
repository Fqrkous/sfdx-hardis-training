---
title: "Niveau 2 - Contributeur Salesforce DevOps avancé"
description: "Affrontez ce que les vraies livraisons Salesforce vous envoient : erreurs de déploiement, deployment actions, tests Apex, profils et conflits de merge, avec sfdx-hardis."
id: l2-home
level: 2
lang: fr
source_rev: "48331b75a1fc04f71e4c2e9dc0683635a6de0620"
---

# Niveau 2 - Contributeur Salesforce DevOps avancé

**Durée** : environ 5 h 45.<!-- observed --> Observé sur les Labs 2.1 à 2.9 : médiane 8 h 14, 32 participants, le plus rapide 4 h 03.<!-- /observed -->

**Prérequis** : le [Niveau 1](../level-1-contributor-basics/index.md). Pas facultatif : chaque lab
d'ici suppose que la boucle est automatique pour vous.

## L'histoire

Trois mois plus tard. Vous avez livré une douzaine de stories et la boucle est devenue un réflexe.
Puis arrivent celles qui ne passent pas.

Un déploiement qui échoue sur une dépendance dont personne ne vous avait parlé. Un champ qu'on ne
peut pas rendre obligatoire parce que l'org contient déjà trente enregistrements sans lui. Des
enregistrements de référence et un batch nocturne qui doivent suivre votre modification dans chaque
org, et aucun déploiement ne les emportera pour vous. Mariia, qui a modifié le même flow et le même
permission set que vous et a mergé en premier.

C'est la moitié du parcours contributeur qui vous rend prêt pour un vrai projet CI/CD : quand
quelque chose casse, vous savez où regarder et quoi faire, et vous perdez des minutes au lieu de
jours.

## Ce que vous allez faire

| Lab                                                                   | Titre                                                                   | Durée  |
|-----------------------------------------------------------------------|-------------------------------------------------------------------------|--------|
| [2.1](2-1-backpromote-your-teammates-work.md)                         | Backpromote : remettre votre org de dev au niveau de l'équipe           | 35 min |
| [2.2](2-2-fix-a-missing-dependency-deployment-error.md)               | Corriger une erreur de déploiement due à une dépendance manquante       | 35 min |
| [2.3](2-3-fix-broken-records-with-an-apex-deployment-action.md)       | Réparer des enregistrements cassés avec une deployment action Apex      | 40 min |
| [2.4](2-4-ship-reference-data-and-a-batch-with-deployment-actions.md) | Livrer des données de référence et un batch avec des deployment actions | 1 h 10 |
| [2.5](2-5-pass-code-quality-and-apex-test-coverage.md)                | Passer la barrière de qualité de code et la couverture de tests Apex    | 25 min |
| [2.6](2-6-permission-sets-and-profiles.md)                            | Permission sets, profils, et pourquoi une autorisation disparaît        | 25 min |
| [2.7](2-7-resolve-a-git-merge-conflict.md)                            | Résoudre un conflit de merge Git avec un collègue                       | 40 min |
| [2.8](2-8-recover-from-committing-the-wrong-metadata.md)              | Se remettre d'avoir commité la mauvaise métadonnée                      | 25 min |
| [2.9](2-9-capstone-deliver-a-user-story-that-has-it-all.md)           | Épreuve finale : livrer une User Story qui a tout                       | 45 min |

## Le menu Training

Tout ce que ce cours vous demande de lancer en dehors des boutons du produit lui-même tient dans un
seul menu. Ouvrez la **Welcome page**, et sous **CUSTOM MENUS** cliquez sur la carte
**Training: Level 2**. Ses commandes prennent alors toute la page :

![Le menu de formation du niveau 2, ouvert sur la Welcome page](../../_assets/annotated/vscode/welcome-custom-menu-2.png)

Elles sont huit, et les labs les appellent par ces noms :

| Commande                           | Ce qu'elle fait                                                                                                                                          |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Set up my training environment** | Reconstruit une scratch org qui a expiré, et pointe la pipeline dessus                                                                                   |
| **Where am I?**                    | Dit à quel niveau et à quel lab vous en êtes, et ce qu'il faut faire ensuite                                                                             |
| **Simulate my teammates**          | Crée les branches et Pull Requests de collègues dont un lab a besoin                                                                                     |
| **Set up one of my training orgs** | Déploie l'application Helios et ses données dans une org que vous choisissez                                                                             |
| **Check my work**                  | Vérifie le lab que vous venez de terminer                                                                                                                |
| **Claim my badge**                 | Contrôle le niveau entier, puis ouvre votre demande de badge déjà remplie                                                                                |
| **Update my course**               | Apporte les changements reçus par le cours depuis votre fork, par une Pull Request vers `integration`                                                    |
| **Reset this level**               | Recommence le Niveau 2 : `integration`, et si vous le voulez les branches des labs et les orgs ([Recommencer le cours](../help.md#recommencer-le-cours)) |

Il y a un menu par niveau, et chacun ne contient que ce dont ce niveau a besoin : rien de ce que vous
avez sous les yeux ne concerne un lab que vous n'avez pas encore atteint.

Les mêmes commandes sont dans la vue **SFDX HARDIS** de la barre de gauche, sous
**Training: Level 2**. Les deux chemins lancent la même chose.

## Si vous nous rejoignez ici

Vous pouvez commencer le Niveau 2 sans avoir fait le Niveau 1, à condition d'accepter que les labs
supposent la boucle acquise. Mettez-vous d'abord dans un état connu :

1. Faites les Labs 1.1 et 1.2 en entier : les outils, votre org Developer Edition, les scratch orgs,
   le fork, Actions, les secrets
2. Welcome page > **Training: Level 2** > **Reset this level**

Cela met votre branche `integration` sur `training/start-level-2`, c'est-à-dire ce à quoi ressemble
le repository une fois le Niveau 1 terminé.

## Si vous revenez après une pause

Les trois scratch orgs créées au Niveau 1 vivent 30 jours. Si **Orgs Manager** ne liste plus l'une
d'elles comme **Connected**, c'est qu'elle a expiré : Welcome page > **Training: Level 2** >
**Set up my training environment**. Il en crée une nouvelle avec l'application Helios, pointe le
pipeline dessus, et laisse les autres tranquilles.

Une nouvelle `helios-dev` reçoit l'application depuis la branche sur laquelle vous êtes quand elle
est créée. Le Lab 2.1, étape 1c, dit comment vérifier qu'elle contient vos stories du Niveau 1, et
comment les y mettre.

[Commencer par le Lab 2.1](2-1-backpromote-your-teammates-work.md){ .md-button .md-button--primary }
