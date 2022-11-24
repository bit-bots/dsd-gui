<template>
  <div class="centerSage" style="width: 100%; height: 100%">
    <tab-bar :projectControllerRef="projectControllerRef"></tab-bar>
    <v-main class="flex-grow-1" style="background-color: var(--v-darkPrimary-base)">
      <v-snackbar></v-snackbar>
      <!--<editor @ref="setRef" v-bind:class="showVirtuellRoom ? 'visible' : 'hidden'"></editor>-->
      <editor-instances
        @error="showError"
        :project-controller-ref="projectControllerRef"
        :show-virtuell-room="showVirtuellRoom"
        @ref="setRef"
        v-bind:class="showVirtuellRoom ? 'visible' : 'hidden'"
        ref="instances"
      ></editor-instances>
      <file-view
        @ref="$emit('codeMirrorRef', $event)"
        :project-controller-ref="projectControllerRef"
        v-bind:class="showFileView ? 'visible' : 'hidden'"
        style="position: absolute"
        ref="files"
      ></file-view>
    </v-main>
    <v-system-bar style="background-color: var(--v-primary-base); z-index: 5; overflow: hidden">
      <div class="v-item-group v-btn-toggle v-btn-toggle--dense primary mr-4" v-if="showSwitchBar">
        <v-btn
          x-small
          class="v-btn--is-elevated v-btn--has-bg v-size--default"
          @click="mode = 'GRAPH'"
          v-bind:class="mode === 'GRAPH' ? 'clickedBtn' : 'notclickedBtn'"
        >
          Graph
        </v-btn>
        <v-btn
          x-small
          class="v-btn--is-elevated v-btn--has-bg v-size--default"
          @click="mode = 'CODE'"
          v-bind:class="mode === 'CODE' ? 'clickedBtn' : 'notclickedBtn'"
        >
          Code
        </v-btn>
      </div>
    </v-system-bar>
    <v-snackbar
      style="margin-bottom: 28px"
      right
      v-model="snackbar.value"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
    >
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn icon v-bind="attrs" @click="snackbar.value = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import TabBar from "@/components/TabBar";
import FileView from "@/components/FileView";
import { ELEMENT_TYPE } from "@/enumerates/ElementType";
import { TREE_TYPE } from "@/enumerates/TreeType";
import EditorInstances from "@/components/EditorInstances";

export default {
  name: "CenterStage",
  components: { EditorInstances, FileView, TabBar },
  props: {
    projectControllerRef: Object,
  },
  data: () => ({
    mode: "GRAPH",
    editorRef: undefined,
    selectedTab: undefined,
    snackbar: {
      value: false,
      timeout: 2000,
      text: "Successfully saved",
      color: "success",
    },
  }),
  methods: {
    showError(error) {
      this.snackbar.color = "error";
      this.snackbar.text = error;
      this.snackbar.value = true;
    },
    setRef(ref) {
      this.editorRef = ref;
      this.$emit("ref", ref);
    },
    save() {
      const dsdFile = this.$refs.files.save(); // first save all Files
      const complete = this.$refs.instances.save(dsdFile); // then load saved files and override the class comment
      this.$refs.files.reload();
      if (complete.value) {
        this.snackbar.text = "Successfully saved";
        this.snackbar.color = "success";
      } else {
        this.snackbar.text = complete.messages.join("\n");
        this.snackbar.color = "error";
      }

      this.snackbar.value = true;
    },
  },
  watch: {
    "projectControllerRef.selectedTab": {
      handler() {
        this.selectedTab = this.projectControllerRef.selectedTab;
      },
      deep: true,
    },
    showFileView: {
      handler() {
        this.$emit("showFileView", this.showFileView);
      },
      deep: true,
    },
  },
  computed: {
    showSwitchBar() {
      //check if selected Tab includes the .dsd File
      if (!this.selectedTab) {
        return false;
      }
      const item = this.selectedTab.item;
      if (item.type === TREE_TYPE.FILE && item.object.type === "dsd") {
        return true;
      }
      return false;
    },
    showVirtuellRoom() {
      if (!this.selectedTab) {
        return false;
      }
      // Show Virtuell room if dsd Is selected and Graph mode active or subtree selected
      return (
        (this.showSwitchBar && this.mode === "GRAPH") ||
        this.selectedTab.item.object.type === ELEMENT_TYPE.SUBTREE
      );
    },
    showFileView() {
      if (!this.selectedTab) {
        return false;
      }
      // show if code mode is selected or any file excluding subtree Files
      return (
        (this.showSwitchBar && this.mode === "CODE") ||
        (!this.showSwitchBar && this.selectedTab.item.object.type !== ELEMENT_TYPE.SUBTREE)
      );
    },
  },
};
</script>

<style scoped>
.centerSage {
  position: absolute;
  display: flex;
  flex-direction: column;
  right: 0;
}
.visibile {
  z-index: 2;
  position: absolute;
}
.hidden {
  z-index: -1;
  position: absolute;
}
.clickedBtn {
  background-color: var(--v-accent-base) !important;
}
.notclickedBtn {
  background-color: var(--v-darkPrimary-base) !important;
}
</style>
