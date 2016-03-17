"use strict";

let Repository = require("./../sourceControl/Repository");
let SassTransformer = require("./SassTransformer");
let gulp = require("gulp");
let gulpSass = require("gulp-sass");
let path = require("path");
let log = require("./../logging/logger");


module.exports = class SassRepository extends Repository {
  
  constructor(name, baseDirectory, fileRouting, schema, developmentPath, productionPath) {
    super(name, baseDirectory, fileRouting);
    this._schema = schema;
    this._transformer = new SassTransformer(schema);
    this._devPath = developmentPath;
    this._productionPath = productionPath;
  }
  
  onSave(relativePath) {
    let fullPath = path.join(this._baseDirectory,"/",relativePath);
    gulp.src([fullPath])
    .pipe(gulpSass())
    .pipe(gulp.dest(this._devPath));
  }
  
  onPublish(relativePath) {
    let fullPath = path.join(this._baseDirectory,"/",relativePath);
    gulp.src([fullPath])
    .pipe(gulpSass({outputStyle: 'compressed'}))
    .pipe(gulp.dest(this._productionPath));
  }
  
  get schema() {
    return this._schema;
  }
  
  serialize(object) {
    return this._transformer.toSass(object);
  }
  
  deserailize(sass) {
    return this._transformer.fromSass(sass);
  }
}
