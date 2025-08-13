<template>
  <div class="home-view">
    <!-- Background effects -->
    <div class="background-effects">
      <div class="magic-circle magic-circle-1"></div>
      <div class="magic-circle magic-circle-2"></div>
      <div class="magic-circle magic-circle-3"></div>
    </div>

    <v-container fluid class="home-container">
      <!-- Success/Error notifications -->
      <v-snackbar v-model="errorSnackbar" color="error" top right timeout="6000" class="error-snackbar">
        <v-icon left>mdi-alert-circle</v-icon>
        {{ errorMessage }}
        <template v-slot:action="{ attrs }">
          <v-btn text v-bind="attrs" @click="errorSnackbar = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-snackbar>

      <v-snackbar v-model="successSnackbar" color="success" top right timeout="3000" class="success-snackbar">
        <v-icon left>mdi-check-circle</v-icon>
        {{ successMessage }}
        <template v-slot:action="{ attrs }">
          <v-btn text v-bind="attrs" @click="successSnackbar = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-snackbar>

      <!-- Search section -->
      <div class="search-section">
        <CardSearchBar :autocomplete="autocomplete" @card-selected="onCardSelected" @search="onSearch"
          @autocomplete-search="onAutocompleteSearch" />
      </div>

      <!-- Results section -->
      <div class="results-section">
        <div v-if="cards.length" class="results-header">
          <h2 class="results-title">
            <v-icon left color="primary">mdi-cards-outline</v-icon>
            Search Results
          </h2>
          <div class="results-meta">
            {{ cards.length }} cards found
            <span v-if="searchHasMore" class="has-more-indicator">
              (more available)
            </span>
          </div>
        </div>

        <CardGrid :cards="cards" :loading="loading" :loading-more="loadingMore" :has-more="searchHasMore" :error="error"
          @card-selected="selectCard" @load-more="loadMore" @search="onSearch" />
      </div>
    </v-container>

    <!-- Card detail dialog -->
    <CardDetailDialog v-model="dialog" :card="card" :printings="printings" :current-preview-image="currentPreviewImage"
      :active-printing-id="activePrintingId" @close="closeDialog" @preview-changed="setPreviewFromPrinting"
      @show-message="showSuccessMessage" />

    <!-- Floating action button for quick search -->
    <v-fab-transition>
      <v-btn v-show="!dialog && cards.length" fab fixed bottom right color="primary" class="fab-search"
        @click="scrollToTop">
        <v-icon>mdi-arrow-up</v-icon>
      </v-btn>
    </v-fab-transition>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import CardSearchBar from '@/components/CardSearchBar.vue';
import CardGrid from '@/components/CardGrid.vue';
import CardDetailDialog from '@/components/CardDetailDialog.vue';

export default {
  name: 'HomeView',

  components: {
    CardSearchBar,
    CardGrid,
    CardDetailDialog
  },

  data() {
    return {
      dialog: false,
      loadingMore: false,
      currentPreviewImage: null,
      activePrintingId: null,

      // Notification states
      errorSnackbar: false,
      errorMessage: '',
      successSnackbar: false,
      successMessage: ''
    };
  },

  computed: {
    ...mapState('mtg', [
      'cards',
      'card',
      'printings',
      'loading',
      'error',
      'autocomplete'
    ]),
    ...mapGetters('mtg', ['currentCardImage']),

    searchHasMore() {
      return this.$store.state.mtg.search.has_more;
    }
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
    // Search methods
    async onSearch(query) {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        this.showError('Please enter a search term');
        return;
      }

      try {
        await this.$store.dispatch('mtg/fetchCards', { q: trimmedQuery });
        this.scrollToResults();
      } catch (err) {
        // Error is already shown via watcher
      }
    },

    async onCardSelected(cardName) {
      if (!cardName) return;

      try {
        await this.$store.dispatch('mtg/fetchCard', { named: cardName });
        this.dialog = true;
      } catch (err) {
        this.showError('Failed to load card: ' + err.message);
      }
    },

    async onAutocompleteSearch(query) {
      try {
        await this.$store.dispatch('mtg/fetchAutocomplete', query);
      } catch (err) {
        console.warn('Autocomplete failed:', err.message);
      }
    },

    // Card selection methods
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

    // Dialog methods
    setPreviewFromPrinting(printing) {
      this.activePrintingId = printing.id;
      const img = this.getPrintingImage(printing);
      if (img) {
        this.currentPreviewImage = img;
      }
    },

    closeDialog() {
      this.dialog = false;
      this.currentPreviewImage = null;
      this.activePrintingId = null;
    },

    // Utility methods
    getPrintingImage(printing) {
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

    // Notification methods
    showError(message) {
      this.errorMessage = message;
      this.errorSnackbar = true;
    },

    showSuccessMessage(message) {
      this.successMessage = message;
      this.successSnackbar = true;
    },

    // Navigation methods
    scrollToTop() {
      this.$vuetify.goTo(0, {
        duration: 800,
        easing: 'easeInOutCubic'
      });
    },

    scrollToResults() {
      this.$nextTick(() => {
        const resultsElement = document.querySelector('.results-section');
        if (resultsElement) {
          this.$vuetify.goTo(resultsElement, {
            duration: 800,
            easing: 'easeInOutCubic',
            offset: 100
          });
        }
      });
    }
  },

  async created() {
    // Load initial cards with a default search to showcase the app
    try {
      await this.$store.dispatch('mtg/fetchCards', {
        q: 'set:one OR set:mom OR set:mat'
      });
    } catch (err) {
      // Error will be handled by watcher
      console.warn('Failed to load initial cards:', err.message);
    }
  },

  mounted() {
    // Add subtle scroll effects
    window.addEventListener('scroll', this.handleScroll);
  },

  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll);
  }
};
</script>

