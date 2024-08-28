import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, Component } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import * as $ from 'jquery';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
// import { ServiceProxyModule } from '@shared/service-proxies/service-proxy.module';
import { UtilsModule } from '@shared/utils/utils.module';
// import { AbpModule } from 'abp-ng2-module/dist/src/abp.module';
// import { ModalModule, TooltipModule, TabsModule, BsDropdownModule, PopoverModule } from 'ngx-bootstrap';
// import { TableModule } from 'primeng/components/table/table';
// import { FileUploadModule, ListboxModule, RadioButtonModule, CalendarModule, PaginatorModule, ProgressBarModule, ConfirmDialogModule, DropdownModule, AccordionModule, SidebarModule, MultiSelect, MultiSelectModule, SliderModule } from 'primeng/primeng';

import { GoldenLayoutComponentService } from './golden-layout-component.service';
import { GoldenLayoutHostComponent } from './golden-layout-host.component';

import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { ListboxModule } from 'primeng/listbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CalendarModule } from 'primeng/calendar';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { AccordionModule } from 'primeng/accordion';
import { SidebarModule } from 'primeng/sidebar';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { TabViewModule } from 'primeng/tabview';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TreeModule } from 'primeng/tree';
import { DialogModule } from 'primeng/dialog';
import { OrderListModule } from 'primeng/orderlist';
import { MicrobeTraceNextHomeComponent } from './microbe-trace-next-plugin.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { FilesComponent } from './filesComponent/files-plugin.component';
import { PhylogeneticComponent } from './visualizationComponents/PhylogeneticComponent/phylogenetic-plugin.component';
import { TimelineComponent } from './visualizationComponents/TimelineComponent/timeline-component.component';
import { TwoDComponent } from './visualizationComponents/TwoDComponent/twoD-plugin.component';
import { CoreModule } from '@metronic/app/core/core.module';
import { TableComponent } from './visualizationComponents/TableComponent/table-plugin-component';
import { MapComponent } from './visualizationComponents/MapComponent/map-plugin.component';
import { AlignmentViewComponent } from './visualizationComponents/AlignmentViewComponent/alignment-view-plugin-component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletMarkerClusterModule } from '@asymmetrik/ngx-leaflet-markercluster';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSliderModule } from '@angular/material/slider';
import { DndDirective } from '@shared/dnd.directive';

import {MatSelectModule} from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CrosstabComponent } from './visualizationComponents/CrosstabComponent/crosstab-plugin.component';
import { AggregateComponent } from './visualizationComponents/AggregateComponent/aggregate.component';


import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PopoverModule } from 'ngx-bootstrap/popover';

import { VisGraphModule, VisSingleContainerModule } from '@unovis/angular';
import { GanttComponent } from './visualizationComponents/GanttComponent/gantt-plugin.component';
import { GanttChartComponent } from './visualizationComponents/GanttComponent/gantt-chart/gantt-chart.component';
import { GanttChartService } from './visualizationComponents/GanttComponent/gantt-chart/gantt-chart.service';
import { HeatmapComponent } from './visualizationComponents/HeatmapComponent/heatmap.component';
import { GoogleTagManagerModule } from 'angular-google-tag-manager';

// It is required to have JQuery as global in the window object.
window['$'] = $;

@Component({
  template: `<h1>Test2</h1>`,
  selector: `app-tested`,
})
export class TestedComponent {
  constructor() { }

}


@NgModule({
  declarations: [
    AppComponent,
    MicrobeTraceNextHomeComponent,
    FilesComponent,
    TwoDComponent,
    TableComponent,
    GoldenLayoutHostComponent,
    MapComponent,
    TestedComponent,
    DndDirective,
    PhylogeneticComponent,
    TimelineComponent,
    AlignmentViewComponent,
    CrosstabComponent,
    AggregateComponent,
    GanttChartComponent,
    GanttComponent,
    HeatmapComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    //ngCommon.CommonModule,
    FormsModule,
    // GoldenLayoutModule.forRoot(config),
    HttpClientModule,
    MatButtonModule,
    MatInputModule,
    MatMenuModule,
    MatSliderModule,
    MatToolbarModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    HttpClientJsonpModule,
    ModalModule.forRoot(),
    TooltipModule.forRoot(),
    TabsModule.forRoot(),
    BsDropdownModule.forRoot(),
    PopoverModule.forRoot(),
    FileUploadModule,
    // AbpModule,
    AppRoutingModule,
    UtilsModule,
    //AppCommonModule.forRoot(),
    // ServiceProxyModule,
    TableModule,
    ListboxModule,   
    RadioButtonModule,     
    CalendarModule,
    PaginatorModule,
    //PrimeNgFileUploadModule,
    ProgressBarModule,
    //PerfectScrollbarModule,
    CoreModule,
    //NgxChartsModule,
    //TextMaskModule,
    //ImageCropperModule,
    ConfirmDialogModule,    
    DropdownModule,
    TabViewModule,
    SelectButtonModule,
    TreeModule,
    DialogModule,
    AccordionModule,
    SidebarModule,
    MultiSelectModule,
    SliderModule,
    LeafletModule,
    LeafletMarkerClusterModule,
    VisGraphModule,
    VisSingleContainerModule,
    OrderListModule,
    GoogleTagManagerModule.forRoot({id: 'G-0MWHB1NG2M',})
  ],
  exports: [
    SelectButtonModule
  ],
  providers: [
    AppSessionService,
    AppUiCustomizationService,
    AppUrlService,
    GanttChartService,
    GoldenLayoutComponentService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
