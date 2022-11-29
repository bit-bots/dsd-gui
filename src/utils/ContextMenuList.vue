<template>
  <div style="background-color: var(--v-primary-base)">
    <template v-for="(item, index) in items">
      <template v-if="item.name != 'DIVIDER'">
        <template v-if="item.childs">
          <v-menu :key="index + '$' + deep" open-on-hover top offset-x offset-y>
            <template v-slot:activator="{ on }">
              <v-hover v-slot="{ hover }">
                <div
                  style="color: var(--v-primaryText-base)"
                  class="pr-2 pt-0 pb-0 menu-item body-2 text-start"
                  v-bind:class="hover && !item.disabled ? 'on-hover' : ''"
                  v-on="on"
                >
                  <v-icon color="primaryText" small class="ml-2" style="width: 16px">
                    {{ item.icon ? item.icon : "mdi-blank" }}
                  </v-icon>
                  <span class="ml-2 mr-5 flex-grow-1">
                    {{ item.name }}
                  </span>
                  <v-icon v-if="item.childs" small color="primaryText"> mdi-chevron-right </v-icon>
                </div>
              </v-hover>
            </template>
            <template v-slot:default>
              <context-menu-list
                :items="item.childs"
                :deep="deep + 1"
                @menu="$emit('menu', $event)"
              ></context-menu-list>
            </template>
          </v-menu>
        </template>
        <template v-else>
          <v-hover v-slot="{ hover }" :key="index + '$' + deep">
            <div
              style="color: var(--v-primaryText-base)"
              class="pr-2 pt-1 pb-1 menu-item body-2 text-start"
              v-bind:class="{
                'on-hover': hover && !item.disabled,
                disabledLight: item.disabled && !$store.state.theme.darkMode,
                disabledDark: item.disabled && $store.state.theme.darkMode,
              }"
              @click="clickOnItem(item)"
            >
              <v-icon color="primaryText" small class="ml-2" style="width: 16px">
                {{ item.icon ? item.icon : "mdi-blank" }}
              </v-icon>
              <span class="ml-2 mr-5 flex-grow-1">
                {{ item.name }}
              </span>
              <v-icon v-if="item.childs" small color="primaryText"> mdi-chevron-right </v-icon>
              <template v-else-if="item.accelerator" class="text-caption">
                {{ item.accelerator }}
              </template>
            </div>
          </v-hover>
        </template>
      </template>
      <template v-else>
        <v-divider v-if="index < items.length - 1" :key="index + '$' + deep"></v-divider>
      </template>
    </template>
  </div>
</template>

<script>
export default {
  name: "ContextMenuList",
  props: {
    items: Array,
    deep: Number,
    width: Number,
  },
  data: () => ({}),
  methods: {
    clickOnItem(item) {
      if (item.action) {
        this.$eventHub.$emit(item.action);
      } else if (item.innerAction) {
        this.$emit("menu", item.innerAction);
      }
    },
  },
};
</script>

<style scoped>
.disabledLight {
  color: var(--v-primaryText-lighten3) !important;
}
.disabledDark {
  color: var(--v-darkPrimary-lighten3) !important;
}
.on-hover {
  background-color: var(--v-accent-base);
}
.menu-item {
  cursor: default;
  display: flex;
}
.v-menu__content {
  border-radius: 0px !important;
  border-width: thin;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.12) !important;
}
</style>
