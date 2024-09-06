import { Injector, Component, Output, EventEmitter, 
  ElementRef, ChangeDetectorRef, Inject, OnInit, ViewContainerRef,
  ViewChild} from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { CommonService } from '@app/contactTraceCommonServices/common.service';
import * as _ from 'lodash';
import * as saveAs from 'file-saver';
import * as domToImage from 'html-to-image';
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
  ShowHeatmapExportPane: boolean = false;
  invertOptions: object = [
    { label: "Yes", value: true },
    { label: "No", value: false }
  ];
  SelectedImageFilenameVariable = "default_heatmap";
  NetworkExportFileTypeList: object = [
    { label: 'png', value: 'png' },
    { label: 'jpeg', value: 'jpeg' },
    { label: 'svg', value: 'svg' }
  ];

  SelectedNetworkExportFileTypeListVariable = 'png';
    
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
    this.visuals.heatmap.HeatmapSettingsDialogSettings.setVisibility(true);
  }
  
  openExport(): void {
    this.ShowHeatmapExportPane = true;
  }
  
  openCenter(): void {
    const reCenter = {
      'xaxis.autorange': true,
      'yaxis.autorange': true
    }
    console.log(reCenter);
    PlotlyModule.plotlyjs.relayout("heatmap", reCenter);
  }
  
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

    this.redrawHeatmap();
  }

  drawHeatmap(xLabels: string[], yLabels: string[], config: object): void {
    this.commonService.getDM().then(dm => {
      if (this.invertX) {
        dm.forEach(l => l.reverse());
        xLabels.reverse();
      }

      if (this.invertY) {
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
  }

  goldenLayoutComponentResize(): void {
    $('#heatmap').height($('heatmapcomponent').height()-19);
    $('#heatmap').width($('heatmapcomponent').width()-1)
  }

  getNodeIds(): string[] {
    const idSet: string[] = this.visuals.heatmap.commonService.session.data.nodes.map(x=>x._id);
    return idSet;
  }
  
  redrawHeatmap(): void {
    if (!$('#heatmap').length) return;
    if (this.plot) PlotlyModule.plotlyjs.purge('heatmap');
    const labels = this.nodeIds;
    const xLabels = labels.map(d => 'N' + d);
    const yLabels = xLabels.slice();
    const metric = this.commonService.session.style.widgets['link-sort-variable'];


    const config = {
      autotick: false,
      showticklabels: this.heatmapShowLabels
    };

    if (!config.showticklabels) {
      config["ticks"] = '';
    }

    this.drawHeatmap(xLabels, yLabels, config);
    this.setBackground();
  }

  setBackground(): void {
      const col = this.commonService.session.style.widgets['background-color'];
      $('#heatmap svg.main-svg').first().css('background', col);
      $('#heatmap rect.bg').css('fill', col);

      const contrast = this.commonService.session.style.widgets['background-color-contrast'];
      $('#heatmap .xtitle, .ytitle').css('fill', contrast);
      $('#heatmap .xaxislayer-above text').css('fill', contrast);
      $('#heatmap .yaxislayer-above text').css('fill', contrast);
  }

  updateLoColor(color: string): void {
    console.log(color);
    this.commonService.session.style.widgets["heatmap-color-low"] = color;
    this.loColor = color;
    this.redrawHeatmap();
  }

  updateMedColor(color: string): void {
    console.log(color);
    this.commonService.session.style.widgets["heatmap-color-medium"] = color;
    this.medColor = color;
    this.redrawHeatmap();
  }

  updateHiColor(color: string): void {
    console.log(color);
    this.commonService.session.style.widgets["heatmap-color-high"] = color;
    this.hiColor = color;
    this.redrawHeatmap();
  }

  updateInvertX(direction: boolean): void {
    this.invertX = direction;
    this.commonService.session.style.widgets["heatmap-invertX"] = this.invertX;
    this.redrawHeatmap();
  }

  updateInvertY(direction: boolean): void {
    this.invertY = direction;
    this.commonService.session.style.widgets["heatmap-invertY"] = this.invertY;
    this.redrawHeatmap();
  }

  saveImage(event): void {
    const fileName = this.SelectedImageFilenameVariable;
    const domId = 'heatmap';
    const exportImageType = this.SelectedNetworkExportFileTypeListVariable ;
    const content = document.getElementById(domId);
    if (exportImageType === 'png') {
      domToImage.toPng(content).then(
        dataUrl => {
          saveAs(dataUrl, fileName);
      });
    } else if (exportImageType === 'jpeg') {
        domToImage.toJpeg(content, { quality: 0.85 }).then(
          dataUrl => {
            saveAs(dataUrl, fileName);
          });
    } else if (exportImageType === 'svg') {
        // The tooltips were being displayed as black bars, so I add a rule to hide them.
        // Have to parse the string into a document, get the right element, add the rule, and reserialize it
        let svgContent = this.visuals.gantt.commonService.unparseSVG(content);
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        saveAs(blob, fileName);
    }

  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace HeatmapComponent {
    export const componentTypeName = 'Heatmap';
}