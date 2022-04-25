import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import { TidyTree } from 'tidytree';
import * as d3 from 'd3';
// import { Phylocanvas } from 'phylocanvas';

/**
 * @title PhylogeneticComponent
 */
@Component({
    selector: 'PhylogeneticComponent',
    templateUrl: './phylogenetic-plugin.component.html',
})
export class PhylogeneticComponent extends AppComponentBase implements OnInit {

    @Output() DisplayGlobalSettingsDialogEvent = new EventEmitter();


    constructor(injector: Injector,
                private commonService: CommonService) {

        super(injector);

    }


    ngOnInit() {
        console.log('Trying to open up the phylogenetic tree view');
        const treeString = '(A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;';
        const tree: any = TidyTree(treeString, { parent: 'phylocanvas' });
        tree.load(treeString);

    }

    InitView() {
        console.log('InitView is called');

    }

    openSettings() {

    }

    openExport() {

    }

    openCenter() {

    }

    openPinAllNodes() {


    }

    openRefreshScreen() {

    }

    openSelectDataSetScreen() {

    }


}
