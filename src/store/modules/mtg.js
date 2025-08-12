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
      has_more: false,
    },
    printings: [],
    manaSymbols: {},
    autocomplete: [],
    loading: false,
    error: null,
  }),

  getters: {
    currentCardImage: (state) => {
      if (!state.card) return null;
      if (state.card.image_uris?.large) return state.card.image_uris.large;
      if (state.card.image_uris?.normal) return state.card.image_uris.normal;
      if (state.card.card_faces?.[0]?.image_uris?.large) {
        return state.card.card_faces[0].image_uris.large;
      }
      if (state.card.card_faces?.[0]?.image_uris?.normal) {
        return state.card.card_faces[0].image_uris.normal;
      }
      return null;
    },
    manaSymbolMap: (state) => state.manaSymbols,
  },

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
    SET_SEARCH_META(state, { query, next_page, has_more }) {
      if (query !== undefined) state.search.query = query;
      state.search.next_page = next_page || null;
      state.search.has_more = Boolean(has_more || next_page);
    },
    SET_PRINTINGS(state, printings) {
      state.printings = printings;
    },
    SET_MANA_SYMBOLS(state, symbols) {
      state.manaSymbols = symbols;
    },
    SET_AUTOCOMPLETE(state, items) {
      state.autocomplete = items;
    },
    SET_LOADING(state, status) {
      state.loading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
  },

  actions: {
    async fetchCards({ commit }, { q }) {
      if (!q || !q.trim()) {
        commit("SET_ERROR", "Search query cannot be empty.");
        commit("SET_CARDS", []);
        return;
      }

      commit("SET_LOADING", true);
      commit("SET_ERROR", null);

      try {
        const res = await apiClient.get("/cards/search", {
          params: { q: q.trim() },
        });
        commit("SET_CARDS", res.data.data || []);
        commit("SET_SEARCH_META", {
          query: q.trim(),
          next_page: res.data.next_page || null,
          has_more: res.data.has_more,
        });
      } catch (err) {
        const errorMsg = err.response?.data?.details || err.message;
        commit("SET_ERROR", errorMsg);
        commit("SET_CARDS", []);
        throw new Error(errorMsg);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchCardsNextPage({ commit, state }) {
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
          has_more: res.data.has_more,
        });
      } catch (err) {
        const errorMsg = err.response?.data?.details || err.message;
        commit("SET_ERROR", errorMsg);
        throw new Error(errorMsg);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchCard({ commit, dispatch }, idOrParams) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      commit("SET_CARD", null);

      try {
        let res;

        // Handle both direct ID and named card lookups
        if (typeof idOrParams === "string") {
          // Direct ID lookup
          res = await apiClient.get(`/cards/${idOrParams}`);
        } else if (idOrParams && idOrParams.named) {
          // Named card lookup
          res = await apiClient.get("/cards/named", {
            params: { fuzzy: idOrParams.named },
          });
        } else {
          throw new Error("Invalid card lookup parameters");
        }

        const card = res.data;
        commit("SET_CARD", card);

        // Auto-fetch printings for the card
        if (card && card.oracle_id) {
          await dispatch("fetchPrintings", card.oracle_id);
        }

        return card;
      } catch (err) {
        const errorMsg = err.response?.data?.details || err.message;
        commit("SET_ERROR", errorMsg);
        commit("SET_CARD", null);
        throw new Error(errorMsg);
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchPrintings({ commit }, oracleId) {
      if (!oracleId) {
        commit("SET_ERROR", "Oracle ID is missing for printings.");
        return;
      }

      commit("SET_ERROR", null);

      try {
        const res = await apiClient.get("/cards/search", {
          params: { q: `oracleid:${oracleId}` },
        });
        commit("SET_PRINTINGS", res.data.data || []);
      } catch (err) {
        const errorMsg = err.response?.data?.details || err.message;
        commit("SET_ERROR", errorMsg);
        commit("SET_PRINTINGS", []);
        console.warn("Failed to fetch printings:", errorMsg);
      }
    },

    async fetchAutocomplete({ commit }, query) {
      if (!query || query.length < 2) {
        commit("SET_AUTOCOMPLETE", []);
        return;
      }

      try {
        const res = await apiClient.get("/cards/autocomplete", {
          params: { q: query },
        });
        commit("SET_AUTOCOMPLETE", res.data.data || []);
      } catch (err) {
        console.warn("Autocomplete failed:", err.message);
        commit("SET_AUTOCOMPLETE", []);
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
