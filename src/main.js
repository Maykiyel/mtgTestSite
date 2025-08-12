// src/main.js
import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import { enableApiDebug } from "@/services/apiClient";
import "@/assets/global.css";

Vue.config.productionTip = false;

// Enable API debug logging in development
if (process.env.NODE_ENV !== "production") {
  enableApiDebug(true);
}

// Enhanced error handling for uncaught errors
Vue.config.errorHandler = (err, vm, info) => {
  console.error("Vue Error:", err);
  console.error("Component:", vm);
  console.error("Error Info:", info);

  // Optionally show user-friendly error
  if (vm && vm.$store) {
    vm.$store.commit("mtg/SET_ERROR", "An unexpected error occurred");
  }
};

// Initialize the application
(async function initApp() {
  try {
    // Prefetch mana symbols for better UX (non-blocking)
    await store.dispatch("mtg/fetchManaSymbols");
    console.log("Mana symbols loaded successfully");
  } catch (e) {
    // Log warning but continue - app will still work without mana symbols
    console.warn("Failed to prefetch mana symbols:", e?.message || e);
  }

  // Mount the Vue application
  new Vue({
    router,
    store,
    vuetify,
    render: (h) => h(App),
  }).$mount("#app");

  console.log("MTG Card Viewer initialized successfully");
})().catch((err) => {
  console.error("Failed to initialize app:", err);
  // Fallback: mount app anyway
  new Vue({
    router,
    store,
    vuetify,
    render: (h) => h(App),
  }).$mount("#app");
});