<style scoped>
.home-view {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f12 0%, #141418 50%, #1a1a1e 100%);
  overflow-x: hidden;
}

/* Animated background effects */
.background-effects {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.magic-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(25, 118, 210, 0.1);
  animation: rotate 60s linear infinite;
}

.magic-circle-1 {
  width: 400px;
  height: 400px;
  top: -200px;
  right: -200px;
  animation-duration: 80s;
  border-width: 2px;
}

.magic-circle-2 {
  width: 600px;
  height: 600px;
  bottom: -300px;
  left: -300px;
  animation-duration: 100s;
  animation-direction: reverse;
  border-color: rgba(25, 118, 210, 0.05);
}

.magic-circle-3 {
  width: 300px;
  height: 300px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-duration: 120s;
  border-color: rgba(25, 118, 210, 0.03);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.home-container {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  padding: 24px;
}

.search-section {
  margin-bottom: 32px;
  position: sticky;
  top: 16px;
  z-index: 10;
}

.results-section {
  position: relative;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 0;
  border-bottom: 2px solid rgba(25, 118, 210, 0.2);
}

.results-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #eaeaea;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.results-meta {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.has-more-indicator {
  color: #1976d2;
  font-weight: 500;
}

.fab-search {
  margin: 0 16px 16px 0;
  box-shadow: 0 8px 20px rgba(25, 118, 210, 0.3);
}

.fab-search:hover {
  box-shadow: 0 12px 30px rgba(25, 118, 210, 0.4);
  transform: translateY(-2px);
}

/* Enhanced notification styling */
.error-snackbar {
  backdrop-filter: blur(10px);
}

.success-snackbar {
  backdrop-filter: blur(10px);
}

/* Responsive design */
@media (max-width: 960px) {
  .home-container {
    padding: 16px;
  }

  .search-section {
    position: static;
    margin-bottom: 24px;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    text-align: left;
  }

  .results-title {
    font-size: 1.5rem;
  }

  .results-meta {
    font-size: 0.9rem;
  }
}

@media (max-width: 600px) {
  .home-container {
    padding: 12px;
  }

  .results-title {
    font-size: 1.3rem;
  }

  .magic-circle-1,
  .magic-circle-2,
  .magic-circle-3 {
    display: none;
    /* Hide complex animations on small screens for performance */
  }
}

/* Scroll-based animations */
.results-section {
  animation: fadeInUp 0.8s ease forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading state improvements */
:deep(.v-progress-circular) {
  filter: drop-shadow(0 4px 8px rgba(25, 118, 210, 0.3));
}

/* Enhance scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar for the main content */
.home-view::-webkit-scrollbar {
  width: 8px;
}

.home-view::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.home-view::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #1976d2, #42a5f5);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.home-view::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #1565c0, #1976d2);
}
</style>