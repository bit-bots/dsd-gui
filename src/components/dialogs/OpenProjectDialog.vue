<template>
  <parent-dialog :title="'Import Project'" :dialog="importDialog" @close="resetDialog">
    <v-card style="width: 100%; border-radius: 0px;" v-if="!error" :dark="$store.state.theme.darkMode" >
      <v-card-text style=" color: var(--v-primaryText-base);">
        <div v-if="localImport">
          <v-alert :outlined="!$store.state.theme.darkMode" :dark="$store.state.theme.darkMode">
            You open this project the first time. You are able to add a blackbord. If not just continue
          </v-alert>
        </div>
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
            :label="dsdName"
            :disabled="localImport"
            background-color="primaryLighten1"
            filled
            solo
            dense
            hide-details
            class="mb-2"
        >
          <template v-slot:item="{item, on}">
            <v-list-item v-on="on">
              <v-list-item-content>
                <v-list-item-title>
                  <span style="color: var(--v-primaryText-base);">{{item.name}}</span>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
          <template v-slot:selection="{item}">
            <span style="color: var(--v-primaryText-base);">{{item.name}}</span>
          </template>
        </v-select>
        <div class="text-start mt-2">Behavior File:</div>
        <v-select
            v-model="selectedBehaviorModule"
            :items="possibleBehaviorModules"
            :label="behaviorName"
            :disabled="localImport"
            background-color="primaryLighten1"
            filled
            solo
            dense
            hide-details
            class="mb-2"
        >
          <template v-slot:item="{item, on}">
            <v-list-item v-on="on">
              <v-list-item-content>
                <v-list-item-title>
                  <span style="color: var(--v-primaryText-base);">{{item.name}}</span>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
          <template v-slot:selection="{item}">
                  <span style="color: var(--v-primaryText-base);">{{item.name}}</span>
          </template>
        </v-select>
        <v-divider class="mt-4"></v-divider>
        <v-expansion-panels
            v-model="panel"
            :dark="$store.state.theme.darkMode"
        >
          <v-expansion-panel>
            <v-expansion-panel-header class="text-start">
              <v-tooltip bottom>
                <template v-slot:activator="{on}">
                  <v-icon color="primaryText" class="mr-2" v-on="on" style="flex: unset;">
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
                  color="accent"
                  hide-details
                  v-model="blackBoardSwitch"
                  :label="`Type: ${blackBoardType}`"
              >
              </v-switch>
              <div class="text-start">{{ `Blackboard ${blackBoardType === 'File' ? 'File' : 'Directory'} Name:` }}</div>
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
                  <v-btn style="margin-right: -13px;" @click="openBlackBoardDialog">
                    <v-icon color="primaryText">
                      mdi-folder
                    </v-icon>
                  </v-btn>

                </template>
              </v-text-field>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
      <v-card-actions style="background-color: var(--v-primary-base); color: var(--v-primaryText-base);">
        <v-spacer></v-spacer>
        <v-btn
            outlined
            :dark="$store.state.theme.darkMode"
            color="accent"
            @click="resetDialog"
        >
          Cancel
        </v-btn>
        <v-btn
            color="accent"
            class="mr-2"
            :disabled="!localImport&&  (projectDirectory === '' || selectedDsd === undefined || selectedBehaviorModule === undefined)"
            @click="importProject"
        >
          {{localImport ? 'Continue' : 'Import'}}
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-card style="width: 100%; border-radius: 0px;" v-if="error" :dark="$store.state.theme.darkMode">
      <v-card-title>
        No Project Found
      </v-card-title>
      <v-card-text>
        {{errorMessage}}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn class="mr-2" @click="resetDialog" color="accent">Close</v-btn>
      </v-card-actions>
    </v-card>
  </parent-dialog>
</template>

