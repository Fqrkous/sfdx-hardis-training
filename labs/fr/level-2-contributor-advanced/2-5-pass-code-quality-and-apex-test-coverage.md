---
id: lab-2-5
title: "Lab 2.5 - Passer la barrière de qualité de code et la couverture de tests Apex"
description: "Corrigez une trouvaille PMD et la couverture de code Apex qui bloquent votre Pull Request, et lancez les mêmes contrôles depuis VS Code avant de pousser."
level: 2
lab: 5
lang: fr
source_rev: "2f386b1b9dd5e5ad648ba643f272bc589ea1db70"
screenshots:
  - annotated/vscode/pipeline-cards--new-user-story
  - annotated/vscode/org-monitoring--apex-tests
depends_on:
  commands: [hardis:work:save, hardis:project:deploy:smart]
  flags: []
  config: [testLevel, apexTestsMinCoverageOrgWide, testCoverageNotBlocking]
  panels: [apexTestsSelect, pipeline]
  docs: [salesforce-devops-solve-megalinter-errors, salesforce-devops-work-on-user-story-development]
---

# Lab 2.5 - Passer la barrière de qualité de code et la couverture de tests Apex

**Niveau** : 2 Contributeur avancé

**Durée** : ~25 min<!-- observed --> (observé : médiane 26 min, 17 participants, le plus rapide 9 min)<!-- /observed -->

**Vous allez** : être bloqué deux fois par des robots, corriger les deux correctement plutôt que de
les contourner, et apprendre à lancer les contrôles avant de pousser.

## La situation

> **US-027 - Check several installations against panel availability at once**
>
> As a planner, I want to check a list of installations against panel availability in one go, so
> that I can fill a week of planning without opening every record.

Une modification Apex dans `InstallationScheduler`. Deux choses vont vous arrêter, et aucune des deux
ne concerne une métadonnée fausse :

1. PMD, l'analyseur de code Apex, lancé pour vous par MegaLinter, sur une requête à l'intérieur
   d'une boucle que vous êtes sur le point d'écrire en copiant un motif existant. Il bloque le
   merge
2. La couverture de code, parce que la nouvelle branche de logique n'a pas de test. Elle
   bloque aussi

Les deux sont des choix de ce projet, et ce sont ceux des vrais projets : l'analyseur refuse le code
qui dépasse les limites de Salesforce, et les tests doivent exécuter 80 % de l'Apex de l'org,
au-dessus des 75 % qu'exige Salesforce lui-même. Chacun vous dit ce qui ne va pas à un endroit
différent, ce lab vous les fait donc rencontrer l'un après l'autre.

Admins, ce lab est aussi pour vous. Il y a de l'Apex dedans, et vous n'en écrirez pas une ligne :
chaque bloc se copie depuis cette page et se colle dans un fichier. Ce que vous pratiquez est ce
qu'un admin rencontre sur tout vrai projet, une Pull Request bloquée par un analyseur de code ou par
la couverture de tests, et comment lire ce que disent les robots avant de demander de l'aide à un
développeur.

## Avant de commencer

- [ ] [Lab 2.4](2-4-ship-reference-data-and-a-batch-with-deployment-actions.md) terminé et mergé
- [ ] Prêt à lire quinze lignes d'Apex. Vous n'avez pas à en écrire : chaque bloc de ce lab est là
      pour être copié, et ce que le lab enseigne vraiment, c'est comment lire ce que les robots en
      disent

## Les étapes

### 1. Prendre la story

Objectif : la User Story `US-027-schedule-by-availability` démarrée, sur `helios-dev`.
Rappel : [Lab 1.3](../level-1-contributor-basics/1-3-start-a-user-story-on-a-git-branch.md)

#### À faire

1. **New User Story** **(2)**, sous **Project Contribution Workflow** **(1)** du panneau DevOps
   Pipeline. Branche `US-027-schedule-by-availability`, cible `integration`, org `helios-dev`

   ![La carte New User Story du panneau DevOps Pipeline](../../_assets/annotated/vscode/pipeline-cards--new-user-story.png)

#### Vous devriez voir

- La User Story `US-027-schedule-by-availability` démarrée, avec `integration` pour cible

### 2. Ajouter la modification telle que les gens l'écrivent vraiment

Objectif : une méthode `schedulableOn` dans `InstallationScheduler`, sur une Pull Request vers
`integration`.

