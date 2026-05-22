import axios from "axios";
import {
  API_BASE,
  API_TIMEOUT_MS,
} from "../lib/api.js";

const api = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
});

export async function apiRequest(config) {
  const response = await api(config);
  return response.data;
}

export async function checkApiHealth() {
  try {
    await api.get("/health");
    return true;
  } catch {
    return false;
  }
}

export {
  API_BASE,
  API_TIMEOUT_MS,
};

export default api;