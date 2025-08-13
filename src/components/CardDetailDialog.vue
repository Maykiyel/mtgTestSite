<template>
    <v-dialog v-model="dialogModel" max-width="1400px" persistent scrollable>
        <v-card class="card-detail-dialog">
            <!-- Loading state -->
            <div v-if="!card" class="dialog-loading">
                <v-progress-circular indeterminate size="80" width="4" color="primary" class="mb-4" />
                <h3>Loading card details...</h3>
                <p class="text--secondary">Retrieving from the planeswalker archives</p>
            </div>

            <!-- Card content -->
            <div v-else class="card-content">
                <!-- Header with close button -->
                <div class="dialog-header">
                    <div class="header-content">
                        <h1 class="card-title">{{ card.name }}</h1>
                        <div v-if="card.mana_cost" class="mana-cost-header">
                            <span v-html="renderManaHtml(card.mana_cost)"></span>
                        </div>
                    </div>
                    <v-btn icon large @click="closeDialog" class="close-btn">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>

                <v-row class="card-detail-row">
                    <!-- Left column: Image and printings -->
                    <v-col cols="12" lg="5" class="image-column">
                        <div class="main-image-container">
                            <v-img :src="currentPreviewImage || currentCardImage || placeholderImage"
                                class="main-card-image" contain max-height="600" />
                        </div>

                        <!-- Printings carousel -->
                        <PrintingsCarousel v-if="printings.length > 1" :printings="printings"
                            :active-printing-id="activePrintingId" @printing-selected="setPreviewFromPrinting" />
                    </v-col>

                    <!-- Right column: Card details -->
                    <v-col cols="12" lg="7" class="details-column">
                        <div class="card-details-content">
                            <!-- Basic info section -->
                            <div class="info-section">
                                <div class="type-line">{{ card.type_line }}</div>
                                <div class="set-info">
                                    <span class="set-name">{{ card.set_name }}</span>
                                    <v-chip small :color="getSetColor(card.set)" dark class="ml-2">
                                        {{ card.set.toUpperCase() }}
                                    </v-chip>
                                    <span class="collector-info">
                                        #{{ card.collector_number }} • {{ capitalizeRarity(card.rarity) }}
                                    </span>
                                </div>
                            </div>

                            <v-divider class="my-4"></v-divider>

                            <!-- Card faces or single card text -->
                            <div class="oracle-section">
                                <CardFaces v-if="card.card_faces && card.card_faces.length" :faces="card.card_faces" />
                                <SingleCardText v-else :card="card" />
                            </div>

                            <v-divider class="my-4"></v-divider>

                            <!-- Metadata section -->
                            <div class="metadata-section">
                                <v-row>
                                    <v-col cols="12" md="6">
                                        <div class="metadata-group">
                                            <h4 class="metadata-title">Card Info</h4>
                                            <div class="metadata-item">
                                                <span class="metadata-label">Artist:</span>
                                                <span class="metadata-value">{{ card.artist }}</span>
                                            </div>
                                            <div class="metadata-item">
                                                <span class="metadata-label">Released:</span>
                                                <span class="metadata-value">{{ formatDate(card.released_at) }}</span>
                                            </div>
                                            <div v-if="card.prices?.usd" class="metadata-item">
                                                <span class="metadata-label">Price:</span>
                                                <span class="metadata-value price-value">${{ card.prices.usd }}</span>
                                            </div>
                                        </div>
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <div class="metadata-group">
                                            <h4 class="metadata-title">Format Legality</h4>
                                            <div class="legality-grid">
                                                <v-chip v-for="(status, format) in card.legalities" :key="format"
                                                    :color="getLegalityColor(status)" small outlined
                                                    class="legality-chip">
                                                    <strong>{{ format }}:</strong>&nbsp;{{ status }}
                                                </v-chip>
                                            </div>
                                        </div>
                                    </v-col>
                                </v-row>
                            </div>

                            <!-- Action buttons -->
                            <div class="action-section">
                                <v-btn color="primary" large @click="openScryfall" :disabled="!card.scryfall_uri"
                                    class="action-btn">
                                    <v-icon left>mdi-open-in-new</v-icon>
                                    View on Scryfall
                                </v-btn>
                                <v-btn outlined large @click="copyOracleId" class="action-btn ml-3">
                                    <v-icon left>mdi-content-copy</v-icon>
                                    Copy Oracle ID
                                </v-btn>
                            </div>
                        </div>
                    </v-col>
                </v-row>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
import { mapGetters } from 'vuex';
import manaRenderer from '@/utils/manaRenderer';
import PrintingsCarousel from './PrintingsCarousel.vue';
import CardFaces from './CardFaces.vue';
import SingleCardText from './SingleCardText.vue';

