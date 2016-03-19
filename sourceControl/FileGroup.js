"use strict";

let fs = require("fs");
let path = require("path");

const ROUTE_PARAM_REGEX = /{([^}]+)}/g;
const BRACKETS_REGEX = /[{}]/g;

module.exports = class FileGroup {
  
  constructor(config) {
    this._pathTemplate = config.pathTemplate;
    this._repository = config.repository;;
  }
  
  _toPath(pathParameters) {
    path.join(this._pathTemplate.replace(ROUTE_PARAM_REGEX, (match, prop) => pathParameters[prop]));
  }
  
  _fromPath(filePath) {
    let match;
    let paramNames = [];
    while (match = ROUTE_PARAM_REGEX.exec(this._fileRouting)) {
      paramNames.push(match[1]);
    }
    let pathParameters = {};
    let routeParts = this._fileRouting.split(BRACKETS_REGEX);
    for (let name of paramNames) {
      let index = routeParts.indexOf(name);
      let before = index <= 0 ? "" : routeParts[index-1];
      let after = routeParts[index+1];
      let indexBefore = before ? 0 : filePath.indexOf(before);
      let indexAfter = filePath.indexOf(after);
      let value = filePath.substring(indexBefore+before.length,indexAfter);
      pathParameters[name] = value;
    }
    return pathParameters;
  }
  
  update(pathParameters, updateAction) {
    return new Promise((resolve, reject) => {
      this.read(pathParameters)
      .then(fileObject => {
        if (fileObject === null) { fileObject = {}; }
        updateAction(fileObject);
        return this.write(fileObject);
      })
      .then(() => resolve())
      .catch(err => reject(err));
    });
  }
  
  write(pathParameters, fileObject) {
    return new Promise((resolve, reject) => {
      let relativePath = this._toPath(pathParameters);
      let absolutePath = path.join(this._repository.basePath,"/",relativePath);
      this.serialize(fileObject)
      .then(fileText => fs.writeFile(absolutePath, fileText, err => {
        if (err) {
          reject(err);
          return;
        }
        this._repository.add(relativePath).then(() => resolve, err => reject(err));
      }))
      .catch(err => reject(err));
    });
  }
  
  read(pathParameters) {
    return new Promise((resolve, reject) => {
      let path = this._toPath(pathParameters);
      fs.stat(path, (err, status) => {
        if (err) {
          reject(err);
          return;
        }
        if (!status.isFile()) {
          resolve(null);
          return;
        }
        fs.readFile(path, "utf8", (err, text) => err ? reject(err) : resolve(text));
      });
    });
  }
  
  serialize() {
    throw new Error("Serialize method must be overridden");
  }
  
  deserialize() {
    throw new Error("Serialize method must be overridden");
  }
  
  afterRead(pathParams, absolutePath) {
    // do nothing by default
    return new Promise((resolve) => resolve());
  }
}