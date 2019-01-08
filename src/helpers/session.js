export function dataSkeleton(){
  return {
    nodes: [],
    links: [],
    clusters: [],
    distance_matrix: {},
    trees: {},
    nodeFields: ['index', 'id', 'selected', 'cluster', 'visible', 'degree', 'origin'],
    linkFields: ['index', 'source', 'target', 'visible', 'cluster', 'origin'],
    clusterFields: ['id', 'index', 'nodes', 'links', 'sum_distances', 'links_per_node', 'mean_genetic_distance', 'visible'],
    reference: 'CCTCAGGTCACTCTTTGGCAACGACCCCTCGTCACAATAAAGATAGGGGGGCAACTAAAGGAAGCTCTATTAGATACAGGAGCAGATGATACAGTATTAGAAGAAATGAGTTTGCCAGGAAGATGGAAACCAAAAATGATAGGGGGAATTGGAGGTTTTATCAAAGTAAGACAGTATGATCAGATACTCATAGAAATCTGTGGACATAAAGCTATAGGTACAGTATTAGTAGGACCTACACCTGTCAACATAATTGGAAGAAATCTGTTGACTCAGATTGGTTGCACTTTAAATTTTCCCATTAGCCCTATTGAGACTGTACCAGTAAAATTAAAGCCAGGAATGGATGGCCCAAAAGTTAAACAATGGCCATTGACAGAAGAAAAAATAAAAGCATTAGTAGAAATTTGTACAGAGATGGAAAAGGAAGGGAAAATTTCAAAAATTGGGCCTGAAAATCCATACAATACTCCAGTATTTGCCATAAAGAAAAAAGACAGTACTAAATGGAGAAAATTAGTAGATTTCAGAGAACTTAATAAGAGAACTCAAGACTTCTGGGAAGTTCAATTAGGAATACCACATCCCGCAGGGTTAAAAAAGAAAAAATCAGTAACAGTACTGGATGTGGGTGATGCATATTTTTCAGTTCCCTTAGATGAAGACTTCAGGAAGTATACTGCATTTACCATACCTAGTATAAACAATGAGACACCAGGGATTAGATATCAGTACAATGTGCTTCCACAGGGATGGAAAGGATCACCAGCAATATTCCAAAGTAGCATGACAAAAATCTTAGAGCCTTTTAGAAAACAAAATCCAGACATAGTTATCTATCAATACATGGATGATTTGTATGTAGGATCTGACTTAGAAATAGGGCAGCATAGAACAAAAATAGAGGAGCTGAGACAACATCTGTTGAGGTGGGGACTTACCACACCAGACAAAAAACATCAGAAAGAACCTCCATTCCTTTGGATGGGTTATGAACTCCATCCTGATAAATGGACAGTACAGCCTATAGTGCTGCCAGAAAAAGACAGCTGGACTGTCAATGACATACAGAAGTTAGTGGGGAAATTGAATTGGGCAAGTCAGATTTACCCAGGGATTAAAGTAAGGCAATTATGTAAACTCCTTAGAGGAACCAAAGCACTAACAGAAGTAATACCACTAACAGAAGAAGCAGAGCTAGAACTGGCAGAAAACAGAGAGATTCTAAAAGAACCAGTACATGGAGTGTATTATGACCCATCAAAAGACTTAATAGCAGAAATACAGAAGCAGGGGCAAGGCCAATGGACATATCAAATTTATCAAGAGCCATTTAAAAATCTGAAAACAGGAAAATATGCAAGAATGAGGGGTGCCCACACTAATGATGTAAAACAATTAACAGAGGCAGTGCAAAAAATAACCACAGAAAGCATAGTAATATGGGGAAAGACTCCTAAATTTAAACTGCCCATACAAAAGGAAACATGGGAAACATGGTGGACAGAGTATTGGCAAGCCACCTGGATTCCTGAGTGGGAGTTTGTTAATACCCCTCCCTTAGTGAAATTATGGTACCAGTTAGAGAAAGAACCCATAGTAGGAGCAGAAACCTTC'
  };
};

