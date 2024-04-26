import { Component, ElementRef, EventEmitter, ChangeDetectorRef, Inject, OnInit, Output, ViewChild } from '@angular/core';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import { BaseComponentDirective } from '@app/base-component.directive';
import { MicobeTraceNextPluginEvents } from '@app/helperClasses/interfaces';
import { ComponentContainer } from 'golden-layout';
import * as d3 from 'd3';
import moment from 'moment';
import { MicrobeTraceNextVisuals } from '@app/microbe-trace-next-plugin-visuals';

import * as saveAs from 'file-saver';
import { saveSvgAsPng } from 'save-svg-as-png';
import { window, TabsetComponent } from 'ngx-bootstrap';
import { SelectItem } from 'primeng/api';


@Component({
  selector: 'app-timeline-component',
  templateUrl: './timeline-component.component.html',
  styleUrls: ['./timeline-component.component.scss']
})
export class TimelineComponent extends BaseComponentDirective implements OnInit, MicobeTraceNextPluginEvents {

  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();

  @ViewChild('epiCurve') epiCurveElement: ElementRef;
  @ViewChild('epiCurveSVG') epiCurveSVGElement: ElementRef;
  viewActive: boolean = true;

  private visuals: MicrobeTraceNextVisuals;

  FieldList: SelectItem[] = [];
  SelectedDateFieldVariable;
  SelectedDateFieldVariable2;
  SelectedDateFieldVariable3;
  binSizes = ['Day', 'Week', 'Month', 'Quarter', 'Year']
  SelectedBinSize = 'Month';
  useNodeColorsOptions = [true, false]
  useNodeColors: boolean = true;
  SelectedNodeColorVariable;
  SelectedNodeColorVariable2;
  SelectedNodeColorVariable3;
  tickInterval;

  graphTypes = ['Single Date Field', 'Multi: Side by Side', 'Multi: Overlay']
  selectedGraphType = 'Multi: Overlay';
  legendPositionOptions = ['Hide', 'Left', 'Right', 'Bottom']
  selectedLegendPosition = 'Left'

  ShowEpiSettingsPane: boolean = false;
  ShowEpiExportPane: boolean = false;
  EpiExportFileName: string = "";
  EpiExportFileType: string = "png";
  SelectedNetworkExportScaleVariable: any = 1;
  SelectedNetworkExportQualityVariable: any = 0.92;
  CalculatedResolution: string;

  cumulative = false;
  private svg;
  private margin = { top: 5, left: 25, right: 25, bottom: 50 };
  private width; // Default width, adjust as necessary
  private height; // Default height, adjust as necessary
  private middle;
  private x;
  private y;
  private histogram;
  private brush;
  private brushG;
  private selection;
  private timer;
  private tick = 0;
  private isPlaying = false;

  private vnodes = []; // Replace with your actual data
  private timeDomainStart;
  private timeDomainEnd;

  constructor(
    private commonService: CommonService,
    @Inject(BaseComponentDirective.GoldenLayoutContainerInjectionToken) private container: ComponentContainer,
    elRef: ElementRef,
    private cdref: ChangeDetectorRef
    ) {

      super(elRef.nativeElement);
      this.visuals = commonService.visuals;
      this.commonService.visuals.epiCurve = this;

  }
  ngOnInit() {

    // populate this.twoD.FieldList with [None, ...nodeFields]
    this.visuals.epiCurve.FieldList = [];
    this.visuals.epiCurve.FieldList.push({ label: "None", value: "None" });
    this.visuals.epiCurve.commonService.session.data['nodeFields'].map((d, i) => {
        if (d != 'seq' && d != 'sequence') {
            this.visuals.epiCurve.FieldList.push(
                {
                    label: this.visuals.epiCurve.commonService.capitalize(d.replace("_", "")),
                    value: d
                });
        }

    });

    this.useNodeColors = false;
    this.SelectedNodeColorVariable = '#f5d742';
    this.SelectedNodeColorVariable2 = '#f20fff';
    this.SelectedNodeColorVariable3 = '#20ff1a';
    this.tickInterval = 1;

    this.SelectedDateFieldVariable = 'None';
    this.SelectedDateFieldVariable2 = 'None';
    this.SelectedDateFieldVariable3 = 'None';

    //this.commonService.session.style.widgets["epi-timeline-date-field"] = 'ipstart';
    this.SelectedDateFieldVariable = this.commonService.session.style.widgets["epi-timeline-date-field"];
    //this.SelectedDateFieldVariable2 = 'ipend';
    //this.SelectedDateFieldVariable3 = 'Diagnosis date'
    if (this.commonService.session.style.widgets["epi-timeline-date-field"] || !this.FieldList.includes(this.commonService.session.style.widgets["epi-timeline-date-field"])) {
      this.ShowEpiSettingsPane = true;
    }
    
 }

