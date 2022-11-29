<template>
  <div style="width: 100%; height: 100%; background-color: var(--v-darkPrimary-base)">
    <template v-for="instance in openInstances">
      <editor
        @error="$emit('error', $event)"
        :project-controller-ref="projectControllerRef"
        @saveProperties="saveProperties"
        :instance="instance"
        :key="instance.key"
        @ref="saveRef"
        v-bind:class="instance.key === selectedInstance.key ? 'show' : 'hide'"
      ></editor>
    </template>
  </div>
</template>

<script>
import Editor from "./Editor";
import { ELEMENT_TYPE } from "@/enumerates/ElementType";
import DSDParser from "@/utils/DSDParser";
export default {
  name: "EditorInstances",
  components: { Editor },
  props: {
    projectControllerRef: Object,
    showVirtuellRoom: Boolean,
  },
  data: () => ({
    refs: {},
    openInstances: [],
    selectedInstance: undefined,
  }),
  computed: {
    selectedTab() {
      if (this.projectControllerRef) {
        return this.projectControllerRef.selectedTab;
      }
      return undefined;
    },
  },
  methods: {
    saveRef(response) {
      this.refs[response.key] = response.ref;
      this.$emit("ref", this.refs[this.selectedInstance.key]);
    },
    saveProperties(response) {
      for (const ref in this.refs) {
        this.refs[ref].updateElement(response.customItem, response.customAttr, response.node);
      }
    },
    save(dsdFile) {
      const dsdParser = new DSDParser();
      const graphConfigs = {};
      const updatedDsdBlocks = [];
      const allNodesToSave = {};
      const messages = [];
      for (const instance of this.openInstances) {
        let instanceId;
        if (instance.item.object.type === ELEMENT_TYPE.SUBTREE) {
          instanceId = instance.item.object.uuid;
        } else if (instance.item.object.type === "dsd") {
          instanceId = instance.item.name;
        }
        const snapShot = this.refs[instance.key].getSnapshot();
        snapShot.isBehaviorTree = instance.item.object.type === "dsd";
        const dsdBlock = dsdParser.createDsdBlock(snapShot, snapShot.name);
        if (dsdBlock) {
          if (!dsdBlock.complete) {
            messages.push("Unused outputs in " + snapShot.name);
          }
          dsdBlock.name = instance.item.name;
          updatedDsdBlocks.push(dsdBlock);
          graphConfigs[instanceId] = snapShot;
          snapShot.nodes.forEach((node) => {
            allNodesToSave[node.customItem.uuid] = node.customItem;
          });
        } else {
          messages.push("Entry from " + snapShot.name + "has no connection");
        }
      }
      this.$store.commit("updateGraphConfig", { graphConfigs });
      this.projectControllerRef.saveConfigFile();
      if (!dsdFile) {
        // if dsdFile changed, all changes on the graph will be deleted
        this.projectControllerRef.saveDsdFile(updatedDsdBlocks);
      }

      this.projectControllerRef.savePythonFiles(allNodesToSave);

      return { value: messages.length === 0, messages };
    },
  },
  //TODO unclear unnessecarry tabs
  // update refs on change
  watch: {
    selectedTab: {
      handler() {
        if (!this.selectedTab) {
          this.$emit("ref", undefined);
          return;
        }
        if (this.showVirtuellRoom) {
          let instance = undefined;
          const index = [...this.openInstances]
            .map((o) => {
              return o.key;
            })
            .indexOf(this.selectedTab.key);
          if (index >= 0) {
            instance = this.openInstances[index];
          } else {
            instance = this.selectedTab;
            this.openInstances.push(instance);
          }
          this.selectedInstance = instance;
          this.$emit("ref", this.refs[this.selectedInstance.key]);
        }
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
.show {
  visibility: visible;
  max-height: unset;
}

.hide {
  visibility: hidden;
  max-height: 0;
}
</style>
