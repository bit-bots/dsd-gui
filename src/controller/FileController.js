import File from "../entities/File";
import Utils from "../utils/Utils";
const fs = require("fs");

/**
 * FileController
 * Handle Writing and Reading files
 *
 */

export default class FileController {
  static loadDirectory(path) {
    const fileArray = [];
    fs.readdirSync(path).forEach((fileName) => {
      const projektPath = `${path}${Utils.getDir()}${fileName}`;
      const file = new File(
        projektPath,
        fileName,
        File.getFileType(fileName),
        File.isDirectory(projektPath)
      );
      fileArray.push(file);
    });
    return fileArray;
  }
  static updateFile(path, content) {
    fs.writeFileSync(path, content);
  }
  static fileInfo(path) {
    return new File(path, File.getFileName(path), File.getFileType(path), File.isDirectory(path));
  }
  static loadFile(path) {
    return fs.readFileSync(path, "utf8");
  }
  static createFile(path, filename, content) {
    if (!FileController.existFile(path)) {
      fs.mkdirSync(path);
    }
    fs.writeFileSync(path + Utils.getDir() + filename, content);
  }
  static existFile(path) {
    return fs.existsSync(path);
  }
}
