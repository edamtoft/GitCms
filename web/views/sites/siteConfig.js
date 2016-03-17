(function() {
  "use strict";
  
  let socket = new io();

  
  let forms = document.querySelectorAll("form");
  let configForms = []
  for (let i = 0; i < forms.length; i++) {
    let form = forms[i];
    console.log("Found form "+form.name);
    configForms.push(form.name);
    socket.on(form.name, event => {
      loadConfigs();
    });
    form.addEventListener("change", e => {
      saveConfig(form);
    });
    form.addEventListener("submit", e => {
      saveConfig(form);
      e.preventDefault();
    });
  }
  
  
  window.addEventListener("hashchange", e => loadConfigs());
  loadConfigs();
  
  function loadConfigs() {
    console.log("loading config settings");
    let siteId = location.hash.substring(1);
    for (let i in configForms) {
      let configType = configForms[i];
      console.log("Fetching config for "+configType);
      let req = new XMLHttpRequest();
      req.addEventListener("load", e => configLoaded(siteId, configType, JSON.parse(req.responseText)));
      req.open("GET", `/api/sites/site/${siteId}/config/${configType}`);
      req.send();
    }
  }
  
  function configLoaded(siteId, configType, config) {
    let form = document.forms[configType];
    let controls = form.querySelectorAll("[name]");
    for (let i = 0; i < controls.length; i++) {
      let control = controls[i];
      let paramName = control.name;
      if (control.type === "checkbox") {
        control.checked = (config[paramName] && config[paramName].indexOf(control.dataset.value) !== -1);
        continue;
      }
      if (control.type === "radio") {
        control.checked = config[paramName] && config[paramName] == control.dataset.value;
        continue;
      }
      control.value = config[paramName];
    }
    getDiff(`/api/sites/site/${siteId}/config/${configType}/diff`, document.getElementById(`diff_${configType}`));
  }
  
  function saveConfig(form) {
    let siteId = location.hash.substring(1);
    let configType = form.name;
    console.log("Saving config "+configType)
    let jsonObject = {};
    let controls = form.querySelectorAll("[name]");
    for (let i = 0; i < controls.length; i++) {
      let control = controls[i];
      let paramName = control.name;
      if (control.type === "radio") {
        if (!control.checked) {
          continue;
        }
        jsonObject[paramName] = control.value;
        continue;
      }
      if (control.type === "checkbox") {
        if (!control.checked) {
          continue;
        }
        let arr = jsonObject[paramName] || [];
        arr.push(control.dataset.value);
        console.log(arr);
        jsonObject[paramName] = arr;
        continue;
      }
      if (control.type === "number") {
        jsonObject[paramName] = Number(control.value);
        continue;
      }
      switch (control.dataset.type) {
        case "CSV":
          jsonObject[paramName] = control.value.split(",").map(v => v.trim());
          break;
        default:
          jsonObject[paramName] = control.value;
          break;
      }
    }
    console.log(jsonObject);
    let req = new XMLHttpRequest();
    req.addEventListener("load", e => configSaved(siteId, configType));
    req.open("PUT", `/api/sites/site/${siteId}/config/${configType}`);
    req.setRequestHeader("Content-Type","Application/JSON");
    req.send(JSON.stringify(jsonObject));
  }
  
  function configSaved(siteId, configType) {
    getDiff(`/api/sites/site/${siteId}/config/${configType}/diff`, document.getElementById(`diff_${configType}`));
  }
  
  let commitLinks = document.querySelectorAll("[data-action='commit']");
  for (let i = 0; i < commitLinks.length; i++) {
    let link = commitLinks[i];
    link.addEventListener("click", e => {
      commitChanges(link.dataset.configType);
      e.preventDefault();
    });
  }
  
  function commitChanges(configType) {
    let siteId = location.hash.substring(1);
    let message = prompt("Describe the changes you made:");
    let data = {commitMessage: message};
    let req = new XMLHttpRequest();
    req.addEventListener("load", e => commitedFinished());
    req.open("POST", `/api/sites/site/${siteId}/config/${configType}/publish`);
    req.setRequestHeader("Content-Type","Application/JSON")
    req.send(JSON.stringify(data));
  }
  
  function commitedFinished() {
    location.reload();
  }
})();