import { Component, OnInit, Injector, Inject, ElementRef, ChangeDetectorRef, PipeTransform } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { BaseComponentDirective } from '@app/base-component.directive';
import { MicrobeTraceNextVisuals } from '@app/microbe-trace-next-plugin-visuals';
import { CommonService } from '@app/contactTraceCommonServices/common.service';
import { ComponentContainer } from 'golden-layout';

//import * as alignmentViewer from 'alignment-viewer';
//import MSAViewer from '@plotly/react-msa-viewer';

@Component({
  selector: 'AlignmentViewComponent',
  templateUrl: './alignment-view-plugin-component.html',
  styleUrls: ['./alignment-view-plugin-component.scss']
})
export class AlignmentViewComponent extends BaseComponentDirective implements OnInit {

  displaySettings: boolean = false;
  charSetting: string; // 'show', 'min', 'hide'
  charSettingOptions: any = [
    { label: 'Show', value: 'show' },
    { label: 'Minimum', value: 'min'},
    { label: 'Hide', value: 'hide' }
  ];
  testValNumber: number;
  testValOther;

  spanWidth: number;
  spanHeight: number;
  fontSize: number;
  
  nodesWithSeq: any[];
  longestSeqLength: number = 0;

  /**
   * count matrix: [ [#A, #C, #G, #T, #other/ambiguos]-for each location, ... ]
   */
  countMatrix;
  /**
   * proportion matrix: [ [A, C, G, T, #other/ambiguos]-for each location, ... ]
   */
  proportionMatrix;

  showHideOptions: any = [
    { label: 'Show', value: true },
    { label: 'Hide', value: false }
  ];

  sizes = [
    { label: 'Small', value: 's'},
    { label: 'Medium', value: 'm'},
    { label: 'Large', value: 'l'},
    { label: 'Custom', value: 'c'}
  ]
  selectedSize: string;

  colorScheme;
  customColorScheme: boolean = false;
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

  alignmentViewHeight: number;
  rightViewHeight: number;
  canvasViewHeight: number;

  leftWidth: number;
  rightWidth: number;

  private visuals: MicrobeTraceNextVisuals;
  widgets;

  testSeq: any[];

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
    this.setEvents();
    this.nodesWithSeq = [];
    this.commonService.session.data.nodes.forEach(node => {
      if (node.seq != null){
        this.nodesWithSeq.push({
          'name': node._id, 
          'seq': node.seq.toUpperCase(),
        })
        if (node.seq.length > this.longestSeqLength) {
          this.longestSeqLength = node.seq.length;
        }
      }

    })

    this.calculateProportionAtEachLocation();

    this.selectedSize= 'l';
    this.colorScheme = {
      'A': '#ccff00',
      'C': '#ffff00',
      'G': '#ff9900',
      'T': '#ff6600',
      'ambig': '#ffffff',
    } 
    this.onSelectedSizeChanged()

    // order is important as subsequent calculations rely on previous updated values; These values are used to ensure the view heights are correct and scrolling occurs as expectd
    this.rightViewHeight = this.calculateRightHeight();
    this.alignmentViewHeight = this.calculateViewHeight();
    this.canvasViewHeight = this.calculateCanvasViewHeight();
    
