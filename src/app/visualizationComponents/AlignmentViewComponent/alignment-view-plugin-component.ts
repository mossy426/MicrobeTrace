import { Component, OnInit, Injector, Inject, ElementRef, ChangeDetectorRef } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { BaseComponentDirective } from '@app/base-component.directive';
import { MicrobeTraceNextVisuals } from '@app/microbe-trace-next-plugin-visuals';
import { CommonService } from '@app/contactTraceCommonServices/common.service';
import { DialogSettings } from '../../helperClasses/dialogSettings';
import { MicobeTraceNextPluginEvents } from '../../helperClasses/interfaces';
import { ComponentContainer } from 'golden-layout';
import { generateCanvas } from './generateAlignmentViewCanvas';
import { SelectItem } from 'primeng/api';
import { saveAs } from 'file-saver';
import { svgAsPngUri } from 'save-svg-as-png';

@Component({
  selector: 'AlignmentViewComponent',
  templateUrl: './alignment-view-plugin-component.html',
  styleUrls: ['./alignment-view-plugin-component.scss']
})
export class AlignmentViewComponent extends BaseComponentDirective implements OnInit, MicobeTraceNextPluginEvents {

  // General Settings
  alignmentDialogSettings: DialogSettings = new DialogSettings('#alignment-settings-pane', false)
  ShowAlignExportPane: boolean = false;

  showHideOptions: any = [
    { label: 'Show', value: true },
    { label: 'Hide', value: false }
  ];
  labelFieldList: SelectItem[] = [];
  //labelField = "_id" // replaced with this.widgets['alignView-labelField']
  labelArray: any[];
  //sortField = "index" // replaced with this.widgets['alignView-sortField']

  private visuals: MicrobeTraceNextVisuals;
  widgets;
  
  // Data
  nodesWithSeq: any[];
  seqArray: string[];
  seqArrayShortened: any[];
  longestSeqLength: number = 0;

  /**
   * count matrix: [ [#A, #C, #G, #T, #other/ambig]-for each location, ... ]
   */
  countMatrix;
  /**
   * proportion matrix: [ [A, C, G, T, #other/ambig]-for each location, ... ]
   */
  proportionMatrix;
  /**
   * position matrix: [ [A, C, G, T, #other/ambig]-for each location, ... ]
   * y position (top) for each base at each postion in sequence
   */
  positionMatrix;

  // Layout
  //showMiniMap: boolean; // replaced with this.widgets['alignView-showMiniMap']
  //alignmentTopDisplay: string; // replaced with this.widgets['alignView-topDisplay']
  alignmentTopDisplayOptions = [
    { label: 'Logo', value: 'logo' },
    { label: 'Bar Plot', value: 'barplot'}
  ]
  //charSetting: string; // 'show', 'min', 'hide' // replaced with this.widgets['alignView-charSetting']
  charSettingOptions: any = [
    { label: 'Show', value: 'show' },
    { label: 'Minimum', value: 'min'},
    { label: 'Hide', value: 'hide' }
  ];
  //rulerMinorInterval: number = 20; replaced with this.widgets['alignView-rulerMinorInterval']
  rulerIntervalOptions = [0, 10, 20, 25, 50]

  // Sizing
  // spanWidth and spanHeight values are duplicated in the widgets; I didn't replace because these are used through the template in loops and I was concerned that
  // looking up there values 1000's of times from this.commonService.session.style.widgets would hurt performance
  spanWidth: number; 
  spanHeight: number;
  fontSize: number;

  sizes = [
    { label: 'Small', value: 's'},
    { label: 'Medium', value: 'm'},
    { label: 'Large', value: 'l'},
    { label: 'Custom', value: 'c'}
  ]
  //selectedSize: string; // replaced with this.widgets['alignView-selectedSize']

  alignmentViewHeight: number;
  rightViewHeight: number;
  canvasViewHeight: number;

  leftWidth: number;
  rightWidth: number;

  // Colors
  //selectedColorSchemeName: string; // replaced with this.widgets['alignView-colorSchemeName']
  colorScheme; // current color scheme;
  // customColorScheme; // replaced with this.widgets['alignView-customColorScheme']
  useCustomColorScheme: boolean;
  colorSchemeOptions = [
    { label: 'Normal', 
      value: 'n',
    },
    { label: 'Alternative', 
    value: 'a',
    },
    {
      label: 'Custom',
      value: 'c'
    }
  ]

  // Export
  AlignmentExportFileName: string = ""
  AlignmentExportFileTypeVis: string = "svg";
  AlignmentExportFileTypeData: string = "fasta";

  constructor(injector: Injector,
    private eventManager: EventManager,
    public commonService: CommonService,
    @Inject(BaseComponentDirective.GoldenLayoutContainerInjectionToken) private container: ComponentContainer, 
    elRef: ElementRef,
    private cdref: ChangeDetectorRef) {

    super(elRef.nativeElement);

    this.visuals = commonService.visuals;
    this.commonService.visuals.alignment = this;
    this.widgets = this.commonService.session.style.widgets;
  }

