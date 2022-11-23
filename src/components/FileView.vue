<template>
  <div
    ref="editorContainer"
    style="width: 100%; height: 100%; background-color: var(--v-darkPrimary-base)"
  ></div>
</template>

<script>
// Introduce global instance
import CodeMirror from "codemirror";
// Core style
import "codemirror/lib/codemirror.css";
import "codemirror/mode/python/python";
import "codemirror/addon/search/search";
import "codemirror/addon/search/searchcursor";
import "codemirror/addon/search/jump-to-line";
import "codemirror/addon/dialog/dialog";
import "codemirror/addon/dialog/dialog.css";
import "codemirror/addon/scroll/simplescrollbars.css";
import "codemirror/addon/scroll/simplescrollbars";
import "@/assets/customCodeMirrorStyle.scss";
import { TREE_TYPE } from "../enumerates/TreeType";
import FileController from "@/controller/FileController";
export default {
  name: "FileView",
  props: {
    projectControllerRef: Object,
  },
  data: () => ({
    editor: undefined,
    selectedFile: undefined,
    originalText: "",
    opendFiles: [],
    options: {
      lineNumbers: true,
      mode: "text/python",
    },
  }),
  mounted() {
    this.editor = CodeMirror(this.$refs.editorContainer, this.options);
    CodeMirror.defineExtension("centerOnLine", function (line) {
      const h = this.getScrollInfo().clientHeight;
      const coords = this.charCoords({ line: line, ch: 0 }, "local");
      this.scrollTo(null, (coords.top + coords.bottom - h) / 2);
    });
    this.$emit("ref", this.editor);
    this.editor.on("change", (e) => {
      this.checkChanges();
    });
  },
  methods: {
    save() {
      let dsdFile;
      for (let i = 0; i < this.opendFiles.length; i++) {
        if (!this.opendFiles[i].saved) {
          if (this.opendFiles[i].item.name === this.$store.state.projectConfiguration.dsdFileName) {
            console.log("dsd file changed");
            dsdFile = FileController.loadFile(this.opendFiles[i].item.object.path);
          }

          FileController.updateFile(
            this.opendFiles[i].item.object.path,
            this.opendFiles[i].document.getValue()
          );
          const tabIndex = [...this.projectControllerRef.tabs]
            .map((o) => o.key)
            .indexOf(this.opendFiles[i].key);
          if (tabIndex >= 0) {
            this.projectControllerRef.tabs[tabIndex].updateSaveStatus(true);
            this.opendFiles[i].saved = true;
            if (this.selectedFile && this.opendFiles[i].key === this.selectedFile.key) {
              this.selectedFile.saved = true;
              this.originalText = this.opendFiles[i].document.getValue();
            }
          }
        }
      }
      this.clearUnassasaryFiles();
      return dsdFile;
    },
    reload() {
      for (let i = 0; i < this.opendFiles.length; i++) {
        if (this.selectedFile && this.opendFiles[i].key === this.selectedFile.key) {
          const text = FileController.loadFile(this.selectedFile.item.object.path);
          this.editor.getDoc().setValue(text);
          this.originalText = text;
        } else {
          this.opendFiles[i].document.setValue(
            FileController.loadFile(this.opendFiles[i].item.object.path)
          );
        }
      }
    },
    checkChanges() {
      if (this.selectedFile) {
        const isSaved = this.editor.getDoc().getValue() === this.originalText;
        this.projectControllerRef.selectedTab.updateSaveStatus(isSaved);
        this.selectedFile.saved = isSaved;
      }
    },
    clearUnassasaryFiles() {
      const tabIds = [...this.projectControllerRef.tabs].map((o) => o.key);
      for (let i = 0; i < this.opendFiles.length; i++) {
        const id = this.opendFiles[i].key;
        if (!tabIds.includes(id) && this.opendFiles[i].saved) {
          this.opendFiles.splice(i, 1);
        }
      }
    },
    temporarySaveFile() {
      if (this.selectedFile) {
        const indexOfTab = [...this.opendFiles].map((o) => o.key).indexOf(this.selectedFile.key);
        if (indexOfTab < 0) {
          this.opendFiles[indexOfTab] = this.selectedFile;
        }
      }
    },
  },
  computed: {
    theme() {
      return this.$store.state.theme;
    },
  },
  watch: {
    theme: function () {
      if (this.$store.state.theme.darkMode) {
        this.editor.setOption("theme", "dracula");
      } else {
        this.editor.setOption("theme", "defalut");
      }
    },
    "projectControllerRef.selectedTab": function () {
      const selectedTab = this.projectControllerRef.selectedTab;
      if (!selectedTab || selectedTab.item.type !== TREE_TYPE.FILE) {
        return;
      }
      let indexOfTab = [...this.opendFiles].map((o) => o.key).indexOf(selectedTab.key);
      this.temporarySaveFile();
      //create New Intance if not exist
      if (indexOfTab < 0) {
        // Not existing
        const code = FileController.loadFile(selectedTab.item.object.path);
        const document = CodeMirror.Doc(code, "python");
        const fileInstance = Object.assign({}, this.projectControllerRef.selectedTab);
        fileInstance.document = document;
        this.opendFiles.push(fileInstance);
        indexOfTab = this.opendFiles.length - 1;
      }
      //Set Foxus on selected Instance
      if (!this.selectedFile || this.opendFiles[indexOfTab].key !== this.selectedFile.key) {
        const documentToSwap = this.opendFiles[indexOfTab].document;
        const oldDoc = this.editor.swapDoc(documentToSwap);
        if (this.selectedFile !== undefined) {
          const oldIndex = this.opendFiles
            .map((o) => {
              return o.key;
            })
            .indexOf(this.selectedFile.key);
          this.opendFiles[oldIndex].document = oldDoc;
        }
        this.originalText = FileController.loadFile(this.opendFiles[indexOfTab].item.object.path);
        this.selectedFile = this.opendFiles[indexOfTab];
      }
      this.checkChanges();
      this.clearUnassasaryFiles();
      if (this.$store.state.theme.darkMode) {
        this.editor.setOption("theme", "dracula");
      } else {
        this.editor.setOption("theme", "defalut");
      }
    },
    "projectControllerRef.tabs": function () {
      this.temporarySaveFile();
      this.clearUnassasaryFiles();
    },
  },
};
</script>

<style>
.vue-codemirror {
  flex-grow: 1;
  height: 100%;
}
.CodeMirror {
  height: 100%;
  text-align: left !important;
}
</style>