Le planificateur veut vérifier plusieurs installations d'un coup.

#### À faire

1. Ouvrez `force-app/main/default/classes/InstallationScheduler.cls`, le fichier que la pipeline
   déploie déjà
2. Collez-y la méthode ci-dessous, exactement comme l'a fait le développeur qui l'a écrite en
   premier. Elle va à la fin de la classe : juste au-dessus de la dernière ligne du fichier, qui est
   l'accolade `}` fermant la classe

   ```apex title="À modifier dans le fichier"
       /**
        * The installations from the list that can be scheduled on the given day.
        *
        * @param installationIds the installations to check
        * @param wanted the day the planner wants
        * @return the ids that can take a crew that day
        */
       public static List<Id> schedulableOn(List<Id> installationIds, Date wanted) {
           List<Id> allowed = new List<Id>();
           for (Id installationId : installationIds) {
               for (Panel_Batch__c batch : [
                   SELECT Arrival_Date__c
                   FROM Panel_Batch__c
                   WHERE Installation__c = :installationId
                   ORDER BY Arrival_Date__c DESC
                   LIMIT 1
               ]) {
                   if (batch.Arrival_Date__c != null && wanted >= batch.Arrival_Date__c.addDays(PREPARATION_DAYS)) {
                       allowed.add(installationId);
                   }
               }
           }
           return allowed;
       }
   ```

3. Commitez `InstallationScheduler.cls` depuis le panneau **Source Control**
4. **Save / Publish**, poussez, et ouvrez la Pull Request

#### Pourquoi

C'est la façon évidente de faire, et c'est bien le problème. Celle-ci est un fichier, pas une
modification d'org : il n'y a donc rien à récupérer.

#### Vous devriez voir

- Une Pull Request vers `integration` qui porte `InstallationScheduler.cls`, avec ses contrôles en
  cours

### 3. MegaLinter vous bloque

Objectif : la requête sortie de la boucle : une seule requête, quelle que soit la taille de la liste.

Le contrôle **Mega-Linter** de votre Pull Request est rouge, et la boîte de merge indique **Merging
is blocked**.

#### À faire

1. Ouvrez le commentaire MegaLinter de la Pull Request. La trouvaille est sous
   **code-analyzer-apex** :

   ```text title="Résultat"
   (Moderate)  pmd:OperationWithLimitsInLoop  force-app/main/default/classes/InstallationScheduler.cls
   Avoid operations in loops that may hit governor limits
   ```

2. Dans `InstallationScheduler.cls`, remplacez la méthode collée à l'étape 2, de sa ligne
   `public static List<Id> schedulableOn` à son accolade `}` fermante, par celle-ci, et gardez le
   commentaire au-dessus

   ```apex title="À modifier dans le fichier"
       public static List<Id> schedulableOn(List<Id> installationIds, Date wanted) {
           Map<Id, Date> latestArrival = new Map<Id, Date>();
           for (Panel_Batch__c batch : [
               SELECT Installation__c, Arrival_Date__c
               FROM Panel_Batch__c
               WHERE Installation__c IN :installationIds
               AND Arrival_Date__c != null
               ORDER BY Arrival_Date__c ASC
           ]) {
               latestArrival.put(batch.Installation__c, batch.Arrival_Date__c);
           }
           List<Id> allowed = new List<Id>();
           for (Id installationId : installationIds) {
               Date arrival = latestArrival.get(installationId);
               if (arrival != null && wanted >= arrival.addDays(PREPARATION_DAYS)) {
                   allowed.add(installationId);
               }
           }
           return allowed;
       }
   ```

#### Pourquoi

Le contrôle de déploiement à côté est vert : les tests exécutent toujours plus de 80 % de l'Apex de
l'org, environ 81 %. Le code se déploie, et il est quand même refusé.

Une requête SOQL à l'intérieur d'une boucle `for`. Salesforce autorise 100 requêtes par transaction :
cette méthode marche donc parfaitement pour un planificateur qui vérifie cinq installations et lève
`System.LimitException: Too many SOQL queries: 101` la première fois que quelqu'un en vérifie cent
une. Elle passera tous les tests que vous écrirez et échouera un lundi chargé.

La correction est le seul motif Apex qui mérite d'être connu par cœur : interroger une fois, en
dehors de la boucle, et indexer ce qu'on récupère. Une seule requête, quelle que soit la taille de
la liste.

#### Pourquoi un linter a le droit de refuser

