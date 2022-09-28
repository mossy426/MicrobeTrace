/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit,
  ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EventManager, DOCUMENT } from '@angular/platform-browser';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import * as ClipboardJS from 'clipboard';
import * as saveAs from 'file-saver';
import * as domToImage from 'dom-to-image-more';
import { SelectItem } from 'primeng/api';
import { DialogSettings } from '../../helperClasses/dialogSettings';
import { MicobeTraceNextPluginEvents } from '../../helperClasses/interfaces';
import * as _ from 'lodash';
import { MicrobeTraceNextVisuals } from '../../microbe-trace-next-plugin-visuals';
import { CustomShapes } from '@app/helperClasses/customShapes';
import TidyTree from './tidytree';
import * as d3 from 'd3';


/**
 * @title PhylogeneticComponent
 */
@Component({
  selector: 'PhylogeneticComponent',
  templateUrl: './phylogenetic-plugin.component.html',
  styleUrls: ['./phylogenetic-plugin.component.css']
})
export class PhylogeneticComponent extends AppComponentBase implements OnInit {

  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();
  svgStyle: {} = {
    height: '0px',
    width: '1000px'
  };

  private customShapes: CustomShapes = new CustomShapes();

  ShowNetworkAttributes: boolean = false;
  ShowStatistics: boolean = false;
  ShowPhylogeneticExportPane: boolean = false;
  ShowPhylogeneticSettingsPane: boolean = false;
  IsDataAvailable: boolean = false;
  svg: any = null;
  settings: any = this.commonService.session.style.widgets;
  halfWidth: any = null;
  halfHeight: any = null;
  transform: any = null;
  force: any = null;
  radToDeg: any = (180 / Math.PI);
  selected: any = null;
  multidrag: boolean = false;
  // clipboard = new ClipboardJS('#copyID, #copySeq');
  zoom: any = null;
  brush: any = null;
  FieldList: SelectItem[] = [];
  ToolTipFieldList: SelectItem[] = [];


  // Tree Tab
  TreeLayouts: any = [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' },
    { label: 'Circular', value: 'circular' },
  ];
  SelectedTreeLayoutVariable: string = 'horizontal';
  TreeModes: any = [
    { label: 'Smooth', value: 'smooth' },
    { label: 'Square', value: 'square' },
    { label: 'Straight', value: 'straight' },
  ];
  SelectedTreeModeVariable: string = 'square';
  TreeTypes: any = [
    { label: 'Weighted', value: 'weighted' },
    { label: 'Unweighted', value: 'unweighted' },
    { label: 'Dendrogram', value: 'dendrogram' },
  ];
  SelectedTreeTypeVariable: string = 'weighted';


  // Leaves Tab
  SelectedLeafLabelShowVariable = true;
  SelectedLeafLabelVariable: string = 'None';
  LeafLabelFieldList: object[] = [];
  SelectedLeafLabelSizeVariable: number = 12;
  SelectedLeafNodeShowVariable = true;
  SelectedLeafNodeSizeVariable: number = 5;
  SelectedLeafNodeColorVariable: string = '#1f77b4';

  // Branch Tab
  SelectedBranchNodeShowVariable = true;
  SelectedBranchNodeSizeVariable: number = 5;
  SelectedBranchNodeColorVariable: string = '#1f77b4';
  SelectedBranchSizeVariable: number = 3;
  SelectedBranchLabelSizeVariable: number = 12;
  SelectedLinkColorVariable = this.settings['link-color'];
  SelectedBranchLabelShowVariable = false;
  SelectedBranchDistanceShowVariable = false;
  SelectedBranchDistanceSizeVariable = 12;
  SelectedBranchTooltipShowVariable = false;

  private isExportClosed: boolean = false;
  public isExporting: boolean = false;

  hideShowOptions: any = [
    { label: 'Hide', value: false },
    { label: 'Show', value: true }
  ];

  // Export Settings
  SelectedTreeImageFilenameVariable: string = 'default_tree';
  SelectedNewickStringFilenameVariable: string = 'default_tree.nwk';

  NetworkExportFileTypeList: any = [
    { label: 'png', value: 'png' },
    { label: 'jpeg', value: 'jpeg' },
    { label: 'svg', value: 'svg' }
  ];