  ngOnInit(): void {
    // set events such as node-selected
    this.setEvents();

    this.setDefaultWidgets();

    this.labelFieldList = [];
    this.commonService.session.data['nodeFields'].map((d, i) => {
      if (d != 'seq' && d != 'sequence') {
        this.labelFieldList.push({
          label: this.commonService.capitalize(d.replace("_", "")),
          value: d
        });
      }
    });

    // sets nodesWithSeq, seqArr, and longestSeqLength
    this.nodesWithSeq = [];
    this.seqArray = [];
    this.commonService.session.data.nodes.forEach((node, index) => {
      if (node.seq != null){
        this.nodesWithSeq.push(index);
        this.seqArray.push(node.seq.toUpperCase());
        if (node.seq.length > this.longestSeqLength) {
          this.longestSeqLength = node.seq.length;
        }
      }
    })

    this.labelArray = this.getData(this.nodesWithSeq, ['index', this.widgets['alignView-labelField']]);

    // calculations countMatrix, proportionMatrix, and positionMatrix
    this.calculateProportionAtEachLocation();

    // sets different variables relating to size and display
    this.onAlignmentTopChange()

    if (this.widgets['alignView-colorSchemeName'] == 'n' || this.widgets['alignView-colorSchemeName'] == 'a') {
      this.useCustomColorScheme = false;
    } else {
      this.useCustomColorScheme = true;
    }
    this.onSelectedColorChanged(true)

    // updates spanWidth, spanHeight, rightWidth, leftWidth, fontSize, and then updates alignment
    this.onSelectedSizeChanged()
    // updates the valus of nodeWidthSeqShortened based on size of rigthWitdth, longestSeqLength, and nodesWithSeq
    this.shortenNodesWithSeq();

    // updates shows or hides minimap and then updates view heights
    this.updateMiniMapVisibility()

  }

  // General

  /**
   * Defines new widgets and set default values
   */
  setDefaultWidgets() {
    //size
    if (this.widgets['alignView-selectedSize'] == undefined) {
      this.widgets['alignView-selectedSize'] = 'l';
    }
    // height and width are declare/checked in this.onSelectedSizeChanged()

    // color
    if (this.widgets['alignView-colorSchemeName'] == undefined) {
      this.widgets['alignView-colorSchemeName'] = 'n';
    }

    if (this.widgets['alignView-customColorScheme'] == undefined) {
      this.widgets['alignView-customColorScheme'] = {
        'A': '#ccff00',
        'C': '#ffff00',
        'G': '#ff9900',
        'T': '#ff6600',
        'ambig': '#ffffff',
      }
    }

    // labels/sorting
    if (this.widgets['alignView-labelField'] == undefined) {
      this.widgets['alignView-labelField'] = '_id';
    }

    if (this.widgets['alignView-sortField'] == undefined) {
      this.widgets['alignView-sortField'] = 'index';
    }

    // top settings
    if (this.widgets['alignView-showMiniMap'] == undefined) {
      this.widgets['alignView-showMiniMap'] = true;
    }

    if (this.widgets['alignView-topDisplay'] == undefined) {
      this.widgets['alignView-topDisplay'] = 'logo';
    }

    if (this.widgets['alignView-rulerMinorInterval'] == undefined) {
      this.widgets['alignView-rulerMinorInterval'] = 20;
    }

    // main canvas
    if (this.widgets['alignView-charSetting'] == undefined) {
      this.widgets['alignView-charSetting'] = 'hide';
    }

  }

  /**
   * 
   * @param indexList an array of indexes for the nodes to get data from
   * @param field string | array of which field to get data from
   * @returns an array of objects
   */
  getData(indexList, field) {
    if (Array.isArray(field)) {
      return indexList.map(index => {
        let currentObj = {}
        field.forEach(f => currentObj[f] = (f == "seq") ? this.commonService.session.data.nodes[index][f].toUpperCase() : this.commonService.session.data.nodes[index][f]);
        return currentObj;
      })
    } else if (field == "seq") {
      return indexList.map(index => this.commonService.session.data.nodes[index]["seq"].toUpperCase());
    } else {
      return indexList.map(index => this.commonService.session.data.nodes[index][field])
    }
  }

  /**
  * Updates the alignment by generating a new canvas, and recalcuating various heights
  */
  updateAlignment() {
    generateCanvas(this.seqArray, {width: this.spanWidth, height: this.spanHeight, charSetting: this.widgets['alignView-charSetting'], fontSize: this.fontSize, colors: this.colorScheme}).then(function(canvas: HTMLCanvasElement) {
      $('#msa-viewer .canvasHolder').empty().append(canvas)
    })
    
    this.updateViewHeights();
  }

  // Mini Map

