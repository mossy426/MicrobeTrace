import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import Phylocanvas from 'phylocanvas';

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

    openTree() {
      console.log('Called the tree opening function');
      const treeString = '((((((((((gen-1653669724188-8:0.22619047619047628,(gen-1653669724188-24:10.84090909090909,(gen-1653669724188-13:6,gen-1653669724188-17):0.15909090909091006):5.773809523809524):19.825892857142858,gen-1653669724188-5:0.17410714285714235):0.43509615384615385,(((gen-1653669724188-7:14,gen-1653669724188-15):0.1578947368421053,gen-1653669724188-14:11.842105263157894):13.041666666666666,(gen-1653669724188-16:12.220588235294118,(gen-1653669724188-12:10.86111111111111,gen-1653669724188-19:0.13888888888888928):0.7794117647058822):8.958333333333334):1.5024038461538463):7.5078125,gen-1653669724188-4:0.1484375):2.657670454545454,(gen-1653669724188-2:0.625,gen-1653669724188-6:12.375):13.967329545454547):0.36328125,gen-1653669724188-1:0.29296875):8.681396484375,gen-1653669724188-23:9.787353515625):0.2313232421875,gen-1653669724188-3:0.0343017578125):0.0906982421875,((((gen-1653669724188-9:2.994419642857143,(gen-1653669724188-21:3.994140625,gen-1653669724188-10:0.005859375):0.005580357142857206):0.16080729166666663,(gen-1653669724188-20:3,gen-1653669724188-18):1.8391927083333335):4.769921875,gen-1653669724188-0:0.23007812500000036):5.645670572916666,gen-1653669724188-11:9.854329427083334):0.1219482421875):3.43902587890625,gen-1653669724188-22:3.43902587890625);';
      // const treeString = '(A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;';
			let tree = Phylocanvas.createTree("phylocanvas", {
				fillCanvas: true,
				textSize: 16,
				hoverLabels: true,
			});
			tree.load(treeString);
			tree.setTreeType("rectangular");
      tree.setNodeShape("circle");
      tree.setNodeSize(30);


    }


    ngOnInit() {
      console.log('Trying to open up the phylogenetic tree view');
      this.openTree();

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
