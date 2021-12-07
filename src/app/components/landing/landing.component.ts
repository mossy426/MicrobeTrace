import { Component, OnInit } from '@angular/core';


declare var $: any;

@Component({
    selector: 'LandingComponent',
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

    public metric: string = "TN93";
    public ambiguity: string = "Average";
    public launchView: string = "2D Network";
    public threshold: string = "0.015";


    constructor() {

    }

    ngOnInit() {
        // this.commonService.updateNetwork();
    }

    /**
     * Updates metric based on selection
     * @param value - metric selected
     */
    public updateMetric( value: string ) : void {
        this.metric = value;
    }

    /**
     * Updates metric based on selection
     * @param value - ambiguity selected
     */
     public updateAmbiguity( value: string ) : void {
        this.ambiguity = value;
    }

    /**
     * Updates metric based on selection
     * @param value - view selected
     */
     public updateLaunchView( value: string ) : void {
        this.launchView = value;
    }

    /**
     * Updates metric based on selection
     * @param value - threshold input
     */
     public updateThreshold( value: string ) : void {
        this.threshold = value;
    }

    /**
     * Handler for recall btn
     * Opens recall window
     * @param {void}
     */
     public recallClicked() : void {
    }

    /**
     * Handler for continue btn
     * Opens recall window
     * @param {void}
     */
     public continueClicked() : void {
    }


}