  /**
  * Creates a minimap. 
  * The sequences (seqArrayShortened) are previously downsample by picking 1 nt / every n nucleotides;
  */
  updateMiniMap() {
    $('#miniMap canvas').remove();
    generateCanvas(this.seqArrayShortened, {width: 1, height: 1, charSetting: 'hide', fontSize: 1, colors: this.colorScheme}).then(function(canvas: HTMLCanvasElement) {
      $('#miniMap').append(canvas);
    })
  }

  /**
   * Adds/Removed miniMap and miniMap title
   */
  updateMiniMapVisibility() {
    if (this.widgets['alignView-showMiniMap']){
      this.updateMiniMap();
      $('#miniMapHolder').css({'display': 'block'});
      $('#miniMapTitle').css({'display': 'block'});
    } else {
      $('#miniMapHolder').css({'display': 'none'});
      $('#miniMapTitle').css({'display': 'none'});
    }

    this.updateViewHeights();
  }

  /**
   * Add miniMapHighlight to correct position
   * @param e mouse event
   * @param miniMap HTMLElement
   */
  showMiniMapHighlight(e: MouseEvent, miniMap: HTMLElement) {
    let mmDimensions = miniMap.getBoundingClientRect();
    
    // need to reduce number of sequences on minimap if there are too many
    let scaleFactorNumber = (this.nodesWithSeq.length <= 100)? 1: Math.ceil(this.nodesWithSeq.length/100);
    let viewHeight = $('.canvasLabels').height();
    let highlightHeight = viewHeight/(this.spanHeight*scaleFactorNumber);

    // want the minimap to be around this.rightWidth pixels wide; caculate how much to downscale by and then downscale
    let scaleFactorLength = (this.longestSeqLength < this.rightWidth)? 1 : Math.ceil(this.longestSeqLength/this.rightWidth);
    let highlightWidth = $('.canvasHolder').width()/(this.spanWidth*scaleFactorLength)

    let canvasWidth = $('#miniMap canvas').width()
    let left = e.clientX - mmDimensions.left - highlightWidth/2;
    if (left < 0) {
      left = 0;
    } else if (left > canvasWidth - highlightWidth) {
      left = canvasWidth - highlightWidth;
    }

    $('#miniMapHighlight').css({'display': 'block', 'top': top +'px', 'left': left +'px', 'height': highlightHeight+'px', 'width': highlightWidth+'px'})
  }

  /**
   * Moves the position of miniMapHighlight
   * @param e mouse event
   * @param miniMap HTMLElement
   */
  updateMiniMapHighlight(e: MouseEvent, miniMap: HTMLElement) {
    let mmDimensions = miniMap.getBoundingClientRect();

    let highlightHeight = $('#miniMapHighlight').height()
    let top = e.clientY - mmDimensions.top - (highlightHeight/2)
    if (top < 0) {
      top = 0
    } else if (top > mmDimensions.height-highlightHeight) {
      top = mmDimensions.height-highlightHeight
    }

    let canvasWidth = $('#miniMap canvas').width()
    let highlightWidth = $('#miniMapHighlight').width()
    let left = e.clientX - mmDimensions.left - highlightWidth/2;
    if (left < 0) {
      left = 0;
    } else if (left > canvasWidth - highlightWidth) {
      left = canvasWidth - highlightWidth;
    }

    $('#miniMapHighlight').css({'top': top +'px', 'left': left +'px'});
  }

  /**
   * Removes highling from minimap
   */
  hideMiniMapHighlight() {
    $('#miniMapHighlight').css({'display': 'none'})
  }

  /**
   * Moves scroll position of main canvas, canvasLabels, and alignmentTop(Bar Plot, Rule) based on position of miniMapHighlight
   */
  miniMapClick(e: MouseEvent, miniMap: HTMLElement, canvasHolder: HTMLElement, canvasLabels: HTMLElement, alignmentTop: HTMLElement) {
    let mmDimensions = miniMap.getBoundingClientRect();
    let highlightDimensions =  document.getElementById('miniMapHighlight').getBoundingClientRect();

    // want the minimap to be around this.rightWidth pixels wide; caculate how much to downscale by and then downscale
    let scaleFactorLength = (this.longestSeqLength < this.rightWidth)? 1 : Math.ceil(this.longestSeqLength/this.rightWidth);
    // need to reduce number of sequences on minimap if there are too many
    let scaleFactorNumber = (this.nodesWithSeq.length <= 100)? 1: Math.ceil(this.nodesWithSeq.length/100);
    //let scaleFactor = Math.ceil(this.longestSeqLength/this.rightWidth)
    let horizontalScroll = (highlightDimensions.left - mmDimensions.left)*this.spanWidth*scaleFactorLength;    
    alignmentTop.scrollLeft = horizontalScroll < 10 ? horizontalScroll : horizontalScroll + 7;
    canvasHolder.scrollLeft = horizontalScroll < 10 ? horizontalScroll : horizontalScroll + 7;

    let verticalScroll = (highlightDimensions.top - mmDimensions.top)*this.spanHeight*scaleFactorNumber;
    canvasLabels.scrollTop = verticalScroll < 4 ? verticalScroll : verticalScroll+4;
    canvasHolder.scrollTop = verticalScroll < 4 ? verticalScroll : verticalScroll+4;  
  }