  SelectedNetworkExportFileTypeListVariable: string = 'png';
  SelectedNetworkExportScaleVariable: any = 1;
  SelectedNetworkExportQualityVariable: any = 0.92;
  CalculatedResolutionWidth: any = 1918;
  CalculatedResolutionHeight: any = 909;
  CalculatedResolution: any = ((this.CalculatedResolutionWidth * this.SelectedNetworkExportScaleVariable) + ' x ' + (
    this.CalculatedResolutionHeight * this.SelectedNetworkExportScaleVariable) + 'px');


  ShowAdvancedExport: boolean = true;

  PhylogeneticTreeExportDialogSettings: DialogSettings = new DialogSettings('#phylotree-settings-pane', false);

  ContextSelectedNodeAttributes: {attribute: string, value: string}[] = [];
  tree: any = null;

  private visuals: MicrobeTraceNextVisuals;


  constructor(injector: Injector,
    private eventManager: EventManager,
    public commonService: CommonService,
    private cdref: ChangeDetectorRef) {

    super(injector);

    this.visuals = commonService.visuals;
    this.commonService.visuals.phylogenetic = this;
  }

  openTree = () => {
    const newickString = this.commonService.computeTree();
    this.visuals.phylogenetic.commonService.session.style.widgets['link-color'] = '#000000';
    newickString.then((x) => {
      const tree = this.buildTree(x);
      this.tree = tree;
      this.commonService.visuals.phylogenetic.tree = tree;
      this.styleTree();
    });

  }

  styleTree = () => {
    this.tree.setBranchLabels(this.SelectedBranchLabelShowVariable);
    this.tree.eachBranchLabel(this.styleBranchLabel);
    this.tree.setBranchNodes(this.SelectedBranchNodeShowVariable);
    this.tree.eachBranchNode(this.styleBranchNode);
    this.tree.setBranchDistances(this.SelectedBranchDistanceShowVariable);
    this.tree.eachBranchDistance(this.styleBranchDistance);
    this.tree.setLeafNodes(this.SelectedLeafNodeSizeVariable);
    this.tree.eachLeafNode(this.styleLeafNode);
    this.tree.setLeafLabels(this.SelectedLeafLabelShowVariable);
    this.tree.eachLeafLabel(this.styleLeafLabel);
    const treeEl = document.querySelector('#tidytree');
    const branchEls = document.querySelectorAll('g.tidytree-link > path');
    d3.select(treeEl).style('background-color', 'rgba(255, 255, 255);');
    d3.select(treeEl).style('height', '88vh;');
    branchEls.forEach(this.styleBranch);
  }

  styleBranch = (el) => {
    d3.select(el).style('stroke', this.SelectedLinkColorVariable);
    d3.select(el).style('stroke-width', `${this.SelectedBranchSizeVariable}px`);
  }

  styleBranchLabel = (label, data) => {
    d3.select(label).style('font-size', `${this.SelectedBranchLabelSizeVariable}px`);
  }

  styleBranchNode = (node, data) => {
    d3.select(node).attr('r', this.SelectedLeafNodeSizeVariable);
    d3.select(node).style('fill', this.SelectedLeafNodeColorVariable);
  }

  styleBranchDistance = (label, data) => {
    d3.select(label).style('font-size', `${this.SelectedBranchDistanceSizeVariable}px`);
  }


  styleLeafLabel = (label, data) => {
    d3.select(label).style('font-size', `${this.SelectedLeafLabelSizeVariable}px`);
  }

  styleLeafNode = (node, data) => {
    d3.select(node).attr('r', this.SelectedLeafNodeSizeVariable);
    d3.select(node).style('fill', this.SelectedLeafNodeColorVariable);
  }

