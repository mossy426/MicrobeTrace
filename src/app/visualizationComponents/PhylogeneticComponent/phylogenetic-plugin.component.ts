/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit,
        ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EventManager, DOCUMENT } from '@angular/platform-browser';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import Phylocanvas from 'phylocanvas';
import contextMenu from 'phylocanvas-plugin-context-menu';
import scalebar from 'phylocanvas-plugin-scalebar';
import history from 'phylocanvas-plugin-history';
import * as ClipboardJS from 'clipboard';
import * as saveAs from 'file-saver';
import * as domToImage from 'dom-to-image-more';
import { SelectItem } from 'primeng/api';
import { DialogSettings } from '../../helperClasses/dialogSettings';
import { MicobeTraceNextPluginEvents } from '../../helperClasses/interfaces';
import * as _ from 'lodash';
import { MicrobeTraceNextVisuals } from '../../microbe-trace-next-plugin-visuals';
import { CustomShapes } from '@app/helperClasses/customShapes';


/**
 * @title PhylogeneticComponent
 */
@Component({
    selector: 'PhylogeneticComponent',
    templateUrl: './phylogenetic-plugin.component.html',
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
    clipboard = new ClipboardJS('#copyID, #copySeq');
    zoom: any = null;
    brush: any = null;
    FieldList: SelectItem[] = [];
    ToolTipFieldList: SelectItem[] = [];


    // Tree Tab
    TreeLayouts: any = [
        { label: 'Rectangular', value: 'rectangular' },
        { label: 'Radial', value: 'radial' },
        { label: 'Circular', value: 'circular' },
        { label: 'Diagonal', value: 'diagonal' },
        { label: 'Hierarchical', value: 'hierarchical' },
    ];
    SelectedTreeLayoutVariable: string = 'rectangular';

    // Leaves Tab
    SelectedLeafLabelShowVariable: string = 'Show';
    SelectedLeafLabelVariable: string = 'None';
    // SelectedLeafLabelSizeVariable: number = 20;
    SelectedLeafLabelSizeVariable: number = 8;
    LeafShapes: any = [
      { label: 'Circle', value: 'circle' },
      { label: 'Triangle', value: 'triangle' },
      { label: 'Square', value: 'square' },
      { label: 'Star', value: 'star' },
    ];
    SelectedLeafShapeVariable: string = 'circle';
    // SelectedLeafSizeVariable: number = 15;
    SelectedLeafSizeVariable: number = 5;
    SelectedNodeColorVariable: string = '#1f77b4';

    // Branch Tab
    SelectedBranchLabelShowVariable: string = 'Hide';
    SelectedBranchTooltipShowVariable: string = 'Show';
    SelectedLinkSizeVariable: number = 1;

    private isExportClosed: boolean = false;
    public isExporting: boolean = false;

    hideShowOptions: any = [
        { label: 'Hide', value: 'Hide' },
        { label: 'Show', value: 'Show' }
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

    openTree() {
      Phylocanvas.plugin(contextMenu);
      Phylocanvas.plugin(scalebar);
      Phylocanvas.plugin(history);
      const newickString = this.commonService.computeTree();
      // const treeString = '((((A:0.0431,(((B:0.06836,(C:0.00628,D:0.00069):0.00473):0.00678,E:0.0455):0.002908,
      // F:0.00240):0.01085):0.096,G:0.01784):0.03,(H:0.0480,I:0.0026):0.0336):0.001917,J:0.01917)';
      // const treeString = '(A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;';
      const tree = Phylocanvas.createTree('phylocanvas', {
        fillCanvas: true,
        shape: 'circle',
        showLabels: true,
        hoverLabels: true,
        showInternalNodeLabels: true,
      });
      const phyCanv = document.querySelector('#phylocanvas');
      const canvHeight = phyCanv.clientHeight * 1.5;
      const canvWidth = phyCanv.clientWidth;
      tree.setSize(canvWidth, canvHeight);
      tree.selectedColour = this.visuals.phylogenetic.commonService.GlobalSettingsModel.SelectedColorVariable;
      this.visuals.phylogenetic.commonService.session.style.widgets['link-color'] = '#000000';
      // tree.fillCanvas = true;
      newickString.then((x) => {
        tree.load(x);
        console.log(x);
        tree.branchColour = this.visuals.phylogenetic.commonService.session.style.widgets['link-color'];
        tree.setTreeType('rectangular');
        tree.setNodeSize(this.SelectedLeafSizeVariable);
        tree.leaves.forEach((y) => {
          y.setDisplay({
            labelStyle: {
              textSize: this.SelectedLeafLabelSizeVariable,
            },
            leafStyle: {
              fillStyle: this.SelectedNodeColorVariable,
              lineWidth: 0,
              strokeStyle: this.SelectedNodeColorVariable,
            }
          });
        });
        for (const branch in tree.branches) {
          if (branch in tree.branches) {
            tree.branches[branch].interactive = true;
            tree.branches[branch].internalLabelStyle = {
                textSize: this.SelectedLeafLabelSizeVariable,
            };
          }
        }
        tree.saveOriginalTree();
        this.commonService.visuals.phylogenetic.tree = tree;
        tree.draw();
        console.log(tree);
      });



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

            this.visuals.phylogenetic.FieldList = [];

            this.visuals.phylogenetic.FieldList.push({ label: 'None', value: 'None' });
            this.visuals.phylogenetic.commonService.session.data['nodeFields'].map((d, i) => {

                this.visuals.phylogenetic.FieldList.push(
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
      thisTree.fitInPanel(thisTree.leaves);
      thisTree.draw();
    }

    openPinAllNodes() {


    }

    openRefreshScreen() {

    }

    openSelectDataSetScreen() {

    }

    onTreeLayoutChange(event) {
      this.commonService.visuals.phylogenetic.tree.setTreeType(event);
    }

    onLeafLabelShowChange(event) {
      this.SelectedLeafLabelShowVariable = event;
      if (event === 'Hide') {
        this.commonService.visuals.phylogenetic.tree.showLabels = false;
      } else if (event === 'Show') {
        this.commonService.visuals.phylogenetic.tree.showLabels = true;
      }
      this.commonService.visuals.phylogenetic.tree.draw();
    }

    onLeafShapeVariableChange(event) {
      const shapeConfig = { shape: event };
      this.updateLeaves(shapeConfig);
    }

    onBranchLabelShowChange(event) {
      this.SelectedBranchLabelShowVariable = event;
      if (event === 'Hide') {
        this.commonService.visuals.phylogenetic.tree.showBranchLengthLabels = false;
      } else if (event === 'Show') {
        this.commonService.visuals.phylogenetic.tree.showBranchLengthLabels = true;
      }
      this.commonService.visuals.phylogenetic.tree.draw();
    }

    onBranchTooltipShowChange(event) {
      this.SelectedBranchTooltipShowVariable = event;
      if (event === 'Hide') {
        this.commonService.visuals.phylogenetic.tree.showInternalNodeLabels = false;
      } else if (event === 'Show') {
        this.commonService.visuals.phylogenetic.tree.showInternalNodeLabels = true;
      }
      this.commonService.visuals.phylogenetic.tree.draw();
    }

    showGlobalSettings() {
      this.DisplayGlobalSettingsDialogEvent.emit('Styling');
    }

    onLeafSizeChange(event) {
      this.SelectedLeafSizeVariable = event;
      const thisTree = this.commonService.visuals.phylogenetic.tree;
      thisTree.setNodeSize(event);
      thisTree.draw();
    }

    onLeafLabelSizeChange(event) {
      this.SelectedLeafLabelSizeVariable = event;
      const labelConfig = { labelStyle: { textSize: event } };
      this.updateLeaves(labelConfig);
    }

    onLinkSizeChange(event) {
      const thisTree = this.commonService.visuals.phylogenetic.tree;
      this.SelectedLinkSizeVariable = event;
      thisTree.lineWidth = event;
      thisTree.draw();
    }


    updateNodeColors() {
      const nodeColor = this.visuals.phylogenetic.commonService.session.style.widgets['node-color'];
      this.SelectedNodeColorVariable = nodeColor;
      const colorConfig = { leafStyle: { fillStyle: this.SelectedNodeColorVariable } };
      this.updateLeaves(colorConfig);
      const selectedColor = this.visuals.phylogenetic.commonService.GlobalSettingsModel.SelectedColorVariable;
      this.commonService.visuals.phylogenetic.tree.selectedColour = selectedColor;
      this.commonService.visuals.phylogenetic.tree.draw();
    }

    updateLinkColor() {
      const linkColor = this.visuals.phylogenetic.commonService.session.style.widgets['link-color'];
      this.commonService.visuals.phylogenetic.tree.branchColour = linkColor;
      this.commonService.visuals.phylogenetic.tree.draw();
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
}