  // Tooltip

  /**
   * 
   * @param e $event
   * @param index index of the nt for the tooltip
   */
  showTooltip(e: MouseEvent ,index:number) {
    // offsetX = mouse X position + adjustment to center of the bar -50 to center toolbar
    let [x, ] = this.getRelativeMousePosition(e);
    let adjX = this.spanWidth/2 - (e.offsetX % this.spanWidth)
    let offsetX = x + adjX -50;
    
    // offsetY
    let rect = document.querySelector('#alignmentTop').getBoundingClientRect();
    let offsetY = rect.top - 10;

    let htmlString = this.tabulate(index);
    $('#tooltipAlign').html(htmlString)
    $('#tooltipHolder').css({'display': 'block', 'position': 'absolute', 'left': offsetX + 'px', 'top': offsetY + 'px'})
  }

  /**
   * Hides the tooltip
   */
  hideTooltip() {
    //$('#tooltipAlign').html("")
    $('#tooltipHolder').css({'display': 'none'})
  }


  // Data

  /**
   * Updates seqArrayShortened by downsampling (selecting 1 out of every n NTs and selected 1 out of every m sequences, as needed) nodesWithSeq
   * 
   */
  shortenNodesWithSeq() {
    if (this.longestSeqLength < this.rightWidth && this.nodesWithSeq.length <= 100) {
      this.seqArrayShortened = this.seqArray
      $('#miniMap').css({'width': this.longestSeqLength+'px', 'height': this.nodesWithSeq.length+'px'})
      $('#miniMapTitle').css({'height': (this.nodesWithSeq.length+16)+'px', 'line-height': (this.nodesWithSeq.length+16)+'px'})
      return; 
    }

    // want the minimap to be around this.rightWidth pixels wide; caculate how much to downscale by and then downscale
    let scaleFactorLength = (this.longestSeqLength < this.rightWidth)? 1 : Math.ceil(this.longestSeqLength/this.rightWidth);
    // need to reduce number of sequences on minimap if there are too many
    let scaleFactorNumber = (this.nodesWithSeq.length <= 100)? 1: Math.ceil(this.nodesWithSeq.length/100);
    this.seqArrayShortened = [];
    this.seqArray.forEach((seq, index) => {
      if (index % scaleFactorNumber != 0) return;
      let downSizedSeq = "";
      for (let i=0; i < this.longestSeqLength; i+= scaleFactorLength) {
        downSizedSeq += seq.charAt(i);
      }
      this.seqArrayShortened.push(downSizedSeq)
    })

    $('#miniMap').css({'width': Math.ceil(this.longestSeqLength/scaleFactorLength)+'px', 'height': Math.ceil(this.nodesWithSeq.length/scaleFactorNumber)+'px'})
    $('#miniMapTitle').css({'height': Math.ceil(this.nodesWithSeq.length/scaleFactorNumber+16)+'px', 'line-height': Math.ceil(this.nodesWithSeq.length/scaleFactorNumber+16)+'px'})
  }

  /**
   * Calculates the count, proportion, and y position (for logo/bar plot) of each base at each position
   */
  calculateProportionAtEachLocation() {
    // count matrix: [ [#A, #C, #G, #T, #other/ambiguos]-for each location, ... ]
    this.countMatrix = [];
    this.proportionMatrix = [];
    this.positionMatrix = [];

    for (let i =0; i<this.longestSeqLength; i++) {
      this.countMatrix.push([0,0,0,0,0]);
    }

    for (let seq of this.seqArray) {
      for (let i=0; i< seq.length; i++) {
        let nt = seq[i];
        switch (nt) {
          case 'A':
            this.countMatrix[i][0] += 1;
            break;
          case 'C':
            this.countMatrix[i][1] += 1;
            break;
          case 'G':
            this.countMatrix[i][2] += 1;
            break;
          case 'T':
            this.countMatrix[i][3] += 1;
            break; 
          default:
            this.countMatrix[i][4] += 1
        }
      } 
    }
    
    function calcProportion(value) {
      let sum = value[0] + value[1] + value[2] + value[3] + value[4];
      return [value[0]/sum, value[1]/sum, value[2]/sum, value[3]/sum, value[4]/sum]
    }

    function calculatePosition(value) {
      // custom merge sort; i want  first four items in value sorted but i want array of indexes returned not array of values
      let mergeA = value[0] > value[1] ? [0,1] : [1,0]
      let mergeB = value[2] > value[3] ? [2,3] : [3,2]
      let sortedIndexes = [];
      let locA = 0, locB=0;
      for (let i =0; i<4; i++) {
        if (locA == 2) {
          sortedIndexes.push(mergeB[locB])
          locB += 1;
        } else if (locB == 2) {
          sortedIndexes.push(mergeA[locA])
          locA += 1;
        } else if (value[mergeA[locA]] > value[mergeB[locB]]) {
          sortedIndexes.push(mergeA[locA])
          locA += 1;
        } else {
          sortedIndexes.push(mergeB[locB])
          locB += 1;
        }
      }

      // use sorted index to create temp/row of positionMatrix such at the ambig (value[4]) is at the very top and then largest to smallest
      let temp = [0,0,0,0,0];
      let y = value[4]*100;
      for (let index of sortedIndexes) {
        temp[index] = y;
        y += value[index]*100
      }
      return temp;
    }

    this.proportionMatrix = this.countMatrix.map(calcProportion)
    this.positionMatrix = this.proportionMatrix.map(calculatePosition)
  }


