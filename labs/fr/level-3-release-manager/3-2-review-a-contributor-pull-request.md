---
id: lab-3-2
title: "Lab 3.2 - Relire et merger la Pull Request d'un contributeur"
description: "Relisez la Pull Request Salesforce d'une collègue en release manager : trouvez ce que le contrôle de déploiement a manqué, demandez une correction, et mergez."
level: 3
lab: 2
lang: fr
source_rev: "9b0845fa6e449a484336ca227115de298e642f6a"
screenshots:
  - annotated/web/github-pr-files
  - annotated/vscode/pipeline-review-pr
  - annotated/vscode/pipeline-pr-window-review-files
  - annotated/vscode/welcome-custom-menu-3
depends_on:
  commands: [hardis:project:deploy:smart, hardis:git:artifacts:download]
  flags: [--check]
  config: []
  panels: [pipeline]
  docs: [salesforce-devops-validate-merge-request, salesforce-devops-handle-merge-request-results]
---

# Lab 3.2 - Relire et merger la Pull Request d'un contributeur

**Niveau** : 3 Release Manager

**Durée** : ~25 min<!-- observed --> (observé : médiane 25 min, 14 participants, le plus rapide 12 min)<!-- /observed -->

**Vous allez** : relire le travail de quelqu'un d'autre, trouver ce que le robot n'a pas vu, demander
une correction, et merger.

## La situation

Mariia a une nouvelle story, **US-052 - The Installation layout in two columns** : les
planificateurs font défiler la section Information de chaque installation pendant que sa deuxième
colonne reste vide. Sa Pull Request est ouverte, ses contrôles sont verts, et elle vous attend.

Des contrôles verts veulent dire "ça se déploiera". Ils ne veulent pas dire "c'est juste". Décider du
second est votre travail désormais, avant le merge, et c'est la part du métier de release manager
qu'on ne peut pas automatiser. Une revue après le merge est un audit : la modification est déjà dans
`integration`, et en route vers toutes les orgs qui suivent.

## Avant de commencer

- [ ] [Lab 3.1](3-1-configure-the-pipeline-up-to-production.md) terminé : quatre branches majeures, et l'authentification JWT sur `preprod` et `main`
- [ ] Une copie de travail propre

## Les étapes

### 1. Recevoir la Pull Request de Mariia

Objectif : la Pull Request US-052 de Mariia ouverte dans votre fork, avec ses deux contrôles
terminés.

#### À faire

1. **Training: Level 3** > **Simulate my teammates**, depuis la Welcome page, et choisissez
   **US-052 The Installation layout in two columns**

   ![Le menu Training du niveau 3 sur la Welcome page](../../_assets/annotated/vscode/welcome-custom-menu-3.png)

2. Ouvrez sa Pull Request depuis **Pull requests**, et attendez ses deux contrôles

#### Vous devriez voir

- Sa Pull Request vers `integration` dans votre fork (votre copie personnelle du repository du cours
  sur GitHub, par exemple `github.com/my-username/sfdx-hardis-training`), avec ses deux contrôles
  terminés

### 2. Lire le robot d'abord

Objectif : vous savez ce que le contrôle dit du déploiement, et vous avez la liste des composants
qu'il a gardée.

Lisez le commentaire sfdx-hardis, de haut en bas. Quatre choses, dans cet ordre.

#### À faire : lire le commentaire

1. Est-ce que ça s'est déployé ? Le commentaire s'ouvre sur une bannière, *Validation* sur un
   job de contrôle et *Deployment* sur un job de merge, puis un verdict : **✅ Ready to merge into
   `integration`**, ou **❌ Cannot merge into `integration`** suivi de la raison, comme `1
   deployment error`. L'identifiant de déploiement Salesforce n'est affiché nulle part : il est
   porté par un marqueur HTML invisible, pour qu'un job de merge puisse réutiliser la validation en
   Quick Deploy
2. Combien est-ce que ça déploie ? La ligne **Metadata** du tableau **Check | Result** sous le
   verdict compte combien de composants changeraient, répartis en créés, mis à jour et supprimés,
   et combien ont été validés face à l'org. Plus bas, la section repliée **📋 ... components would
   change in the org** donne ces changements par type de composant. Si les compteurs ne
   correspondent pas à la taille de la story, c'est votre signal pour aller lire le diff
