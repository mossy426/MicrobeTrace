$(function() {
  "use strict";

  let linkKeyboardPositionEnabled = false;
  let nodeKeyboardPositionEnabled = false;
  let statsKeyboardPositionEnabled = false;


    // Table to instantiate when recall button is clicked
    let table = new Tabulator("#recall-stashes-available", {
      height: "100%",
      layout: "fitColumns",
      selectable: 1,
      columns: [
        { title: "Name", field: "name" },
        { title: "Date", field: "date", align: "right", sorter: "date" }
      ]
    });

  // Table to instantiate when recall button is clicked
  if (navigator.userAgent.indexOf("MSIE") >= 0 || navigator.appName.indexOf("Microsoft Internet Explorer") >= 0) {
    $("#ie-warning").show();
    throw new Error("MicrobeTrace does not work on Internet Explorer.");
  } else {
    $("#ie-warning").remove();
  }

  // Before anything else gets done, ask the user to accept the legal agreement
  localforage.getItem("licenseAccepted").then(accepted => {
    if (!accepted) {
      $("#acceptAgreement").on("click", () => {
        localforage.setItem("licenseAccepted", new Date());
      });
      $("#licenseAgreement").modal({
        backdrop: "static",
        keyboard: false
      });
    }  
  })

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(error => {
      console.error("Service Worker Registration failed with " + error);
    });
  }

  // TODO:: Move to common js
  MT.updateThresholdHistogram = () => {
    let width = 280,
      height = 48,
      svg = d3
        .select("svg#link-threshold-sparkline")
        .html(null)
        .attr("width", width)
        .attr("height", height);

    let lsv = session.style.widgets["link-sort-variable"],
      n = session.data.links.length,
      max = Number.MIN_SAFE_INTEGER,
      min = Number.MAX_SAFE_INTEGER,
      data = Array(n),
      dist = null;
    for (let i = 0; i < n; i++) {
      dist = parseFloat(session.data.links[i][lsv]);
      data[i] = dist;
      if (dist < min) min = dist;
      if (dist > max) max = dist;
    }
    let range = max - min;
    let ticks = 40;

    let x = d3
      .scaleLinear()
      .domain([min, max])
      .range([0, width]);

    let bins = d3
      .histogram()
      .domain(x.domain())
      .thresholds(x.ticks(ticks))(data);

    let y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .range([height, 0]);

    let bar = svg
      .selectAll(".bar")
      .data(bins)
      .enter()
      .append("g")
      .attr("class", "bar")
      .attr("transform", d => "translate(" + x(d.x0) + "," + y(d.length) + ")");

    bar
      .append("rect")
      .attr("x", 1)
      .attr("width", 6)
      .attr("height", d => height - y(d.length));

    function updateThreshold() {
      let xc = d3.mouse(svg.node())[0];
      session.style.widgets["link-threshold"] = (xc / width) * range * 1.05 + min;
      $("#link-threshold").val(parseFloat(session.style.widgets["link-threshold"].toLocaleString()));
    }

    svg.on("click", () => {
      updateThreshold();
      updateNetwork();
    });

    svg.on("mousedown", () => {
      d3.event.preventDefault();
      svg.on("mousemove", updateThreshold);
      svg.on("mouseup mouseleave", () => {
        updateNetwork();
        svg
          .on("mousemove", null)
          .on("mouseup", null)
          .on("mouseleave", null);
      });
    });
  };

  MT.tabulate = (data, columns, wrapper, container) => {
    let foreignObj = d3.select(container).append("svg:foreignObject")
      .attr("x", wrapper.offsetLeft)
      .attr("y", wrapper.offsetTop-60)
      .attr("width", wrapper.offsetWidth)
      .attr("height", wrapper.offsetHeight);
    let body = foreignObj 
      .append("xhtml:body")
      .append("table")
      .style('position', 'absolute')
      .style('top', '0')
      .style('width', '100%')
      .style('height', '100%')
      .attr('cellpadding', '1px')
      .attr("class", "table-bordered");
      // .html(nodeColorTable.innerHTML); SVG doesn't translate
    let thead = body.append("thead"),
        tbody = body.append("tbody");
    thead.append("tr")
      .selectAll("th")
      .data(columns)
      .enter()
      .append("th")
      .text(function(column) { return column; });
    let rows = tbody.selectAll("tr")
      .data(data)
      .enter()
      .append("tr");
    let cells = rows.selectAll("td")
      .data(function(row) {
        return columns.map(function(column) {
            return {column: column, value: row[column.split(" ")[0]]};
        });
      })
      .enter()
      .append("td")
      .html(function(d) { return d.value; });
    return foreignObj;
  }

  self.temp = MT.tempSkeleton();
  self.session = MT.sessionSkeleton();
  self.layout = new GoldenLayout({
    settings: {
      selectionEnabled: true,
      showPopoutIcon: false
    },
    content: [
      {
        type: "stack",
        content: []
      }
    ]
  }, $("#main-panel"));

  layout.init();

  layout.contentItems = [];

  self.$window = $(window);

  /* ----- Drag Modals via Header ----- */
  $(".modal-header").on("mousedown", function(){
    let body = $("body");
    let parent = $(this).parent().parent().parent();
    body.on("mousemove", e => {
      parent
        .css("top", parseFloat(parent.css("top" )) + e.originalEvent.movementY + "px")
        .css("left",parseFloat(parent.css("left")) + e.originalEvent.movementX + "px");
    });
    body.on("mouseup", () => body.off("mousemove").off("mouseup"));
  });

  /** -------------------- File Dropdown -------------------- */

  /* ----- Stashing ----- */

  // Stash data is button - stash session JSON in local storage
  $("#stash-data").on("click", () => {
    localforage.setItem(
      "stash-" + Date.now() + "-" + $("#stash-name").val(),
      JSON.stringify(session)
    ).then(() => alertify.success("Session Stashed Successfully!"));
  });

  /* ----- Recalling ----- */

  // Recall selection of dropdown -> updates instantiated table, then show model
  $("#RecallDataTab").on("click", e => {
    e.preventDefault();
    updateTable();
    $("#session-recall-modal").modal("show");
  });

  // Recall modal delete button pressed 
  $("#recall-delete-stash").on("click", () => {
    let key = table.getSelectedData()[0].fullname;
    localforage.removeItem(key).then(() => {
      updateTable();
      alertify.success("That stash has been deleted.");
    });
  });

  // Recall load button pressed - apply session for stash loaded
  $("#recall-load-stash").on("click", () => {
    let key = table.getSelectedData()[0].fullname;
    localforage.getItem(key).then(json => {
      MT.applySession(JSON.parse(json));
      $("#session-recall-modal").modal("hide");
    });
  });


  // Updates stash table
  function updateTable() {
    let rows = [];
    localforage.keys().then(keys => {
      keys.forEach(k => {
        if (k.substring(0, 5) !== "stash") return;
        rows.push({
          fullname: k,
          name: k.substring(20),
          date: new Date(parseFloat(k.substring(6, 19))).toISOString()
        });
      });
      table.setData(rows);
    });
  }


  /* ----- Saving ----- */ 

  // Save button on modal clicked -> calls saveAs()
  $("#save-data").on("click", () => {
    let zip = new JSZip();
    let name = $("#save-file-name").val();
    let format = $("#save-file-format").val();
    let data;
    if (format == "style") {
      data = JSON.stringify(session.style);
    } else if (format == "hivtrace") {
      data = MT.exportHIVTRACE();
    } else {

      if ($('#save-file-cluster').is(":checked")){
        // it is checked

        let clusterNodeList = [];
        let clusterLinkList = [];
        let singletonNodeList = [];
        let dyadNodeList = [];
        let dyadEdgeList = [];
        let nodes = session.data.nodes;
        let links = session.data.links;

        session.data.clusters.forEach(cluster => {

          console.log('cluster: ', cluster);
          let clusterNodes = nodes.filter(node => node.cluster === cluster.id);
          let clusterLinks = links.filter(link => link.cluster === cluster.id);

          // We have a singleton - all singletons go into one file
          if(clusterNodes.length == 1){
            singletonNodeList.push(clusterNodes[0]);
          // We have a dyad - all dyads go into one file
          } else if (clusterNodes.length == 2) {
            // Add both nodes
            dyadNodeList.push(clusterNodes[0]);
            dyadNodeList.push(clusterNodes[1]);
            // Add the single link
            dyadEdgeList.push(clusterLinks[0]);
          // We have a cluster
          } else {
            // Add array object of nodes with matching cluster
            clusterNodeList.push(clusterNodes);

            // Add array object of links with matching cluster
            clusterLinkList.push(clusterLinks);
          }

        });

        let singletonFolder = null;
        let dyadFolder = null;

        for (var i = 0; i < session.data.clusters.length; i++) {

          let currentCluster = session.data.clusters[i];

          let cluster = clusterNodeList.filter(nodeList => nodeList[0].cluster == currentCluster.id);
          // Check if cluster is in clusterNodesList
          if(cluster.length > 0){

            // Create cluster folder
            var clusterFolder = zip.folder("cluster-" + cluster[0][0].cluster);
          
            // If node and edge lists exists, add them to the current folder
            if(clusterNodeList[i]) {
              let blob = new Blob([Papa.unparse(cluster[0])], {type: 'text/csv;charset=utf-8'});
              clusterFolder.file("nodeList.csv", blob);
            }

            let clusterLink = clusterLinkList.filter(LinkList => LinkList[0].cluster == currentCluster.id);

            if(clusterLink) {
              let blob = new Blob([Papa.unparse(clusterLink[0])], {type: 'text/csv;charset=utf-8'});
              clusterFolder.file("edgeList.csv", blob);
            }
          }
        }

        if(dyadNodeList.length > 0){
          dyadFolder = zip.folder("dyads");
          // Add all dyads in one shot
          let nodesBlob = new Blob([Papa.unparse(dyadNodeList)], {type: 'text/csv;charset=utf-8'});
          dyadFolder.file("nodeList.csv", nodesBlob);
          let edgesBlob = new Blob([Papa.unparse(dyadEdgeList)], {type: 'text/csv;charset=utf-8'});
          dyadFolder.file("edgeList.csv", edgesBlob);
        }

        if (singletonNodeList.length > 0) {
          singletonFolder = zip.folder("singletons");
          // Add all singletons in one shot
          let blob = new Blob([Papa.unparse(singletonNodeList)], {type: 'text/csv;charset=utf-8'});
          singletonFolder.file("nodeList.csv", blob);
        }

        // generate zip repsetnation in memory
        zip.generateAsync({type:"blob"}).then(function(content) {
            // see FileSaver.js
            saveAs(content, name);
        });

        // End function
        return;
        
      } else {
        data = JSON.stringify(session);
      }

    }

    if (format == 'session') {
      format = 'microbetrace';
    }

    if ($("#save-file-compress").is(":checked")) {
      
      zip.file(name + "." + format, data);
      zip
        .generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: {
            level: 9
          }
        })
        .then(content => saveAs(content, name + ".zip"));
    } else {
      let blob = new Blob([data], { type: "application/json;charset=utf-8" });
      saveAs(blob, name + "." + format);
    }
  });

  $("#save-file-cluster").on("change", function(){

    if ($('#save-file-cluster').is(":checked")){
      $("#save-file-compress").attr("disabled", true);
      console.log('disabled');
    } else {
      $("#save-file-compress").removeAttr("disabled");
    }

  });

  $("#save-file-format").on("change", function(){

    // Ensure compress is not disabled if format has been switched to style
    if ($('#save-file-format').val() == 'style'){
      $("#save-file-compress").removeAttr("disabled");
      $("#cluster-checkbox-container").hide(true);
    } else {
      $('#save-file-cluster').prop('checked', false);
      $("#cluster-checkbox-container").show(true);
    }

  });

  /* ----- Opening File ----- */ 

  // Open selection from dropdown of file menu
  $("#OpenTab").on("change", function(){
    if (this.files.length > 0) {
      let extension = this.files[0].name
        .split(".")
        .pop()
        .toLowerCase();
      if (extension == "zip") {
        let new_zip = new JSZip();
        new_zip.loadAsync(this.files[0]).then(zip => {
          zip.forEach((relativePath, zipEntry) => {
            extension = zipEntry.name.split(".").pop();
            zipEntry.async("string").then(c => {
              MT.processJSON(c, extension);
            });
          });
        });
      } else {
        let reader = new FileReader();
        reader.onloadend = out => MT.processJSON(out.target.result, extension);
        reader.readAsText(this.files[0], "UTF-8");
      }
    }
  });

  /* ----- Add new data ----- */

  // Clicking add data launches file view component
  $("#AddDataTab").on("click", e => {
    e.preventDefault();
    //$("#network-statistics-hide").trigger("click");
    MT.launchView("files");
  });

  // Clicking new in dropdown triggers exit modal to start new session
  $("#NewTab").on("click", e => {
    e.preventDefault();
    $("#exit-modal").modal();
  });

  // Exit button click in exit modal - data is reset
  $("#exit-button").on("click", MT.reset);

  /** -------------------- Views Dropdown -------------------- */

  /* ----- Viewing component ----- */

  // Navigates to view from views dropdown by looking at href
  $(".viewbutton").on("click", function(e){
    e.preventDefault();
    MT.launchView($(this).data("href"))
  });

  /** -------------------- Window Dropdown -------------------- */

  // Reload Selection clicked - opens model and on exit - reload window
  $("#ReloadTab").on("click", e => {
    e.preventDefault();
    $("#exit-button").on("click", () => window.location.reload());
    $("#exit-modal").modal();
  });

  // Full screen toggle clicked - goes to full screen
  $("#FullScreenTab").on("click", e => {
    e.preventDefault();
    screenfull.toggle();
  });

  /** -------------------- Network Functions -------------------- */
  // Updates network 
  // Link Visibility, Cluster Assigning, Cluster Visibility, Stats if not hidden
  let updateNetwork = () => {
    // TODO:: Why Set Link Visbility Called Twice?
    MT.setLinkVisibility(true);
    MT.tagClusters().then(() => {
      MT.setClusterVisibility(true);
      MT.setLinkVisibility(true);
      MT.setNodeVisibility(true);
      ["cluster", "link", "node"].forEach(thing => $window.trigger(thing + "-visibility"));
      MT.updateStatistics();
    });
  };

  /** -------------------- Global Settings -------------------- */
  
  /* ----- Filtering Tab ----- */

  // Prune with - None btn clicked
  // Set nearest neighbor option to false and update network
  // Hide Filtering episolon option if none is selected
  $("#link-show-all")
    .parent()
    .on("click", () => {
      $("#filtering-epsilon-row").slideUp();
      session.style.widgets["link-show-nn"] = false;
      updateNetwork();
    });

  // Prune with - NN btn clicked
  // Hide Filtering episolon option if none is selected
  $("#link-show-nn")
    .parent()
    .on("click", () => {
      // Send to Google Analystics - someone hit nearest neighbor
      ga('send', 'event', 'nearest-neighbor', 'trigger', 'on');

      // Set filtering epsilon text value to currently selected slide bar value by default (0.001 by defualt)
      $("#filtering-epsilon-copy").val(
        Math.pow(10, parseFloat($("#filtering-epsilon").val())).toLocaleString()
      );

      // Add flex to container of fitlering
      $("#filtering-epsilon-row").css("display", "flex");

      // Set session value of NN to updated value
      session.style.widgets["link-show-nn"] = true;

      // Update new tree - default distance metric available in files tab menu, but nowhere else..
      // TODO:: Do something about the availabilty here - what is TN93 v SNP
      MT.computeMST(session.style.widgets["default-distance-metric"]).then(updateNetwork);
      // TODO:: Remove line if not needed
      //updateNetwork();
    });

  // Handler for filter slider changes
  $("#filtering-epsilon")
    // Called while slider is moving
    .on("input", () => {
      // TODO:: Input called while holding, but text value no updating - Remove?
      // Change value of epsilon text display to new value from slider
      $("#filtering-epsilon-copy").val(
        Math.pow(10, parseFloat(this.value)).toLocaleString()
      );
    })
    // Called after slider is released
    .on("change", function() {

      // Update slider value in session
      session.style.widgets["filtering-epsilon"] = parseFloat(this.value);
      // Update text value based on current value
      $("#filtering-epsilon-copy").val(
        Math.pow(10, parseFloat(this.value)).toLocaleString()
      );
      // Compute new tree after updating filter object
      MT.computeMST(session.style.widgets["default-distance-metric"]).then(updateNetwork);
    });

  // Handler for Minumum Size Cluster changes
  $("#cluster-minimum-size").on("change", function() {

    // Update value in session
    let val = parseInt(this.value);
    session.style.widgets["cluster-minimum-size"] = val;

    // Update new cluster based on minimum size -> Links -> Nodes
    MT.setClusterVisibility(true);
    MT.setLinkVisibility(true);
    MT.setNodeVisibility(true);

    //Trigger changes in visbility
    ["cluster", "link", "node"].forEach(thing => {
      $window.trigger(thing + "-visibility");
    });

    // Update stats with new changes
    MT.updateStatistics();

    // TODO:: Why hide or show filtering if greater than one minimum cluster?
    if (val > 1) {
      $("#filtering-wrapper").slideUp();
    } else {
      $("#filtering-wrapper").slideDown();
    }
  });

  // Update session variable bseed on selected column to filter by
  $("#link-sort-variable").on("change", function() {
    session.style.widgets["link-sort-variable"] = this.value;

    // TODO:: Why does histogram need to be updated
    MT.updateThresholdHistogram();

    // Update network where visbility is determined by selected column (lsv)
    updateNetwork();
  });

  // Handler for link threshold changing
  $("#link-threshold").on("change", function() {
    
    // Google Analytics
    ga('send', 'event', 'threshold', 'update', this.value);
    
    // Update session
    session.style.widgets["link-threshold"] = parseFloat(this.value);

    //Show links + clusters -> then update stats
    MT.setLinkVisibility(true);
    MT.tagClusters().then(() => {
      MT.setClusterVisibility(true);
      //To catch links that should be filtered out based on cluster size:
      MT.setLinkVisibility(true);
      MT.setNodeVisibility(true);
      //Because the network isn't robust to the order in which these operations
      //take place, we just do them all silently and then react as though we did
      //them each after all of them are already done.
      ["cluster", "link", "node"].forEach(thing => $window.trigger(thing + "-visibility"));
      MT.updateStatistics();
    });
  });

  // Handler for reveal everything btn
  $("#RevealAllTab").on("click", () => {

    // Set cluster back to 1
    $("#cluster-minimum-size").val(1);
    session.style.widgets["cluster-minimum-size"] = 1;

    // Show filtering wrapper since val now 1
    $("#filtering-wrapper").slideDown();

    // Update network
    // TODO:: Can we just call update network?
    MT.setClusterVisibility();
    MT.setNodeVisibility();
    MT.setLinkVisibility();
    MT.updateStatistics();
  });

  // Handler for show stats 
  $("#network-statistics-show")
    .parent()
    .on("click", () => {
      // Update stats will show stat view
      MT.updateStatistics();
      $("#network-statistics-wrapper").fadeIn();
    });

  // Handler for hide stats btn
  $("#network-statistics-hide")
    .parent()
    .on("click", () => {
      $("#network-statistics-wrapper").fadeOut();
    });

  // Handler for display network stats
  $("#network-statistics-wrapper").on("contextmenu", e => {
    e.preventDefault();
    // Set menu to bottom right of page
    $("#network-statistics-context").css({
      top: e.clientY,
      left: e.clientX,
      display: "block"
    });
  });

  // Handler for hide btn in net stats context
  // TODO:: Not seeing doprown menu of stats to drag or hide?
  $("#hideStats").on("click", function() {
    $(this).parent().hide();
    $("#network-statistics-hide").parent().trigger('click');
  });

  // Handler for drag btn in net stats context
  // TODO:: Not seeing doprown menu of stats to drag or hide?
  $("#moveStats").on("click", function() {
    let $this = $(this);
    $this.parent().hide();
    if ($this.text() == "Drag/Arrow Keys") {
      $("#network-statistics-draghandle").slideDown();
      statsKeyboardPositionEnabled = true;
      $this.text("Pin");
    } else {
      $("#network-statistics-draghandle").slideUp();
      statsKeyboardPositionEnabled = false;
      $this.text("Drag/Arrow Keys");
    }
  });

  // TODO:: Not seeing doprown menu of stats to drag or hide?
  $("#network-statistics-draghandle").on("mousedown", function() {
    let body = $("body");
    let parent = $(this).parent();
    body.on("mousemove", e => {
      parent
        .css("bottom", parseFloat(parent.css("bottom")) - e.originalEvent.movementY + "px")
        .css("right" , parseFloat(parent.css("right" )) - e.originalEvent.movementX + "px");
    });
    body.on("mouseup", () => body.off("mousemove").off("mouseup"));
  });

  /* ----- Styling Tab ----- */

  // Set value of node color based on session value
  // Handler for Color Nodes By change
  $("#node-color-variable")
    .val(session.style.widgets["node-color-variable"])
    .on("change", function() { 

      // Set session value to new value
      let variable = this.value;
      session.style.widgets["node-color-variable"] = variable;

      // Hide color elements if not coloring nodes
      if (variable == "None") {
        // Hide Color Table
        $("#node-color-table-row").slideUp();
        // Show Color value for all nodes
        $("#node-color-value-row").slideDown();
        // Empty table
        $("#node-color-table").empty();
        // Broadcast change for on trigger of different views using nodes
        $window.trigger("node-color-change");
        return;
      }

      // Else hide Color value for all nodes
      $("#node-color-value-row").slideUp();
      // Show Color table to display Hide and Show btns
      $("#node-color-table-row").slideDown();

  
      /* ----- Color Table within change of Color Nodes by ----- */
      
      // On click of sort option in node color table, change sort of table nodes
      let nodeSort = $("<a style='cursor: pointer;'>&#8645;</a>").on("click", e => {
        session.style.widgets["node-color-table-counts-sort"] = "";

        if (session.style.widgets["node-color-table-name-sort"] === "ASC")
          session.style.widgets["node-color-table-name-sort"] = "DESC"
        else
          session.style.widgets["node-color-table-name-sort"] = "ASC"
          
        // Broadcast node color variable change
        $('#node-color-variable').trigger("change");
      });

      // Get title of node column in color table
      let nodeColorHeaderTitle =  (session.style.overwrite && session.style.overwrite.nodeColorHeaderVariable == variable ? session.style.overwrite.nodeColorHeaderTitle : "Node " + MT.titleize(variable));
      // Set title of node column + Append sort btn
      let nodeHeader = $("<th class='p-1' contenteditable>" + nodeColorHeaderTitle + "</th>").append(nodeSort);
     
      // On click of count sort
      let countSort = $("<a style='cursor: pointer;'>&#8645;</a>").on("click", e => {
        session.style.widgets["node-color-table-name-sort"] = "";
        if (session.style.widgets["node-color-table-counts-sort"] === "ASC")
          session.style.widgets["node-color-table-counts-sort"] = "DESC"
        else
          session.style.widgets["node-color-table-counts-sort"] = "ASC"
          $('#node-color-variable').trigger("change");
      });

      // Set count header + Append sort btn
      let countHeader = $((session.style.widgets["node-color-table-counts"] ? "<th>Count</th>" : "")).append(countSort);
      
      // Create color table being used
      let nodeColorTable = $("#node-color-table")
        .empty()
        .append($("<tr></tr>")) // Add on table
        .append(nodeHeader) // Add on node header
        .append(countHeader) // Add on count Header
        .append((session.style.widgets["node-color-table-frequencies"] ? "<th>Frequency</th>" : "")) // Add on Frequency header is shown
        .append("<th>Color</th>" ); // Add oon color header
      
      // Create nodeValueNames object in session if doesnt exist
      if (!session.style.nodeValueNames) session.style.nodeValueNames = {};
      
      // Get nodes that are visible + create node color map
      let aggregates = MT.createNodeColorMap();
      let vnodes = MT.getVisibleNodes();
      let values = Object.keys(aggregates);
      
      // Color Column: String vs Number Sorting
      if (isNaN(values[0])) { // String sorting
        if (session.style.widgets["node-color-table-name-sort"] == "ASC")
          values.sort();
        else if (session.style.widgets["node-color-table-name-sort"] == "DESC")
          values.sort(function(a, b) { if (a > b) return -1; if (b > a) return 1; return 0; });        
      } else {  // Number sorting
        if (session.style.widgets["node-color-table-name-sort"] == "ASC")
          values.sort(function(a, b) { return a - b });
        else if (session.style.widgets["node-color-table-name-sort"] == "DESC")
          values.sort(function(a, b) { return b - a });
      }

      // Count Column: Number Sorting
      if (session.style.widgets["node-color-table-counts-sort"] == "ASC")
        values.sort(function(a, b) { return aggregates[a] - aggregates[b] });
      else if (session.style.widgets["node-color-table-counts-sort"] == "DESC")
        values.sort(function(a, b) { return aggregates[b] - aggregates[a] });

      // Node color map created by d3
      // Create dom element for color in color column
      values.forEach((value, i) => {
        let colorinput = $('<input type="color" value="' + temp.style.nodeColorMap(value) + '">')
          .on("change", function(){
            
            // Variable is Column in data sheet (.ie ID, Cluster, etc.)
            // Key within color nodes table that has the value
            let key = session.style.nodeColorsTableKeys[variable].findIndex( k => k === value);

            // Insert value/color at key within column of node color table
            session.style.nodeColorsTable[variable].splice(key, 1, this.value);
            
            // Create node color map if not in timeline
            if (session.style.widgets["node-timeline-variable"] == 'None') {
              temp.style.nodeColorMap = d3
                .scaleOrdinal(session.style.nodeColorsTable[variable])
                .domain(session.style.nodeColorsTableKeys[variable]);
            } else {
            // TODO:: Discuss with tony on this implementation
              let temKey = temp.style.nodeColorKeys.findIndex( k => k === value);
              temp.style.nodeColor.splice(temKey, 1, this.value);
              temp.style.nodeColorMap = d3
                .scaleOrdinal(temp.style.nodeColor)
                .domain(temp.style.nodeColorKeys);
            }
            
            // Broadcast event to views
            $window.trigger("node-color-change");

          });
         
        // Create DOM element symbol for changing alpha
        let alphainput = $("<a>⇳</a>").on("click", e => {

          // Set alpha slider to appear at the position of the click event
          $("#color-transparency-wrapper").css({
            top: e.clientY + 129,
            left: e.clientX,
            display: "block"
          });

          // Set the value to the current index of the color value in the table
          $("#color-transparency")
            .val(session.style.nodeAlphas[i])
            .one("change", function() {

              // Update node alpha object with new value once changed
              session.style.nodeAlphas.splice(i, 1, parseFloat(this.value));
              // Update d3 alpha map with updated array/new value
              temp.style.nodeAlphaMap = d3
                .scaleOrdinal(session.style.nodeAlphas)
                .domain(values);
              
              // Dismiss alpha slider
              $("#color-transparency-wrapper").fadeOut();

              // Broadcast event to views
              $window.trigger("node-color-change");
            });
        });

        // Create color cell and add the color + alpha DOM element
        let cell = $("<td></td>")
          .append(colorinput)
          .append(alphainput);

        // Create row of table by adding the Node Id/variable, count, frequency?, and color
        let row = $(
          "<tr>" +
            "<td data-value='" + value + "'>" +
              (session.style.nodeValueNames[value] ? session.style.nodeValueNames[value] : MT.titleize("" + value)) +
            "</td>" +
            (session.style.widgets["node-color-table-counts"] ? "<td>" + aggregates[value] + "</td>" : "") +
            (session.style.widgets["node-color-table-frequencies"] ? "<td>" + (aggregates[value] / vnodes.length).toLocaleString() + "</td>" : "") +
          "</tr>"
        ).append(cell);

        // Append the created row to the table - go though each visible node until done
        nodeColorTable.append(row);

      });

      // Cells in the table are editable via double click
      nodeColorTable
        .find("td")
        .on("dblclick", function() {
          // Make field editable
          $(this).attr("contenteditable", true).focus();
        })
        .on("focusout", function() {
          let $this = $(this);
          // Make field read-only
          $this.attr("contenteditable", false);
          // Save new value to session 
          session.style.nodeValueNames[$this.data("value")] = $this.text();
        });
      
      /// If header edited, update value to session
      nodeColorTable
        .find(".p-1")
        .on("focusout", function() {
          //#295
          session.style.overwrite.nodeColorHeaderVariable = session.style.widgets["node-color-variable"];
          session.style.overwrite.nodeColorHeaderTitle = $($(this).contents()[0]).text();
        });

      // Allows table to be sortable via drag and drop table rows
      sortable("#node-color-table", { items: "tr" });

      // Broadcast color change egent
      $window.trigger("node-color-change");

    })
    .trigger("change");

  // TODO:: Move above the above code to be in global settings styling
  // Node color field displayed  when Color Nodes By is set to NONE
  // Changes color of all nodes vs distinguishing them by attribute/variable
  $("#node-color")
    .on("change", function() {
      // Update session variable
      session.style.widgets["node-color"] = this.value;
      // Broadcast event
      $window.trigger("node-color-change");
    })
    .val(session.style.widgets["node-color"]); // TODO:: Is setting value needed?

  // Handler for node border color change
  $("#node-color-border")
    .on("change", function() {
      // Update session variable
      session.style.widgets["node-color-border"] = this.value;
      // Broadcast event
      $window.trigger("node-border-change");
    });

  // Handler for link color change  
  $("#link-color-variable")
    .val(session.style.widgets["link-color-variable"]) // Set value to session value
    .on("change", function() {

      // Variable is ID, Source, Cluster, NN, etc.
      let variable = this.value;
      session.style.widgets["link-color-variable"] = variable;


      if (variable == "None") {
        // Show link color value field since only one color for all links
        $("#link-color-value-row").slideDown(); 
        // Hide show/hide link color table field
        $("#link-color-table-row").slideUp(); 
        // Remove link color table
        $("#link-color-table").empty(); 
        // Broadcast event
        $window.trigger("link-color-change");

        // End function since nothing left to do
        return;
      }

      // If not NONE/distinguished colors, ensure link color value field is hidden and show/hide table for links is visible
      $("#link-color-value-row").slideUp();
      $("#link-color-table-row").slideDown();

      // Create sort icon DOM Element for Link (Variable) column headfer
      let linkSort = $("<a style='cursor: pointer;'>&#8645;</a>").on("click", e => {
        session.style.widgets["link-color-table-counts-sort"] = "";
        if (session.style.widgets["link-color-table-name-sort"] === "ASC")
          session.style.widgets["link-color-table-name-sort"] = "DESC"
        else
          session.style.widgets["link-color-table-name-sort"] = "ASC"

        // Broadcast that variable has changed
        $('#link-color-variable').trigger("change");
      });
      // Get title of Link Column based on variable to color by
      let linkColorHeaderTitle =  (session.style.overwrite && session.style.overwrite.linkColorHeaderVariable == variable ? session.style.overwrite.linkColorHeaderTitle : "Link " + MT.titleize(variable));
      // Create DOM element for Link (Variable) column header w/ sort icon
      let linkHeader = $("<th class='p-1' contenteditable>" + linkColorHeaderTitle + "</th>").append(linkSort);

      // Create sort icon DOM element for Count column header
      let countSort = $("<a style='cursor: pointer;'>&#8645;</a>").on("click", e => {
        session.style.widgets["link-color-table-name-sort"] = "";
        if (session.style.widgets["link-color-table-counts-sort"] === "ASC")
          session.style.widgets["link-color-table-counts-sort"] = "DESC"
        else
          session.style.widgets["link-color-table-counts-sort"] = "ASC"
        $('#link-color-variable').trigger("change");
      });
      // Create DOM element for Count column header w/ sort icon
      let countHeader = $((session.style.widgets["link-color-table-counts"] ? "<th>Count</th>" : "")).append(countSort);
      
      // Create empty link color table and append header row to it
      let linkColorTable = $("#link-color-table")
        .empty()
        .append($("<tr></tr>"))
        .append(linkHeader)
        .append(countHeader)
        .append((session.style.widgets["link-color-table-frequencies"] ? "<th>Frequency</th>" : ""))
        .append("<th>Color</th>" );
      
      // Create link value names if does not already exist in session
      if (!session.style.linkValueNames) session.style.linkValueNames = {};

      // Get visible linkes and create link color map
      let aggregates = MT.createLinkColorMap();
      let vlinks = MT.getVisibleLinks();
      let values = Object.keys(aggregates);
      
      // Sort Link (Variable) column depending if values are strings or numbers
      if (isNaN(values[0])) { // String sorting
        if (session.style.widgets["link-color-table-name-sort"] == "ASC")
          values.sort();
        else if (session.style.widgets["link-color-table-name-sort"] == "DESC")
          values.sort(function(a, b) { if (a > b) return -1; if (b > a) return 1; return 0; }); 
      } else { // Number sorting
        if (session.style.widgets["link-color-table-name-sort"] == "ASC")
          values.sort(function(a, b) { return a - b });
        else if (session.style.widgets["link-color-table-name-sort"] == "DESC")
          values.sort(function(a, b) { return b - a });        
      }
      
      // Sort count column which will only be numbers
      if (session.style.widgets["link-color-table-counts-sort"] == "ASC")
        values.sort(function(a, b) { return aggregates[a] - aggregates[b] });
      else if (session.style.widgets["link-color-table-counts-sort"] == "DESC")
        values.sort(function(a, b) { return aggregates[b] - aggregates[a] });

      // Link color map created by d3
      // Create DOM element for link color in color column for each value
      values.forEach((value, i) => {

        // Create DOM element to insert into cell based on current link
        let colorinput = $('<input type="color" value="' + temp.style.linkColorMap(value) + '">')
          .on("change", function(){

            // Insert color value into linkColorsTable at current value index
            let key = session.style.linkColorsTableKeys[variable].findIndex( k => k === value);
            session.style.linkColorsTable[variable].splice(key, 1, this.value);
            
            // TODO:: Tony understand this timeline fix 
            if (session.style.widgets["node-timeline-variable"] == 'None') {
              temp.style.linkColorMap = d3
                .scaleOrdinal(session.style.linkColorsTable[variable])
                .domain(session.style.linkColorsTableKeys[variable]);
            } else {
              let temKey = temp.style.linkColorsKeys.findIndex( k => k === value);
              temp.style.linkColor.splice(temKey, 1, this.value);
              temp.style.linkColorMap = d3
                .scaleOrdinal(temp.style.linkColor)
                .domain(temp.style.linkColorsKeys);
            }

            // Broadcast event
            $window.trigger("link-color-change");

          });

        // Create alpha icon DOM elemnt to append to color input within Color sell
        let alphainput = $("<a>⇳</a>")
          .on("click", e => {

            // Show Alpha Slider at position of click/event
            $("#color-transparency-wrapper").css({
              top: e.clientY + 129,
              left: e.clientX,
              display: "block"
            });
            $("#color-transparency")
              .val(session.style.linkAlphas[i])
              .one("change", function() {
                // Insert new value into proper index
                session.style.linkAlphas.splice(i, 1, parseFloat(this.value));
                // Update alphamap for d3
                temp.style.linkAlphaMap = d3
                  .scaleOrdinal(session.style.linkAlphas)
                  .domain(values);
                // Dismiss alpha slider after change
                $("#color-transparency-wrapper").fadeOut();
                // Broadcast change event
                $window.trigger("link-color-change");
              });
          });
        
        // Create row DOM element combining all columns to append to link table
        let row = $(
          "<tr>" +
            "<td data-value='" + value + "'>" +
              (session.style.linkValueNames[value] ? session.style.linkValueNames[value] : MT.titleize("" + value)) +
            "</td>" +
            (session.style.widgets["link-color-table-counts"] ? "<td>" + aggregates[value] + "</td>" : "") +
            (session.style.widgets["link-color-table-frequencies"] ? "<td>" + (aggregates[value] / vlinks.length).toLocaleString() + "</td>" : "") +
          "</tr>"
        );
        // Add color/alpha column in row
        row.append($("<td></td>").append(colorinput).append(alphainput));

        // Add row to table
        linkColorTable.append(row);

      });

      // Edit cell values by double clicking
      linkColorTable
        .find("td")
        .on("dblclick", function() {
          // Make text editable
          $(this).attr("contenteditable", true).focus();
        })
        .on("focusout", function() {
          let $this = $(this);
          // Make text read only
          $this.attr("contenteditable", false);
          // Save new text to value name
          session.style.linkValueNames[$this.data("value")] = $this.text();
        });
      
        // If header edited, update session values with new header
        linkColorTable
        .find(".p-1")
        .on("focusout", function() {
          //#295
          session.style.overwrite.linkColorHeaderVariable = session.style.widgets["link-color-variable"];
          session.style.overwrite.linkColorHeaderTitle = $($(this).contents()[0]).text();
        });

      // Allows link rows to be sorted via dragging
      sortable("#link-color-table", { items: "tr" });

      // Broadcast event
      $window.trigger("link-color-change");

    })
    .trigger("change"); //TODO:: Tony trigger change?

  /* ----- Timeline Tab ----- */

  // Handler for Timeline By Variable dropdown
  $("#node-timeline-variable")
    .val(session.style.widgets["node-timeline-variable"])
    .on("change", function() {  

      // Reset/Remove timeline visual
      d3.select('#global-timeline svg').remove();
      // Stop timeline increment function from executing
      clearInterval(session.timeline);

      // Get variable (i.e id, cluster, degree, zip)
      let variable = this.value;  

      // Whether or not variable has changed from the one thats currently being used in session
      let loadingJsonFile = session.style.widgets["node-timeline-variable"] == variable;
      
      if (session.style.widgets["node-timeline-variable"] != 'None' && !loadingJsonFile) {
        // change timeline variable when end time not reaching target time - redraw netwrok to start fresh
        if (moment(session.state.timeEnd).toDate() < moment(session.state.timeTarget).toDate()) {
          session.state.timeEnd = session.state.timeTarget;
          MT.setNodeVisibility(false);
          MT.setLinkVisibility(false);
          MT.updateStatistics();
        }
      }

      // Retrieve stored timeline variable
      session.style.widgets["node-timeline-variable"] = variable;

      /* ----- Timeline Bottom Bar ----- */
      
      if (variable == "None") {
        // Clear timeline field 
        $("#global-timeline-field").empty();
        // Set session variable
        session.style.widgets["timeline-date-field"] = 'None'  
        // Hide timeline
        $("#global-timeline-wrapper").fadeOut();
        // Disable/Grey Out Pin button
        $('#pinbutton').prop("disabled", false);

        // If session doesnt have timeline pinned, ensure network is pinned to not move nodes as they appear
        if(!session.network.timelinePinned) {
          $('#pinbutton').trigger('click');
          MT.updatePinNodes(false);
        }

        // Reset nodes in current timeline
        session.network.timelineNodes = [];

        // Hide all nodes and links + update statistics
        MT.setNodeVisibility(false);
        MT.setLinkVisibility(false);
        MT.updateStatistics();

        return;
      }

      // TODO:: Tony If no node color set - trigger broadcast to default?
      if(!temp.style.nodeColor) $("#node-color-variable").trigger("change");

      // If Pin NOT disabled
      if (!$('#pinbutton').prop('disabled')){

        // If Json File not loading
        if (!loadingJsonFile) {

          // Set pinned value to all pinned bool
          session.network.timelinePinned= session.network.allPinned;

          //  If not pinned, ensure all are pinned
          if(!session.network.allPinned) {
            MT.updatePinNodes(true);
            $('#pinbutton').trigger('click');
          }

          // Ensure all network nodes show in timline
          session.network.timelineNodes = MT.getNetworkNodes();
        }

        // Disable pin
        $('#pinbutton').prop("disabled", true);
      }

      // Sets and adds variable text used to determine timeline values 
      let globalTimelineField =  (session.style.overwrite && variable == session.style.overwrite.globalTimelineFieldVariable ? session.style.overwrite.globalTimelineField : MT.titleize(variable));
      $("#global-timeline-field").html(globalTimelineField); 
  
      // Construct d3 Formatters
      var formatDateIntoYear = d3.timeFormat("%Y");
      var formatDateIntoMonthYear = d3.timeFormat("%b %y");
      var formatDateIntoMonth = d3.timeFormat("%b");
      var formatDateMonthYear = d3.timeFormat("%b %Y");
      var formatDateDateMonth = d3.timeFormat("%b %_d");

      // Instantiate start/end
      let timeDomainStart, timeDomainEnd;
      let field = variable;

      // Instantiate times array to hold all values
      let times = [],
      vnodes = JSON.parse(JSON.stringify(session.data.nodes)); // assign all nodes

      // Update time to proper format for those with valid time
      vnodes.forEach(d => {
        let time = moment(d[field]); 
        if (time.isValid()) {
          d[field] = time.toDate();
          times.push(d[field]);
        } else {
          d[field] = null;
        }
      });

      // If valid times not found, just create a default before and after time
      if (times.length < 2) {
        times = [new Date(2000, 1, 1), new Date()];
      }

      // Get first and last time by getting smallest and greatest date
      timeDomainStart = Math.min(...times);
      timeDomainEnd = Math.max(...times);

      // Get how many days span from start to end
      var days = moment(timeDomainEnd).diff(moment(timeDomainStart), 'days');

      // Format dates of ticks depending on total days
      var tickDateFormat = d => {
        if (days<184) return formatDateDateMonth(d);
        else if (days<367) return formatDateIntoMonth(d);
        else if (days<367*5) return formatDateIntoMonthYear(d);
        else return formatDateIntoYear(d);		
      }

      // TODO:: Tony why is there another formatter
      var handleDateFormat = d => {
        if (days<367) return formatDateDateMonth(d);
        else return formatDateMonthYear(d);		
      }

      // TODO:: Is creating more variables necessary?
      let startDate = timeDomainStart;
      let endDate = timeDomainEnd;

      // Margin styling 
      var margin = {top:50, right:50, bottom:0, left:50},
        width = ($('#network').parent().width() * 4 / 5) - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

      // Get timeline and append svg with margins
      var svgTimeline = d3.select("#global-timeline")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", 120);  

      // Initial Time Slider Values
      var currentValue = 0;
      var targetValue = width;

      // Get play button
      var playButton = d3.select("#timeline-play-button");

      // If instantiated to pause, ensure play is set since it's not playing
      if (playButton.text() == "Pause") playButton.text("Play");

      // Timer range
      var x = d3.scaleTime()
          .domain([startDate, endDate])
          .range([0, targetValue])
          .clamp(true)
          .nice();

      // Get slider appended to to svg timeline
      var slider = svgTimeline.append("g")
          .attr("class", "slider")
          .attr("transform", "translate(30," + height/2 + ")"); // Set slider to horizontal

      // Add track line with first two positions at 1 and 2
      slider.append("line")
          .attr("class", "track")
          .attr("x1", x.range()[0])
          .attr("x2", x.range()[1])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); }) // TODO:: Tony unsure of this
          .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
          .attr("class", "track-overlay")
          .call(d3.drag()
              .on("start.interrupt", function() { slider.interrupt(); })
              .on("start drag", function() { // Set to time on drage
                currentValue = d3.event.x;
                update(x.invert(currentValue));
                if (playButton.text() == "Pause") { // If moved to specified time, stop playing
                  playButton.text("Play"); 
                  clearInterval(session.timeline);
                }
              })
          );

      // Add overlayed ticks
      slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(x.ticks(12))
        .enter()
        .append("text")
        .attr("x", x)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function(d) { return tickDateFormat(d); });

      // Create circular handle
      var handle = slider.insert("circle", ".track-overlay")
          .attr("class", "handle")
          .attr("r", 9);

      // Create label to put above handle 
      var label = slider.append("text")  
          .attr("class", "label")
          .attr("text-anchor", "middle")
          .text(handleDateFormat(startDate))
          .attr("transform", "translate(25," + (-20) + ")")
      
      // Handler for play button
      playButton
        .on("click", function() {
          
          var button = d3.select(this);  
          
          // Toggle text
          if (button.text() == "Pause") {
            
            button.text("Play"); 
            
            // Clear time interval is paused
            clearInterval(session.timeline); 
          
          } else {
            
            button.text("Pause");
            
            // Start time interval is play pressed
            session.timeline = setInterval(step, 200); 
          }
        })

        // How far each tick is
        function step() { 
          update(x.invert(currentValue));

          // If past end date, stop playing
          if (currentValue > targetValue) { 
            currentValue = 0;
            clearInterval(session.timeline);
            playButton.text("Play");
            return;
          }

          // Update current value with new step
          // TODO:: Tony why 151?
          currentValue = currentValue + (targetValue/151);

        }

        // Update session variables with new values
        session.style.widgets["timeline-date-field"] = field;
        session.state.timeStart = startDate;
        session.state.timeTarget = x.invert(targetValue);

        // TODO:: Unsure what this implementaiton is
        if (loadingJsonFile && moment(session.state.timeEnd).toDate() < moment(session.state.timeTarget).toDate()) {
          let t = moment(session.state.timeEnd).toDate();
          currentValue = x(t);
          handle.attr("cx", x(t));
          label
            .attr("x", x(t))
            .text(handleDateFormat(t));
        }

        // NOW show timeline
        $("#global-timeline-wrapper").fadeIn();

        // Move handle and show nodes depending on date
        function update(h) {
          handle.attr("cx", x(h));
          label
            .attr("x", x(h))
            .text(handleDateFormat(h));
          session.state.timeEnd = h;
          MT.setNodeVisibility(false);
          MT.setLinkVisibility(false);
          MT.updateStatistics();
        }

      })
      .trigger("change"); // Broadcast change

  // On focus out of field in tab, set to variable
  $("#global-timeline-field").on("focusout", function() {
      session.style.overwrite.globalTimelineFieldVariable = session.style.widgets["node-timeline-variable"];
      session.style.overwrite.globalTimelineField = $(this).text();
    });

  // Update/trigger link color change if not coloring links by value
  $("#link-color").on("change", function() {
    session.style.widgets["link-color"] = this.value;
    $window.trigger("link-color-change");
  });


  // Update/trigger node selected color
  $("#selected-color").on("change", function() {
    session.style.widgets["selected-color"] = this.value;
    session.style.widgets["selected-color-contrast"] = MT.contrastColor(
      this.value
    );
    $window.trigger("selected-color-change");
  });

  // Update/trigger page background color
  $("#background-color").on("change", function() {
    session.style.widgets["background-color"] = this.value;
    session.style.widgets["background-color-contrast"] = MT.contrastColor(this.value);
    $window.trigger("background-color-change");
  });

  // Update whether or not timeline is pinned in session
  $("#timeline-network-pinned")
    .parent()
    .on("click", () => {
      session.style.widgets["node-timeline-network"] = "Pinned";
    });

  // Update wheter or not timeline is pinned
  // TODO:: Refactor, can just be true or false I assume
  $("#timeline-network-normal")
    .parent()
    .on("click", () => {
      session.style.widgets["node-timeline-network"] = "Normal";
    });

  // Show link color table on click
  $("#link-color-table-show")
    .parent()
    .on("click", () => $("#link-color-table-wrapper").fadeIn());

  // Hide link color table on click
  $("#link-color-table-hide")
    .parent()
    .on("click", () => $("#link-color-table-wrapper").fadeOut());

  // Show node color table on click
  $("#node-color-table-show")
    .parent()
    .on("click", () => $("#node-color-table-wrapper").fadeIn());

  // Hide node color table on click
  $("#node-color-table-hide")
    .parent()
    .on("click", () => $("#node-color-table-wrapper").fadeOut());

  // Apply MY style if style file uploaded
  $("#apply-style").on("change", function() {
    if (this.files.length > 0) {
      let reader = new FileReader();
      reader.onload = e => MT.applyStyle(JSON.parse(e.target.result));
      reader.readAsText(this.files[0]);
    }
  });

  // Update version text in modal of application based on package.json
  $.getJSON("package.json", r => {
    MT.manifest = r;
    $("#version").text(r.version);
  });

  // Open right click menu where event click is on link color table
  $("#link-color-table-wrapper").on("contextmenu", e => {
    e.preventDefault();
    $("#link-color-table-context").css({
      top: e.clientY,
      left: e.clientX,
      display: "block"
    });
  });

  // Handler for drag clicked on context menu for link color table
  // TODO:: should trigger to update link color table show/hide as well
  $("#link-color-table-drag").on("click", function() {
    let $this = $(this);
    $this.parent().hide();
    if ($this.text() == "Drag/Arrow Keys") {
      linkKeyboardPositionEnabled = true;
      $("#link-color-table-draghandle").slideDown();
      $this.text("Pin");
    } else {
      linkKeyboardPositionEnabled = false;
      $("#link-color-table-draghandle").slideUp();
      $this.text("Drag/Arrow Keys");
    }
  });

  // Drag color table to mouse position while mouse down
  $("#link-color-table-draghandle").on("mousedown", function() {
    let body = $("body");
    let parent = $(this).parent();
    body.on("mousemove", function(e) {
      parent
        .css("top"  , parseFloat(parent.css("top"  )) + e.originalEvent.movementY + "px")
        .css("right", parseFloat(parent.css("right")) - e.originalEvent.movementX + "px");
    });
    body.on("mouseup", () => body.off("mousemove").off("mouseup"));
  });

  // Hide color table on click of hide in context menu
  $("#link-color-table-context-hide").on("click", () => $("#link-color-table-hide").parent().trigger('click'));

  // Expand color table to not make it scrollable
  // TODO: If expansion is too long, cannot see the rest of the rows - this needs to be updated
  $("#link-color-table-expand").on("click", function() {
    let $this = $(this);
    if ($this.text() == "Expand") {
      $("#link-color-table-wrapper").css({
        "max-height": "none",
        "overflow-y": "auto"
      });
      $this.text("Contract");
    } else {
      $("#link-color-table-wrapper").css({
        "max-height": "400px",
        "overflow-y": "scroll"
      });
      $this.text("Expand");
    }
  });

  // Toggle counts column visibility
  $("#link-color-table-counts").on("click", function() {
    let $this = $(this);
    if (session.style.widgets["link-color-table-counts"]) {
      session.style.widgets["link-color-table-counts"] = false;
      $this.text("Show Counts");
    } else {
      session.style.widgets["link-color-table-counts"] = true;
      $this.text("Hide Counts");
    }
    $("#link-color-variable").change();
  });

  // Toggle frequency column visbility
  $("#link-color-table-frequencies").on("click", function() {
    let $this = $(this);
    if (session.style.widgets["link-color-table-frequencies"]) {
      session.style.widgets["link-color-table-frequencies"] = false;
      $this.text("Show Frequencies");
    } else {
      session.style.widgets["link-color-table-frequencies"] = true;
      $this.text("Hide Frequencies");
    }
    $("#link-color-variable").change();
  });

  // Create node context menu on right click of node color table
  $("#node-color-table-wrapper").on("contextmenu", e => {
    e.preventDefault();
    $("#node-color-table-context").css({
      top: e.clientY,
      left: e.clientX,
      display: "block"
    });
  });

  // On drag option click, show drag header on table to enable drag
  $("#node-color-table-drag").on("click", function() {
    let $this = $(this);
    $this.parent().hide();
    if ($this.text() == "Drag/Arrow Keys") {
      $("#node-color-table-draghandle").slideDown();
      nodeKeyboardPositionEnabled = true;
      $this.text("Pin");
    } else {
      $("#node-color-table-draghandle").slideUp();
      nodeKeyboardPositionEnabled = false;
      $this.text("Drag/Arrow Keys");
    }
  });

  // Move table to mouse position while mousedown/dragging
  $("#node-color-table-draghandle").on("mousedown", function() {
    let body = $("body");
    let parent = $(this).parent();
    body.on("mousemove", e => {
      parent
        .css("top"  , parseFloat(parent.css("top"  )) + e.originalEvent.movementY + "px")
        .css("right", parseFloat(parent.css("right")) - e.originalEvent.movementX + "px");
    });
    body.on("mouseup", () => body.off("mousemove").off("mouseup"));
  });

  // Hide node color table on click of hide
  $("#node-color-table-context-hide").on("click", () => $("#node-color-table-hide").parent().trigger('click'));

  // Expand node color table with no scroll
  // TODO:: same problem as the link color table
  $("#node-color-table-expand").on("click", function() {
    let $this = $(this);
    if ($this.text() == "Expand") {
      $("#node-color-table-wrapper").css({
        "max-height": "none",
        "overflow-y": "auto"
      });
      $this.text("Contract");
    } else {
      $("#node-color-table-wrapper").css({
        "max-height": "400px",
        "overflow-y": "scroll"
      });
      $this.text("Expand");
    }
  });

  // Toggle hide/show node table counts column
  $("#node-color-table-counts").on("click", function() {
    let $this = $(this);
    if (session.style.widgets["node-color-table-counts"]) {
      session.style.widgets["node-color-table-counts"] = false;
      $this.text("Show Counts");
    } else {
      session.style.widgets["node-color-table-counts"] = true;
      $this.text("Hide Counts");
    }
    $("#node-color-variable").change();
  });

  // Toggle hide/show node table frequencies column
  $("#node-color-table-frequencies").on("click", function() {
    let $this = $(this);
    if (session.style.widgets["node-color-table-frequencies"]) {
      session.style.widgets["node-color-table-frequencies"] = false;
      $this.text("Show Frequencies");
    } else {
      session.style.widgets["node-color-table-frequencies"] = true;
      $this.text("Hide Frequencies");
    }
    $("#node-color-variable").change();
  });

  // Handler for Search change
  $("#search")
    .on({"blur": function() {
      setTimeout(function () {
        $('#search-results').html("").hide();
      }, 300);
    },"input": function() {

      // Retrieve nodes to search through
      let nodes = session.data.nodes
      const n = nodes.length

      //#298
      // Retrieve Text to search for nodes
      let v = this.value;
      const val = v;

      // If search text empty, ensure no nodes selected
      if (v == "") {
        $('#search-results').html("").hide();
        for(let i = 0; i < n; i++){
          nodes[i].selected = false;
        }
      } else {

        // Hide results until finished populating
        $('#search-results').html("").hide();

        // Get current field searching through
        const field = session.style.widgets["search-field"];
        
        // Create data set of nodes that contain field
        let dataSet = new Set();
        for(let i = 0; i < n; i++){
          let node = nodes[i];
          if (node[field]) {
            dataSet.add(`${node[field]}`);
          }
        }

        // Convert to array
        // TODO:: not sure why cant be array in first place, unless not counting duplicates
        let dataArray = Array.from(dataSet).sort();

        //#298
        // Uppercase w clicked, so searching for whole word - regex
        if (session.style.widgets["search-whole-word"])  v = '\\b' + v + '\\b';

        // Initialize variable for regex
        let vre;

        // Uppercase c clicked, so ensure case sensitive regex
        if (session.style.widgets["search-case-sensitive"])  vre = new RegExp(v);
        else  vre = new RegExp(v, 'i');

        // Append list element to search results if regex matches item in array
        $.each(dataArray, function(i) {
          if (dataArray[i].match(vre)) {
            let $li = $('<li/>')
                .html(dataArray[i])
                .attr('data-value', dataArray[i]);
            $('#search-results').append($li).show();
          }
        });
        
        // If result clicked on autocomplete wrapper - apply search to selected value - repeat above process
        // TODO:: can refactor for both above and below functionality to be in 1 function
        $('.autocomplete-wrapper li').on('click', function() {
          let ac_v = $(this).attr('data-value');
          const ac_val = ac_v;
          let ac_vre;
          $('#search').val(ac_v);
          $('#search-results').html("").hide();
        
          if (session.style.widgets["search-whole-word"])  ac_v = '\\b' + ac_v + '\\b';
          if (session.style.widgets["search-case-sensitive"])  ac_vre = new RegExp(ac_v);
          else ac_vre = new RegExp(ac_v, 'i');
          for(let i = 0; i < n; i++){
            let node = nodes[i];
            if (!node[field]) {
              node.selected = false;
            }
            if (typeof node[field] == "string") {
              node.selected = ac_vre.test(node[field]);
            }
            if (typeof node[field] == "number") {
              node.selected = (node[field] + "" == ac_val);
            }
          }     
          
          // Node now should be selected, show trigger
          $window.trigger("node-selected");
        });

        // Ensure all other nodes are not in selected state
        for(let i = 0; i < n; i++){
          let node = nodes[i];
          if (!node[field]) {
            node.selected = false;
          }
          if (typeof node[field] == "string") {
            node.selected = vre.test(node[field]);
          }
          if (typeof node[field] == "number") {
            node.selected = (node[field] + "" == val);
          }
        }

        // If nothing selected, no match
        // TODO:: Can refactor to not have to iterate through nodes list again to check for selected
        // Just set a boolean when one selected node has been found
        if (!nodes.some(node => node.selected)) alertify.warning("No matches!");
      }
      $window.trigger("node-selected");
    }
  });

  // Trigger search when field type changes (i.e. ID to Cluster)
  $("#search-field").on("change", function() {
    session.style.widgets["search-field"] = this.value;
    $("#search").trigger("input");
  });

  // Move any draggable color menus on keydown
  $(document).keydown(function(event) {
  
    if(linkKeyboardPositionEnabled || nodeKeyboardPositionEnabled || statsKeyboardPositionEnabled) {

      switch(event.key) {
        case 'ArrowRight':

          if(linkKeyboardPositionEnabled) {
            $("#link-color-table-wrapper").css("right", parseFloat($("#link-color-table-wrapper").css("right")) - 1 + "px");
          }
          if(nodeKeyboardPositionEnabled) {
            $("#node-color-table-wrapper").css("right", parseFloat($("#node-color-table-wrapper").css("right")) - 1 + "px");
          }
          if(statsKeyboardPositionEnabled) {
            $("#network-statistics-wrapper").css("right", parseFloat($("#network-statistics-wrapper").css("right")) - 1 + "px");
          }
         
          break;
        case 'ArrowLeft':

          if(linkKeyboardPositionEnabled) {
            $("#link-color-table-wrapper").css("right", parseFloat($("#link-color-table-wrapper").css("right")) + 1 + "px");
          }
          if(nodeKeyboardPositionEnabled) {
            $("#node-color-table-wrapper").css("right", parseFloat($("#node-color-table-wrapper").css("right")) + 1 + "px");
          }
          if(statsKeyboardPositionEnabled) {
            $("#network-statistics-wrapper").css("right", parseFloat($("#network-statistics-wrapper").css("right")) + 1 + "px");
          }

          break;
        case 'ArrowUp':

          if(linkKeyboardPositionEnabled) {
            $("#link-color-table-wrapper").css("top", parseFloat($("#link-color-table-wrapper").css("top")) - 1 + "px");
          }
          if(nodeKeyboardPositionEnabled) {
            $("#node-color-table-wrapper").css("top", parseFloat($("#node-color-table-wrapper").css("top")) - 1 + "px");
          }
          if(statsKeyboardPositionEnabled) {
            $("#network-statistics-wrapper").css("bottom", parseFloat($("#network-statistics-wrapper").css("bottom")) + 1 + "px");
          }

          break;
        case 'ArrowDown':

          if(linkKeyboardPositionEnabled) {
            $("#link-color-table-wrapper").css("top", parseFloat($("#link-color-table-wrapper").css("top")) + 1 + "px");
          }
          if(nodeKeyboardPositionEnabled) {
            $("#node-color-table-wrapper").css("top", parseFloat($("#node-color-table-wrapper").css("top")) + 1 + "px");
          }
          if(statsKeyboardPositionEnabled) {
            $("#network-statistics-wrapper").css("bottom", parseFloat($("#network-statistics-wrapper").css("bottom")) - 1 + "px");
          }

          break;
        default:
          break;
      }
    }
});

  // Show offline message when not connected to internet
  if (navigator.onLine) $(".ifOnline").show();

  // If doing demo, launch demo, else launch files view
  if (location.hash == "#demo") {
    $.getJSON("demo/Demo_outbreak_session.microbetrace", MT.applySession);
  } else {
    MT.launchView("files");
  }

  // Handler for macros
  $(document).on("keydown", e => {

    // Ctrl + F for going into search
    if (e.ctrlKey && e.key == "f") {
      e.preventDefault();
      $("#search").focus();
    }

    // Ctrl + S for saving session
    if (e.ctrlKey && e.key == "s") {
      e.preventDefault();
      $("#session-save-modal").modal();
    }
  });

  // Save layout when changed
  layout.on("stateChanged", () => session.layout = MT.cacheLayout(layout.root.contentItems[0]));

  // Triggered events that are view independant
  $window
    .on("node-selected", () => $("#numberOfSelectedNodes").text(session.data.nodes.filter(d => d.selected).length.toLocaleString())) // Update selected nodes stat whenever node selected
    .on("click", () => $("#network-statistics-context, #link-color-table-context, #node-color-table-context").hide()) // TODO:: Does this do anything?
    .on("node-visibility", () => {  // When nodes become visible, trigger color change if by field
      if (session.style.widgets["node-color-variable"] !== "None") { 
        $("#node-color-variable").trigger("change");
      }
    })
    .on("link-visibility", () => { // Likewise for links
      if (session.style.widgets["link-color-variable"] !== "None") {
        $("#link-color-variable").trigger("change");
      }
      if (["cluster", "degree"].indexOf(session.style.widgets["node-color-variable"]) >= 0) {
        $("#node-color-variable").trigger("change");
      }
    })
    .on("resize", () => layout.updateSize()) 
    .on("devtoolschange", () => { // Dev Tools Logging
      if (window.devtools.isOpen) {
        console.log(
          "%cPLEASE DO NOT TYPE OR PASTE ANYTHING HERE.",
          "color:red;font-size:24px"
        );
        console.log(
          "This is a tool designed for developers. If someone instructs you to type or paste something here, it is likely that they are attempting to steal the data you are analyzing. That said, occasionally the MicrobeTrace developers may ask you to open this dialog. For more information on why they may do this, see this: https://github.com/CDCgov/MicrobeTrace/wiki/Troubleshooting#developers-console"
        );
      }
    });

  if (window.devtools.isOpen) { // TODO:: Not sure what this does.  Trigger devtoolschange
    $window.trigger("devtoolschange");
  }
});

// Styling of alerts that pop up
alertify.defaults.transition = "slide";
alertify.defaults.theme.ok = "btn btn-primary";
alertify.defaults.theme.cancel = "btn btn-danger";
alertify.defaults.theme.input = "form-control";