  // Layout Positioning

  /**
  * Set rightViewHeigh, alignmentViewHeight, and canvasViewHeigh
  */
  updateViewHeights() {
    // order is important as subsequent calculations rely on previous updated values; These values are used to ensure the view heights are correct and scrolling occurs as expectd
    this.rightViewHeight = this.calculateRightHeight();
    this.alignmentViewHeight = this.calculateViewHeight();
    this.canvasViewHeight = this.calculateCanvasViewHeight();
  }

  /**
   * @returns the height needed to for all the elements on the right half of msa-viewer. If this height > available space, then scrolling will be used
   */
  calculateRightHeight(): number {
    let miniMapHeight = (this.widgets['alignView-showMiniMap']) ? $('#miniMapHolder').height()+16 : 0;
    // 170 alignmentTop, 17 bottomScrollBar, height of canvas
    return 170+25+this.nodesWithSeq.length*this.spanHeight+ miniMapHeight;
  }

  /**
   * @returns the height for msa-viewer element based on the minimum of the available space for the view and the height needed for the elements
   */
  calculateViewHeight(): number {
    return Math.min($(".msa-viewer-container").parent().height()-50, this.rightViewHeight)
  }

  /**
   * @returns the height for the canvasHolder element and then subsequently the canvasLabels element. Not the height of the canvas itself
   */
  calculateCanvasViewHeight(): number {
    let miniMapHeight = (this.widgets['alignView-showMiniMap']) ? $('#miniMapHolder').outerHeight() : 0;
    return Math.min(this.alignmentViewHeight - 170 - miniMapHeight, this.nodesWithSeq.length*this.spanHeight+25)
  }

  /**
   * @returns the width for the right half of the viewer
   */
  calculateRightWidth(): number {
    // 7: gap between left and right (5) + 2
    return $("#msa-viewer").width() - this.leftWidth - 7;
  }


  // Sizing
  
  /**
  * Updates font size as needed and then updates the alignment view based on new height
  */
  onSpanHeightChange(e) {
    if (e >= 16) {
      this.fontSize = 16;
      this.leftWidth=250;
    } else if (e >= 12) {
      this.fontSize = 12;
      this.leftWidth = 200;
    } else if (e >= 10) {
      this.fontSize = 10;
      this.leftWidth = 150;
    }

    this.rightWidth = this.calculateRightWidth();

    this.widgets['alignView-selectedSize']='c';
    this.widgets['alignView-spanHeight'] = e;
    this.updateAlignment();
  }

  /**
   * Updates the alignment view with the new width
   */
  onSpanWidthChange(e){
    this.widgets['alignView-selectedSize']='c';
    this.widgets['alignView-spanWidth'] = e
    this.updateAlignment();
  }

  /**
   * Updates spanHeight, spanWidth, fontSize, and sometimes charSetting and then updates alignment view with new settings
   */
  onSelectedSizeChanged() {
    if (this.widgets['alignView-selectedSize'] == 's') {
      this.spanHeight = 10;
      this.spanWidth = 2;
      this.widgets['alignView-charSetting'] = 'hide';
    } else if (this.widgets['alignView-selectedSize'] == 'm') {
      this.spanHeight = 12;
      this.spanWidth = 6;
      //this.charSetting = 'hide';
    } else if (this.widgets['alignView-selectedSize'] == 'l') {
      this.spanHeight = 16;
      this.spanWidth = 10;
      //this.charSetting = 'show';
    } else if (this.widgets['alignView-selectedSize'] == 'c') {
      
      if (!this.widgets['alignView-spanWidth']) {
        this.spanWidth = 10;
      } else {
        this.spanWidth = this.widgets['alignView-spanWidth']
      }

      if (!this.widgets['alignView-spanHeight']) {
        this.spanHeight = 16;
      } else {
        this.spanHeight = this.widgets['alignView-spanHeight']
      }
    }

    if (this.spanHeight >= 16) {
      this.fontSize = 16;
      this.leftWidth=250;
    } else if (this.spanHeight >= 12) {
      this.fontSize = 12;
      this.leftWidth = 200;
    } else if (this.spanHeight >= 10) {
      this.fontSize = 10;
      this.leftWidth = 150;
    }

    this.widgets['alignView-spanWidth'] = this.spanWidth;
    this.widgets['alignView-spanHeight'] = this.spanHeight;

    this.rightWidth = this.calculateRightWidth();
    this.updateAlignment();
  }


