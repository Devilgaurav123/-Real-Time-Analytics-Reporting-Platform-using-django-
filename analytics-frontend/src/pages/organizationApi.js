import api from "./axios";

export const getOrganizations = () =>
  api.get("organizations/");

export const getTeamMembers = () =>
  api.get("organizations/team-members/");

export const removeMember = (id) =>
  api.delete(`organizations/remove-member/${id}/`);