export default class ProjectConfiguration {
  constructor(id, projectName, behaviorModuleName, dsdFileName, graphConfig, graphAttrs) {
    this.id = id;
    this.projectName = projectName;
    this.behaviorModuleName = behaviorModuleName;
    this.dsdFileName = dsdFileName;
    this.graphConfig = graphConfig ? graphConfig : {};
    this.graphAttrs = graphAttrs ? graphAttrs : {};
  }
}
