import { ipcRenderer } from "electron";
import { Titlebar } from "custom-electron-titlebar";

window.addEventListener("DOMContentLoaded", () => {
  window.titlebar = new Titlebar({ icon: "/img/logo.png" });

  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

const electronMenu = {
  buildFromTemplate: async (template) => ipcRenderer.invoke("menu.buildFromTemplate", template),
};

const integrations = { electronMenu };

Object.assign(window, integrations);
