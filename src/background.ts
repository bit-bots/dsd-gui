import path from "path";
import { app, App, BrowserWindow, ipcMain, protocol } from "electron";
import Store from "electron-store";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import { MenuBuilder, MenuTemplateItem } from "./electron/Menu";
// @TODO: create pull request for custom code to not be required due to
// https://github.com/AlexTorresSk/custom-electron-titlebar/issues/188
// or drop dependency all together as we could use the default menubar
import { attachTitlebarToWindow, setupTitlebar } from "./patches/index";

const isDevelopment = process.env.NODE_ENV !== "production";
const isNodeIntegrated = Boolean(process.env.ELECTRON_NODE_INTEGRATION);

Store.initRenderer();
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

setupTitlebar();
registerAppEventHandlers(app);

function setupMenu(browserWindow: BrowserWindow) {
  const menuBuilder = new MenuBuilder(browserWindow);

  ipcMain.handle("menu.buildFromTemplate", (_, menuTemplate: MenuTemplateItem[]) => {
    try {
      menuBuilder.buildFromTemplate(menuTemplate).setApplicationMenu();
    } catch (e) {
      console.error(e);
    }
  });

  attachTitlebarToWindow(browserWindow);
}

async function renderApp(browserWindow: BrowserWindow) {
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await browserWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    browserWindow.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    browserWindow.loadURL("app://./index.html");
  }
}

async function createWindow() {
  const browserWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: isNodeIntegrated,
      contextIsolation: !isNodeIntegrated,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  setupMenu(browserWindow);
  await renderApp(browserWindow);
}

function registerAppEventHandlers(app: App) {
  // Quit when all windows are closed.
  app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on("ready", async () => {
    if (isDevelopment && !process.env.IS_TEST) {
      try {
        await installExtension(VUEJS_DEVTOOLS);
      } catch (e) {
        console.error("Vue Devtools failed to install:", e);
      }
    }

    createWindow();
  });

  // Exit cleanly on request from parent process in development mode.
  if (isDevelopment) {
    if (process.platform === "win32") {
      process.on("message", (data) => {
        if (data === "graceful-exit") {
          app.quit();
        }
      });
    } else {
      process.on("SIGTERM", () => {
        app.quit();
      });
    }
  }
}