  buildTree = (newick) => {
    const tree = new TidyTree(
      newick ? newick : this.tree.data.clone(),
      {
        parent: '#phylocanvas',
        layout: 'horizontal',  // d3.select('#layout').node().value,
        mode: 'square',  // d3.select('#mode').node().value,
        type: 'weighted', // d3.select('#type').node().value,
        leafNodes: this.SelectedLeafNodeShowVariable ? this.SelectedLeafNodeSizeVariable : this.SelectedLeafNodeShowVariable,
        branchNodes:  '2.5',  // range 0.5-10 in 0.5 steps
        leafLabels: '12',  // range 1-32
        branchLabels: '6', // range 1-32
        branchDistances: '12', // range 1-32
        ruler: true,
        animation: parseFloat('0'),  // range 0-2000 in steps of 10
        margin: [10, 10, 70, 30]
      },
      {
        contextmenu: this.contextMenu,
        showtooltip: this.showTooltip,
        hidetooltip: this.hideTooltip
      }
    );
    return tree;
  }


  ngOnInit() {
    this.openTree();

  }

  InitView() {
    this.visuals.phylogenetic.IsDataAvailable = (
      this.visuals.phylogenetic.commonService.session.data.nodes.length === 0 ? false : true
    );

    if (this.visuals.phylogenetic.IsDataAvailable === true && this.visuals.phylogenetic.zoom == null) {

      // d3.select('svg#network').exit().remove();
      // this.visuals.phylogenetic.svg = d3.select('svg#network').append('g');


      this.LeafLabelFieldList.push({ label: 'None', value: 'None' });
      this.commonService.session.data['nodeFields'].map((d, i) => {

        this.visuals.phylogenetic.LeafLabelFieldList.push(
          {
            label: this.visuals.phylogenetic.commonService.capitalize(d.replace('_', '')),
            value: d
          });
      });
    }
  }

  openSettings() {
    this.visuals.phylogenetic.PhylogeneticTreeExportDialogSettings.setVisibility(true);
    // this.context.twoD.ShowStatistics = !this.context.twoD.Show2DSettingsPane;
  }


  openExport() {
    this.ShowPhylogeneticExportPane = true;

    this.visuals.microbeTrace.GlobalSettingsDialogSettings.setStateBeforeExport();
    this.visuals.microbeTrace.GlobalSettingsLinkColorDialogSettings.setStateBeforeExport();
    this.visuals.microbeTrace.GlobalSettingsNodeColorDialogSettings.setStateBeforeExport();
    this.isExportClosed = false;

  }

  openCenter() {
    const thisTree = this.commonService.visuals.phylogenetic.tree;
    thisTree.recenter()
    .redraw();
  }

  openPinAllNodes() {


  }

  openRefreshScreen() {

  }

  openSelectDataSetScreen() {

  }

  onTreeLayoutChange(event) {
    this.SelectedTreeLayoutVariable = event;
    this.tree.setLayout(event);
  }

  onTreeModeChange(event) {
    this.SelectedTreeModeVariable = event;
    this.tree.setMode(event);
  }

  onTreeTypeChange(event) {
    this.SelectedTreeTypeVariable = event;
    this.tree.setType(event);
  }

  onLeafShapeVariableChange(event) {
    const shapeConfig = { shape: event };
    this.updateLeaves(shapeConfig);
  }

  onBranchLabelShowChange(event) {
    this.SelectedBranchLabelShowVariable = event;
    this.tree.setBranchLabels(event);
  }

  onBranchLabelSizeChange(event) {
    this.SelectedBranchLabelSizeVariable = event;
    this.styleTree();
  }

  onBranchDistanceShowChange(event) {
    this.SelectedBranchDistanceShowVariable = event;
    this.tree.setBranchDistances(event);
  }

  onBranchDistanceSizeChange(event) {
    this.SelectedBranchDistanceSizeVariable = event;
    this.styleTree();
  }

  onBranchNodeShowChange(event) {
    this.SelectedBranchNodeShowVariable = event;
    this.tree.setBranchNodes(event);
  }

  onBranchNodeSizeChange(event) {
    this.SelectedBranchNodeSizeVariable = event;
    this.styleTree();
  }

  onBranchTooltipShowChange(event) {
    this.SelectedBranchTooltipShowVariable = event;
  }

  onLeafLabelShowChange(event) {
    this.SelectedLeafLabelShowVariable = event;
    this.tree.setLeafLabels(event);
  }

  showGlobalSettings() {
    this.DisplayGlobalSettingsDialogEvent.emit('Styling');
  }

  onLeafSizeChange(event) {
    this.SelectedLeafNodeSizeVariable = event;
    this.styleTree();
  }

