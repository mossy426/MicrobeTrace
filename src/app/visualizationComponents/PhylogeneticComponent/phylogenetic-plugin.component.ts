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


    // Node Tab
    SelectedNodeLabelVariable: string = "None";
    SelectedNodeLabelOrientationVariable: string = "Right";
    SelectedNodeTooltipVariable: string = "None";
    SelectedNodeSymbolVariable: string = "None";
    SelectedNodeShapeVariable: string = "symbolCircle";
    SelectedNodeRadiusVariable: string = "None";
    SelectedNodeRadiusSizeVariable: string = "None";
    TableTypes: any = [
        { label: 'Show', value: 'Show' },
        { label: 'Hide', value: 'Hide' }
    ];
    SelectedNetworkTableTypeVariable: string = "Hide";

    private isExportClosed: boolean = false;
    public isExporting: boolean = false;

    // Link Tab
    SelectedLinkTooltipVariable: string = "None";
    SelectedLinkLabelVariable: string = "None";
    SelectedLinkTransparencyVariable: any = 0;
    SelectedLinkWidthByVariable: string = "None";

    ReciprocalTypes: any = [
        { label: 'Reciprocal', value: 'Reciprocal' },
        { label: 'Non-Reciprocal', value: 'Non-Reciprocal' }
    ];
    SelectedLinkReciprocalTypeVariable: string = "Reciprocal";

    SelectedLinkWidthVariable: any = 0;
    SelectedLinkLengthVariable: any = 0;
    ArrowTypes: any = [
        { label: 'Hide', value: 'Hide' },
        { label: 'Show', value: 'Show' }
    ];

    hideShowOptions: any = [
        { label: 'Hide', value: 'Hide' },
        { label: 'Show', value: 'Show' }
    ];
    SelectedLinkArrowTypeVariable: string = "Hide";

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

    SelectedNodeLabelSizeVariable: any = 16;

    public nodeBorderWidth = 2.0;

    ShowNodeSymbolWrapper: boolean = false;
    ShowNodeSymbolTable: boolean = false;
    ShowPolygonColorTable: boolean = false;
    ShowAdvancedExport: boolean = true;

    NodeSymbolTableWrapperDialogSettings: DialogSettings = new DialogSettings('#node-symbol-table-wrapper', false);
    PolygonColorTableWrapperDialogSettings: DialogSettings = new DialogSettings('#polygon-color-table-wrapper', false);

    PhylogeneticTreeExportDialogSettings: DialogSettings = new DialogSettings('#network-settings-pane', false);

    ContextSelectedNodeAttributes: {attribute: string, value: string}[] = [];

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
      const treeString = '((((A:0.0431,(((B:0.06836,(C:0.00628,D:0.00069):0.00473):0.00678,E:0.0455):0.002908,F:0.00240):0.01085):0.096,G:0.01784):0.03,(H:0.0480,I:0.0026):0.0336):0.001917,J:0.01917)';
      // const treeString = '(A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;';
      const tree = Phylocanvas.createTree('phylocanvas', {
        fillCanvas: true,
        size: 15,
        shape: 'circle',
        showLabels: true,
        hoverLabels: true,
        selectedColour: '#FF8300',
        showBranchLengthLabels: true,
      });
      tree.load(treeString);
      tree.setTreeType('rectangular');
      tree.setNodeSize(15);
      // tree.setTextSize(20);
      tree.leaves.forEach((x) => {
        x.setDisplay({
          labelStyle: {
            textSize: 30,
          },
          leafStyle: {
            fillStyle: '#1F77B4',
          }
        });
      });
      for (const branch in tree.branches.keys()) {
        if (branch in tree.branches.keys()) {
          tree.branches[branch].setDisplay({
            labelStyle: {
              textSize: 20,
            }
          });
        }
      }
      tree.saveOriginalTree();
      const phyCanv = document.querySelector('#phylocanvas');
      const canvHeight = phyCanv.clientHeight;
      console.log(canvHeight);
      const canvWidth = phyCanv.clientWidth;
      tree.setSize(canvWidth, canvHeight);

      tree.draw();


    }


    ngOnInit() {
      console.log('Trying to open up the phylogenetic tree view');
      this.openTree();

    }

    InitView() {
        console.log('InitView is called');
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


}
