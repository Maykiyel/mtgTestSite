<template>
    <div class="card-faces">
        <h4 class="faces-title">
            <v-icon left color="primary">mdi-cards</v-icon>
            Double-Faced Card
        </h4>

        <v-tabs v-model="activeTab" class="faces-tabs" background-color="transparent" color="primary"
            slider-color="primary">
            <v-tab v-for="(face, index) in faces" :key="index" class="face-tab">
                <v-icon left small>{{ getFaceIcon(face, index) }}</v-icon>
                {{ face.name }}
            </v-tab>
        </v-tabs>

        <v-tabs-items v-model="activeTab" class="faces-content">
            <v-tab-item v-for="(face, index) in faces" :key="index" class="face-item">
                <v-card class="face-card" flat>
                    <v-card-text class="pa-4">
                        <!-- Face header -->
                        <div class="face-header mb-3">
                            <h3 class="face-name">{{ face.name }}</h3>
                            <div v-if="face.mana_cost" class="face-mana-cost">
                                <span v-html="renderManaHtml(face.mana_cost)"></span>
                            </div>
                        </div>

                        <!-- Type line -->
                        <div class="face-type-line mb-3">
                            <strong>{{ face.type_line }}</strong>
                        </div>

                        <!-- Oracle text -->
                        <div v-if="face.oracle_text" class="face-oracle-text mb-3">
                            <div v-html="renderManaHtml(face.oracle_text)" class="oracle-content"></div>
                        </div>

                        <!-- Power/Toughness or Loyalty -->
                        <div v-if="face.power || face.toughness || face.loyalty" class="face-stats mb-3">
                            <v-chip v-if="face.power || face.toughness" color="primary" outlined small
                                class="stat-chip">
                                <v-icon left small>mdi-sword-cross</v-icon>
                                <strong>{{ face.power || '—' }}/{{ face.toughness || '—' }}</strong>
                            </v-chip>

                            <v-chip v-if="face.loyalty" color="purple" outlined small class="stat-chip ml-2">
                                <v-icon left small>mdi-crown</v-icon>
                                <strong>{{ face.loyalty }}</strong>
                            </v-chip>
                        </div>

                        <!-- Flavor text -->
                        <div v-if="face.flavor_text" class="face-flavor-text">
                            <v-divider class="mb-3"></v-divider>
                            <div class="flavor-content">
                                <v-icon small color="grey" class="mr-2">mdi-format-quote-open</v-icon>
                                <em>{{ face.flavor_text }}</em>
                                <v-icon small color="grey" class="ml-2">mdi-format-quote-close</v-icon>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-tab-item>
        </v-tabs-items>

        <!-- Face comparison (for mobile) -->
        <div v-if="faces.length === 2" class="face-comparison d-md-none mt-4">
            <v-btn @click="showComparison = !showComparison" outlined small class="comparison-toggle">
                <v-icon left>{{ showComparison ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                {{ showComparison ? 'Hide' : 'Show' }} Comparison
            </v-btn>

            <v-expand-transition>
                <div v-show="showComparison" class="comparison-content mt-3">
                    <v-row>
                        <v-col v-for="(face, index) in faces" :key="`comp-${index}`" cols="6">
                            <div class="mini-face-card">
                                <div class="mini-face-name">{{ face.name }}</div>
                                <div v-if="face.mana_cost" class="mini-mana-cost">
                                    <span v-html="renderManaHtml(face.mana_cost)"></span>
                                </div>
                                <div class="mini-type">{{ face.type_line }}</div>
                                <div v-if="face.power || face.toughness" class="mini-stats">
                                    {{ face.power || '—' }}/{{ face.toughness || '—' }}
                                </div>
                                <div v-if="face.loyalty" class="mini-stats">
                                    Loyalty: {{ face.loyalty }}
                                </div>
                            </div>
                        </v-col>
                    </v-row>
                </div>
            </v-expand-transition>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import manaRenderer from '@/utils/manaRenderer';

export default {
    name: 'CardFaces',

    props: {
        faces: {
            type: Array,
            required: true
        }
    },

    data() {
        return {
            activeTab: 0,
            showComparison: false
        };
    },

    computed: {
        ...mapGetters('mtg', ['manaSymbolMap']),
    },

    methods: {
        renderManaHtml(text) {
            return manaRenderer.renderManaHtml(text, this.manaSymbolMap);
        },

        getFaceIcon(face, index) {
            // Determine appropriate icon based on face type or position
            if (face.type_line?.toLowerCase().includes('planeswalker')) {
                return 'mdi-crown';
            }
            if (face.type_line?.toLowerCase().includes('creature')) {
                return 'mdi-account';
            }
            if (face.type_line?.toLowerCase().includes('instant') ||
                face.type_line?.toLowerCase().includes('sorcery')) {
                return 'mdi-flash';
            }
            if (face.type_line?.toLowerCase().includes('artifact')) {
                return 'mdi-cog';
            }
            if (face.type_line?.toLowerCase().includes('enchantment')) {
                return 'mdi-shimmer';
            }
            if (face.type_line?.toLowerCase().includes('land')) {
                return 'mdi-image-filter-hdr';
            }

            // Default icons for face position
            return index === 0 ? 'mdi-numeric-1-circle' : 'mdi-numeric-2-circle';
        }
    }
};
</script>

<style scoped>
.card-faces {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
}

.faces-title {
    color: #eaeaea;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    font-size: 1.1rem;
    padding: 16px 16px 0;
}

.faces-tabs {
    background: rgba(255, 255, 255, 0.05);
}

.face-tab {
    text-transform: none;
    font-weight: 500;
}

.faces-content {
    background: transparent;
}

.face-item {
    padding: 0;
}

.face-card {
    background: transparent !important;
}

.face-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px;
}

.face-name {
    color: #eaeaea;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.2;
}

.face-mana-cost {
    flex-shrink: 0;
}

.face-type-line {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    border-left: 3px solid #1976d2;
    padding-left: 12px;
    background: rgba(25, 118, 210, 0.05);
    padding: 8px 12px;
    border-radius: 0 8px 8px 0;
}

.face-oracle-text {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.oracle-content {
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
}

.face-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.stat-chip {
    font-weight: 600;
}

.face-flavor-text {
    margin-top: 16px;
}

.flavor-content {
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
    line-height: 1.4;
    display: flex;
    align-items: flex-start;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    border-left: 3px solid rgba(255, 255, 255, 0.2);
}

.comparison-toggle {
    text-transform: none;
    font-weight: 500;
}

.comparison-content {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 16px;
}

.mini-face-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    height: 100%;
}

.mini-face-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: #eaeaea;
    margin-bottom: 6px;
}

