import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit,
  ViewChild, ViewContainerRef, ElementRef, ChangeDetectorRef, OnDestroy, Inject } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EventManager } from '@angular/platform-browser';
import { MatMenu } from '@angular/material/menu';
import { CommonService } from '@app/contactTraceCommonServices/common.service';
import * as ClipboardJS from 'clipboard';
import * as saveAs from 'file-saver';
import * as domToImage from 'html-to-image';
import { SelectItem } from 'primeng/api';
import { DialogSettings } from '@app/helperClasses/dialogSettings';
import { MicobeTraceNextPluginEvents } from '@app/helperClasses/interfaces';
import * as _ from 'lodash';
import { MicrobeTraceNextVisuals } from '@app/microbe-trace-next-plugin-visuals';
import { CustomShapes } from '@app/helperClasses/customShapes';
import * as d3 from 'd3';
import { BaseComponentDirective } from '@app/base-component.directive';
import { ComponentContainer } from 'golden-layout';
import { GanttChartService } from './gantt-chart/gantt-chart.service';
import { GanttChartComponent } from './gantt-chart/gantt-chart.component';


@Component({
  selector: 'GanttComponent',
  templateUrl: './gantt-plugin.component.html',
  styleUrls: ['./gantt-plugin.component.scss']
})
export class GanttComponent extends BaseComponentDirective implements OnInit {
  @ViewChild('ganttContainer', {read: ViewContainerRef}) ganttContainer: ViewContainerRef;
  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();
  viewActive: boolean = true;
  svgStyle: {} = {
    height: '0px',
    width: '1000px'
  };

  ganttChartData: Object[] = [
    {
      name: 'Market Team',
      color: '#EAC435',
      timelines: {
        'Market Research': [
          {from: new Date('June 9, 2019'), to: new Date('July 20, 2019')},
          {from: new Date('October 9, 2019'), to: new Date('November 20, 2019')}
        ],
        'User Documentation': [
          {from: new Date('August 10, 2019'), to: new Date('September 15, 2019')}
        ]
      }
    },
    {
      name: 'Development Team',
      color: '#345995',
      timelines: {
        'Software Development': [
          {from: new Date('July 9, 2019'), to: new Date('October 20, 2019')}
        ],
        'Testing': [
          {from: new Date('October 25, 2019'), to: new Date('November 15, 2019')}
        ],
        'User Documentation': [
          {from: new Date('August 1, 2019'), to: new Date('August 15, 2019')}
        ]
      }
    }
  ];

  private customShapes: CustomShapes = new CustomShapes();

  ShowNetworkAttributes = false;
  ShowStatistics = false;
  ShowGanttExportPane = false;
  ShowGanttSettingsPane = false;
  IsDataAvailable = true;
  svg: any = null;
  settings: any = this.commonService.session.style.widgets;
  halfWidth: any = null;
  halfHeight: any = null;
  visuals: any = null;
  nodeIds: string[] = [];
  FieldList: SelectItem[] = [];
  ganttChartService: any = null;
  GanttEntryName: string = "";
  GanttStartVariable: string = "";
  GanttEndVariable: string = "";
  GanttEntryColor: string = "#000000";
  ganttEntries: Object[] = [];

  // ganttChartData: Object[] = [];

  GanttSettingsDialogSettings: DialogSettings = new DialogSettings('#gantt-settings-pane', false);

  constructor(injector: Injector,
              private eventManager: EventManager,
              public commonService: CommonService,
              @Inject(BaseComponentDirective.GoldenLayoutContainerInjectionToken) private container: ComponentContainer,
              @Inject(ViewContainerRef) ViewContainerRef, 
              elRef: ElementRef,
              ganttChartService: GanttChartService,
              private cdref: ChangeDetectorRef) {

    super(elRef.nativeElement);

    this.visuals = commonService.visuals;
    this.commonService.visuals.gantt = this;
    this.ganttChartService = ganttChartService;
  }

  dataAvail(): boolean {
    if (!this.ganttChartData || this.ganttChartData.length === 1 && this.ganttChartData[0]["name"] === "_blank"){
      return false;
    }
    return true;
  }

  openSettings(): void {
    this.visuals.gantt.GanttSettingsDialogSettings.setVisibility(true);
  }
  openExport(): void {}
  openCenter(): void {}

