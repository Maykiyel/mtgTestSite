// src/store/modules/mtg.js
import apiClient from "@/services/apiClient";

export default {
  namespaced: true,
  state: () => ({
    cards: [],
    card: null,
    search: {
      query: "",
      next_page: null,
    },
    printings: [],
    manaSymbols: {},
    loading: false,
    error: null,
  }),

  mutations: {
    SET_CARDS(state, cards) {
      state.cards = cards;
    },
    APPEND_CARDS(state, cards) {
      state.cards.push(...cards);
    },
    SET_CARD(state, card) {
      state.card = card;
    },
    SET_SEARCH_META(state, { query, next_page }) {
      if (query !== undefined) state.search.query = query;
      state.search.next_page = next_page || null;
    },
    SET_PRINTINGS(state, printings) {
      state.printings = printings;
    },
    SET_MANA_SYMBOLS(state, symbols) {
      state.manaSymbols = symbols;
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
  },

  actions: {
    async fetchCards({ commit }, query) {
      if (!query || !query.trim()) {
        commit("SET_ERROR", "Search query cannot be empty.");
        commit("SET_CARDS", []);
        return;
      }

      commit("SET_LOADING", true);
      commit("SET_ERROR", null);

      try {
        const res = await apiClient.get("/cards/search", {
          params: { q: query.trim() },
        });
        commit("SET_CARDS", res.data.data || []);
        commit("SET_SEARCH_META", {
          query: query.trim(),
          next_page: res.data.next_page || null,
        });
      } catch (err) {
        commit("SET_ERROR", err.response?.data?.details || err.message);
        commit("SET_CARDS", []);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchNextPage({ commit, state }) {
      if (!state.search.next_page) return;

      commit("SET_LOADING", true);
      commit("SET_ERROR", null);

      try {
        // Remove baseURL override so Axios uses the full URL from next_page
        const res = await apiClient.get(state.search.next_page, {
          baseURL: "",
        });
        commit("APPEND_CARDS", res.data.data || []);
        commit("SET_SEARCH_META", {
          next_page: res.data.next_page || null,
        });
      } catch (err) {
        commit("SET_ERROR", err.response?.data?.details || err.message);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchCard({ commit }, id) {
      if (!id) {
        commit("SET_ERROR", "Card ID is missing.");
        return;
      }

      commit("SET_LOADING", true);
      commit("SET_ERROR", null);

      try {
        const res = await apiClient.get(`/cards/${id}`);
        commit("SET_CARD", res.data || null);
      } catch (err) {
        commit("SET_ERROR", err.response?.data?.details || err.message);
        commit("SET_CARD", null);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchPrintings({ commit }, id) {
      if (!id) {
        commit("SET_ERROR", "Card ID is missing for printings.");
        return;
      }

      commit("SET_ERROR", null);

      try {
        const res = await apiClient.get(`/cards/${id}/printings`);
        commit("SET_PRINTINGS", res.data.data || []);
      } catch (err) {
        commit("SET_ERROR", err.response?.data?.details || err.message);
        commit("SET_PRINTINGS", []);
      }
    },

    async fetchManaSymbols({ commit }) {
      try {
        const res = await apiClient.get("/symbology");
        const symbolMap = {};
        for (const s of res.data.data || []) {
          symbolMap[s.symbol] = s.svg_uri;
        }
        commit("SET_MANA_SYMBOLS", symbolMap);
      } catch (err) {
        // Not critical enough to break the app
        console.warn("Failed to fetch mana symbols:", err.message);
      }
    },
  },
};