3. Qu'est-ce que ça supprime ? Un compteur `deleted` sur cette même ligne, affiché seulement
   quand quelque chose disparaît, et la colonne **🗑️ Deleted** du tableau, qui dit quel genre de
   composant disparaît : un champ, une classe, une présentation de page. Les Flows y sont comptés
   comme tout autre composant, et ont droit à une chose de plus : un commentaire de diff à eux,
   **🔀 Flow** suivi de son libellé, publié en dessous pour chaque Flow modifié. Un Flow dont seul
   le statut change, activé ou désactivé, n'a pas de commentaire de diff et n'est nommé nulle part :
   lisez le diff pour ceux-là. Une section **Flow deletion** apparaît quand des versions sont
   retirées. Le commentaire
   ne nomme aucun autre composant supprimé : la liste, une ligne par composant, est dans les
   fichiers que le contrôle a gardés, et la fin de cette étape l'ouvre
4. Tests et couverture. La ligne **Apex tests** : la couverture face à l'objectif chaque fois
   qu'elle a été mesurée, ou pourquoi les tests n'ont pas tourné, et un bloc replié **🧪 Apex test
   classes** quand le job a lancé des classes de test nommées. Les échecs seulement quand il y en a

#### Pourquoi cet ordre

Le lire dans cet ordre prend deux minutes. Sur US-052 il est vert, un petit nombre de composants mis
à jour et rien de supprimé, et il a raison sur tout. Les compteurs exacts sont les vôtres, pas
ceux du lab : ils comparent votre branche avec ce que contient votre `helios-integration`
aujourd'hui, une story qui touche un fichier peut donc quand même mettre à jour quelques composants
quand votre org est en retard. L'absence de `deleted` dans la ligne **Metadata** est ce qui compte
ici, et c'est ce dont parle l'étape 4. Le commentaire vous dit aussi ce qu'il ne peut pas faire à votre place, et c'est
l'étape 3.

#### À faire : ouvrir la liste des composants, sans quitter VS Code

1. Ouvrez le panneau **DevOps Pipeline**. Il s'ouvre sur **Feature branches** **(1)** : la branche
   de Mariia y est, avec le numéro de sa Pull Request à côté **(2)**
2. Cliquez sur le numéro

   ![Le panneau DevOps Pipeline, avec la Pull Request de Mariia à côté de sa branche](../../_assets/annotated/vscode/pipeline-review-pr.png)

3. La fenêtre de la Pull Request s'ouvre. Sur son onglet **Validation**, cliquez sur **Files**
   **(1)**, puis sur `deployment-components.csv` **(2)**. Votre numéro n'est pas `#64`

   ![Le bouton Files du job de validation de la Pull Request de Mariia, ouvert sur ses rapports](../../_assets/annotated/vscode/pipeline-pr-window-review-files.png)

  !!! tip "Pas de bouton Files ?"
      Votre sfdx-hardis est plus ancien que la fonctionnalité : **Open job** mène aux
      mêmes fichiers sur GitHub, dans le **Summary** de l'exécution, sous **Artifacts**,
      **sfdx-hardis reports**.

#### Pourquoi la liste

Le commentaire donne des compteurs, et le contrôle a gardé la liste.

#### Vous devriez voir

- Un verdict vert, quelques composants mis à jour, et aucun `deleted` dans la ligne **Metadata**
- `deployment-components.csv` ouvert dans VS Code : une ligne par composant du package, avec son
  **Status**, `Created`, `Updated`, `Deleted` ou `Unchanged`. Un composant supprimé y serait nommé.
  `xls/deployment-components.xlsx`, sur la ligne suivante, est la même liste pour un tableur

### 3. Lire le diff, en cherchant ce que le robot ne peut pas voir

Objectif : le diff de la story lu à travers les quatre questions du tableau.

#### À faire

