<template>
  <v-container fluid class="pa-4 mtg-theme">
    <!-- Notifications -->
    <v-snackbar v-model="errorSnackbar" color="error" top right>
      {{ errorMessage }}
      <v-btn text @click="errorSnackbar = false">Close</v-btn>
    </v-snackbar>

    <!-- Top toolbar: autocomplete + search -->
    <v-row class="mb-4" align="center">
      <v-col cols="12" md="8">
        <v-autocomplete v-model="selectedAutocomplete" :items="autocomplete" :loading="autocompleteLoading" hide-no-data
          hide-details clearable label="Search card name (autocomplete)" @change="onAutocompleteSelect"
          @update:search-input="onAutocompleteTyping" :search-input.sync="searchText" dense outlined
          prepend-inner-icon="mdi-magnify" />
      </v-col>

      <v-col cols="12" md="4">
        <v-text-field v-model="searchTextInput" label="Search query (Scryfall)" clearable dense outlined
          @keyup.enter="doSearch" append-outer-icon="mdi-magnify" @click:append-outer="doSearch" />
      </v-col>
    </v-row>

    <!-- Card grid -->
    <v-row>
      <v-col v-for="card in cards" :key="card.id" cols="12" sm="6" md="4" lg="3">
        <v-card class="hoverable" elevation="2" @click="selectCard(card.id)">
          <v-img
            :src="card.image_uris ? card.image_uris.small : (card.card_faces && card.card_faces[0] ? card.card_faces[0].image_uris.small : placeholderImage)"
            height="310" cover />
          <v-card-title class="justify-space-between">
            <div class="truncate-1">{{ card.name }}</div>
            <v-chip small>{{ card.set.toUpperCase() }}</v-chip>
          </v-card-title>
          <v-card-subtitle class="pl-4 text--secondary">{{ card.type_line }}</v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="searchHasMore" class="my-4" justify="center">
      <v-btn :loading="loadingMore" @click="loadMore">Load more</v-btn>
    </v-row>

    <!-- Card details dialog -->
    <v-dialog v-model="dialog" max-width="1100px" persistent>
      <v-card v-if="card" class="pa-4">
        <v-row>
          <v-col cols="12" md="5">
            <v-sheet class="d-flex justify-center" elevation="3">
              <v-img :src="currentPreviewImage || currentCardImage || placeholderImage" max-height="520" contain />
            </v-sheet>

            <v-slide-group show-arrows class="mt-3 printings-group">
              <v-slide-item v-for="p in printings" :key="p.id">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-avatar v-bind="attrs" v-on="on" class="mr-2 printing-thumb" tile size="76"
                      @click="setPreviewFromPrinting(p)">
                      <v-img :src="printingThumb(p)" cover />
                    </v-avatar>
                  </template>
                  <span>{{ p.set_name }} • {{ p.collector_number }} • {{ p.rarity }}</span>
                </v-tooltip>
              </v-slide-item>
            </v-slide-group>
          </v-col>

          <v-col cols="12" md="7">
            <div class="d-flex align-center justify-space-between">
              <div>
                <h2 class="mb-1">{{ card.name }}</h2>
                <div class="mt-1"><span v-html="renderManaHtml(card.mana_cost)"></span></div>
                <div class="text--secondary mt-2">{{ card.type_line }}</div>
              </div>

              <div class="text-right">
                <div class="text--secondary">Set</div>
                <div><strong>{{ card.set_name }} ({{ card.set.toUpperCase() }})</strong></div>
                <div class="text--secondary mt-2">Collector # / Rarity</div>
                <div>{{ card.collector_number }} • {{ card.rarity }}</div>
              </div>
            </div>

            <v-divider class="my-3"></v-divider>

            <div v-if="card.card_faces && card.card_faces.length">
              <div v-for="(face, i) in card.card_faces" :key="i" class="mb-3 face-block">
                <h3 class="mb-1">{{ face.name }}</h3>
                <div class="text--secondary mb-1" v-html="renderManaHtml(face.mana_cost)"></div>
                <div v-html="renderManaHtml(face.oracle_text)" class="oracle-text"></div>
                <div v-if="face.flavor_text" class="mt-2 text--secondary"><em>{{ face.flavor_text }}</em></div>
                <div v-if="face.power || face.toughness" class="mt-2"><strong>P/T:</strong> {{ face.power || '—' }}/{{
                  face.toughness || '—' }}</div>
              </div>
            </div>
            <div v-else>
              <div v-if="card.oracle_text" v-html="renderManaHtml(card.oracle_text)" class="oracle-text"></div>
              <div v-if="card.flavor_text" class="mt-2 text--secondary"><em>{{ card.flavor_text }}</em></div>
              <div v-if="card.power || card.toughness" class="mt-2"><strong>P/T:</strong> {{ card.power || '—' }}/{{
                card.toughness || '—' }}</div>
              <div v-if="card.loyalty" class="mt-2"><strong>Loyalty:</strong> {{ card.loyalty }}</div>
            </div>

            <v-divider class="my-3"></v-divider>

            <v-row>
              <v-col cols="12" md="6">
                <div><strong>Artist:</strong> {{ card.artist }}</div>
                <div><strong>Oracle ID:</strong> {{ card.oracle_id }}</div>
                <div><strong>Released:</strong> {{ card.released_at }}</div>
              </v-col>
              <v-col cols="12" md="6">
                <div><strong>Legalities:</strong></div>
                <div class="text--secondary" v-for="(v, k) in card.legalities" :key="k">{{ k }}: {{ v }}</div>
              </v-col>
            </v-row>

            <v-divider class="my-3"></v-divider>

            <div class="d-flex align-center">
              <v-btn text @click="openScryfall">Open on Scryfall</v-btn>
              <v-spacer />
              <v-btn outlined @click="dialog = false">Close</v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card>

      <v-card v-else>
        <v-card-text><v-progress-circular indeterminate size="36" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState } from 'vuex';
