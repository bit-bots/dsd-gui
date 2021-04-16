<template>
  <parent-dialog :title="'Delete'" :dialog="dialog" @close="$emit('close')">
    <v-card style="width: 100%;" v-bind:style="{backgroundColor: $vuetify.theme.themes.light.primary}" flat>
      <v-card-text>
        Deleting: {{elementName}}?
      </v-card-text>
      <v-card-actions v-bind:style="{color: $vuetify.theme.themes.light.primaryText}">
        <v-spacer></v-spacer>
        <v-btn
            outlined
            color="accent"
            dark
            @click="confirm"
        >
          Delete
        </v-btn>
        <v-btn
            color="accent"
            dark
            @click="cancel"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </parent-dialog>
</template>

<script>
import ParentDialog from '@/components/dialogs/ParentDialog';
export default {
  name: 'DeleteConfirmDialog',
  components: { ParentDialog },
  props: {
    elementName: String,
    dialog: Boolean
  },
  methods: {
    confirm(){
      this.$emit('confirm');
    },
    cancel(){
      this.$emit('close');
    }
  }
};
</script>

<style scoped>

</style>