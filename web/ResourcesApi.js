"use strict";

let log = require("./../logging/logger");
let RouteProvider = require("./RouteProvider");

class ResourcesApi extends RouteProvider {
  
  constructor(base, styleDirectory, websiteConfig) {
    super(base);
    this._styleDirectory = styleDirectory;
    this._websiteDirectory = websiteConfig;
    this._defineRoutes();
  }
  
  _defineRoutes() {
    this.on.get("/styles/style/:styleId", (req,res) => this._readStyle(req.params.styleId, res));
    this.on.put("/styles/style/:styleId", (req,res) => this._saveStyle(req.body, req.params.styleId, res));
    this.on.post("/styles/style/:styleId/publish", (req, res) => this._publishStyles(req.params.styleId, req.body.commitMessage, res));
    this.on.get("/styles/style/:styleId/diff", (req,res) => this._getStyleDiff(req.params.styleId, res));
    this.on.get("/sites/site/:websiteId/config/:configName", (req, res) => this._getConfig(req.params.websiteId, req.params.configName, res));
    this.on.put("/sites/site/:websiteId/config/:configName", (req, res) => this._putConfig(req.params.websiteId, req.params.configName, req.body, res));
    this.on.post("/sites/site/:websiteId/config/:configName/publish", (req, res) => this._publishConfig(req.params.websiteId, req.params.configName, req.body.commitMessage, res));
    this.on.get("/sites/site/:websiteId/config/:configName/diff", (req,res) => this._getConfigDiff(req.params.websiteId, req.params.configName, res));
    this.on.get("/sites/site/:websiteId/diff", (req, res) => this._getSiteDiff(req.params.websiteId, res));
  }
  
  _getSiteDiff(websiteId, res) {
    this._websiteDirectory(websiteId).buildDiff()
    .then(diff => res.json(diff))
  }
  
  _getStyleDiff(styleId, res) {
    this._styleDirectory.getDiff({styleId})
    .then(diffs => res.json(diffs))
    .catch(err => res.sendStatus(410));
  }
  
  _getConfigDiff(websiteId, configName, res) {
    this._websiteDirectory(websiteId).getDiff({configName})
    .then(diffs => res.json(diffs)).catch(err => res.sendStatus(410));
  }
  
  _readStyle(styleId, res) {
    this._styleDirectory.read({styleId: styleId})
    .then(style => res.json(style))
    .catch(err => res.sendStatus(404));
  }
  
  _saveStyle(style, styleId, res) {
    if (!style) {
      res.sendStatus(410);
      return;
    }
    style.styleId = styleId;
    this._styleDirectory.extend(style)
    .then(() => res.sendStatus(200));
  }
  
  _publishStyles(styleId, commitMessage, res) {
    this._styleDirectory.commit([{styleId: styleId}], commitMessage)
    .then(() => res.sendStatus(200));
  }
  
  _publishConfig(websiteId, configName, commitMessage, res) {
    this._websiteDirectory(websiteId).commit([{configName}], commitMessage)
    .then(() => {
      this.push(`${configName}`,"published");
      res.sendStatus(200);
    });
  }
  
  _getConfig(websiteId, configName, res) {
    this._websiteDirectory(websiteId).read({configName: configName})
    .then(config => res.json(config))
    .catch(() => res.sendStatus(404));
  }
  
  _putConfig(websiteId, configName, config, res) {
    config.configName = configName;
    this._websiteDirectory(websiteId).extend(config)
    .then(() => {
      this.push(`${configName}`,"updated");
      res.sendStatus(200);
    });
  }
}

module.exports = ResourcesApi;