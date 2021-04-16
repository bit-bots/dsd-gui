<template>
  <div>
    Parameters ({{parameters.length}}):
    <v-list style="min-height: 150px;max-height: 300px; margin-left: -4px;" class="overflow-y-auto attrlist" dense outlined>
      <draggable :list="parameters">
        <div v-for="(parameter, index) in parameters" :key="index">
          <v-list-item>
            <v-list-item-content class="pa-0">
              <v-list-item-title>
                <v-row dense>
                  <v-col cols="1">
                    <v-icon class="pt-1 mt-2">mdi-menu</v-icon>
                  </v-col>
                  <v-col cols="11" style="display: flex; flex-direction: row;">
                    <v-text-field background-color="primaryLighten1"
                                  filled
                                  solo
                                  dense hide-details v-model="parameter.name" placeholder="Name"  style="width: 48%; position: relative;" type="text" class="mr-1 my-1"></v-text-field><span class="mt-3">:</span>
                    <v-text-field
                        background-color="primaryLighten1"
                        filled
                        solo
                        dense hide-details placeholder="Value" v-model="parameter.value" style="width: 48%;" type="text" class="my-1 ml-1"></v-text-field>
                  </v-col>
                </v-row>
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-action class="ml-2 ma-0">
                  <v-btn icon @click="removeParameter(parameter)" small>
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
            </v-list-item-action>
          </v-list-item>
          <v-divider></v-divider>
        </div>
      </draggable>
      <v-list-item>
        <v-list-item-content>
          <v-btn text @click="addParameter">
            <v-icon>mdi-plus</v-icon>
            Add
          </v-btn>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </div>

</template>

<script>
import draggable from 'vuedraggable'
export default {
  name: 'ParameterList',
  components: { draggable},
  props: {
    names: Array,
    attrs: Object,
  },
  watch: {
    names: {
      handler(){
        if(this.parameters){
          if(this.ignoreChange){
            this.ignoreChange = false;
            return;
          }
          this.setParameters();
        }
      }
    },
    parameters: {
      handler(){
        this.ignoreChange = true;
        this.$emit('change', this.parameters);
      }
    }
  },
  mounted() {
    if(this.names){
      if(this.ignoreChange){
        this.ignoreChange = false;
        return;
      }
      this.setParameters();
    }
  },
  data: () =>({
    parameters: [],
    index: 0,
    ignoreChange: false,
    selectedOutput: undefined,
    showColorDialog: false,
    draggingOutput: undefined,
  }),
  methods: {
    setParameters(){
      this.parameters = this.names;
      if(this.attrs && this.attrs.parameters){
        this.parameters.forEach(parameter => {
          const values = this.attrs.parameters.filter(o => o.name === parameter.name);
          if(values && values.length >0){
            parameter.value = values[0].value;
          }
        })
      }
    },
    removeParameter(parameter){
      this.parameters = this.parameters.filter(o => o !== parameter);
      this.$emit('change', this.parameters);
    },
    addParameter(){
      this.parameters.push({name: '', description: ''});
      this.$emit('change', this.parameters);
    },
  }
};
</script>

<style scoped>


</style>