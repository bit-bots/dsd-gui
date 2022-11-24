<template>
  <parent-dialog
    :title="'Properties'"
    :dialog="dialog"
    @close="$emit('close')"
    :dimension="{ height: 800, width: 500 }"
  >
    <v-card
      v-if="item && element"
      class="dialogContainer"
      style="width: 100%; height: 100%; background-color: var(--v-primary-base)"
      flat
      :dark="$store.state.theme.darkMode"
    >
      <v-card-text style="color: var(--v-primaryText-base)">
        <div class="text-start">Name:</div>
        <v-text-field
          v-model="element.name"
          :disabled="element.type !== 'ENTRY'"
          background-color="primaryLighten1"
          filled
          solo
          dense
          hide-details
          class="mb-2"
        ></v-text-field>
        <template v-if="element.type !== ELEMENT_TYPE.ENTRY">
          <div class="text-start">Type:</div>
          <v-text-field
            v-model="element.type"
            disabled
            background-color="primaryLighten1"
            filled
            solo
            dense
            hide-details
            class="mb-2"
          ></v-text-field>
        </template>
        <v-divider v-if="element.type !== ELEMENT_TYPE.SUBTREE"></v-divider>
        <v-row v-if="element.type === ELEMENT_TYPE.DECISION || element.type === ELEMENT_TYPE.ENTRY">
          <v-col cols="12" class="text-start">
            <output-list
              :items="element.outputs"
              :disableAdd="element.type === ELEMENT_TYPE.ENTRY"
              @change="newOutputs = $event"
              :key="key + 'outputs'"
            ></output-list>
          </v-col>
        </v-row>
        <v-row
          v-if="element.type === ELEMENT_TYPE.DECISION || element.type === ELEMENT_TYPE.ACTION"
        >
          <v-col cols="12" class="text-start">
            <parameter-list
              :names="element.parameters"
              :attrs="attrs"
              @change="newParameters = $event"
              :key="key + 'parameters'"
            ></parameter-list>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="accent" outlined @click="$emit('close')" class="mr-2">Cancel</v-btn>
        <v-btn color="accent" class="mr-4" @click="save" :disabled="!newParameters && !newOutputs"
          >Apply</v-btn
        >
      </v-card-actions>
    </v-card>
  </parent-dialog>
</template>

<script>
import { ELEMENT_TYPE } from "@/enumerates/ElementType";
import ParameterList from "@/components/dialogs/properties/ParameterList";
import OutputList from "@/components/dialogs/properties/OutputList";
import ParentDialog from "@/components/dialogs/ParentDialog";
import EditorUtils from "@/plugins/canvas/EditorUtils";
export default {
  name: "PropertiesDialog",
  components: { ParentDialog, ParameterList, OutputList },
  props: {
    dialog: Boolean,
    item: Object,
  },
  data: () => ({
    newOutputs: undefined,
    newParameters: undefined,
    key: 0,
    element: undefined,
    attrs: undefined,
  }),
  computed: {
    ELEMENT_TYPE() {
      return ELEMENT_TYPE;
    },
  },
  watch: {
    dialog: {
      handler() {
        if (this.dialog) {
          this.element = this.item.getAttr("customItem")
            ? Object.assign({}, this.item.getAttr("customItem"))
            : undefined;
          this.attrs = this.item.getAttr("customAttr")
            ? Object.assign({}, this.item.getAttr("customAttr"))
            : undefined;
        } else {
          this.element = undefined;
          this.attrs = undefined;
        }
      },
      deep: true,
    },
  },
  methods: {
    save() {
      const elementCopy = Object.assign({}, this.element);
      if (this.element.type !== "ENTRY") {
        elementCopy.parameters = [...this.newParameters].map((parameter) => {
          return { name: parameter.name };
        });
        if (this.newOutputs) {
          elementCopy.outputs = this.newOutputs;
        }
      }
      this.$emit("save", {
        customItem: elementCopy,
        customAttr: { parameters: this.newParameters },
        node: EditorUtils.castNode(this.item),
      });
      this.$emit("close");
    },
  },
};
</script>

<style>
.v-list-item--dense,
.v-list--dense .v-list-item {
  min-height: 20px !important;
}

/* width */
.attrlist::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  display: block !important;
}

/*!* Track *!*/
.attrlist::-webkit-scrollbar-track:hover {
  box-shadow: inset 0 0 8px grey;
}
.attrlist::-webkit-scrollbar-track {
  border-radius: 10px;
  background: var(--v-primary-base);
}

/* Handle */
.attrlist::-webkit-scrollbar-thumb {
  background: var(--v-accent-base);
  border-radius: 10px;
}

/* Handle on hover */
.attrlist::-webkit-scrollbar-thumb:hover {
  background: var(--v-accent-darken2);
  cursor: pointer;
}
</style>
