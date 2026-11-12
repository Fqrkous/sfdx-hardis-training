---
id: lab-3-4
title: "Lab 3.4 - Trois Pull Requests pour une release : revoir l'ordre de merge"
description: "Revoyez l'ordre de merge de deux Pull Requests qui ont modifié le même permission set, et renvoyez une troisième en échec, en release manager."
level: 3
lab: 4
lang: fr
source_rev: "70c35ef7a4ec9d940ff910ac757552455666ca8d"
screenshots:
  - annotated/vscode/welcome-custom-menu-3
  - annotated/vscode/pipeline-config--cleaning-overwrite
depends_on:
  commands: [hardis:project:deploy:smart]
  flags: []
  config: [autoCleanTypes, useDeltaDeployment]
  panels: [pipeline, pipelineConfig, packageXml]
  docs: [salesforce-devops-config-cleaning, salesforce-devops-config-delta-deployment, salesforce-devops-config-overwrite]
---

# Lab 3.4 - Trois Pull Requests pour une release : revoir l'ordre de merge

**Niveau** : 3 Release Manager

**Durée** : ~15 min<!-- observed --> (observé : médiane 16 min, 15 participants, le plus rapide 6 min)<!-- /observed -->

**Vous allez** : revenir sur l'ordre dans lequel deux Pull Requests sur le même fichier sont
passées, vérifier qu'aucune n'a rien perdu, et renvoyer une troisième qui ne marche pas.

## La situation

Vendredi après-midi. Trois stories étaient prévues pour la release de la semaine :

| Pull Request                          | Auteur             | Contrôles | Ce qu'elle touche                                | Où elle en est                  |
|---------------------------------------|--------------------|-----------|--------------------------------------------------|---------------------------------|
| US-018 Cap the crew size              | Mariia Pyvovarchuk | verts     | le flow d'affectation, `Helios_Delivery_Manager` | mergée, au Niveau 2             |
| US-019 Quote PDF                      | Romain Panda       | verts     | `Helios_Delivery_Manager`                        | mergée, à l'épreuve du Niveau 2 |
| US-020 Refactor InstallationScheduler | Mariia Pyvovarchuk | en échec  | `InstallationScheduler`                          | pas encore ouverte              |

Deux d'entre elles ont modifié le même permission set, et elles sont déjà dans `integration` : vous
les avez mergées en contributeur au Niveau 2, sans qu'un release manager décide de quoi que ce soit.
**Reset this level** démarre le Niveau 3 depuis une branche qui les contient aussi. Rien ne se
percute donc sous vos yeux dans ce lab. Ce que vous faites, c'est la moitié release manager du
travail, après coup : l'ordre était-il le bon, le second merge a-t-il gardé ce que le premier avait
apporté, et que devient la troisième, qui ne marche pas.

Sur un vrai projet, les deux premières questions se posent avant le merge. Se les poser sur deux
merges que vous pouvez encore lire en entier est la façon la moins chère d'apprendre à se les poser.

## Avant de commencer

- [ ] [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md) terminé
- [ ] Rien de non commité

## Les étapes

### 1. Recevoir la seule Pull Request encore à venir

Objectif : la Pull Request de US-020 ouverte vers `integration`, ses contrôles en échec, et les deux
Pull Requests mergées de US-018 et US-019 ouvertes à côté.

#### À faire

1. Ouvrez **Training: Level 3** > **Simulate my teammates**, puis **US-020 Refactor InstallationScheduler**.
   C'est sur la Welcome page, où chaque menu de niveau est une page de cartes, et dans la vue
   **SFDX HARDIS** de la barre de gauche, où chaque niveau est un dossier à déplier. Les deux chemins
   lancent la même chose

   ![Le menu Training du niveau 3 sur la Welcome page](../../_assets/annotated/vscode/welcome-custom-menu-3.png)

2. Retrouvez les Pull Requests mergées de US-018 et US-019, dans l'onglet **Pull Requests** de la
   fenêtre `integration` du panneau DevOps Pipeline, ou dans la liste **Closed** des Pull Requests de
   votre fork sur GitHub. Gardez-les ouvertes, les étapes suivantes les lisent
3. Attendez les contrôles de US-020. Ils échoueront

!!! warning "Attention"
    Ne simulez ni US-018 ni US-019. Chaque scénario de collègue sert une fois, et les deux sont déjà
    dans `integration` : la commande dirait "Nothing to commit" et n'ouvrirait rien.

#### Vous devriez voir

- La Pull Request de Mariia vers `integration`, ouverte pour vous : la commande affiche son adresse,
  et se termine par un bouton **Open the Pull Request** en bas du panneau
- Les contrôles de US-020 en échec

### 2. Trier avant de toucher à quoi que ce soit

