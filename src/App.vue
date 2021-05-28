<template>
  <v-app>
    <v-main style="position: absolute; width: 100%;" v-bind:style="{height: height+ 'px'}">
      <router-view/>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import CustomTitlebar from '@/mixins/CustomTitlebar';
import ProjectConfigurationLocal from "@/entities/ProjectConfigurationLocal";
import File from "@/entities/File";
export default Vue.extend({
  name: 'App',
  mixins:[CustomTitlebar],

  data: () => ({
    height: 570,
    titleBarHeight: 30,
  }),
  mounted() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    // @ts-ignore
    self.initializeTitleBar();
    window.addEventListener('resize', () => {self.resize()})
    self.resize();
    if(this.projectConfigurationLocal){
      // @ts-ignore
      this.updateTitleBar(File.getFileName(this.projectConfigurationLocal.path));
      this.$router.push({name: 'ProjectView'});
    }else{
      this.$router.push({name: 'WelcomeView'});
      // @ts-ignore
      this.updateTitleBar('Welcome');
    }
  },
  computed: {
    projectConfigurationLocal(): ProjectConfigurationLocal{
      return this.$store.state.projectConfigurationLocal;
    }
  },
  watch:{
    projectConfigurationLocal: {
      handler(){
        if(this.projectConfigurationLocal){
          this.$router.push({name: 'ProjectView'});
          // @ts-ignore
          this.updateTitleBar(File.getFileName(this.projectConfigurationLocal.path));
        }else{
          // @ts-ignore
          this.updateTitleBar('Welcome');
          this.$router.push({name: 'WelcomeView'});
        }
      },
      deep: true,
    }
  },
  methods: {
    resize(){
      this.height = window.innerHeight - this.titleBarHeight;
    }
  }
});
</script>
<style>
@import "./assets/titlebar.css";
*:focus {
  outline: none;
}
.v-expansion-panel-header__icon .v-icon{
  color: var(--v-primaryText-base) !important;
}
.v-label{
  color: var(--v-primaryText-base) !important;
}
.v-input{
  color: var(--v-primaryText-base) !important;
}
.v-input--switch__thumb{
  color: var(--v-primaryText-base) !important;
}
.Resizer{
  z-index: 100!important;
}
::-webkit-scrollbar {
  display: none;
}
.pane-rs{
  position: relative !important;
}
body{
  overflow: hidden;
}
.v-text-field.v-text-field--solo .v-input__control {
  min-height: unset !important;
}
</style>
