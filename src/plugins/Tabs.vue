<template lang="pug">
  .vue-tabs-chrome(:class="theme ? 'theme-' + theme : ''")
    .tabs-content(ref="content")
      .tabs-divider(
        v-for="i in tabs.length"
        :key="i"
        :style="{ left: (tabWidth - gap * 2) * i + gap + 'px' }"
      )
      .tabs-item(
        v-for="(tab, i) in tabs"
        ref="item"
        :class="[{ active: getKey(tab) === value }, `tab-${getKey(tab)}`, tab.class].filter(item => item)"
        :key="getKey(tab)"
        :style="{ width: tabWidth + 'px' }"
        @contextmenu="e => handleMenu(e, tab, i)"
      )
        .tabs-background
          .tabs-background-content
          svg.tabs-background-before(width="7" height="7")
            path(d="M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z")
          svg.tabs-background-after(width="7" height="7")
            path(d="M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z")
        .tabs-close(@click.stop="handleDelete(tab, i)" v-show="canShowTabClose(tab)")
          slot(v-if="$slots['close-icon']" name="close-icon")
          svg.tabs-close-icon(v-else width="16" height="16" stroke="#595959")
            path(d="M 4 4 L 12 12 M 12 4 L 4 12")
        .tabs-main(:title="tab | tabLabelText(tabLabel, renderLabel)")
          span.tabs-favicon(v-if="tab.favico")
            render-temp(
              v-if="typeof tab.favico === 'function'"
              :render="tab.favico"
              :params="{ tab, index: i }"
            )
            img(v-else-if="tab.favico" :src="tab.favico")
          span.tabs-label(:class="{ 'no-close': !canShowTabClose(tab) }") {{ tab | tabLabelText(tabLabel, renderLabel) }}
      span.tabs-after(
        ref="after"
        :style="{ left: (tabWidth - gap * 2) * tabs.length + gap * 2 + 'px' }"
      )
        slot(name="after")
    .tabs-footer
</template>

<script>
import Draggabilly from "draggabilly";
import RenderTemp from "./render-temp";

const getInstanceAt = (tabs, tab, tabWidth, tabKey, gap) => {
  const halfWidth = (tabWidth - gap) / 2;
  const x = tab._instance.position.x;
  for (let i = 0; i < tabs.length; i++) {
    const targetX = tabs[i]._x - 1;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (getKey(tab, tabKey) === getKey(tabs[i], tabKey)) continue;
    // in range
    if (targetX <= x && x < targetX + halfWidth / 2) {
      // before range
      return {
        direction: "left",
        instance: tabs[i]._instance,
        targetTab: tabs[i],
      };
    } else if (targetX + halfWidth / 2 <= x && x < targetX + halfWidth) {
      // after range
      return {
        direction: "right",
        instance: tabs[i]._instance,
        targetTab: tabs[i],
      };
    }
  }
  return {
    direction: null,
    instance: null,
    targetTab: tab,
  };
};

const getParams = (tab, keyStr) => {
  const keys = keyStr.split(".");
  let label = tab;
  keys.forEach((key) => {
    label = label[key];
  });
  return label;
};

const getKey = (tab, tabKey) => {
  return getParams(tab, tabKey);
};