    this.updateMiniMap();
  }

  /**
   * Updates the alignment by generating a new canvas, and recalcuating various heights
   */
  updateAlignment() {
    this.generateCanvas(this.nodesWithSeq, {width: this.spanWidth, height: this.spanHeight, charSetting: this.charSetting, fontSize: this.fontSize, colors: this.colorScheme}).then(function(canvas: HTMLCanvasElement) {
      $('#msa-viewer .canvasHolder').empty().append(canvas)
      //$canvas.addClass('testABC')
      //document.body.appendChild(canvas)
    })
    
    // order is important as subsequent calculations rely on previous updated values; These values are used to ensure the view heights are correct and scrolling occurs as expectd
    this.rightViewHeight = this.calculateRightHeight();
    this.alignmentViewHeight = this.calculateViewHeight();
    this.canvasViewHeight = this.calculateCanvasViewHeight();
  }

  /**
   * Creates a minimap with width of one pixel / nucleotide; therfore total width=#number of nucleotides for longest sequence
   * Need it to be thin (i.e. 200bp wide); may downsample by picking 1 nt / every n nucleotides to display.
   */
  updateMiniMap() {
    this.generateCanvas(this.nodesWithSeq, {width: 1, height: 1, charSetting: 'hide', fontSize: 1, colors: this.colorScheme}).then(function(canvas: HTMLCanvasElement) {
      //let YScale = canvas.height > 200 ? 0.5 : 1;
      //let XScale = canvas.width > 200 ? 200/canvas.width : 1;
      //let canvasImage = canvas.getContext('2d');
      //canvasImage.scale(.2, 1);
      //canvas.width = 700;
      console.log('abc', canvas.height, canvas.width);
      $('#miniMap').empty().append(canvas)
      console.log('def');
    })
  }

  /**
   * @returns the height for the canvasHolder element and then subsequently the canvasLabels element. Not the height of the canvas itself
   */
  calculateCanvasViewHeight(): number {
    return Math.min(this.alignmentViewHeight-170, this.nodesWithSeq.length*this.spanHeight+25)
  }

  /**
   * @returns the height for msa-viewer element based on the minimum of the available space for the view and the height needed for the elements
   */
  calculateViewHeight(): number {
    return Math.min($(".msa-viewer-container").parent().height()-50, this.rightViewHeight)
  }

  /**
   * @returns the height needed to for all the elements on the right half of msa-viewer. If this height > available space, then scrolling will be used
   */
  calculateRightHeight(): number {
    // 170 alignmentTop, 17 bottomScrollBar, height of canvas
    return 170+25+this.nodesWithSeq.length*this.spanHeight;
  }

  calculateRightWidth(): number {
    // 7: gap between left and right (5) + 2
    return $("#msa-viewer").width() - this.leftWidth - 7;
  }

  /**
   * Opens settings pane
   */
  openSettings() {
    this.displaySettings = !this.displaySettings;
  }

  /**
   * Ultimately will be used for exporting elements of the view; for now, used to for testing
   */
  openExport() {
    // updating the mini map info
    console.log('change color now')
    this.updateMiniMap();
    setTimeout(() => {
      //canvas.width = 700;
      //console.log('abc', canvas.height, canvas.width);
      let cc = $('#miniMap canvas')[0] as HTMLCanvasElement;
      
      //let ccTV = cc.getContext('2d');
      //ccTV.save();
      //cc.width = 250;
      //ccTV.restore();
    }, 5000)
    

  }

  /**
   * Searches nodesWithSequences for name given; adds a highlight box to that node
   * XXXXX think about another implementation where the background color is changed for the div/s found XXXXX
   * @param name name/id of node to search for
   */
  search(name: string) {
    let index = this.nodesWithSeq.findIndex((obj) => obj.name == name);
    if (index == -1) {
      return;
    }
    let newTop =  (index*this.spanHeight)
    $('#searchHighlight').css({top: newTop+'px', display: "block"})

    // determines if scrolling is needed to bring index into view
    let scroll = $('.canvasLabels').scrollTop();
    let topIndex = scroll/this.spanHeight;
    topIndex = (topIndex%1 > .2) ? Math.ceil(topIndex) : Math.floor(topIndex)
    let bottomIndex = Math.floor((this.canvasViewHeight-20) / this.spanHeight + topIndex -1);
    if (index < topIndex || index > bottomIndex) {
      let scrollPos = (index)*this.spanHeight -5
      $('.canvasLabels').scrollTop(scrollPos)
    } 
  }



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

    this.selectedSize='c';
    this.updateAlignment();
  }

  /**
   * Updates the alignment view with the new width
   */
  onSpanWidthChange(e){
    this.selectedSize='c';
    this.updateAlignment();
  }

  /**
   * Updates spanHeight, spanWidth, fontSize, and sometimes charSetting and then updates alignment view with new settings
   */
  onSelectedSizeChanged() {
    if (this.selectedSize == 's') {
      this.spanHeight = 10;
      this.spanWidth = 2;
      this.fontSize = 10;
      this.leftWidth = 150;
      this.charSetting = 'hide';
    } else if (this.selectedSize == 'm') {
      this.spanHeight = 10;
      this.spanWidth = 6;
      this.fontSize = 12;
      this.leftWidth = 200;
      //this.charSetting = 'hide';
    } else if (this.selectedSize == 'l') {
      this.spanHeight = 16;
      this.spanWidth = 10;
      this.fontSize = 16;
      this.leftWidth = 250;
      //this.charSetting = 'show';
    }


    this.rightWidth = this.calculateRightWidth();
    this.updateAlignment();
  }

  /**
   * Calculates the count and proportion of each base at each position
   */
  calculateProportionAtEachLocation() {
    // count matrix: [ [#A, #C, #G, #T, #other/ambiguos]-for each location, ... ]
    this.countMatrix = [];
    this.proportionMatrix = [];

    for (let i =0; i<this.longestSeqLength; i++) {
      this.countMatrix.push([0,0,0,0,0]);
    }

    for (let node of this.nodesWithSeq) {
      for (let i=0; i< node.seq.length; i++) {
        let nt = node.seq[i];
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
    this.proportionMatrix = this.countMatrix.map(calcProportion)
  }

  /**
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
   * Updates the color scheme for the view based on what is selected
   * @param e 'n' | 'a' | 'c'
   */
  onSelectedColorChanged(e) {
    if (e == 'n') {
      this.colorScheme = {
        'A': '#ccff00',
        'C': '#ffff00',
        'G': '#ff9900',
        'T': '#ff6600',
        'ambig': '#ffffff',
      }
      this.customColorScheme = false;
    } else if (e == 'a') {
      this.colorScheme = {
        'A': '#009E73',
        'C': '#F0E442',
        'G': '#E69F00',
        'T': '#D55E00',
        'ambig': '#ffffff',
        }
        this.customColorScheme = false;
    } else {
      this.customColorScheme = true;
    }

    this.updateAlignment();
  }

  /**
   * Updates the colorScheme for nt given with the e.target.value color
   * @param nt 'A' | 'C' | 'G' | 'T' | 'ambig'
   */
  updateColorScheme(nt, e) {
    this.colorScheme[nt] = e.target.value;
    this.updateAlignment();
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
   * Adapted from  https://github.com/CDCgov/AlignmentViewer
   * XXXXX need to be moved out of alignment-view-plugin-component, so that it can be accessed from files view before launching MT XXXXX
   * @param seqs list of seq objects [{seq: 'ATCA...', ...},]
   * @param config  object: { width: number, height: number, charSetting:['hide'|'show'|'min'], fontSize: number, colors: {'A':'#000000', 'C': , 'G':, 'T':, 'ambig':}}
   * @returns promise of a HTMLCanvasElement showing the alignment
   */
  generateCanvas(seqs, config) {
    config = Object.assign({
      width: 1,
      height: 1,
      'charSetting': 'hide'
    }, config, {
      colors: Object.assign({
        'A': '#ccff00',
        'C': '#ffff00',
        'G': '#ff9900',
        'T': '#ff6600',
        'ambig': '#ffffff'
      }, ('colors' in config) ? config.colors : {}),
    });
  
    return new Promise(resolve => {
      let longest = 0;
      let n = seqs.length;
      for (let i = 0; i < n; i++) {
        let s = seqs[i];
        let seq = s.seq.toUpperCase();
        if (seq.length > longest) longest = seq.length;
      }
      let ch = Math.ceil(config.height);
      let cw = Math.ceil(config.width);
      let width = longest * config.width;
      let height = seqs.length * config.height;
      let canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      let context = canvas.getContext('2d', { alpha: false });
      context.fillStyle = config.colors['ambig'];
      context.fillRect(0, 0, width, height);
      Object.keys(config.colors).forEach(nucleotide => {
        if(nucleotide == 'ambig') return;
        context.fillStyle = config.colors[nucleotide];
        for (let row = 0; row < n; row ++) {
          let seq = seqs[row].seq;
          let y = Math.floor(row * ch);
          for (let col = 0; col < longest; col++) {
            let c = seq[col];
            if(!c) break;
            if(c != nucleotide) continue;
            let x = Math.floor(col * cw);
            context.fillRect(x, y, cw, ch);
          }
        }
      });
      context.font = (config.fontSize) + 'px mono';
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      context.fillStyle = 'black';
      if(config.charSetting=='show'){
        for (let row = 0; row < n; row++) {
          let seq = seqs[row].seq;
          let y = row * ch + ch;
          for (let col = 0; col < longest; col++) {
            let c = seq[col];
            if(!c) break;
            let x = col * cw + cw/2;
            context.fillText(c, x, y, cw);
          }
        }
      } else if (config.charSetting=='min'){
        let refSeq = seqs[0].seq
        for (let col = 0; col < longest; col++) {
          let c = refSeq[col];
          if(!c) break;
          let x = col * cw + cw/2;
          context.fillText(c, x, ch, cw);
        }

        for (let row = 1; row < n; row++) {
          let seq = seqs[row].seq;
          let y = row * ch + ch;
          for (let col = 0; col < longest; col++) {
            let c = (refSeq[col] != seq[col] || seq[col]=='-')? seq[col]: '.';
            if(!c) break;
            let x = col * cw + cw/2;
            context.fillText(c, x, y, cw);
          }
        } 

      }
      resolve(canvas);
    });
  }

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
    $('#tooltip').html(htmlString)
    $('#tooltipHolder').css({'display': 'block', 'position': 'absolute', 'left': offsetX + 'px', 'top': offsetY + 'px'})
  }

  /**
   * Hides the tooltip
   */
  hideTooltip() {
    $('#tooltip').html("")
    $('#tooltipHolder').css({'display': 'none'})
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
      if ($('#search-field').val() != '_id') {
        console.log('can only search in alignment view with id')
        return;
      }
      that.search($('#search').val() as string)
    });

  }

  // XXXXX come back here when/if I want to do/try magnification
  onSearch() {
    //let imgID = "Angular";
    let cc = $('.canvasHolder canvas')[0] as HTMLCanvasElement;
    

    let canvasImage = cc.getContext('2d');
    //let canvasSubset = canvasImage.drawImage(cc, ) 
    // drawImage of canvasSubset, use toDataURL on canvasElement as background image to magnifier;
    // at the same time increase font size of label
    
    //this.magnify("myimage", 3);
  }
  magnify(imgID, zoom) {
    var img, glass, w, h, bw;
    img = document.getElementById(imgID);
    /*create magnifier glass:*/
    glass = document.createElement("DIV");
    glass.setAttribute("class", "img-magnifier-glass");
    /*insert magnifier glass:*/
    img.parentElement.insertBefore(glass, img);
    /*set background properties for the magnifier glass:*/
    glass.style.backgroundImage = "url('" + img.src + "')";
    glass.style.backgroundRepeat = "no-repeat";
    glass.style.backgroundSize =
      img.width * zoom + "px " + img.height * zoom + "px";
    bw = 3;
    w = glass.offsetWidth / 2;
    h = glass.offsetHeight / 2;
    /*execute a function when someone moves the magnifier glass over the image:*/
    glass.addEventListener("mousemove", moveMagnifier);
    img.addEventListener("mousemove", moveMagnifier);
    /*and also for touch screens:*/
    glass.addEventListener("touchmove", moveMagnifier);
    img.addEventListener("touchmove", moveMagnifier);
    function moveMagnifier(e) {
      var pos, x, y;
      /*prevent any other actions that may occur when moving over the image*/
      e.preventDefault();
      /*get the cursor's x and y positions:*/
      pos = getCursorPos(e);
      x = pos.x;
      y = pos.y;
      /*prevent the magnifier glass from being positioned outside the image:*/
      if (x > img.width - w / zoom) {
        x = img.width - w / zoom;
      }
      if (x < w / zoom) {
        x = w / zoom;
      }
      if (y > img.height - h / zoom) {
        y = img.height - h / zoom;
      }
      if (y < h / zoom) {
        y = h / zoom;
      }
      /*set the position of the magnifier glass:*/
      glass.style.left = x - w + "px";
      glass.style.top = y - h + "px";
      /*display what the magnifier glass "sees":*/
      glass.style.backgroundPosition =
        "-" + (x * zoom - w + bw) + "px -" + (y * zoom - h + bw) + "px";
    }
    function getCursorPos(e) {
      var a,
        x = 0,
        y = 0;
      e = e || window.event;
      /*get the x and y positions of the image:*/
      a = img.getBoundingClientRect();
      /*calculate the cursor's x and y coordinates, relative to the image:*/
      x = e.pageX - a.left;
      y = e.pageY - a.top;
      /*consider any page scrolling:*/
      x = x - window.pageXOffset;
      y = y - window.pageYOffset;
      return { x: x, y: y };
    }
  }

}



export namespace AlignmentViewComponent {
  export const componentTypeName = 'Alignment View';
}