  // Colors

  /**
   * Updates the color scheme for the view based on what is selected
   * @param skipUpdateAlignment set to true during ngOnInit to skip this.updateAlignment() and if statement for this.updateMiniMap()
   */
  onSelectedColorChanged(skipUpdateAlignment=false) {
    if (this.widgets['alignView-colorSchemeName'] == 'n') {
      this.colorScheme = {
        'A': '#ccff00',
        'C': '#ffff00',
        'G': '#ff9900',
        'T': '#ff6600',
        'ambig': '#ffffff',
      }
      this.useCustomColorScheme = false;
    } else if (this.widgets['alignView-colorSchemeName'] == 'a') {
      this.colorScheme = {
        'A': '#009E73',
        'C': '#F0E442',
        'G': '#E69F00',
        'T': '#D55E00',
        'ambig': '#ffffff',
        }
        this.useCustomColorScheme = false;
    } else {
      this.colorScheme = {
        'A': this.widgets['alignView-customColorScheme']['A'],
        'C': this.widgets['alignView-customColorScheme']['C'],
        'G': this.widgets['alignView-customColorScheme']['G'],
        'T': this.widgets['alignView-customColorScheme']['T'],
        'ambig': this.widgets['alignView-customColorScheme']['ambig'],
        }
      this.useCustomColorScheme = true;

    }

    if (skipUpdateAlignment == false) {
      this.updateAlignment();
      if (this.widgets['alignView-showMiniMap']) {
        this.updateMiniMap();
      }
    }
  }

  /**
   * Updates the colorScheme for nt given with the e.target.value color
   * @param nt 'A' | 'C' | 'G' | 'T' | 'ambig'
   */
  updateColorScheme(nt, e) {
    this.colorScheme[nt] = e.target.value;
    this.widgets['alignView-customColorScheme'][nt] = e.target.value;
    this.updateAlignment();
    if (this.widgets['alignView-showMiniMap']) {
      this.updateMiniMap();
    }
  }

  /**
   * @param index 0=A, 1=C, 2=G, 3=T, anythingElse=ambig
   * @returns the value (hexvalue) from colorScheme based on the index given
   */
  fillColor(index:number) {
    if (index == 0) {
      return this.colorScheme['A'];
    } else if (index == 1) {
      return this.colorScheme['C'];
    } else if (index == 2) {
      return this.colorScheme['G'];
    } else if (index == 3) {
      return this.colorScheme['T'];
    } else {
      return this.colorScheme['ambig'];
    }
  }

  // Helper

  /**
   * Searches nodesWithSequences for name given; changes background color for all nodes that are found
   * @param name name/id of node to search for
   * @param field which field from node to search in
   */
  search(name: string, field: string) {
    $('.canvasLabels div').removeClass('searchHighlight2')
    if (name == "") {
      return;
    }

    let isFieldNumerical = typeof this.getData([this.nodesWithSeq[0]], field)[0] === 'number'

    let data = this.getData(this.nodesWithSeq, (field == 'index' ? ['index'] : ['index', field]))
    let indexes;
    if (isFieldNumerical) {
      indexes = data.filter((obj) => obj[field] == parseFloat(name)).map((obj) => obj['index'])
    } else {
      indexes = data.filter((obj) => obj[field].includes(name)).map((obj) => obj['index'])
    }
    //let indexes = this.nodesWithSeq.filter((obj) => obj.name.includes(name)).map((obj) => this.nodesWithSeq.indexOf(obj));
    if (indexes.length == 0) {
      console.log('not found');
      return;
    }

    for (let index of indexes) {
      //let element = $('.canvasLabels div').get(index);
      let element = $(`.canvasLabels div[data-index="${index}"]`)
      $(element).addClass('searchHighlight2')
    }

    // need to scroll if necessary
    let scroll = $('.canvasLabels').scrollTop();
    let topIndex = scroll/this.spanHeight;
    topIndex = (topIndex%1 > .2) ? Math.ceil(topIndex) : Math.floor(topIndex)
    let bottomIndex = Math.floor((this.canvasViewHeight-20) / this.spanHeight + topIndex -1);
    if (indexes[0] < topIndex || indexes[0] > bottomIndex) {
        let scrollPos = (indexes[0])*this.spanHeight -5
        $('.canvasLabels').scrollTop(scrollPos)
    }
    
  }

  /**
   * Opens settings pane
   */
  openSettings() {
    this.alignmentDialogSettings.isVisible ? this.alignmentDialogSettings.setVisibility(false) : this.alignmentDialogSettings.setVisibility(true);
  }

