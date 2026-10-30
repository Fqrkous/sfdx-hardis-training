// US-062: the user who deploys joins the Crew Leads public group, to receive the plans too.
// Copy it as it is.
Group crewLeads = [SELECT Id FROM Group WHERE DeveloperName = 'Helios_Crew_Leads' AND Type = 'Regular' LIMIT 1];
if ([SELECT COUNT() FROM GroupMember WHERE GroupId = :crewLeads.Id AND UserOrGroupId = :UserInfo.getUserId()] == 0) {
  insert new GroupMember(GroupId = crewLeads.Id, UserOrGroupId = UserInfo.getUserId());
}