import debounce from 'lodash/debounce';
import manaRenderer from '@/utils/manaRenderer';

export default {
  name: 'HomeView',
  data() {
    return {
      dialog: false,
      placeholderImage: 'https://via.placeholder.com/488x680?text=No+Image',
      searchText: '',
      searchTextInput: '',
      selectedAutocomplete: null,
      autocompleteLoading: false,
      loadingMore: false,
      currentPreviewImage: null,
      autocompleteTimer: null, // rename to avoid vue/no-reserved-keys
      errorSnackbar: false,
      errorMessage: '',
    };
  },

  computed: {
    ...mapState('mtg', ['cards', 'card', 'printings']),
    autocomplete() { return this.$store.state.mtg.autocomplete || []; },
    searchHasMore() { return this.$store.state.mtg.search.has_more; },
    currentCardImage() { return this.$store.getters['mtg/currentCardImage'] || null; },
    manaSymbolMap() { return this.$store.getters['mtg/manaSymbolMap'] || this.$store.state.mtg.manaSymbols || {}; },
  },

  methods: {
    _debounce(fn, wait = 300) { return debounce(fn, wait); },

    async onAutocompleteTyping(q) {
      this.searchText = q;
      this.autocompleteLoading = true;
      this._debouncedFetchAutocomplete(q);
    },

    async onAutocompleteSelect(name) {
      if (!name) return;
      try {
        await this.$store.dispatch('mtg/fetchCard', { named: name });
        this.currentPreviewImage = this.previewImageForCard(this.card);
        this.dialog = true;
      } catch (err) {
        this.showError('Failed to load card: ' + (err && err.response && err.response.data ? (err.response.data.details || err.response.data) : err.message));
      } finally {
        this.autocompleteLoading = false;
      }
    },

    async doSearch() {
      const q = (this.searchTextInput || this.searchText || '').trim();
      try {
        this.loadingMore = true;
        await this.$store.dispatch('mtg/fetchCards', { q: q || 'lang:en' });
      } catch (err) {
        this.showError('Search failed: ' + (err && err.message));
      } finally {
        this.loadingMore = false;
      }
    },

    async selectCard(id) {
      try {
        await this.$store.dispatch('mtg/fetchCard', id);
        this.currentPreviewImage = this.previewImageForCard(this.card);
        this.dialog = true;
      } catch (err) {
        this.showError('Failed to fetch card: ' + (err && err.message));
      }
    },

    setPreviewFromPrinting(printing) {
      const img = this.printingImage(printing);
      if (img) this.currentPreviewImage = img;
    },

    previewImageForCard(cardObj) {
      if (!cardObj) return null;
      if (cardObj.image_uris && cardObj.image_uris.large) return cardObj.image_uris.large;
      if (cardObj.card_faces && cardObj.card_faces[0] && cardObj.card_faces[0].image_uris && cardObj.card_faces[0].image_uris.large) {
        return cardObj.card_faces[0].image_uris.large;
      }
      return null;
    },

    printingThumb(p) {
      if (!p) return this.placeholderImage;
      if (p.image_uris && p.image_uris.small) return p.image_uris.small;
      if (p.card_faces && p.card_faces[0] && p.card_faces[0].image_uris && p.card_faces[0].image_uris.small) {
        return p.card_faces[0].image_uris.small;
      }
      return this.placeholderImage;
    },

    printingImage(p) {
      if (!p) return null;
      if (p.image_uris && (p.image_uris.large || p.image_uris.normal || p.image_uris.png)) {
        return p.image_uris.large || p.image_uris.normal || p.image_uris.png;
      }
      if (p.card_faces && p.card_faces[0] && p.card_faces[0].image_uris) {
        return p.card_faces[0].image_uris.large || p.card_faces[0].image_uris.normal || p.card_faces[0].image_uris.png;
      }
      return null;
    },

    openScryfall() { if (this.card && this.card.scryfall_uri) window.open(this.card.scryfall_uri, '_blank'); },

    async loadMore() {
      if (!this.searchHasMore) return;
      this.loadingMore = true;
      try {
        await this.$store.dispatch('mtg/fetchCardsNextPage');
      } catch (err) {
        this.showError('Load more failed: ' + (err && err.message));
      } finally {
        this.loadingMore = false;
      }
    },

    renderManaHtml(text) { return manaRenderer.renderManaHtml(text, this.manaSymbolMap); },

    showError(msg) { this.errorMessage = msg; this.errorSnackbar = true; },
  },

  created() {
    // debounced autocomplete method
    this._debouncedFetchAutocomplete = this._debounce(async (q) => {
      if (!q || q.length < 2) {
        this.$store.commit('mtg/SET_AUTOCOMPLETE', []);
        this.autocompleteLoading = false;
        return;
      }
      try {
        await this.$store.dispatch('mtg/fetchAutocomplete', q);
      } catch (err) {
        console.warn('autocomplete failed', err);
      } finally {
        this.autocompleteLoading = false;
      }
    }, 300);

    // explicit initial fetch using safe default query
    (async () => {
      try {
        await this.$store.dispatch('mtg/fetchCards', { q: 'lang:en' });
      } catch (err) {
        this.showError('Initial data failed: ' + (err && err.message));
      }
    })();
  },
};
</script>

<style scoped>
.mtg-theme {
  background: linear-gradient(180deg, #0f0f12 0%, #141418 100%);
  color: #eaeaea;
  min-height: 100vh;
}

.hoverable {
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
}

.hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
}

.printings-group {
  overflow-x: auto;
  padding-bottom: 6px;
}

.printing-thumb {
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.mana-symbol {
  width: 20px;
  height: 20px;
  vertical-align: -4px;
  margin: 0 2px;
}

.oracle-text {
  line-height: 1.35;
  white-space: pre-wrap;
}

.truncate-1 {
  max-width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
