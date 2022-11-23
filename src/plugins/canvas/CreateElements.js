import { ELEMENT_TYPE } from "../../enumerates/ElementType";
import vuetify from "../vuetify";
import store from "../../store/index";
import EditorUtils from "./EditorUtils";

export default class CreateElements {
  static createElement(node) {
    let element = undefined;
    switch (node.customItem.type) {
      case ELEMENT_TYPE.ACTION:
        if (node.periode) {
          const target = CreateElements.createAction(node.customItem, node.customAttr);
          const select = CreateElements.createElement(node.periode);
          CreateElements.concatActionElement(select, target);
          element = target;
        } else {
          element = CreateElements.createAction(node.customItem, node.customAttr);
        }
        break;
      case ELEMENT_TYPE.DECISION:
        element = CreateElements.createDecision(node.customItem, node.customAttr);
        break;
      case ELEMENT_TYPE.SUBTREE:
        element = CreateElements.createSubtree(node.customItem, node.customAttr);
        break;
      case ELEMENT_TYPE.ENTRY:
        element = CreateElements.createEntry(node.customItem, node.customAttr);
        break;
      default:
        element = CreateElements.createError(node.customItem, node.customAttr);
        break;
    }
    const uuid1 = node.uuid1 ? node.uuid1 : EditorUtils.uuidv1();
    if (!node.uuid1) {
      console.log("no uuid1 saved");
    }
    element.id(element.id() + "$" + uuid1);
    element.addName(uuid1);
    element.setAttr("customItem", node.customItem);
    element.setAttr("customAttr", node.customAttr);
    return element;
  }

  static concatActionElement(selected, target) {
    const height = Math.min(selected.size().height, target.size().height);
    if (target.hasName("periode")) {
      //while target is periode search recrusive for the last element, which is not already a periode element
      const lastElement = target.findOne("Group");
      const additionalWidth = this.concatActionElement(selected, lastElement);
      target.size({
        width: target.size().width + additionalWidth,
        height: target.size().height,
      });
      return additionalWidth;
    } else {
      // last element found
      // append selected and declare the element as periode
      target.addName("periode");
      const newElement = this.createActionPeriodeElement(selected, height);
      newElement.addName("periode container");
      newElement.x(target.size().width);
      target.add(newElement);
      target.size({
        width: target.size().width + newElement.size().width,
        height: target.size().height,
      });
      return newElement.size().width;
    }
  }
  static createActionPeriodeElement(selected, height) {
    const container = new Konva.Group({ draggable: false });
    const connector = new Konva.Rect({
      height: height - 5,
      width: 10,
      listening: false,
      x: 0,
      y: 5,
      fill: "#82B1FF",
      name: "connector background",
    });
    container.add(connector);
    const clone = selected.clone();
    clone.x(10);
    clone.y(0);
    container.add(clone);
    container.size({
      width: clone.size().width + 10,
      height: clone.size().height,
    });
    return container;
  }
  static createAction(element, attributes) {
    const group = CreateElements.createContainerGroup(element);
    const rect = new Konva.Rect({
      fill: this.accentColor(),
      name: "background",
      draggable: false,
      cornerRadius: [5, 5, 0, 0],
      width: 100,
      height: 100,
    });
    group.add(rect);
    CreateElements.createTitle(element, group);
    CreateElements.createParams(element, attributes, group);
    rect.width(group.width());
    rect.height(group.height());
    return group;
  }
  static createSubtree(element, attributes) {
    const group = CreateElements.createContainerGroup(element);
    const rect = new Konva.Rect({
      fill: this.accentColor(),
      name: "background",
      draggable: false,
      cornerRadius: [30, 30, 30, 30],
      width: 100,
      height: 100,
    });
    group.add(rect);
    CreateElements.createTitle(element, group);
    rect.width(group.width() + 20);
    rect.height(group.height());
    return group;
  }
  static createDecision(element, attributes) {
    const group = CreateElements.createContainerGroup(element);
    const rect = new Konva.Rect({
      fill: this.accentColor(),
      name: "background",
      draggable: false,
      cornerRadius: 5,
      width: 100,
      height: 100,
    });
    group.add(rect);
    CreateElements.createTitle(element, group);
    CreateElements.createOutputs(element, group);
    CreateElements.createParams(element, attributes, group);
    rect.width(group.width());
    rect.height(group.height());
    return group;
  }
  static createError() {
    const group = new Konva.Group({
      id: element.uuid,
      name: "object",
      draggable: true,
      cursor: "pointer",
    });
    const name = new Konva.Text({
      text: "Error",
      height: 10,
      align: "center",
      fontSize: 8,
      fill: "#82B1FF",
      y: 5,
      x: 10,
    });
    const title = new Konva.Text({
      text: element.name,
      x: 10,
      fill: "#82B1FF",
      y: 10,
      align: "center",
      verticalAlign: "middle",
      height: 30,
    });
    const rect = new Konva.Rect({
      fill: this.accentColor(),
      name: "background",
      draggable: false,
      width: 100,
      height: 100,
    });
    group.add(rect);
    group.add(name);
    group.add(title);
    return group;
  }
  static createEntry(element) {
    const group = CreateElements.createContainerGroup(element);
    const rect = new Konva.Rect({
      fill: this.accentColor(),
      name: "background",
      draggable: false,
      cornerRadius: [5, 5, 5, 5],
      width: 100,
      height: 100,
    });
    group.add(rect);
    CreateElements.createTitle(element, group);
    rect.width(group.width());
    rect.height(group.height());
    return group;
  }

