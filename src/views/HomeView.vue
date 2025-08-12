<template>
  <v-container fluid class="pa-4 mtg-theme">
    <!-- Notifications -->
    <v-snackbar v-model="errorSnackbar" color="error" top right timeout="6000">
      {{ errorMessage }}
      <v-btn text @click="errorSnackbar = false">Close</v-btn>
    </v-snackbar>

    <!-- Top toolbar: autocomplete + search -->
    <v-row class="mb-4" align="center">
      <v-col cols="12" md="8">
        <v-autocomplete v-model="selectedAutocomplete" :items="autocomplete" :loading="autocompleteLoading"
          :search-input.sync="searchText" hide-no-data hide-details clearable label="Search card name (autocomplete)"
          @change="onAutocompleteSelect" @update:search-input="onAutocompleteTyping" dense outlined
          prepend-inner-icon="mdi-magnify" />
      </v-col>

      <v-col cols="12" md="4">
        <v-text-field v-model="searchTextInput" label="Search query (Scryfall)" clearable dense outlined
          @keyup.enter="doSearch" append-outer-icon="mdi-magnify" @click:append-outer="doSearch" />
      </v-col>
    </v-row>

    <!-- Loading indicator -->
    <v-row v-if="loading && !cards.length" justify="center" class="my-8">
      <v-progress-circular indeterminate size="64" color="primary" />
    </v-row>

    <!-- Card grid -->
    <v-row v-if="cards.length">
      <v-col v-for="card in cards" :key="card.id" cols="12" sm="6" md="4" lg="3">
        <v-card class="hoverable card-item" elevation="2" @click="selectCard(card.id)">
          <v-img :src="getCardThumbnail(card)" height="310" cover :lazy-src="placeholderImage" />
          <v-card-title class="justify-space-between py-2">
            <div class="truncate-1">{{ card.name }}</div>
            <v-chip small color="primary" outlined>{{ card.set.toUpperCase() }}</v-chip>
          </v-card-title>
          <v-card-subtitle class="pl-4 text--secondary py-1">{{ card.type_line }}</v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- Load more button -->
    <v-row v-if="searchHasMore" class="my-4" justify="center">
      <v-btn :loading="loadingMore" @click="loadMore" color="primary" outlined large>
        Load More Cards
      </v-btn>
    </v-row>

    <!-- Empty state -->
    <v-row v-if="!loading && !cards.length && !error" justify="center" class="my-8">
      <v-col cols="12" md="6" class="text-center">
        <v-icon size="64" color="grey">mdi-cards-outline</v-icon>
        <h3 class="mt-4 grey--text">No cards found</h3>
        <p class="grey--text">Try searching for a different card or term</p>
      </v-col>
    </v-row>

    <!-- Card details dialog -->
    <v-dialog v-model="dialog" max-width="1200px" persistent>
      <v-card v-if="card" class="pa-4">
        <v-row>
          <v-col cols="12" md="5">
            <v-sheet class="d-flex justify-center card-image-container" elevation="3">
              <v-img :src="currentPreviewImage || currentCardImage || placeholderImage" max-height="520" contain
                class="card-detail-image" />
            </v-sheet>

            <!-- Printings carousel -->
            <div v-if="printings.length > 1" class="mt-3">
              <h4 class="mb-2">Other Printings ({{ printings.length }})</h4>
              <v-slide-group show-arrows class="printings-group">
                <v-slide-item v-for="p in printings" :key="p.id">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-avatar v-bind="attrs" v-on="on" class="mr-2 printing-thumb"
                        :class="{ 'printing-active': isActivePrinting(p) }" tile size="76"
                        @click="setPreviewFromPrinting(p)">
                        <v-img :src="printingThumb(p)" cover />
                      </v-avatar>
                    </template>
                    <span>{{ p.set_name }} • {{ p.collector_number }} • {{ p.rarity }}</span>
                  </v-tooltip>
                </v-slide-item>
              </v-slide-group>
            </div>
          </v-col>

          <v-col cols="12" md="7">
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <h2 class="mb-1">{{ card.name }}</h2>
                <div v-if="card.mana_cost" class="mt-1">
                  <span v-html="renderManaHtml(card.mana_cost)"></span>
                </div>
                <div class="text--secondary mt-2">{{ card.type_line }}</div>
              </div>

              <div class="text-right">
                <div class="text--secondary">Set</div>
                <div><strong>{{ card.set_name }} ({{ card.set.toUpperCase() }})</strong></div>
                <div class="text--secondary mt-2">Collector # / Rarity</div>
                <div>{{ card.collector_number }} • {{ capitalizeRarity(card.rarity) }}</div>
              </div>
            </div>

            <v-divider class="my-3"></v-divider>

            <!-- Card faces (for double-sided cards) -->
            <div v-if="card.card_faces && card.card_faces.length">
              <div v-for="(face, i) in card.card_faces" :key="i" class="mb-4 face-block">
                <h3 class="mb-1">{{ face.name }}</h3>
                <div v-if="face.mana_cost" class="text--secondary mb-2">
                  <span v-html="renderManaHtml(face.mana_cost)"></span>
                </div>
                <div class="mb-2"><strong>{{ face.type_line }}</strong></div>
                <div v-if="face.oracle_text" v-html="renderManaHtml(face.oracle_text)" class="oracle-text mb-2"></div>
                <div v-if="face.flavor_text" class="mt-2 text--secondary"><em>{{ face.flavor_text }}</em></div>
                <div v-if="face.power || face.toughness" class="mt-2">
                  <strong>P/T:</strong> {{ face.power || '—' }}/{{ face.toughness || '—' }}
                </div>
                <div v-if="face.loyalty" class="mt-2">
                  <strong>Loyalty:</strong> {{ face.loyalty }}
                </div>
                <v-divider v-if="i < card.card_faces.length - 1" class="my-3"></v-divider>
              </div>
            </div>

            <!-- Single-faced card -->
            <div v-else>
              <div v-if="card.oracle_text" v-html="renderManaHtml(card.oracle_text)" class="oracle-text mb-3"></div>
              <div v-if="card.flavor_text" class="mt-2 text--secondary"><em>{{ card.flavor_text }}</em></div>
              <div v-if="card.power || card.toughness" class="mt-2">
                <strong>P/T:</strong> {{ card.power || '—' }}/{{ card.toughness || '—' }}
              </div>
              <div v-if="card.loyalty" class="mt-2">
                <strong>Loyalty:</strong> {{ card.loyalty }}
              </div>
            </div>

            <v-divider class="my-3"></v-divider>

            <!-- Card metadata -->
            <v-row>
              <v-col cols="12" md="6">
                <div class="mb-1"><strong>Artist:</strong> {{ card.artist }}</div>
                <div class="mb-1"><strong>Oracle ID:</strong> <code class="oracle-id">{{ card.oracle_id }}</code></div>
                <div class="mb-1"><strong>Released:</strong> {{ formatDate(card.released_at) }}</div>
                <div v-if="card.prices" class="mb-1">
                  <strong>Price (USD):</strong>
                  {{ card.prices.usd ? `$${card.prices.usd}` : 'N/A' }}
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="mb-2"><strong>Legalities:</strong></div>
                <v-chip-group column>
                  <v-chip v-for="(status, format) in card.legalities" :key="format" :color="getLegalityColor(status)"
                    small outlined>
                    {{ format }}: {{ status }}
                  </v-chip>
                </v-chip-group>
              </v-col>
            </v-row>

            <v-divider class="my-3"></v-divider>

            <!-- Action buttons -->
            <div class="d-flex align-center">
              <v-btn text color="primary" @click="openScryfall" :disabled="!card.scryfall_uri">
                <v-icon left>mdi-open-in-new</v-icon>
                Open on Scryfall
              </v-btn>
              <v-spacer />
              <v-btn outlined @click="closeDialog">Close</v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card>

      <!-- Loading state for dialog -->
      <v-card v-else class="pa-8 text-center">
        <v-progress-circular indeterminate size="64" color="primary" />
        <div class="mt-4">Loading card details...</div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import debounce from 'lodash/debounce';
