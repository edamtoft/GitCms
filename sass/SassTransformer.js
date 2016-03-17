"use strict";

let types = require("./type");
let log = require("./../logging/logger");


const UNCAMELCASE_REGEX = /([a-z])([A-Z])/g;
const IMPORT_REGEX = /@import '([^']+)';/;

class SassTransformer {
  constructor(schema) {
    this._schema = schema;
  }
  
  toSass(object) {
    return new Promise((resolve, reject) => {
      let lines = [];
      for (let name in this._schema) {
        let type = this._schema[name];
        let value = object[name];
        if (!value) { continue; }
        let sassName = SassTransformer.toSassPropertyName(name);
        switch (type) {
          case types.BLOCK:
            lines.push(`/* start block ${name} */\r\n${value}\r\n/* end block ${name} */`);
            break;
          case types.IMPORT:
            lines.push(`/* import ${name} */\r\n@import '${value}';`);
            break;
          default:
            lines.push(`${sassName}: ${value};`); 
            break;
        }
      }
      resolve(lines.join("\r\n"));
    });
  }
  
  fromSass(sass) {
    return new Promise((resolve, reject) => {
      let lines = sass.split(/[\r\n]+/g);
      let output = {};
      for (let name in this._schema) {
        let type = this._schema[name];
        switch(type) {
          case types.BLOCK:
            let blockHeader = `/* start block ${name} */\r\n`;
            let blockFooter = `\r\n/* end block ${name} */`;
            let blockStartIndex = sass.indexOf(blockHeader)+blockHeader.length;
            let blockEndIndex = sass.indexOf(blockFooter);
            if (blockStartIndex === -1 || blockEndIndex === -1) {
              continue;
            }
            let blockContent = sass.substring(blockStartIndex, blockEndIndex);
            output[name] = blockContent;
            break;
          case types.IMPORT:
            let importNameLineIndex = lines.indexOf(`/* import ${name} */`);
            if (importNameLineIndex === -1) {
              continue;
            }
            let importLine = lines[importNameLineIndex+1];
            let lineMatch = IMPORT_REGEX.exec(importLine);
            if (!lineMatch) {
              continue;
            }
            output[name] = lineMatch[1].
            break;
          default:
            let sassName = SassTransformer.toSassPropertyName(name);
            let variableLine = lines.filter(line => line.indexOf(`${sassName}`) === 0)[0];
            if (!variableLine) {
              continue;
            }
            let variableName = `${sassName}: `;
            let variableStartIndex = variableLine.indexOf(variableName)+variableName.length;
            let lineEnd = variableLine.indexOf(";");
            let variableValue = variableLine.substring(variableStartIndex, lineEnd);
            output[name] = variableValue;
        }
      }
      resolve(output);
    });
  }
  
  static toSassPropertyName(name) {
    return "$"+name.replace(UNCAMELCASE_REGEX, "$1-$2").toLowerCase();
  }
  
  static unCamelCaseName(name) {
    return name.replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s/g).map(word => word[0].toUpperCase()+word.substring(1))
    .join(" ");
  }
}

module.exports = SassTransformer;