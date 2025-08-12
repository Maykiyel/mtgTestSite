import Vue from "vue";
import Vuex from "vuex";
import mtg from "./modules/mtg";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    mtg,
  },
});