.mini-mana-cost {
    margin-bottom: 6px;
}

.mini-type {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 6px;
}

.mini-stats {
    font-size: 0.8rem;
    color: #1976d2;
    font-weight: 600;
}

/* Global mana symbol styling for faces */
:deep(.mana-symbol) {
    width: 18px;
    height: 18px;
    vertical-align: -3px;
    margin: 0 2px;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
}

/* Larger mana symbols in face headers */
.face-mana-cost :deep(.mana-symbol) {
    width: 20px;
    height: 20px;
    vertical-align: -4px;
}

/* Smaller mana symbols in mini cards */
.mini-mana-cost :deep(.mana-symbol) {
    width: 14px;
    height: 14px;
    vertical-align: -2px;
    margin: 0 1px;
}

/* Tab styling overrides */
:deep(.v-tabs-bar) {
    background: rgba(255, 255, 255, 0.05) !important;
}

:deep(.v-tab) {
    color: rgba(255, 255, 255, 0.7) !important;
}

:deep(.v-tab--active) {
    color: #1976d2 !important;
}

:deep(.v-tabs-slider) {
    background-color: #1976d2 !important;
}

@media (max-width: 600px) {
    .face-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .face-name {
        font-size: 1.1rem;
    }

    .face-tab {
        min-width: auto;
        padding: 0 12px;
    }

    .mini-face-card {
        padding: 8px;
    }

    .oracle-content {
        font-size: 0.9rem;
    }
}
</style>