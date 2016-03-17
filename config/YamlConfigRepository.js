"use strict";

let Repository = require("./../sourceControl/Repository");
let YAML = require("yamljs");

module.exports = class JsonConfigRepository extends Repository {
  
  constructor(name, baseDirectory, fileRoute) {
    super(name, baseDirectory, fileRoute);
  }
  
  serialize(object) {
    return new Promise((resolve, reject) => {
      resolve(YAML.stringify(object, 5, 2));
    });
  }
  
  deserailize(text) {
    return new Promise((resolve, reject) => {
      resolve(YAML.parse(text));
    });
  }
};