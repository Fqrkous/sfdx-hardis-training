// US-062: every delivery manager joins the Crew Leads public group.
// Copy it as it is. The group itself is setup: it has to exist in the org before this runs,
// and the query below fails when it does not.
Group crewLeads = [SELECT Id FROM Group WHERE DeveloperName = 'Helios_Crew_Leads' AND Type = 'Regular' LIMIT 1];
Set<Id> alreadyIn = new Set<Id>();
for (GroupMember member : [SELECT UserOrGroupId FROM GroupMember WHERE GroupId = :crewLeads.Id]) {
  alreadyIn.add(member.UserOrGroupId);
}
List<GroupMember> toAdd = new List<GroupMember>();
for (PermissionSetAssignment assignment : [
  SELECT AssigneeId FROM PermissionSetAssignment
  WHERE PermissionSet.Name = 'Helios_Delivery_Manager' AND Assignee.IsActive = true
]) {
  if (!alreadyIn.contains(assignment.AssigneeId)) {
    toAdd.add(new GroupMember(GroupId = crewLeads.Id, UserOrGroupId = assignment.AssigneeId));
    alreadyIn.add(assignment.AssigneeId);
  }
}
insert toAdd;
System.debug('Delivery managers added to Crew Leads: ' + toAdd.size());