1. Cliquez sur **Files changed** **(1)**. L'arbre de fichiers à gauche liste ce que la story a
   touché : un fichier, la présentation de page **(2)**. Une ligne supprimée est marquée **(3)** :
   laissez-la pour l'instant, l'étape 4 en parle

   ![L'onglet Files changed de la Pull Request de Mariia](../../_assets/annotated/web/github-pr-files.png)

2. Parcourez le diff avec quatre questions :

| Question                                           | Pourquoi cela compte                                                                                                                               | Posée |
|----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|-------|
| Est-ce que cela correspond à la story ?            | Comparez avec US-052 dans le backlog. Les modifications en plus sont soit du hors-périmètre, soit un accident, et les deux méritent un commentaire | [ ]   |
| Est-ce que quelque chose disparaît ?               | Un champ retiré, une valeur de liste de sélection retirée, une permission retirée. Salesforce déploiera volontiers une suppression                 | [ ]   |
| Les permissions sont-elles sur un permission set ? | Un profil qui porte des permissions de champ veut dire que quelqu'un a contourné la convention                                                     | [ ]   |
| Est-ce que ce serait réversible ?                  | Si cela s'avère faux en production un vendredi, quel est le chemin du retour ?                                                                     | [ ]   |

#### Pourquoi

Le robot vérifie que le déploiement fonctionne. Il ne peut pas vérifier que le déploiement est une
bonne idée.

#### Vous devriez voir

- Un fichier modifié, la présentation de page, avec une ligne supprimée marquée **(3)**

### 4. Trouver ce que le robot a manqué

Objectif : le champ que la story retire par accident trouvé, et l'écart entre le diff et la
description nommé.

#### À faire

1. Lisez les trois modifications du diff de la présentation de page
2. Revenez au bloc supprimé **(3)** sur l'image de l'étape 3, celui que rien ne remet :
   `Total_Capacity_kW__c`
3. Comparez ensuite avec ce qu'a écrit Mariia. La description dit *the crew capacity cap moves to
   the second column*

#### Pourquoi

Le diff de la présentation de page a trois modifications. Deux vont ensemble :
`Crew_Capacity_Cap__c` quitte la première colonne, et revient dans la seconde. C'est la story.

La troisième est un bloc supprimé, et rien ne le remet. À lire vite, cela ressemble à une partie du
déplacement. Relisez : la capacité installée n'a pas été déplacée dans la deuxième colonne, elle a
quitté la présentation de page.

Rien n'échoue. Le champ existe toujours, le contrôle de déploiement est vert. Mais une fois cela
mergé, plus personne ne voit de capacité sur un enregistrement d'installation, et la première
personne à le remarquer sera celle qui lit ce nombre un lundi matin.

La description ne dit rien d'un champ qui s'en va. C'est l'écart auquel sert une revue : le
diff dit une chose, la description une autre, et une seule des deux est ce qui sera déployé.

Rien dans la pipeline ne peut attraper cela. Une présentation de page avec un champ de moins est
un déploiement valide, la ligne **Metadata** compte la présentation comme un composant `updated` de plus, et seul quelqu'un qui connaît l'org
peut voir ce qui manque.

#### Vous devriez voir

- `Total_Capacity_kW__c` retiré de la présentation de page, et remis nulle part
- Une description qui parle du plafond qui se déplace, et d'aucun champ qui s'en va

### 5. Demander la correction, sur la ligne

Objectif : votre commentaire de revue sur la ligne supprimée, et la Pull Request toujours pas mergée.

#### À faire

1. Survolez la ligne où `Total_Capacity_kW__c` est supprimé, cliquez sur le **+** bleu qui
   apparaît, et commentez :

   > `Total_Capacity_kW__c` comes off the layout with this change, and the description does not say so.
   > I think it went missing with the move: can you put it back in the second column, under the cap,
   > read only?

2. Puis **Review changes** en haut à droite de l'onglet, **Comment**, **Submit review**

!!! warning "Attention"
    Ne mergez pas. Le bouton Merge est vert, et il a tort.

#### Pourquoi

Sur un vrai projet vous choisiriez **Request changes**, qui maintient le bouton Merge honnête
jusqu'à ce que l'auteur réponde. GitHub le cache ici parce que les Pull Requests de collègues de ce
cours sont ouvertes depuis votre propre compte, et que personne ne demande de corrections à
soi-même.

Deux choses à copier dans ce commentaire :

- Il dit pourquoi, pour que le lecteur puisse juger plutôt que de vous croire sur parole
- Il dit ce qui se passe ensuite, pour que personne n'ait à demander

#### Vous devriez voir

- Votre commentaire sur la ligne qui retire `Total_Capacity_kW__c`, dans une revue soumise
- La Pull Request toujours ouverte

### 6. Relire la correction, puis merger

Objectif : la correction de Mariia relue, et sa Pull Request mergée en squash dans `integration`.
Rappel : [Lab 1.6](../level-1-contributor-basics/1-6-pull-request-deployment-check-and-merge.md)

La correction revient à Mariia : un release manager relit et merge les Pull Requests des
contributeurs, et n'écrit pas leurs fonctionnalités. Elle répond le lendemain matin, sur la même
branche.

#### À faire

1. **Training: Level 3** > **Simulate my teammates**, et choisissez **US-052 Mariia puts Total
   Capacity back, beside the cap**
2. Rouvrez **Files changed** : GitHub propose de n'afficher que les modifications depuis votre revue
3. Quand les contrôles sont verts, mergez avec **Squash and merge**, comme pour toute Pull Request de
   feature ([Lab 1.6](../level-1-contributor-basics/1-6-pull-request-deployment-check-and-merge.md))

#### Pourquoi

Cela ajoute un commit à sa branche, la même Pull Request se met donc à jour, et ses contrôles
retournent.

Avec **Squash and merge**, les deux commits deviennent une ligne dans l'historique d'`integration`,
titrée comme la Pull Request. Sur un vrai projet, c'est ici que vous cliquez d'abord sur **Approve**.

#### Vous devriez voir

- Une modification depuis votre revue, `Total_Capacity_kW__c` ajouté dans la deuxième colonne, en
  lecture seule, sous le plafond
- Le diff entier de la Pull Request déplace maintenant deux champs dans la deuxième colonne, le
  plafond et la capacité installée, désormais en lecture seule, et n'en retire aucun
- La Pull Request mergée dans `integration`

### 7. Voir la branche disparaître

Objectif : la branche de Mariia partie, supprimée par le merge.

#### À faire

1. Lisez la ligne sous le merge

#### Pourquoi

Votre fork supprime la branche pour chaque Pull Request mergée, et votre vrai projet devrait en
faire autant (**Settings > General > Automatically delete head branches**). Les branches majeures
ne risquent rien, parce qu'une branche protégée ne peut pas être supprimée.

<details markdown="1"><summary>Sous le capot : ce qui a produit le commentaire que vous venez de lire</summary>

Le job de contrôle a lancé :

    sf hardis:project:deploy:smart --check

puis a publié le commentaire via l'API GitHub avec le token que le workflow a déjà.

Le commentaire est mis à jour sur place à chaque push plutôt qu'ajouté à nouveau, c'est pourquoi
la Pull Request ne se remplit pas de vingt commentaires de robot. Il se retrouve grâce à un marqueur
caché porteur d'une clé de message, et il y a en fait deux commentaires de ce genre, mis à jour
indépendamment : un pour le job de contrôle, un pour le job de merge. Un troisième rassemble les
deployment actions, et les Flows en ont un chacun, sauf un Flow dont seul le statut change, qui n'en
a aucun. Un commentaire est limité à 50 000 caractères sur GitHub : au-delà,
il dit ce qu'il a raccourci.

Les compteurs qu'il affiche viennent de ce que Salesforce a rapporté sur le déploiement, pas du diff
git. Les deux peuvent différer, et quand c'est le cas, le déploiement est la vérité : c'est ce que
l'org a reçu, ou aurait reçu.

Les suppressions sont le point faible. `hardis:work:save` écrit `manifest/destructiveChanges.xml`
quand un contributeur retire quelque chose, et un contributeur peut en produire un sans le
vouloir, en décochant quelque chose dans l'écran de sélection après que cela a été commité. Le
commentaire donne à cela un nombre dans la ligne **Metadata**, et un tableau seulement quand des
Flows sont en jeu. Si les compteurs d'une Pull Request montrent quoi que ce soit de supprimé, le
commentaire vous a dit tout ce qu'il dira : le reste, c'est le diff.

<!-- command-links:start -->
Documentation des commandes : [hardis:project:deploy:smart](https://sfdx-hardis.cloudity.com/hardis/project/deploy/smart/), [hardis:work:save](https://sfdx-hardis.cloudity.com/hardis/work/save/)
<!-- command-links:end -->

</details>

#### Vous devriez voir

- La ligne sous le merge qui dit que la branche a été **supprimée**

## Ce que vous devez voir

- [ ] Votre commentaire de revue sur la Pull Request de Mariia, sur la ligne qui supprimait
      `Total_Capacity_kW__c`
- [ ] Sa correction dans la même Pull Request, et la Pull Request mergée en squash dans `integration`
- [ ] La présentation de page Installation dans `integration` avec le plafond et `Total_Capacity_kW__c`
      dans la deuxième colonne

## En cas de problème

**Simulate my teammates dit "Nothing to commit".**
Le scénario a déjà tourné : chacun sert une fois. La Pull Request est dans votre fork, ouverte ou
mergée.

**Les contrôles ne tournent jamais après la correction de Mariia.**
Actions est désactivé, ou `SFDX_AUTH_URL_INTEGRATION`, le secret avec lequel `integration` se
connecte toujours, manque. **Training: Level 3 > Set up my training environment** le réécrit.

**Vous avez mergé avant la correction.**
Alors `Total_Capacity_kW__c` n'est plus sur la présentation de page dans `integration`, et le
merge a supprimé la branche de Mariia, d'où part sa correction. Cliquez sur **Restore branch** en
bas de la Pull Request mergée, puis lancez le scénario de correction : il ouvre la correction comme
une nouvelle Pull Request depuis la même branche, et vous relisez et mergez celle-là.

## Vérifiez votre travail

Welcome page > **Training: Level 3** > **Check my work**, puis choisissez le **Lab 3.2**.

## Pour aller plus loin

- [Relire et merger les Pull Requests](https://sfdx-hardis.cloudity.com/salesforce-devops-validate-merge-request/)
- [Lire les résultats de la Pull Request](https://sfdx-hardis.cloudity.com/salesforce-devops-handle-merge-request-results/)

[Suite : Lab 3.3 - Lire le log de déploiement, et ce que .forceignore lui cache](3-3-deploy-to-integration-and-read-the-log.md){ .md-button .md-button--primary }
