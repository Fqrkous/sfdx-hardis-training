@isTest
private class CrewCapacityBatchTest {
   @testSetup
   static void makeData() {
     insert new Crew_Capacity__c(
       External_Id__c = 'ROOF-TILE',
       Crew_Type__c = 'Roof',
       Roof_Type__c = 'Tile',
       Panels_Per_Day__c = 10
     );
     insert new Installation__c(
       External_Id__c = 'INST-TEST-1',
       Status__c = 'Planned',
       Roof_Type__c = 'Tile',
       Crew_Size__c = 3,
       Panels_Required__c = 12
     );
   }

   @isTest
   static void recalculatesPlannedInstallations() {
     Test.startTest();
     Database.executeBatch(new CrewCapacityBatch(), 200);
     Test.stopTest();

     Installation__c installation = [
       SELECT Total_Capacity_kW__c
       FROM Installation__c
       WHERE External_Id__c = 'INST-TEST-1'
       LIMIT 1
     ];
     Assert.areEqual(12.00, installation.Total_Capacity_kW__c, 'Capacity should be recalculated');
   }

   @isTest
   static void leavesInstallationsWithNoMatchingCapacityAtZero() {
     Installation__c slate = new Installation__c(
       External_Id__c = 'INST-TEST-2',
       Status__c = 'Planned',
       Roof_Type__c = 'Slate',
       Crew_Size__c = 3,
       Panels_Required__c = 10
     );
     insert slate;

     Test.startTest();
     Database.executeBatch(new CrewCapacityBatch(), 200);
     Test.stopTest();

     Installation__c reloaded = [
       SELECT Total_Capacity_kW__c
       FROM Installation__c
       WHERE Id = :slate.Id
       LIMIT 1
     ];
     Assert.areEqual(0, reloaded.Total_Capacity_kW__c, 'No capacity row means no capacity');
   }
}