<template>
<parent-dialog :title="'Color Picker'" :dialog="dialog" @close="$emit('close')" :dimension="{height: 800, width: 300}">
   <v-card class="dialogContainer" style="width: 100%; height: 100%; background-color: var(--v-primary-base);" flat>
     <v-card-text>
       <v-color-picker v-model="newColor"
                       class="ma-2"
       ></v-color-picker>
     </v-card-text>
     <v-card-actions>
       <v-spacer></v-spacer>
       <v-btn color="accent" outlined @click="close" class="mr-2">Cancel</v-btn>
       <v-btn color="accent" class="mr-4" @click="save">Apply</v-btn>
     </v-card-actions>
   </v-card>
</parent-dialog>
</template>

<script>
import ParentDialog from '@/components/dialogs/ParentDialog';
export default {
  name: 'ColorPickerDialog',
  components: { ParentDialog },
  props: {
    dialog: Boolean,
    dimension: { type: Object,
      default: () => {return {height: 800, width: 300}}},
    color: String,
  },
  data: () => ({
    newColor: '#ffffff',
  }),
  mounted() {
    if(this.color){
      this.newColor = this.color.toString().length > 7 ? this.color.toString().substring(0,7) : this.color;
    }
  },
  watch: {
    dialog: {
      handler(){
        if(this.dialog){
          this.newColor = this.color.toString().length > 7 ? this.color.toString().substring(0,7) : this.color;
        }else{
          this.newColor = '#ffffff';
        }
      },
      deep: true,
    },
    color: {
      handler(){
        this.newColor = this.color.toString().length > 7 ? this.color.toString().substring(0,7) : this.color;
      }
    }
  },
  methods: {
    close(){
      this.$emit('close');
    },
    save(){
      this.$emit('save', this.newColor);
      this.close();
    }
  }
};
</script>

<style scoped>

</style>