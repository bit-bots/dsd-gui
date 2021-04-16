<template>
  <div>
    <div v-if="!disableAdd">Outputs ({{outputs.length}}):</div>
    <v-list style="height: 150px; margin-left: -4px;" class="overflow-y-auto attrlist" dense outlined>
      <draggable :list="outputs">
        <div v-for="(output, index) in outputs" :key="index">
          <v-list-item>
            <v-list-item-content class="pa-0">
              <v-list-item-title>
                <v-row dense>
                  <v-col cols="1" v-if="!disableAdd">
                    <v-icon class="pt-1 mt-2">mdi-menu</v-icon>
                  </v-col>
                  <v-col cols="11">
                    <v-text-field background-color="primaryLighten1"
                                  filled
                                  solo
                                  dense flat hide-details  :disabled="disableAdd" v-model="output.name" placeholder="Name"  type="text" class="mr-1 my-1" @input="$emit('change', outputs)"></v-text-field>
                  </v-col>
                </v-row>
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-action class="ma-0 align-center justify-center">
              <v-row dense>
                <v-col cols="6">
                  <div>
                    <v-hover v-slot="{ hover }">
                      <v-card width="60" height="40" class="pa-1" style="cursor: pointer;" v-bind:style="{backgroundColor: hover ? 'var(--v-darkPrimary-base)' : 'var(--v-primary-lighten1)'}" outlined @click="openColorDialog(output)">
                        <div style="width: 100%; height: 100%; border-width: 2px; border-style: solid; border-color: var(--v-darkPrimary-base);" v-bind:style="{backgroundColor : output.color}">
                        </div>
                      </v-card>
                    </v-hover>
                  </div>
                </v-col>
                <v-col cols="6" class="text-center align-center justify-center">
                  <v-btn icon @click="removeOutput(output)" x-small v-if="!disableAdd" class="mt-2">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </v-col>
              </v-row>

            </v-list-item-action>
          </v-list-item>
          <v-divider v-if="!disableAdd"></v-divider>
        </div>
      </draggable>
      <v-list-item v-if="!disableAdd">
        <v-list-item-content>
          <v-btn text @click="addOutput">
            <v-icon>mdi-plus</v-icon>
            Add
          </v-btn>
        </v-list-item-content>
      </v-list-item>
      <color-picker-dialog v-if="selectedOutput" :color="selectedOutput.color" :dialog="showColorDialog" @close="showColorDialog = false" @save="setColor"></color-picker-dialog>
    </v-list>
  </div>

</template>

<script>
import ColorPickerDialog from '@/components/dialogs/ColorPickerDialog';
import draggable from 'vuedraggable'
export default {
  name: 'OutputList',
  components: { draggable, ColorPickerDialog },
  props: {
    items: Array,
    disableAdd: Boolean,
  },
  watch: {
    items: {
      handler(){
        this.setOutputs();
      }
    },
    outputs: {
      handler(){
        this.ignoreChange = true;
        this.$emit('change', this.outputs);
      }
    }
  },
  mounted() {
    this.setOutputs();
  },
  data: () =>({
    outputs: [],
    draggedOutputs: [],
    index: 0,
    ignoreChange: false,
    removedOutputs: undefined,
    selectedOutput: undefined,
    showColorDialog: false,
    draggingOutput: undefined,
  }),
  methods: {
    setOutputs(){
      if(this.items){
        if(this.ignoreChange){
          this.ignoreChange = false;
          return;
        }
        this.outputs = JSON.parse(JSON.stringify(this.items));
        for(let i = 0; i < this.outputs.length; i++){
          this.outputs[i].before = this.outputs[i].name
        }
        this.removedOutputs = undefined;
      }
    },
    openColorDialog(output){
      this.selectedOutput = output;
      this.showColorDialog = true;
    },
    removeOutput(output){
      if(!this.removedOutputs){
        this.removedOutputs = [output];
      }else{
        this.removedOutputs.push(output);
      }
      this.outputs = this.outputs.filter(o => o !== output);
      this.$emit('change', this.outputs);
      this.$emit('removed', this.removedOutputs);
    },
    setColor(color){
      const index = this.outputs.indexOf(this.selectedOutput);
      this.outputs[index].color = color;
      this.$emit('change', this.outputs);
    },
    addOutput(){
      this.outputs.push({name: '', color:'white'});
      this.$emit('change', this.outputs);
    },
  }
};
</script>

<style scoped>

</style>