import { BrowserWindow, Menu, ipcMain } from "electron";

export default () => {
  if (process.type !== "browser") return;

  // send menu to renderer title bar process
  ipcMain.handle("request-application-menu", async () =>
    JSON.parse(
      JSON.stringify(Menu.getApplicationMenu(), (key: string, value) =>
        key !== "commandsMap" && key !== "menu" ? value : undefined
      )
    )
  );

  ipcMain.on("window-event", (event, eventName: string) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    switch (eventName) {
      case "window-minimize":
        if (window) {
          window.minimize();
        }
        break;
      case "window-maximize":
        if (window) {
          window.isMaximized() ? window.unmaximize() : window.maximize();
        }
        break;
      case "window-close":
        if (window) {
          window.close();
        }
        break;
      case "window-is-maximized":
        if (window) {
          event.returnValue = window.isMaximized();
        }
        break;
    }
  });

  ipcMain.on("menu-event", (event, commandId: number) => {
    const item = getMenuItemByCommandId(commandId, Menu.getApplicationMenu());
    if (item) {
      item.click(undefined, BrowserWindow.fromWebContents(event.sender), event.sender);
    }
  });
};

function getMenuItemByCommandId(
  commandId: number,
  menu: Electron.Menu | null
): Electron.MenuItem | undefined {
  const items = menu && menu.items ? menu.items : [];
  for (const item of items) {
    if (item.submenu) {
      const submenuItem = getMenuItemByCommandId(commandId, item.submenu);
      if (submenuItem) {
        return submenuItem;
      }
    } else if (item.commandId === commandId) {
      return item;
    }
  }

  return undefined;
}
