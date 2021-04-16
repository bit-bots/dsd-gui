<template>
  <v-dialog :dark="$store.state.theme.darkMode"
            :value="dialog"
            @click:outside="$emit('close')"
            :max-width="dimension.width"
  >
    <div v-bind:style="{width: dimension.width + 'px'}">
      <div style="height: 32px; width: 100%; background-color: var(--v-darkPrimary-base); color: var(--v-primaryText-base);" class="body-2 pt-0 pl-4 dialog_title">
        <v-row dense class="text-start">
          <v-col cols="9" class="text-start mt-1">
            {{title}}
          </v-col>
          <v-col cols="3" class="text-end mt-1">
            <v-btn icon @click="$emit('close')" style="margin-top: -8px;">
              <v-icon color="primaryText">
                mdi-close
              </v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </div>
      <div style="width: 100%; " class="pl-0">
        <slot></slot>
      </div>
    </div>
  </v-dialog>
</template>

<script>
export default {
  name: 'ParentDialog',
  props: {
    dialog: Boolean,
    dimension: { type: Object,
      default: () => {return {height: 800, width: 500}}},
    title: String,
  },
};
</script>

<style>
.dialogContainer{
  border-top-left-radius: 0px !important;
  border-top-right-radius: 0px !important;
}

.theme--light.v-tabs > .v-tabs-bar {
  background-color: var(--v-darkPrimary-base) !important;
}
.theme--light.v-tabs > .v-tabs-bar .v-tab:not(.v-tab--active){
  color: var(--v-primaryText-base) !important;
}
.theme--light.v-tabs > .v-tabs-bar .v-tab:not(.v-tab--active) > .v-icon {
  color: var(--v-primaryText-base) !important;
}
.v-dialog {
  border-color: var(--v-primary-lighten2) !important;
}
.dialog_title{
  border-color: var(--v-primary-lighten2) !important;
}
</style>