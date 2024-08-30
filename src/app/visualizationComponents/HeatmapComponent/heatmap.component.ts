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
//import * as Plotly from 'plotly';
@Component({
  selector: 'HeatmapComponent',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss']
})
export class HeatmapComponent {

  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();

  labels: String[];
  xLabels: String[];
  yLabels: String[];
  matrix: Object;
  plot: any;

  constructor(injector: Injector,
        private eventManager: EventManager,
        public commonService: CommonService,
        @Inject(BaseComponentDirective.GoldenLayoutContainerInjectionToken) private container: ComponentContainer, 
        elRef: ElementRef,
        private cdref: ChangeDetectorRef,
        private clipboard: Clipboard) {
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
