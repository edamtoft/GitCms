"use strict";

let RouteProvider = require("./RouteProvider");
let SassTransformer = require("./../sass/SassTransformer");
let types = require("./../sass/type");

class ResourcesUi extends RouteProvider {
  
  constructor(base, styleDirectory, websiteConfig) {
    super(base);
    this._styleDirectory = styleDirectory;
    this._websiteDirectory = websiteConfig;
    this._defineRoutes();
  }
  
  _defineRoutes() {
    this.on.get("/styles/style/", (req,res) => this._renderStyle(res));
    this.on.get("/styles/", (req,res) => this._renderStyleStatus(res));
    this.on.get("/site/config", (req,res) => this._renderSiteConfig(res));
    this.on.get("/site/:siteId/status", (req,res) => this._renderSiteConfigStatus(req.params.siteId, res));
  }
  
  _renderSiteConfig(res) {
    res.render("sites/siteData");
  }
  
  _renderSiteConfigStatus(siteId, res) {
    this._websiteDirectory(siteId).getStatus()
    .then(config => {
      res.locals.siteId = siteId;
      res.locals.config = config;
      res.render("sites/status");
    });
  }

  _renderStyle(res) {
    let schemaArray = ResourcesUi._objectToArray(this._styleDirectory.schema)
    .map(schema => ({
      name: schema.key,
      type: schema.value,
      sassName: SassTransformer.toSassPropertyName(schema.key),
      readableName: SassTransformer.unCamelCaseName(schema.key)
    }));
    res.locals.properties = schemaArray;
    res.locals.types = types;
    res.render("styles/style");
  }
  
  _renderStyleStatus(res) {
    this._styleDirectory.getStatus()
    .then(styles => {
      res.locals.styles = styles;
      res.render("styles/status");
    });
  }
  
  static _objectToArray(object) {
    let output = [];
    for (let key in object) {
      output.push({key: key, value: object[key]});
    }
    return output;
  }
  
}

module.exports = ResourcesUi;