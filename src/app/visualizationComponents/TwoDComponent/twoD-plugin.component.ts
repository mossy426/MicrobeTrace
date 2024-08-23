import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy, Inject, ChangeDetectionStrategy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EventManager } from '@angular/platform-browser';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import { window } from 'ngx-bootstrap';
import * as d3 from 'd3';
import { forceAttract } from 'd3-force-attract';
import { Clipboard } from '@angular/cdk/clipboard';
//import * as ClipboardJS from 'clipboard';
import * as saveAs from 'file-saver';
import * as domToImage from 'dom-to-image-more';
import { SelectItem } from 'primeng/api';
import { DialogSettings } from '../../helperClasses/dialogSettings';
import { MicobeTraceNextPluginEvents } from '../../helperClasses/interfaces';
import * as _ from 'lodash';
import { MicrobeTraceNextVisuals } from '../../microbe-trace-next-plugin-visuals';
import { CustomShapes } from '@app/helperClasses/customShapes';
//import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponentDirective } from '@app/base-component.directive';
import { saveSvgAsPng } from 'save-svg-as-png';
import { ComponentContainer } from 'golden-layout';
import { MicrobeTraceNextHomeComponent } from '../../microbe-trace-next-plugin.component';
import { GoogleTagManagerService } from 'angular-google-tag-manager';


