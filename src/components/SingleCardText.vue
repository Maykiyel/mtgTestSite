<template>
    <div class="single-card-text">
        <!-- Oracle text -->
        <div v-if="card.oracle_text" class="oracle-section">
            <h4 class="section-title">
                <v-icon left color="primary">mdi-script-text</v-icon>
                Oracle Text
            </h4>
            <div class="oracle-card">
                <div v-html="renderManaHtml(card.oracle_text)" class="oracle-content"></div>
            </div>
        </div>

        <!-- Power/Toughness and Loyalty -->
        <div v-if="card.power || card.toughness || card.loyalty" class="stats-section">
            <div class="stats-chips">
                <v-chip v-if="card.power !== undefined || card.toughness !== undefined" color="primary" outlined
                    class="stat-chip">
                    <v-icon left small>mdi-sword-cross</v-icon>
                    <strong>Power/Toughness: {{ card.power || '—' }}/{{ card.toughness || '—' }}</strong>
                </v-chip>

                <v-chip v-if="card.loyalty" color="purple" outlined class="stat-chip">
                    <v-icon left small>mdi-crown</v-icon>
                    <strong>Starting Loyalty: {{ card.loyalty }}</strong>
                </v-chip>
            </div>
        </div>

        <!-- Flavor text -->
        <div v-if="card.flavor_text" class="flavor-section">
            <h4 class="section-title">
                <v-icon left color="orange">mdi-format-quote-open</v-icon>
                Flavor Text
            </h4>
            <div class="flavor-card">
                <div class="flavor-content">
                    <div class="flavor-quote">
                        <v-icon small color="grey" class="quote-icon">mdi-format-quote-open</v-icon>
                        <em class="flavor-text">{{ card.flavor_text }}</em>
                        <v-icon small color="grey" class="quote-icon">mdi-format-quote-close</v-icon>
                    </div>
                    <div v-if="card.flavor_name" class="flavor-attribution">
                        — {{ card.flavor_name }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Additional card properties -->
        <div v-if="hasAdditionalInfo" class="additional-info-section">
            <h4 class="section-title">
                <v-icon left color="cyan">mdi-information</v-icon>
                Additional Information
            </h4>
            <div class="info-grid">
                <div v-if="card.keywords && card.keywords.length" class="info-item">
                    <div class="info-label">Keywords:</div>
                    <div class="keywords-list">
                        <v-chip v-for="keyword in card.keywords" :key="keyword" small outlined color="cyan"
                            class="keyword-chip">
                            {{ keyword }}
                        </v-chip>
                    </div>
                </div>

                <div v-if="card.produced_mana && card.produced_mana.length" class="info-item">
                    <div class="info-label">Produces Mana:</div>
                    <div class="mana-production">
                        <span v-html="renderManaHtml(card.produced_mana.map(m => `{${m}}`).join(''))"></span>
                    </div>
                </div>

                <div v-if="card.color_identity && card.color_identity.length" class="info-item">
                    <div class="info-label">Color Identity:</div>
                    <div class="color-identity">
                        <span v-html="renderManaHtml(card.color_identity.map(c => `{${c}}`).join(''))"></span>
                    </div>
                </div>

                <div v-if="card.cmc !== undefined" class="info-item">
                    <div class="info-label">Mana Value:</div>
                    <div class="info-value">{{ card.cmc }}</div>
                </div>

                <div v-if="card.edhrec_rank" class="info-item">
                    <div class="info-label">EDHREC Rank:</div>
                    <div class="info-value">#{{ card.edhrec_rank.toLocaleString() }}</div>
                </div>
            </div>
        </div>

        <!-- Empty state for cards with minimal text -->
        <div v-if="!hasAnyText" class="no-text-state">
            <v-icon size="48" color="grey" class="mb-3">mdi-text-box-remove</v-icon>
            <p class="grey--text">This card has no oracle or flavor text.</p>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import manaRenderer from '@/utils/manaRenderer';

export default {
    name: 'SingleCardText',

    props: {
        card: {
            type: Object,
            required: true
        }
    },

    computed: {
        ...mapGetters('mtg', ['manaSymbolMap']),

        hasAdditionalInfo() {
            return (this.card.keywords && this.card.keywords.length) ||
                (this.card.produced_mana && this.card.produced_mana.length) ||
                (this.card.color_identity && this.card.color_identity.length) ||
                this.card.cmc !== undefined ||
                this.card.edhrec_rank;
        },

        hasAnyText() {
            return this.card.oracle_text ||
                this.card.flavor_text ||
                this.card.power !== undefined ||
                this.card.toughness !== undefined ||
                this.card.loyalty ||
                this.hasAdditionalInfo;
        }
    },

    methods: {
        renderManaHtml(text) {
            return manaRenderer.renderManaHtml(text, this.manaSymbolMap);
        }
    }
};
</script>

<style scoped>
.single-card-text {
    padding: 16px 0;
}

.section-title {
    color: #eaeaea;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    font-size: 1.1rem;
}

.oracle-section {
    margin-bottom: 24px;
}

.oracle-card {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
    border-radius: 12px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: 4px solid #1976d2;
}

.oracle-content {
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    white-space: pre-wrap;
}

.stats-section {
    margin-bottom: 24px;
}

.stats-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.stat-chip {
    font-weight: 600;
    padding: 0 16px;
    height: 36px;
}

.flavor-section {
    margin-bottom: 24px;
}

.flavor-card {
    background: linear-gradient(145deg, rgba(255, 165, 0, 0.05), rgba(255, 165, 0, 0.02));
    border-radius: 12px;
    padding: 20px;
    border: 1px solid rgba(255, 165, 0, 0.2);
    border-left: 4px solid #ff9800;
}

.flavor-content {
    text-align: center;
}

.flavor-quote {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
}

.flavor-text {
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
    line-height: 1.6;
    font-size: 1rem;
    text-align: center;
    flex: 1;
}

.quote-icon {
    flex-shrink: 0;
    margin-top: 2px;
}

.flavor-attribution {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    font-style: italic;
    text-align: right;
}

.additional-info-section {
    margin-bottom: 24px;
}

.info-grid {
    background: rgba(0, 188, 212, 0.02);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid rgba(0, 188, 212, 0.2);
    border-left: 4px solid #00bcd4;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    flex-wrap: wrap;
    gap: 8px;
}

.info-item:last-child {
    border-bottom: none;
}

.info-label {
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    min-width: 120px;
}

.info-value {
    color: #00bcd4;
    font-weight: 600;
}

.keywords-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
}

