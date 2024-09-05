import { Injector, Component, Output, EventEmitter, 
  ElementRef, ChangeDetectorRef, Inject, OnInit, ViewContainerRef,
  ViewChild} from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { CommonService } from '@app/contactTraceCommonServices/common.service';
import * as _ from 'lodash';
import { BaseComponentDirective } from '@app/base-component.directive';
import { ComponentContainer } from 'golden-layout';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { DialogSettings } from '../../helperClasses/dialogSettings';
import { PlotlyModule } from 'angular-plotly.js';
import { AngleUpIcon } from 'primeng/icons/angleup';
import { SelectItem } from 'primeng/api';
import { ToggleButtonModule } from 'primeng/togglebutton';


@Component({
  selector: 'HeatmapComponent',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss']
})
export class HeatmapComponent extends BaseComponentDirective implements OnInit {

  @ViewChild('heatmapContainer', {read: ViewContainerRef}) heatmapContainer: ViewContainerRef;
  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();

  labels: string[];
  xLabels: string[];
  yLabels: string[];
  matrix: object;
  plot: any;
  visuals: any;
  nodeIds: string[];
  viewActive: boolean;
  heatmapData: object;
  FieldList: SelectItem[] = [];
  heatmapLayout: object;
  heatmapConfig: object;
  invertX: boolean;
  invertY: boolean;
  heatmapShowLabels: boolean;
  loColor: string;
  medColor: string;
  hiColor: string;
  HeatmapSettingsDialogSettings: DialogSettings = new DialogSettings('#heatmap-settings-pane', false);
  invertOptions: object = [
    { label: "Forward", value: false },
    { label: "Reversed", value: true }
  ];
    
  hideShowOptions: object = [
    { label: 'Hide', value: false },
    { label: 'Show', value: true }
  ];



  constructor(injector: Injector,
        private eventManager: EventManager,
        public commonService: CommonService,
        @Inject(BaseComponentDirective.GoldenLayoutContainerInjectionToken) private container: ComponentContainer, 
        elRef: ElementRef,
        private cdref: ChangeDetectorRef,
        private gtmService: GoogleTagManagerService,
        private plotlyModule: PlotlyModule) {
          super(elRef.nativeElement);
          this.visuals = commonService.visuals;
          this.visuals.heatmap = this;
          this.invertX = this.commonService.session.style.widgets['heatmap-invertX'];
          this.invertY = this.commonService.session.style.widgets['heatmap-invertY'];
          this.heatmapShowLabels = this.commonService.session.style.widgets['heatmap-axislabels-show'];
          this.loColor = this.commonService.session.style.widgets['heatmap-color-low'];
          this.medColor = this.commonService.session.style.widgets['heatmap-color-medium'];
          this.hiColor = this.commonService.session.style.widgets['heatmap-color-high']
        }

  openSettings(): void {
    console.log("opening setting dialog");
    console.log(this.visuals.heatmap.HeatmapSettingsDialogSettings.isVisible);
    this.visuals.heatmap.HeatmapSettingsDialogSettings.setVisibility(true);
    console.log(this.visuals.heatmap.HeatmapSettingsDialogSettings.isVisible);
  }
  
  openExport(): void {}
  
  openCenter(): void {}
  
  ngOnInit(): void {

    this.viewActive = true;
    this.gtmService.pushTag({
            event: "page_view",
            page_location: "/heatmap",
            page_title: "Heatmap View"
        });

    this.nodeIds = this.getNodeIds();
    this.visuals.heatmap.FieldList.push(
      {
        label: "None",
        value: "",
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.commonService.session.data['nodeFields'].map((d, i) => {

      this.visuals.heatmap.FieldList.push(
        {
          label: this.visuals.heatmap.commonService.capitalize(d.replace('_', '')),
          value: d
        });
    });

    this.visuals.microbeTrace.GlobalSettingsNodeColorDialogSettings.setVisibility(false);
    this.visuals.microbeTrace.GlobalSettingsLinkColorDialogSettings.setVisibility(false);
    

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

    const labels = this.nodeIds;
    const xLabels = labels.map(d => 'N' + d);
    const yLabels = xLabels.slice();
    const metric = this.commonService.session.style.widgets['link-sort-variable'];
    const n = xLabels.length;

    const config = {
      autotick: false,
      showticklabels: this.heatmapShowLabels
    };

    if (!config.showticklabels) {
      config["ticks"] = '';
    }

    this.commonService.getDM().then(dm => {
      console.log(dm);
      this.heatmapData = [{
        x: xLabels,
        y: yLabels,
        z: dm,
        type: 'heatmap',
        colorscale: [
          [0, this.loColor],
          [0.5, this.medColor],
          [1, this.hiColor]
        ]
      }]
      this.heatmapLayout = {
          xaxis: config,
          yaxis: config,
          width: $('#heatmap').parent().width(),
          height: $('#heatmap').parent().height()
        }
      this.heatmapConfig = {
          displaylogo: false,
          displayModeBar: false
        }
      this.plot = PlotlyModule.plotlyjs.newPlot('heatmap', this.heatmapData, this.heatmapLayout, this.heatmapConfig);
    });
  }

  goldenLayoutComponentResize() {
    $('#heatmap').height($('heatmapcomponent').height()-19);
    $('#heatmap').width($('heatmapcomponent').width()-1)
  }

  getNodeIds(): string[] {
    const idSet: string[] = this.visuals.heatmap.commonService.session.data.nodes.map(x=>x._id);
    return idSet;
  }
  
  redrawHeatmap() {
    if (!$('#heatmap').length) return;
    if (this.plot) PlotlyModule.plotlyjs.purge('heatmap');
    const labels = this.nodeIds;
    const xLabels = labels.map(d => 'N' + d);
    const yLabels = xLabels.slice();
    const metric = this.commonService.session.style.widgets['link-sort-variable'];


    let config = {
      autotick: false,
      showticklabels: this.heatmapShowLabels
    };

    if (!config.showticklabels) {
      config["ticks"] = '';
    }

    this.commonService.getDM().then(dm => {
      console.log(dm);
      if (this.commonService.session.style.widgets['heatmap-invertX']) {
        console.log("Reversing X Axis");
        dm.forEach(l => l.reverse());
        xLabels.reverse();
      }

      if (this.commonService.session.style.widgets['heatmap-invertY']) {
        dm.reverse();
        yLabels.reverse();
      }
      this.heatmapData = [{
        x: xLabels,
        y: yLabels,
        z: dm,
        type: 'heatmap',
        colorscale: [
          [0, this.loColor],
          [0.5, this.medColor],
          [1, this.hiColor]
        ]
      }]
      this.heatmapLayout = {
          xaxis: config,
          yaxis: config,
          width: $('#heatmap').parent().width(),
          height: $('#heatmap').parent().height()
        }
      this.heatmapConfig = {
          displaylogo: false,
          displayModeBar: false
        }
      this.plot = PlotlyModule.plotlyjs.newPlot('heatmap', this.heatmapData, this.heatmapLayout, this.heatmapConfig);
    });
      this.setBackground();
    }

  setBackground(): void {
      let col = this.commonService.session.style.widgets['background-color'];
      $('#heatmap svg.main-svg').first().css('background', col);
      $('#heatmap rect.bg').css('fill', col);

      let contrast = this.commonService.session.style.widgets['background-color-contrast'];
      $('#heatmap .xtitle, .ytitle').css('fill', contrast);
      $('#heatmap .xaxislayer-above text').css('fill', contrast);
      $('#heatmap .yaxislayer-above text').css('fill', contrast);
    }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace HeatmapComponent {
    export const componentTypeName = 'Heatmap';
}