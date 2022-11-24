<template>
  <div style="display: flex; width: 100%; background-color: var(--v-primary-base)">
    <v-sheet
      style="background-color: var(--v-primary-base); display: flex"
      class="pa-4 pr-2 borderBottom borderRight"
      :width="projectViewSize"
    >
      <v-spacer></v-spacer>
      <div class="v-item-group v-btn-toggle v-btn-toggle--dense primary">
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              class="notclickedBtn singleBtn v-btn--is-elevated v-btn--has-bg v-size--default actionBarButton"
              elevation="2"
              @click="save"
            >
              <v-icon> mdi-content-save </v-icon>
            </v-btn>
          </template>
          Save
        </v-tooltip>
      </div>
    </v-sheet>
    <v-sheet
      style="background-color: var(--v-primary-base)"
      class="pa-4 pl-2 flex-grow-1 borderBottom"
    >
      <div
        class="v-item-group v-btn-toggle v-btn-toggle--dense primary mr-4"
        v-if="editorRef || fileView"
      >
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              @click="undo()"
              class="notclickedBtn v-btn--is-elevated v-size--default actionBarButton"
              :disabled="!canUndo()"
              elevation="2"
            >
              <v-icon> mdi-redo mdi-flip-h </v-icon>
            </v-btn>
          </template>
          Undo
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              @click="redo()"
              class="notclickedBtn v-btn--is-elevated v-size--default actionBarButton"
              :disabled="!canRedo()"
              elevation="2"
            >
              <v-icon> mdi-redo </v-icon>
            </v-btn>
          </template>
          Redo
        </v-tooltip>
      </div>

      <div
        class="v-item-group v-btn-toggle v-btn-toggle--dense primary mr-4"
        v-if="editorRef && !fileView"
      >
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              @click="zoomIn"
              class="notclickedBtn v-size--default actionBarButton"
              elevation="2"
            >
              <v-icon> mdi-magnify-plus </v-icon>
            </v-btn>
          </template>
          Zoom in
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="zoomOut" class="notclickedBtn actionBarButton" elevation="2">
              <v-icon> mdi-magnify-minus </v-icon>
            </v-btn>
          </template>
          Zoom out
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              @click="toggleDrag"
              class="v-btn--is-elevated v-size--default actionBarButton"
              v-bind:class="editorRef.getDragMode() ? 'clickedBtn' : 'notclickedBtn'"
              elevation="2"
            >
              <v-icon> mdi-mouse </v-icon>
            </v-btn>
          </template>
          {{ isDragging ? "Disable Drag" : "Enable Drag" }}
        </v-tooltip>
      </div>
      <div
        class="v-item-group v-btn-toggle v-btn-toggle--dense primary"
        v-if="editorRef && !fileView"
      >
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              class="notclickedBtn singleBtn v-btn--is-elevated v-btn--has-bg v-size--default actionBarButton"
              elevation="2"
              @click="restructure()"
            >
              <v-icon> mdi-backup-restore </v-icon>
            </v-btn>
          </template>
          Restructure
        </v-tooltip>
      </div>
      <div
        class="v-item-group v-btn-toggle v-btn-toggle--dense primary ml-4"
        v-if="editorRef && !fileView"
      >
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              class="notclickedBtn singleBtn v-btn--is-elevated v-btn--has-bg v-size--default actionBarButton"
              elevation="2"
              @click="reloadFromFile()"
            >
              <v-icon> mdi-upload </v-icon>
            </v-btn>
          </template>
          Reload from .dsd-File
        </v-tooltip>
      </div>
      <v-btn-toggle> </v-btn-toggle>
    </v-sheet>
    <settings-dialog
      :dialog="showSettingsDialog"
      @close="showSettingsDialog = false"
      @save="save"
      :project-controller-ref="projectControllerRef"
      @reload="saveAndReloadProject"
    ></settings-dialog>
    <open-project-dialog
      :dialog="showOpenProjectDialog"
      @close="showOpenProjectDialog = false"
    ></open-project-dialog>
  </div>
</template>

<script>
import SettingsDialog from "@/components/dialogs/settings/SettingsDialog";
import OpenProjectDialog from "@/components/dialogs/OpenProjectDialog";

