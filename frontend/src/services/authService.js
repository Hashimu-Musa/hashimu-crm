import api from "../config/api";
import { setAuthSession } from "../config/authStorage";

export async function registerAccount(payload) {
  const { data } = await api.post("/auth/register", payload);
  setAuthSession(data);
  return data;
}

export async function loginAccount(payload) {
  const { data } = await api.post("/auth/login", payload);
  setAuthSession(data);
  return data;
}

export async function getCurrentAccount() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export const authService = {
  register: registerAccount,
  login: loginAccount,
  me: getCurrentAccount,
};

export default authService;
