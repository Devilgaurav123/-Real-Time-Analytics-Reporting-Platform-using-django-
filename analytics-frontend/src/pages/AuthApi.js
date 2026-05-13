import api from "./axios";

export const loginUser = (data) =>
  api.post("accounts/login/", data);

export const registerUser = (data) =>
  api.post("accounts/register/", data);

export const refreshAccessToken = (data) =>
  api.post("accounts/token/refresh/", data);

export const inviteMember = (data) =>
  api.post("accounts/invite-member/", data);

export const getInvites = () =>
  api.get("accounts/invite-list/");

export const acceptInvite = (data) =>
  api.post("accounts/accept-invite/", data);