  /**
   * Updates text in Alignment Top
   */
  onAlignmentTopChange() {
    if (this.widgets['alignView-topDisplay'] == 'barplot') {
      $('#alignmnetTopTitle').text('Bar Plot').prop('title', 'Barplot representation of the sequences that shows the proportion of each nucleotide at each position.');
    } else {
      $('#alignmnetTopTitle').text('Logo').prop('title', 'Logo representation of the sequences that shows the proportion of each nucleotide at each position.');
    }
  }

  /** XXXX May need to remove; currently use position matrix instead of calculating each XXXX
   * @param i current index of the base/nt in proportion matrix
   * @param j A=0, C=1, G=2, T=3, other/ambiguos=4
   * @returns location for the y value of rectangle in the logo
   */
  calculateY(i:number, j:number) {
    if (j == 4) { return 0}
    let nt = this.proportionMatrix[i];
    let y = nt[4]*100;
    if (j==0) { return y }
    for (let k=0; k<j; k++) {
      y += nt[k]*100
    }
    return y;
  }

  /**
   * Sychronises horizonal scrolls on canvasHolder with alignmentTop and vertical scrolls on canvasHolder with canvasLabels
   * @param canvasHolder div class="canvasHolder"
   * @param canvasLabels div class="canvasLabels"
   * @param alignmentTop div class="alignmentTop"
   */
  canvasScroll(canvasHolder: HTMLElement, canvasLabels: HTMLElement, alignmentTop: HTMLElement) {
    if (canvasHolder.scrollLeft != alignmentTop.scrollLeft) {
      alignmentTop.scrollLeft = canvasHolder.scrollLeft
    }
    if (canvasHolder.scrollTop != canvasLabels.scrollTop) {
      canvasLabels.scrollTop = canvasHolder.scrollTop;
    }   
  }


  /**
  * Generate a tabular HTML string from the index of proportionMatrix
  * @param data index of the position to use to make the HTML string of the table
  * @returns an HTML string with a table representation of the data
  */
  tabulate(index) {

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
            padding: 2px;
            border: 1px solid #ddd;
        }
        
