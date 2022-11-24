import CacheController from "@/controller/CacheController";
import { Color } from "custom-electron-titlebar";
import File from "@/entities/File";
const customTitlebar = require("custom-electron-titlebar");
const remote = require("electron").remote;

export default {
  data: () => ({
    titlebar: undefined,
  }),
  computed: {
    theme() {
      return this.$store.state.theme;
    },
  },
  watch: {
    theme: {
      handler() {
        this.updateColor();
      },
      deep: true,
    },
  },
  methods: {
    initializeTitleBar() {
      window.addEventListener("DOMContentLoaded", () => {
        this.titlebar = new customTitlebar.Titlebar({
          backgroundColor: customTitlebar.Color.fromHex(
            this.$vuetify.theme.currentTheme.primary.toString()
          ),
          icon: require("@/assets/logo.png"),
        });
        this.titlebar.setHorizontalAlignment("center");
        this.initializeTitleMenu();
        this.updateColor();

        const replaceText = (selector, text) => {
          const element = document.getElementById(selector);
          if (element) element.innerText = text;
        };

        for (const type of ["chrome", "node", "electron"]) {
          replaceText(`${type}-version`, process.versions[type]);
        }
      });
    },
    updateTitleBar(title) {
      if (this.titlebar) {
        this.titlebar.updateTitle(title);
      }
    },
    updateColor() {
      if (this.titlebar) {
        this.titlebar.updateBackground(
          Color.fromHex(
            this.$store.state.theme.darkMode
              ? this.$vuetify.theme.themes.dark.primary
              : this.$vuetify.theme.themes.light.primary
          )
        );
      }
    },
    initializeTitleMenu() {
      const recentProjectIds = CacheController.getRecentProjectIds();
      const displayProjects = [];
      for (let i = 0; i < recentProjectIds.length; i++) {
        const recentProject = CacheController.getLocalProjectConfiguration(recentProjectIds[i]);
        displayProjects.push({ label: File.getFileName(recentProject.path) });
      }
      const isMac = process.platform === "darwin";
      const fileTemplate = [
        {
          label: "Open Project",
          click: () => this.$eventHub.$emit("OPEN_PROJECT"),
        },
        {
          label: "Recent Projects",
          submenu: [
            ...displayProjects,
            {
              type: "separator",
            },
            {
              label: "Other",
              click: () => this.$eventHub.$emit("OPEN_PROJECT"),
            },
          ],
        },
        {
          label: "Close Project",
          click: () => this.$eventHub.$emit("CLOSE_PROJECT"),
        },
        { type: "separator" },
        {
          label: "Save All",
          accelerator: "Crtl + S",
          click: () => this.$eventHub.$emit("SAVE_ALL"),
        },
        {
          label: "Reload From Disk",
          click: () => location.reload(),
        },
        { type: "separator" },
        {
          label: "Settings",
          click: () => this.$eventHub.$emit("OPEN_SETTINGS"),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ];
      const editTemplate = [
        {
          label: "Redo",
          accelerator: "Crtl + Shift + Z",
          click: () => this.$eventHub.$emit("REDO"),
        },
        {
          label: "Undo",
          accelerator: "Crtl + Z",
          click: () => this.$eventHub.$emit("UNDO"),
        },
        { type: "separator" },
        {
          label: "Cut",
          accelerator: "Crtl + X",
          click: () => this.$eventHub.$emit("CUT"),
        },
        {
          label: "Copy",
          accelerator: "Crtl + C",
          click: () => this.$eventHub.$emit("COPY"),
        },
        {
          label: "Paste",
          accelerator: "Crtl + V",
          click: () => this.$eventHub.$emit("PASTE"),
        },
        { type: "separator" },
        {
          label: "Delete",
          accelerator: "Entf",
          click: () => this.$eventHub.$emit("DELETE"),
        },
        { type: "separator" },
        {
          label: "Search Element",
          accelerator: "Crtl + F",
          click: () => this.$eventHub.$emit("SEARCH_ELEMENT"),
        },
      ];
      const ViewTemplate = [
        {
          label: "Zoom In",
          accelerator: "mouse wheel up",
          click: () => this.$eventHub.$emit("ZOOM_IN"),
        },
        {
          label: "Zoom Out",
          accelerator: "mouse wheel down",
          click: () => this.$eventHub.$emit("ZOOM_OUT"),
        },
        {
          label: "Toggle Drag",
          accelerator: "mouse wheel pressed",
          click: () => this.$eventHub.$emit("TOGGLE_DRAG"),
        },
        { type: "separator" },
        {
          label: "Restructure",
          accelerator: "Crtl + D",
          click: () => this.$eventHub.$emit("RESTRUCTURE"),
        },
        {
          label: "Reload from DSD-File",
          click: () => this.$eventHub.$emit("RELOAD_FROM_FILE"),
        },
      ];
      const template = [
        {
          label: "File",
          submenu: fileTemplate,
        },
        {
          label: "Edit",
          submenu: editTemplate,
        },
        {
          label: "View",
          submenu: ViewTemplate,
        },
      ];
      const menu = remote.Menu.buildFromTemplate(template);
      this.titlebar.updateMenu(menu);
    },
  },
};
