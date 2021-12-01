import { Component, OnInit } from '@angular/core';


declare var $: any;

@Component({
    selector: 'TwoDComponent',
    templateUrl: './twoD-plugin.component.html',
    styleUrls: ['./twoD-plugin.component.css']
})
export class TwoDComponent implements OnInit {

   


    constructor() {

    }

    ngOnInit() {
        // this.commonService.updateNetwork();
    }

}
