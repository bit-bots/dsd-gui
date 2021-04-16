<template>
    <div class="content" v-if="projectControllerRef" >
    <vue-tabs-chrome theme="dark" v-model="selectedTab" :tabs="displayedTabs" ref="tab" @remove="removeTab"></vue-tabs-chrome>
    </div>
</template>

<script>
import { TREE_TYPE } from '@/enumerates/TreeType';

export default {
  name: 'TabBar',
  props: {
    projectControllerRef: Object
  },
  watch: {
    'projectControllerRef.tabs' :{
      handler() {
        if(this.$refs.tab){
          const tabkeys = [...this.displayedTabs].map(o => o.key);
          const newTabs = this.projectControllerRef.tabs.filter(o => !tabkeys.includes(o.key));
          if(newTabs && newTabs.length > 0){
            this.$refs.tab.addTab(...newTabs)
            this.selectedTab = newTabs[0].key;
          }
        }
      },
      deep: true
    },
    selectedTab: {
      handler(){
        this.projectControllerRef.selectTab(this.selectedTab);
      }
    },
    'projectControllerRef.selectedTab': {
      handler(){
        if(this.projectControllerRef.selectedTab){
          this.selectedTab = this.projectControllerRef.selectedTab.key;
        }else{
          this.selectedTab = undefined;
        }
      },
      deep: true,
    },
  },
  computed: {
    saved(){
      return this.projectControllerRef.tabs.map(o => o.saved);
    }
  },
  methods: {
    removeTab(tab){
      this.projectControllerRef.removeTab(tab.key);
    },
    isBehavior(tab){
      return tab.item.type === TREE_TYPE.FILE && tab.item.name === this.$store.state.projectConfiguration.dsdFileName
    }
  },
  data: () => ({
    key: 0,
    selectedTab: 0,
    displayedTabs: [],
  })
};
</script>

<style >
.theme-dark .tabs-divider {
  background-color: var(--v-primaryText-base) !important;
  z-index: 2!important;
  width: 0.5px !important;
}
.theme-dark .tabs-item.active .tabs-background-content{
  background: var(--v-darkPrimary-base) !important;
  border-top-width: 4px !important;
  border-top-color: var(--v-accent-base) !important;
  border-top-style: solid !important;
}
.theme-dark .tabs-item.active .tabs-background-after, .theme-dark .tabs-item.active .tabs-background-before {
  fill: var(--v-darkPrimary-base) !important;
}
.theme-dark .tabs-footer {
  background-color: var(--v-darkPrimary-base) !important;
}

.theme-dark, .theme-dark .tabs-item .tabs-background-content {
  background-color: var(--v-primary-base) !important;
  color: var(--v-primaryText-base) !important;
}
.tabs-item.active .tabs-label{
  color: var(--v-primaryText-base) !important;
}
</style>