export default {
    name: 'CardDetailDialog',

    components: {
        PrintingsCarousel,
        CardFaces,
        SingleCardText
    },

    props: {
        value: {
            type: Boolean,
            default: false
        },
        card: {
            type: Object,
            default: null
        },
        printings: {
            type: Array,
            default: () => []
        },
        currentPreviewImage: {
            type: String,
            default: null
        },
        activePrintingId: {
            type: String,
            default: null
        }
    },

    data() {
        return {
            placeholderImage: 'https://via.placeholder.com/488x680/2a2a2a/888888?text=No+Image',
            setColors: {
                'neo': '#ff6b35',
                'one': '#b19cd9',
                'mom': '#90ee90',
                'mat': '#ffd700',
                'woe': '#8b4513',
                'ltr': '#daa520',
                'default': '#1976d2'
            }
        };
    },

    computed: {
        ...mapGetters('mtg', ['currentCardImage', 'manaSymbolMap']),

        dialogModel: {
            get() {
                return this.value;
            },
            set(value) {
                this.$emit('input', value);
            }
        }
    },

    methods: {
        closeDialog() {
            this.$emit('close');
        },

        setPreviewFromPrinting(printing) {
            this.$emit('preview-changed', printing);
        },

        openScryfall() {
            if (this.card?.scryfall_uri) {
                window.open(this.card.scryfall_uri, '_blank');
            }
        },

        async copyOracleId() {
            if (this.card?.oracle_id) {
                try {
                    await navigator.clipboard.writeText(this.card.oracle_id);
                    this.$emit('show-message', 'Oracle ID copied to clipboard!');
                } catch (err) {
                    console.warn('Failed to copy to clipboard:', err);
                    this.$emit('show-message', 'Failed to copy Oracle ID');
                }
            }
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
        }
    }
};
</script>

<style scoped>
.card-detail-dialog {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%) !important;
    border: 1px solid rgba(25, 118, 210, 0.3);
}

.dialog-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 40px;
    text-align: center;
}

.card-content {
    max-height: 90vh;
    overflow-y: auto;
}

.dialog-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 24px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: sticky;
    top: 0;
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    z-index: 1;
}

.header-content {
    flex: 1;
}

.card-title {
    font-size: 2rem;
    font-weight: 600;
    color: #eaeaea;
    margin-bottom: 8px;
    line-height: 1.2;
}

.mana-cost-header {
    margin-top: 8px;
}

.close-btn {
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.1) !important;
}

.card-detail-row {
    margin: 0;
    min-height: 600px;
}

.image-column,
.details-column {
    padding: 24px;
}

.main-image-container {
    background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
    border-radius: 16px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 24px;
}

.main-card-image {
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.card-details-content {
    height: 100%;
}

.info-section {
    margin-bottom: 16px;
}

.type-line {
    font-size: 1.2rem;
    font-weight: 500;
    color: #eaeaea;
    margin-bottom: 8px;
}

.set-info {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.set-name {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
}

.collector-info {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
}

.oracle-section {
    margin: 24px 0;
}

.metadata-section {
    margin: 24px 0;
}

.metadata-group {
    margin-bottom: 16px;
}

.metadata-title {
    color: #1976d2;
    font-weight: 600;
    margin-bottom: 12px;
    font-size: 1.1rem;
}

.metadata-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.metadata-label {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    min-width: 80px;
}

.metadata-value {
    color: #eaeaea;
    text-align: right;
}

.price-value {
    color: #4caf50;
    font-weight: 600;
}

.legality-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.legality-chip {
    font-size: 0.75rem;
}

.action-section {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.action-btn {
    text-transform: none;
    font-weight: 600;
}

/* Global mana symbol styling */
:deep(.mana-symbol) {
    width: 20px;
    height: 20px;
    vertical-align: -4px;
    margin: 0 2px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* Larger mana symbols in header */
.mana-cost-header :deep(.mana-symbol) {
    width: 24px;
    height: 24px;
    vertical-align: -5px;
}

/* Scrollbar styling */
.card-content::-webkit-scrollbar {
    width: 8px;
}

.card-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.card-content::-webkit-scrollbar-thumb {
    background: rgba(25, 118, 210, 0.5);
    border-radius: 4px;
}

.card-content::-webkit-scrollbar-thumb:hover {
    background: rgba(25, 118, 210, 0.7);
}

@media (max-width: 1200px) {
    .card-title {
        font-size: 1.7rem;
    }

    .image-column,
    .details-column {
        padding: 16px;
    }
}

@media (max-width: 960px) {
    .dialog-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
    }

    .card-title {
        font-size: 1.5rem;
        margin-right: 60px;
    }

    .metadata-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .metadata-value {
        text-align: left;
    }
}
</style>