import manaRenderer from '@/utils/manaRenderer';

export default {
  name: 'HomeView',

  data() {
    return {
      dialog: false,
      placeholderImage: 'https://via.placeholder.com/488x680/2a2a2a/888888?text=No+Image',
      searchText: '',
      searchTextInput: '',
      selectedAutocomplete: null,
      autocompleteLoading: false,
      loadingMore: false,
      currentPreviewImage: null,
      errorSnackbar: false,
      errorMessage: '',
      activePrintingId: null,
    };
  },

  computed: {
    ...mapState('mtg', ['cards', 'card', 'printings', 'loading', 'error', 'autocomplete']),
    ...mapGetters('mtg', ['currentCardImage', 'manaSymbolMap']),

    searchHasMore() {
      return this.$store.state.mtg.search.has_more;
    },
  },

  watch: {
    error(newError) {
      if (newError) {
        this.showError(newError);
      }
    },

    card(newCard) {
      if (newCard) {
        this.activePrintingId = newCard.id;
        this.currentPreviewImage = null; // Reset to show main card image
      }
    }
  },

  methods: {
    async onAutocompleteTyping(query) {
      this.searchText = query;
      if (!query || query.length < 2) {
        this.autocompleteLoading = false;
        return;
      }

      this.autocompleteLoading = true;
      this.debouncedFetchAutocomplete(query);
    },

    async onAutocompleteSelect(name) {
      if (!name) return;

      try {
        await this.$store.dispatch('mtg/fetchCard', { named: name });
        this.dialog = true;
      } catch (err) {
        this.showError('Failed to load card: ' + err.message);
      }

      // Clear autocomplete selection after use
      this.selectedAutocomplete = null;
      this.searchText = '';
    },

    async doSearch() {
      const query = (this.searchTextInput || this.searchText || '').trim();
      if (!query) {
        this.showError('Please enter a search term');
        return;
      }

      try {
        await this.$store.dispatch('mtg/fetchCards', { q: query });
      } catch (err) {
        // Error is already shown via watcher
      }
    },

    async selectCard(id) {
      try {
        await this.$store.dispatch('mtg/fetchCard', id);
        this.dialog = true;
      } catch (err) {
        this.showError('Failed to fetch card: ' + err.message);
      }
    },

    async loadMore() {
      if (!this.searchHasMore || this.loadingMore) return;

      this.loadingMore = true;
      try {
        await this.$store.dispatch('mtg/fetchCardsNextPage');
      } catch (err) {
        this.showError('Load more failed: ' + err.message);
      } finally {
        this.loadingMore = false;
      }
    },

    setPreviewFromPrinting(printing) {
      this.activePrintingId = printing.id;
      const img = this.printingImage(printing);
      if (img) {
        this.currentPreviewImage = img;
      }
    },

    getCardThumbnail(card) {
      if (card.image_uris?.small) return card.image_uris.small;
      if (card.card_faces?.[0]?.image_uris?.small) {
        return card.card_faces[0].image_uris.small;
      }
      return this.placeholderImage;
    },

    printingThumb(printing) {
      if (!printing) return this.placeholderImage;
      if (printing.image_uris?.small) return printing.image_uris.small;
      if (printing.card_faces?.[0]?.image_uris?.small) {
        return printing.card_faces[0].image_uris.small;
      }
      return this.placeholderImage;
    },

    printingImage(printing) {
      if (!printing) return null;

      const uris = printing.image_uris;
      if (uris) {
        return uris.large || uris.normal || uris.png;
      }

      const faceUris = printing.card_faces?.[0]?.image_uris;
      if (faceUris) {
        return faceUris.large || faceUris.normal || faceUris.png;
      }

      return null;
    },

    isActivePrinting(printing) {
      return this.activePrintingId === printing.id;
    },

    openScryfall() {
      if (this.card?.scryfall_uri) {
        window.open(this.card.scryfall_uri, '_blank');
      }
    },

    closeDialog() {
      this.dialog = false;
      this.currentPreviewImage = null;
      this.activePrintingId = null;
    },

    renderManaHtml(text) {
      return manaRenderer.renderManaHtml(text, this.manaSymbolMap);
    },

    showError(msg) {
      this.errorMessage = msg;
      this.errorSnackbar = true;
    },

    capitalizeRarity(rarity) {
      if (!rarity) return '';
      return rarity.charAt(0).toUpperCase() + rarity.slice(1);
    },

    getLegalityColor(status) {
      switch (status) {
        case 'legal': return 'success';
        case 'banned': return 'error';
        case 'restricted': return 'warning';
        default: return 'grey';
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'Unknown';
      try {
        return new Date(dateString).toLocaleDateString();
      } catch {
        return dateString;
      }
    },
  },

  async created() {
    // Create debounced autocomplete method
    this.debouncedFetchAutocomplete = debounce(async (query) => {
      try {
        await this.$store.dispatch('mtg/fetchAutocomplete', query);
      } catch (err) {
        console.warn('Autocomplete failed:', err.message);
      } finally {
        this.autocompleteLoading = false;
      }
    }, 300);

    // Load initial cards with a safe default search
    try {
      await this.$store.dispatch('mtg/fetchCards', { q: 'set:neo' }); // Default to recent set
    } catch (err) {
      // Error will be handled by watcher
    }
  },
};
</script>

<style scoped>
.mtg-theme {
  background: linear-gradient(180deg, #0f0f12 0%, #141418 100%);
  color: #eaeaea;
  min-height: 100vh;
}

.card-item {
  background-color: #1e1e1e !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hoverable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
}

.card-image-container {
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 8px;
}

.card-detail-image {
  border-radius: 4px;
}

.printings-group {
  overflow-x: auto;
  padding-bottom: 6px;
}

.printing-thumb {
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.2s ease;
}

.printing-thumb:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.printing-active {
  border-color: #1976d2 !important;
  box-shadow: 0 0 8px rgba(25, 118, 210, 0.3);
}

.face-block {
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border-left: 3px solid #1976d2;
}

.oracle-text {
  line-height: 1.4;
  white-space: pre-wrap;
}

.oracle-id {
  font-size: 0.85em;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.truncate-1 {
  max-width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Global mana symbol styling */
:deep(.mana-symbol) {
  width: 18px;
  height: 18px;
  vertical-align: -3px;
  margin: 0 1px;
  display: inline-block;
}

/* Dark theme adjustments for Vuetify components */
:deep(.v-card) {
  background-color: #1e1e1e !important;
}

:deep(.v-dialog .v-card) {
  background-color: #2a2a2a !important;
}

:deep(.v-text-field--outlined .v-input__control .v-input__slot) {
  background-color: rgba(255, 255, 255, 0.04) !important;
}

:deep(.v-autocomplete--is-selecting-index .v-chip) {
  background-color: #1976d2 !important;
}
</style>