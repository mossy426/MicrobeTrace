import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit,
  ViewChild, ElementRef, ChangeDetectorRef, OnDestroy, Inject } from '@angular/core';
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
import { GanttChartComponent } from './gantt-chart/gantt-chart.component';
import { GanttChartService } from './gantt-chart/gantt-chart.service';


@Component({
  selector: 'GanttComponent',
  templateUrl: './gantt-plugin.component.html',
  styleUrls: ['./gantt-plugin.component.scss']
})
export class GanttComponent extends BaseComponentDirective implements OnInit {
  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();
  viewActive: boolean = true;
  svgStyle: {} = {
    height: '0px',
    width: '1000px'
  };

  private customShapes: CustomShapes = new CustomShapes();

  ShowNetworkAttributes = false;
  ShowStatistics = false;
  ShowGanttExportPane = false;
  ShowGanttSettingsPane = false;
  IsDataAvailable = false;
  svg: any = null;
  settings: any = this.commonService.session.style.widgets;
  halfWidth: any = null;
  halfHeight: any = null;
  visuals: any = null;

  ganttChartData = [
    {
      name: 'Market Team',
      timelines: {
        'Market Research': [
          {from: 'June 9, 2019', to: 'July 20, 2019', info: 'wtv'},
          {from: 'October 9, 2019', to: 'November 20, 2019', info: 'wtv'}
        ],
        'User Documentation': [
          {from: 'August 10, 2019', to: 'September 15, 2019', info: 'wtv'}
        ]
      }
    },
    {
      name: 'Development Team',
      timelines: {
        'Software Development': [
          {from: 'July 9, 2019', to: 'October 20, 2019', info: 'wtv'}
        ],
        'Testing': [
          {from: 'October 25, 2019', to: 'November 15, 2019', info: 'wtv'}
        ],
        'User Documentation': [
          {from: 'August 1, 2019', to: 'August 15, 2019', info: 'wtv'}
        ]
      }
    },
    {
      name: 'Test Team A',
      timelines: {
        'Testing': [
          {from: 'August 1, 2019', to: 'August 15, 2019', info: 'wtv'}
        ]
      }
    },
    {
      name: 'Test Team B',
      timelines: {
        'Testing': [
          {from: 'August 15, 2019', to: 'August 30, 2019', info: 'wtv'}
        ]
      }
    },
    {
      name: 'Sales Team',
      timelines: {
        'Pitching': [
          {from: 'July 9, 2019', to: 'October 20, 2019', info: 'wtv'}
        ],
        'Sales': [
          {from: 'October 25, 2019', to: 'November 15, 2019', info: 'wtv'}
        ]
      }
    },
    {
      name: 'Planning Team',
      timelines: {
        'Planning': [
          {from: 'May 9, 2019', to: 'May 30, 2019', info: 'wtv'}
        ]
      }
    }
  ];
  constructor(injector: Injector,
              private eventManager: EventManager,
              public commonService: CommonService,
              @Inject(BaseComponentDirective.GoldenLayoutContainerInjectionToken) private container: ComponentContainer, 
              elRef: ElementRef,
              ganttChartService: GanttChartService,
              ganttChartComponent: GanttChartComponent,
              private cdref: ChangeDetectorRef) {

    super(elRef.nativeElement);

    console.log("Trying to create GanttComponent instance");

    this.visuals = commonService.visuals;
    // this.commonService.visuals.gantt
  }

  openSettings(): void {}
  openExport(): void {}
  openCenter(): void {}

  ngOnInit(): void {
    console.log("Trying to init gantt");
    let that = this;
    
    this.goldenLayoutComponentResize()

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

  goldenLayoutComponentResize() {
    $('#gantt-plugin').height($('ganttcomponent').height()-19);
    $('#gantt-plugin').width($('ganttcomponent').width()-1)
  }
    
}

export namespace GanttComponent {
    export const componentTypeName = 'Gantt Chart';
}