<script>
import ParentDialog from '@/components/dialogs/ParentDialog';
import ProjectController from '@/controller/ProjectController';
import FileController from '@/controller/FileController';
import ProjectConfiguration from '@/entities/ProjectConfiguration';
import ProjectConfigurationLocal from '@/entities/ProjectConfigurationLocal';
import CacheController from '@/controller/CacheController';
import UUIDv4Generator from '@/utils/UUIDv4Generator';
const { remote } = require('electron');
export default {
  name: 'OpenProjectDialog',
  components: { ParentDialog },
  props: {
    dialog: Boolean,
  },
  data: () => ({
    projectId: undefined,
    importDialog: false,
    blackBoardSwitch: 0,
    panel: -1,
    projectDirectory: '',
    projectName: '',
    localImport: false,
    dsdName: '',
    behaviorName: '',
    error: false,
    errorMessage: "",
    selectedDsd:undefined,
    possibleDsds: [],
    selectedBehaviorModule: undefined,
    possibleBehaviorModules: [],
    blackBoardPath: '',
    blackBoardTypes: ['File', 'Directory'],

  }),
  methods: {
    importProject(){
      if(!this.localImport){
        this.projectId = UUIDv4Generator.uuidv4();
        const projectConfiguration = new ProjectConfiguration(this.projectId, this.projectName, this.selectedBehaviorModule.name, this.selectedDsd.name)
        ProjectController.initializeProject(this.projectDirectory, projectConfiguration)
      }
      const projectConfigurationLocal= new ProjectConfigurationLocal(this.projectId, this.projectDirectory, this.blackBoardType, this.blackBoardPath);
      CacheController.addLocalProjectConfiguration(projectConfigurationLocal);
      this.$store.commit('loadProject', {projectConfigurationLocal})
    },
    /*
    Set the actual Project an route to the main view
    */
    loadProject(projectConfigurationLocal){
      this.$store.commit('loadProject', {projectConfigurationLocal})
    },
    openBlackBoardDialog(){
      this.error = false;
      const WIN = remote.getCurrentWindow();
      const directoryOptions = {
        properties: ['openDirectory']
      }
      const fileOptions = {
        properties: ['openFile']
      }
      const callback = remote.dialog.showOpenDialog(WIN, this.blackBoardType === 'File' ? fileOptions : directoryOptions);
      callback.then(response => {
        if(!response.canceled){
          this.blackBoardPath = response.filePaths[0];
        }
      })
    },
    openDirectoryDialog(){
        const WIN = remote.getCurrentWindow();
        const options = {
          properties: ['openDirectory'],
        }
        const callback = remote.dialog.showOpenDialog(WIN, options);
        callback.then(response => {
          if(!response.canceled) {
            this.projectDirectory = response.filePaths[0];
            this.checkProjectDirectory();
          }else{
            this.resetDialog();
          }
        })
    },
    resetDialog(){
      this.selectedBehaviorModule = undefined;
      this.selectedDsd = undefined;
      this.blackBoardPath = undefined;
      this.projectDirectory = undefined;
      this.localImport = false;
      this.importDialog = false;
      this.projectId = undefined;
      this.error = false;
      this.errorMessage = "";
      this.$emit('close')
    },
    checkProjectDirectory(){
      if(this.projectDirectory && this.projectDirectory !== ''){
        if(ProjectController.isInitialized(this.projectDirectory)){
          const projectConfiguration = ProjectController.getConfig(this.projectDirectory);
          const projectConfigurationLocal = CacheController.getLocalProjectConfiguration(projectConfiguration.id);
          if(projectConfigurationLocal){
            this.loadProject(projectConfigurationLocal);
            return;
          }
          this.projectId =projectConfiguration.id;
          this.projectName = projectConfiguration.projectName;
          this.dsdName = projectConfiguration.dsdFileName;
          this.behaviorName = projectConfiguration.behaviorModuleName;
          this.localImport = true;
          this.importDialog = true;
          return;
        }
        const canBeProject = ProjectController.canBeProject(this.projectDirectory)
        if(canBeProject.canProject){
          this.projectName = this.projectDirectory.split(this.$pathConnector)[this.projectDirectory.split(this.$pathConnector).length-1]
          const directory = FileController.loadDirectory(this.projectDirectory);
          this.possibleBehaviorModules = directory.filter(o => !o.isDirectory && o.name.split('.')[o.name.split('.').length-1] === 'py');
          this.selectedBehaviorModule =this.possibleBehaviorModules[0];
          this.possibleDsds = directory.filter(o => !o.isDirectory && o.name.split('.')[o.name.split('.').length-1] === 'dsd');
          this.selectedDsd = this.possibleDsds[0];
          this.importDialog = true;
          return;
        }else{
          this.errorMessage = canBeProject.message;
          this.error = true;
          this.importDialog = true;

        }


      }
    }
  },
  watch: {
    dialog:{
      handler(){
        if(this.dialog){
          this.importDialog = false;
          this.openDirectoryDialog();
        }
      },
      deep: true,
    },
  },
  computed: {
    blackBoardType(){
      if(this.blackBoardSwitch){
        return this.blackBoardTypes[0];
      }
      return this.blackBoardTypes[1];
    },
  },
};
</script>

<style scoped>

</style>