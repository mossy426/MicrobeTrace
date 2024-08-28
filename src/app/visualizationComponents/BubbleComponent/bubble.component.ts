import { ChangeDetectorRef, Component, ElementRef, Inject, Injector, OnInit, Output, Renderer2, EventEmitter, ViewChild } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { SelectItem } from 'primeng/api';

import { BaseComponentDirective } from '@app/base-component.directive';
import { CommonService } from '@app/contactTraceCommonServices/common.service';
import { MicobeTraceNextPluginEvents } from '@app/helperClasses/interfaces';
import { MicrobeTraceNextVisuals } from '@app/microbe-trace-next-plugin-visuals';
import { ComponentContainer } from 'golden-layout';
 
import { XYContainer, Scatter } from '@unovis/ts'

type DataRecord = { index: number, id: string, x: number; y: number, color: string, Xgroup: number, Ygroup: number, strokeColor: string }//selected: boolean }



@Component({
  selector: 'bubble-component',
  templateUrl: './bubble.component.html',
  styleUrls: ['./bubble.component.scss']
})
export class BubbleComponent extends BaseComponentDirective implements OnInit, MicobeTraceNextPluginEvents {

  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();
  @ViewChild('scatter') scatterPlot: Scatter<Object>;
  
  visuals: MicrobeTraceNextVisuals;
  widgets: any;

  viewActive: boolean = true;
  settingsOpen: boolean = false;
  exportOpen: boolean = false;

  viewHeight: number
  viewWidth: number

  selectedFieldList: SelectItem[] = [];
  xVariable;
  yVariable;
  nodeSize = 16;
  nodeSpacing = 0.05;

  data: DataRecord[] = [];
  X_categories = []
  X_axisFormat = (tick: number) => this.X_categories[tick]
  X_tickValues = []

  Y_categories = []
  Y_axisFormat = (tick: number) => this.Y_categories[tick]
  Y_tickValues = []
  
  events = {
    [Scatter.selectors.point]: {
      click: (d: DataRecord) => { 
        //d.selected = true;
        console.log(d);
      }
    }
  }
  tooltipTriggers = {
    [Scatter.selectors.point]: (d: DataRecord): string => {
      return `node #${d.index}: ${d.id}`
    }
  }

  x = (d: DataRecord) => d.x
  y = (d: DataRecord) => d.y
  color = (d: DataRecord) => d.color
  strokeColor = (d: DataRecord) => {
    return d.strokeColor;

  }

  constructor(injector: Injector,
    private renderer: Renderer2,
    private elem: ElementRef,
    private eventManager: EventManager,
    public commonService: CommonService,
    @Inject(BaseComponentDirective.GoldenLayoutContainerInjectionToken) private container: ComponentContainer,
    elRef: ElementRef,
    private cdref: ChangeDetectorRef
  ) {
    super(elRef.nativeElement);

    this.visuals = commonService.visuals;
    this.visuals.bubble = this;
    this.widgets = this.commonService.session.style.widgets;
  }

  ngOnInit(): void {
    
    this.selectedFieldList.push({ label: "None", value: "None"})
    this.commonService.session.data['nodeFields'].map((d) => {
      if (['seq', 'origin', '_diff', '_ambiguity', 'index', '_id'].includes(d)) return;
      this.selectedFieldList.push({
        label: this.commonService.capitalize(d.replace("_", "")),
        value: d
      });
    })

    // need to change these later
    this.xVariable = 'transmission risk';
    this.yVariable = 'gender';

    this.getData();
    this.goldenLayoutComponentResize();

    this.container.on('resize', () => { this.goldenLayoutComponentResize()})
    this.container.on('hide', () => { 
      this.viewActive = false; 
      this.cdref.detectChanges();
    })
    this.container.on('show', () => { 
        this.viewActive = true; 
        this.setSelectedNodes(this);
        this.goldenLayoutComponentResize();
        this.cdref.detectChanges();
    })
    
    let that = this;
    $( document ).on("node-selected", function( ) {
      if (that.viewActive) {
          that.visuals.bubble.setSelectedNodes(that);
      }
    });
  }