Objectif : l'ordre qu'un release manager aurait choisi, mis en face de l'ordre dans lequel les merges
sont vraiment passés.

Classez les trois, dans cet ordre de questions.

#### À faire

1. Lesquelles sont vertes ? Une Pull Request en échec n'est pas une décision, c'est une tâche pour
   son auteur
2. Lesquelles touchent le même fichier ? US-018 et US-019 modifient toutes deux
   `Helios_Delivery_Manager`
3. Laquelle est la plus petite ? Toutes choses égales par ailleurs, mergez la plus petite d'abord
4. Comparez avec ce qui s'est passé : l'onglet **Pull Requests** de la fenêtre `integration` les
   liste dans l'ordre où elles sont passées

#### Pourquoi

Ne passez pas votre vendredi à réparer le refactor de Mariia. Celle de US-018 et US-019 qui a mergé
en second a hérité de ce que la première avait fait à ce fichier, et l'étape 5 parle de ce que
"hériter" a voulu dire au juste. La plus petite passe d'abord parce que son auteur a moins à refaire
si l'autre atterrit mal.

L'ordre qu'un release manager aurait choisi : US-019 d'abord (petite, verte, personne ne dépend
d'elle), puis US-018 (verte, plus grosse), et US-020 repart chez Mariia. Au Niveau 2, US-018 est
passée en premier, parce que le [Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md) en avait besoin. Rien n'a cassé, et l'étape 5 montre
pourquoi. Savoir si l'ordre comptait est une question à laquelle on ne répond qu'en lisant ce qu'a
fait le second merge.

#### Vous devriez voir

- L'ordre que vous auriez choisi : US-019, puis US-018, et US-020 qui repart chez Mariia
- L'ordre réel, dans l'onglet **Pull Requests** : US-018 en premier

### 3. Renvoyer US-020, correctement

Objectif : un commentaire de revue sur US-020 qui nomme l'échec, dit à qui il appartient et ce qu'il
advient de la livraison, et la Pull Request laissée ouverte.

#### À faire

1. Ouvrez US-020 et lisez l'échec, sous **Deployment errors** dans le commentaire sfdx-hardis.
   Lisez-le correctement avant d'écrire quoi que ce soit, parce que ce n'est pas ce que les mots
   "tests en échec" laissent croire
2. Laissez un commentaire de revue qui fait trois choses :

   > The check fails to compile `InstallationSchedulerTest`: `earliestInstallDate` returns a `Datetime`
   > now and the test still assigns it to a `Date`, in two places. No tests ran. Not blocking anything else, so US-019
   > and US-018 go out in this week's release and this one can land on Monday.

3. Laissez la Pull Request ouverte et passez à autre chose

!!! warning "Ne corrigez pas vous-même la Pull Request d'un contributeur"
    C'est plus rapide une fois et coûteux toutes les fois suivantes. L'auteur n'apprend pas l'échec,
    et vous devenez la personne à qui l'on remonte chaque contrôle en échec.

#### Pourquoi

C'est un vrai échec, dans son code, et c'est à elle de le corriger. `earliestInstallDate` renvoie
désormais un `Datetime`, et `InstallationSchedulerTest` l'assigne encore à une `Date`, à deux
endroits. La classe ne compile pas, donc aucun test ne tourne. Ce que le commentaire sfdx-hardis vous
donne, sous **Deployment errors**, est une erreur de compilation avec un nom de classe, deux fois, pas
une assertion en échec.

Le commentaire nomme l'échec, dit à qui il appartient, dit ce qu'il advient de la livraison. Sur un
vrai projet vous l'enverriez en **Request changes**. GitHub ne le propose pas sur une Pull Request
ouverte depuis votre propre compte, et dans ce fork les Pull Requests de collègues sont ouvertes
depuis le vôtre : un simple commentaire fait donc l'affaire ici.

#### Vous devriez voir

- US-020 toujours ouverte, avec votre commentaire qui nomme l'erreur de compilation de
  `InstallationSchedulerTest`

### 4. Lire comment US-019 est passée

Objectif : vous savez ce que US-019 a changé dans `Helios_Delivery_Manager`, et combien il y avait
peu à en dire.
Rappel : [Lab 3.2](3-2-review-a-contributor-pull-request.md)

#### À faire

1. Regardez le diff de US-019 sur `Helios_Delivery_Manager`
2. Lisez-la comme le [Lab 3.2](3-2-review-a-contributor-pull-request.md) vous a appris à en relire une, et notez combien il y avait peu
   à en dire

#### Pourquoi

Verte, petite, rien sur son chemin. Si elle avait encore été ouverte, vous l'auriez mergée sur cette
lecture.

Rien ici n'a été difficile, et c'est exactement pour cela qu'il vaut la peine de savoir ce qui s'est
passé ensuite.