export const defaultWidgets = {
  '3DNet-link-tooltip-variable': 'None',
  '3DNet-link-transparency': 0,
  '3DNet-link-width': 1.6,
  '3DNet-node-tooltip-variable': 'id',
  '3DNet-node-radius': 4,
  '3DNet-node-radius-variable': 'None',
  'background-color': '#ffffff',
  'background-color-contrast': '#000000',
  'bubble-x': 'None',
  'bubble-y': 'None',
  'bubble-size': 5,
  'flow-showNodes': 'selected',
  'heatmap-metric': 'tn93',
  'heatmap-invertX': false,
  'heatmap-invertY': false,
  'heatmap-color-high': '#a50026',
  'heatmap-color-medium': '#ffffbf',
  'heatmap-color-low': '#313695',
  'heatmap-axislabels-show': false,
  'histogram-axis-x': true,
  'histogram-scale-log': false,
  'histogram-variable': 'links-tn93',
  'link-color': '#a6cee3',
  'link-color-variable': 'None',
  'link-directed': false,
  'link-label-variable': 'None',
  'link-length': 0.125,
  'link-opacity': 0,
  'link-tooltip-variable': 'None',
  'link-width': 3,
  'link-width-variable': 'None',
  'link-width-reciprocal': true,
  'map-basemap-show': false,
  'map-counties-show': false,
  'map-countries-show': true,
  'map-field-lat': 'None',
  'map-field-lon': 'None',
  'map-field-tract': 'None',
  'map-field-zipcode': 'None',
  'map-field-county': 'None',
  'map-field-state': 'None',
  'map-field-country': 'None',
  'map-link-show': false,
  'map-link-tooltip-variable': 'None',
  'map-link-transparency': 0,
  'map-node-jitter': 0,
  'map-node-show': true,
  'map-node-tooltip-variable': 'id',
  'map-node-transparency': 0,
  'map-satellite-show': false,
  'map-states-show': true,
  'network-friction': 0.4,
  'network-gravity': 0.05,
  'node-charge': 200,
  'node-color': '#1f77b4',
  'node-color-variable': 'None',
  'node-highlight': false,
  'node-label-size': 16,
  'node-label-variable': 'None',
  'node-radius': 250,
  'node-radius-variable': 'None',
  'node-symbol': 'symbolCircle',
  'node-symbol-variable': 'None',
  'node-tooltip-variable': 'id',
  'scatterplot-xVar': 'snps',
  'scatterplot-yVar': 'tn93',
  'scatterplot-logScale': false,
  'scatterplot-showNodes': false,
  'selected-color': '#ff8300',
  'selected-color-contrast': '#000000',
  'tree-epsilon': -10,
  'tree-metric': 'tn93',
  'tree-layout-circular': false,
  'tree-labels-align': false,
  'tree-labels-show': true
};

export function sessionSkeleton(){
  return {
    data: dataSkeleton(),
    files: [],
    layout: {
      content: [{
        type: 'files'
      }],
      type: 'stack'
    },
    meta: {
      loadTime: 0,
      startTime: 0
    },
    network: {
      allPinned: false,
      nodes: []
    },
    state: {
      linkSortVariable: 'tn93',
      linkThreshold: 0.015,
      metrics: ['tn93', 'snps'],
      timeStart: 0,
      timeEnd: Date.now()
    },
    style: {
      linkColors: d3.schemePaired,
      nodeColors: [d3.schemeCategory10[0]].concat(d3.schemeCategory10.slice(2)),
      nodeSymbols: ['symbolCircle', 'symbolCross', 'symbolDiamond', 'symbolSquare', 'symbolStar', 'symbolTriangle', 'symbolWye', 'symbolTriangleDown', 'symbolTriangleLeft', 'symbolTriangleRight', 'symbolDiamondAlt', 'symbolDiamondSquare', 'symbolPentagon', 'symbolHexagon', 'symbolHexagonAlt', 'symbolOctagon', 'symbolOctagonAlt', 'symbolX'],
      widgets: defaultWidgets
    },
    warnings: []
  };
};
