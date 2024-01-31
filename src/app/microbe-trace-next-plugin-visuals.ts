import { Injectable } from "@angular/core";

import { MicrobeTraceNextHomeComponent } from "./microbe-trace-next-plugin.component";
import { FilesComponent } from "./filesComponent/files-plugin.component";
import { TwoDComponent } from "./visualizationComponents/TwoDComponent/twoD-plugin.component";
import { MapComponent } from "./visualizationComponents/MapComponent/map-plugin.component";
import { TableComponent } from "./visualizationComponents/TableComponent/table-plugin-component";
import { PhylogeneticComponent } from "./visualizationComponents/PhylogeneticComponent/phylogenetic-plugin.component";
import { AlignmentViewComponent } from "./visualizationComponents/AlignmentViewComponent/alignment-view-plugin-component";

@Injectable({
    providedIn: 'root',
})
export class MicrobeTraceNextVisuals {
    public microbeTrace: MicrobeTraceNextHomeComponent;
    public filesPlugin: FilesComponent;
    public twoD: TwoDComponent;
    public gisMap: MapComponent;
    public tableComp: TableComponent;
    public phylogenetic: PhylogeneticComponent;
    public alignment: AlignmentViewComponent
}