export default {
  name: "tabs",
  components: {
    RenderTemp,
  },
  props: {
    value: {
      type: [String, Number],
      default: "",
    },
    tabs: {
      type: Array,
      default: () => [],
    },
    props: {
      type: Object,
      default: () => {
        return {};
      },
    },
    minWidth: {
      type: Number,
      default: 40,
    },
    autoHiddenCloseIconWidth: {
      type: Number,
      default: 120,
    },
    maxWidth: {
      type: Number,
      default: 245,
    },
    gap: {
      type: Number,
      default: 7,
    },
    insertToAfter: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      default: "",
    },
    isMousedownActive: {
      type: Boolean,
      default: true,
    },
    renderLabel: {
      type: Function,
    },
    onClose: {
      type: Function,
    },
  },
  data() {
    return {
      tabWidth: null,
    };
  },
  filters: {
    tabLabelText(tab, tabLabel = "", renderLabel) {
      return renderLabel ? renderLabel(tab) : getParams(tab, tabLabel);
    },
  },
  computed: {
    tabKey() {
      return this.props.key || "key";
    },
    tabLabel() {
      return this.props.label || "label";
    },
  },
  mounted() {
    this.calcTabWidth();
    window.addEventListener("resize", this.handleResize);
    this.setup();
  },
  destroyed() {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    canShowTabClose(tab) {
      if (tab.closable === false) {
        return false;
      }

      if (tab[this.tabKey] === this.value) {
        return true;
      }

      if (this.autoHiddenCloseIconWidth > this.tabWidth) {
        return false;
      }

      return true;
    },
    calcTabWidth() {
      const { tabs, maxWidth, minWidth, gap } = this;
      const $content = this.$refs.content;
      const after = this.$refs.after;
      const afterWidth = after.getBoundingClientRect().width;
      if (!$content) return Math.max(maxWidth, minWidth);
      const contentWidth = $content.clientWidth - gap * 3 - afterWidth;
      let width = contentWidth / tabs.length;
      width += gap * 2;
      if (width > maxWidth) width = maxWidth;
      if (width < minWidth) width = minWidth;
      this.tabWidth = width;
    },
    setup() {
      const { tabs } = this;
      tabs.forEach((tab, i) => {
        this.addInstance(tab, i);
      });
    },
    addInstance(tab, i) {
      const { tabWidth, tabKey, gap } = this;
      if (tab._instance) {
        tab._instance.setPosition(tab._x, 0);
        return;
      }
      const $content = this.$refs.content;
      const $item = this.$refs.item;
      const $el = $item.find((el) => el.classList.contains(`tab-${getKey(tab, tabKey)}`));
      tab._instance = new Draggabilly($el, {
        axis: "x",
        containment: $content,
        handle: ".tabs-main",
      });
      const x = (tabWidth - gap * 2) * i;
      tab._x = x;
      tab._instance.setPosition(x, 0);
      tab._instance.on("pointerDown", (e) => this.handlePointerDown(e, tab, i));
      tab._instance.on("dragMove", (e, pointer, moveVector) =>
        this.handleDragMove(e, moveVector, tab, i)
      );
      tab._instance.on("dragEnd", (e) => this.handleDragEnd(e, tab, i));
      tab._instance.on("staticClick", (e) => this.handleClick(e, tab, i));
    },
    addTab(...tabs) {
      const { insertToAfter, value, tabKey } = this;
      if (insertToAfter) {
        const i = this.tabs.findIndex((tab) => getKey(tab, tabKey) === value);
        this.tabs.splice(i + 1, 0, ...tabs);
      } else {
        this.tabs.push(...tabs);
      }
      this.$nextTick(() => {
        this.setup();
        this.doLayout();
      });
    },
    removeTab(key) {
      const { tabKey, tabs } = this;
      let index = -1;
      let targetTab = null;
      if (typeof tab === "number") {
        index = key;
        targetTab = this.tabs[index];
      } else {
        tabs.forEach((tab, i) => {
          if (getKey(tab, tabKey) === key) {
            index = i;
            targetTab = tab;
          }
        });
      }
      if (index >= 0 && targetTab) {
        this.handleDelete(targetTab, index);
      }
    },
    doLayout() {
      this.calcTabWidth();
      const { tabWidth, tabs, gap } = this;
      tabs.forEach((tab, i) => {
        const instance = tab._instance;
        const _x = (tabWidth - gap * 2) * i;
        tab._x = _x;
        instance.setPosition(_x, 0);
      });
    },
    handleDelete(tab, i) {
      if (typeof this.onClose === "function" && !this.onClose(tab, tab[this.tabKey], i)) {
        return false;
      }
      const { tabKey, tabs, value } = this;
      const index = tabs.findIndex((item) => getKey(item, tabKey) === value);
      let after, before;
      if (i === index) {
        after = tabs[i + 1];
        before = tabs[i - 1];
      }
      if (after) {
        this.$emit("input", getKey(after, tabKey));
      } else if (before) {
        this.$emit("input", getKey(before, tabKey));
      } else if (tabs.length <= 1) {
        this.$emit("input", null);
      }
      tabs.splice(i, 1);
      this.$emit("remove", tab, i);
      this.$nextTick(() => {
        this.doLayout();
      });
    },
    handleResize() {
      this.timer && clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.doLayout();
      }, 100);
    },
    handlePointerDown(e, tab, i) {
      const { tabKey, isMousedownActive } = this;
      isMousedownActive && this.$emit("input", getKey(tab, tabKey));
      this.$emit("dragstart", e, tab, i);
    },
    handleDragMove(e, moveVector, tab, i) {
      const { tabWidth, tabs, tabKey, gap } = this;
      const { instance, targetTab } = getInstanceAt(tabs, tab, tabWidth, tabKey, gap);
      if (instance) {
        this.swapTab(tab, targetTab);
      }
      this.$emit("dragging", e, targetTab, i);
    },
    handleDragEnd(e, tab) {
      const _instance = tab._instance;
      if (_instance.position.x === 0) return;
      setTimeout(() => {
        _instance.element.classList.add("move");
        _instance.setPosition(tab._x, 0);
      }, 50);
      setTimeout(() => {
        this.$emit("dragend", e, tab);
        _instance.element.classList.remove("move");
      }, 200);
    },
    handleClick(e, tab, index) {
      this.$emit("click", e, tab, index);
    },
    handleMenu(e, tab, index) {
      this.$emit("contextmenu", e, tab, index);
    },
    swapTab(tab, targetTab) {
      const { tabKey, tabs } = this;
      let index, targetIndex;
      for (let i = 0; i < tabs.length; i++) {
        if (getKey(tab, tabKey) === getKey(tabs[i], tabKey)) {
          index = i;
        }
        if (getKey(targetTab, tabKey) === getKey(tabs[i], tabKey)) {
          targetIndex = i;
        }
      }
      if (index !== targetIndex) {
        [tabs[index], tabs[targetIndex]] = [tabs[targetIndex], tabs[index]];
      }
      // swap x
      const _x = tab._x;
      tab._x = targetTab._x;
      targetTab._x = _x;

      // swap position
      const _instance = targetTab._instance;
      setTimeout(() => {
        _instance.element.classList.add("move");
        _instance.setPosition(_x, _instance.position.y);
      }, 50);
      setTimeout(() => {
        _instance.element.classList.remove("move");
        this.$emit("swap", tab, targetTab);
      }, 200);

      // refresh tabs
      this.tabs.splice(0, 0);
    },
    getTabs() {
      return this.tabs.map((tab) => {
        const item = {
          ...tab,
        };
        delete item._instance;
        delete item._x;
        return item;
      });
    },
    getKey(tab) {
      return getKey(tab, this.tabKey);
    },
  },
};
</script>

