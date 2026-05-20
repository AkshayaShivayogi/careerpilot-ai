import { API_HOST, API_ROOT } from "../config/api.js";

export function getErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.response?.data ?? error?.data;
  const status = error?.response?.status ?? error?.status;

  if (typeof data === "string" && data.trim()) {
    return data.length > 240 ? `${data.slice(0, 240)}…` : data;
  }

  const msg = data?.message ?? data?.error ?? error?.message;
  if (typeof msg === "string" && msg.trim() && !msg.includes("status code")) {
    return msg;
  }

  if (error?.code === "ERR_NETWORK" || error?.message === "Network Error" || error?.offline) {
    return `Cannot reach the API. Start the backend (npm run dev:nocheck) — expected at ${API_ROOT}.`;
  }

  if (error?.code === "ECONNABORTED") {
    return "Request timed out. Showing saved or offline content.";
  }

  if (status) {
    if (status === 401) {
      return data?.message || "Please sign in again.";
    }
    if (status >= 500) {
      return fallback || "Live data unavailable — showing offline content.";
    }
  }

  return fallback;
}