  onLeafLabelSizeChange(event) {
    this.SelectedLeafLabelSizeVariable = event;
    this.styleTree();
  }

  onBranchSizeChange(event) {
    const thisTree = this.commonService.visuals.phylogenetic.tree;
    this.SelectedBranchSizeVariable = event;
    this.styleTree();
  }

  onCloseExport() {
    this.isExportClosed = true;
  }

  updateNodeColors() {
    const nodeColor = this.visuals.phylogenetic.commonService.session.style.widgets['node-color'];
    this.SelectedLeafNodeColorVariable = nodeColor;
    this.styleTree();
    const selectedColor = this.visuals.phylogenetic.commonService.GlobalSettingsModel.SelectedColorVariable;
  }

  updateLinkColor() {
    const linkColor = this.visuals.phylogenetic.commonService.session.style.widgets['link-color'];
    this.SelectedLinkColorVariable = linkColor;
    this.styleTree();
  }

  updateLeaves(config) {
    const thisTree = this.commonService.visuals.phylogenetic.tree;
    thisTree.leaves.forEach((x) => {
      x.setDisplay(config);
    });
    thisTree.draw();
  }

  saveImage(event) {
    const thisTree = this.commonService.visuals.phylogenetic.tree;
    const fileName = this.SelectedTreeImageFilenameVariable;
    const canvasId = 'phylocanvas__canvas';
    const exportImageType = this.SelectedNetworkExportFileTypeListVariable ;
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (exportImageType === 'png') {
      domToImage.toPng(document.getElementById(canvasId)).then(
        dataUrl => {
          saveAs(dataUrl, fileName);
        });
    } else if (exportImageType === 'jpeg') {
      domToImage.toJpeg(document.getElementById(canvasId), { quality: 0.95}).then(
        dataUrl => {
          saveAs(dataUrl, fileName);
        });
    } else if (exportImageType === 'svg') {
      domToImage.toSvg(document.getElementById(canvasId)).then(
        dataUrl => {
          saveAs(dataUrl, fileName);
        });

    }

  }

  saveNewickString(event) {
    const thisTree = this.commonService.visuals.phylogenetic.tree;
    const newickBlob = new Blob([thisTree.stringRepresentation], {type: 'text/plain;charset=utf-8'});
    saveAs(newickBlob, this.SelectedNewickStringFilenameVariable);

  }
  contextMenu = (d) => {
    let e = d3.event;
    const tree = this.tree;
    if (!e) return;
    e.preventDefault();
    this.hideTooltip();
    d3.select('#context-menu')
      .style('top', e.pageY + 'px')
      .style('left', e.pageX + 'px')
      .style('z-index', 1000)
      .style('display', 'block');
    d3.select('#reroot').on('click', c =>
      tree.setData(d[0].data.reroot())
    );
    d3.select('#rotate').on('click', c =>
      tree.setData(d[0].data.rotate().getRoot())
    );
    d3.select('#flip').on('click', c =>
      tree.setData(d[0].data.flip().getRoot())
    );
    d3.select('#sort').on('click', c =>
      tree.setData(d[0].data.sort().getRoot())
    );
    d3.select('#remove').on('click', c =>
      tree.setData(d[0].data.remove())
    );
    d3.select('#isolate').on('click', c =>
      tree.setData(d[0].data.isolate())
    );
    d3.select('#excise').on('click', c =>
      tree.setData(d[0].data.excise().getRoot())
    );
    d3.select('#simplify').on('click', c =>
      tree.setData(d[0].data.simplify().getRoot())
    );
    d3.select('#consolidate').on('click', c =>
      tree.setData(d[0].data.consolidate().getRoot())
    );
  }

  showTooltip = (d) => {
    /**if (!this.SelectedBranchTooltipShowVariable) {
      return;
    }
    */
    let e = d3.event;
    e.preventDefault();
    d3.select('#tooltip')
      .text(d[0].data.id)
      .style('top', e.pageY + 'px')
      .style('left', e.pageX + 5 + 'px')
      .style('z-index', 1000)
      .style('display', 'block');
  }

  hideTooltip = () => {
    d3.selectAll('#tooltip')
      .style('z-index', -1)
      .style('display', 'none');
  }

}
