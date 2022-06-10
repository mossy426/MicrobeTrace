import { Injector, Component, Output, OnChanges, SimpleChange, EventEmitter, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CommonService } from '../../contactTraceCommonServices/common.service';
import Phylocanvas from 'phylocanvas';
import contextMenu from 'phylocanvas-plugin-context-menu';


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
      Phylocanvas.plugin(contextMenu);
      const treeString = '((((A:0.0431,(((B:0.06836,(C:0.00628,D:0.00069):0.00473):0.00678,E:0.0455):0.002908,F:0.00240):0.01085):0.096,G:0.01784):0.03,(H:0.0480,I:0.0026):0.0336):0.001917,J:0.01917)';
      // const treeString = '(A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;';
      const tree = Phylocanvas.createTree('phylocanvas', {
        fillCanvas: true,
        size: 15,
        shape: 'circle',
        hoverLabels: true,
        selectedColour: '#FF8300',
      });
      tree.load(treeString);
      tree.setTreeType('rectangular');
      tree.setNodeSize(15);
      tree.setTextSize(20);
      tree.leaves.forEach((x) => {
        x.setDisplay({
          leafStyle: {
            fillStyle: '#1F77B4',
          }
        });
      });
      tree.saveOriginalTree();
      const phyCanv = document.querySelector('#phylocanvas');
      const canvHeight = phyCanv.clientHeight;
      console.log(canvHeight);
      const canvWidth = phyCanv.clientWidth;
      tree.setSize(canvWidth, canvHeight);

      tree.draw();


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