export default {
  name: "ActionBar",
  components: { OpenProjectDialog, SettingsDialog },
  props: {
    projectViewSize: Number,
    editorRef: Object,
    codeMirrorRef: Object,
    fileView: Boolean,
    projectControllerRef: Object,
  },
  mounted() {
    this.$eventHub.$on("CLOSE_PROJECT", () => this.closeProject());
    this.$eventHub.$on("OPEN_SETTINGS", () => this.openSettingsDialog());
    this.$eventHub.$on("SAVE_ALL", () => this.save());
    this.$eventHub.$on("OPEN_PROJECT", () => {
      this.showOpenProjectDialog = true;
    });
    this.$eventHub.$on("REDO", () => this.redo());
    this.$eventHub.$on("UNDO", () => this.undo());
    this.$eventHub.$on("COPY", () => this.copy());
    this.$eventHub.$on("CUT", () => this.cut());
    this.$eventHub.$on("PASTE", () => this.paste());
    this.$eventHub.$on("DELETE", () => this.delet());
    this.$eventHub.$on("ZOOM_IN", () => this.zoomIn());
    this.$eventHub.$on("ZOOM_OUT", () => this.zoomOut());
    this.$eventHub.$on("TOGGLE_DRAG", () => this.toggleDrag());
    this.$eventHub.$on("RESTRUCTURE", () => this.restructure());
    this.$eventHub.$on("RELOAD_FROM_FILE", () => this.reloadFromFile());
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.code === "KeyS") {
        self.save();
      } else if (e.ctrlKey && e.code === "KeyZ" && !e.shiftKey) {
        self.redo();
      } else if (e.ctrlKey && e.code === "KeyZ" && e.shiftKey) {
        self.undo();
      } else if (e.ctrlKey && e.code === "KeyD") {
        self.restructure();
      }
    });
  },
  methods: {
    toggleDrag() {
      this.isDragging = !this.isDragging;
      this.editorRef.setDragMode(this.isDragging);
    },
    save() {
      this.$emit("save");
    },
    saveAndReloadProject() {
      this.save();
      this.reload();
    },
    reload() {
      location.reload();
    },
    canRedo() {
      if (this.fileView) {
        return this.codeMirrorRef.getDoc().historySize().redo > 0;
      } else if (this.editorRef) {
        return this.editorRef.canRedo();
      }
    },
    redo() {
      if (this.fileView) {
        this.codeMirrorRef.getDoc().redo();
      } else {
        this.editorRef.redo();
      }
    },
    canUndo() {
      if (this.fileView) {
        return this.codeMirrorRef.getDoc().historySize().undo > 0;
      } else if (this.editorRef) {
        return this.editorRef.canUndo();
      }
    },
    undo() {
      if (this.fileView) {
        this.codeMirrorRef.getDoc().undo();
      } else {
        this.editorRef.undo();
      }
    },
    copy() {
      this.editorRef.copy();
    },
    paste() {
      this.editorRef.paste();
    },
    cut() {
      this.editorRef.cut();
    },
    delet() {
      this.editorRef.remove();
    },
    zoomIn() {
      this.editorRef.scaleIn();
    },
    zoomOut() {
      this.editorRef.scaleOut();
    },
    openSettingsDialog() {
      this.showSettingsDialog = true;
    },
    restructure() {
      this.editorRef.restructure();
    },
    reloadFromFile() {
      this.editorRef.reloadFromFile();
    },
    closeProject() {
      this.$store.commit("closeProject");
    },
  },
  // watch:{
  //   editorRef: {
  //     handler(){
  //       // if(this.editorRef){
  //       //   this.isDragging = this.editorRef.getDragMode();
  //       // }
  //     },
  //     deep: true,
  //   }
  // },
  data: () => ({
    showSettingsDialog: false,
    showOpenProjectDialog: false,
    showPropertiesDialog: false,
    konvaEditor: undefined,
    isDragging: false,
  }),
};
</script>

<style scoped>
.actionBarButton {
  border-style: none !important;
}
.borderRight {
  border-right-width: 2px;
}
.clickedBtn {
  background-color: var(--v-accent-base) !important;
}
.notclickedBtn {
  background-color: var(--v-primary-lighten1) !important;
}
.borderBottom {
  border-width: 0px;
  border-bottom-width: 2px;
  border-style: solid;
  border-color: rgb(170, 170, 170);
}
.singleBtn {
  border-top-right-radius: inherit !important;
  border-bottom-right-radius: inherit !important;
}
</style>
