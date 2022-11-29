<template>
  <div
    style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: 'var(--v-primary-base)';
    "
  >
    <v-sheet class="lighten-2 px-2 pb-2 pt-1" style="background-color: var(--v-primary-base)">
      <v-text-field
        v-model="search"
        label="Search"
        @input="handleSearch"
        background-color="primaryLighten1"
        filled
        solo
        dense
        hide-details
        clearable
        color="primaryText"
        prepend-inner-icon="mdi-magnify"
        clear-icon="mdi-close-circle-outline"
        ref="searchField"
      ></v-text-field>
    </v-sheet>
    <div class="flex-grow-1" ref="listContainer">
      <div
        style="position: absolute; background-color: var(--v-primary-base)"
        v-bind:style="{ height: listHeight + 'px' }"
        class="mr-2 overflow-y-auto projectTree"
      >
        <v-treeview
          style="background-color: var(--v-primary-base)"
          ref="tree"
          hoverable
          active-class="select"
          :active.sync="selected"
          dense
          item-key="id"
          :dark="$store.state.theme.darkMode"
          :items="projectTree"
          :key="treeKey"
          :search="search"
          activatable
          @contextmenu.native.prevent="handleContextMenu"
        >
          <template v-slot:label="{ item, open }">
            <div :id="item.id" @dblclick="openFile(item)" style="cursor: default">
              <template v-if="item.type === TREE_TYPE.DIRECTORY">
                <v-icon color="primaryText">
                  {{ open ? "mdi-folder-open" : "mdi-folder" }}
                </v-icon>
              </template>
              <template v-if="item.type === TREE_TYPE.FILE">
                <python-icon
                  class="v-icon"
                  style="font-size: 16px"
                  v-if="item.object.type === 'py'"
                ></python-icon>
                <template v-else-if="item.object.type === 'dsd'">
                  <!--                  <v-icon >mdi-sitemap</v-icon>-->
                  <flow-chart-icon-light
                    class="v-icon"
                    v-if="$store.state.theme.darkMode"
                    style="font-size: 16px"
                  ></flow-chart-icon-light>
                  <flow-chart-icon-dark
                    class="v-icon"
                    v-else
                    style="font-size: 16px"
                  ></flow-chart-icon-dark>
                </template>
                <v-icon v-else>mdi-file</v-icon>
              </template>
              <template
                v-if="item.type === TREE_TYPE.ELEMENT && item.object.type === ELEMENT_TYPE.SUBTREE"
              >
                <v-icon>mdi-sitemap</v-icon>
                <!--                <flow-chart-icon-light class="v-icon" v-if="$store.state.theme.darkMode" style="font-size: 16px;"></flow-chart-icon-light>-->
                <!--                <flow-chart-icon-dark class="v-icon"  v-else style="font-size: 16px;"></flow-chart-icon-dark>-->
              </template>
              <template v-if="item.type !== TREE_TYPE.ELEMENT">
                {{ item.name }}
              </template>
              <template v-else>
                <v-chip
                  label
                  small
                  draggable
                  @dragstart="startDragging(item.object, $event)"
                  style="cursor: pointer"
                  class="ml-2 my-1"
                  id="chippichip"
                  @contextmenu.native.prevent="handleContextMenuByItem(item, $event)"
                >
                  {{ item.name }}
                </v-chip>
              </template>
            </div>
          </template>
        </v-treeview>
      </div>
    </div>
    <context-menu
      :show="showContextMenu"
      :project-controller-ref="projectControllerRef"
      :selected-tree-element="selectedElement"
      @close="showContextMenu = false"
      @openFile="openFile"
      menu-mode="TREEVIEW"
      :position="contextMenuPosition"
    ></context-menu>
  </div>
</template>

<script>
import { TREE_TYPE } from "@/enumerates/TreeType";
import PythonIcon from "@/assets/PythonIcon";
import ContextMenu from "@/utils/ContextMenu";
import { ELEMENT_TYPE } from "@/enumerates/ElementType";
import FlowChartIconLight from "@/assets/FlowChartIconLight";
import FlowChartIconDark from "@/assets/FlowChartIconDark";

