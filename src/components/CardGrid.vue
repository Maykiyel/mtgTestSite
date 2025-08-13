<template>
    <div>
        <!-- Loading state -->
        <div v-if="loading && !cards.length" class="loading-container">
            <div class="loading-content">
                <v-progress-circular indeterminate size="80" width="4" color="primary" class="mb-4" />
                <h3 class="loading-text">Searching the multiverse...</h3>
                <p class="loading-subtext">Consulting the planeswalker archives</p>
            </div>
        </div>

        <!-- Cards grid -->
        <div v-else-if="cards.length" class="cards-grid">
            <div v-for="card in cards" :key="card.id" class="card-wrapper" @click="$emit('card-selected', card.id)">
                <div class="magic-card">
                    <!-- Card image -->
                    <div class="card-image-container">
                        <v-img :src="getCardThumbnail(card)" :lazy-src="placeholderImage" aspect-ratio="0.7"
                            class="card-image" cover>
                            <template v-slot:placeholder>
                                <div class="image-placeholder">
                                    <v-icon size="48" color="grey">mdi-cards-outline</v-icon>
                                </div>
                            </template>
                        </v-img>

                        <!-- Hover overlay -->
                        <div class="card-overlay">
                            <v-btn icon large color="white" class="view-btn">
                                <v-icon>mdi-eye</v-icon>
                            </v-btn>
                        </div>
                    </div>

                    <!-- Card info -->
                    <div class="card-info">
                        <div class="card-header">
                            <h3 class="card-name">{{ card.name }}</h3>
                            <v-chip small :color="getSetColor(card.set)" dark class="set-chip">
                                {{ card.set.toUpperCase() }}
                            </v-chip>
                        </div>

                        <p class="card-type">{{ card.type_line }}</p>

                        <div v-if="card.mana_cost" class="mana-cost">
                            <span v-html="renderManaHtml(card.mana_cost)"></span>
                        </div>

                        <div class="card-footer">
                            <span class="rarity-badge" :class="`rarity-${card.rarity}`">
                                {{ capitalizeRarity(card.rarity) }}
                            </span>
                            <span v-if="card.prices?.usd" class="price">
                                ${{ card.prices.usd }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Load more section -->
        <div v-if="hasMore && cards.length" class="load-more-section">
            <v-btn :loading="loadingMore" @click="$emit('load-more')" color="primary" large outlined
                class="load-more-btn">
                <v-icon left>mdi-plus</v-icon>
                Load More Cards
            </v-btn>
            <p class="load-more-text">{{ cards.length }} cards loaded</p>
        </div>

        <!-- Empty state -->
        <div v-if="!loading && !cards.length && !error" class="empty-state">
            <div class="empty-content">
                <v-icon size="120" color="grey darken-2" class="mb-6">mdi-cards-outline</v-icon>
                <h2 class="empty-title mb-4">No cards found in the multiverse</h2>
                <p class="empty-subtitle mb-6">
                    Try adjusting your search terms or explore some of our quick suggestions above
                </p>
                <v-btn color="primary" outlined @click="$emit('search', 'set:neo')">
                    <v-icon left>mdi-refresh</v-icon>
                    Browse Recent Cards
                </v-btn>
            </div>
        </div>
    </div>
</template>

<script>
import manaRenderer from '@/utils/manaRenderer';
import { mapGetters } from 'vuex';

export default {
    name: 'CardGrid',

    props: {
        cards: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        loadingMore: {
            type: Boolean,
            default: false
        },
        hasMore: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: null
        }
    },

    data() {
        return {
            placeholderImage: 'https://via.placeholder.com/488x680/2a2a2a/888888?text=No+Image',
            setColors: {
                // Common sets with thematic colors
                'neo': '#ff6b35', // Neon orange for NEO
                'one': '#b19cd9', // Purple for Phyrexia
                'mom': '#90ee90', // Light green for March of the Machine
                'mat': '#ffd700', // Gold for Aftermath
                'woe': '#8b4513', // Brown for Wilds of Eldraine
                'ltr': '#daa520', // Golden for Lord of the Rings
                'default': '#1976d2'
            }
        };
    },

    computed: {
        ...mapGetters('mtg', ['manaSymbolMap']),
    },

    methods: {
        getCardThumbnail(card) {
            if (card.image_uris?.small) return card.image_uris.small;
            if (card.card_faces?.[0]?.image_uris?.small) {
                return card.card_faces[0].image_uris.small;
            }
            return this.placeholderImage;
        },

        getSetColor(setCode) {
            return this.setColors[setCode?.toLowerCase()] || this.setColors.default;
        },

        renderManaHtml(text) {
            return manaRenderer.renderManaHtml(text, this.manaSymbolMap);
        },

        capitalizeRarity(rarity) {
            if (!rarity) return '';
            return rarity.charAt(0).toUpperCase() + rarity.slice(1);
        }
    }
};
</script>

