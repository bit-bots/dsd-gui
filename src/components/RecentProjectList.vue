<template>
  <v-navigation-drawer
    permanent
    color="primary"
    class="navDrawer"
    :dark="$store.state.theme.darkMode"
  >
    <v-layout style="display: flex" class="flex-column">
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title"> Open </v-list-item-title>
          <v-list-item-subtitle> Recent Projects </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-divider></v-divider>
      <v-list-item-group :active-class="'active'">
        <template v-for="(project, index) in recentProjects">
          <v-hover v-slot="{ hover }" :key="index">
            <v-list-item two-line v-bind:class="hover ? 'on-select' : ''" dense>
              <v-list-item-content @click="openProject(project)">
                <v-list-item-title>
                  {{ getFileName(project.path) }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ project.path }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn icon @click="removeProject(project)">
                  <v-icon color="primaryText"> mdi-close </v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-hover>
        </template>
      </v-list-item-group>
    </v-layout>
  </v-navigation-drawer>
</template>

<script>
import CacheController from "@/controller/CacheController";
import File from "@/entities/File";
import ProjectController from "@/controller/ProjectController";

export default {
  name: "RecentProjectList",
  data: () => ({
    recentProjects: [],
  }),
  mounted() {
    this.loadRecentProjects();
  },
  methods: {
    openProject(project) {
      this.$store.commit("loadProject", { projectConfigurationLocal: project });
    },
    getFileName(path) {
      return File.getFileName(path);
    },
    removeProject(project) {
      CacheController.removeFromRecentProjects(project.id);
      this.loadRecentProjects();
    },
    /**
     * Loading all Recent Projects and check if they are initialized
     */
    loadRecentProjects() {
      this.recentProjects = [];
      const recentProjectsCacheIds = CacheController.getRecentProjectIds();
      for (let i = 0; i < recentProjectsCacheIds.length; i++) {
        const recentProject = CacheController.getLocalProjectConfiguration(
          recentProjectsCacheIds[i]
        );
        if (ProjectController.isInitialized(recentProject.path)) {
          this.recentProjects.push(recentProject);
        } else {
          CacheController.removeFromRecentProjects(recentProject.id);
        }
      }
    },
  },
};
</script>

<style scoped>
.navDrawer {
  width: 30% !important;
}
.on-select {
  background-color: var(--v-accent-base);
}
.active {
  color: white !important;
}
</style>