export default {
  name: "ProjectTree",
  components: {
    FlowChartIconDark,
    FlowChartIconLight,
    ContextMenu,
    PythonIcon,
  },
  props: {
    projectControllerRef: Object,
  },
  methods: {
    startDragging(item, evt) {
      evt.dataTransfer.dropEffect = "move";
      evt.dataTransfer.effectAllowed = "move";
      evt.dataTransfer.setData("item", JSON.stringify(item));
    },
    resize() {
      // TODO improve
      setTimeout(() => {
        new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 400);
        }).then(() => {
          if (this.$refs.listContainer) {
            this.listHeight = this.$refs.listContainer.clientHeight;
          }
        });
      }, 0);
    },
    handleSearch(input) {
      if (input) {
        this.$refs.tree.updateAll(true);
      } else {
        this.$refs.tree.updateAll(false);
      }
    },
    handleContextMenuByItem(item, ev) {
      this.$nextTick(() => {
        this.selected = [item.id];
        ev.preventDefault();
        this.contextMenuPosition = {
          x: ev.clientX,
          y: ev.clientY,
        };
        this.selectedElement = item;
        this.showContextMenu = true;
      });
    },
    handleContextMenu(ev) {
      this.$nextTick(() => {
        const item = this.getActive(ev);
        if (item) {
          ev.preventDefault();
          this.selected = [this.getElementItemKey(ev.target)];
          this.contextMenuPosition = {
            x: ev.clientX,
            y: ev.clientY,
          };
          this.selectedElement = item;
          this.showContextMenu = true;
        }
      });
    },
    openFile(treeElement) {
      this.projectControllerRef.openTab(treeElement);
    },
    getActive(ev) {
      const key = this.getElementItemKey(ev.target);
      return this.getItemByKey(key);
    },
    // Queries the sibling hidden input element, which holds the
    // item's key.
    getElementItemKey(el) {
      return el.id || undefined;
    },
    // Given the item's key return the item itself
    getItemByKey(itemKey) {
      if (!itemKey && itemKey !== 0) return null;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return find(this.projectTree);

      // Recursively traverse the items array to find
      // an item that has the same key as itemKey.
      function find(items) {
        for (const item of items) {
          if (item.id == itemKey) return item;
          if (item.children && item.children.length > 0) {
            const i = find(item.children);
            if (i) return i;
          }
        }
      }
    },
  },
  mounted() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    window.addEventListener("resize", () => {
      self.resize();
    });
    document.addEventListener("contextmenu", function (e) {
      if (self.showContextMenu && e.target) {
        if (
          e.target.id === "canvas" ||
          (e.target.id === "" && e.target.parentElement.id !== "chippichip")
        ) {
          self.showContextMenu = false;
        }
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.code === "KeyF") {
        self.$refs.searchField.focus();
      }
    });
    this.$eventHub.$on("SEARCH_ELEMENT", () => this.$refs.searchField.focus());
    this.resize();
  },
  computed: {
    TREE_TYPE() {
      return TREE_TYPE;
    },
    ELEMENT_TYPE() {
      return ELEMENT_TYPE;
    },
    projectTree() {
      if (this.projectControllerRef) {
        return this.projectControllerRef.projectTree;
      }
      return [];
    },
  },
  data: () => ({
    listHeight: 200,
    search: undefined,
    selected: undefined,
    selectedElement: undefined,
    treeKey: 0,
    showContextMenu: false,
    contextMenuPosition: {
      x: 0,
      y: 0,
    },
    actionElement: undefined,
    decisionElement: undefined,
    subtreeElement: undefined,
    files: {
      html: "mdi-language-html5",
      js: "mdi-nodejs",
      json: "mdi-code-json",
      md: "mdi-language-markdown",
      pdf: "mdi-file-pdf",
      png: "mdi-file-image",
      txt: "mdi-file-document-outline",
      xls: "mdi-file-excel",
      py: "mdi-language-python",
    },
  }),
};
</script>

<style lang="scss">
.v-treeview--dense .v-treeview-node__root {
  min-height: 30px !important;
}
.select {
  background-color: rgba(#82b1ff, 0.8) !important;
  color: var(--v-primaryText-base) !important;
}

.projectTree {
  width: 100%;
}
/* width */
.projectTree::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  display: block !important;
}

/*!* Track *!*/
.projectTree::-webkit-scrollbar-track:hover {
  box-shadow: inset 0 0 8px grey;
}
.projectTree::-webkit-scrollbar-track {
  border-radius: 10px;
  background: var(--v-primary-base);
}

/* Handle */
.projectTree::-webkit-scrollbar-thumb {
  background: var(--v-accent-base);
  border-radius: 10px;
}

/* Handle on hover */
.projectTree::-webkit-scrollbar-thumb:hover {
  background: var(--v-accent-darken2);
  cursor: pointer;
}
</style>