#### Vous devriez voir

- Un nouveau bloc `<fieldPermissions>` pour `Panel_Batch__c.Quote_Pdf_Url__c`, ajouté vers le bas du
  fichier, là où vivent les autorisations `Panel_Batch__c`

### 5. Trouver le conflit qui n'a jamais eu lieu

Objectif : vous savez dire pourquoi git a mergé deux modifications du même fichier sans un mot, et
quoi faire quand il s'arrête.
Rappel : [Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md)

US-018 a accordé `Installation__c.Crew_Capacity_Cap__c`, vers le haut du même fichier. US-019 a
accordé `Panel_Batch__c.Quote_Pdf_Url__c`, vers le bas. Deux personnes, même fichier, même semaine.

#### À faire

1. Ouvrez le fichier sur `integration`

#### Pourquoi

Git les a mergées sans un mot. Pas de conflit, pas de résolution, pas de second regard.

Ce n'est ni de la chance ni de l'intelligence de la part de git. Un conflit demande que les deux
modifications atterrissent au même endroit, dans les quelques lignes de contexte que git compare.
Celles-ci sont à environ soixante-dix lignes l'une de l'autre dans un fichier trié alphabétiquement :
git a donc pris les deux et est passé à autre chose. Le [Lab 2.7](../level-2-contributor-advanced/2-7-resolve-a-git-merge-conflict.md) vous a donné l'autre cas : votre
autorisation `Crew_Notes__c` était à une ligne du `Crew_Capacity_Cap__c` de Mariia, git n'a pas pu
choisir, et il s'est arrêté pour demander.

Ce que le release manager doit en retenir n'est pas "les permission sets entrent rarement en
conflit". C'est ceci : un merge silencieux est le cas courant, et un conflit est le cas rare. Git
vous avertit du cas rare. Rien ne vous avertit du cas courant : si vous voulez savoir que les deux
autorisations ont survécu, vous devez aller regarder. C'est l'étape 6, et sur un vrai projet c'est
une habitude plutôt qu'une étape.

Quand git s'arrête et demande, les conflits de permission set sont presque toujours prendre les
deux : un champ chacun, et le permission set en contient autant qu'il en faut. Résolvez en gardant
les deux blocs `<fieldPermissions>` dans l'ordre alphabétique, puis attendez que les contrôles
repassent. Un conflit résolu dans l'éditeur web est un nouveau commit, et il n'a jamais été
validé. Merger sans revalider est la façon dont une résolution qui a perdu une balise fermante
atteint une org.

#### Vous devriez voir

- Les deux autorisations dans le fichier sur `integration`, dans l'ordre, comme si une seule
  personne les avait écrites

### 6. Regarder le permission set dans l'org

Objectif : `Helios_Delivery_Manager` dans `helios-integration` portant les deux nouvelles
permissions de champ.

#### À faire

1. Dans `helios-integration`, vérifiez que `Helios_Delivery_Manager` a les deux nouvelles
   permissions de champ : `Crew_Capacity_Cap__c` sur Installation et `Quote_Pdf_Url__c` sur Panel Batch

#### Vous devriez voir

- `Crew_Capacity_Cap__c` sur Installation et `Quote_Pdf_Url__c` sur Panel Batch, toutes deux
  accordées par `Helios_Delivery_Manager`

### 7. Comprendre ce qui a rendu cela survivable, et ce qui n'est pas là

Objectif : vous savez montrer du doigt les trois mécanismes, et dire lequel fait quelque chose ici.
Rappel : [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md)

Trois mécanismes méritent qu'on sache les montrer du doigt.

#### À faire

