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
  nodeIds: object[];
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

      this.visuals.gantt.FieldList.push(
        {
          label: this.visuals.gantt.commonService.capitalize(d.replace('_', '')),
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

  getNodeIds(): object[] {

    return [{}];

  }
  
  /*
  redrawHeatmap() {
    if (!$('#heatmap').length) return;
    if (plot) Plotly.purge('heatmap');
    let labels = Object.keys(temp.matrix);
    let xLabels = labels.map(d => 'N' + d);
    let yLabels = xLabels.slice();
    const metric = session.style.widgets['link-sort-variable'];
    const n = xLabels.length;
    matrix = await MT.getDM();

    if (session.style.widgets['heatmap-invertX']) {
      matrix.forEach(l => l.reverse());
      xLabels.reverse();
    }

    if (session.style.widgets['heatmap-invertY']) {
      matrix.reverse();
      yLabels.reverse();
    }

    let config = {
      autotick: false,
      showticklabels: session.style.widgets['heatmap-axislabels-show']
    };

    if (!config.showticklabels) {
      config.ticks = '';
    }

    plot = Plotly.newPlot('heatmap', [{
      x: xLabels,
      y: yLabels,
      z: matrix,
      type: 'heatmap',
      colorscale: [
        [0, session.style.widgets['heatmap-color-low']],
        [0.5, session.style.widgets['heatmap-color-medium']],
        [1, session.style.widgets['heatmap-color-high']]
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
    setBackground();
    }

  function setBackground() {
      let col = session.style.widgets['background-color'];
      $('#heatmap svg.main-svg').first().css('background', col);
      $('#heatmap rect.bg').css('fill', col);

      let contrast = session.style.widgets['background-color-contrast'];
      $('#heatmap .xtitle, .ytitle').css('fill', contrast);
      $('#heatmap .xaxislayer-above text').css('fill', contrast);
      $('#heatmap .yaxislayer-above text').css('fill', contrast);
    }
*/
}