<style scoped>
.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.loading-content {
    text-align: center;
}

.loading-text {
    color: #1976d2;
    font-weight: 500;
    margin-bottom: 8px;
}

.loading-subtext {
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    padding: 24px 0;
}

.card-wrapper {
    cursor: pointer;
    perspective: 1000px;
}

.magic-card {
    background: linear-gradient(145deg, #2a2a2a 0%, #1e1e1e 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
}

.magic-card:hover {
    transform: translateY(-8px) rotateX(5deg);
    box-shadow:
        0 20px 40px rgba(0, 0, 0, 0.4),
        0 0 20px rgba(25, 118, 210, 0.2);
    border-color: rgba(25, 118, 210, 0.5);
}

.card-image-container {
    position: relative;
    overflow: hidden;
}

.card-image {
    transition: transform 0.4s ease;
}

.magic-card:hover .card-image {
    transform: scale(1.05);
}

.card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.3) 70%,
            rgba(0, 0, 0, 0.7) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.magic-card:hover .card-overlay {
    opacity: 1;
}

.view-btn {
    background: rgba(25, 118, 210, 0.9) !important;
    backdrop-filter: blur(10px);
}

.card-info {
    padding: 16px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.card-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #eaeaea;
    margin: 0;
    line-height: 1.2;
    max-width: 70%;
}

.set-chip {
    font-weight: 600;
    font-size: 0.75rem;
}

.card-type {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 8px;
    line-height: 1.3;
}

.mana-cost {
    margin-bottom: 12px;
    min-height: 20px;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.rarity-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.rarity-common {
    background: rgba(128, 128, 128, 0.2);
    color: #c0c0c0;
}

.rarity-uncommon {
    background: rgba(192, 192, 192, 0.2);
    color: #c0c0c0;
}

.rarity-rare {
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
}

.rarity-mythic {
    background: rgba(255, 69, 0, 0.2);
    color: #ff4500;
}

.price {
    font-weight: 600;
    color: #4caf50;
    font-size: 0.9rem;
}

.load-more-section {
    text-align: center;
    padding: 40px 0;
}

.load-more-btn {
    min-width: 200px;
    border-radius: 25px;
    font-weight: 600;
    text-transform: none;
    font-size: 1rem;
}

.load-more-text {
    margin-top: 12px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    padding: 40px;
}

.empty-content {
    text-align: center;
    max-width: 500px;
}

.empty-title {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
}

.empty-subtitle {
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
}

.image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
}

/* Global mana symbol styling */
:deep(.mana-symbol) {
    width: 18px;
    height: 18px;
    vertical-align: -3px;
    margin: 0 2px;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
}

@media (max-width: 600px) {
    .cards-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
        padding: 16px 0;
    }

    .card-info {
        padding: 12px;
    }

    .card-name {
        font-size: 1rem;
    }
}

@media (max-width: 400px) {
    .cards-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }
}
</style>