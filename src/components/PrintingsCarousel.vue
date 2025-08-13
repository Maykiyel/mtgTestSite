<template>
    <div class="printings-carousel">
        <h4 class="carousel-title">
            <v-icon left color="primary">mdi-cards-variant</v-icon>
            Other Printings ({{ printings.length }})
        </h4>

        <v-slide-group show-arrows class="printings-slide-group" active-class="printing-active">
            <v-slide-item v-for="printing in printings" :key="printing.id" v-slot="{ toggle }">
                <div class="printing-item" @click="selectPrinting(printing, toggle)">
                    <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                            <div v-bind="attrs" v-on="on" class="printing-card" :class="{
                                'printing-active': isActivePrinting(printing),
                                'printing-hover': !isActivePrinting(printing)
                            }">
                                <div class="printing-image-container">
                                    <v-img :src="getPrintingThumbnail(printing)" aspect-ratio="0.7"
                                        class="printing-image" cover>
                                        <template v-slot:placeholder>
                                            <div class="image-placeholder">
                                                <v-icon color="grey">mdi-cards-outline</v-icon>
                                            </div>
                                        </template>
                                    </v-img>

                                    <!-- Active indicator -->
                                    <div v-if="isActivePrinting(printing)" class="active-indicator">
                                        <v-icon color="white" small>mdi-check</v-icon>
                                    </div>
                                </div>

                                <div class="printing-info">
                                    <div class="printing-set">{{ printing.set.toUpperCase() }}</div>
                                    <div class="printing-details">
                                        #{{ printing.collector_number }}
                                    </div>
                                </div>
                            </div>
                        </template>

                        <div class="printing-tooltip">
                            <div class="tooltip-title">{{ printing.set_name }}</div>
                            <div class="tooltip-details">
                                <span>{{ printing.collector_number }}</span>
                                <span class="mx-1">•</span>
                                <span class="rarity-text" :class="`rarity-${printing.rarity}`">
                                    {{ capitalizeRarity(printing.rarity) }}
                                </span>
                            </div>
                            <div v-if="printing.released_at" class="tooltip-date">
                                Released: {{ formatDate(printing.released_at) }}
                            </div>
                        </div>
                    </v-tooltip>
                </div>
            </v-slide-item>
        </v-slide-group>
    </div>
</template>

<script>
export default {
    name: 'PrintingsCarousel',

    props: {
        printings: {
            type: Array,
            default: () => []
        },
        activePrintingId: {
            type: String,
            default: null
        }
    },

    data() {
        return {
            placeholderImage: 'https://via.placeholder.com/488x680/2a2a2a/888888?text=No+Image'
        };
    },

    methods: {
        selectPrinting(printing, toggle) {
            this.$emit('printing-selected', printing);
            toggle();
        },

        isActivePrinting(printing) {
            return this.activePrintingId === printing.id;
        },

        getPrintingThumbnail(printing) {
            if (printing.image_uris?.small) return printing.image_uris.small;
            if (printing.card_faces?.[0]?.image_uris?.small) {
                return printing.card_faces[0].image_uris.small;
            }
            return this.placeholderImage;
        },

        capitalizeRarity(rarity) {
            if (!rarity) return '';
            return rarity.charAt(0).toUpperCase() + rarity.slice(1);
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
.printings-carousel {
    margin-top: 24px;
}

.carousel-title {
    color: #eaeaea;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    font-size: 1.1rem;
}

.printings-slide-group {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.printing-item {
    margin-right: 12px;
    cursor: pointer;
}

.printing-card {
    width: 90px;
    border-radius: 8px;
    overflow: hidden;
    background: linear-gradient(145deg, #2a2a2a, #1e1e1e);
    border: 2px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
}

.printing-hover:hover {
    transform: translateY(-4px) scale(1.05);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.printing-active {
    border-color: #1976d2 !important;
    box-shadow:
        0 0 20px rgba(25, 118, 210, 0.4),
        0 4px 15px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
}

.printing-image-container {
    position: relative;
}

.printing-image {
    transition: transform 0.3s ease;
}

.printing-hover:hover .printing-image {
    transform: scale(1.1);
}

.active-indicator {
    position: absolute;
    top: 4px;
    right: 4px;
    background: #1976d2;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.printing-info {
    padding: 8px 6px;
    text-align: center;
}

.printing-set {
    font-weight: 600;
    font-size: 0.75rem;
    color: #1976d2;
    margin-bottom: 2px;
}

.printing-details {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.7);
}

.image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
}

/* Tooltip styling */
.printing-tooltip {
    text-align: center;
    padding: 8px;
}

.tooltip-title {
    font-weight: 600;
    color: #eaeaea;
    margin-bottom: 4px;
}

.tooltip-details {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    margin-bottom: 4px;
}

.tooltip-date {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
}

.rarity-text.rarity-common {
    color: #c0c0c0;
}

.rarity-text.rarity-uncommon {
    color: #c0c0c0;
}

.rarity-text.rarity-rare {
    color: #ffd700;
}

.rarity-text.rarity-mythic {
    color: #ff4500;
}

/* Custom scrollbar for slide group */
:deep(.v-slide-group__content) {
    padding: 8px 0;
}

:deep(.v-slide-group__prev),
:deep(.v-slide-group__next) {
    background: rgba(25, 118, 210, 0.1) !important;
    border: 1px solid rgba(25, 118, 210, 0.3);
}

:deep(.v-slide-group__prev .v-icon),
:deep(.v-slide-group__next .v-icon) {
    color: #1976d2 !important;
}

@media (max-width: 600px) {
    .printing-card {
        width: 70px;
    }

    .printing-item {
        margin-right: 8px;
    }

    .printing-info {
        padding: 6px 4px;
    }

    .printing-set {
        font-size: 0.7rem;
    }

    .printing-details {
        font-size: 0.65rem;
    }
}
</style>