import { BrowserWindow, Menu, MenuItemConstructorOptions } from "electron";
import { UIEvent } from "../entities/Events";

export interface MenuTemplateItem extends MenuItemConstructorOptions {
  event?: UIEvent;
  submenu?: MenuTemplateItem[];
}

export class MenuBuilder {
  private menu?: Menu;

  constructor(private window: BrowserWindow) {}

  buildFromTemplate(template: MenuTemplateItem[]): MenuBuilder {
    const menuConfig = template.map((menuItem) => this.addClickHandler(menuItem));
    this.menu = Menu.buildFromTemplate(menuConfig);
    return this;
  }

  setApplicationMenu() {
    if (this.menu) {
      Menu.setApplicationMenu(this.menu);
    } else {
      throw Error("Menu was not built from template yet!");
    }
  }

  private addClickHandler(menuItem: MenuTemplateItem): MenuTemplateItem {
    if (menuItem.event) {
      menuItem.click = () => this.window.webContents.send(menuItem.event as UIEvent);
    }

    if (menuItem.submenu) {
      menuItem.submenu = menuItem.submenu.map((menuItem) => this.addClickHandler(menuItem));
    }

    return menuItem;
  }
}