  ngOnInit(): void {
    let that = this;
    this.nodeIds = this.getNodeIds();
    this.visuals.gantt.FieldList.push(
      {
        label: "None",
        value: "",
      }
    )

    this.commonService.session.data['nodeFields'].map((d, i) => {

      this.visuals.gantt.FieldList.push(
        {
          label: this.visuals.gantt.commonService.capitalize(d.replace('_', '')),
          value: d
        });
    });

    this.visuals.microbeTrace.GlobalSettingsNodeColorDialogSettings.setVisibility(false);
    this.visuals.microbeTrace.GlobalSettingsLinkColorDialogSettings.setVisibility(false);
    

    // this.createGanttEntry();
    this.ganttChartData = [this.makeBlankEntry()];
    this.openSettings();
    
    // this.ganttChartData = [this.makeGanttEntry("_blank", "Ipstart", "Ipend", "#2ca02c")];
    this.goldenLayoutComponentResize();

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

  makeBlankEntry(): Object {
    const timelineEntry = [{from:"2000/01/01", to: "2024/12/31"}];
    const timelines = {};
    this.nodeIds.forEach( (element: string) => {
      timelines[element] = timelineEntry;
    });
    const blankEntry = {name: "_blank", color: "#ffffff", timelines: timelines};
    return blankEntry;

    // return this.makeGanttEntry("_blank", "ipstart", "ipend", "#2ca02c");
  }
  goldenLayoutComponentResize() {
    $('#gantt-plugin').height($('ganttcomponent').height()-19);
    $('#gantt-plugin').width($('ganttcomponent').width()-1)
  }

  makeGanttEntry(dateName: string, startVariable: string, endVariable: string, entryColor: string): Object {
    const timeline = {};

    this.nodeIds.forEach( (element: string) => {
      const nodeData = this.visuals.gantt.commonService.session.data.nodes.filter(x => x._id == element)
      const startDate = nodeData[0][startVariable];
      const endDate = nodeData[0][endVariable];
      const regExp: RegExp = /^.*$/;
      if (startDate && endDate && regExp.exec(startDate) && regExp.exec(endDate)) {
        const entry = [{ from: startDate, to: endDate, info: dateName }]
        timeline[element] = entry;
      }
    })

    const ganttEntry = {name: dateName, color: entryColor, opacity: this.ganttChartService.ganttOpacity, timelines: timeline};
    return ganttEntry;
  }

  createGanttEntry(): void {
    if (!this.GanttEndVariable) {
      this.GanttEndVariable = this.GanttStartVariable;
    }
    if (this.ganttEntries.length === 0) { //} || this.ganttChartData.length === 1 && this.ganttChartData[0]["name"] === "_blank"){
      const newEntry = this.makeGanttEntry(this.GanttEntryName, this.GanttStartVariable, this.GanttEndVariable, this.GanttEntryColor);
      this.ganttEntries = [{entryName: this.GanttEntryName, startDate: this.GanttStartVariable, endDate: this.GanttEndVariable, color: this.GanttEntryColor}]
      this.ganttChartData = [newEntry];

    }
    else {
      const newEntry = this.makeGanttEntry(this.GanttEntryName, this.GanttStartVariable, this.GanttEndVariable, this.GanttEntryColor);
      this.ganttEntries.push({entryName: this.GanttEntryName, startDate: this.GanttStartVariable, endDate: this.GanttEndVariable, color: this.GanttEntryColor});
      const existingData = _.cloneDeep(this.ganttChartData);
      existingData.push(newEntry);
      this.ganttChartData = existingData;
    }
    this.cdref.markForCheck();
    this.resetEntryForm();
    this.visuals.gantt.GanttSettingsDialogSettings.setVisibility(false);

  }

  removeGanttEntry(entryName): void {
    const startingEntries = _.cloneDeep(this.ganttChartData);
    const endingEntries = startingEntries.filter(x => x["name"] !== entryName)
    this.ganttEntries = this.ganttEntries.filter(x => x["entryName"] !== entryName);
    this.ganttChartData = endingEntries;
  }

  resetEntryForm(): void {
    this.GanttEntryName = "";
    this.GanttEntryColor = "#000000";
    this.GanttEndVariable = "";
    this.GanttStartVariable = "";
  }

  updateEntryColor(entryName: string, event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    const startingData = _.cloneDeep(this.ganttChartData);
    for (let i=0; i<startingData.length; i++){
      if (startingData[i]["name"] === entryName){
        startingData[i]["color"] = color;
      }
    }
    this.ganttChartData = startingData;

  }

  getNodeIds(): string[] {
    const idSet: string[] = this.visuals.gantt.commonService.session.data.nodes.map(x=>x._id);
    return idSet;
  }

  listGanttEntries(): Object[] {
    return this.ganttEntries;
  }

}

export namespace GanttComponent {
    export const componentTypeName = 'Gantt Chart';
}