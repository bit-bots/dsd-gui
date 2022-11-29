<template>
  <v-card
    light
    style="width: 100%; height: 100%; background-color: var(--v-primary-base)"
    flat
    :dark="$store.state.theme.darkMode"
  >
    <v-card-text style="color: var(--v-primaryText-base)">
      <div class="text-start">Directory:</div>
      <v-text-field
        v-model="projectDirectory"
        label="Directory"
        disabled
        background-color="primaryLighten1"
        filled
        solo
        dense
        hide-details
        class="mb-2"
      >
      </v-text-field>
      <div class="text-start">Name:</div>
      <v-text-field
        v-model="projectName"
        label="Name"
        disabled
        background-color="primaryLighten1"
        filled
        solo
        dense
        hide-details
        class="mb-2"
      >
      </v-text-field>
      <div class="text-start">Dsd File:</div>
      <v-select
        v-model="selectedDsd"
        :items="possibleDsds"
        label="Dsd File"
        background-color="primaryLighten1"
        filled
        solo
        dense
        hide-details
        class="mb-2"
      >
        <template v-slot:item="{ item }">
          {{ item.name }}
        </template>
        <template v-slot:selection="{ item }">
          {{ item.name }}
        </template>
      </v-select>
      <div class="text-start mt-2">Behavior File:</div>
      <v-select
        v-model="selectedBehaviorModule"
        :items="possibleBehaviorModules"
        label="Behavior File"
        background-color="primaryLighten1"
        filled
        solo
        dense
        hide-details
        class="mb-2"
      >
        <template v-slot:item="{ item }">
          {{ item.name }}
        </template>
        <template v-slot:selection="{ item }">
          {{ item.name }}
        </template>
      </v-select>
      <v-divider class="mt-4 mb-4"></v-divider>
      <v-expansion-panels v-model="panel">
        <v-expansion-panel style="color: var(--v-primaryText-base)">
          <v-expansion-panel-header class="text-start">
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-icon color="primaryText" class="mr-2" v-on="on" style="flex: unset">
                  mdi-information-outline
                </v-icon>
              </template>
              Implement a folder or directory into the project tree.
            </v-tooltip>
            Blackboard
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-switch
              class="mb-2 mt-0"
              hide-details
              color="accent"
              v-model="blackBoardSwitch"
              :label="`Type: ${blackBoardType}`"
            >
            </v-switch>
            <div class="text-start">
              {{ `Blackboard ${blackBoardType === "File" ? "File" : "Directory"} Name:` }}
            </div>
            <v-text-field
              v-model="blackBoardPath"
              label="Blackboard"
              background-color="primaryLighten1"
              filled
              solo
              dense
              hide-details
              class="mb-2"
            >
              <template v-slot:append>
                <v-btn style="margin-right: -13px">
                  <v-icon color="primaryText" @click="openBlackBoardDialog"> mdi-folder </v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-divider class="mt-4"></v-divider>
      <v-row dense class="mt-2">
        <v-col>
          <v-layout align-center>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                <v-icon color="primaryText" class="mr-2 mt-1" v-on="on" style="flex: unset">
                  mdi-information-outline
                </v-icon>
              </template>
              Removing all configurations. Ends in removing all positions and unused elements from
              all graphs.
            </v-tooltip>
            <v-btn color="accent" class="mt-2" @click="removeAllLocalConfigurations"
              >Remove All Configurations</v-btn
            >
          </v-layout>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions v-bind:style="{ color: $vuetify.theme.themes.light.primaryText }">
      <v-spacer></v-spacer>
      <v-btn outlined color="accent" @click="$emit('close')"> Close </v-btn>
      <v-btn
        color="accent"
        class="mr-2"
        :disabled="
          projectDirectory === '' ||
          selectedDsd === undefined ||
          selectedBehaviorModule === undefined
        "
        @click="save"
      >
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import CacheController from "@/controller/CacheController";
import File from "@/entities/File";
import FileController from "@/controller/FileController";
const { remote } = require("electron");
export default {
  name: "ProjectSettings",
  props: {
    projectControllerRef: Object,
  },
  data: () => ({
    blackBoardSwitch: 0,
    panel: -1,
    projectDirectory: "",
    projectName: "",
    localImport: false,
    dsdName: "",
    behaviorName: "",
    selectedDsd: undefined,
    possibleDsds: [],
    selectedBehaviorModule: undefined,
    possibleBehaviorModules: [],
    blackBoardPath: "",
    blackBoardTypes: ["File", "Directory"],
  }),
  mounted() {
    this.projectDirectory = this.projectConfigurationLocal.path;
    this.projectName = File.getFileName(this.projectDirectory);
    const directory = FileController.loadDirectory(this.projectDirectory);
    this.possibleBehaviorModules = directory.filter(
      (o) => !o.isDirectory && o.name.split(".")[o.name.split(".").length - 1] === "py"
    );
    this.selectedBehaviorModule = this.possibleBehaviorModules.filter(
      (o) => o.name === this.projectConfiguration.behaviorModuleName
    )[0];
    this.possibleDsds = directory.filter(
      (o) => !o.isDirectory && o.name.split(".")[o.name.split(".").length - 1] === "dsd"
    );
    this.selectedDsd = this.possibleDsds.filter(
      (o) => o.name === this.projectConfiguration.dsdFileName
    )[0];
  },
  computed: {
    blackBoardType() {
      if (this.blackBoardSwitch) {
        return this.blackBoardTypes[0];
      }
      return this.blackBoardTypes[1];
    },
    projectConfiguration() {
      return this.$store.state.projectConfiguration;
    },
    projectConfigurationLocal() {
      return this.$store.state.projectConfigurationLocal;
    },
  },
  methods: {
    openBlackBoardDialog() {
      this.error = false;
      const WIN = remote.getCurrentWindow();
      const directoryOptions = {
        properties: ["openDirectory"],
      };
      const fileOptions = {
        properties: ["openFile"],
      };
      const callback = remote.dialog.showOpenDialog(
        WIN,
        this.blackBoardType === "File" ? fileOptions : directoryOptions
      );
      callback.then((response) => {
        if (!response.canceled) {
          this.blackBoardPath = response.filePaths[0];
        }
      });
    },
    removeAllLocalConfigurations() {
      this.$store.commit("resetGraphConfig");
      //this.$emit('save');
      this.projectControllerRef.saveConfigFile();
      this.$store.commit("closeProject");
    },
    save() {
      const temporaryConfig = JSON.parse(JSON.stringify(this.projectConfiguration));
      temporaryConfig.dsdFileName = this.selectedDsd.name;
      temporaryConfig.behaviorModuleName = this.selectedBehaviorModule.name;
      const temporarayLocalConfig = JSON.parse(JSON.stringify(this.projectConfigurationLocal));
      temporarayLocalConfig.blackboardType = this.blackBoardType;
      temporarayLocalConfig.blackboardPath = this.blackBoardPath;
      CacheController.addLocalProjectConfiguration(temporarayLocalConfig);
      this.$store.commit("updateProjectConfig", {
        projectConfigurationLocal: temporarayLocalConfig,
        projectConfiguration: temporaryConfig,
      });
      this.$emit("reload");
      this.$emit("close");
    },
  },
};
</script>

<style scoped></style>
