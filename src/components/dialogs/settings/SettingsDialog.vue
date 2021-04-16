<template>
<parent-dialog :title="'Settings'" :dialog="dialog" @close="$emit('close')" :dimension="{height: 800, width: 900}">
    <v-card style="width: 100%;" flat>
        <v-tabs vertical color="accent" light v-model="selected">
          <v-tab class="justify-start" style="background-color: var(--v-primary-base);">
            <v-icon left>
              mdi-account
            </v-icon>
            Project
          </v-tab>
          <v-tab class="justify-start" style="background-color: var(--v-primary-base);">
            <v-icon left>
              mdi-lock
            </v-icon>
            Theme
          </v-tab>
          <v-tabs-items style="background-color: var(--v-primary-base);" v-model="selected">
            <v-tab-item style="height: 100%; background-color: var(-v--primary-base);">
              <project-settings :project-controller-ref="projectControllerRef"  @save="$emit('save')" @close="$emit('close')" @reload="$emit('reload')"></project-settings>
            </v-tab-item>
            <v-tab-item style="height: 100%; background-color: var(-v--primary-base);" >
              <theme-settings></theme-settings>
            </v-tab-item>
          </v-tabs-items>
        </v-tabs>

    </v-card>
</parent-dialog>
</template>

<script>
import ProjectSettings from './ProjectSettings';
import ParentDialog from '@/components/dialogs/ParentDialog';
import ThemeSettings from '@/components/dialogs/settings/ThemeSettings';
export default {
  name: 'SettingsDialog',
  components: { ThemeSettings, ParentDialog, ProjectSettings },
  props: {
    dialog: Boolean,
    projectControllerRef: Object,
  },
  computed: {
    blackBoardType(){
      if(this.blackBoardSwitch){
        return this.blackBoardTypes[0];
      }
      return this.blackBoardTypes[1];
    },
  },
  data: () => ({
    selected: 0,
  }),
};
</script>

<style scoped>
</style>