  getData() {
    this.data = [];
    this.X_categories = [];
    this.Y_categories = [];
  
    let nodes = this.commonService.getVisibleNodes()
    nodes.forEach(node => {
      let nodeDR: DataRecord = {
        index: node.index,
        id: node._id,
        x: 0,
        y: 0,
        color: '#ff00ff',
        Xgroup: 0,
        Ygroup: 0,
        strokeColor: node.selected ? '#ff8300': '#000000'
      }
      if (this.xVariable != undefined || this.xVariable != 'None') {
        let nodeX = node[this.xVariable];
        let locX = this.X_categories.indexOf(nodeX);
        if (locX == -1) {
          this.X_categories.push(nodeX);
          locX = this.X_categories.length - 1;
        }
        nodeDR.Xgroup = locX;
      }
      if (this.yVariable != undefined || this.yVariable != 'None') {
        let nodeY = node[this.yVariable];
        let locY = this.Y_categories.indexOf(nodeY);
        if (locY == -1) {
          this.Y_categories.push(nodeY);
          locY = this.Y_categories.length - 1;
        }
        nodeDR.Ygroup = locY;
      }

      this.data.push(nodeDR)
    })
    
    this.X_tickValues = [];
    this.Y_tickValues = []
    if (this.xVariable == undefined || this.xVariable == 'None' || this.X_categories.length == 1) {
      this.X_tickValues.push(0);
    } else {
      for (let i=0; i< this.X_categories.length; i++) {
        this.X_tickValues.push(i)
      }
    }
    if (this.yVariable == undefined || this.yVariable == 'None' || this.Y_categories.length == 1) {
      this.Y_tickValues.push(0);
    } else {
      for (let i=0; i< this.Y_categories.length; i++) {
        this.Y_tickValues.push(i)
      }
    }

    this.X_tickValues.forEach(xLoc => {
      this.Y_tickValues.forEach(yLoc => {
        let filteredNodes = this.data.filter(node => node.Xgroup == xLoc && node.Ygroup == yLoc)
        if (filteredNodes.length == 0) {
          return;
        } else if (filteredNodes.length == 1) {
          filteredNodes[0].x = xLoc;
          filteredNodes[0].y = yLoc;
        } else {
          this.calculateHexagonalGridPositions(filteredNodes)
        }
      })
    })
    this.updateColors();

    this.X_axisFormat = (tick: number) => {
      if (this.X_categories[tick] == null || this.X_categories[tick] == undefined) {
        return 'Unknown'
      } else {
        return this.X_categories[tick]
      }
    }
    this.Y_axisFormat = (tick: number) => {
      if (this.Y_categories[tick] == null || this.Y_categories[tick] == undefined) {
        return 'Unknown'
      } else {
        return this.Y_categories[tick]
      }
    }
  }

  updateColors() {
    //colorVariable == 'None' ? fillcolor : this.commonService.temp.style.nodeColorMap(d[colorVariable]),
    let fillcolor = this.commonService.session.style.widgets['node-color']
    let colorVariable = this.commonService.session.style.widgets['node-color-variable']

    let fullNodes = this.commonService.getVisibleNodes();

    this.data.forEach(node => {
      let currentFullNode = fullNodes[node.index];
      node.color = colorVariable == 'None'? fillcolor : this.commonService.temp.style.nodeColorMap(currentFullNode[colorVariable]);
    })

    this.color = (d: DataRecord) => d.color
  }

  calculateHexagonalGridPositions(nodes: DataRecord[]) {
    const layerDistance = this.nodeSpacing * Math.sqrt(3); // Distance between layers
    let layer = 0;
    let nodesInLayer = 1;

    let count = 0;
    nodes.forEach(node => {
      const angle = (2 * Math.PI / nodesInLayer) * count;
      node.x = node.Xgroup + layer * layerDistance * Math.cos(angle);
      node.y = node.Ygroup + layer * layerDistance * Math.sin(angle);

      count++;
      if (count >= nodesInLayer) {
        count = 0;
        layer++;
        nodesInLayer = 6*layer;
      }
    })
  }

  /* used as reference, remove before pushing
  generateHexagonalGridPositions(n: number, nodeSize: number, Xgroup:number, Ygroup:number): DataRecord[] {
    let color;
    if (Xgroup == 1) color = '#ff0000'
    else color = '#5000ff'
    const positions = [];
    const layerDistance = nodeSize * Math.sqrt(3); // Distance between layers
    let layer = 0;
    let nodesInLayer = 1;
  
    while (positions.length < n) {
      for (let i = 0; i < nodesInLayer && positions.length < n; i++) {
        const angle = (2 * Math.PI / nodesInLayer) * i;
        const x = Xgroup + layer * layerDistance * Math.cos(angle);
        const y = Ygroup + layer * layerDistance * Math.sin(angle);
        positions.push({ x, y, color, Xgroup, Ygroup, selected: false, index: positions.length });
      }
      layer++;
      nodesInLayer = 6 * layer; // Number of nodes in the next layer
    }
    return positions;
  } */

