import { Component, OnInit } from '@angular/core';


declare var $: any;

@Component({
    selector: 'LandingComponent',
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {

   


    constructor() {

    }

    ngOnInit() {
        // this.commonService.updateNetwork();
    }

}
