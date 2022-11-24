import { Color } from "custom-electron-titlebar";
import CacheController from "@/controller/CacheController";
import File from "@/entities/File";
import { UIEvent } from "@/entities/Events";

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
      this.initializeTitleMenu();
      window.addEventListener("DOMContentLoaded", () => {
        this.updateColor();
      });
    },
    updateTitleBar(title) {
      if (window.titlebar) {
        window.titlebar.updateTitle(title);
      }
    },
    updateColor() {
      if (window.titlebar) {
        window.titlebar.updateBackground(
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
          event: UIEvent.OPEN_PROJECT,
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
              event: UIEvent.OPEN_PROJECT,
            },
          ],
        },
        {
          label: "Close Project",
          event: UIEvent.closeProject,
        },
        { type: "separator" },
        {
          label: "Save All",
          accelerator: "Crtl + S",
          event: UIEvent.SAVE_ALL,
        },
        {
          label: "Reload From Disk",
          event: UIEvent.RELOAD_FROM_DISK,
        },
        { type: "separator" },
        {
          label: "Settings",
          event: UIEvent.OPEN_SETTINGS,
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ];
      const editTemplate = [
        {
          label: "Redo",
          accelerator: "Crtl + Shift + Z",
          event: UIEvent.REDO,
        },
        {
          label: "Undo",
          accelerator: "Crtl + Z",
          event: UIEvent.UNDO,
        },
        { type: "separator" },
        {
          label: "Cut",
          accelerator: "Crtl + X",
          event: UIEvent.CUT,
        },
        {
          label: "Copy",
          accelerator: "Crtl + C",
          event: UIEvent.COPY,
        },
        {
          label: "Paste",
          accelerator: "Crtl + V",
          event: UIEvent.PASTE,
        },
        { type: "separator" },
        {
          label: "Delete",
          accelerator: "Entf",
          event: UIEvent.DELETE,
        },
        { type: "separator" },
        {
          label: "Search Element",
          accelerator: "Crtl + F",
          event: UIEvent.SEARCH_ELEMENT,
        },
      ];
      const ViewTemplate = [
        {
          label: "Zoom In",
          accelerator: "mouse wheel up",
          event: UIEvent.ZOOM_IN,
        },
        {
          label: "Zoom Out",
          accelerator: "mouse wheel down",
          event: UIEvent.ZOOM_OUT,
        },
        {
          label: "Toggle Drag",
          accelerator: "mouse wheel pressed",
          event: UIEvent.TOGGLE_DRAG,
        },
        { type: "separator" },
        {
          label: "Restructure",
          accelerator: "Crtl + D",
          event: UIEvent.RESTRUCTURE,
        },
        {
          label: "Reload from DSD-File",
          event: UIEvent.RELOAD_FROM_FILE,
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

      window.electronMenu.buildFromTemplate(template);
    },
  },
};
