(function() {
  "use strict";
  
  function getDiff(path, target) {
    let req = new XMLHttpRequest();
    req.addEventListener("load", e => diffLoaded(JSON.parse(req.responseText), target));
    req.open("GET", path);
    req.send();
  }
  
  function diffLoaded(diff,target) {
    let diffedLines = [];
    let left = "";
    let right = "";
    let unified = "";
    // if (diff && diff.length > 0) {
    //   right += `<div class="diff-line diff-line_control">New Version</div>`;
    //   left += `<div class="diff-line diff-line_control">Previous Version</div>`;
    //   unified += `<div class="diff-line diff-line_control">Changes</div>`;
    // } 
    for (let hunkIndex in diff) {
      let lines = diff[hunkIndex]
      let lastStatus = " ";
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let nextLine = lines[i+1];
        let nextStatus = nextLine ? nextLine.status : null;
        switch (line.status) {
          case "+":
            if (lastStatus !== "-") {
              left += `<div class="diff-line diff-line_empty"></div>`;
            }
            right += `<div class="diff-line diff-line_inserted" title="${line.content.replace("\"","\\\"")}">${line.content}</div>`;
            unified += `<div class="diff-line diff-line_inserted" title="${line.content.replace("\"","\\\"")}">${line.status}${line.content}</div>`;
            break;
          case "-":
            if (nextStatus !== "+") {
              right += `<div class="diff-line diff-line_empty"></div>`;
            }
            left += `<div class="diff-line diff-line_deleted" title="${line.content.replace("\"","\\\"")}">${line.content}</div>`;
            unified += `<div class="diff-line diff-line_deleted" title="${line.content.replace("\"","\\\"")}">${line.status}${line.content}</div>`;
            break;
          default:
            right += `<div class="diff-line diff-line_unchanged" title="${line.content.replace("\"","\\\"")}">${line.content}</div>`;
            left += `<div class="diff-line diff-line_unchanged" title="${line.content.replace("\"","\\\"")}">${line.content}</div>`;
            unified += `<div class="diff-line diff-line_unchanged" title="${line.content.replace("\"","\\\"")}">${line.status}${line.content}</div>`;
            break;
        }
        lastStatus = line.status;
      }
      if (hunkIndex+1 < diff.length) {
        right += `<div class="diff-line diff-line_control">...</div>`;
        left += `<div class="diff-line diff-line_control">...</div>`;
        unified += `<div class="diff-line diff-line_control">...</div>`;
      }
    }
    let htmlContent = `
<div class="diff clearfix">
  <div class="col-xs-6 hidden-xs hidden-sm">
    <div class="row diff-side diff-side_left">
      ${left}
    </div>
  </div>
  <div class="col-xs-6 hidden-xs hidden-sm">
    <div class="row diff-side diff-side_right">
      ${right}
    </div>
  </div>
  <div class="col-xs-12 visible-xs visible-sm">
    <div class="row diff-side">
      ${unified}
    </div>
  </div>
</div>`;
    target.innerHTML = htmlContent;
  }
  
  window.getDiff = getDiff;
})();