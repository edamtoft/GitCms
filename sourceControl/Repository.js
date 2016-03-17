"use strict";

let path = require("path");
let fs = require("fs");
let git = require("nodegit");
let log = require("./../logging/logger");

const ROUTE_PARAM_REGEX = /{([^}]+)}/g;
const BRACKETS_REGEX = /[{}]/g;

module.exports = class Repository {
  constructor(name, baseDirectory, fileRouting) {
    this.name = name;
    this._baseDirectory = baseDirectory;
    this._fileRouting = fileRouting;
    this._initializeRepository();
  }
  
  get route() {
    return this._fileRouting;
  }
  
  commit(resources, commitMessage) {
    return new Promise((resolve, reject) => {
      let filesToCommit = resources.map(r => this._getRoute(r))  
      this._repository
      .then(repository => { 
        let author = git.Signature.now("_system_","_system_");
        let committer = author;
        log.info(`About to commit ${filesToCommit.join(",")}`);
        return repository.createCommitOnHead(filesToCommit, author, committer, commitMessage);
      })
      .then(commit => {
        log.info(`Created commit with id ${commit}`);
        return Promise.all(filesToCommit.map(file => this.onPublish(file)));
      })
      .then(() => resolve())
      .catch(err => {
        log.error(err);
        reject(err);
      });
    });
  }
  
  serialize(object) {
    throw new Error("Abstract method must be overridden");
  }
  
  deserailize(text) {
    throw new Error("Abstract method must be overridden");
  }
  
  onSave(filePath) {
    // do nothing by default
    return new Promise((resolve) => resolve());
  }
  
  onPublish(filePath) {
    // do nothing by default
    return new Promise((resolve) => resolve());
  }
  
  extend(object) {
    return new Promise((resolve,reject) => {
      this.update(object, (old) => {
        for (let name in object) {
          old[name] = object[name];
        }
      })
      .then(() => resolve())
    });
  }
  
  update(pathParams, updateDelegate) {
    return new Promise((resolve, reject) => {
      this.read(pathParams)
      .then(object => {
        updateDelegate(object);
        return this.save(object);
      })
      .then(() => resolve())
      .catch(() => {
        let objectToUpdate = {};
        for (let name in pathParams) {
          objectToUpdate[name] = pathParams[name];
        }
        updateDelegate(objectToUpdate)
        return this.save(objectToUpdate)
      })
      .then(() => resolve());
    });
  }
  
  read(pathParameters) {
    return new Promise((resolve, reject) => {
      let relativePath = this._getRoute(pathParameters);
      let fullPath = path.join(this._baseDirectory,"/", relativePath);
      this._readFile(fullPath)
      .then(file => this.deserailize(file))
      .then(object => resolve(object))
      .catch(err => {
        log.error(err);
        reject(err);
      });
    });
    
  }
  
  getDiff(pathParameters) {
    return new Promise((resolve,reject) => {
      let filePath = this._getRoute(pathParameters);
      let repository;
      
      this._repository
      .then(_repository => {
        repository = _repository;
        return repository.getHeadCommit();
      })
      .then(head => head.getTree())
      .then(headTree => git.Diff.treeToWorkdir(repository,headTree))
      .then(diff => diff.patches())
      .then(patches => {
        let fileDiff = patches.filter(patch => patch.newFile().path().toLowerCase() === filePath.toLowerCase())[0];
        if (!fileDiff) {
          resolve(null);
          return;
        }
        fileDiff.hunks()
        .then(hunks => Promise.all(hunks.map(hunk => hunk.lines())))
        .then(hunkLines => {
          let diff = hunkLines
          .map(lines => 
            lines
            .filter(line => line.content().indexOf("No newline at end of file") === -1)
            .map(line => ({
              status: String.fromCharCode(line.origin()),
              content: line.content().replace(/[\r\n]+$/,"")
            })));
          resolve(diff);
        })
        .catch(err => reject(err));
      })
      .catch(err => reject(err));
    }); 
  }
  
  buildDiff() {
    return new Promise((resolve,reject) => {
      let repository, patches;
      let diffedFiles = [];
      return this._repository
      .then(repo => { repository = repo; return repo.getHeadCommit(); })
      .then(head => head.getTree())
      .then(tree => git.Diff.treeToWorkdir(repository,tree))
      .then(diff => diff.patches())
      .then(patches => {
        let diffedFiles = patches.map(patch => ({ 
          path: patch.newFile().path(), 
          status: patch.status(), 
          _hunks: patch.hunks().then(hunks => Promise.all(hunks.map(hunk => hunk.lines())))
        }));
        diffedFiles.forEach(file => {
          file._hunks.then(linesByHunk => file.hunks=linesByHunk.map(hunk => hunk.map(line => ({ 
            wasLine: line.oldLineno(),
            isLine: line.newLineno(),
            origin: String.fromCharCode(line.origin()), 
            content: line.content() 
          }))));
        });
        Promise.all(diffedFiles.map(file => file._hunks)).then(() => {
          resolve(diffedFiles.map(file => ({path: file.path, status: file.status, hunks: file.hunks })));
        });
      })
      .catch(err => reject(err));
    });
  }
  
  getStatus() {
    return new Promise((resolve, reject) => {
      this._repository
      .then(repo => repo.getStatus())
      .then(files => {
        let modified = [];
        let added = [];
        let removed = [];
        for (let status of files) {
          if (status.isNew()) { added.push(status.path()); }
          if (status.isModified()) { modified.push(status.path()); }
          if (status.isTypechange()) { modified.push(status.path()); }
          if (status.isRenamed()) { modified.push(status.path()); }
          if (status.isIgnored()) { removed.push(status.path()); }
        }
        resolve({
          noChanges: files.length === 0,
          modified: modified.map(path => this._parseRoute(path)), 
          added: added.map(path => this._parseRoute(path)), 
          removed: removed.map(path => this._parseRoute(path))
        });
      })
      .catch(err => reject(err));
    });
    
  }
  
  save(object) {
    return new Promise((resolve, reject) => {
      
      let relativePath = this._getRoute(object);
      let fullPath = path.join(this._baseDirectory,"/", relativePath);
      let index;
      
      this.serialize(object)
      .then(text => this._writeFile(fullPath, text))
      .then(() => this._repository)
      .then(repository => { 
        return repository.openIndex();
      })
      .then(_index => {
        index = _index;
        return index.addByPath(fullPath);
      })
      .then(() => index.write())
      .then(() => index.writeTree())
      .then(() => {
        log.debug(`Wrote ${relativePath}`);;
        return this.onSave(relativePath)
      })
      .then(() => resolve())
      .catch(err => {
        log.error(err);
        reject(err);
      });
    });    
  }
  
  
  
  _initializeRepository() {
    log.info(`Accessing repository for ${this.name}`)
    let folderExists = fs.existsSync(this._baseDirectory);
    
    if (!folderExists) {
      fs.mkdirSync(this._baseDirectory);
    }
    
    let repoExists = folderExists && fs.existsSync(path.join(this._baseDirectory,"/.git/"));
    
    if (!repoExists) { 
      log.info(`Creating ${this.name} repository for the first time`);
    }
    
    this._repository = repoExists ? 
      git.Repository.open(this._baseDirectory) : 
      git.Repository.init(this._baseDirectory, 0);
      
    this._repository.then(() => {
        log.info(`Repository for ${this.name} loaded.`);
      },
      err => { 
        throw new Error(`Could not initialize or open repository: ${err}`) 
      });
  }
  
  _getRoute(file) {
    return this._fileRouting.replace(ROUTE_PARAM_REGEX, (match, prop) => file[prop]);
  }
  
  _parseRoute(filePath) {
    let match;
    let paramNames = [];
    while (match = ROUTE_PARAM_REGEX.exec(this._fileRouting)) {
      paramNames.push(match[1]);
    }
    let output = {};
    let routeParts = this._fileRouting.split(BRACKETS_REGEX);
    for (let name of paramNames) {
      let index = routeParts.indexOf(name);
      let before = index <= 0 ? "" : routeParts[index-1];
      let after = routeParts[index+1];
      let indexBefore = before ? 0 : filePath.indexOf(before);
      let indexAfter = filePath.indexOf(after);
      let value = filePath.substring(indexBefore+before.length,indexAfter);
      output[name] = value;
    }
    return output;
  }
  
  _writeFile(path, fileText) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, fileText, (err) => err ? reject(err) : resolve());
    });
  }
  
  _readFile(path) {
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, status) => {
        if (err) {
          reject(err);
          return;
        }
        if (!status.isFile()) {
          reject(new Error("File Not Found"));
          return;
        }
        fs.readFile(path, "utf8", (err, text) => err ? reject(err) : resolve(text));
      });
    });
  }
}