.keyword-chip {
    font-size: 0.75rem;
    height: 24px;
}

.mana-production,
.color-identity {
    display: flex;
    align-items: center;
    gap: 4px;
}

.no-text-state {
    text-align: center;
    padding: 40px;
    color: rgba(255, 255, 255, 0.5);
}

/* Global mana symbol styling */
:deep(.mana-symbol) {
    width: 18px;
    height: 18px;
    vertical-align: -3px;
    margin: 0 2px;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
}

/* Responsive design */
@media (max-width: 600px) {

    .oracle-card,
    .flavor-card,
    .info-grid {
        padding: 16px;
    }

    .oracle-content,
    .flavor-text {
        font-size: 0.9rem;
    }

    .info-item {
        flex-direction: column;
        align-items: flex-start;
    }

    .info-label {
        min-width: auto;
        margin-bottom: 4px;
    }

    .keywords-list {
        justify-content: flex-start;
        width: 100%;
    }

    .stats-chips {
        flex-direction: column;
    }

    .stat-chip {
        align-self: flex-start;
    }
}

/* Animation for sections */
.oracle-section,
.stats-section,
.flavor-section,
.additional-info-section {
    animation: fadeInUp 0.6s ease forwards;
    animation-delay: calc(var(--delay, 0) * 0.1s);
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>