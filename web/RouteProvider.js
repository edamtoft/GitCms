"use strict";

let express = require("express");

class RouteProvider {
  
  constructor(base) {
    this._router = new express.Router();
    this._base = base;
    this._pushHandlers = [];
  }
  
  subscribe(pushHandler) {
    this._pushHandlers.push(pushHandler);
  }
  
  push(type,data) {
    for (let handler of this._pushHandlers) {
      handler(type,data);
    }
  }
  
  get on() {
    return this._router;
  }
  
  get base() {
    return this._base;
  }
  
  get router() {
    return this._router;
  }
}

module.exports = RouteProvider;