(function() {
  
  "use strict";
  
  let commitLinks = document.querySelectorAll("[data-action='commit']");
  for (let i = 0; i < commitLinks.length; i++) {
    let link = commitLinks[i];
    let styleId = link.getAttribute("data-style-id");
    link.addEventListener("click", e => {
      let styleId = link.getAttribute("data-style-id");
      commitStyleChange(styleId);
      e.preventDefault();
    });
  }
  
  function commitStyleChange(styleId) {
    let message = prompt("Describe the changes you made:");
    let data = {commitMessage: message};
    let req = new XMLHttpRequest();
    req.addEventListener("load", e => styleCommitted(styleId));
    req.open("POST", `/api/styles/style/${styleId}/publish`);
    req.setRequestHeader("Content-Type","Application/JSON")
    req.send(JSON.stringify(data));
  }
  
  function styleCommitted(styleId) {
    alert("Style "+styleId+" published");
    location.reload();
  }
  
})();