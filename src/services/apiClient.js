// src/services/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://api.scryfall.com",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Enable/disable debug logging for requests/responses (call enableApiDebug(true) in dev)
export function enableApiDebug(enabled = true) {
  apiClient.__debug = Boolean(enabled);
}

// request logger: prints the final URL + params (best-effort)
apiClient.interceptors.request.use(
  (config) => {
    if (apiClient.__debug) {
      try {
        const base = config.baseURL ? config.baseURL.replace(/\/$/, "") : "";
        const url = config.url || "";
        const params = config.params
          ? `?${new URLSearchParams(config.params).toString()}`
          : "";
        console.debug(
          `[API REQUEST] ${config.method.toUpperCase()} ${base}${url}${params}`,
          config
        );
      } catch (e) {
        console.debug("[API REQUEST] (failed to build url)", config);
      }
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// response logger
apiClient.interceptors.response.use(
  (res) => {
    if (apiClient.__debug) {
      console.debug(
        "[API RESPONSE]",
        res.status,
        res.config.url,
        res.data && res.data.object ? res.data.object : ""
      );
    }
    return res;
  },
  (error) => {
    if (apiClient.__debug) {
      console.error(
        "[API ERROR]",
        error && error.response ? error.response.status : "NO_RESP",
        error && error.response ? error.response.data : error.message
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;