  /*use as reference, remove before pushing
  generateCircularPositions(n: number, nodeSize: number): DataRecord[] {
    const positions = [];
    const angleIncrement = (2 * Math.PI) / n;
  
    for (let i = 0; i < n; i++) {
      const angle = i * angleIncrement;
      const x = Math.cos(angle) * nodeSize;
      const y = Math.sin(angle) * nodeSize;
      positions.push({ x, y });
    }
  
    // Normalize positions to fit within the range [0.5, 1.5]
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
  
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
  
    return positions.map(p => ({
      x: -0.5 + (p.x - minX) / rangeX,
      y: 1.5 + (p.y - minY) / rangeY,
      color: '#00ffff',
      Xgroup: 2, Ygroup: 0, selected: false
    }));
  }

  generateFibonacciSpiralPositions(n: number): DataRecord[] {
    let nodes = [];
    let goldenAngle = Math.PI * (3 - Math.sqrt(5))/2; // Approx. 137.5 degrees

    let colors = ['#ff0000', '#ff0000', '#ff0000', '#ff0000'];
  
  
    for (let i = 0; i < n; i++) {
      const radius = Math.sqrt(i)/3;
      const angle = i * goldenAngle;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      let color = colors[i%4];
      nodes.push({ x, y, color});
    }

    const minX = Math.min(...nodes.map(p => p.x));
    const maxX = Math.max(...nodes.map(p => p.x));
    const minY = Math.min(...nodes.map(p => p.y));
    const maxY = Math.max(...nodes.map(p => p.y));
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

  
    return nodes.map(p => ({
      x: 0.5 + (p.x - minX) / rangeX,
      y: 0.5 + (p.y - minY) / rangeY,
      color: p.color,
      Xgroup: 1, Ygroup: 1, selected: false
    }));
  } */

  updateGraph() {
    this.data = []
    this.X_categories = []
    this.Y_categories = []
  }

  goldenLayoutComponentResize() {
    
    let height = $('bubble-component').height() - 55 - 10
    let width = $('bubble-component').width() - 40

    
    this.viewHeight = height;
    this.viewWidth = width;
    console.log('size changed: ', width, this.viewWidth, height, this.viewHeight);
    // @ts-ignore
    //this.scatterPlot.ngOnChanges(this.data)
  }

  setSelectedNodes(that) {
    let nodes = that.commonService.getVisibleNodes()
    nodes.forEach(node => {
      let datum = that.data.find(datum => datum.index == node.index)
      if (node.selected) console.log('found: ', datum)

      datum.strokeColor = node.selected ? '#ff8300': '#000000';
    })
    that.strokeColor = (d: DataRecord) => d.strokeColor;
  }

  onDataChange() {
    console.log(this.xVariable, this.yVariable)
    this.getData();
  }

  recalculatePositions() {
    this.X_tickValues.forEach(xLoc => {
      this.Y_tickValues.forEach(yLoc => {
        let filteredNodes = this.data.filter(node => node.Xgroup == xLoc && node.Ygroup == yLoc)
        if (filteredNodes.length == 0) {
          return;
        } else if (filteredNodes.length == 1) {
          filteredNodes[0].x = xLoc;
          filteredNodes[0].y = yLoc;
        } else {
          this.calculateHexagonalGridPositions(filteredNodes)
        }
      })
    })
  }

  onNodeSpacingChange() {
    this.recalculatePositions();
    // @ts-ignore
    this.scatterPlot.ngOnChanges(this.data);
  }

  onNodeSizeChange() {
    this.recalculatePositions();
    //console.log(this.nodeSize);
    //this.defaultGraph();
  }

  /**
  * Opens Global Setting Dialog
  */
  showGlobalSettings() {
    //console.log("threshold: ",  this.commonService.GlobalSettingsModel.SelectedLinkThresholdVariable);
    this.DisplayGlobalSettingsDialogEvent.emit("Styling");
  }

  updateNodeColors() {
    this.updateColors();
  }
  updateLinkColor() {}
  updateVisualization() {}
  applyStyleFileSettings() {}
  openRefreshScreen() {}
  onRecallSession() {}
  onLoadNewData() {}
  onFilterDataChange() {}
  
  
  openExport() { 
    console.log('open export');
    this.exportOpen = true;
   }

   openSettings() {
    console.log('open settings');
    this.settingsOpen = true;
   }
}

export namespace BubbleComponent {
  export const componentTypeName = 'Bubble';
}
