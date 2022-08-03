import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit,
        ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EventManager, DOCUMENT } from '@angular/platform-browser';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import Phylocanvas from 'phylocanvas';
import contextMenu from 'phylocanvas-plugin-context-menu';
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
        'height': '0px',
        'width': '1000px'
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
    TreeTypes: any = [
        { label: 'Weighted Dendrogram', value: 'weighted_dendrogram' },
        { label: 'Unweighted Dendrogram', value: 'weighted_dendrogram' },
        { label: 'Tree', value: 'Tree' },
    ];
    SelectedTreeTypeVariable: string = 'weighted_dendrogram';
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
    SelectedLeafLabelSizeVariable: number = 30;
    LeafShapes: any = [
      { label: 'Circle', value: 'circle' },
      { label: 'Triangle', value: 'triangle' },
      { label: 'Square', value: 'square' },
      { label: 'Star', value: 'star' },
    ];
    SelectedLeafShapeVariable: string = 'circle';
    SelectedLeafSizeVariable: number = 15;
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

    // Network 
    SelectedNetworkExportFilenameVariable: string = "";

    NetworkExportFileTypeList: any = [
        { label: 'png', value: 'png' },
        { label: 'jpeg', value: 'jpeg' },
        { label: 'webp', value: 'webp' },
        { label: 'svg', value: 'svg' }
    ];

    SelectedNetworkExportFileTypeListVariable: string = "png";
    SelectedNetworkExportScaleVariable: any = 1;
    SelectedNetworkExportQualityVariable: any = 0.92;
    CalculatedResolutionWidth: any = 1918;
    CalculatedResolutionHeight: any = 909;
    CalculatedResolution: any = ((this.CalculatedResolutionWidth * this.SelectedNetworkExportScaleVariable) + " x " + (this.CalculatedResolutionHeight * this.SelectedNetworkExportScaleVariable) + "px");


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
      console.log('Called the tree opening function');
      Phylocanvas.plugin(contextMenu);
      const newickString = this.commonService.computeTree().then()
      console.log(this.commonService.visuals.phylogenetic.tree);
      const treeString = '((((A:0.0431,(((B:0.06836,(C:0.00628,D:0.00069):0.00473):0.00678,E:0.0455):0.002908,F:0.00240):0.01085):0.096,G:0.01784):0.03,(H:0.0480,I:0.0026):0.0336):0.001917,J:0.01917)';
      // const treeString = '(A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;';
      const tree = Phylocanvas.createTree('phylocanvas', {
        fillCanvas: true,
        shape: 'circle',
        showLabels: true,
        hoverLabels: true,
        selectedColour: '#FF8300',
        showInternalNodeLabels: true,
      });
      tree.load(this.commonService.temp.tree);
      tree.setTreeType('rectangular');
      tree.setNodeSize(this.SelectedLeafSizeVariable);
      tree.leaves.forEach((x) => {
        x.setDisplay({
          labelStyle: {
            textSize: this.SelectedLeafLabelSizeVariable,
          },
          leafStyle: {
            fillStyle: this.SelectedNodeColorVariable,
          }
        });
      });
      for (const branch in tree.branches) {
        if (branch in tree.branches) {
          tree.branches[branch].internalLabelStyle = {
              textSize: this.SelectedLeafLabelSizeVariable,
          };
        }
      }
      tree.saveOriginalTree();
      this.commonService.visuals.phylogenetic.tree = tree;
      const phyCanv = document.querySelector('#phylocanvas');
      const canvHeight = phyCanv.clientHeight;
      const canvWidth = phyCanv.clientWidth;
      tree.setSize(canvWidth, canvHeight);

      tree.draw();


    }


    ngOnInit() {
      this.openTree();

    }

    InitView() {
        this.visuals.phylogenetic.IsDataAvailable = (this.visuals.phylogenetic.commonService.session.data.nodes.length === 0 ? false : true);

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

    }

    openCenter() {

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
      console.log(this.SelectedNodeColorVariable);
      const colorConfig = { leafStyle: { fillStyle: this.SelectedNodeColorVariable } };
      this.updateLeaves(colorConfig);
      const selectedColor = this.visuals.phylogenetic.commonService.GlobalSettingsModel.SelectedColorVariable;
      console.log(`Changing selected color to ${selectedColor}`);
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
}
