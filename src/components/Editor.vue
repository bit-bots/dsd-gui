<template>
  <div ref="editorContainer" style="height: 100%; width: 100%; position: absolute">
    <div
      v-if="loading"
      style="position: absolute; display: flex; z-index: 100; width: 100%; height: 100%"
      class="text-center justify-center align-center"
    >
      <div class="lds-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
    <div
      :id="'container' + instance.key"
      class="background"
      v-bind:style="{ height: dimension.height, width: dimension.width }"
    ></div>
    <context-menu
      :project-controller-ref="projectControllerRef"
      :show="showContextMenu"
      :editor="konvaEditor"
      @close="showContextMenu = false"
      menu-mode="CANVAS"
      :position="contextMenuPosition"
      @editProperties="editProperties"
      @createSubtree="createSubstree"
      @openElement="openElement"
    ></context-menu>
    <properties-dialog
      :dialog="showPropertiesDialog"
      @close="showPropertiesDialog = false"
      :item="selectedItem"
      @save="saveProperties"
    ></properties-dialog>
  </div>
</template>

<script>
import Editor from "@/plugins/canvas/Editor";
import CreateElements from "@/plugins/canvas/CreateElements";
import { ELEMENT_TYPE } from "@/enumerates/ElementType";
import ContextMenu from "@/utils/ContextMenu";
import PropertiesDialog from "@/components/dialogs/properties/PropertiesDialog";
import Utils from "@/utils/Utils";
import FileController from "@/controller/FileController";
import DSDInitializer from "@/utils/DSDInitializer";