<style lang="less">
.vue-tabs-chrome {
  @bg: #dee1e6;
  @gap: 7px;
  @divider: #a9adb0;
  @speed: 150ms;

  padding-top: 10px;
  background-color: @bg;
  position: relative;

  .tabs-content {
    height: 34px;
    position: relative;
    overflow: hidden;
  }
  /* divider */
  .tabs-divider {
    left: 0;
    top: 50%;
    width: 1px;
    height: 20px;
    background-color: @divider;
    position: absolute;
    transform: translateY(-50%);
  }

  .tabs-item {
    height: 100%;
    display: flex;
    align-items: center;
    user-select: none;
    box-sizing: border-box;
    transition: width @speed;
    position: absolute;
    // animation: tab-show @speed;
    &:hover {
      .tabs-background-content {
        background-color: #f2f3f5;
      }
      .tabs-background-before,
      .tabs-background-after {
        fill: #f2f3f5;
      }
    }
    &.move {
      transition: @speed;
    }
    &.is-dragging {
      z-index: 3;
      .tabs-background-content {
        background-color: #f2f3f5;
      }
      .tabs-background-before,
      .tabs-background-after {
        fill: #f2f3f5;
      }
    }
    &.active {
      z-index: 2;
      .tabs-background {
        opacity: 1;
      }
      .tabs-background-content {
        background-color: #fff;
      }
      .tabs-background-before,
      .tabs-background-after {
        fill: #fff;
      }
    }
    &:first-of-type {
      .tabs-dividers::before {
        opacity: 0;
      }
    }
    &:last-of-type {
      .tabs-dividers::after {
        opacity: 0;
      }
    }
  }
  .tabs-main {
    height: 100%;
    left: 0;
    right: 0;
    margin: 0 @gap * 2;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    transition: @speed;
    display: flex;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
    overflow: hidden;
  }
  .tabs-close {
    top: 50%;
    right: @gap * 2;
    width: 16px;
    height: 16px;
    z-index: 1;
    position: absolute;
    transform: translateY(-50%);
  }
  .tabs-close-icon {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    &:hover {
      stroke: #000;
      background-color: #e8eaed;
    }
  }
  .tabs-favicon {
    height: 16px;
    margin-left: @gap;
    display: flex;
    align-items: center;
    overflow: hidden;
    img {
      height: 100%;
    }
  }
  .tabs-label {
    flex: 1;
    margin-left: @gap;
    margin-right: 16px;
    box-sizing: border-box;
    overflow: hidden;
    white-space: nowrap;
    &.no-close {
      margin-right: @gap;
    }
  }

  /* background */
  .tabs-background {
    width: 100%;
    height: 100%;
    padding: 0 @gap - 1px;
    position: absolute;
    transition: opacity @speed * 2;
    box-sizing: border-box;
  }
  .tabs-background-content {
    height: 100%;
    border-top-left-radius: @gap;
    border-top-right-radius: @gap;
    transition: background @speed;
  }
  .tabs-background-before,
  .tabs-background-after {
    bottom: -1px;
    position: absolute;
    fill: transparent;
    transition: background @speed;
  }
  .tabs-background-before {
    left: -1px;
  }
  .tabs-background-after {
    right: -1px;
  }

  .tabs-footer {
    height: 4px;
    background-color: #fff;
  }

  .tabs-after {
    top: 50%;
    display: flex;
    position: absolute;
    overflow: hidden;
    transform: translateY(-50%);
  }

  @keyframes tab-show {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }
}
.theme-dark {
  color: #9ca1a7;
  background-color: #202124;
  .tabs-item {
    &:hover {
      .tabs-background-content {
        background-color: #202124;
      }
      .tabs-background-before,
      .tabs-background-after {
        fill: transparent;
      }
    }
    &.is-dragging {
      .tabs-background-content {
        background-color: #202124;
      }
      .tabs-background-before,
      .tabs-background-after {
        fill: transparent;
      }
    }
    &.active {
      color: #fff;
      .tabs-background-content {
        background-color: #323639;
      }
      .tabs-background-before,
      .tabs-background-after {
        fill: #323639;
      }
    }
    .tabs-close-icon {
      stroke: #81878c;
      &:hover {
        stroke: #cfd1d2;
        background-color: #5f6368;
      }
    }
  }
  .tabs-divider {
    background-color: #4a4d51;
  }
  .tabs-footer {
    background-color: #323639;
  }
}
</style>