        #tooltip-table tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        
        #tooltip-table tr:nth-child(odd) {
            background-color: #fff;
        }
        </style>
        <div>Position: ${index}</div>
        <table id="tooltip-table"><thead><th>NT</th><th> % </th></thead><tbody>`;

        let data = this.proportionMatrix[index]
        for (let i = 0; i<5; i++) {
          tableHtml += '<tr>';
          if (i == 0) {
            tableHtml += '<td>A</td><td>' + (data[i]*100).toFixed(1) + '%</td>';
          } else if (i == 1) {
            tableHtml += '<td>C</td><td>' + (data[i]*100).toFixed(1) + '%</td>';
          } else if (i == 2) {
            tableHtml += '<td>G</td><td>' + (data[i]*100).toFixed(1) + '%</td>';
          } else if (i == 3) {
            tableHtml += '<td>T</td><td>' + (data[i]*100).toFixed(1) + '%</td>';
          } else {
            tableHtml += '<td>other</td><td>' + (data[i]*100).toFixed(1) + '%</td>'
          }
          tableHtml += '</tr>';
            
        }
        
    tableHtml += '</tbody></table>';

    return tableHtml;
  }

  /**
  * @returns an array [X, Y] of the position of mouse relative to alignment view. Global position (i.e. d3.event.pageX) doesn't work for a dashboard
  */  
  getRelativeMousePosition(e) {
    let rect = document.querySelector('alignmentviewcomponent').getBoundingClientRect();
    let X = e.pageX - rect.left;
    let Y = e.pageY - rect.top; 
    return [X, Y];
  }

  /**
   * Set events such as node-selected so that they can be triggered; such as with search
   */
  setEvents() {
    let that = this;

    $(document).on( "node-selected", function( ) {  
      that.search($('#search').val() as string, $('#search-field').val() as string)
    });

  }

  /**
   * updates labelArray and then searches again if needed
   */
  onLabelFieldChange() {
    this.labelArray = this.getData(this.nodesWithSeq, ['index', this.widgets['alignView-labelField']])
    
    if ($('#search').val() != "") {
      let that = this;
      setTimeout(
        () => that.search($('#search').val() as string, $('#search-field').val() as string),
        10)
    }
  }

  /**
   * Sorts the indexes in nodesWithSeq based on the field selected. 
   * After updating nodesWithSeq, it updates labelArray, seqArray, seqArrayShortened, main canvas, and minimap
   */
  onSortFieldChange() {
    let newSort;
    let sortField = this.widgets['alignView-sortField']
    if (sortField == "None") {
      return;
    } else if ( sortField == "index") {
      //return
      newSort = this.getData(this.nodesWithSeq, [sortField]).sort((a,b) => a[sortField] -b[sortField]);
      //this.nodesWithSeq.sort((a,b) => )
    } else if (typeof this.getData([this.nodesWithSeq[0]], sortField)[0] == 'number') {
      newSort = this.getData(this.nodesWithSeq, ['index', sortField]).sort((a,b) => a[sortField] - b[sortField]);
    } else {
      newSort = this.getData(this.nodesWithSeq, ['index', sortField]).sort((a,b) => a[sortField].localeCompare(b[sortField]));
    }

    // updates nodesWithSeq
    this.nodesWithSeq = newSort.map((obj) => obj['index'])
    // updates labelArray with new sort
    this.onLabelFieldChange();

    // updates seqArray with new order
    this.seqArray = this.getData(this.nodesWithSeq, 'seq');

    // updates seqArrayShortened with new order
    this.shortenNodesWithSeq();

    // updates main canvas and minimap canvas
    this.updateAlignment();
  }

  
  updateNodeColors() { }
  updateLinkColor() { }

  updateVisualization() {
    
  }

  openRefreshScreen() {
    
  }
  onRecallSession() {
    
  }
  onLoadNewData() {   
  }
  onFilterDataChange() {
    
  }

  /**
   * Opens the Alignment View Export Pain
  */
  openExport() {
    this.ShowAlignExportPane = true;
  }

  /**
   * Exports the alignmentTop and main canvas as png image
   */
  exportPNG() {
    let that = this;
    let alignmentTop = document.querySelector('#alignmentTop svg');
    let mainCanvas = $('.canvasHolder canvas').get(0) as HTMLCanvasElement
    let exportWidth = mainCanvas.width
    let exportHeight = mainCanvas.height + 140;
    svgAsPngUri(alignmentTop, {
      scale: 1,
      backgroundColor: '#ffffff',
      encoderType: 'image/png',
      encoderOptions: 0.8
    }).then((topB64string) => {
      let imageDataUrl;

      let exportCanvas = document.createElement("canvas");
      exportCanvas.height = exportHeight;
      exportCanvas.width = exportWidth;
      let ctx = exportCanvas.getContext("2d");

      let iTop = new Image();
      let iMain = new Image();
      iTop.src = topB64string;
      iTop.onload = function() {
        iMain.src = mainCanvas.toDataURL()
        iMain.onload = function() {

          ctx.drawImage(iTop, 0, 0)
          ctx.drawImage(iMain, 0, 140)

          imageDataUrl = exportCanvas.toDataURL("image/png")
          saveAs(imageDataUrl, that.AlignmentExportFileName + '.png')
        }
      }
  }); 
  }

  /**
   * Exports the alignment top and main canvas as svg or png image
   */
  exportVisualization() {
    $("body").css("cursor", "progress");
    if (this.AlignmentExportFileTypeVis == 'png') {
      this.exportPNG();
    } else {
      
    let canvas = $('.canvasHolder canvas').get(0) as HTMLCanvasElement
    let canvasDataURL = canvas.toDataURL();
  
    let foreignObj = document.createElementNS('http://www.w3.org/2000/svg', 'image')
    foreignObj.setAttribute('x', '0'); // Set the x-coordinate
    foreignObj.setAttribute('y', '140'); // Set the y-coordinate
    foreignObj.setAttribute('width', canvas.width.toString()); // Set the width
    foreignObj.setAttribute('height', canvas.height.toString()); // Set the height
    foreignObj.setAttribute('xlink:href', canvasDataURL);

    let top = $('#alignmentTop svg').get(0)
    top.style.height = 150+canvas.height+'px'
    top.appendChild(foreignObj);

    let content = this.commonService.unparseSVG(top);
    let blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, this.AlignmentExportFileName + '.svg');

    top.style.height = 150+canvas.height+'px';
    top.removeChild(foreignObj)
    }
    $("body").css("cursor", "default");
  }

  /**
   * Exports sequencing data (id + seq string) as fasta or mega file
   */
  exportData() {
    if (this.AlignmentExportFileTypeData == 'fasta') {
      let data = this.getData(this.nodesWithSeq, ['_id', 'seq'])
      let blob = new Blob([data.map(node => ">" + node._id + "\r\n" + node.seq).join("\r\n")])
      //saveAs(blob, 'hi.fasta')
      saveAs(blob, this.AlignmentExportFileName+'.fasta')
    } else if (this.AlignmentExportFileTypeData == 'mega') {
      let data = this.getData(this.nodesWithSeq, ['_id', 'seq'])
      let headers = "#mega\r\n!Title " + this.AlignmentExportFileName + ";\r\n!Format\r\n\tDataType=DNA CodeTable=Standard\r\n\tIdentical=. Missing=? Indel=-;\r\n\r\n"
      let blob = new Blob([headers, data.map(node => "#" + node._id + "\r\n" + node.seq).join("\r\n")])
      saveAs(blob, this.AlignmentExportFileName+'.meg')
    }
  }

}

export namespace AlignmentViewComponent {
  export const componentTypeName = 'Alignment View';
}

