import { Injector, Component, Output, EventEmitter, 
  ElementRef, ChangeDetectorRef, Inject } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { CommonService } from '@app/contactTraceCommonServices/common.service';
import * as _ from 'lodash';
import { BaseComponentDirective } from '@app/base-component.directive';
import { ComponentContainer } from 'golden-layout';
import * as Plotly from 'plotly.js';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { DialogSettings } from '../../helperClasses/dialogSettings';

@Component({
  selector: 'HeatmapComponent',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss']
})
export class HeatmapComponent {

  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();

  labels: string[];
  xLabels: string[];
  yLabels: string[];
  matrix: object;
  plot: any;
  visuals: any;
  nodeIds: string[];
  viewActive: boolean;
  HeatmapSettingsDialogSettings: DialogSettings = new DialogSettings('#heatmap-settings-pane', false);

  constructor(injector: Injector,
        private eventManager: EventManager,
        public commonService: CommonService,
        @Inject(BaseComponentDirective.GoldenLayoutContainerInjectionToken) private container: ComponentContainer, 
        elRef: ElementRef,
        private cdref: ChangeDetectorRef,
        private clipboard: Clipboard,
        private gtmService: GoogleTagManagerService) {
          this.visuals = commonService.visuals;
          this.visuals.heatmap = this;
        }

  openSettings(): void {
    this.visuals.heatmap.HeatmapSettingsDialogSettings.setVisibility(true);
  }
  
  openExport(): void {}
  
  openCenter(): void {}
  
  ngOnInit(): void {

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
    if (this.plot) Plotly.purge('heatmap');
    const labels = this.nodeIds;
    const xLabels = labels.map(d => 'N' + d);
    const yLabels = xLabels.slice();
    const metric = this.commonService.session.style.widgets['link-sort-variable'];
    const n = xLabels.length;
    let matrix = this.commonService.temp.matrix;

    if (this.commonService.session.style.widgets['heatmap-invertX']) {
      matrix.forEach(l => l.reverse());
      xLabels.reverse();
    }

    if (this.commonService.session.style.widgets['heatmap-invertY']) {
      matrix.reverse();
      yLabels.reverse();
    }

    let config = {
      autotick: false,
      showticklabels: this.commonService.session.style.widgets['heatmap-axislabels-show']
    };

    if (!config.showticklabels) {
      config["ticks"] = '';
    }

    this.plot = Plotly.newPlot('heatmap', [{
      x: xLabels,
      y: yLabels,
      z: matrix,
      type: 'heatmap',
      colorscale: [
        [0, this.commonService.session.style.widgets['heatmap-color-low']],
        [0.5, this.commonService.session.style.widgets['heatmap-color-medium']],
        [1, this.commonService.session.style.widgets['heatmap-color-high']]
      ]
    }], {
        xaxis: config,
        yaxis: config,
        width: $('#heatmap').parent().width(),
        height: $('#heatmap').parent().height()
      }, {
        displaylogo: false,
        displayModeBar: false
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