 ngAfterViewInit() {

  // this.initializeD3Chart();
  this.setupEventListeners();
  this.onGraphTypeChange(false);
  this.refresh();
  console.log(this.commonService.session.style.widgets["node-color"]);
 }
  
/**
 * Clears previous histogram/epi curve and creates a new one; calls refresh multi if needed
 */
public refresh(): void {
  if (this.selectedGraphType=='Multi: Overlay' || this.selectedGraphType=='Multi: Side by Side') {
    this.refreshMulti();
    return;
  }

  $('#epiCurveSVG').empty()

  this.updateSizes();
  if (this.height < 0) {
    return;
  }

  const field = this.SelectedDateFieldVariable;
  let times = this.getTimes([field]);

  // updates this.timeDomainStart and this.timeDomainInterval and returns the bin interval
  let binInterval = this.calculateBinInterval(times);
  if (binInterval == 0) {
    return;
  }

  this.x = d3.scaleTime().domain([this.timeDomainStart, this.timeDomainEnd]).rangeRound([0, this.width]).nice();
  this.y = d3.scaleLinear().range([this.height, 0]);

  this.histogram = d3.histogram().value(d => d[field as string]).domain(this.x.domain()).thresholds(binInterval);

  this.svg = d3.select(this.epiCurveSVGElement.nativeElement)
    .attr("width", this.width + this.margin.left + this.margin.right)
    .attr("height", this.height + this.margin.top + this.margin.bottom)
    //.attr("transform", `translate(0, ${this.margin.top})`);
    

  const epiCurve = this.svg.append("g")
    .classed("epiCurve-epi-curve", true)
    .attr("transform", `translate(${this.margin.left}, 5)`);

  let bins = this.histogram(this.vnodes);
  
  let colorVariable = this.commonService.session.style.widgets['node-color-variable'];
  let nodeColorKeys;
  if (colorVariable != 'None' && this.useNodeColors) {
    nodeColorKeys = this.commonService.session.style.nodeColorsTableKeys[colorVariable].map(value => value=='null' ? null: value);
  } 

  let maxCount = 0;
  [maxCount, bins] = this.updateBins(bins, colorVariable, nodeColorKeys);
  

  this.y.domain([0, maxCount]).nice()//d3.max(bins, d => d.length)]);

  if (this.useNodeColors && colorVariable != 'None') {
    let nodeColors = [];

    nodeColorKeys.forEach((value, ind) =>{
      epiCurve.selectAll(`rect${ind}`)
      .data(bins)
      .enter()
      .append("rect")
      .attr("transform", d => `translate(${this.x(d.x0)}, ${this.y(d.height[ind])})`)
      .attr("width", d => this.x(d.x1) - this.x(d.x0))
      .attr("height", d => this.height - this.y(d.length2[ind]))
      .attr("fill", this.commonService.temp.style.nodeColorMap(value) )

      nodeColors.push(this.commonService.temp.style.nodeColorMap(value));
    })
    this.generateLegend(epiCurve, nodeColors,nodeColorKeys)
  } else {
    let color = this.useNodeColors ? this.commonService.session.style.widgets["node-color"] : this.SelectedNodeColorVariable;
    epiCurve.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("transform", d => `translate(${this.x(d.x0)}, ${this.y(d.length)})`)
      .attr("width", d => this.x(d.x1) - this.x(d.x0))
      .attr("height", d => this.height - this.y(d.length))
      .attr("fill", color);

    this.generateLegend(epiCurve, [color] ,[this.SelectedDateFieldVariable])
  }

  this.updateAxes();
} 

/**
 * Updated version of refresh that works for multiple date fields to generate the epi curve graph
 * Calls refresh() instead if needed
 */
private refreshMulti(): void {
  if (this.selectedGraphType=='Single Date Field') {
    this.refresh();
    return;
  }

  $('#epiCurveSVG').empty()

  this.updateSizes();
  if (this.height < 0) {
    return;
  }

  let fields = [];
  let colors = [];
  [this.SelectedDateFieldVariable, this.SelectedDateFieldVariable2, this.SelectedDateFieldVariable3].forEach((dateField, ind) => {
    if (dateField != 'None') {
      fields.push(dateField);
      colors.push([this.SelectedNodeColorVariable, this.SelectedNodeColorVariable2, this.SelectedNodeColorVariable3][ind])
    }
  })

  if (fields.length == 0) {
    return;
  }
  // current implementation of times is only used to calculate min and max time of all data given when setting up x axis and bins; there isn't a current need to link times by datapoint with times
  let times = this.getTimes(fields);

  // updates this.timeDomainStart and this.timeDomainInterval and returns the bin interval
  let binInterval = this.calculateBinInterval(times);
  if (binInterval == 0) {
    return;
  }

  this.x = d3.scaleTime().domain([this.timeDomainStart, this.timeDomainEnd]).rangeRound([0, this.width]).nice();
  this.y = d3.scaleLinear().range([this.height, 0]);

  this.histogram = d3.histogram().domain(this.x.domain()).thresholds(binInterval);

  this.svg = d3.select(this.epiCurveSVGElement.nativeElement)
    .attr("width", this.width + this.margin.left + this.margin.right)
    .attr("height", this.height + this.margin.top + this.margin.bottom)
    .attr("transform", `translate(0, ${this.margin.top})`);
    

  const epiCurve = this.svg.append("g")
    .classed("epiCurve-epi-curve", true)
    .attr("transform", `translate(${this.margin.left}, 5)`);

  let maxCount = 0;
  let bins = [];
  fields.forEach((field) => {
    if (field != 'None') {
      let currentCount = 0;
      let currentbin = this.histogram(this.vnodes.map((d) => d[field]).filter(value => value != null));
      [currentCount, currentbin] = this.updateBins(currentbin);
      bins.push(currentbin)
      if (currentCount > maxCount) maxCount = currentCount;
    }
  })

  this.y.domain([0, maxCount]).nice();

  if (this.selectedGraphType == 'Multi: Overlay') {
    fields.forEach((_, ind) => {
        epiCurve.selectAll(`rect${ind}`)
        .data(bins[ind])
        .enter()
        .append("rect")
        .attr("transform", d => `translate(${this.x(d.x0)}, ${this.y(d.length)})`)
        .attr("width", d => this.x(d.x1) - this.x(d.x0))
        .attr("height", d => this.height - this.y(d.length))
        .attr("fill", colors[ind])
        .attr("opacity", 0.6);
    })

  } else {
    let numberOfBins = fields.length;
    let width;
    let xOffset = [];
    if (numberOfBins == 1) {
      width = (d) => this.x(d.x1)- this.x(d.x0);
      xOffset = [
        function(d, c) {return c.x(d.x0)}
      ]
    } else if (numberOfBins == 2) {
      width = (d) => (this.x(d.x1)- this.x(d.x0))/2
      xOffset = [
        function(d, c) {return c.x(d.x0)},
        function(d, c) {return c.x(d.x0)+(c.x(d.x1) - c.x(d.x0))/2}
      ]
    } else {
      width = (d) => (this.x(d.x1)- this.x(d.x0))/3;
      xOffset = [
        function(d, c) { return c.x(d.x0)},
        function(d, c) { return c.x(d.x0)+(c.x(d.x1) - c.x(d.x0))/3},
        function(d, c) { return c.x(d.x0)+2*(c.x(d.x1) - c.x(d.x0))/3}
      ]
    }
    
    let that = this;

    fields.forEach((_, ind) => {
        epiCurve.selectAll(`rect${ind}`)
        .data(bins[ind])
        .enter()
        .append("rect")
        .attr("transform", d => `translate(${xOffset[ind](d, that)}, ${this.y(d.length)})`)
        .attr("width", width)
        .attr("height", d => this.height - this.y(d.length))
        .attr("fill", colors[ind]);
    });
  }

  this.updateAxes();
  this.generateLegend(epiCurve, colors, fields)
} 

updateSizes() {
  const wrapper = $(this.epiCurveElement.nativeElement).parent();
  $('#epiCurve').height(wrapper.height() - 50);
  this.width = wrapper.width() - this.margin.left - this.margin.right;
  // height represents the height of y axis
  this.height = wrapper.height() - this.margin.top - this.margin.bottom - 50;
  this.middle = this.height / 2;
}

getTimes(fields) {
  let times = [];
  this.vnodes = JSON.parse(JSON.stringify(this.commonService.session.data.nodes));
  this.vnodes.forEach(d => {
    fields.forEach(field => {
      const time = moment(d[field as string]); // Cast 'field' as string
      if (time.isValid()) {
        d[field as string] = time.toDate();
        times.push(d[field as string]); // Cast 'field' as string
      } else {
        d[field as string] = null; // Cast 'field' as string
      }
    })
  });

  if (times.length < 2) {
    times = [new Date(2000, 1, 1), new Date()];
  }
  return times;
}

updateAxes() {
  let [xAxis, xLabelOffset] = this.configureXAxisSettings();

  this.svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(${this.margin.left}, ${this.height+5})`)
    .call(xAxis)
    .attr("text-anchor", "center")
    .selectAll("text")
    .attr("x", xLabelOffset);

  this.svg.append("g")
    .attr("class", "axis axis--y")
    .attr("transform", `translate(${this.margin.left}, 5)`)
    .call(d3.axisLeft(this.y))
    .attr("text-anchor", null)
    .selectAll("text")
    .attr("x", 6);

  this.svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "center")
    .attr("x", this.width/2)
    .attr("y", this.height + 40)
    .text(`Date (${this.SelectedBinSize=='Day'? 'Dai': this.SelectedBinSize}ly Bins)`);

  this.svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "center")
    .attr("y", 15)
    .attr("x", -this.middle-this.margin.top-this.margin.bottom)
    .attr("transform", "rotate(-90)")
    .text("Number of Cases");

  /*this.brush = d3.brushX()
    .extent([[0, 0], [this.width, this.height]])
    .on("start brush", () => {
      this.selection = d3.brushSelection(this.brushG.node());
      if (!this.selection) return;
      if (this.selection[0] > 0) {
        this.selection[0] = 0;
        this.brushG.call(this.brush.move, this.selection);
      }
    })
    .on("end", function () {
      this.selection = d3.brushSelection(this.brushG.node());
      if (!this.selection) return;
      if (this.selection[0] > 0) {
        this.selection[0] = 0;
        this.brushG.call(this.brush.move, this.selection);
        this.propagate();
      }
    });

    this.brushG = this.svg
    .append("g")
    .attr("class", "brush")
    .attr("transform", "translate(" + this.margin.left + ",0)")
    .call(this.brush);
    */

}

generateLegend(epiCurve, colors, fieldNames) {
  let xOffset = 50; // default for left position
  if (this.selectedLegendPosition == 'Hide') {
    return;
  } else if (this.selectedLegendPosition == 'Bottom') {
    let prevLength = 0;
    let rowCount = 0;
    let y = this.height + 50;
    if (this.selectedGraphType=='Single Date Field' && this.useNodeColors && this.commonService.session.style.widgets['node-color-variable'] != 'None') {
      let field = this.commonService.capitalize(this.commonService.session.style.widgets['node-color-variable']);
      epiCurve.append("text").attr("x", 70).attr("y", y).text(field + ': ').style("font-size", "15px").attr("alignment-baseline","middle")
      prevLength += field.length + 3;
    }
    fieldNames.forEach((name, i) => {
      let nLength = name==null ? 7: name.length
      let baseX = 70+40*(rowCount) + prevLength*7.5;
      if (baseX+24+nLength*3 > this.width-70) {
        rowCount = 0;
        y += 30;
        prevLength = 0;
        baseX = 70;
      }

      epiCurve.append("circle").attr("cx", baseX).attr("cy", y).attr("r", 6).style("fill", colors[i])
      epiCurve.append("text").attr("x", baseX+10).attr("y", y).text(this.commonService.capitalize(name==null? '(Empty)': name)).style("font-size", "15px").attr("alignment-baseline","middle")

      prevLength += nLength;
      rowCount += 1;
    })
    return;
  } else if (this.selectedLegendPosition == 'Right') {
    xOffset = this.width - 120;
  }
  let count = 0;
  if (this.selectedGraphType=='Single Date Field' && this.useNodeColors && this.commonService.session.style.widgets['node-color-variable'] != 'None') {
    let field = this.commonService.capitalize(this.commonService.session.style.widgets['node-color-variable']);
    epiCurve.append("text").attr("x", xOffset).attr("y", 30).text(field + ': ').style("font-size", "15px").attr("alignment-baseline","middle")
    count += 1;
  }
  fieldNames.forEach((name, i) => {
    epiCurve.append("circle").attr("cx",xOffset).attr("cy",30*(count+1)).attr("r", 6).style("fill", colors[i])
    epiCurve.append("text").attr("x", xOffset+20).attr("y", 30*(count+1)).text(this.commonService.capitalize(name==null? '(Empty)': name)).style("font-size", "15px").attr("alignment-baseline","middle")
    count += 1;
  })
}

private setupEventListeners(): void {

  $('#timeline-play').click(() => {
    if (this.isPlaying) {
      $('#timeline-play').html('<span class="oi oi-media-play"></span>');
      this.stopTimeline();
    } else {
      $('#timeline-play').html('<span class="oi oi-media-pause"></span>');
      this.startTimeline();
    }
  });


  /*$('[name="timeline-cumulation"]').on('change', () => {
    console.log('cum 1');
    this.cumulative = $("#timeline-noncumulative").is(":checked");
    this.commonService.session.style.widgets["timeline-noncumulative"] =  $("#timeline-noncumulative").is(":checked");
    this.refresh();
  });*/

  $(window).on('node-color-change', () => {
    this.svg.selectAll(".epiCurve-epi-curve rect")
      .attr("fill", this.commonService.session.style.widgets["node-color-variable"]);
  });

  $('#timeline-speed').on('change', () => {
    this.setTimer();
  });

  this.container.on('resize', () => { this.goldenLayoutComponentResize() })
  this.container.on('hide', () => { 
    this.viewActive = false; 
    this.cdref.detectChanges();
  })
  this.container.on('show', () => { 
    this.viewActive = true; 
    this.cdref.detectChanges();
  })
}

/**
 * Updates this.timeDomainStart and this.timeDomainEnd based on dates and this.SelectedBinSize;
 * 
 * @param times array of date objects
 * @returns return a d3 time range such as d3.timeMonth.range()
 */
calculateBinInterval(times) {
  let minTime = Math.min(...times);
  let maxTime = Math.max(...times);

  if (this.SelectedBinSize == 'Day') {
    this.timeDomainStart = d3.timeMonth(minTime);
    this.timeDomainEnd = d3.timeMonth.ceil(maxTime);
    return d3.timeDay.range(this.timeDomainStart, this.timeDomainEnd);
  } else   if (this.SelectedBinSize == 'Week') {
    this.timeDomainStart = d3.timeMonth(minTime);
    this.timeDomainEnd = d3.timeMonth.ceil(maxTime);
    return d3.timeMonday.range(this.timeDomainStart, this.timeDomainEnd);
  } else   if (this.SelectedBinSize == 'Month') {
    this.timeDomainStart = d3.timeMonth(minTime);
    this.timeDomainEnd = d3.timeMonth.ceil(maxTime);
    return d3.timeMonth.range(this.timeDomainStart, this.timeDomainEnd);
  } else   if (this.SelectedBinSize == 'Quarter') {
    this.timeDomainStart = d3.timeMonth(minTime, 3);
    this.timeDomainEnd = d3.timeMonth.ceil(maxTime, 3);
    // for quarter we may need to update earliest month so that quarters are consistant (always start on Jan, April, July, or October)
    if ([1, 2].includes(this.timeDomainStart.getMonth())){
      this.timeDomainStart.setMonth(0);
    } else if ([4,5].includes(this.timeDomainStart.getMonth())) {
      this.timeDomainStart.setMonth(3);
    } else if ([7,8].includes(this.timeDomainStart.getMonth())) {
      this.timeDomainStart.setMonth(6);
    } else if ([10,11].includes(this.timeDomainStart.getMonth())) {
      this.timeDomainStart.setMonth(9);
    }
    return d3.timeMonth.range(this.timeDomainStart, this.timeDomainEnd, 3);
  } else   if (this.SelectedBinSize == 'Year') {
    this.timeDomainStart = d3.timeYear(minTime);
    this.timeDomainEnd = d3.timeYear.ceil(maxTime);
    return d3.timeYear.range(this.timeDomainStart, this.timeDomainEnd);
  } else {
    alert("Invalid bin size selected");
    return 0;
  }

}

/**
 * @returns updated bins with new attributes. bin.length2 is array of height of each group (ie. 'M', 'F') needed for that bin interval, bin.height represents the offset of that group.
 * 
 * Also returns maxCount which is used for setting y axis max value
 */
updateBins(bins, colorVariable='None', nodeColorKeys=undefined) {
  let maxCount = 0;
  // cumulative with multiple colors per column
  if (this.useNodeColors && !this.commonService.session.style.widgets["timeline-noncumulative"] && colorVariable != 'None') {
    //heights represents the size of each rect, offset represent the offset of each rect
    let heights = new Array(nodeColorKeys.length).fill(0);
    let offsets = new Array(nodeColorKeys.length).fill(0);
    bins.forEach(bin => {
      bin.length2 = [];
      bin.height = [];
      nodeColorKeys.forEach((value, ind) => {
        let currentCount = bin.filter((obj)=> obj[colorVariable]==value).length
        heights[ind] += currentCount;
        bin.length2.push(heights[ind]);
        offsets[ind] = bin.length2.reduce((paritalSum, a)=> paritalSum+a,0);
        bin.height.push(offsets[ind]);
        
      })
      maxCount += bin.length;
    })
    // noncumulative with multiple colors per column
  } else if (this.useNodeColors && colorVariable != 'None') {
    bins.forEach(bin => {
      bin.length2 = [];
      bin.height = [];
      nodeColorKeys.forEach(value => {
        bin.length2.push(bin.filter((obj)=> obj[colorVariable]==value).length);
        bin.height.push(bin.length2.reduce((paritalSum, a)=> paritalSum+a,0));
      })
      if (bin.length > maxCount) maxCount = bin.length
    })
  // else if (useNodeColor == False || (useNodeColor && colorVariable=='None')) and using cumulative
  // cumulative with one color 
  } else if (!this.commonService.session.style.widgets["timeline-noncumulative"]) {
    bins.forEach(bin => {
      maxCount += bin.length;
      bin.length = maxCount;
    });
    // noncumulative with one color
  } else {
    bins.forEach(bin => {
      if (bin.length > maxCount) maxCount = bin.length
    })
  }

  return [maxCount, bins]
}

/**
 * 
 * @return xAxis which is used to determine the interval and label for xAxis ticks and xLabelOffet which determine how much to shift each label
 */
configureXAxisSettings() {
  let xAxis;
  let numberOfDays = d3.timeDay.count(this.timeDomainStart, this.timeDomainEnd);
  let xLabelOffset = -10;
  if (this.SelectedBinSize=='Year') {
    xAxis = d3.axisBottom(this.x).ticks(d3.timeYear).tickFormat(d3.timeFormat("%Y"));
  } else if (numberOfDays<366) {
    xAxis = d3.axisBottom(this.x).ticks(d3.timeMonth.every(this.tickInterval)).tickFormat(d3.timeFormat("%b %Y"))
    xLabelOffset = -25;
  } else if (this.SelectedBinSize=='Quarter') {
    xAxis = d3.axisBottom(this.x).ticks(d3.timeMonth.every(this.tickInterval < 3 ? this.tickInterval*3: 12)).tickFormat(d => d <= d3.timeYear(d) ? d.getFullYear() : null)
  } else {
    xAxis = d3.axisBottom(this.x).ticks(d3.timeMonth.every(this.tickInterval)).tickFormat(d => d <= d3.timeYear(d) ? d.getFullYear() : null)
  }
  return [xAxis, xLabelOffset]
}

goldenLayoutComponentResize() {
  this.refresh();
  if (this.ShowEpiExportPane && this.EpiExportFileType!='svg') {
    this.setCalculatedResolution();
  }
}

// Handle the change event of the date field
onDateFieldChange(event: any) {
  this.commonService.session.style.widgets["epi-timeline-date-field"] = event;
  this.refresh();
}

onBinSizeChange() {
  if (this.SelectedBinSize=='Year') {
    $('#epi-tick-size').slideUp();
  } else {
    if (this.SelectedBinSize=='Quarter') {
      this.tickInterval = 1;
    }
    $('#epi-tick-size').slideDown();
  }
  this.refresh();
}

onGraphTypeChange(refresh=true) {
  if (this.selectedGraphType == 'Multi: Overlay' || this.selectedGraphType == 'Multi: Side by Side') {
    $('#useNodeColorRow').slideUp();
    $('.additionalDateField').slideDown();
  } else {
    $('.additionalDateField').slideUp();
    $('#useNodeColorRow').slideDown();
  }
  if (refresh) this.refresh();
}

onUseNodeColorChange() {
  if (this.useNodeColors) {
    $('#epi-color-select').slideUp();
  } else {
    $('#epi-color-select').slideDown();
  }
  this.refresh();
}

onTickIntevalChange() {
  this.refresh()
}

onNodeColorChanged() {
  this.refresh();
}

onLegendPositionChange() {
  if (this.selectedLegendPosition == 'Bottom') {
    this.margin.bottom = 100;
  } else {
    this.margin.bottom = 50;
  }
  this.refresh();
}

openSettings() {
  this.visuals.epiCurve.ShowEpiSettingsPane = !this.visuals.epiCurve.ShowEpiSettingsPane;
}

setCumulative(value: boolean): void {
  this.cumulative = value;
  this.commonService.session.style.widgets["timeline-noncumulative"] =  !value;

  this.refresh();
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
  updateCalculatedResolution() {
    let [width, height] = this.getImageDimensions();
    this.CalculatedResolution = (Math.round(width * this.SelectedNetworkExportScaleVariable) + " x " + Math.round(height * this.SelectedNetworkExportScaleVariable) + "px");
    this.cdref.detectChanges();
}

/**
 * @returns an array [width, height] of the svg image
 */
  getImageDimensions() {
    let parent = this.svg.node();
    return [parent.clientWidth, parent.clientHeight] 
  }

private startTimeline(): void {
  this.isPlaying = true;
  this.setTimer();
}

private stopTimeline(): void {
  this.isPlaying = false;
  if (this.timer) {
    this.timer.stop();
  }
}

private setTimer(): void {
  if (this.timer) {
    this.timer.stop();
    d3.timerFlush();
  }
  this.timer = d3.interval(() => {
    const selection = d3.brushSelection(this.brushG.node());
    if (!selection) return this.timer.stop(); // Ignore empty selections
    if (selection[1] >= this.width) {
      this.startTimeline();
      return;
    }
    this.brushG.call(this.brush.move, selection.map(s => s + 1));
    if (++this.tick % 5 == 0) this.propagate();
  }, 110 - parseInt($("#timeline-speed").val() as string));
  if (!this.isPlaying) this.timer.stop();
}

private propagate(): void {
  this.commonService.session.state.timeStart = this.x.invert(this.selection[0]);
  this.commonService.session.state.timeEnd = this.x.invert(this.selection[1]);
  this.commonService.setNodeVisibility(true);
  this.commonService.setLinkVisibility(true);
  this.commonService.tagClusters().then(() => {
    ["node", "link"].forEach((thing: string) => {
      window.trigger(thing + "-visibility");
    });
  });
}

// private initializeD3Chart(): void {
//   this.clearSvg();
//   this.setupDimensions();
//   this.setupScales();
//   this.createSvg();
//   this.populateData();
//   this.drawHistogram();
//   this.setupBrush();
// }

// private clearSvg(): void {
//   d3.select(this.timelineElement.nativeElement).selectAll("*").remove();
// }

// private setupDimensions(): void {
//   const wrapper = this.timelineElement.nativeElement;
//   this.width = wrapper.clientWidth - this.margin.left - this.margin.right;
//   this.height = wrapper.clientHeight - this.margin.top - this.margin.bottom;
// }

// private setupScales(): void {
//   this.x = d3.scaleTime().range([0, this.width]);
//   this.y = d3.scaleLinear().range([this.height, 0]);
// }

// private createSvg(): void {
//   this.svg = d3.select(this.timelineElement.nativeElement)
//     .append("svg")
//     .attr("width", this.width + this.margin.left + this.margin.right)
//     .attr("height", this.height + this.margin.top + this.margin.bottom)
//     .append("g")
//     .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
// }

// private populateData(): void {
//   // Transform your data here
//   this.vnodes.forEach(d => {
//     const time = moment(d.date); // Replace 'date' with your actual date field
//     if (time.isValid()) {
//       d.date = time.toDate();
//     } else {
//       d.date = null;
//     }
//   });

//   this.timeDomainStart = d3.min(this.vnodes, d => d.date);
//   this.timeDomainEnd = d3.max(this.vnodes, d => d.date);
//   this.x.domain([this.timeDomainStart, this.timeDomainEnd]);
// }

// private drawHistogram(): void {
//   // Draw your histogram here
//   this.histogram = d3.histogram()
//     .value(d => d.date) // Replace 'date' with your actual date field
//     .domain(this.x.domain())
//     .thresholds(d3.thresholdScott);

//   const bins = this.histogram(this.vnodes);

//   if (this.cumulative) {
//     let sum = 0;
//     bins.forEach(bin => {
//       sum += bin.length;
//       bin.length = sum;
//     });
//   }

//   this.y.domain([0, d3.max(bins, d => d.length)]);

//   this.svg.selectAll("rect")
//     .data(bins)
//     .enter()
//     .append("rect")
//     .attr("x", d => this.x(d.x0))
//     .attr("y", d => this.y(d.length))
//     .attr("width", d => this.x(d.x1) - this.x(d.x0))
//     .attr("height", d => this.height - this.y(d.length))
//     .attr("fill", "steelblue"); // Change fill as necessary
// }

// private setupBrush(): void {
//   this.brush = d3.brushX()
//     .extent([[0, 0], [this.width, this.height]])
//     .on("end", () => this.onBrushEnd());

//   this.brushG = this.svg.append("g")
//     .attr("class", "brush")
//     .call(this.brush);
// }

// private onBrushEnd(): void {
//   this.selection = d3.brushSelection(this.brushG.node());
//   if (this.selection) {
//     // Handle brush selection change
//   }
// }

// playPauseTimeline(): void {
//   if (this.isPlaying) {
//     this.stopTimeline();
//   } else {
//     this.startTimeline();
//   }
// }

// startTimeline(): void {
//   this.isPlaying = true;
//   this.setTimer();
// }

// stopTimeline(): void {
//   this.isPlaying = false;
//   if (this.timer) {
//     this.timer.stop();
//   }
// }

// setTimer(): void {
//   if (this.timer) {
//     this.timer.stop();
//   }
//   this.timer = d3.interval(() => {
//     // Timer logic for updating the timeline
//     // this.updateTimeline();
//   }, 100); // Adjust interval as needed
// }

updateNodeColors() {
  this.refresh();
}
updateVisualization() {
  //Not Relevant
}

applyStyleFileSettings() {
  // if this components gets widget or any settings saved in style file (commonService.session.style) need to update here
  // so loading a new file will update the visualization 
  //this.widgets = window.context.commonService.session.style.widgets;
}

updateLinkColor() {
  //Not Relevant
}

onRecallSession() {
}

openExport() {
  this.setCalculatedResolution();
  this.ShowEpiExportPane = !this.ShowEpiExportPane;
}

exportVisualization() {
  //let epiCurve = this.epiCurveSVGElement.nativeElement;
  //let $epiCurve = $(this.epiCurve);

  // add microbeTrace logo as a watermark
  /*let watermark = d3.select(epiCurve).append('image')
      .attr('xlink:href', this.commonService.watermark)
      .attr('height', 128)
      .attr('width', 128)
      .attr('x', 35)
      .attr('y', 35)
      .style('opacity', $('#network-export-opacity').val());
  */

  // add node color table
  // node color table not need if all nodes are same color
  /*let nodeLegend: any = false;
  if (this.commonService.session.style.widgets['node-color-variable']!= 'None' && this.useNodeColors) {
    let [addNodeColorTable, Xoffset, Yoffset] = this.nodeColorTableInView();
    if (addNodeColorTable) {
      let nodeColorKeys = this.commonService.session.style.nodeColorsTableKeys[this.commonService.session.style.widgets['node-color-variable']].map(value => value=='null' ? null: value);
      var columns = [];
      columns.push('Node ' + this.commonService.capitalize(this.commonService.session.style.widgets["node-color-variable"]));
      columns.push('Color');
      var data = [];
      nodeColorKeys.forEach((value, i) => {
          let line = {
              Node: this.commonService.capitalize("" + value),
              Color: '<div  style="margin-left:5px; width:40px;height:12px;background:' + this.commonService.temp.style.nodeColorMap(value)  +'"> </div>'
          }
          data.push(line);
      })
  
      let nodeWrapper = null;
  
      this.commonService.currentNodeTableElement.subscribe((element) => {
          if(element){
              nodeWrapper = element;
              } else {
              console.error('currentNodeTableElement is null');
              }                // You can now interact with this.myElement
      });
      nodeLegend = this.tabulate2(data, columns, nodeWrapper, epiCurve, 200,false); 
    }
  }*/

  if (this.EpiExportFileType == 'svg') {
      let content = this.commonService.unparseSVG(this.epiCurveSVGElement.nativeElement);
      let blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
      saveAs(blob, this.EpiExportFileName + '.' + this.EpiExportFileType);
      //if (watermark){          watermark.remove();      }
      //if (nodeLegend){          nodeLegend.remove(); }
  } else {
      saveSvgAsPng(this.epiCurveSVGElement.nativeElement, this.EpiExportFileName + '.' + this.EpiExportFileType, {
          scale: this.SelectedNetworkExportScaleVariable,
          backgroundColor: "#ffffff",
          encoderType: 'image/' + this.EpiExportFileType,
          //encoderOptions: this.SelectedNetworkExportQualityVariable
      }).then(() => {
          //if (watermark){              watermark.remove();          }
          //if (nodeLegend){              nodeLegend.remove();          }

      });
  }
  this.ShowEpiExportPane = false;
}

/**
 * XXXX To be implemented: the idea is to determine is node color table is in bounds of view;
 * if it is return true and x and y offsets to be used to place node color table on view when exporting 
 */
/*nodeColorTableInView() {
  let Xoffset = 0, Yoffset = 0;
  return [false, Xoffset, Yoffset];
}*/

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
/*tabulate2 = (data, columns, wrapper, container, topOffset: number, leftOffset: boolean) => {

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
}*/

openRefreshScreen() {

}

onLoadNewData() {
  throw new Error('Method not implemented.');
}
onFilterDataChange() {
  throw new Error('Method not implemented.');
}


}



export namespace TimelineComponent {
  export const componentTypeName = 'Epi Curve';
}
