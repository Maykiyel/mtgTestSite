<template>
    <v-card class="search-card" elevation="8">
        <v-card-text class="pa-6">
            <div class="search-header mb-4">
                <v-icon size="32" color="primary" class="mr-3">mdi-cards-outline</v-icon>
                <h2 class="search-title">Planeswalker's Archive</h2>
            </div>

            <v-row class="search-controls" align="center">
                <v-col cols="12" md="7">
                    <v-autocomplete v-model="selectedAutocomplete" :items="autocomplete" :loading="autocompleteLoading"
                        :search-input.sync="searchText" hide-no-data hide-details clearable label="Search by card name"
                        placeholder="Enter a card name..." solo flat background-color="rgba(255, 255, 255, 0.05)"
                        @change="onAutocompleteSelect" @update:search-input="onAutocompleteTyping"
                        class="search-autocomplete">
                        <template v-slot:prepend-inner>
                            <v-icon color="primary">mdi-magnify</v-icon>
                        </template>
                        <template v-slot:append>
                            <v-btn icon small color="primary" @click="onQuickSearch" :disabled="!searchText"
                                class="search-btn">
                                <v-icon>mdi-arrow-right</v-icon>
                            </v-btn>
                        </template>
                    </v-autocomplete>
                </v-col>

                <v-col cols="12" md="5">
                    <v-text-field v-model="searchTextInput" label="Advanced search (Scryfall syntax)"
                        placeholder="e.g., t:creature cmc:3 c:red" solo flat
                        background-color="rgba(255, 255, 255, 0.05)" @keyup.enter="doAdvancedSearch"
                        class="advanced-search">
                        <template v-slot:prepend-inner>
                            <v-icon color="orange">mdi-code-braces</v-icon>
                        </template>
                        <template v-slot:append>
                            <v-btn icon small color="orange" @click="doAdvancedSearch" :disabled="!searchTextInput">
                                <v-icon>mdi-search</v-icon>
                            </v-btn>
                        </template>
                    </v-text-field>
                </v-col>
            </v-row>

            <!-- Quick search suggestions -->
            <div class="quick-suggestions mt-4">
                <div class="suggestions-label mb-2">Quick searches:</div>
                <v-chip-group>
                    <v-chip v-for="suggestion in quickSuggestions" :key="suggestion.query" small outlined
                        color="primary" @click="executeQuickSearch(suggestion.query)" class="suggestion-chip">
                        <v-icon left small>{{ suggestion.icon }}</v-icon>
                        {{ suggestion.label }}
                    </v-chip>
                </v-chip-group>
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import debounce from 'lodash/debounce';

export default {
    name: 'CardSearchBar',

    props: {
        autocomplete: {
            type: Array,
            default: () => []
        }
    },

    data() {
        return {
            searchText: '',
            searchTextInput: '',
            selectedAutocomplete: null,
            autocompleteLoading: false,
            quickSuggestions: [
                { label: 'Planeswalkers', query: 't:planeswalker', icon: 'mdi-crown' },
                { label: 'Dragons', query: 't:dragon', icon: 'mdi-dragon' },
                { label: 'Recent Cards', query: 'set:one OR set:mom OR set:mat', icon: 'mdi-new-box' },
                { label: 'Legendary', query: 't:legendary', icon: 'mdi-star' },
                { label: 'Artifacts', query: 't:artifact', icon: 'mdi-cog' },
                { label: 'Blue Control', query: 'c:blue t:instant OR t:sorcery', icon: 'mdi-water' },
            ]
        };
    },

    methods: {
        onAutocompleteTyping(query) {
            this.searchText = query;
            if (!query || query.length < 2) {
                this.autocompleteLoading = false;
                return;
            }

            this.autocompleteLoading = true;
            this.debouncedFetchAutocomplete(query);
        },

        onAutocompleteSelect(name) {
            if (name) {
                this.$emit('card-selected', name);
                this.selectedAutocomplete = null;
                this.searchText = '';
            }
        },

        onQuickSearch() {
            if (this.searchText) {
                this.$emit('search', this.searchText);
            }
        },

        doAdvancedSearch() {
            if (this.searchTextInput) {
                this.$emit('search', this.searchTextInput);
            }
        },

        executeQuickSearch(query) {
            this.$emit('search', query);
        },
    },

    created() {
        this.debouncedFetchAutocomplete = debounce(async (query) => {
            try {
                this.$emit('autocomplete-search', query);
            } catch (err) {
                console.warn('Autocomplete failed:', err.message);
            } finally {
                this.autocompleteLoading = false;
            }
        }, 300);
    },
};
</script>

<style scoped>
.search-card {
    background: linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(30, 30, 30, 0.9) 100%) !important;
    border: 1px solid rgba(25, 118, 210, 0.3);
    backdrop-filter: blur(10px);
}

.search-header {
    display: flex;
    align-items: center;
    justify-content: center;
}

.search-title {
    background: linear-gradient(45deg, #1976d2, #42a5f5);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
    letter-spacing: 1px;
}

.search-controls {
    margin-top: 16px;
}

:deep(.search-autocomplete .v-input__control),
:deep(.advanced-search .v-input__control) {
    border-radius: 12px !important;
}

:deep(.search-autocomplete .v-input__slot),
:deep(.advanced-search .v-input__slot) {
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    transition: all 0.3s ease;
}

:deep(.search-autocomplete .v-input--is-focused .v-input__slot),
:deep(.advanced-search .v-input--is-focused .v-input__slot) {
    border-color: #1976d2 !important;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.search-btn {
    margin-right: 8px;
}

.quick-suggestions {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 16px;
}

.suggestions-label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
}

.suggestion-chip {
    margin-bottom: 8px;
    transition: all 0.2s ease;
}

.suggestion-chip:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
}

@media (max-width: 960px) {
    .search-header {
        flex-direction: column;
        text-align: center;
    }

    .search-title {
        margin-top: 8px;
        font-size: 1.5rem;
    }
}
</style>