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
import { ModalModule, TooltipModule, TabsModule, BsDropdownModule, PopoverModule } from 'ngx-bootstrap';
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
import { MicrobeTraceNextHomeComponent } from './microbe-trace-next-plugin.component';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { FilesComponent } from './filesComponent/files-plugin.component';
import { PhylogeneticComponent } from './visualizationComponents/PhylogeneticComponent/phylogenetic-plugin.component';
import { TwoDComponent } from './visualizationComponents/TwoDComponent/twoD-plugin.component';
import { CoreModule } from '@metronic/app/core/core.module';
import { TableComponent } from './visualizationComponents/TableComponent/table-plugin-component';
import { MapComponent } from './visualizationComponents/MapComponent/map-plugin.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletMarkerClusterModule } from '@asymmetrik/ngx-leaflet-markercluster';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSliderModule } from '@angular/material/slider';
import { DndDirective } from '@shared/dnd.directive';

import {MatSelectModule} from '@angular/material/select';


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
    LeafletMarkerClusterModule
  ],
  exports: [
    SelectButtonModule
  ],
  providers: [
    AppSessionService,
    AppUiCustomizationService,
    AppUrlService,
    GoldenLayoutComponentService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
