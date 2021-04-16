<template>
  <v-layout style="height: 100%; width: 100%;">
    <recent-project-list></recent-project-list>
    <div class="welcomeScreen justify-center" style="display:flex; flex-direction: column;">
      <div>
        <v-row class="mt-12 justify-center align-center text-center" dense>
          <v-col cols="12">
            <v-img src="../assets/logo.png" width="200" contain style="margin-left: auto; margin-right: auto;"></v-img>
          </v-col>
          <v-col cols="12">
            <div class="headline text-h4 textColor">
              Dynamic Stack Decider Interface
            </div>
          </v-col>
          <v-col cols="12">
            <div class="headline text-h6 text--white textColor align-center justify-center">Version 1.0.0</div>
          </v-col>
        </v-row>
      </div>

      <v-sheet style="flex-grow: 1; width: 100%; display: flex;  justify-content: space-between;" class="welcomeScreen justify-center align-center">
        <v-card style="width: 50%;" :dark="$store.state.theme.darkMode" class="card">
          <v-card-title class="pa-2">
            Getting started
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="text-center">
            <v-btn @click="open" color="accent">
              <v-icon  class="mr-2 textColor">mdi-folder</v-icon> Open Project
            </v-btn>
          </v-card-text>
        </v-card>
      </v-sheet>
    </div>
    <open-project-dialog :dialog="showOpenProjectDialog" @close="showOpenProjectDialog = false;"></open-project-dialog>
  </v-layout>
</template>

<script>
import RecentProjectList from '../components/RecentProjectList';
import OpenProjectDialog from '@/components/dialogs/OpenProjectDialog';
import CacheController from '@/controller/CacheController';
export default {
  name: 'WelcomeView',
  components: { OpenProjectDialog, RecentProjectList },
  data: () => ({
    showOpenProjectDialog: false,
  }),
  mounted() {
    //initialize Theme
    const actualTheme =CacheController.getTheme();
    if(actualTheme){
      this.$vuetify.theme.dark = actualTheme.darkMode;
      this.$store.commit('setTheme', actualTheme);
    }else{
      this.$vuetify.theme.dark = true;
      this.$store.commit('setTheme', {darkMode: true});
      CacheController.setTheme({darkMode: true});
    }

    // this.$vuetify.theme.dark = this.dark;
    // this.$store.commit('isDark', this.dark);

    const actualProjectId = CacheController.getActualProjectId();
    const actualProject = CacheController.getLocalProjectConfiguration(actualProjectId);
    if(actualProject){
      this.$store.commit('loadProject', {projectConfigurationLocal: actualProject})
    }
  },
  methods: {
    open(){
      this.showOpenProjectDialog = true;
    }
  }
};
</script>

<style scoped>
.welcomeScreen{
  background-color: var(--v-darkPrimary-base);
  width: 100%;
  height: 100%;
}
.textColor{
  color: var(--v-text-base);
}
.card{
  background-color: var(--v-primary-base) !important;
}
</style>