La boucle fonctionne dans tous les tests et échoue en production le premier jour chargé.
Personne ne la repère à coup sûr en relisant une Pull Request, l'analyseur toujours, et c'est
pourquoi les vrais projets le rendent bloquant. Il ne refuse que les trouvailles de sévérité
Moderate et au-dessus : le code d'Helios n'en a aucune, donc la seule chose qui peut faire passer
ce contrôle au rouge est ce que vous venez d'écrire.

#### Vous devriez voir

- `schedulableOn` dans `InstallationScheduler.cls` avec sa seule requête avant la boucle, et aucune
  requête dedans

### 4. Les tests vous bloquent

Objectif : deux tests de `schedulableOn` dans `InstallationSchedulerTest.cls`, qui vérifient ce que
la story demandait.

#### À faire

1. Poussez la correction. MegaLinter ne signale plus la boucle, et son contrôle passe au vert. Cette
   fois, c'est le contrôle de déploiement qui échoue :

   ```text title="Résultat"
   [sfdx-hardis][apextest] Test run code coverage (org wide) 76.92% should be greater than 80%
   ```

2. Lisez le verdict du commentaire sfdx-hardis : **❌ Cannot merge into `integration`:
   code coverage 76.92% is under the 80% target**, et sa ligne **Apex tests** dit la même chose
3. Ajoutez les tests ci-dessous dans `force-app/main/default/classes/InstallationSchedulerTest.cls`,
   de la même façon, juste au-dessus de la dernière accolade `}` du fichier

   ```apex title="À modifier dans le fichier"
       @isTest
       static void schedulableOnRefusesBeforeThePanelsArrive() {
           Installation__c inst = [SELECT Id FROM Installation__c LIMIT 1];
           Test.startTest();
           List<Id> tooEarly = InstallationScheduler.schedulableOn(new List<Id>{ inst.Id }, Date.today());
           List<Id> lateEnough = InstallationScheduler.schedulableOn(new List<Id>{ inst.Id }, Date.today().addDays(60));
           Test.stopTest();
           System.assert(tooEarly.isEmpty(), 'The crew cannot be sent before the panels arrive');
           System.assertEquals(1, lateEnough.size(), 'A date after the buffer is allowed');
       }

       @isTest
       static void schedulableOnIgnoresInstallationsWithNoBatch() {
           Installation__c lonely = new Installation__c(Status__c = 'Planned', Crew_Size__c = 2, External_Id__c = 'TEST-INST-003');
           insert lonely;
           Test.startTest();
           List<Id> allowed = InstallationScheduler.schedulableOn(new List<Id>{ lonely.Id }, Date.today().addDays(30));
           Test.stopTest();
           System.assert(allowed.isEmpty(), 'With no panel batch, nothing can be scheduled');
       }
   ```

#### Pourquoi

Salesforce seul l'aurait laissée passer, à 77 % pour son plancher de 75 % : le projet en demande
davantage, et le job de contrôle l'y tient.

La version avec la boucle était courte, et l'org la portait à 81 %. La correction est plus longue, et
chacune de ses nouvelles lignes est une ligne qu'aucun test n'exécute. Vous avez ajouté une méthode à
trois branches et aucun test.

Remarquez ce que font les assertions : elles vérifient le comportement demandé par la story, avec
un message qui dit pourquoi. Un test qui se contente d'exécuter le code pour faire monter un
pourcentage est pire que pas de test, parce qu'il fait mentir le chiffre.

Le `Crew_Size__c = 2` sur l'enregistrement que crée le second test n'est pas de la décoration. Le
[Lab 2.3](2-3-fix-broken-records-with-an-apex-deployment-action.md) a rendu ce champ obligatoire : tout test qui insère une installation sans lui échoue
désormais, et un test en échec est un déploiement en échec. Chaque classe de test de l'org doit être
passée en revue pour cela, et c'est le vrai prix à payer pour rendre un champ obligatoire.

#### Vous devriez voir

- Les deux nouvelles méthodes de test à la fin de `InstallationSchedulerTest.cls`

### 5. Lancer les contrôles avant de pousser, cette fois

Objectif : vos tests lancés dans `helios-dev` depuis VS Code, avant de pousser quoi que ce soit.

Deux allers-retours par la CI pour trouver deux choses que vous auriez pu trouver sur votre machine.
Faites-le dans l'autre sens à partir de maintenant.

