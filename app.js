"use strict";

let path = require("path");
let Server = require("./web/Server");
let ResourcesApi = require("./web/ResourcesApi");
let ResourcesUi = require("./web/ResourcesUi");
let SassRepository = require("./sass/SassRepository");
let YamlConfigRepository = require("./config/YamlConfigRepository");
let sassType = require("./sass/type");
let log = require("./logging/logger");

// set up styles
const styleSchema = {
  backgroundColor: sassType.COLOR,
  foregroundColor: sassType.COLOR,
  altColor: sassType.COLOR,
  altColor2: sassType.COLOR,
  altColor3: sassType.COLOR,
  primaryFont: sassType.FONT_FAMILY,
  headerFont: sassType.FONT_FAMILY,
  textConfig: sassType.BLOCK,
  headerConfig:  sassType.BLOCK,
  footerConfig: sassType.BLOCK,
  customStyles: sassType.BLOCK
};

let styles = new SassRepository(
  "Styles",
  path.resolve("./.data/styles"),
  "style-{styleId}.scss",
  styleSchema, 
  path.resolve("./.data/dev/styles"), 
  path.resolve("./.data/prod/styles"));
  
// Website Setup

let websiteRepository = websiteId => 
  new YamlConfigRepository(
    `Site ${websiteId} Configuration`, 
    path.resolve(`./.data/sites/${websiteId}`), 
    "{configName}.yaml");

// Web Endpoints
let resourcesApi = new ResourcesApi("/api", styles, websiteRepository);
let resourcesUi = new ResourcesUi("/", styles, websiteRepository);
let server = new Server([resourcesUi, resourcesApi]);
server.start();