1. Ouvrez **Pipeline Settings** depuis le panneau DevOps Pipeline et regardez chacun, parce que seul
   le premier fait réellement quelque chose ici

   ![Global Pipeline Settings, avec les onglets qui contiennent les réglages de nettoyage, d'écrasement et de delta](../../_assets/annotated/vscode/pipeline-config--cleaning-overwrite.png)

2. Le nettoyage : ouvrez l'onglet **Salesforce Project** **(1)** des **Global Settings**, et trouvez
   **Auto-Cleaning types** (`autoCleanTypes`)
3. Le déploiement delta : ouvrez l'onglet **Deployment** **(2)** global, et lisez **Use Delta
   Deployment** **(3)**

#### Pourquoi

Le nettoyage (`autoCleanTypes`) est activé, et c'est pourquoi ces deux autorisations étaient deux
petits blocs dans un permission set plutôt que deux modifications dans un profil de mille lignes. Un
conflit de profil est un mauvais après-midi. C'est l'essentiel de la raison pour laquelle le projet
interdit les permissions sur les profils.

Le gestionnaire d'écrasement protège les composants délibérément
différents d'une org à l'autre. Tout ce qui est listé dans `manifest/package-no-overwrite.xml` est
retiré du package quand l'org cible le possède déjà, pour qu'un déploiement ne puisse pas aplatir un
named credential qui pointe vers un endpoint différent dans chaque environnement. Le projet démarre
avec la liste que reçoit tout projet sfdx-hardis. Elle couvre rapports, tableaux de bord, connected
apps et credentials, Helios ne déploie rien de tout cela, donc rien de ce qu'il déploie n'est encore
protégé : le [Lab 3.5](3-5-promote-to-uat-and-write-release-notes.md) y ajoute la première entrée qui compte, avant la première promotion
vers `uat`. La liste est un fichier : on l'ouvre depuis le menu **Deployment packages** du panneau
DevOps Pipeline, pas depuis un onglet de celui-ci.

Le déploiement delta est **Use Delta Deployment**, et le [Lab 3.3](3-3-deploy-to-integration-and-read-the-log.md) vous a montré qu'il est
**Disabled** ici. Activé, chaque merge déploie les composants qui ont changé plutôt que le package
déclaré. C'est une décision de rapidité et de rayon d'impact, pas un filet de sécurité : il n'empêche
pas un merge d'en écraser un autre, parce que les deux déploiements envoient ce que leur propre
commit contient.

<details markdown="1"><summary>Sous le capot : les trois mécanismes et où chacun vit</summary>

| Mécanisme                 | Configuration                                   | Ce qu'il fait                                                                               |
|---------------------------|-------------------------------------------------|---------------------------------------------------------------------------------------------|
| Nettoyage                 | `autoCleanTypes` dans `config/.sfdx-hardis.yml` | Réécrit les sources **au moment du commit**, dans la branche du contributeur                |
| Gestionnaire d'écrasement | `manifest/package-no-overwrite.xml`             | Retire des composants du package **au moment du déploiement**, quand l'org les possède déjà |
| Delta                     | `useDeltaDeployment`                            | Réduit le package à ce qui a changé depuis le dernier commit déployé                        |

La distinction entre les deux premiers mérite d'être tenue au clair, parce qu'ils échouent
différemment.

Le nettoyage est une décision **de source** : ce que le repository a le droit de contenir. Quand il
écarte quelque chose, le composant n'est réellement plus dans le repository, et le diff le montre.

L'écrasement est une décision **de déploiement** : ce que cette org-là a le droit de recevoir. Le
composant reste dans le repository, et il n'est simplement pas envoyé à une org qui a déjà sa propre
version. Une org neuve, qui n'a rien, le reçoit.

C'est pourquoi un named credential a sa place dans la liste d'écrasement et pas dans les règles de
nettoyage : une org neuve doit en recevoir un, et une org existante doit garder le sien.

</details>

#### Vous devriez voir

- Le nettoyage activé, dans l'onglet **Salesforce Project**
- **Use Delta Deployment** à **Disabled**, dans l'onglet **Deployment**
- Aucun onglet pour la liste d'écrasement, qui est un fichier

## Ce que vous devez voir

- [ ] US-019 et US-018 toutes deux dans l'historique d'`integration`
- [ ] US-020 ouverte, avec une revue qui nomme l'erreur de compilation
- [ ] `Helios_Delivery_Manager` dans `helios-integration` portant les deux autorisations

## En cas de problème

**Simulate my teammates dit "Nothing to commit".**
Ce scénario est déjà dans votre `integration`. Attendu pour US-018 et US-019, que le
Niveau 3 contient dès le départ. Pour US-020, cela veut dire que vous l'avez déjà reçue : sa Pull
Request est ouverte dans votre fork.

**Une des deux autorisations manque dans le permission set.**
Quelque chose a pris un côté du fichier en bloc, très probablement un merge manuel pendant le
Niveau 2. Remettez-la dans une Pull Request de suite, pas en modifiant l'org.

**Deux Pull Requests attendent et les deux sont vertes.**
Mergez-les une à la fois, en attendant la fin de chaque déploiement. Merger deux choses à la fois
dans la même branche est la façon dont un release manager perd une soirée.

## Vérifiez votre travail

Welcome page > **Training: Level 3** > **Check my work**, puis choisissez le **Lab 3.4**.

## Pour aller plus loin

- [Nettoyage automatique](https://sfdx-hardis.cloudity.com/salesforce-devops-config-cleaning/)
- [Déploiements delta](https://sfdx-hardis.cloudity.com/salesforce-devops-config-delta-deployment/)
- [Gestion des écrasements](https://sfdx-hardis.cloudity.com/salesforce-devops-config-overwrite/)

[Suite : Lab 3.5 - Promouvoir en UAT et écrire les notes de version](3-5-promote-to-uat-and-write-release-notes.md){ .md-button .md-button--primary }