  static createContainerGroup(element) {
    return new Konva.Group({
      id: element.uuid,
      name: "object " + element.type + " " + element.uuid,
      draggable: true,
      cursor: "pointer",
    });
  }
  static createParams(element, attributes, group) {
    let maxWidth = group.width() - 20;
    const params = [];
    if (element.parameters && element.parameters.length > 0) {
      for (let i = 0; i < element.parameters.length; i++) {
        let value = "-";
        if (attributes && attributes.parameters) {
          for (let x = 0; x < attributes.parameters.length; x++) {
            if (attributes.parameters[x].name === element.parameters[i].name) {
              if (attributes.parameters[x].value) {
                value = attributes.parameters[x].value;
              }
            }
          }
        }
        params.push(
          new Konva.Text({
            text: element.parameters[i].name + ":     " + value,
            align: "center",
            verticalAlign: "middle",
            id: element.parameters.name,
            name: "paramName",
            x: 10,
            y: group.height() + i * 20,
            fill: this.titleTextColor(),
            height: 20,
          })
        );
        if (params[i].width() > maxWidth) {
          maxWidth = params[i].width();
        }
      }
      const paramBackground = new Konva.Rect({
        x: 0,
        y: group.height(),
        fill: this.backgroundColor(),
        height: params.length * 20,
        width: maxWidth + 20,
        strokeWidth: 2,
        stroke: this.strokeColor(),
      });
      if (maxWidth > group.width() - 20) {
        group.findOne(".elementName").width(maxWidth);
        group.findOne(".typeName").width(maxWidth);
        group.findOne(".titleBackground").width(maxWidth + 20);
        if (element.type === ELEMENT_TYPE.DECISION) {
          group.findOne(".outputsBackground").width(maxWidth + 20);
          group
            .find(".outputText")
            .toArray()
            .forEach((output) => {
              output.width(maxWidth);
            });
        }
      }
      group.add(paramBackground);
      params.forEach((param) => group.add(param));
      group.width(maxWidth + 20);
      group.height(group.height() + paramBackground.height());
    }
    return;
  }
  static createOutputs(element, group) {
    let maxWidth = group.width() - 20;
    const outputTexts = [];
    const outputConnectors = [];
    if (element.outputs !== undefined && element.outputs.length > 0) {
      for (let i = 0; i < element.outputs.length; i++) {
        const output = element.outputs[i];
        outputTexts.push(
          new Konva.Text({
            text: output.name,
            align: "right",
            verticalAlign: "middle",
            fill: this.accentColor(),
            x: 20,
            hitStrokeWidth: 10,
            name: "outputText",
            y: 40 + i * 20,
            height: 20,
          })
        );
        if (outputTexts[i].width() > maxWidth) {
          maxWidth = outputTexts[i].width();
        }
      }
      for (let i = 0; i < element.outputs.length; i++) {
        const output = element.outputs[i];
        outputConnectors.push(
          new Konva.Circle({
            radius: 6,
            fill: this.accentColor(),
            x: 20 + maxWidth,
            y: 50 + i * 20,
            hitStrokeWidth: 20,
            cursor: "grab",
            id: output.name,
            name: "output",
            color: output.color,
          })
        );
      }
      const input = new Konva.Circle({
        radius: 6,
        fill: this.accentColor(),
        x: 0,
        y: 30 + Math.round((outputTexts.length * 20) / 2),
        name: "input",
      });
      const outputsBackground = new Konva.Rect({
        x: 0,
        y: 40,
        width: maxWidth + 20,
        height: outputTexts.length * 20,
        strokeWidth: 2,
        stroke: this.strokeColor(),
        name: "outputsBackground",
        fill: this.backgroundColor(),
      });
      if (maxWidth > group.width() - 20) {
        group.findOne(".elementName").width(maxWidth);
        group.findOne(".typeName").width(maxWidth);
        group.findOne(".titleBackground").width(maxWidth + 20);
      }
      group.add(input);
      for (let i = 0; i < outputTexts.length; i++) {
        group.add(outputConnectors[i]);
      }
      group.add(outputsBackground);
      for (let i = 0; i < outputTexts.length; i++) {
        const width = outputTexts[i].width();
        outputTexts[i].x(20 + maxWidth - 5 - width);
        group.add(outputTexts[i]);
      }
      group.width(maxWidth + 20);
      group.height(group.height() + outputTexts.length * 20);
      return;
    }
    const input = new Konva.Circle({
      radius: 6,
      fill: this.accentColor(),
      x: 0,
      y: 60,
      name: "input",
    });
    const outputsBackground = new Konva.Rect({
      x: 0,
      y: 40,
      width: maxWidth + 20,
      height: 40,
      strokeWidth: 2,
      stroke: this.strokeColor(),
      name: "outputsBackground",
      fill: this.backgroundColor(),
    });
    group.add(input);
    group.add(outputsBackground);
    group.width(maxWidth + 20);
    group.height(group.height() + 40);
    return;
  }
  static createTitle(element, group) {
    let maxWidth = group.width();
    const name = new Konva.Text({
      text: element.name,
      x: 10,
      y: 10,
      align: "center",
      verticalAlign: "middle",
      name: "elementName",
      fill: this.titleTextColor(),
      height: 30,
    });
    if (name.width() > maxWidth) {
      maxWidth = name.width();
    }
    const type = new Konva.Text({
      text: element.type,
      height: 10,
      align: "center",
      verticalAlign: "middle",
      fontSize: 8,
      name: "typeName",
      fill: this.titleTextColor(),
      y: 5,
      x: 10,
    });
    if (type.width() > maxWidth) {
      maxWidth = type.width();
    }
    let titleBackground = undefined;
    if (element.type === ELEMENT_TYPE.SUBTREE) {
      titleBackground = new Konva.Rect({
        x: 0,
        y: 0,
        width: maxWidth + 40,
        height: 40,
        strokeWidth: 2,
        stroke: this.strokeColor(),
        cornerRadius: [30, 30, 30, 30],
        name: "titleBackground",
        fill: this.backgroundColor(),
      });
    } else if (element.type === ELEMENT_TYPE.DECISION) {
      titleBackground = new Konva.Rect({
        x: 0,
        y: 0,
        width: maxWidth + 20,
        height: 40,
        strokeWidth: 2,
        stroke: this.strokeColor(),
        cornerRadius: [5, 5, 0, 0],
        name: "titleBackground",
        fill: this.backgroundColor(),
      });
    } else {
      titleBackground = new Konva.Rect({
        x: 0,
        y: 0,
        width: maxWidth + 20,
        height: 40,
        strokeWidth: 2,
        stroke: this.strokeColor(),
        cornerRadius: [5, 5, 0, 0],
        name: "titleBackground",
        fill: this.backgroundColor(),
      });
    }
    type.width(maxWidth);
    name.width(maxWidth);
    if (element.type === ELEMENT_TYPE.ACTION || element.type === ELEMENT_TYPE.SUBTREE) {
      const input = new Konva.Circle({
        radius: 6,
        fill: this.accentColor(),
        x: 0,
        y: 20,
        name: "input",
      });
      group.add(input);
    }
    if (element.type === ELEMENT_TYPE.ENTRY) {
      /*
            const output = new Konva.Circle({
                                                radius: 6,
                                                fill: this.accentColor(),
                                                x: 20 + maxWidth,
                                                y: 20,
                                                cursor: 'grab',
                                                id:  element.outputs[0].name,
                                                name: 'output',
                                                color: element.outputs[0].color

                                           })
            group.add(output)
             */
      const input = new Konva.Circle({
        radius: 6,
        fill: this.accentColor(),
        x: maxWidth + 20,
        y: 20,
        cursor: "grab",
        name: "output",
        id: element.outputs[0].name,
        color: element.outputs[0].name,
      });
      group.add(input);
    }
    group.add(titleBackground);
    group.add(type);
    group.add(name);
    group.width(maxWidth + 20);
    group.height(group.height() + 40);
    return;
  }

  static accentColor() {
    return this.color("accent");
  }
  static backgroundColor() {
    return this.color("primary");
  }
  static titleTextColor() {
    return this.color("primaryText");
  }
  static strokeColor() {
    return this.color("primaryText");
  }
  static color(name) {
    return vuetify.framework.theme.themes[this.themeName()][name];
  }
  static themeName() {
    if (store.state.theme.darkMode) {
      return "dark";
    }
    return "light";
  }
}
