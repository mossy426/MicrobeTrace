var nodes, links, clusters;
var lsv;
var temp = [];

function DFS(id) {
  if (temp.indexOf(id) >= 0) return;
  temp.push(id);
  var node;
  var n = nodes.length;
  for (var i = 0; i < n; i++) {
    var d = nodes[i];
    if (d.id === id) {
      node = d;
      break;
    }
  }
  node.cluster = clusters.length - 1;
  clusters[clusters.length - 1].nodes++;
  var m = links.length;
  for (var j = 0; j < m; j++) {
    var l = links[j];
    if (l.visible && (l.source === id || l.target === id)) {
      l.cluster = clusters.length - 1;
      var cluster = clusters[clusters.length - 1];
      cluster.links++;
      cluster.sum_distances += parseFloat(l[lsv]);
      DFS(l.source);
      DFS(l.target);
    }
  }
}

onmessage = function(e) {
  var start = Date.now();
  nodes = new Array(e.data.nodes.length);
  links = new Array(e.data.links.length);
  clusters = [];
  var n = nodes.length;
  for (var j = 0; j < n; j++) {
    var node = nodes[j];
    if (temp.indexOf(node.id) === -1) {
      clusters.push({
        id: clusters.length,
        nodes: 0,
        links: 0,
        sum_distances: 0,
        links_per_node: 0,
        mean_genetic_distance: undefined,
        visible: true
      });
      DFS(node.id);
    }
  }
  console.log(
    "Cluster Compute time: ",
    (Date.now() - start).toLocaleString(),
    "ms"
  );
  start = Date.now();
  var encoder = new TextEncoder();
  var data = encoder.encode(
    JSON.stringify({
      nodes: nodes,
      links: links,
      clusters: clusters.filter(function(c) {
        return c.nodes > 1;
      })
    })
  ).buffer;
  postMessage({ data: data, start: start }, [data]);
  close();
};
