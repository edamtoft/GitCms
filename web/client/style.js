(function() {
  
  "use strict";
  
  let form = document.getElementById("styles-form");
  form.addEventListener("submit", e => {
    saveStyle();
    e.preventDefault();
  });
  
  window.addEventListener("hashchange", e => loadStyle());
  loadStyle();
  
  
  function loadStyle() {
    let styleId = parseInt(window.location.hash.substring(1)) || 0;
    let req = new XMLHttpRequest();
    req.addEventListener("load", e => styleLoaded(JSON.parse(req.responseText)));
    req.open("GET", "/api/styles/style/"+styleId);
    req.send();
  }
  
  function styleLoaded(style) {
    for (let name in style) {
      let control = document.getElementsByName(name)[0];
      if (!control) {
        console.log("unable to find control for "+name);
        continue;
      }
      if (control.tagName==="TEXTAREA") {
        control.innerHTML = style[name];
        continue;
      }
      control.value = style[name];
    }
  }
  
  function saveStyle() {
    let styleId = parseInt(window.location.hash.substring(1)) || 0;
    let style = {};
    let inputs = form.querySelectorAll("[name]");
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i];
      console.log(input.name+" => "+input.value);
      style[input.name] = input.value;
    }
    let req = new XMLHttpRequest();
    req.addEventListener("load", e => styleSaved());
    req.open("PUT", "/api/styles/style/"+styleId);
    req.setRequestHeader("Content-Type","Application/JSON");
    req.send(JSON.stringify(style));
  }
  
  function styleSaved() {
    alert("Style successfully saved");
  }
})();