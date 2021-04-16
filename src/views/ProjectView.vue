<template>
  <v-layout style="height: 100%; width: 100%; display: flex; flex-direction: column;">
    <actionbar :projectViewSize="projectViewSize" :editor-ref="editorRef" :file-view="showFileView" :code-mirror-ref="codeMirrorRef" :project-controller-ref="projectControllerRef" @save="save"></actionbar>
    <rs-panes split-to="columns" :allow-resize="true" :min-size="32" :size="projectViewSize" v-on:update:size="projectViewSize = $event">
      <div slot="firstPane" class="pane" style="height: 100%;">
        <project-tree :projectControllerRef="projectControllerRef"></project-tree>
      </div>
      <div slot="secondPane" class="pane" style="min-width: 50%;">
        <center-stage @ref="setEditorRef" @codeMirrorRef="setCodeMirrorRef" @showFileView="showFileView = $event" :projectControllerRef="projectControllerRef" ref="centerStage"></center-stage>
      </div>
    </rs-panes>
  </v-layout>
</template>

<script>
import ResSplitPane from 'vue-resize-split-pane'
import CenterStage from '@/components/CenterStage';
import Actionbar from '@/components/Actionbar';
import ProjectTree from '@/components/ProjectTree';
import ProjectController from '@/controller/ProjectController';
export default {
  name: 'ProjectView',
  components: { ProjectTree, Actionbar, CenterStage, 'rs-panes': ResSplitPane },
  data: () => ({
    projectViewSize: 350,
    editorRef: undefined,
    codeMirrorRef: undefined,
    showFileView: false,
    projectControllerRef: undefined,
  }),
  methods: {
    setEditorRef(ref){
      this.editorRef = ref;
    },
    setCodeMirrorRef(ref){
      this.codeMirrorRef = ref;
    },
    save(){
      this.$refs.centerStage.save();
    }
  },
  mounted() {
    this.projectControllerRef = new ProjectController();
  }
};
</script>

<style scoped>
.textColor{
  color: var(--v-text-base);
}
</style>