@Component({
    selector: 'TwoDComponent',
    templateUrl: './twoD-plugin.component.html',
    styleUrls: ['./twoD-plugin.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoDComponent extends BaseComponentDirective implements OnInit, MicobeTraceNextPluginEvents, OnDestroy {

    @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();

    svgStyle: {} = {
        'height': '0px',
        'width': '1000px'
    };

    private customShapes : CustomShapes = new CustomShapes();

    private symbolTableWrapper: HTMLElement | null = null;
    private linkColorTableWrapper: HTMLElement | null = null;
    private nodeColorTableWrapper: HTMLElement | null = null;




    ShowNetworkAttributes: boolean = false;
    ShowStatistics: boolean = true;
    Show2DExportPane: boolean = false;
    Show2DSettingsPane: boolean = false;
    IsDataAvailable: boolean = false;
    svg: any = null;
    widgets: object;
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
    LinkToolTipList: SelectItem[] = [];

    ctrlPressed : boolean = false;
    dragging : boolean = false;

    isLoading : boolean = true;
    viewActive: boolean = true;
    
    //Polygon Tab
    SelectedPolygonLabelVariable: string = "None";
    SelectedPolygonColorVariable: string = "None";
    SelectedPolygonLabelOrientationVariable: string = "Right";
    SelectedPolygonLabelSizeVariable: number = 0.0;
    SelectedPolygonGatherValue: number = 0.0;
    CenterPolygonVariable: string = "None";
    SelectedPolygonLabelShowVariable: string = "Hide";
    SelectedPolygonColorShowVariable: string = "Hide";
    SelectedPolygonColorTableShowVariable: string = "Hide";


    // Node Tab    
    SelectedNodeLabelVariable: string = "None";
    SelectedNodeLabelOrientationVariable: string = "Right";
    SelectedNodeTooltipVariable: any = "None";
    SelectedNodeSymbolVariable: string = "None";
    SelectedNodeShapeVariable: string = "symbolCircle";
    SelectedNodeRadiusVariable: string = "None";
    SelectedNodeRadiusSizeVariable: string = "None";
    SelectedNodeRadiusSizeMaxVariable: string = "None";
    SelectedNodeRadiusSizeMinVariable: string = "None";
    TableTypes: any = [
        { label: 'Show', value: 'Show' },
        { label: 'Hide', value: 'Hide' }
    ];
    SelectedNetworkTableTypeVariable: string = "Hide";

    private isExportClosed: boolean = false;
    /* XXXXXnot sure if this boolean is necessary; Related to exportWork, and bottom-table s (ie. node-symbol-table-bottom)
     currently exportWork2 is used which don't make use of isExporting and bottom-table s XXXXX */
    public isExporting: boolean = false;

    isMac: boolean = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;


    // Link Tab
    SelectedLinkTooltipVariable: any = "None";
    SelectedLinkLabelVariable: string = "None";
    SelectedLinkDecimalVariable: number = 3;
    SelectedLinkTransparencyVariable: any = 0;
    SelectedLinkWidthByVariable: string = "None";
    SelectedLinkWidthMax: number = 27;
    SelectedLinkWidthMin: number = 3;

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
        { label: 'Hide', value: false },
        { label: 'Show', value: true }
    ];
    SelectedLinkArrowTypeVariable: string = "Hide";

    // Network 
    NeighborTypes: any = [
        { label: 'Normal', value: 'Normal' },
        { label: 'Highlighted', value: 'Highlighted' }
    ];
    SelectedNetworkNeighborTypeVariable: string = "Normal";

    GridLineTypes: any = [
        { label: 'Hide', value: 'Hide' },
        { label: 'Show', value: 'Show' }
    ];
    SelectedNetworkGridLineTypeVariable: string = "Hide";

    SelectedNetworkChargeVariable: any = 200;
    SelectedNetworkGravityVariable: any = .05;
    SelectedNetworkFrictionVariable: any = .4;
    SelecetedNetworkLinkStrengthVariable: any = 0.123;
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
    CalculatedResolution: string;

    SelectedNodeLabelSizeVariable: any = 16;

    public nodeBorderWidth = 2.0;

    ShowNodeSymbolWrapper: boolean = false;
    ShowNodeSymbolTable: boolean = false;
    ShowPolygonColorTable: boolean = false;
    ShowAdvancedExport: boolean = true;

    NodeSymbolTableWrapperDialogSettings: DialogSettings = new DialogSettings('#node-symbol-table-wrapper', false);
    PolygonColorTableWrapperDialogSettings: DialogSettings = new DialogSettings('#polygon-color-table-wrapper', false);

    Node2DNetworkExportDialogSettings: DialogSettings = new DialogSettings('#network-settings-pane', false);

    ContextSelectedNodeAttributes: {attribute: string, value: string}[] = [];

    private visuals: MicrobeTraceNextVisuals;

    constructor(injector: Injector,
        private eventManager: EventManager,
        public commonService: CommonService,
        @Inject(BaseComponentDirective.GoldenLayoutContainerInjectionToken) private container: ComponentContainer, 
        elRef: ElementRef,
        private cdref: ChangeDetectorRef,
        private clipboard: Clipboard,
        private gtmService: GoogleTagManagerService) {

            super(elRef.nativeElement);

            this.visuals = commonService.visuals;
            this.commonService.visuals.twoD = this;
            this.widgets = this.commonService.session.style.widgets;
            window.addEventListener('resize', () => {
                // Replace this with the logic to determine the current show/hide state
                const showState: boolean = this.widgets['network-gridlines-show'];
                this.drawGridlines(showState);
            });

            this.container.on('hide', () => { 
                this.viewActive = false; 
                this.cdref.detectChanges();
            })
            this.container.on('show', () => { 
                this.viewActive = true; 
                this.cdref.detectChanges();
            })
    }

    ngOnInit() {
        this.visuals.twoD.commonService.updateNetwork();
        this.InitView();
    }

    ngAfterViewInit() {

    }

    /** Initializes the view.
     * 
     * Defines the structure of the svg of twoD network and adds functionalities such as click, zoom, forces, etc...
     * 
     * Populates various lists for Fieldlist (options for node-label-variable, node-symbol-variable, node-radius-variable, polygon-foci), 
     * ToolTipFieldList (options for link-width-variable, link-label-variable), and LinkToolTipList (link-toolitp-variable)
     * 
     */
    InitView() {

        this.gtmService.pushTag({
            event: "page_view",
            page_location: "/2d_network",
            page_title: "2D Network View"
        });
        this.visuals.twoD.IsDataAvailable = (this.visuals.twoD.commonService.session.data.nodes.length === 0 ? false : true);
        if (!this.widgets['default-distance-metric']) {
          this.widgets['default-distance-metric'] = 
            this.visuals.twoD.commonService.GlobalSettingsModel.SelectedDistanceMetricVariable;
          this.widgets['link-threshold'] = 
            this.visuals.twoD.commonService.GlobalSettingsModel.SelectedLinkThresholdVariable;
        }
  
        // Use this method to prepare your variables before they're used in the template
        this.commonService.session.style.widgets['node-tooltip-variable'] = this.ensureArray(this.commonService.session.style.widgets['node-tooltip-variable']);
        this.commonService.session.style.widgets['link-tooltip-variable'] = this.ensureArray(this.commonService.session.style.widgets['link-tooltip-variable']);

        if (this.visuals.twoD.IsDataAvailable === true && this.visuals.twoD.zoom === null) {

            d3.select('svg#network').exit().remove();
            this.visuals.twoD.svg = d3.select('svg#network').append('g');

            // populate this.twoD.FieldList with [None, ...nodeFields]
            this.visuals.twoD.FieldList = [];
            this.visuals.twoD.FieldList.push({ label: "None", value: "None" });
            this.visuals.twoD.commonService.session.data['nodeFields'].map((d, i) => {
                if (d != 'seq' && d != 'sequence') {
                    this.visuals.twoD.FieldList.push(
                        {
                            label: this.visuals.twoD.commonService.capitalize(d.replace("_", "")),
                            value: d
                        });
                }

            });


            // populate this.visuals.twoD.ToolTipFieldList and this.LinkToolTipList
            this.visuals.twoD.ToolTipFieldList = [];
            this.LinkToolTipList = [];
            this.visuals.twoD.ToolTipFieldList.push({ label: "None", value: "None" });
            this.visuals.twoD.commonService.session.data['linkFields'].map((d, i) => {
                if (d == 'source') {
                    let data = [
                        {
                            label: 'Source ID',
                            value: 'source_id'
                        },
                        {
                            label: 'Source Index',
                            value: 'source_index'
                        }
                    ]
                    this.visuals.twoD.ToolTipFieldList = this.visuals.twoD.ToolTipFieldList.concat(data);
                    this.LinkToolTipList = this.LinkToolTipList.concat(data)
                } else if (d == 'target') {
                    let data = [
                        {
                            label: 'Target ID',
                            value: 'target_id'
                        },
                        {
                            label: 'Target Index',
                            value: 'target_index'
                        }
                    ]
                    this.visuals.twoD.ToolTipFieldList = this.visuals.twoD.ToolTipFieldList.concat(data);
                    this.LinkToolTipList = this.LinkToolTipList.concat(data)
                } else {
                    this.LinkToolTipList.push(
                        {
                            label: this.visuals.twoD.commonService.capitalize(d.replace("_", "")),
                            value: d
                        });
                    this.visuals.twoD.ToolTipFieldList.push(
                        {
                            label: this.visuals.twoD.commonService.capitalize(d.replace("_", "")),
                            value: d
                        });
                }
            });


            this.visuals.twoD.svgStyle = {
                'height': '100%',
                'min-width.%': 100,
            };

            this.visuals.twoD.zoom = d3.zoom().on('zoom', () => this.visuals.twoD.svg.attr('transform', this.visuals.twoD.transform = d3.event.transform));
            // this.visuals.twoD.brush = d3.brush();
            this.visuals.twoD.halfWidth = $('#network').parent().width() / 2;
            this.visuals.twoD.halfHeight = $('#network').parent().parent().parent().height() / 2;
            this.visuals.twoD.transform = d3.zoomTransform(d3.select('svg#network').node());
            //this.widgets = this.widgets;

            let zoom = d3.zoom().filter(() => !this.ctrlPressed).on('zoom', () => this.visuals.twoD.svg.attr('transform', this.visuals.twoD.transform = d3.event.transform));

            let width = d3.select('svg#network').node().getBoundingClientRect().width;
            let height = d3.select('svg#network').node().getBoundingClientRect().height;

            let svgSelection = d3.select('svg#network');
            let svgWidth = svgSelection.node().getBoundingClientRect().width;
            let svgHeight = svgSelection.node().getBoundingClientRect().height;

            this.visuals.twoD.brush = d3.brush()
                .extent([[0, 0], [svgWidth, svgHeight]]) // Set the extent to cover the entire SVG
                .on('start', () => {
                    this.dragging = true;
                    this.visuals.twoD.commonService.session.network.nodes.forEach(d => {
                        if (d.visible) d._previouslySelected = d.selected;
                    });
                })
                .on('brush', () => {

                    let e = d3.event;
                    if (e.sourceEvent.type == 'end') return;
                    let selection0: any = this.visuals.twoD.transform.invert(e.selection[0]),
                        selection1: any = this.visuals.twoD.transform.invert(e.selection[1]);


                    //if (this.visuals.twoD.commonService.includes($(this).selection, null)) return;

                    this.visuals.twoD.commonService.session.network.nodes.forEach(d => {

                        let exp: any = ((selection0[0] <= d.x && d.x <= selection1[0] && selection0[1] <= d.y && d.y <= selection1[1]));

                        d.selected = (d._previouslySelected ^ (exp)) == 1;
                    });
                })
                .on('end', () => {
                    this.dragging = false;
                    if (d3.event.selection == null) return;
                    this.visuals.twoD.commonService.session.network.nodes.forEach(d => delete d._previouslySelected);
                    this.visuals.twoD.commonService.session.data.nodes.forEach(d => {
                        let match = this.visuals.twoD.commonService.session.network.nodes.find(node => node._id == d._id);
                        if (match) d.selected = match.selected;
                    });


                    this.visuals.twoD.render(true);
                    console.log('render drag');
                    $(document).trigger('node-selected');
                });

            d3.select('svg#network')
                .html(null) //Let's make sure the canvas is blank.
                .on('click', ()=>this.visuals.twoD.hideContextMenu())
                .call(zoom);

            d3.select('svg#network')
                .append('g')
                .attr('class', 'horizontal-gridlines');

            d3.select('svg#network')
                .append('g')
                .attr('class', 'vertical-gridlines');

            d3.select(window).on('keydown', () => {
                const event: any = d3.event;
                const keyToCheck = this.isMac ? 'metaKey' : 'ctrlKey';
            
                if (event[keyToCheck] && !this.dragging) {
                    this.ctrlPressed = true;
                    this.toggleBrush(true);
                }
            });
                
            d3.select(window).on('keyup', () => {
                const event: any = d3.event;
                const keyToCheck = this.isMac ? 'metaKey' : 'ctrlKey';
            
                if (event[keyToCheck] && !this.dragging) {
                    this.ctrlPressed = false;
                    this.toggleBrush(false);
                }
            });


            this.visuals.twoD.svg = d3.select('svg#network').append('g');

            this.visuals.twoD.svg.append('g').attr('class', 'clusters');
            this.visuals.twoD.svg.append('g').attr('class', 'links');
            this.visuals.twoD.svg.append('g').attr('class', 'nodes');
            this.visuals.twoD.svg.append('g').attr('class', 'clustersLabels');

            d3.select('svg#network')
                .append('g')
                .attr('class', 'brush')
                .call(this.visuals.twoD.brush);

            this.visuals.twoD.svg.append('svg:defs').append('marker')
                .attr('id', 'end-arrow')
                .attr('viewBox', '0 0 10 10')
                .attr('refX', 20)
                .attr('refY', 5)
                .attr('markerWidth', 4)
                .attr('markerHeight', 4)
                .attr('orient', 'auto')
                .append('svg:path')
                .attr('d', 'M0,0 L0,10 L10,5 z');

            this.visuals.twoD.force = d3.forceSimulation()
                .force('link', d3.forceLink()
                    .id(d => d._id)
                    .distance(l => l.origin.length * this.widgets['link-length'])
                    .strength(this.widgets['network-link-strength'])
                )
                .force('charge', d3.forceManyBody()
                    .strength(-this.widgets['node-charge'])
                )
                .force('gravity', forceAttract()
                    .target([this.visuals.twoD.halfWidth, this.visuals.twoD.halfHeight])
                    .strength(this.widgets['network-gravity'])
                )
                .force('center', d3.forceCenter(this.visuals.twoD.halfWidth, this.visuals.twoD.halfHeight));

            if (this.widgets['network-friction']) this.visuals.twoD.force.velocityDecay(this.widgets['network-friction']);

            // this.visuals.twoD.clipboard.on('success', ()=>this.hideContextMenu());

            let that = this;

            // this.visuals.twoD.eventManager.addGlobalEventListener('window', 'node-color-change', () => {

            //     this.visuals.twoD.updateNodeColors;
            // });

            // $( document ).on( "node-color-change", function( ) {
            //     that.visuals.twoD.updateNodeColors;
            // });

            // // this.visuals.twoD.eventManager.addGlobalEventListener('window', 'link-color-change', () => {

            // //     this.visuals.twoD.updateLinkColor;
            // // });

            // $( document ).on( "link-color-change", function( ) {
            //     that.visuals.twoD.updateLinkColor;
            // });

            // // this.visuals.twoD.eventManager.addGlobalEventListener('window', 'background-color-change', () => {

            // //     $('#network').css('background-color', this.widgets['background-color']);
            // // });

            // $( document ).on( "background-color-change", function( ) {
            //     $('#network').css('background-color', that.widgets['background-color']);
            // });

            // // this.visuals.twoD.eventManager.addGlobalEventListener('document', 'node-visibility link-visibility cluster-visibility node-selected', () => {

            // //     this.visuals.twoD.render(false);
            // // });


            // $( document ).on( "node-selected", function( ) {
            //         that.visuals.twoD.render(false);
            // });

            $( document ).on( "node-visibility", function( ) {
                if (!that.isLoading) {
                    console.log('render node-vis');
                    that.isLoading = true;
                    that.visuals.twoD.render(false);
                    setTimeout(() => {
                        that.isLoading = false;
                      }, 1000);
                }
            });

            $( document ).on( "link-visibility", function( ) {
                if (!that.isLoading) {
                    console.log('render link-vis');
                    that.isLoading = true;
                    that.visuals.twoD.render(false);
                    setTimeout(() => {
                        that.isLoading = false;
                      }, 1000);
                }            
            });

            $( document ).on( "cluster-visibility", function( ) {
                if (!that.isLoading) {
                    console.log('render clus-vis');
                    that.isLoading = true;
                    that.visuals.twoD.render(true);
                    setTimeout(() => {
                        that.isLoading = false;
                      }, 1000);
                }            
            });

            $( document ).on( "node-selected", function( ) {
                if (!that.isLoading) {
                    console.log('render node-sel');
                    that.isLoading = true;
                    that.visuals.twoD.render(true);
                    setTimeout(() => {
                        that.isLoading = false;
                      }, 1000);
                }            
            });

            this.visuals.twoD.eventManager.addGlobalEventListener('window', "node-selected", () => {
                console.log('render node-sel2');
                this.visuals.twoD.render(false);
            });

            if (this.visuals.twoD.commonService.session.files.length > 1) $('#link-color-variable').val('origin').change();
            if (this.widgets['background-color']) $('#network').css('background-color', this.widgets['background-color']);
            this.visuals.microbeTrace.SelectedStatisticsTypesVariable = 'Show';
            this.visuals.microbeTrace.onShowStatisticsChanged();
            this.loadSettings();

            //For some mysterious reason, this really needed a delay...
            setTimeout(() => {

                if (this.widgets['node-symbol-variable'] !== 'None') {
                    $('#node-symbol-variable').change(); //.trigger('change');
                }

                // Call render and then set isLoading to false to allo triggering of other renders
                console.log('norm render');
                this.visuals.twoD.render();
                setTimeout(() => {
                    this.isLoading = false;
                  }, 1000);


            }, 1);

            setTimeout(() =>{
                // sometimes (~1/10) MT loads but twoD nodes are displayed offscreen - like the fit command isn't executed - DC
                this.visuals.twoD.fit(undefined, undefined);
                // Ensure brush is off
                this.toggleBrush(false);
                // Add a little force for effect in landing
                this.visuals.twoD.force.alpha(1).alphaTarget(0).restart();
            }
                , 3000);


        }


    }

        // Method to ensure the value is an array
        ensureArray(value: any): any[] {
            if (Array.isArray(value)) {
            return value; // It's already an array, return as is
            } else if (value !== null && value !== undefined) {
            return [value]; // Not an array, but has a value, wrap it in an array
            } else {
            return []; // No value, return an empty array
            }
        }

    /**
     * Toggle the pointer events of the brush and overlay element
     * 
     * @param {boolean} enable - If true, pointer events are enabled; otherwise, they are disabled
     */
    private toggleBrush(enable: boolean): void {
        d3.select('svg#network g.brush')
          .attr('pointer-events', enable ? 'all' : 'none')
          .select('rect.overlay')
          .attr('pointer-events', enable ? 'all' : 'none');
      }

    /**
     * XXXXX empty function XXXXX
     */
    onDataChange(event) {

    }

    // loadDefaultVisualization(e: String) {

    //     setTimeout(() => {

    //         this.commonService.session.messages = [];
    //         // this.messages = [];
    //         $('#loading-information').html('');
    //         $('#launch').prop('disabled', false).focus();

    //         // this.displayloadingInformationModal = false;

    //     }, 1000);

    //     this.LoadDefaultVisualizationEvent.emit(e);
    // }

    /**
     * @returns an array [X, Y] of the position of mouse relative to twodcomponent. Global position (i.e. d3.event.pageX) doesn't work for a dashboard
     */  
    getRelativeMousePosition() {
        let rect = d3.select('twodcomponent').node().getBoundingClientRect();
        let X = d3.event.pageX - rect.left;
        let Y = d3.event.pageY - rect.top; 
        return [X, Y];
    }

    /**
     * @returns an array [width, height] of the svg image
     */
    getImageDimensions() {
        let parent = this.svg.node().parentElement;
        return [parent.clientWidth, parent.clientHeight] 
    }

    /**
     * Sets CalculatedResolution variable to string such as '1250 x 855px'. Only called when export is first opened
     */
    setCalculatedResolution() {
        let [width, height] = this.getImageDimensions();
        this.CalculatedResolution = (Math.round(width * this.SelectedNetworkExportScaleVariable) + " x " + Math.round(height * this.SelectedNetworkExportScaleVariable) + "px");
    }

    /**
     * Updates CalculatedResolution variable to string such as '1250 x 855px' based on ImageDimensions and SelectedNetworkExportScaleVariable. 
     * This is called anytime SelectedNetworkExportScaleVariable is updated.
     */
    updateCalculatedResolution(event) {
        let [width, height] = this.getImageDimensions();
        this.CalculatedResolution = (Math.round(width * this.SelectedNetworkExportScaleVariable) + " x " + Math.round(height * this.SelectedNetworkExportScaleVariable) + "px");
        this.cdref.detectChanges();
    }

    /**
     * Opens Global Setting Dialog
     */
    showGlobalSettings() {
        //console.log("threshold: ",  this.commonService.GlobalSettingsModel.SelectedLinkThresholdVariable);
        this.DisplayGlobalSettingsDialogEvent.emit("Styling");
    }

    /**
     * Hides export pane, sets isExporting variable to true and calls exportWork2 to export the twoD network image
     */
    exportVisualization(event) {

        this.visuals.twoD.Show2DExportPane = false;
        this.isExporting = true;

        // if (this.widgets['node-symbol-variable'] != 'None') {
        //     this.generateNodeSymbolSelectionTable("#node-symbol-table-bottom", this.widgets['node-symbol-variable'], false);
        // }

        // if (this.widgets['node-color-variable'] != 'None') {
        //     this.visuals.microbeTrace.generateNodeColorTable("#node-color-table-bottom", false);
        // }

        // if (this.widgets['link-color-variable'] != 'None') {
        //     this.visuals.microbeTrace.generateNodeLinkTable("#link-color-table-bottom", false);
        // }

        if (!this.isExportClosed) {
            setTimeout(() => this.exportVisualization(undefined), 300);
        }
        else {
            this.exportWork2();
        }
    }

    /**
     * Sets this.isExportClosed to true
     */
    onCloseExport() {
        this.isExportClosed = true;
    }

    /**
     * When the svg is clicked, this function is called and it removes color transparency slider that appears when updating color transparency in node/link color tables
     */
    networkWhitespaceClicked() : void {

        // The color transparency slider should dissapear if clicked out
        $("#color-transparency-wrapper").css({
            display: "none"
        });

        this.commonService.session.network.nodes.forEach(node => {
            node.selected = false;
        });
    }

    /**
     * XXXXX Not currently used in codebase; exportWork2 is used instead XXXXX
     */
    exportWork() {
        let network = document.getElementById('network');
        let $network = $(network);
        let watermark = d3.select(network).append('text')
        .attr('xlink:href', this.visuals.twoD.commonService.watermark)
        .attr('height', 128)
        .attr('width', 128)
        .attr('x', 10)
        .style('opacity', $('#network-export-opacity').val());
        let filetype = this.SelectedNetworkExportFileTypeListVariable, 
            filename = this.SelectedNetworkExportFilenameVariable;
        if (filetype == 'svg') {
           
            network.style.height = '100%';
            network.style.width = '100%';
            let content = this.visuals.twoD.commonService.unparseSVG(network);
            let blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
            saveAs(blob, filename + '.' + filetype);
            watermark.remove();
            const style: any = this.svgStyle;
            network.style.height = style.height;
            network.style.width = style.width;
            
        } else {
            setTimeout(() => {
                const scale: number = this.visuals.twoD.SelectedNetworkExportScaleVariable;
                const element = document.querySelector('TwoDComponent').parentElement;
                domToImage.toBlob(element, {
                    width: element.clientWidth * scale,
                    height: element.clientHeight * scale,
                    style: {
                        transform: 'scale(' + scale + ')',
                        transformOrigin: 'top left'
                    },
                    quality: this.visuals.twoD.SelectedNetworkExportQualityVariable
                })
                    .then((blob) => {
                        saveAs(blob, filename + '.' + filetype);

                        watermark.remove();
                        this.visuals.twoD.isExporting = false;
                        // this.visuals.microbeTrace.clearTable("#node-symbol-table-bottom");
                        // this.visuals.microbeTrace.clearTable("#node-color-table-bottom");
                        // this.visuals.microbeTrace.clearTable("#link-color-table-bottom");

                        // this.visuals.microbeTrace.GlobalSettingsDialogSettings.restoreStateAfterExport();
                        // this.visuals.microbeTrace.GlobalSettingsLinkColorDialogSettings.restoreStateAfterExport();
                        // this.visuals.microbeTrace.GlobalSettingsNodeColorDialogSettings.restoreStateAfterExport();
                        // this.visuals.twoD.NodeSymbolTableWrapperDialogSettings.restoreStateAfterExport();
                        // this.visuals.twoD.PolygonColorTableWrapperDialogSettings.restoreStateAfterExport();
                        // this.visuals.twoD.Node2DNetworkExportDialogSettings.restoreStateAfterExport();
                    });
            }, 1000);
           
        }
    }

    /**
     * Exports twoD network svg as an svg, png, jpeg, or webp image
     */
    exportWork2() {
        let network = document.getElementById('network');
        let $network = $(network);

        // add microbeTrace logo as a watermark
        let watermark = d3.select(network).append('image')
            .attr('xlink:href', this.visuals.twoD.commonService.watermark)
            .attr('height', 128)
            .attr('width', 128)
            .attr('x', 35)
            .attr('y', 35)
            .style('opacity', $('#network-export-opacity').val());

        let filetype = this.SelectedNetworkExportFileTypeListVariable; 
        let filename = this.SelectedNetworkExportFilenameVariable;

        // add node color table
        let vnodes : any = this.visuals.twoD.commonService.getVisibleNodes();
        let aggregates = this.visuals.twoD.commonService.createNodeColorMap();
        let values = Object.keys(aggregates);
        var columns = [];
        columns.push('Node ' + this.visuals.twoD.commonService.titleize(this.widgets["node-color-variable"]));
        if (this.widgets["node-color-table-counts"]) columns.push('Count');
        if (this.widgets["node-color-table-frequencies"]) columns.push('Frequency');
        columns.push('Color');
        var data = [];
        values.forEach((value, i) => {
            let nodeValue =  (this.visuals.twoD.commonService.session.style.nodeValueNames[value] ? this.visuals.twoD.commonService.session.style.nodeValueNames[value] : this.visuals.twoD.commonService.titleize("" + value));
            let tableCounts = (this.widgets["node-color-table-counts"] ?  aggregates[value] : undefined);
            let tableFreq = (this.widgets["node-color-table-frequencies"] ? (aggregates[value] / vnodes.length).toLocaleString() : undefined);
            let line = {
                Node: nodeValue,
                Count: tableCounts, 
                Frequency: tableFreq,
                Color: '<div  style="margin-left:5px; width:40px;height:12px;background:' + this.visuals.twoD.commonService.temp.style.nodeColorMap(value)  +'"> </div>'
            }
            data.push(line);
        })

        let nodeWrapper = null;

        this.visuals.twoD.commonService.currentNodeTableElement.subscribe((element) => {
            if(element){
                nodeWrapper = element;
                } else {
                console.error('currentNodeTableElement is null');
                }                // You can now interact with this.myElement
        });
            // private symbolTableWrapper: HTMLElement | null = null;
            // private linkColorTableWrapper: HTMLElement | null = null;
            // private nodeColorTableWrapper: HTMLElement | null = null;
            // let nodeWrapper = this.parent.getElementById('node-color-table');

        //console.log('node wrapper: ', nodeWrapper);
        let nodeLegend = this.tabulate2(data, columns, nodeWrapper, network, 200,false);
    
        // add link origin table
        let vlinks = this.visuals.twoD.commonService.getVisibleLinks();
        aggregates = this.visuals.twoD.commonService.createLinkColorMap();
        values = Object.keys(aggregates);
        columns = [];
        columns.push('Link ' + this.visuals.twoD.commonService.titleize(this.widgets["link-color-variable"]));
        if (this.widgets["link-color-table-counts"]) columns.push('Count');
        if (this.widgets["link-color-table-frequencies"]) columns.push('Frequency');
        columns.push('Color');
        data = [];
        values.forEach((value, i) => {
            let nodeValue =  (this.visuals.twoD.commonService.session.style.linkValueNames[value] ? this.visuals.twoD.commonService.session.style.linkValueNames[value] : this.visuals.twoD.commonService.titleize("" + value));
            let tableCounts = (this.widgets["link-color-table-counts"] ?  aggregates[value] : undefined);
            let tableFreq = (this.widgets["link-color-table-frequencies"] ? (aggregates[value] / vlinks.length).toLocaleString() : undefined);
            let line = {
                Link: nodeValue,
                Count: tableCounts, 
                Frequency: tableFreq,
                Color: '<div  style="margin-left:5px; width:40px;height:12px;background:' + this.visuals.twoD.commonService.temp.style.linkColorMap(value)  +'"> </div>'
              }
              data.push(line);
        })

        let linkWrapper = null;

        this.visuals.twoD.commonService.currentLinkTableElement.subscribe((element) => {
            linkWrapper = element;
            // You can now interact with this.myElement
            });
        // let linkWrapper = document.getElementById('link-color-table-wrapper');
        let linkLegend = this.tabulate2(data, columns, linkWrapper, network, 600, false);
    
        // add node symbol table
        let variable = this.widgets['node-symbol-variable'];
            values = [];
        aggregates = {};
        let nodes = this.visuals.twoD.commonService.session.data.nodes;
        let n = nodes.length;
        vnodes = 0;
        for (let i = 0; i < n; i++) {
            let d = nodes[i];
            if (!d.visible) continue;
            vnodes++;
            let dv = d[variable];
            if (values.indexOf(dv) == -1) values.push(dv);
            if (dv in aggregates) {
                aggregates[dv]++;
            } else {
                aggregates[dv] = 1;
            }
        }
        columns = [];
        columns.push('Node ' + this.visuals.twoD.commonService.titleize(variable));
        if (this.widgets["node-symbol-table-counts"]) columns.push('Count');
        if (this.widgets["node-symbol-table-frequencies"]) columns.push('Frequency');
        columns.push('Shape');
        data = [];
        values.forEach((value, i) => {
            let nodeValue =  this.visuals.twoD.commonService.titleize("" + value);
            let tableCounts = (this.widgets["node-symbol-table-counts"] ?  aggregates[value] : undefined);
            let tableFreq = (this.widgets["node-symbol-table-frequencies"] ? (aggregates[value] / vnodes.length).toLocaleString() : undefined);        
            let line = {
                Node: nodeValue,
                Count: tableCounts, 
                Frequency: tableFreq,
                Shape: $("#node-symbol-table option[value='" + this.commonService.temp.style.nodeSymbolMap(value) + "']").eq(parseInt(value)).text()
            }
            data.push(line);
        })
        let symbolWrapper = document.getElementById('node-symbol-table');
        let symbolLegend;
        if (symbolWrapper) {
            symbolLegend = this.tabulate2(data, columns, symbolWrapper, network, 200, true);
        }
            
        // add network statistics table
        let statsDiv = document.getElementById('network-statistics-wrapper');
        let foreignObjStats = d3.select(network).append("svg:foreignObject")
            .attr("x", statsDiv.offsetLeft)
            .attr("y", statsDiv.offsetTop-10)
            .attr("width", statsDiv.offsetWidth)
            .attr("height", statsDiv.offsetHeight);
        foreignObjStats.append("xhtml:body").html(statsDiv.innerHTML);

        if (filetype == 'svg') {
            let content = this.visuals.twoD.commonService.unparseSVG(network);
            let blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
            saveAs(blob, filename + '.' + filetype);
            if (watermark){
                watermark.remove();
            }
            if (nodeLegend){
                nodeLegend.remove();
            }
            if (linkLegend){
                linkLegend.remove();
            }
            if (symbolLegend){
                symbolLegend.remove();
            }
            if (foreignObjStats){
                foreignObjStats.remove();
            }
        } else {
            saveSvgAsPng(network, filename + '.' + filetype, {
                scale: this.SelectedNetworkExportScaleVariable,
                backgroundColor: this.widgets['background-color'],
                encoderType: 'image/' + filetype,
                encoderOptions: this.SelectedNetworkExportQualityVariable
            }).then(() => {
                if (watermark){
                    watermark.remove();
                }
                if (nodeLegend){
                    nodeLegend.remove();
                }
                if (linkLegend){
                    linkLegend.remove();
                }
                if (symbolLegend){
                    symbolLegend.remove();
                }
                if (foreignObjStats){
                    foreignObjStats.remove();
                }
            });
        }
    }

    /**
     * Converts table such as node color table, link color table or node symbol table from dialog window into element on twoD network svg when
     * getting ready to export.
     * @param data Object[] containing information in the table, such as color, count, node/groupLabel
     * @param columns string array of table column names
     * @param wrapper HTMLElement of table
     * @param container HTMLElement of entive svg/network
     * @param topOffset number
     * @param leftOffset boolean
     * @returns foreignObject that can be removed later by foreignObjectName.remove()
     */
    tabulate2 = (data, columns, wrapper, container, topOffset: number, leftOffset: boolean) => {

        console.log('wrapper: ', wrapper);
        console.log('left: ', wrapper.offsetLeft);
        let containerWidth = container.getBBox().width;
        let rightPosition = containerWidth - wrapper.offsetWidth;        
        console.log('right: ', rightPosition);

        let foreignObj = d3.select(container).append("svg:foreignObject")
          .attr("x", (leftOffset) ? rightPosition : wrapper.offsetLeft)
          .attr("y", wrapper.offsetTop + topOffset)
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

    /**
     * Renders the twoD network.
     * 
     * Set node functionalities and properties; set link functionalities, properties, and labels; sets polygon functionalities and properties if needed
     * @param showStatistics updates this.showStatistics variable
     */
    render(showStatistics: boolean = true) {

        if(this.isLoading) {

        
        console.log('rendering');

        if (!$('#network').length) return;

        $("#numberOfSelectedNodes").text(this.visuals.twoD.commonService.session.data.nodes.filter(d => d.selected).length.toLocaleString());

        const start = Date.now();
        let newNodes = this.visuals.twoD.commonService.getVisibleNodes(true);
        let oldNodes;

        if(this.widgets["timeline-date-field"] != 'None')
            oldNodes = this.visuals.twoD.commonService.session.network.timelineNodes;
        else
            oldNodes = this.visuals.twoD.commonService.session.network.nodes;
        
        if (newNodes.length === 0 && this.widgets["timeline-date-field"] == 'None') return;

        // match newNodes to oldNodes so that position variables can be updated in newNodes
        newNodes.forEach((d, i) => {
            let match = oldNodes.find(d2 =>  {
                if(!d2.id) {
                    d2.id = d2._id;
                }
                if(!d.id){
                    d.id = d._id;
                }
                return d2.id == d.id
            });            
            if (match) {
                ['x', 'y', 'fx', 'fy', 'vx', 'vy', 'fixed'].forEach(v => {
                    
                    if (typeof match[v] != "undefined") {
                        d[v] = match[v];
                    } 

                });
            }
        });

        this.visuals.twoD.commonService.session.network.nodes = newNodes;

        // sets functionality for nodes, as well as node border and node text/label position
        let nodes = this.visuals.twoD.svg.select('g.nodes').selectAll('g').data(newNodes, d => d._id)
            .join(
                enter => {
                    let g = enter.append('g')
                        .attr('tabindex', '0')
                        .call(d3.drag() //A bunch of mouse handlers.
                            .on('start', (x) => this.visuals.twoD.dragstarted(x))
                            .on('drag', (x) => this.visuals.twoD.dragged(x))
                            .on('end', (x) => this.visuals.twoD.dragended(x)))
                        .on('mouseenter focusin', (x) => this.visuals.twoD.showNodeTooltip(x))
                        .on('mouseout focusout', (x) => this.visuals.twoD.hideTooltip())
                        .on('contextmenu', (x) => this.visuals.twoD.showContextMenu(x))
                        .on('click', (x) => this.visuals.twoD.clickHandler(x))
                        .on('keydown', n => {
                            if (d3.event.code == 'Space') this.visuals.twoD.clickHandler(n);
                            if (d3.event.shiftKey && d3.event.key == 'F10') this.visuals.twoD.showContextMenu(n);
                        });
                       g.append('path')
                        .style('stroke', 'black')
                        .style('stroke-width', '2px');
                    g.append('text')
                        .attr('dy', 5)
                        .attr('dx', 8);
                    return g;
                }
            );

        // updates node properties (color, shape, label, size, etc...)
        this.visuals.twoD.redrawNodes();
        this.visuals.twoD.redrawLabels();
        this.visuals.twoD.redrawNodeBorder();
        this.visuals.twoD.updateNodeColors();

        // sets link functionality
        let vlinks = this.visuals.twoD.getVLinks();
        let links = this.visuals.twoD.svg.select('g.links').selectAll('line').data(vlinks)
            .join('line')
            .attr('stroke-width', this.widgets['link-width'])
            .attr('opacity', 1 - this.widgets['link-opacity'])
            .on('mouseenter', (x) => this.visuals.twoD.showLinkTooltip(x))
            .on('mouseout', (x) => this.visuals.twoD.hideTooltip());

        // updates link color and width
        this.visuals.twoD.updateLinkColor();
        this.visuals.twoD.scaleLinkWidth();

        // defines link labels
        let linklabels = this.visuals.twoD.svg.select('g.links').selectAll('text').data(vlinks)
            .join('text')
            .attr('text-anchor', 'middle')
            .attr('dy', this.widgets['link-width'] + 2)
            .text((l) => {

                const labelValue = l[this.widgets['link-label-variable']];
              
                if (typeof labelValue === 'number' || !isNaN(parseFloat(labelValue))) {

                    if(this.widgets['default-distance-metric'] == 'snps') {
                        return Math.round(parseFloat(labelValue));
                    } else {
                        return parseFloat(labelValue).toFixed(this.widgets['link-label-decimal-length']);
                    }

                } else {
                    return labelValue;
                }
              });

        /**
         * Updates node and link position, and position and angle of link label
         */
        let layoutTick = () => {
             nodes
                .attr('transform', d => {
                    var ew =
                        d.fixed ?
                            `translate(${d.fx}, ${d.fy})` :
                            `translate(${d.x}, ${d.y})`;

                    return ew;
                }
                );
            links
                .attr('x1', l => l.source.x)
                .attr('y1', l => l.source.y)
                .attr('x2', l => l.target.x)
                .attr('y2', l => l.target.y);


            if (this.widgets['link-label-variable'] !== 'None') {
                linklabels
                    .attr('x', l => (l.source.x + l.target.x) / 2)
                    .attr('y', l => (l.source.y + l.target.y) / 2)
                    .attr('transform', l => 'rotate(' +
                        this.visuals.twoD.calcAngle(l.source, l.target) + ' ' +
                        (l.source.x + l.target.x) / 2 + ' ' +
                        (l.source.y + l.target.y) / 2 + ')'
                    );
            }
        };

        let foci = this.widgets['polygons-foci'];
        let gather = this.widgets['polygons-gather-force'];
        let fill = this.widgets['polygon-color'] as any;
        var opacity;
        
        if (this.widgets['polygons-color-show']) {
            fill = d => this.visuals.twoD.commonService.temp.style.polygonColorMap(d.key);
            opacity = (d) => this.visuals.twoD.commonService.temp.style.polygonAlphaMap(d.key);
        } else {
            opacity = 0.4;
        }

        d3.select('#network g.clusters').html(null);
        d3.select('#network g.clustersLabels').html(null);
        let groups = d3.nest().key(function(d) { return d[foci]; }).entries(newNodes).map(function(d) {
                var key = d.key
                var values = d.values.map(function(dd){
                dd.foci = key;
                return dd;
                })
                return {'key':key, 'values':values}
            });
        groups = groups.filter(group => group.values.length > 2 && group.key != 'null');  // remove group by empty
        let groupPath = function(d) {
            return "M" + 
            d3.polygonHull(d.values.map(function(i) { return [i.x, i.y]; }))
                .join("L")
            + "Z";
        }; 
        let polygonTextCord = function(d) {
            return d3.polygonHull(d.values.map(function(i) { return [i.x, i.y]; }));
        };
        let clusters = new Array(groups.length);  // The largest node for each cluster.
        newNodes.forEach(d => {
            let r =  d[foci];
            let i = d.foci;
            if (!clusters[i] || (r > clusters[i].radius)) 
            clusters[i] = d;
        })
        /**
         * Similar to layoutTick, but adds functionalities for polygons
         * 
         * Updates node and link position, and position and angle of link label.
         * Adds polygons, polygon mouse handlers, and polygon labels
         */
        let polygonsTick = () => {
            newNodes.forEach(function(o, i) {
            o.y += (clusters[o.foci].y - o.y) * gather;
            o.x += (clusters[o.foci].x - o.x) * gather;
            });
            nodes.attr('transform', d => `translate(${d.x}, ${d.y})`);
            links
            .attr('x1', l => l.source.x)
            .attr('y1', l => l.source.y)
            .attr('x2', l => l.target.x)
            .attr('y2', l => l.target.y);
            if (this.widgets['link-label-variable'] !== 'None') {
            linklabels
                .attr('x', l => (l.source.x + l.target.x) / 2)
                .attr('y', l => (l.source.y + l.target.y) / 2)
                .attr('transform', l => 'rotate(' +
                this.calcAngle(l.source, l.target) + ' ' +
                (l.source.x + l.target.x) / 2 + ' ' +
                (l.source.y + l.target.y) / 2 + ')'
                );
            }
            d3.select('#network g.clusters').selectAll('path')
            .data(groups)
            .attr("d", groupPath) 
            .enter()
            .insert("path", "circle")
            .style("fill", fill)
            .style("stroke", fill)
            .style("stroke-width", 40)
            .style("stroke-linejoin", "round")
            .style("opacity", opacity)
            .attr("d", groupPath);
            d3.select('#network g.clusters').selectAll('path')
            .call(d3.drag() //A bunch of mouse handlers.
                    .on('start', (x) => this.visuals.twoD.polygonDragStarted(x))
                    .on('drag', (x) => this.visuals.twoD.polygonDragged(x))
                    .on('end', (x) =>  this.visuals.twoD.polygonDragEnded(x)))

                    // (x) => this.visuals.twoD.dragstarted(x)

            if (this.widgets['polygons-label-show']) {

            let g= d3.select('#network g.clustersLabels').text("").selectAll('text')
                .data(groups)
                .enter()
                .append("text")
                .attr('transform', function (d) { return "translate("+d3.polygonCentroid(polygonTextCord(d))+")"; })
                .text(d => this.visuals.twoD.commonService.titleize("" + d.key));
                
                d3.select('#network g.clustersLabels').selectAll('text').attr("class","WashingT")
                .call(d3.drag()
                .on("start", this.visuals.twoD.polygonLabelDragStarted)
                .on("drag", this.visuals.twoD.polygonLabelDragged)
                .on("end", this.visuals.twoD.polygonLabelDragEnded));

            this.redrawPolygonLabels();
            }
        }      
        
        if(this.widgets['polygons-show']) this.visuals.twoD.commonService.temp.polygonGroups = groups;
        else delete this.visuals.twoD.commonService.temp.polygonGroups;

        let handleTick = d => {
            if(d) {
                return polygonsTick;
            }
            else return layoutTick;		
        }

        this.visuals.twoD.force.nodes(this.visuals.twoD.commonService.session.network.nodes).on('tick', handleTick(this.widgets['polygons-show']));
        this.visuals.twoD.force.force('link').links(vlinks);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        $('#node-symbol-variable').trigger('change');

        this.visuals.twoD.ShowStatistics = showStatistics;
        this.visuals.twoD.cdref.detectChanges();

        // Get the new SVG dimensions after the network is generated
        let newSvgWidth = d3.select('svg#network').node().getBoundingClientRect().width;
        let newSvgHeight = d3.select('svg#network').node().getBoundingClientRect().height;

        // Update the brush extent
        this.visuals.twoD.brush.extent([[0, 0], [newSvgWidth, newSvgHeight]]);

        // Recall the brush to apply the new extent
        d3.select('g.brush').call(this.visuals.twoD.brush);
    }

    };

    /**
     * This function is called when a polygonLabel drag is started; it moves <text> element to last under g.clusterLabels and adds class polygonText to the element
     */
    polygonLabelDragStarted(d) {
        d3.select(this).raise().attr("class", "polygonText");
    }
    
    /**
     * Moves location of polygon label when it is dragged by updating transform="translate(x,y)"
     */
    polygonLabelDragged(d) {
        d3.select(this).attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
    }

    /**
     * This function is called when a polygonLabel drag is ended; it removes class polygonText from <text> element
     */
    polygonLabelDragEnded(d) {
        d3.select(this).attr("class", "");
    }

    /**
     * Generates Polygon Color Selection Table, updates polygonColorMap and polygonAlphaMap functions, and then calls render to show/update network
     * 
     * XXXXX this function needs revisiting. Doesn't always populate table. I had to hide color polygons, then show it, and then show polygon color table setting
     * to get table to appear. Also not sorting correctly with names XXXXX
     */
    updatePolygonColors() {
        let polygonSort = $("<a style='cursor: pointer;'>&#8645;</a>").on("click", e => {
            this.widgets["polygon-color-table-counts-sort"] = "";
          if (this.widgets["polygon-color-table-name-sort"] === "ASC")
          this.widgets["polygon-color-table-name-sort"] = "DESC"
          else
          this.widgets["polygon-color-table-name-sort"] = "ASC"
            this.visuals.twoD.updatePolygonColors();
        });
        let polygonColorHeaderTitle =  (this.visuals.twoD.commonService.session.style['overwrite'] && this.visuals.twoD.commonService.session.style['overwrite']['polygonColorHeaderVariable'] && this.visuals.twoD.commonService.session.style['overwrite']['polygonColorHeaderVariable'] == this.widgets['polygons-foci'] ? this.visuals.twoD.commonService.session.style['overwrite']['polygonColorHeaderTitle'] : "Polygon " + this.visuals.twoD.commonService.titleize(this.widgets['polygons-foci']));
        let polygonHeader = $("<th class='p-1' contenteditable>" + polygonColorHeaderTitle + "</th>").append(polygonSort);
        let countSort = $("<a style='cursor: pointer;'>&#8645;</a>").on("click", e => {
  
            this.widgets["polygon-color-table-name-sort"] = "";
          if (this.widgets["polygon-color-table-counts-sort"] === "ASC")
          this.widgets["polygon-color-table-counts-sort"] = "DESC"
          else
          this.widgets["polygon-color-table-counts-sort"] = "ASC"
            this.visuals.twoD.updatePolygonColors();
        });
        let countHeader = $((this.widgets["polygon-color-table-counts"] ? "<th>Count</th>" : "")).append(countSort);
        let polygonColorTable = $("#polygon-color-table")
          .empty()
          .append($("<tr></tr>"))
          .append(polygonHeader)
          .append(countHeader)
          .append((this.widgets["polygon-color-table-frequencies"] ? "<th>Frequency</th>" : ""))
          .append("<th>Color</th>" );
        if (!this.visuals.twoD.commonService.session.style['polygonValueNames']) this.visuals.twoD.commonService.session.style['polygonValueNames'] = {};
        let aggregates = this.visuals.twoD.commonService.createPolygonColorMap();
        let values = Object.keys(aggregates);
  
        if (this.widgets["polygon-color-table-counts-sort"] == "ASC")
          values.sort(function(a, b) { return aggregates[a] - aggregates[b] });
        else if (this.widgets["polygon-color-table-counts-sort"] == "DESC")
          values.sort(function(a, b) { return aggregates[b] - aggregates[a] });
        if (this.widgets["polygon-color-table-name-sort"] == "ASC")
          values.sort(function(a, b) { return a as any - (b as any) });
        else if (this.widgets["polygon-color-table-name-sort"] == "DESC")
          values.sort(function(a, b) { return b as any - (a as any) });
  
        let total = 0;
        values.forEach(d => total += aggregates[d] );
  
        let that = this;

        values.forEach((value, i) => {
            that.visuals.twoD.commonService.session.style['polygonColors'].splice(i, 1, that.visuals.twoD.commonService.temp.style.polygonColorMap(value));
            that.visuals.twoD.commonService.session.style['polygonAlphas'].splice(i, 1, that.visuals.twoD.commonService.temp.style.polygonAlphaMap(value));
          let colorinput = $('<input type="color" value="' + that.visuals.twoD.commonService.temp.style.polygonColorMap(value) + '">')
            .on("change", function(){
                that.visuals.twoD.commonService.session.style['polygonColors'].splice(i, 1, $(this).val() as string);
                that.visuals.twoD.commonService.temp.style.polygonColorMap = d3
                .scaleOrdinal(that.visuals.twoD.commonService.session.style['polygonColors'])
                .domain(values);
                console.log('render poly color inside');
                that.render();
            });
          let alphainput = $("<a>⇳</a>").on("click", e => {
            $("#color-transparency-wrapper").css({
              top: e.clientY + 129,
              left: e.clientX,
              display: "block"
            });
            $("#color-transparency")
              .val(that.visuals.twoD.commonService.session.style['polygonAlphas'][i])
              .one("change", function() {
                that.visuals.twoD.commonService.session.style['polygonAlphas'].splice(i, 1, parseFloat($(this).val() as string));
                that.visuals.twoD.commonService.temp.style.polygonAlphaMap = d3
                  .scaleOrdinal(that.visuals.twoD.commonService.session.style['polygonAlphas'])
                  .domain(values);
                $("#color-transparency-wrapper").fadeOut();
                console.log('render poly color trans');

                that.render();
              });
          });
          let cell = $("<td></td>")
            .append(colorinput)
            .append(alphainput);
  
          let row = $(
            "<tr>" +
              "<td data-value='" + value + "'>" +
                (that.visuals.twoD.commonService.session.style['polygonValueNames'][value] ? that.visuals.twoD.commonService.session.style['polygonValueNames'][value] : that.visuals.twoD.commonService.titleize("" + value)) +
              "</td>" +
              (that.widgets["polygon-color-table-counts"] ? "<td>" + aggregates[value] + "</td>" : "") +
              (that.widgets["polygon-color-table-frequencies"] ? "<td>" + (aggregates[value] / total).toLocaleString() + "</td>" : "") +
            "</tr>"
          ).append(cell);
          polygonColorTable.append(row);
        });
        
        this.visuals.twoD.commonService.temp.style.polygonColorMap = d3
          .scaleOrdinal(this.visuals.twoD.commonService.session.style['polygonColors'])
          .domain(values);
          this.visuals.twoD.commonService.temp.style.polygonAlphaMap = d3
          .scaleOrdinal(this.visuals.twoD.commonService.session.style['polygonAlphas'])
          .domain(values);
  
        polygonColorTable
          .find("td")
          .on("dblclick", function() {
            // $(this).attr("contenteditable", true).focus();
          })
          .on("focusout", function() {
            let $this = $(this);
            // $this.attr("contenteditable", false);
            that.visuals.twoD.commonService.session.style['polygonValueNames'][$this.data("value")] = $this.text();
          });
          
        polygonColorTable
          .find(".p-1")
          .on("focusout", function() {
            that.visuals.twoD.commonService.session.style['overwrite']['polygonColorHeaderVariable'] = that.widgets["polygons-foci"];
            that.visuals.twoD.commonService.session.style['overwrite']['polygonColorHeaderTitle'] = $($(this).contents()[0]).text();
          });

          let isAscending = true;  // add this line before the click event handler


        // The sorting functionality is added here
        $('#polygon-color-table').on('click', 'th', function () {
            let table = $(this).parents('table').eq(0);
            let rows = table.find('tr:gt(0)').toArray().sort(comparer($(this).index()));
            isAscending = !isAscending;  // replace 'this.asc' with 'isAscending'
            if (!isAscending){rows = rows.reverse();}
            for (let i = 0; i < rows.length; i++) { table.append(rows[i]); }
        });

        function comparer(index) {
            return function(a, b) {
                let valA = getCellValue(a, index), valB = getCellValue(b, index);
                console.log(`Comparing: ${valA} and ${valB}`);  // New line
                return !isNaN(Number(valA)) && !isNaN(Number(valB)) ? Number(valA) - Number(valB) : valA.toString().localeCompare(valB);
            }
        }

        function getCellValue(row, index) {
            return $(row).children('td').eq(index).text();
        }
  
        // this.sortable("#polygon-color-table", { items: "tr" });
        
        if (!this.isLoading) {
            console.log('render update poly color');
            this.isLoading = true;
            this.visuals.twoD.render();
            setTimeout(() => {
                this.isLoading = false;
              }, 2000);
        }
      }

    /**
     * This function is called when polygon-show widget is updated from the template.
     * That widget controls whether polygons are shown or not
     * 
     * XXXXX I think this function wasn't updated with the move to Angular; most of the code 
     * seems redundant/unnecessary. I think only line needed is this.render(). XXXXX
     */
    polygonsToggle(e) {
        
        this.widgets['polygons-show'] = e;

        if(e) {
            if(this.widgets['polygons-color-show'] == true){
                $('#polygons-color-show').click();
              } else {
                $('#polygons-color-hide').click();
              }
              if(this.widgets['polygons-label-show'] == true){
                $('#polygons-label-show').click();
              } else {
                $('#polygons-label-hide').click();
              }
        } else {
            $(".polygons-settings-row").slideUp();
            $('.polygons-label-row').slideUp();
            $("#polygon-color-table-row").slideUp();
            $("#polygon-color-value-row").slideUp();
            $("#polygon-color-table").empty();

            this.visuals.twoD.PolygonColorTableWrapperDialogSettings.setVisibility(false);
        }

        if (!this.isLoading) {
            console.log('render poly toggle');
            this.isLoading = true;
            this.render();
            setTimeout(() => {
                this.isLoading = false;
              }, 1000);
        }
    }

    /**
     * This function is called when polygon-color-show widget is updated from the template.
     * This widget controls whether polygon should be colored the same or different.
     * 
     * XXXXX I think this function wasn't updated with the move to Angular; most of the code 
     * seems redundant/unnecessary. Evaluate whether function can be reduce/eliminated. XXXXX
     */
    polygonColorsToggle(e) {
        if (e) {
            this.widgets['polygons-color-show'] = true;
            $("#polygon-color-value-row").slideUp();
            $("#polygon-color-table-row").slideDown();
            this.visuals.twoD.PolygonColorTableWrapperDialogSettings.setVisibility(true);
            this.visuals.twoD.updatePolygonColors();

            setTimeout(() => {
                this.visuals.twoD.updatePolygonColors();
            }, 200);

        }
        else {
            this.widgets['polygons-color-show'] = false;
            $("#polygon-color-value-row").slideDown();
            $("#polygon-color-table-row").slideUp();
            $("#polygon-color-table").empty();
            this.visuals.twoD.PolygonColorTableWrapperDialogSettings.setVisibility(false);

        }

        if (!this.isLoading) {
            console.log('render poly color toggle');
            this.isLoading = true;
            this.visuals.twoD.render();
            setTimeout(() => {
                this.isLoading = false;
              }, 1000);
        }
    }

    /**
     * This function is called when polygon-color widget is updated from the template. 
     * It is only available when polygon-color-show is false/hide
     * This widget control polygon color when they are all colored the same.
     * 
     * XXXXX I think this function wasn't updated with the move to Angular. 
     * Evaluate whether function can be reduce/eliminated. XXXXX
     */
    onPolygonColorChanged(e) {
        this.widgets["polygon-color"] = e;
        console.log('render poly color changed');
        this.visuals.twoD.render();
    }

    /**
     * This function is called when polygon-color-table-visible widget is updated from the template. 
     * It is only available when polygon-color-show is true/show
     * This widget controls whether the polygon color table is visible.
     * 
     * XXXXX I think this function wasn't updated with the move to Angular. 
     * Evaluate whether function can be reduce/eliminated. XXXXX
     */
    polygonColorsTableToggle(e) {

        if (e) {
            this.visuals.twoD.onPolygonColorTableChange('Show')
        }
        else {
            this.visuals.twoD.onPolygonColorTableChange('Hide')
        }

        console.log('render poly color table toggle');
        this.visuals.twoD.render();
    }

    /**
     * Adds polygon labels an sets their size and orientation
     */
    redrawPolygonLabels() {
        let nodes = d3.select('#network g.clustersLabels').selectAll('text');
        let size = this.widgets['polygons-label-size'],
          orientation = this.widgets['polygons-label-orientation'];

        nodes
          .style('font-size', size + 'px');
        switch (orientation) {
          case 'Left':
            nodes
              .attr('text-anchor', 'end')
              .attr('dx', -8)
              .attr('dy', (size - 4) / 2);
            break;
          case 'Top':
            nodes
              .attr('text-anchor', 'middle')
              .attr('dx', 0)
              .attr('dy', 4 - size);
            break;
          case 'Bottom':
            nodes
              .attr('text-anchor', 'middle')
              .attr('dx', 0)
              .attr('dy', size + 4);
            break;
          case 'Right':
            nodes
              .attr('text-anchor', 'start')
              .attr('dx', 8)
              .attr('dy', (size - 4) / 2);		  
            break;
          default: // 'Middle':
            nodes
              .attr('text-anchor', 'middle')
              .attr('dx', 0)
              .attr('dy', (size - 4) / 2);     
        }
      }

    private polygonNodeSelected = null;

    /**
     * Executed when a polygon drag is start. All nodes within that polygon have variable selected set to true; other nodes have variable selected
     * set to false. node-selected event is triggered and dragstarted is called
     */
    polygonDragStarted(n) {
        this.visuals.twoD.commonService.session.data.nodes.forEach(sessionNode => {

            let tempAry = n.values.filter(node => {
                return node._id == sessionNode._id;
            });

            if (tempAry.length > 0) {
                if(!this.polygonNodeSelected) {
                    this.polygonNodeSelected = sessionNode;
                }
                sessionNode.selected = true;
            } else {
                sessionNode.selected = false
            }

      });

      $(document).trigger('node-selected');

      if(this.polygonNodeSelected) {
        this.dragstarted(this.polygonNodeSelected);
      }
    }

    /**
     * Executed when a polygon is dragged. The dragged function is called and appropriated nodes previously had selected set to true
     */
    polygonDragged(n) {
      if(this.polygonNodeSelected) {
        this.dragged(this.polygonNodeSelected);
      }

    }

    /**
     * Calls the dragend function for the nodes. also polygonNodeSelected variable is set to null, and all nodes have selected set to false
     */
    polygonDragEnded(n) {
      if(this.polygonNodeSelected) {
        this.dragended(this.polygonNodeSelected);
      }

      this.polygonNodeSelected = null;

      this.visuals.twoD.commonService.session.data.nodes.forEach(sessionNode => {
        sessionNode.selected = false
      });

      $(document).trigger('node-selected');

    }

    /**
     * Gets a list of all visible links objects; Similar to getLlinks(), and commonService.getVisibleLinks()
     * 
     * Each link object has a single origin, so any links that have more than one origin are stored as separed link objects
     * 
     * Each link's source and target are node object
     * @returns a array of link objects; each link's source and target are node object
     */
    getVLinks() {
        let vlinks = this.visuals.twoD.commonService.getVisibleLinks(true);
        let output = [];
        let n = vlinks.length;
        let nodes = this.visuals.twoD.commonService.session.network.nodes;
        for (let i = 0; i < n; i++) {
            if (vlinks[i].origin) {
                if (typeof vlinks[i].origin === 'object') {
                    if (vlinks[i].origin.length > 0) {
                      // 0 = current, j = index, l = array
                      vlinks[i].origin.forEach((o, j, l) => {
                          const holder = Object.assign({}, vlinks[i], {
                              origin: o,
                              oNum: j,
                              origins: l.length,
                              source: nodes.find(d => d._id === vlinks[i].source || d.id === vlinks[i].source),
                              target: nodes.find(d => d._id === vlinks[i].target || d.id === vlinks[i].target)
                          });
                          output.push(holder);
                      });
                  } else {
                    const holder = Object.assign({}, vlinks[i], {
                        oNum: 0,
                        origins: 1,
                        source: nodes.find(d => d._id === vlinks[i].source || d.id === vlinks[i].source),
                        target: nodes.find(d => d._id === vlinks[i].target || d.id === vlinks[i].target)
                    });
                      output.push(holder);
                  }
                } else {
                    const holder = Object.assign({}, vlinks[i], {
                        oNum: 0,
                        origins: 1,
                        source: nodes.find(d => d._id === vlinks[i].source || d.id === vlinks[i].source),
                        target: nodes.find(d => d._id === vlinks[i].target || d.id === vlinks[i].target)
                    });
                      //console.log(holder);
                      output.push(holder);
                }
            } else {
                const holder = Object.assign({}, vlinks[i], {
                    origin: 'Unknown',
                    oNum: 0,
                    origins: 1,
                    source: nodes.find(d => d._id === vlinks[i].source || d.id === vlinks[i].source),
                    target: nodes.find(d => d._id === vlinks[i].target || d.id === vlinks[i].target)
                });
                    output.push(holder);
            }
        }

        output =  output.filter(x=>x.source != undefined && x.target != undefined);
        return output;
    };

    /**
     * Gets a list of all visible links objects; Similar to getVlinks(), and commonService.getVisibleLinks()
     * 
     * A link that has multiple origins is stored as a single object
     * 
     * Each link's source and target are node object
     * @returns a array of link objects; each link's source and target are node object
     */
    getLLinks() {
        let vlinks = this.visuals.twoD.commonService.getVisibleLinks(true);
        let n = vlinks.length;
        for (let i = 0; i < n; i++) {
            vlinks[i].source = this.visuals.twoD.commonService.session.network.nodes.find(d => d._id == vlinks[i].source);
            vlinks[i].target = this.visuals.twoD.commonService.session.network.nodes.find(d => d._id == vlinks[i].target);
        }
        return vlinks;
    };

    /**
     * Used to calculate the angle between two nodes. It is used when setting link label
     * @param source source node
     * @param target target node
     */
    calcAngle(source, target) {
        return Math.atan((source.y - target.y) / (source.x - target.x)) * this.visuals.twoD.radToDeg;
    };

    /**
     * When a node (or multiple nodes) drag is started, update value of this.multidrag and this.selected and set the fx and fy values for each node selected
     * @param n node/nodes
     */
    dragstarted(n) {
        if (!d3.event.active) this.visuals.twoD.force.alphaTarget(0.3).restart();
        function setNode(d) {
            d.fx = d.x;
            d.fy = d.y;
        }
        this.visuals.twoD.multidrag = n.selected;
        this.visuals.twoD.selected = this.visuals.twoD.svg.select('g.nodes')
            .selectAll('g')
            .data(this.visuals.twoD.commonService.session.network.nodes)
            .filter(d => d.selected);
        if (this.visuals.twoD.multidrag) {
            this.visuals.twoD.selected.each(setNode);
        } else {
            setNode(n);
        }
    };

    /**
     * When a node (or multiple nodes) is dragged, update value fx and fy for each node selected
     * @param n node/nodes
     */
    dragged(n) {
        function updateNode(d) {
            d.fx += d3.event.dx;
            d.fy += d3.event.dy;
        }
        if (this.visuals.twoD.multidrag) {
            this.visuals.twoD.selected.each(updateNode);
        } else {
            updateNode(n);
        }
    };

    /**
     * When a node (or multiple nodes) is ended, update value fx and fy to null (unless node is pinned) for each node selected
     * @param n node/nodes
     */
    dragended(n) {
        if (!d3.event.active) this.visuals.twoD.force.alphaTarget(0);
        let that = this;
        function unsetNode(d) {
            if (!d.fixed) {
                d.fx = null;
                d.fy = null;
            } else {
                // save node location back to temp network for pinned network
                if(that.widgets["timeline-date-field"] != 'None') {
                  let node = that.visuals.twoD.commonService.session.network.timelineNodes.find(d2 => d2._id == d._id);
                  if(node) {
                    node.x = d.x;
                    node.y = d.y;
                    node.fx = d.fx;
                    node.fy = d.fy;
                  }
                }
              }
        }
        if (this.visuals.twoD.multidrag) {
            this.visuals.twoD.selected.each(unsetNode);
        } else {
            unsetNode(n);
        }
    };

    /**
     * Click event handler, updates the node.selected value
     * @param n 
     */
    clickHandler(n) {
        //console.log('event: ',d3.event)
        if (d3.event && d3.event.key === "Shift") {
            this.visuals.twoD.commonService.session.data.nodes.find(node => node._id == n._id).selected = !n.selected;
        } else {
            this.visuals.twoD.commonService.session.data.nodes.forEach(node => {
                if (node._id == n._id) {
                    node.selected = !node.selected;
                } else {
                    node.selected = false;
                }
            });
        }
 
        // this.visuals.twoD.render(false);

        $(document).trigger('node-selected');
    };

    /**
     * Used from Context Menu and copy node's ID to the user's clipboard
     */
    copyID() {
        let id = $('#copyID').attr('data-clipboard-text')
        this.clipboard.copy(id);
        this.hideContextMenu();
    }

    /**
     * Used from Context Menu and copy node's sequence to the user's clipboard
     */
    copySeq() {
        let seq = $('#copySeq').attr('data-clipboard-text')
        this.clipboard.copy(seq);
        this.hideContextMenu()
    }

    /**
     * Upon right clicking a node, d, the context menu will appear, which allows the user to option to pin node, copy id, copy sequence, or view attributes
     * @param d the node right clicked
     */
    showContextMenu(d) {
        d3.event.preventDefault();
        this.visuals.twoD.hideTooltip();
        $('#copyID').attr('data-clipboard-text', d._id);
        if (d.seq === null || d.seq === undefined || d.seq === "") {
            $('#copySeq').prop('disabled', true);
        } else {
            $('#copySeq').prop('disabled', false).attr('data-clipboard-text', d.seq);
        }

        d3.select('#viewAttributes').on('click', () => {

            this.visuals.twoD.ContextSelectedNodeAttributes = [];

            this.visuals.twoD.hideContextMenu();

            this.visuals.twoD.ShowNetworkAttributes = true;
            this.visuals.twoD.cdref.detectChanges();

            let nd = this.visuals.twoD.commonService.session.data.nodes.find(nd => nd._id == d._id);
            for (let attribute in nd) {
                if (attribute[0] == '_' && attribute !== '_id' || attribute == 'data') continue; // DC: where is data being added as an attribute to each node should data be removed here
                this.visuals.twoD.ContextSelectedNodeAttributes.push({attribute: this.visuals.twoD.commonService.titleize(attribute), value: d[attribute]});
            }

            this.visuals.twoD.ContextSelectedNodeAttributes = this.visuals.twoD.ContextSelectedNodeAttributes
                .filter(x=>x.attribute !== "Seq" && x.value !== undefined && x.value !== null && x.value !== "" )
                .concat(this.visuals.twoD.ContextSelectedNodeAttributes.filter(x=>x.attribute !== "Seq" && (x.value === undefined || x.value === null || x.value === "" )))
                .concat(this.visuals.twoD.ContextSelectedNodeAttributes.filter(x=>x.attribute === "Seq"));

        }).node().focus();
        if (d.fixed) {
            $('#pinNode').text('Unpin Node').on('click', () => {

                d.fx = null;
                d.fy = null;
                d.fixed = false;
                this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
                this.visuals.twoD.hideContextMenu();
            });

        } else {
            $('#pinNode').text('Pin Node').on('click', () => {

                d.fx = d.x;
                d.fy = d.y;
                d.fixed = true;
                this.visuals.twoD.hideContextMenu();
            });
        }

        let [X, Y] = this.getRelativeMousePosition();
        $('#context-menu').css({
            'z-index': 1000,
            'display': 'block',
            'left': (X-200) + 'px',
            'top': (Y+30) + 'px',
        }).animate({ 'opacity': 1 }, 80);
    };

    /**
     * Hides the Context Menu
     */
    hideContextMenu() {
        $('#context-menu').animate({ 'opacity': 0 }, 80, function() {
            $(this).css('z-index', -1);
        });
    };
    
    /**
     * This function capitalizes the first letter of each word in a string.
     * @param str input string
     * @returns input string with first letter capitalized
     */
    titleize(str: string) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Generate a tabular HTML string from the data array
     * @param data [ [Col1, ...], ...] - An Array of arrays where arrays within outer array represent different rows and
     *  values within inner array represent the cells within that row
     * @returns an HTML string with a table representation of the data
     */
    tabulate(data: any[]) {

        let tableHtml = `
            <style>
            #tooltip-table {
                border-spacing: 0;
                width: 100%;
                border: 1px solid #ddd;
                z-index: 1000;
            }
            
            #tooltip-table td, #tooltip-table th {
                text-align: left;
                padding: 16px;
                border: 1px solid #ddd;
            }
            
            #tooltip-table tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            
            #tooltip-table tr:nth-child(odd) {
                background-color: #fff;
            }
            </style>
            <table id="tooltip-table"><tbody>`;

        for (let row of data) {
            tableHtml += '<tr>';
            for (let cell of row) {
                tableHtml += '<td>' + cell + '</td>';
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';

        return tableHtml;
    }

    /**
     * Highlights the node and all of its neighbor (shares a link with) and the links that the node is 
     * a source or target
     * @param node node that is mouseover by user
     */
    highlightNeighbors(node) {
        let links = this.visuals.twoD.getVLinks();
        let lindices = [], neighbors = [node._id];

        let n = links.length;
        for (let i = 0; i < n; i++) {
            let l = links[i];
            if (l.source._id !== node._id && l.target._id !== node._id) {
                lindices.push(l.index);
            } else {
                if (l.source._id == node._id) {
                    neighbors.push(l.target._id);
                } else {
                    neighbors.push(l.source._id);
                }
            }
        }
        // highlights current node and its neighbors
        this.visuals.twoD.svg
            .select('g.nodes')
            .selectAll('g')
            .selectAll('path')
            .attr('opacity', d => this.visuals.twoD.commonService.includes(neighbors, d._id) ? 1 : .1);
        // hightlights all of current node's links
        this.visuals.twoD.svg
            .select('g.links')
            .selectAll('line')
            .data(links)
            .attr('opacity', l => this.visuals.twoD.commonService.includes(lindices, l.index) ? .1 : 1);
    };

    /**
     * Gets data from current node needed for tooltip and displays it in the tooltip also hightlights neighbors if that option is selected
     * @param d a node
     */
    showNodeTooltip(d) {
        if (this.widgets['node-highlight']) 
            this.visuals.twoD.highlightNeighbors(d);
    
        // If no tooltip variable is selected, we shouldn't show a tooltip
        if (this.widgets['node-tooltip-variable'].length > 0 && this.widgets['node-tooltip-variable'][0] == 'None') 
            return;

        this.visuals.twoD.SelectedNodeTooltipVariable = this.widgets['node-tooltip-variable'];
    
        // Tooltip variables can be a single string or an array
        let tooltipVariables = this.visuals.twoD.SelectedNodeTooltipVariable;
        if (!Array.isArray(tooltipVariables)) {
            tooltipVariables = [tooltipVariables];
        }
    
        // Generate the HTML for the tooltip
        let tooltipHtml = '';
        if (tooltipVariables.length > 1) {
            tooltipHtml = this.tabulate(tooltipVariables.map(variable => [this.titleize(variable), d[variable]]));
        } else {
            tooltipHtml = d[tooltipVariables[0]];
        }

        let [X, Y] = this.getRelativeMousePosition();    
        d3.select('#tooltip')
            .html(tooltipHtml)
            .style('position', 'absolute')
            .style('left', (X + 10) + 'px')
            .style('top', (Y - 10) + 'px')
            .style('z-index', 1000)
            .transition().duration(100)
            .style('opacity', 1);
    }

    /**
     * Gets data from current link needed for tooltip and displays it in the tooltip
     * @param d link
     */
    showLinkTooltip(d) {
        let v: any = this.visuals.twoD.SelectedLinkTooltipVariable;

        if (v == 'None') return;


        // Tooltip variables can be a single string or an array
        let tooltipVariables = this.visuals.twoD.SelectedLinkTooltipVariable;
        if (!Array.isArray(tooltipVariables)) {
            tooltipVariables = [tooltipVariables];
            this.visuals.twoD.SelectedLinkTooltipVariable = tooltipVariables;  // Update SelectedLinkTooltipVariable to be an array
        }

        // If no tooltip variable is selected, we shouldn't show a tooltip
        if (tooltipVariables.length > 0 && tooltipVariables[0] == 'None') 
            return;

        /**
         * @param data link
         * @param varName name of variable
         * @returns the value of the link for the variable
         */
        let getData = (data, varName) => {
            if (varName == 'source_id') {
                return data['source']._id
            } else if (varName == 'source_index') {
                return data['source'].index
            } else if (varName == 'target_id') {
                return data['target']._id
            } else if (varName == 'target_index') {
                return data['target'].index
            } else {
                return data[varName];
            }
        }

        // Generate the HTML for the tooltip
        let tooltipHtml = '';
        if (tooltipVariables.length > 1) {
            tooltipHtml = this.tabulate(tooltipVariables.map(variable => [this.titleize(variable), getData(d,variable)]));
        } else {
            tooltipHtml = getData(d, tooltipVariables[0])
        }

        let [X, Y] = this.getRelativeMousePosition();
        d3.select('#tooltip')
            .html(tooltipHtml)
            .style('position', 'absolute')
            .style('left', (X+ 10) + 'px')
            .style('top', (Y - 10) + 'px')
            .style('z-index', 1000)
            .transition().duration(100)
            .style('opacity', 1);
    };

    /**
     * Hides the Tooltip
     */
    hideTooltip() {
        if (this.widgets['node-highlight']) {
            this.visuals.twoD.svg
                .select('g.nodes')
                .selectAll('g')
                .selectAll('path')
                .attr('opacity', 1);
            let linkOpacity = 1 - this.widgets['link-opacity'];
            this.visuals.twoD.svg
                .select('g.links')
                .selectAll('line')
                .attr('opacity', linkOpacity);
        }
        let tooltip = d3.select('#tooltip');
        tooltip
            .transition().duration(100)
            .style('opacity', 0)
            .on('end', () => tooltip.style('z-index', -1));
    };


    /**
     * @returns {boolean} if a is a number
     */
    isNumber(a): boolean {
        return typeof a == "number";
    };

    /**
     * This function updates the nodes based on node-symbol, node-symbol-variable, node-radius, node-radius-variable, node-radius-min, node-radius-max.
     * It does not add new nodes to the DOM.
     */
    redrawNodes() {


        //Things to track in the function:
        //* Shapes:
        let type = d3[this.widgets['node-symbol']];
        let symbolVariable = this.widgets['node-symbol-variable'];
       
        // Custom Shape Selected
        if (type === undefined) {
            type = this.customShapes.shapes[this.widgets['node-symbol']];
        }

        //* Sizes:
        let defaultSize = this.widgets['node-radius'];
        let size = defaultSize, med = defaultSize, oldrng, min, max;
        let sizeVariable = this.widgets['node-radius-variable'];
        let scale;
        let nodes;
        if (sizeVariable !== 'None') {
            if (this.widgets["timeline-date-field"] == 'None') nodes = this.visuals.twoD.commonService.session.network.nodes;
            else nodes = this.visuals.twoD.commonService.session.network.timelineNodes;
            let n = this.visuals.twoD.commonService.session.network.nodes.length;
            min = Number.MAX_VALUE;
            max = Number.MIN_VALUE;
            for (let i = 0; i < n; i++) {
                let size = this.visuals.twoD.commonService.session.network.nodes[i][sizeVariable];
                if (typeof size == 'undefined') continue;
                if (size < min) min = size;
                if (size > max) max = size;
            }
            oldrng = max - min;
            med = oldrng / 2;

            let maxWidth = this.widgets['node-radius-max'];
            let minWidth = this.widgets['node-radius-min'];
            scale = d3.scaleLinear()
            .domain([min, max])
            .range([minWidth, maxWidth]);
            }
        
        nodes = this.visuals.twoD.svg.select('g.nodes').selectAll('g').data(this.visuals.twoD.commonService.session.network.nodes);

        // TODO: Hides table row by default if no symbol variable - clean up
        if(symbolVariable === 'None') {
            $('#node-symbol-table-row').slideUp();
        }

        // console.log('nodes: ', nodes);

        let that = this;

        nodes.selectAll('path').each(function (d) {

            if (symbolVariable !== 'None') {

                type = d3[that.visuals.twoD.commonService.temp.style.nodeSymbolMap(d[symbolVariable])];

                if (type === undefined) {
                    type = that.customShapes.shapes[that.visuals.twoD.commonService.temp.style.nodeSymbolMap(d[symbolVariable])];
                }
    
            } 
            if (sizeVariable !== 'None') {
              size = d[sizeVariable];
              if (!that.isNumber(size)) size = med;
              size = scale(size);
            }

            d3.select(this).attr('d', d3.symbol().size(size).type(type));    
            
          });
    };

    /**
     * redraws/updates node borders based on node-border-width
     */
    private redrawNodeBorder(){
        let nodes = this.visuals.twoD.svg.select('g.nodes').selectAll('g').data(this.visuals.twoD.commonService.session.network.nodes);
        nodes
          .selectAll('path')
          .style('stroke', 'black')
          .style('stroke-width', this.widgets['node-border-width']);
      }

    /**
     * uses values from node-label-variable, node-label-size, and node-label-orietation to add/remove labels from the the nodes
     */
    redrawLabels() {

        let nodes = this.visuals.twoD.svg.select('g.nodes').selectAll('g').data(this.visuals.twoD.commonService.session.network.nodes).select('text'),
            labelVar = this.widgets['node-label-variable'];
        if (labelVar == 'None') {
            nodes.text('');
        } else {
            let size = this.widgets['node-label-size'],
                orientation = this.widgets['node-label-orientation'];
            nodes
                .text(n => n[labelVar])
                .style('font-size', size + 'px');
            switch (orientation) {
                case 'Left':
                    nodes
                        .attr('text-anchor', 'end')
                        .attr('dx', -8)
                        .attr('dy', (size - 4) / 2);
                    break;
                case 'Top':
                    nodes
                        .attr('text-anchor', 'middle')
                        .attr('dx', 0)
                        .attr('dy', 4 - size);
                    break;
                case 'Bottom':
                    nodes
                        .attr('text-anchor', 'middle')
                        .attr('dx', 0)
                        .attr('dy', size + 4);
                    break;
                case 'Middle':
                    nodes
                        .attr('text-anchor', 'middle')
                        .attr('dx', 0)
                        .attr('dy', (size - 4) / 2);
                    break;
                default: //'right'
                    nodes
                        .attr('text-anchor', 'start')
                        .attr('dx', 8)
                        .attr('dy', (size - 4) / 2);
            }
        }
    };

    //Polygon Events

    /**
     * XXXXX Not sure functionality of this function; it is only called during loadSettings, not in template;
     * also polygon-label-row is not found in the template; need to reevaluate if function is needed XXXXX
     */
    onPolygonLabelVariableChange(e) {

        this.widgets['polygons-label-variable'] = e;
        if (e == 'None') {
            $('.polygon-label-row').slideUp();
        } else {
            $('.polygon-label-row').css('display', 'flex');
        }
        this.redrawPolygonLabels();
        
    }

    /**
     * This is called when the variable used to grouped by/created polygons is changed
     * 
     * XXXXX May be worth revisiting when other polygon functions are updated. Some lines are probably not necessary XXXXX 
     */
    centerPolygons(e) {

        this.widgets['polygons-foci'] = e;
        console.log('render center poly');
        this.visuals.twoD.render();
        if(this.widgets['polygons-color-show'] == true) {
          $("#polygon-color-table").empty();
          this.visuals.twoD.updatePolygonColors();
        }
        
        if (e == 'None') {
            $('#color-polygons').slideDown();
            $('#polygon-color-value-row').slideDown();
          } else {
            $('#color-polygons').css('display', 'flex');
            $('#polygon-color-value-row').slideUp();
          }

    }

    /**
     * Updates polygon-label-size widget and then redraws polygon labels 
     */
    setPolygonLabelSize(size) {
        this.widgets['polygons-label-size'] = parseFloat(size);
        this.visuals.twoD.redrawPolygonLabels();
    }

    /**
     * Calls setPolygonLabelSize to update polygon-label-size widget and then redraws polygon labels
     */
    onPolygonLabelSizeChange(e) {
        this.setPolygonLabelSize(e);
    }

    /**
     * Updates polygons-label-orientation widget and then redraws polygon labels
     */
    onPolygonLabelOrientationChange(e) {
        this.widgets['polygons-label-orientation'] = e;
        this.visuals.twoD.redrawPolygonLabels();
    }

    /**
     * Updates polygons-gather-force and then renders the network again
     */
    onPolygonGatherChange(e) {
        let v = parseFloat(e);
        this.widgets['polygons-gather-force'] = v;
        console.log('render poly gather');
        this.visuals.twoD.render();
    }

    /**
     * Updates polygons-label-show widget and the renders the network again
     */
    onPolygonLabelShowChange(e) {
        if (e) {
            this.widgets['polygons-label-show'] = true;
            $('.polygons-label-row').slideDown();
            console.log('render poly label show');
            this.visuals.twoD.render();
        }
        else {
            this.widgets['polygons-label-show'] = false;
            $('.polygons-label-row').slideUp();
            console.log('render poly label hide');
            this.visuals.twoD.render();
        }
    }

    /**
     * XXXXX Function not used/executed XXXXX
     */
    onPolygonShowChange(e) {
        if (e == "Show") {
            this.widgets['polygons-label-show'] = true;
            $('.polygons-label-row').slideDown();
            console.log('render poly show change');
            this.visuals.twoD.render();
             //If hidden by default, unhide to perform slide up and down
            //  if(!this.ShowGlobalSettingsNodeColorTable){
            //     this.ShowGlobalSettingsNodeColorTable = true;
            // } else {
            //     $('#node-color-table-row').slideDown();
            // }
        }
        else {
            this.widgets['polygons-label-show'] = false;
            $('#node-color-value-row').slideDown();
            $('#node-color-table-row').slideUp();
            console.log('render poly hide change');
            this.visuals.twoD.render();
        }
    }


    /**
     * XXXXX reevaluate if need to be combined with polygonColorsTableToggle; when called from polygonColorsTableToggle e is 'Show'/'Hide' when called
     * from template e is true/false XXXXX
     */
    onPolygonColorTableChange(e) {
        this.SelectedNetworkTableTypeVariable = e;
        this.widgets["polygon-color-table-visible"] = e;
        if (this.SelectedNetworkTableTypeVariable == 'Show') {
            this.PolygonColorTableWrapperDialogSettings.setVisibility(true);
        }
        else {
            // this.PolygonColorTableWrapperDialogSettings.setVisibility(false);
        }
    }


    /*/
        Node Events
    /*/

    /**
     * updates the value of the appropriate widget, add/removes rows from dialog menu, and calls redrawLabels to update labels on svg/view
     * @param e the name of variable to change labels to
     */
    onNodeLabelVaribleChange(e) {

        this.widgets['node-label-variable'] = e;
        if (e == 'None') {
            $('.node-label-row').slideUp();
        } else {
            $('.node-label-row').css('display', 'flex');
        }
        this.redrawLabels();
    }

    /**
     * Calls setNodeLabelSize to update label-size and redraw labels
     */
    onNodeLabelSizeChange(e) {
        this.setNodeLabelSize(e.target.value);
    }

    /**
     * Updates node-label-size and then redraws labels
     */
    setNodeLabelSize(size) {
        this.widgets['node-label-size'] = parseFloat(size);
        this.visuals.twoD.redrawLabels();
    }

    /**
     * Updates node-label-orientation and then redraws labels
     * @param e orientation such as Right, Left, Top, Bottom, Middle
     */
    onNodeLabelOrientationChange(e) {
        this.widgets['node-label-orientation'] = e;
        this.visuals.twoD.redrawLabels();
    }

    /**
     * updates node-tooltip-variable
     */
    onNodeTooltipVariableChange(e) {

        let selectedValue = e;

        if (!Array.isArray(selectedValue)) {
            selectedValue = [selectedValue];
        }

        this.widgets['node-tooltip-variable'] = selectedValue;
        // removed redrawLabels because it doesn't have anything to do with tooltip
        //this.visuals.twoD.redrawLabels();
    }

    onNodeSymbolVariableChange(e, setVisibility = true) {

            this.widgets['node-symbol-variable'] = this.SelectedNodeSymbolVariable;


            if(setVisibility){
                this.visuals.twoD.NodeSymbolTableWrapperDialogSettings.setVisibility(true);
                this.visuals.twoD.SelectedNetworkTableTypeVariable = "Show";

                if (this.SelectedNodeSymbolVariable !== 'None') {

                    $('#node-symbol-row').slideUp();
                    
                    //If hidden by default, unhide to perform slide up and down
                    if(!this.ShowNodeSymbolTable){
                        this.ShowNodeSymbolTable = true;
                    } else {
                        $('#node-symbol-table-row').slideDown();
                    }

                    if (!this.ShowNodeSymbolWrapper) {
                        this.ShowNodeSymbolWrapper = true;
                    }
                // No shape by variable selected
                // show shape, hide table 
                } else {

                    $('#node-symbol-row').slideDown();
                    $('#node-symbol-table-row').slideUp();
                    if (this.ShowNodeSymbolWrapper) {
                        this.ShowNodeSymbolWrapper = false;
                    }
                    this.onNodeSymbolTableChange('Hide');

                }
    
            }


            this.visuals.twoD.cdref.detectChanges();

            this.generateNodeSymbolSelectionTable("#node-symbol-table", e);
            
            this.visuals.twoD.redrawNodes();

    }

    generateNodeSymbolSelectionTable(tableId: string, variable: string, isEditable: boolean = true) {
        this.visuals.microbeTrace.clearTable(tableId);

        let symbolMapping: { key: string, value: string }[] = [
            { key: 'symbolCircle', value: '&#11044; (Circle)' },
            { key: "symbolTriangle", value: '&#9650; (Up Triangle)' },
            { key: "symbolTriangleDown", value: '&#9660; (Down Triangle)' },
            { key: "symbolTriangleLeft", value: '&#9664; (Left Triangle)' },
            { key: "symbolTriangleRight", value: '&#9654; (Right Triangle)' },
            { key: "symbolDiamond", value: '&#10731; (Vertical Diamond)' },
            { key: "symbolDiamondAlt", value: '&#10731; (Horizontal Diamond)' },
            { key: "symbolSquare", value: '&#9632; (Square)' },
            { key: "symbolDiamondSquare", value: '&#9670; (Tilted Square)' },
            { key: "symbolPentagon", value: '&#11039; (Pentagon)' },
            { key: "symbolHexagon", value: '&#11042; (Hexagon)' },
            { key: "symbolHexagonAlt", value: '&#11043; (Tilted Hexagon)' },
            { key: "symbolOctagon", value: '&#11042; (Octagon)' },
            { key: "symbolOctagonAlt", value: '&#11043; (Tilted Octagon)' },
            { key: "symbolCross", value: '&#10010; (Addition Sign)' },
            { key: "symbolX", value: '&#10006; (Multiplication Sign)' },
            { key: "symbolWye", value: '&#120300; (Wye)' },
            { key: "symbolStar", value: '&#9733; (Star)' },
        ];

        let table = $(tableId)
        const disabled: string = isEditable ? '' : 'disabled';

        this.widgets['node-symbol-variable'] = variable;

        if (variable === 'None' && !isEditable) return;


        let values = [];
        let aggregates = {};
        let nodes = this.visuals.twoD.commonService.session.data.nodes;
        let n = nodes.length;
        let vnodes = 0;
        for (let i = 0; i < n; i++) {
            let d = nodes[i];
            if (!d.visible) continue;
            vnodes++;
            let dv = d[variable];
            if (values.indexOf(dv) == -1) values.push(dv);
            if (dv in aggregates) {
                aggregates[dv]++;
            } else {
                aggregates[dv] = 1;
            }
        }
        if (values.length > this.visuals.twoD.commonService.session.style.nodeSymbols.length) {
            let symbols = [];
            let m = Math.ceil(values.length / this.visuals.twoD.commonService.session.style.nodeSymbols.length);
            while (m-- > 0) {
                symbols = symbols.concat(this.visuals.twoD.commonService.session.style.nodeSymbols);
            }
            this.visuals.twoD.commonService.session.style.nodeSymbols = symbols;
        }

        table.empty().append(
            "<tr>" +
              `<th class="${isEditable ? 'table-header-row' : ''}" ${isEditable ? 'contenteditable' : ''}><div class="header-content sortable">Node ${this.commonService.titleize(variable)}<a class='sort-button' style='cursor: pointer'>⇅</a></div></th>` +
              (this.widgets['node-symbol-table-counts']
                ? `<th class="table-header-row"><div class="header-content sortable">Count<a class='sort-button' style='cursor: pointer'>⇅</a></div></th>`
                : '') +
              (this.widgets['node-symbol-table-frequencies']
                ? `<th class="table-header-row"><div class="header-content sortable">Frequency<a class='sort-button' style='cursor: pointer'>⇅</a></div></th>`
                : '') +
              '<th>Shape</th>' +
              '</tr>'
          );
        let options = $('#node-symbol2').html();

        values.sort( (a, b)  => {
            return aggregates[b] - aggregates[a];
        });
        
        this.visuals.twoD.commonService.temp.style.nodeSymbolMap = d3.scaleOrdinal(this.visuals.twoD.commonService.session.style.nodeSymbols).domain(values);
        
        values.forEach((v, i) => {

            let selector = $(`<select ${disabled}></select>`).append(options).val(this.visuals.twoD.commonService.temp.style.nodeSymbolMap(v)).on('change',  (e) => {
                this.visuals.twoD.commonService.session.style.nodeSymbols.splice(i, 1, (e.target as any).value);
                this.visuals.twoD.commonService.temp.style.nodeSymbolMap = d3.scaleOrdinal(this.visuals.twoD.commonService.session.style.nodeSymbols).domain(values);
                this.visuals.twoD.redrawNodes();
            });        
            let symbolText = symbolMapping.find(x => x.key === this.visuals.twoD.commonService.temp.style.nodeSymbolMap(v));

            let cell = $('<td></td>').append(isEditable ? selector : symbolText ? symbolText.value : '');
            let row = $(
                '<tr>' +
                `<td ${isEditable ? 'contenteditable' : ''}> ${this.visuals.twoD.commonService.titleize('' + v)} </td> ` +
                (this.widgets['node-symbol-table-counts'] ? ('<td>' + aggregates[v] + '</td>') : '') +
                (this.widgets['node-symbol-table-frequencies'] ? ('<td>' + (aggregates[v] / vnodes).toLocaleString() + '</td>') : '') +
                '</tr>'
            ).append(cell);
            table.append(row);
        });


        let isAscending = true;  // add this line before the click event handler


        // The sorting functionality is added here
        $(tableId).on('click', 'th', function () {
            let table = $(this).parents('table').eq(0);
            let rows = table.find('tr:gt(0)').toArray().sort(comparer($(this).index()));
            isAscending = !isAscending;  // replace 'this.asc' with 'isAscending'
            if (!isAscending){rows = rows.reverse();}
            for (let i = 0; i < rows.length; i++) { table.append(rows[i]); }
        });

        function comparer(index) {
            return function(a, b) {
                let valA = getCellValue(a, index), valB = getCellValue(b, index);
                console.log(`Comparing: ${valA} and ${valB}`);  // New line
                return !isNaN(Number(valA)) && !isNaN(Number(valB)) ? Number(valA) - Number(valB) : valA.toString().localeCompare(valB);
            }
        }

        function getCellValue(row, index) {
            return $(row).children('td').eq(index).text();
        }

    }

    onNodeRadiusVariableChange(e) {

        if (e == 'None') {
            $('#node-max-radius-row').slideUp();
            $('#node-min-radius-row').slideUp();
            $('#node-radius-row').slideDown();
          } else {
            $('#node-max-radius-row').css('display', 'flex');
            $('#node-min-radius-row').css('display', 'flex');
            $('#node-radius-row').slideUp();
          }

        this.widgets['node-radius-variable'] = e;
        this.visuals.twoD.redrawNodes();

    }

    /**
     * Updates node-radius-max widget and redraws nodes
     */
   onNodeRadiusMaxChange(e) {
    this.widgets['node-radius-max'] = e;
    this.visuals.twoD.redrawNodes();
   }

    /**
     * Updates node-radius-min widget and redraws nodes
     */
   onNodeRadiusMinChange(e) {
    this.widgets['node-radius-min'] = e;
    this.visuals.twoD.redrawNodes();
   }

    /**
     * Updates node-border-width widget and redraws nodes
     */
    onNodeBorderWidthChange(e) {
        this.widgets['node-border-width'] = e;
        this.visuals.twoD.redrawNodeBorder();
    }

    /**
     * Updates node-radius widget and redraws nodes
     */
    onNodeRadiusChange(e) {
        this.widgets['node-radius'] = e;
        this.visuals.twoD.redrawNodes();
    }

    /**
     * Updates node-symbol widget and redraws nodes
     */
    onNodeSymbolChange(e) {
        this.widgets['node-symbol'] = e;
        this.visuals.twoD.redrawNodes();
    }

    /**
     * Sets whether node symbol table is visible or not
     * @param e 'Show' or 'Hide'
     */
    onNodeSymbolTableChange(e) {
        this.SelectedNetworkTableTypeVariable = e;
        this.widgets["node-symbol-table-visible"] = this.SelectedNetworkTableTypeVariable;
        if (this.SelectedNetworkTableTypeVariable == "Show") {
            this.NodeSymbolTableWrapperDialogSettings.setVisibility(true);
        }
        else {
            this.NodeSymbolTableWrapperDialogSettings.setVisibility(false);
        }
    }

    /**
     * Updates link-tooltip-variable and SelectedLinkTooltipVariable to update what tooltip displays for links
     */
    onLinkTooltipVariableChange(e) {
        if (!Array.isArray(e)) {
            e = [e];
        }
        e = e.filter(item => item !== 'None')
    
        this.widgets['link-tooltip-variable'] = e;
        this.visuals.twoD.SelectedLinkTooltipVariable = this.widgets['link-tooltip-variable'];
        // not sure if redraw labels is necessary - it doesn't deal with link or tooltip
        this.visuals.twoD.redrawLabels();

//TODO: umm.... do something here?
    }

    /**
     * Updates link-label-variable widget and link labels
     */
    onLinkLabelVariableChange(e) {
        let label: any = e;
        this.widgets['link-label-variable'] = label;
        if (label == 'None') {
            this.visuals.twoD.svg.select('g.links').selectAll('text').text('');
        } else {
            this.visuals.twoD.svg.select('g.links').selectAll('text').data(this.visuals.twoD.getLLinks()).text((l) => {
                if (label == 'source_id') {
                    return l['source']['id']
                } else if (label == 'source_index') {
                    return l['source']['index']
                } else if (label == 'target_id') {
                    return l['target']['id']
                } else if(label == 'target_index') {
                    return l['target']['index']
                } else if (label != 'distance') {
                    return l[this.widgets['link-label-variable']]
                }
                const labelValue = l[this.widgets['link-label-variable']];
                if (typeof labelValue === 'number' || !isNaN(parseFloat(labelValue))) {
                    if(this.widgets['default-distance-metric'] == 'snps') {
                        return Math.round(parseFloat(labelValue));
                    } else {
                        return parseFloat(labelValue).toFixed(this.widgets['link-label-decimal-length']);
                    }                
                } else {
                        return labelValue;
                }
              });
            this.visuals.twoD.force.alpha(0.01).alphaTarget(0).restart();
        }
    }

    /**
     * Updates link-label-decimal-length widget and updates label with updated number of decimal points
     */
    onLinkDecimalVariableChange(e) {
        this.widgets['link-label-decimal-length'] = e;
        this.visuals.twoD.svg.select('g.links').selectAll('text').data(this.getLLinks()).text((l) => {
            const labelValue = l[this.widgets['link-label-variable']];
              
            if (typeof labelValue === 'number' || !isNaN(parseFloat(labelValue))) {
                return parseFloat(labelValue).toFixed(this.widgets['link-label-decimal-length']);
            } else {
                return labelValue;
            }
          }); 
    }

    /**
     * Updates link-opacity widget and the opacity for all links
     */
    onLinkOpacityChange(e) {
        this.widgets['link-opacity'] = e;
        let opacity = 1 - e;
        this.visuals.twoD.svg.select('g.links').selectAll('line').attr('opacity', opacity);
    }

    updateLinkWidthRows(e) {
        if (e == 'None') {
            setTimeout(() => {
                $('#link-reciprocalthickness-row').slideUp();
                $('#link-max-width-row').slideUp();
                $('#link-min-width-row').slideUp();
                $('#link-width-row').slideDown();
            }, 5)
        } else {
            setTimeout(() => {
                $('#link-reciprocalthickness-row').css('display', 'flex');
                $('#link-max-width-row').css('display', 'flex');
                $('#link-min-width-row').css('display', 'flex');
                $('#link-width-row').slideUp();
            }, 5)
        }
    }

    /**
     * Updates link-width-variable widget and updates link width; Also cause min, max and reciprocal link width row to appear/disappear
     */
    onLinkWidthVariableChange(e) {
        this.updateLinkWidthRows(e);
        this.widgets['link-width-variable'] = e;
        this.visuals.twoD.scaleLinkWidth();
    }

    /**
     * Updates link-width-reciprocal widget and updates link width
     * This widget controls whether to set width smallest -> largest or largest -> smallest
     */
    onLinkWidthReciprocalNonReciprocalChange(e) {
        if (e == "Reciprocal") {
            this.widgets['link-width-reciprocal'] = true;
            this.visuals.twoD.scaleLinkWidth();
        }
        else {
            this.widgets['link-width-reciprocal'] = false;
            this.visuals.twoD.scaleLinkWidth();
        }
    }

    /**
     * Updates link-width widget and link width
     */
    onLinkWidthChange(e) {
        this.widgets['link-width'] = e;
        this.visuals.twoD.scaleLinkWidth();
    }

    /**
     * Updates link-width-max widget and link width
     */
    onLinkWidthMaxChange(e) {
        this.widgets['link-width-max'] = e;
        this.visuals.twoD.scaleLinkWidth();
    }

    /**
     * Updates link-width-min widget and link width
     */
    onLinkWidthMinChange(e) {
        this.widgets['link-width-min'] = e;
        this.visuals.twoD.scaleLinkWidth();
    }

    /**
     * Updates link-length widget and link force distance
     */
    onLinkLengthChange(e) {
        this.visuals.twoD.force.force('link').distance(e);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        this.widgets['link-length'] = e;
    }

    /**
     * Updates link-directed widget. When directed, links have an arrow added; when undirected, links have no arrow
     */
    onLinkDirectedUndirectedChange(e) {
        if (e == "Show") {
            this.visuals.twoD.svg.select('g.links').selectAll('line').attr('marker-end', 'url(#end-arrow)');
            this.widgets['link-directed'] = true;
        }
        else {
            this.visuals.twoD.svg.select('g.links').selectAll('line').attr('marker-end', null);
            this.widgets['link-directed'] = false;
        }
    }

    /**
     * Updates node-highlight widget. When true and a node is mouseoved current node, all it of links, and neighbor nodes will be highlighted
     */
    onDontHighlightNeighborsHighlightNeighborsChange(e) {
        if (e == "Normal") {
            this.widgets['node-highlight'] = false;
        }
        else {
            this.widgets['node-highlight'] = true;
        }
    }

    /**
     * Adds or removes vertical and horizontal gridlines from svg image
     * @param show wheither to show or hide gridlines
     */
    drawGridlines(show: boolean): void {
        // Reset width and height in case they have changed
        this.visuals.twoD.halfWidth = ($('#network').parent().width() as number) / 2;
        this.visuals.twoD.halfHeight = ($('#network').parent().parent().parent().height() as number) / 2;
    
        if (show) {
            let range = Math.ceil(Math.max(this.visuals.twoD.halfWidth, this.visuals.twoD.halfHeight) / 50);
            let ords = Object.keys(new Array(range).fill(null)).map(parseFloat);
    
            // Horizontal lines
            let horizontalLines = d3.select('#network g.horizontal-gridlines').selectAll('line').data(ords);
    
            // Exit selection: remove extra lines
            horizontalLines.exit().remove();
    
            // Update selection: modify existing lines
            horizontalLines.attr('x2', this.visuals.twoD.halfWidth * 2);
    
            // Enter selection: add new lines
            horizontalLines.enter().append('line')
                .attr('x1', 0)
                .attr('x2', this.visuals.twoD.halfWidth * 2)
                .attr('y1', function (d) { return d * 100; })
                .attr('y2', function (d) { return d * 100; })
                .attr('stroke', 'lightgray');
    
            // Vertical lines
            let verticalLines = d3.select('#network g.vertical-gridlines').selectAll('line').data(ords);
    
            // Exit selection: remove extra lines
            verticalLines.exit().remove();
    
            // Update selection: modify existing lines
            verticalLines.attr('y2', this.visuals.twoD.halfHeight * 2);
    
            // Enter selection: add new lines
            verticalLines.enter().append('line')
                .attr('x1', function (d) { return d * 100; })
                .attr('x2', function (d) { return d * 100; })
                .attr('y1', 0)
                .attr('y2', this.visuals.twoD.halfHeight * 2)
                .attr('stroke', 'lightgray');
        } else {
            d3.select('#network g.horizontal-gridlines').html(null);
            d3.select('#network g.vertical-gridlines').html(null);
        }
    }
    
    /**
     * Take input from 2D Networks settings dialog box from template and update the widget and show/hides gridlines
     * @param e string either 'Show' or 'Hide'
     */
    onNetworkGridlinesShowHideChange(e: string): void {
        if (e === "Show") {
            this.widgets['network-gridlines-show'] = true;
            this.drawGridlines(true);
        } else {
            this.widgets['network-gridlines-show'] = false;
            this.drawGridlines(false);
        }
    }
    
    /**
     * Changes value of charge force (d3.many-body-force). Sets charge to -e meaning each node will repell every other node
     * @param {number} e value from 0-400
     */
    onNodeChargeChange(e: number) {

        this.visuals.twoD.force.force('charge').strength(-e);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        this.widgets['node-charge'] = e;
    }

    /**
     * Changes value of gravity force (d3-force-attract) which pulls nodes to the center. Sets strength e
     * @param {number} e value from 0.025-1
     */
    onNetworkGravityChange(e: number) {

        this.visuals.twoD.force.force('gravity').strength(e);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        this.widgets['network-gravity'] = e;
    }

    /**
     * Changes value of velocityDecay (d3 velocityDecay). Sets too low causing network to oscillate
     * @param {number} e value from 0-1 (default 0.4)
     */
    onNetworkFrictionChange(e) {

        this.visuals.twoD.force.velocityDecay(e);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        this.widgets['network-friction'] = e;
    }

    /**
     * Changes value of network-link-strength (d3.forceLink) which pulls the pair of nodes together
     * @param {number} e value from 0-1 (default 0.4)
     */
    onNetworkLinkStrengthVariableChange(e) {

        //console.log('st change: ', e);
        let v = parseFloat(e);
        this.visuals.twoD.force.force('link').strength(v);
        this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        this.widgets['network-link-strength'] = e;
    }

    /**
     * If exportFileType = 'svg' don't show advanced setting; otherwise do show them
     * @param e string of filetype
     */
    onNetworkExportFiletypeChange(e) {
        if (e == "svg") {
            this.visuals.twoD.ShowAdvancedExport = false;
        }
        else
            this.visuals.twoD.ShowAdvancedExport = true;
    }

    /**
     * Updates the color of nodes and transparency based on node-color-variable, the value from nodeColorMap and nodeAlphaMap, and whether the node is selected
     */
    updateNodeColors() {

        //debugger;

        let variable = this.widgets['node-color-variable'];
        let nodes = this.visuals.twoD.svg.select('g.nodes').selectAll('g').select('path').data(this.visuals.twoD.commonService.session.network.nodes).classed('selected', d => d.selected);
        let col = this.widgets['node-color'];

        let stroke = this.widgets['selected-node-stroke-color'];
        let stroke_width = parseInt(this.widgets['selected-node-stroke-width']);

        if (variable == 'None') {

            nodes
                .attr('fill', col).attr('opacity', 1);

            // this.context.microbeTrace.clearTable("#node-color-table-bottom");

        } else {
            nodes
                .attr('fill', d => this.visuals.twoD.commonService.temp.style.nodeColorMap(d[variable]))
                .attr('opacity', d => this.visuals.twoD.commonService.temp.style.nodeAlphaMap(d[variable]));

            //  this.context.microbeTrace.generateNodeColorTable("#node-color-table-bottom", false);
        }


        Array.from(nodes._groups).forEach((x: any)=>{
            x.forEach(y=>{
                if(!this.visuals.twoD.commonService.session.data.nodes.find(z => y.__data__.index == z.index)){
                    y.style['opacity'] = 0;
                }
            })
        })

        let _selected: any = this.visuals.twoD.commonService.session.data.nodes.filter(d => d.selected);

        /*/
         * Add a color that shows the node is selected.
        /*/

        if (_selected.length > 0) {

            Array.from(nodes._groups).filter(x => {

                (<any>x).filter(y => {

                    /*/
                     * Turn on the node(s) selected.
                    /*/
                    if (y['__data__'].selected == true) {

                        y.style['stroke'] = stroke;
                        y.style['strokeWidth'] = stroke_width;

                    }
                    else {
                        /*/
                         * Otherwise, turn on the node(s) selected.
                        /*/

                        y.style['stroke'] = "#000000";
                        y.style['strokeWidth'] = this.widgets['node-border-width'];
                    }
                });
            });
        }
        else {


            Array.from(nodes._groups).filter(x => {

                (<any>x).filter(y => {

                    /*/
                        * Otherwise, turn on the node(s) selected.
                    /*/

                    y.style['stroke'] = "#000000";
                    y.style['strokeWidth'] = this.widgets['node-border-width'];

                });
            });
        }



    };


    /**
     * Updates the color of links and transparency based on link-color-variable and value from linkColorMap and linkAlphaMap
     */
    updateLinkColor() {

        let variable = this.widgets['link-color-variable'];
        // console.log('updating variable: ',variable );
        let links = this.visuals.twoD.svg.select('g.links').selectAll('line');
        if (variable == 'None') {
            let color = this.widgets['link-color'],
                opacity = 1 - this.widgets['link-opacity'];
            links
                .attr('stroke', color)
                .attr('opacity', opacity);

            // this.context.microbeTrace.clearTable("#link-color-table-bottom");
        } else {
            // this.context.microbeTrace.generateNodeLinkTable("#link-color-table-bottom", false);
            if (variable == 'source' || variable == 'target') {
                links
                .data(this.getVLinks())
                .attr('stroke', l => this.visuals.twoD.commonService.temp.style.linkColorMap(l[variable]['_id']))
                .attr('opacity', l => this.visuals.twoD.commonService.temp.style.linkAlphaMap(l[variable]['_id']))
                .attr('stroke-dasharray', l => {
                    //This quirky little algorithm creates the dasharray code necessary to make dash-y links.
                    let length = 15;
                    let out = new Array(l.origins * 2);
                    let ofs = new Array(l.origins).fill(1);
                    let ons = new Array(l.origins).fill(0);
                    ons[l.oNum] = 1;
                    ofs[l.oNum] = 0;
                    for (let i = 0; i < l.origins; i++) {
                        out[2 * i] = ons[i] * length;
                        out[2 * i + 1] = ofs[i] * length;
                    }
                    return out.join(', ');
                });
            } else {
                links
                    .data(this.getVLinks())
                    .attr('stroke', l => this.visuals.twoD.commonService.temp.style.linkColorMap(l[variable]))
                    .attr('opacity', l => this.visuals.twoD.commonService.temp.style.linkAlphaMap(l[variable]))
                    .attr('stroke-dasharray', l => {
                        //This quirky little algorithm creates the dasharray code necessary to make dash-y links.
                        let length = 15;
                        let out = new Array(l.origins * 2);
                        let ofs = new Array(l.origins).fill(1);
                        let ons = new Array(l.origins).fill(0);
                        ons[l.oNum] = 1;
                        ofs[l.oNum] = 0;
                        for (let i = 0; i < l.origins; i++) {
                            out[2 * i] = ons[i] * length;
                            out[2 * i + 1] = ofs[i] * length;
                        }
                        return out.join(', ');
                    });
            }
        }
    };

    /**
     * Updates the width of the links using link-width, link-width-variable, link-width-max, link-width-min, and link-width-reciprocal
     */
    scaleLinkWidth() {
        let scalar = this.widgets['link-width'];
        let variable = this.widgets['link-width-variable'];
        let vlinks = this.visuals.twoD.getVLinks();
        let links = this.visuals.twoD.svg.select('g.links').selectAll('line').data(vlinks);
        if (variable == 'None') return links.attr('stroke-width', scalar);
        let n = vlinks.length;
        let maxWidth = this.widgets['link-width-max'];
        let minWidth = this.widgets['link-width-min'];

        let max = -Infinity;
        let min = Infinity;
        for (let i = 0; i < n; i++) {
            let l = vlinks[i][variable];
            if (!this.visuals.twoD.isNumber(l)) return;
            if (l > max) max = l;
            if (l < min) min = l;
        }
        let mid = (max - min) / 2 + min;
        let scale = d3.scaleLinear()
            .domain(this.widgets['link-width-reciprocal'] ? [max, min] : [min, max])
            .range([minWidth, maxWidth]);
        links.attr('stroke-width', d => {
            let v = d[variable];
            if (!this.visuals.twoD.isNumber(v)) v = mid;
            return scale(v);
        });
    };

    /**
     * centers the view
     * @param thing undefined
     * @param bounds undefined
     * @returns 
     */
    fit(thing, bounds) {

        if (!bounds) bounds = this.visuals.twoD.svg.node().getBBox();
        if (bounds.width == 0 || bounds.height == 0) return; // nothing to fit
        let parent = this.visuals.twoD.svg.node().parentElement.parentElement,
            midX = bounds.x + bounds.width / 2,
            midY = bounds.y + bounds.height / 2;
        let scale = 0.8 / Math.max(bounds.width / parent.clientWidth, bounds.height / parent.clientHeight);
        const w = parent.clientWidth / 2 - midX*scale ;
        const h = parent.clientHeight / 2 - midY*scale;
        d3.select('svg#network')
            .transition()
            .duration(750)
            .call(this.visuals.twoD.zoom.transform, d3.zoomIdentity
                .translate(w, h)
                //.translate(parent.parentNode.clientWidth / 2 - midX, parent.parentNode.clientHeight / 2 - midY)
                .scale(scale));
    };

    /**
     * XXXXX Function is never called; Review if necessary XXXXX
     * @param nodeData 
     * @returns 
     */
    isFiltered(nodeData: any): boolean{
        if(nodeData){
            return this.visuals.twoD.commonService.session.data.nodeFilteredValues.find(x=>x.index === nodeData.index) !== undefined;
        }
        return true
    }

    /**
     * On click of settings button, show/hide settings dialog
     */     
    openSettings() {
        (this.visuals.twoD.Node2DNetworkExportDialogSettings.isVisible) ? this.visuals.twoD.Node2DNetworkExportDialogSettings.setVisibility(false) : this.visuals.twoD.Node2DNetworkExportDialogSettings.setVisibility(true);
       this.visuals.twoD.ShowStatistics = !this.visuals.twoD.Show2DSettingsPane;
       this.updateLinkWidthRows(this.SelectedLinkWidthByVariable);
    }

    /**
     * Updates ShowStatistics variables to opposite of current value
     * 
     * XXXXX Not currently executed; reevaluate if this function is needed XXXXX
     */
    enableSettings() {
        this.visuals.twoD.ShowStatistics = !this.visuals.twoD.ShowStatistics;
        this.cdref.detectChanges();
    }

    /**
     * On click of export button, show export dialog
     */ 
    openExport() {

        // this.visuals.microbeTrace.GlobalSettingsDialogSettings.setStateBeforeExport();
        // this.visuals.microbeTrace.GlobalSettingsLinkColorDialogSettings.setStateBeforeExport();
        // this.visuals.microbeTrace.GlobalSettingsNodeColorDialogSettings.setStateBeforeExport();
        // this.visuals.twoD.NodeSymbolTableWrapperDialogSettings.setStateBeforeExport();
        // this.visuals.twoD.Node2DNetworkExportDialogSettings.setStateBeforeExport();
        this.setCalculatedResolution()
        this.isExportClosed = false;
        this.visuals.twoD.Show2DExportPane = true;
    }

    /**
     * On click of center button, show centers the view
     */ 
    openCenter() {
        this.visuals.twoD.fit(undefined, undefined);
    }

    /**
     * On click of Pin All Nodes button, pin/unpins all nodes
     */
    openPinAllNodes() {

        let nodes = this.visuals.twoD.svg
            .select('g.nodes')
            .selectAll('g')
            .data(this.visuals.twoD.commonService.session.network.nodes)
            .select('path');
        if (this.visuals.twoD.commonService.session.network.allPinned) {
            nodes.each(function (d) {
                delete d.fx;
                delete d.fy;
                d.fixed = false;
            });
            this.visuals.twoD.force.alpha(0.3).alphaTarget(0).restart();
        } else {
            nodes.each(function (d) {
                d.fx = d.x;
                d.fy = d.y;
                d.fixed = true;
            });
        }
        this.visuals.twoD.commonService.session.network.allPinned = !this.visuals.twoD.commonService.session.network.allPinned;
    }

    /**
     * XXXXX empty function; may be added later XXXXX
     */
    onRecallSession(){
        //this.loadSettings();
    }

    openRefreshScreen() {
        this.loadSettings();
        setTimeout(this.visuals.twoD.fit, 2000);
    }

    /**
     * XXXXX empty function; may be added later XXXXX
     */
    openSelectDataSetScreen() {

    }

    /**
     * renders the network
     */
    updateVisualization() {
        if (!this.isLoading) {
            console.log('render update vis');
            this.isLoading = true;
            this.render();
            setTimeout(() => {
                this.isLoading = false;
              }, 1000);
        }    
    }

    applyStyleFileSettings() {
        this.widgets = window.context.commonService.session.style.widgets;
        this.loadSettings();
    }

    ngOnDestroy(): void {
        //this.context.twoD.widgets['node-label-variable'] = 'None';
    }

    /**
     * renders the network
     */
    onLoadNewData(){
        console.log('render new data');
        this.render();
    }

    /**
     * renders the network; sets this.showStatistics to false
     */
    onFilterDataChange(){
        console.log('render filter change');
        // render doesn't do anything unless this.isLoading == true; so need to ensure that before call render
        this.render(false);
    }

    /**
     * Sets twoD component variable based on the value in the appropriate widget and then calls appropriate function to update the view
     * 
     * XXXXX this function should probably be reevaluated/refacted as well because sections of code are being evaluated multiple times 
     * (ie. onPolygonLabelVariableChange, onPolygonLabelVariableChange, onPolygonLabelOrientationChange all call redrawPolygonLabels) XXXXX
     */
    loadSettings(){
        //this.context.twoD.zoom = null;

        //Polygons|Label
        this.SelectedPolygonLabelVariable = this.widgets['polygons-label-variable'];
        this.onPolygonLabelVariableChange(this.SelectedPolygonLabelVariable);

        //Polygons|Label Size
        this.SelectedPolygonLabelSizeVariable = this.widgets['polygons-label-size'];
        this.setPolygonLabelSize(this.SelectedPolygonLabelSizeVariable);

        //Node|Orientation
        this.SelectedPolygonLabelOrientationVariable = this.widgets['polygons-label-orientation'];
        this.onPolygonLabelOrientationChange(this.SelectedPolygonLabelOrientationVariable);

        this.polygonsToggle(this.widgets['polygons-show']);
        if(this.widgets['polygons-show']){
            this.visuals.twoD.updatePolygonColors();
            this.polygonColorsToggle(this.widgets['polygon-color-table-visible'])
        }

       //Nodes|Label
        this.SelectedNodeLabelVariable = this.widgets['node-label-variable'];
        this.onNodeLabelVaribleChange(this.SelectedNodeLabelVariable);

        //Node|Label Size
        this.SelectedNodeLabelSizeVariable = this.widgets['node-label-size'];
        this.setNodeLabelSize(this.SelectedNodeLabelSizeVariable);

        //Node|Orientation
        this.SelectedNodeLabelOrientationVariable = this.widgets['node-label-orientation'];
        this.onNodeLabelOrientationChange(this.SelectedNodeLabelOrientationVariable);

        //Nodes|Tooltip
        if (!Array.isArray(this.widgets['node-tooltip-variable'])) {
            this.widgets['node-tooltip-variable'] = [this.widgets['node-tooltip-variable']];
        }
        this.SelectedNodeTooltipVariable = this.widgets['node-tooltip-variable'];
        this.onNodeTooltipVariableChange(this.SelectedNodeTooltipVariable);

        //Nodes|Shape By Table
        if (this.widgets['node-symbol-variable'] != undefined && this.widgets['node-symbol-variable'] != 'None') {
            this.widgets["node-symbol-table-visible"] = 'Show';
        }
        this.SelectedNetworkTableTypeVariable = this.widgets["node-symbol-table-visible"];
        this.onNodeSymbolTableChange(this.SelectedNetworkTableTypeVariable);

        //Nodes|Shape By
        this.SelectedNodeSymbolVariable = this.widgets['node-symbol-variable'];
        this.onNodeSymbolVariableChange(this.widgets['node-symbol-variable'], this.SelectedNetworkTableTypeVariable === "Show");
        

        //Nodes|Shape
        this.SelectedNodeShapeVariable = this.widgets['node-symbol'];
        this.onNodeSymbolChange(this.SelectedNodeShapeVariable);

        //Nodes|Size By
        this.SelectedNodeRadiusVariable = this.widgets['node-radius-variable'];
        this.onNodeRadiusVariableChange(this.SelectedNodeRadiusVariable);

        //Nodes|Size
        this.SelectedNodeRadiusSizeVariable = this.widgets['node-radius'].toString();
        this.onNodeRadiusChange(this.SelectedNodeRadiusSizeVariable);

        this.nodeBorderWidth = this.widgets['node-border-width']

        //Links|Tooltip
        this.SelectedLinkTooltipVariable = this.widgets['link-tooltip-variable'];
        this.onLinkTooltipVariableChange(this.SelectedLinkTooltipVariable);

        //Links|Label
        this.SelectedLinkLabelVariable = this.widgets['link-label-variable'];
        this.onLinkLabelVariableChange(this.SelectedLinkLabelVariable);

        //Links|Decimal Length
        this.SelectedLinkDecimalVariable = this.widgets['link-label-decimal-length'];
        this.onLinkDecimalVariableChange(this.SelectedLinkDecimalVariable);

        //Links|Transparency
        this.SelectedLinkTransparencyVariable = this.widgets['link-opacity'];
        this.onLinkOpacityChange(this.SelectedLinkTransparencyVariable);

        //Links|Width By
        this.SelectedLinkWidthByVariable = this.widgets['link-width-variable'];
        this.onLinkWidthVariableChange(this.SelectedLinkWidthByVariable);

        //Links|Reciprical
        this.SelectedLinkReciprocalTypeVariable = this.widgets['link-width-reciprocal'] ? "Reciprocal" : "Non-Reciprocal"
        this.onLinkWidthReciprocalNonReciprocalChange(this.SelectedLinkReciprocalTypeVariable);

        //Links|Width
        this.SelectedLinkWidthVariable = this.widgets['link-width'];
        this.onLinkWidthChange(this.SelectedLinkWidthVariable);

         //Links|Width Max
         this.SelectedLinkWidthMax = this.widgets['link-width-max'];
         this.onLinkWidthMaxChange(this.SelectedLinkWidthMax);
 
         //Links|Width Min
         this.SelectedLinkWidthMin = this.widgets['link-width-min'];
         this.onLinkWidthMinChange(this.SelectedLinkWidthMin);

        //Links|Length
        this.SelectedLinkLengthVariable = this.widgets['link-length'];
        this.onLinkLengthChange(this.SelectedLinkLengthVariable);

        //Links|Arrows
        this.SelectedLinkArrowTypeVariable = this.widgets['link-directed'] ? "Show" : "Hide";
        this.onLinkDirectedUndirectedChange(this.SelectedLinkArrowTypeVariable); 


        //Network|Neighbors
        this.SelectedNetworkNeighborTypeVariable = this.widgets['node-highlight'] ? "Highlighted" : "Normal";
        this.onDontHighlightNeighborsHighlightNeighborsChange(this.SelectedNetworkNeighborTypeVariable);

        //Network|Gridlines
        this.SelectedNetworkGridLineTypeVariable = this.widgets['network-gridlines-show'] ? "Show" : "Hide";
        this.onNetworkGridlinesShowHideChange(this.SelectedNetworkGridLineTypeVariable);

        //Network|Charge
        this.SelectedNetworkChargeVariable = this.widgets['node-charge'];
        this.onNodeChargeChange(this.SelectedNetworkChargeVariable);

        //Network|Gravity
        this.SelectedNetworkGravityVariable = this.widgets['network-gravity'];
        this.onNetworkGravityChange(this.SelectedNetworkGravityVariable);

        //Network|Friction
        this.SelectedNetworkFrictionVariable = this.widgets['network-friction'];
        this.onNetworkFrictionChange(this.SelectedNetworkFrictionVariable);

        //Network|Link Strength
        this.SelecetedNetworkLinkStrengthVariable = this.widgets['network-link-strength'];
        this.onNetworkFrictionChange(this.SelecetedNetworkLinkStrengthVariable);


         //Network|Polygon Orientation
         this.SelectedPolygonLabelOrientationVariable = this.widgets['polygon-label-orientation'];
         this.onPolygonLabelOrientationChange(this.SelectedPolygonLabelOrientationVariable);
    }
}

export namespace TwoDComponent {
    export const componentTypeName = '2D Network';
}
