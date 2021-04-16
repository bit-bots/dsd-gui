<template>
  <parent-dialog :title="'New Subtree'" :dialog="dialog" @close="$emit('close')">
    <div>
      <v-alert v-if="showError" outlined class="ma-2">{{errorMessage}}</v-alert>
      <div>
        <v-text-field v-model="textValue" ref="textfield"
                      @keyup="handleEnter"
                      @input="showError = false"
                      placeholder="Name"
                      background-color="primaryLighten1"
                      filled
                      solo
                      dense
                      hide-details>

        </v-text-field>
      </div>
    </div>

  </parent-dialog>
</template>

<script>


import ParentDialog from './ParentDialog';
export default {
  name: 'NewSubtreeDialog',
  components: { ParentDialog },
  props: {
    dialog: Boolean,
    existingSubtrees: Array,
  },
  data: () => ({
    show: false,
    errorMessage: 'Subtree already exist. Please choose an other name.',
    showError: false,
    textValue: ''
  }),
  methods: {
    handleEnter(event){
      if(event.key === 'Enter'){
        if(this.existingSubtrees.includes(this.textValue)){
          this.showError = true;
          return;
        }
        this.saveSubtree();
      }
    },
    saveSubtree(){
      this.$emit('create', this.textValue);
      this.$emit('close');
    },
    setFocusName() {
      this.$refs.textfield.focus();
    },
  },
  watch: {
    dialog: {
      handler(){
        if(this.dialog){
          this.textValue = ''
          setTimeout(() => {
            this.setFocusName()
          }, 200)
        }
      },
      deep: true,
    }
  }
};
</script>

<style>
</style>