// src/main.js
import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import { enableApiDebug } from "@/services/apiClient";

Vue.config.productionTip = false;

// enable API debug logging in dev
if (process.env.NODE_ENV !== "production") {
  enableApiDebug(true);
}

// Wait for mana symbols (best-effort) before mounting to reduce flicker.
(async function initApp() {
  try {
    // Try to prefetch mana symbols (non-fatal)
    await store.dispatch("mtg/fetchManaSymbols");
  } catch (e) {
    // log and continue — app will still mount
    // eslint-disable-next-line no-console
    console.warn("Failed to prefetch mana symbols:", e && e.message);
  }

  // Mount the app after attempting to fetch critical startup data
  new Vue({
    router,
    store,
    vuetify,
    render: (h) => h(App),
  }).$mount("#app");
})();