#### À faire : les tests Apex

1. Dans l'**Explorer**, clic droit sur `InstallationScheduler.cls`, puis **SFDX: Deploy This Source
   to Org**
2. Faites de même pour `InstallationSchedulerTest.cls`
3. Ouvrez le panneau **Org Monitoring Workbench** : la carte **Org Monitoring** de la Welcome page,
   ou, dans la barre latérale sfdx-hardis, la section **Org Monitoring** et sa première entrée,
   **Org Monitoring Workbench**
4. Dans la section **Apex Tests & Security** de ce panneau, cliquez sur la carte **Apex Tests**
   **(1)**. Laissez-lui quelques minutes : une scratch org met ses exécutions de tests en file
   d'attente, et la première de la journée peut prendre dix minutes

   ![L'Org Monitoring Workbench, avec la carte Apex Tests](../../_assets/annotated/vscode/org-monitoring--apex-tests.png)

#### Pourquoi

Les tests Apex tournent dans une org, et jusqu'ici votre modification n'existe que dans les
fichiers du projet : l'Apex de `helios-dev` est encore l'ancienne version. Envoyez-la là-bas d'abord.
**SFDX: Deploy This Source to Org** vient de l'extension Salesforce livrée avec le pack d'extensions,
et elle envoie ce seul fichier vers votre org par défaut.

Deux chemins mènent au panneau, et ils arrivent au même endroit. La carte ne demande aucune org :
elle s'exécute sur votre org par défaut, `helios-dev`. Elle lance les tests Apex de l'org et vérifie
le même seuil de couverture que la pipeline : vous avez donc le succès, l'échec et le pourcentage
sans rien pousser.

Le pourcentage est celui de `helios-dev`, et ce n'est pas celui qu'affiche le contrôle. Les deux
classes batch des Labs 2.3 et 2.4 sont allées dans `helios-integration` par la pipeline, et n'arrivent
dans votre org que par un backpromote : d'ici là, `helios-dev` compte moins de lignes, et affiche plus. Ce que la carte vous dit
à coup sûr, c'est si vos tests passent, et si votre propre classe est couverte.

#### Pourquoi la bannière du haut est normale

*Org Monitoring Not Present (CI/CD Repo)* veut dire que ce repository est une pipeline de livraison et
non un repository de monitoring. Les cartes en dessous fonctionnent quand même, sur votre org par
défaut. Le [Lab 3.8](../level-3-release-manager/3-8-monitor-your-production-org.md) est là où le monitoring obtient son propre repository.

#### Pourquoi l'onglet Apex Tests est une autre chose

Une Pull Request dans le panneau **DevOps Pipeline** peut afficher un onglet
**Apex Tests (n) (beta)**. Il ne lance rien. Il choisit quelles classes de test le déploiement de
cette Pull Request va lancer, et il n'apparaît que sur les projets qui posent
`enableDeploymentApexTestClasses`. Helios ne le fait pas : il lance `RunLocalTests`, tous les
tests de l'org, à chaque fois.

#### À faire : les linters

1. Poussez, et lisez ce qu'ils disent sur la Pull Request

#### Pourquoi dans la CI

Les linters sont le seul contrôle que vous ne pouvez pas utilement lancer sur votre machine,
parce qu'il leur faut une image de conteneur que la CI possède déjà. Cela fait deux minutes
d'attente plutôt que vingt de mise en place, et le Niveau 3 montre la vue du release manager sur le
même rapport.

<details markdown="1"><summary>Sous le capot : les deux commandes derrière ces cartes</summary>

La carte Apex Tests lance la même commande que la pipeline :

    sf hardis:org:test:apex

et les linters, sur les machines de GitHub, lancent MegaLinter avec la saveur Salesforce. Si vous
voulez un jour les avoir sur votre machine, c'est `npx mega-linter-runner --flavor salesforce`, et
il faut Docker.

<!-- command-links:start -->
Documentation de la commande : [hardis:org:test:apex](https://sfdx-hardis.cloudity.com/hardis/org/test/apex/)
<!-- command-links:end -->

</details>

#### Vous devriez voir

- La carte **Apex Tests** qui dit que vos tests passent, et votre propre classe couverte
- Les deux contrôles de la Pull Request au vert après le push

### 6. Pousser et merger

Objectif : la story mergée, et `schedulableOn` dans `helios-integration`.

Les deux au vert.

#### À faire

1. Mergez
2. Vérifiez `helios-integration`

<details markdown="1"><summary>Sous le capot : d'où viennent ces deux barrières</summary>

La barrière de couverture est dans `config/.sfdx-hardis.yml` :

    testLevel: RunLocalTests
    apexTestsMinCoverageOrgWide: 80
    testCoverageNotBlocking: false

`RunLocalTests` lance tous les tests de l'org sauf ceux des packages gérés. Le seuil est vérifié à
l'échelle de l'org, pas par classe, c'est pourquoi une classe mal couverte peut être portée par
le reste de l'org un certain temps puis bloquer soudain la Pull Request de quelqu'un d'autre. 75 %
est le minimum Salesforce, en dessous duquel aucun déploiement ne passe ; ce projet demande 80, et la
plupart des vrais projets posent 80 ou 85.

`testCoverageNotBlocking: true` transforme la barrière en avertissement. Elle existe pour les projets
qui reprennent une org historique, et c'est une mesure temporaire, pas un réglage.

Les linters sont MegaLinter, configuré dans `.mega-linter.yml`. La saveur Salesforce lance PMD
via Salesforce Code Analyzer sur l'Apex, plus un scanner de flows, plus les linters génériques. Il
tourne sur tout le repository pour une Pull Request vers une branche majeure, c'est pourquoi une
règle peut se déclencher sur un fichier que vous n'avez pas écrit.

L'analyseur refuse parce que `.mega-linter.yml` le dit, avec
`SALESFORCE_CODE_ANALYZER_APEX_DISABLE_ERRORS: false` : la configuration partagée de sfdx-hardis ne
fait que signaler les trouvailles Apex, et c'est un projet qui en fait une barrière. Le linter, c'est
votre équipe qui refuse. Le plancher de couverture, c'est Salesforce qui refuse, et le réglage du projet choisit seulement s'il faut en demander davantage. Ni
l'un ni l'autre ne vérifie que le code fait la bonne chose, et c'est bien le sujet : Salesforce
déploie très volontiers un identifiant en dur couvert à 100 %.

</details>

#### Vous devriez voir

- `schedulableOn` dans `helios-integration`, avec une seule requête en dehors de la boucle

## Ce que vous devez voir

- [ ] Le contrôle **Mega-Linter** vert, et son commentaire sans la boucle de `InstallationScheduler.cls`
- [ ] Le contrôle de déploiement vert, avec une couverture au-dessus de 80 % dans le commentaire
- [ ] `schedulableOn` dans `helios-integration`, avec une requête en dehors de la boucle

## En cas de problème

**MegaLinter échoue sur des fichiers que vous n'avez jamais touchés.**
Il analyse tout le repository pour une Pull Request vers une branche majeure. Si un problème
préexistant fait surface, corrigez-le : c'est vous qui l'avez trouvé. Si c'est vraiment hors sujet,
la porte de sortie est une exclusion documentée dans `.mega-linter.yml`, jamais une désactivation en
bloc.

**La couverture est toujours sous le seuil après l'ajout des tests.**
La couverture est à l'échelle de l'org. Regardez le tableau par classe dans le commentaire de la Pull
Request : une autre classe peut tirer la moyenne vers le bas.

**La carte Apex Tests dit qu'il n'y a pas d'org.**
Elle tourne sur l'org vers laquelle vous êtes pointé. Ouvrez **Orgs Manager** et vérifiez que
`helios-dev` est votre org courante, puis relancez la carte.

**Les tests Apex passent en local et échouent en CI.**
Presque toujours une histoire de données. Votre org de dev a des enregistrements que l'org
d'intégration n'a pas, ou l'inverse. Un test doit créer lui-même les enregistrements dont il a
besoin, plutôt que de faire confiance à ce qui se trouve dans l'org.

## Vérifiez votre travail

Welcome page > **Training: Level 2** > **Check my work**, puis choisissez le **Lab 2.5**.

## Pour aller plus loin

- [Résoudre les erreurs MegaLinter](https://sfdx-hardis.cloudity.com/salesforce-devops-solve-megalinter-errors/)
- [Règles de développement](https://sfdx-hardis.cloudity.com/salesforce-devops-work-on-user-story-development/)

[Suite : Lab 2.6 - Permission sets, profils, et pourquoi une autorisation disparaît](2-6-permission-sets-and-profiles.md){ .md-button .md-button--primary }
