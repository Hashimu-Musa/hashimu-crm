import api from "../config/api";

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export const companyService = {
  async list(params = {}) {
    const { data } = await api.get("/companies", { params: cleanParams(params) });
    return data;
  },

  async get(id) {
    const { data } = await api.get(`/companies/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post("/companies", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/companies/${id}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/companies/${id}`);
  },
};

export const contactService = {
  async list(params = {}) {
    const { data } = await api.get("/contacts", { params: cleanParams(params) });
    return data;
  },

  async get(id) {
    const { data } = await api.get(`/contacts/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post("/contacts", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/contacts/${id}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/contacts/${id}`);
  },
};

export const dealService = {
  async stages() {
    const { data } = await api.get("/deal-stages");
    return data;
  },
  async list(params = {}) {
    const { data } = await api.get("/deals", { params: cleanParams(params) });
    return data;
  },

  async get(id) {
    const { data } = await api.get(`/deals/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post("/deals", payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.patch(`/deals/${id}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/deals/${id}`);
  },
};

export const dashboardService = {
  async summary() {
    const { data } = await api.get("/dashboard");
    return data;
  },
};

export const activityService = {
  async list(params = {}) {
    const { data } = await api.get("/activities", { params: cleanParams(params) });
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/activities", payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.patch(`/activities/${id}`, payload);
    return data;
  },
  async remove(id) {
    await api.delete(`/activities/${id}`);
  },
};

export default {
  companies: companyService,
  contacts: contactService,
  deals: dealService,
  activities: activityService,
};
