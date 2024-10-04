import {
  Injector, Component, Output, EventEmitter, OnInit,
  ViewChild, ViewContainerRef, ElementRef, ChangeDetectorRef, Inject
} from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { VisSingleContainerComponent } from '@unovis/angular'
import { Sankey, SankeyLink, SankeyNode } from '@unovis/ts'
import { CommonService } from '../../contactTraceCommonServices/common.service';
import { SelectItem } from 'primeng/api';
import { DialogSettings } from '../../helperClasses/dialogSettings';
import * as _ from 'lodash';
import * as saveAs from 'file-saver';
import * as domToImage from 'html-to-image';
import { BaseComponentDirective } from '../../base-component.directive';
import { ComponentContainer } from 'golden-layout';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { MicrobeTraceNextVisuals } from '../../microbe-trace-next-plugin-visuals';
import { sankeyData, root, Node, Link } from './data';


@Component({
  selector: 'app-sankey',
  templateUrl: './sankey.component.html',
  styleUrls: ['./sankey.component.scss']
})
export class SankeyComponent extends BaseComponentDirective implements OnInit {
  @ViewChild('Sankey', { read: ViewContainerRef }) sankey: ViewContainerRef;
  @ViewChild('vis') vis: VisSingleContainerComponent<{ nodes: Node[]; links: Link[] }>
  @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();

  ShowSankeyExportPane = false;
  ShowSankeySettingsPane = false;
  IsDataAvailable = true;
  //svg: any = null;
  settings: object;
  visuals: MicrobeTraceNextVisuals;
  nodeIds: string[] = [];
  FieldList: SelectItem[] = [];
  SelectedSankeyChartImageFilenameVariable = "default_Sankey_chart";


  NetworkExportFileTypeList = [
    { label: 'png', value: 'png' },
    { label: 'jpeg', value: 'jpeg' },
    { label: 'svg', value: 'svg' }
  ];

  SelectedNetworkExportFileTypeListVariable = 'png';
  SankeySettingsDialogSettings: DialogSettings = new DialogSettings('#sankey-settings-pane', false);
  isExportClosed: boolean;


  data = { nodes: sankeyData.nodes, links: sankeyData.links }

  viewActive: boolean;
  events = {
    [Sankey.selectors.node]: {
      click: this.toggleGroup.bind(this),
    },
  }

  constructor(injector: Injector,
    private eventManager: EventManager,
    public commonService: CommonService,
    @Inject(BaseComponentDirective.GoldenLayoutContainerInjectionToken) private container: ComponentContainer,
    @Inject(ViewContainerRef) ViewContainerRef,
    elRef: ElementRef,
    private cdref: ChangeDetectorRef,
    private gtmService: GoogleTagManagerService) {

    super(elRef.nativeElement);

    this.visuals = commonService.visuals;
    this.commonService.visuals.sankey = this;
    this.settings = this.commonService.session.style.widgets;
  }

  ngOnInit(): void {

    this.gtmService.pushTag({
      event: "page_view",
      page_location: "/sankey",
      page_title: "Sankey View"
    });

    this.nodeIds = this.getNodeIds();
    this.visuals.sankey.FieldList.push(
      {
        label: "None",
        value: "",
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.commonService.session.data['nodeFields'].map((d, i) => {

      this.visuals.sankey.FieldList.push(
        {
          label: this.commonService.capitalize(d.replace('_', '')),
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

    this.summarizeCategories(["transmission risk"]);
  }

  goldenLayoutComponentResize(): void {
    const height = $('heatmapcomponent').height();
    const width = $('heatmapcomponent').width();
    if (height)
      $('#heatmap').height(height - 19);
    if (width)
      $('#heatmap').width(width - 1)
  }

  linkColor = (d: SankeyLink<Node, Link>): string|null => d.source.color ?? null
  nodeCursor = (d: Node): string|null => d.expandable ? 'pointer' : null
  nodeIcon = (d: Node): string => !d.expandable ? '' : (d.expanded ? '-' : '+')
  subLabel = (d: SankeyNode<Node, Link>): string => {
    if (d.expanded || d.depth === 0) return ''
    return `${((d.value / root.value) * 100).toFixed(1)}%`
  }

  toggleGroup(n: Node): void {
    if (n.expandable) {
      if (n.expanded) {
        sankeyData.collapse(n)
      } else {
        sankeyData.expand(n)
      }
      this.vis.chart.setData(sankeyData)
    }
  }

  openSettings(): void { }

  openCenter(): void { }

  openExport(): void { }

  saveImage(): void {
    const domId = "sankey";
    const fileName = this.SelectedSankeyChartImageFilenameVariable;
    const exportImageType = this.SelectedNetworkExportFileTypeListVariable;
    const content: HTMLElement | null = document.getElementById(domId);
    if (content) {
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
        const svgContent = this.commonService.unparseSVG(content);
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        saveAs(blob, fileName);
      }
    }
  }

  getNodeIds(): string[] {
    const idSet: string[] = this.commonService.session.data.nodes.map(x=>x._id);
    return idSet;
  }

  getNodes = (n: Node): Node[] => n.subgroups?.map((child, i) => ({
    ...child,
    id: [n.id, i].join(''),
    color: child.color ?? n.color,
    expanded: false,
    expandable: child.subgroups?.length > 0,
  }))

  getLinks = (n: Node): Link[] => n.subgroups.map(target => ({
    source: n.id,
    target: target.id,
    value: target.value,
  }))

  generate = (n: Node): Node => ({ ...n, subgroups: this.getNodes(n) })

  /*
  createSankeyData(dataObj: object, sankeyVariables: string[]): Sankey<Node, Link> {
    const categories = this.summarizeCategories(dataObj, sankeyVariables);
    const root: Node = this.generate({
      id: 'root',
      label: 'Average Weekly Expenditure',
      value: 414.7,
      expanded: true,
      expandable: true,
      subgroups: categories as Node[],
    });
    
    const sankeyDataObj: Sankey<Node, Link> = {
      nodes: [root, ...root.subgroups],
      links: this.getLinks(root),
      expand: function (n: any): void {
        n.subgroups = this.getNodes(n)
        this.nodes[n.index].expanded = true
        this.nodes = this.nodes.concat(n.subgroups)
        this.links = this.links.concat(this.getLinks(n))
      },
      collapse: function (n: any): void {
        this.nodes[n.index].expanded = false
        this.nodes = this.nodes.filter(d => d.id === n.id || !d.id.startsWith(n.id))
        this.links = this.links.filter(d => !d.source.startsWith(n.id))
      },
    }
    return sankeyDataObj;
  }
*/
  summarizeCategories(categories: string[]): object {
    const mtData = this.commonService.session.data.nodes;
    for(let i=0; i<categories.length; i++){
      const catName = categories[i];
      // Get all the unique values for the variable in question
      const allValues = mtData.map(x => x[catName]);
      const uniqueValues = allValues.filter((x, y, z) => z.indexOf(x) === y);
    }

    return {};
  }
}
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SankeyComponent {
  export const componentTypeName = 'Sankey';
}
