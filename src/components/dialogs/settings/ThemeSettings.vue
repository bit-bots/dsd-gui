<template>
  <v-card
    light
    style="width: 100%; min-height: 400px; background-color: var(--v-primary-base)"
    flat
  >
    <v-radio-group v-model="dark" row :dark="dark" class="ml-2">
      <template v-slot:label> </template>
      <v-radio :value="true" color="accent">
        <template v-slot:label>
          <div>
            <v-card>
              <v-card-title class="pb-0">Dark Theme</v-card-title>
              <v-card-text class="pt-0">
                <v-img width="250" contain src="../../../assets/darkTheme.png"></v-img>
              </v-card-text>
            </v-card>
          </div>
        </template>
      </v-radio>
      <v-radio :value="false" color="accent">
        <template v-slot:label>
          <v-card>
            <v-card-title class="pb-0">Light Theme</v-card-title>
            <v-card-text>
              <v-img width="250" contain src="../../../assets/lightTheme.png"></v-img>
            </v-card-text>
          </v-card>
        </template>
      </v-radio>
    </v-radio-group>
  </v-card>
</template>

<script>
import CacheController from "@/controller/CacheController";

export default {
  name: "ThemeSettings",
  data: () => ({
    dark: false,
  }),
  mounted() {
    this.dark = this.$vuetify.theme.dark;
  },
  watch: {
    dark: {
      handler() {
        this.$vuetify.theme.dark = this.dark;
        this.$store.commit("setTheme", {
          darkMode: this.dark,
        });
        CacheController.setTheme({
          darkMode: this.dark,
        });
      },
    },
  },
};
</script>

<style>
.mdi-radiobox-marked {
  color: var(--v-accent-base) !important;
}
</style>
