"use strict";

let http = require("http");
let express = require("express");
let parser = require("body-parser");
let path = require("path");
let log = require("./../logging/logger");
var SocketIo = require('socket.io');

class Server {
  constructor(routeProviders) {
    this._app = express();
    this._app.set("views", path.resolve("./web/views"));
    this._app.set("view engine", "jade");
    this._app.use(parser.json());
    this._app.use((req,res,next) => {
      log.debug(`Recieved request to ${req.path}`);
      next();
    });
    for (let provider of routeProviders) {
      this._app.use(provider.base, provider.router);
      if (provider.subscribe) {
        provider.subscribe((type,data) => this._push(type,data));
      }
    }
    this._server = new http.Server(this._app);
    this._pushServer = new SocketIo(this._server);
  }
  
  _push(type,data) {
    this._pushServer.emit(type,data);
  }
  
  start() {
    log.info("Starting web server");
    this._server.listen(3000, () => log.info("Server Started"));
  }
}

module.exports = Server;