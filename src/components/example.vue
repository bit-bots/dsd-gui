<template>
  <div class="content">
    <vue-tabs-chrome
      ref="tab"
      :minHiddenWidth="120"
      v-model="tab"
      :tabs="tabs"
      @contextmenu="handleClick"
    />
    <div class="btns">
      <button @click="addTab">New Tab</button>
      <button @click="removeTab">Remove active Tab</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tab: "google",
      tabs: [
        {
          label: "google",
          key: "google",
        },
        {
          label: "facebook",
          key: "facebook",
        },
        {
          label: "New Tab",
          key: "costomKey",
        },
      ],
    };
  },
  methods: {
    addTab() {
      const item = "tab" + Date.now();
      const newTabs = [
        {
          label: "New Tab",
          key: item,
        },
      ];
      this.$refs.tab.addTab(...newTabs);
      this.tab = item;
    },
    removeTab() {
      this.$refs.tab.removeTab(this.tab);
    },
    handleClick(e, tab, i) {
      console.log(e, tab, i);
    },
  },
};
</script>