export default {
  name: "Editor",
  components: { PropertiesDialog, ContextMenu },
  props: {
    projectControllerRef: Object,
    scaleBy: {
      type: Number,
      default() {
        return 1.04;
      },
    },
    instance: Object,
  },
  data: () => ({
    konvaEditor: undefined,
    dimension: {
      width: 200,
      height: 200,
    },
    showContextMenu: false,
    showPropertiesDialog: false,
    contextMenuPosition: { x: 0, y: 0 },
    selectedItem: undefined,
    loading: false,
  }),
  watch: {
    dragMode: {
      handler() {
        this.konvaEditor.setDragMode(this.dragMode);
      },
    },
  },
  mounted() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.loading = true;
    window.addEventListener("resize", () => {
      self.resize();
    });
    document.addEventListener("contextmenu", function (evt) {
      if (evt.target && evt.target.id === "canvas") {
        return;
      }
      self.showContextMenu = false;
    });
    setTimeout(() => {
      self.konvaEditor = new Editor("container" + self.instance.key, self.scaleBy);
      self.konvaEditor.setElementInstance(CreateElements);
      self.konvaEditor.setUpdateCallback(
        self.projectControllerRef.updateElement.bind(self.projectControllerRef)
      );
      self.konvaEditor.getLayer().getCanvas()._canvas.id = "canvas";
      self.konvaEditor.setReloadFunction(this.reload);
      self.$emit("ref", { key: this.instance.key, ref: this.konvaEditor });
      const dimension = {
        width: this.$refs.editorContainer.clientWidth,
        height: this.$refs.editorContainer.clientHeight,
      };
      this.dimension = dimension;
      this.konvaEditor.setAttr("width", this.$refs.editorContainer.clientWidth);
      this.konvaEditor.setAttr("height", this.$refs.editorContainer.clientHeight);
      self.konvaEditor.getStage().on("contextmenu", function (e) {
        e.evt.preventDefault();
        const containerRect = self.konvaEditor.getStage().container().getBoundingClientRect();
        const y = containerRect.top + self.konvaEditor.getStage().getPointerPosition().y + 32;
        const x = containerRect.left + self.konvaEditor.getStage().getPointerPosition().x + 4;
        self.openContextMenu({ x, y });
      });
      self.konvaEditor.getStage().on("dblclick dbltap", function (e) {
        if (e.evt.button === 0 && e.evt.detail === 2) {
          self.handleDbClick(e.target.getParent());
        }
      });
      this.initializeLayer();
    }, 0);
  },
  methods: {
    initializeLayer() {
      let instanceId;
      let identifier = "";
      if (this.instance.item.object.type === ELEMENT_TYPE.SUBTREE) {
        instanceId = this.instance.item.object.uuid;
        identifier = "#" + this.instance.item.object.name;
      } else if (this.instance.item.object.type === "dsd") {
        instanceId = this.instance.item.name;
        identifier = "-->";
      }
      const projectConfig = this.$store.state.projectConfiguration;
      const instanceConfig = projectConfig.graphConfig[instanceId];
      const dsdFile = FileController.fileInfo(
        this.$store.state.projectConfigurationLocal.path +
          Utils.getDir() +
          this.$store.state.projectConfiguration.dsdFileName
      );
      const dsdInitializer = new DSDInitializer(this.projectControllerRef, this.konvaEditor);
      if (instanceConfig) {
        console.log("instance Config exist");
        // config for this instance already exist
        dsdInitializer.initializeWithExistingConfig(instanceConfig);
        this.config = instanceConfig;
        this.konvaEditor.setEntryNode(this.config.entryNode);
      } else {
        console.log("no instance Config exist");
        // no config exist. Need to be created
        try {
          this.config = dsdInitializer.initializeWithoutExistingConfig(
            dsdFile,
            identifier,
            this.instance.item.name
          );
          this.konvaEditor.setEntryNode(this.config.entryNode);
          this.konvaEditor.restructure();
        } catch (e) {
          console.log(e);
          this.$emit(
            "error",
            "Something goes wrong while initializing the Layer. Please make sure the .dsd-File have the correct syntax."
          );
        }
      }
      this.loading = false;
    },
    reload() {
      this.loading = true;
      this.konvaEditor.getLayer().clear();
      let instanceId;
      if (this.instance.item.object.type === ELEMENT_TYPE.SUBTREE) {
        instanceId = this.instance.item.object.uuid;
      } else if (this.instance.item.object.type === "dsd") {
        instanceId = this.instance.item.name;
      }
      if (instanceId) {
        this.$store.commit("resetSingleGraphConfig", instanceId);
        setTimeout(() => {
          this.$nextTick(() => {
            this.initializeLayer();
          });
        });
      }
    },
    resize() {
      //TODO improve
      if (this.konvaEditor) {
        this.$nextTick(() => {
          this.$nextTick(() => {
            new Promise((resolve) => {
              setTimeout(() => {
                resolve();
              }, 400);
            }).then(() => {
              const dimension = {
                width: this.$refs.editorContainer.clientWidth,
                height: this.$refs.editorContainer.clientHeight,
              };
              this.dimension = dimension;
              this.konvaEditor.setAttr("width", this.$refs.editorContainer.clientWidth);
              this.konvaEditor.setAttr("height", this.$refs.editorContainer.clientHeight);
            });
          });
        });
      }
    },
    handleDbClick(target) {
      const customItem = target.getAttr("customItem");
      if (customItem.type === ELEMENT_TYPE.SUBTREE) {
        // open subtree
        const treeElement = this.projectControllerRef.getTreeElementByElement(customItem);
        if (treeElement) {
          this.projectControllerRef.openTab(treeElement);
        }
      } else {
        // open properties Dialog
        this.editProperties(target);
      }
    },
    openContextMenu(event) {
      this.contextMenuPosition = event;
      this.showContextMenu = true;
    },
    openElement(element) {
      const treeElement = this.projectControllerRef.getTreeElementByElement(
        element.getAttr("customItem")
      );
      if (treeElement) {
        this.projectControllerRef.openTab(treeElement.object.containingFile);
      }
    },
    editProperties(item) {
      this.selectedItem = item;
      this.showPropertiesDialog = true;
    },
    saveProperties(response) {
      this.$emit("saveProperties", response);
      //this.konvaEditor.updateElement(response.customItem, response.customAttr, response.item);
    },
    createSubstree(subtreeName) {
      const treeElement = this.projectControllerRef.createSubtree(subtreeName);
      const graphConfig = this.konvaEditor.createSubtree(treeElement.object); // Replace selected Elements with Subtree element
      this.$store.commit("updateSingleGraphConfig", {
        instance: treeElement.object.uuid,
        graphConfig,
      });
    },
  },
};
</script>

<style scoped>
.background {
  background-color: var(--v-darkPrimary-base);
}
.lds-ring {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid #fff;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #fff transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
