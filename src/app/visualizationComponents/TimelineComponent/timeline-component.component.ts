import { Component, ElementRef, EventEmitter, Inject, OnInit, Output, ViewChild } from '@angular/core';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import { BaseComponentDirective } from '@app/base-component.directive';
import { MicobeTraceNextPluginEvents } from '@app/helperClasses/interfaces';
import { ComponentContainer } from 'golden-layout';
import * as d3 from 'd3';
import moment from 'moment';
import { MicrobeTraceNextVisuals } from '@app/microbe-trace-next-plugin-visuals';

import { window, TabsetComponent } from 'ngx-bootstrap';
import { SelectItem } from 'primeng/api';


@Component({
  selector: 'app-timeline-component',
  templateUrl: './timeline-component.component.html',
  styleUrls: ['./timeline-component.component.scss']
})
export class TimelineComponent extends BaseComponentDirective implements OnInit, MicobeTraceNextPluginEvents {

  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();

  @ViewChild('timeline') timelineElement: ElementRef;
  
  private visuals: MicrobeTraceNextVisuals;

  FieldList: SelectItem[] = [];
  SelectedDateFieldVariable;

  ShowEpiSettingsPane: boolean = false;
  cumulative = false;
  private svg;
  private margin = { top: 50, left: 20, right: 20, bottom: 30 };
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
    
 }

 ngAfterViewInit() {

  // this.initializeD3Chart();
  this.setupEventListeners();
  this.refresh();
  console.log(this.commonService.session.style.widgets["node-color"]);
 }
  

public refresh(): void {
  const wrapper = $(this.timelineElement.nativeElement).empty().parent();
  const tickFormat = d3.timeFormat("%Y-%m-%d");
  this.width = wrapper.width() - this.margin.left - this.margin.right;
  this.height = wrapper.height() - this.margin.top - this.margin.bottom;
  this.middle = this.height / 2;

  const field = this.SelectedDateFieldVariable;
  let times = [];
  this.vnodes = JSON.parse(JSON.stringify(this.commonService.session.data.nodes));
  this.vnodes.forEach(d => {
    const time = moment(d[field as string]); // Cast 'field' as string
    if (time.isValid()) {
      d[field as string] = time.toDate(); // Cast 'field' as string
      times.push(d[field as string]); // Cast 'field' as string
    } else {
      d[field as string] = null; // Cast 'field' as string
    }
  });

  if (times.length < 2) {
    times = [new Date(2000, 1, 1), new Date()];
  }
  this.timeDomainStart = Math.min(...times);
  this.timeDomainEnd = Math.max(...times);

  this.x = d3.scaleTime().domain([this.timeDomainStart, this.timeDomainEnd]).rangeRound([0, this.width]);
  this.y = d3.scaleLinear().range([this.height, 0]);

  this.histogram = d3.histogram().value(d => d[field as string]).domain(this.x.domain()).thresholds(d3.thresholdScott);

  this.svg = d3.select(this.timelineElement.nativeElement)
    .append("svg")
    .attr("width", this.width + this.margin.left + this.margin.right)
    .attr("height", this.height + this.margin.top + this.margin.bottom);

  const epiCurve = this.svg.append("g")
    .classed("timeline-epi-curve", true)
    .attr("transform", `translate(${this.margin.left}, 0)`);

  const bins = this.histogram(this.vnodes);

  if (!this.commonService.session.style.widgets["timeline-noncumulative"]) {
    let sum = 0;
    bins.forEach(bin => {
      sum += bin.length;
      bin.length = sum;
    });
  }

  this.y.domain([0, d3.max(bins, d => d.length)]);

  epiCurve.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("transform", d => `translate(${this.x(d.x0)}, ${this.y(d.length)})`)
    .attr("width", d => this.x(d.x1) - this.x(d.x0))
    .attr("height", d => this.height - this.y(d.length))
    .attr("fill",this.commonService.session.style.widgets["node-color"]);

  this.svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(${this.margin.left}, ${this.height})`)
    .call(d3.axisBottom(this.x).tickSize(8).tickPadding(8).tickFormat(tickFormat))
    .attr("text-anchor", null)
    .selectAll("text")
    .attr("x", 6);

  this.svg.append("g")
    .attr("class", "axis axis--y")
    .attr("transform", `translate(${this.margin.left}, 0)`)
    .call(d3.axisLeft(this.y))
    .attr("text-anchor", null)
    .selectAll("text")
    .attr("x", 6);

  this.brush = d3.brushX()
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


  $('[name="timeline-cumulation"]').on('change', () => {
    console.log('cum 1');
    this.cumulative = $("#timeline-noncumulative").is(":checked");
    this.commonService.session.style.widgets["timeline-noncumulative"] =  $("#timeline-noncumulative").is(":checked");
    this.refresh();
  });

  $(window).on('node-color-change', () => {
    this.svg.selectAll(".timeline-epi-curve rect")
      .attr("fill", this.commonService.session.style.widgets["node-color-variable"]);
  });

  $('#timeline-speed').on('change', () => {
    this.setTimer();
  });
}

// Handle the change event of the date field
onDateFieldChange(event: any) {
  this.commonService.session.style.widgets["epi-timeline-date-field"] = event;
  this.refresh();
}



openSettings() {
  this.visuals.epiCurve.ShowEpiSettingsPane = !this.visuals.epiCurve.ShowEpiSettingsPane;
}

setCumulative(value: boolean): void {
  console.log('set cum2 ');
  this.cumulative = value;
  this.commonService.session.style.widgets["timeline-noncumulative"] =  !value;

  this.refresh();
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
  //Not Relevant
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
  // this.visuals.tableComp.ShowTableExportPane = !this.visuals.tableComp.ShowTableExportPane;
}

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
