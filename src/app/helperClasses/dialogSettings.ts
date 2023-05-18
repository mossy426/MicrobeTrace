import { CommonService } from "../contactTraceCommonServices/common.service";

export class DialogSettings {
    public isVisible: boolean = false;

    public top: number = 200;
    public left: number = 450;

    // Link Color
    public linkTop: number = 200;
    public linkLeft: string = "bottom-left";

    // Map settings
    public mapRight: string = "bottom-right";

    // Node Color
    public nodeTop: number = 400;
    public nodeLeft: string = "left";

    // Node Shape
    public shapeTop: number = 700;
    public shapeLeft: number = 40;

    // Polygon Color
    public polygonTop: number = 200;
    public polygonLeft: number = 950;

    private dialogControlId: string;

    private stateBeforeExport: {
        isVisible: boolean,
        top?: number,
        left?: number
    };

    constructor(
        dialogControlId: string,
        isVisible: boolean
    ) {
        this.dialogControlId = dialogControlId;
        this.isVisible = isVisible;
    }

    private getDialogControl(): Element {
        return document.querySelector(this.dialogControlId);
    }

    private getDomRect(): DOMRect | ClientRect {
        const dialogControl = this.getDialogControl();

        return dialogControl.children[0].getBoundingClientRect();
    }

    public onShow() {
        this.isVisible = true;
    }

    public onHide() {
        this.isVisible = false;
    }

    setStateBeforeExport() {
        this.stateBeforeExport = {
            isVisible: this.isVisible,
            top: undefined,
            left: undefined
        }

        if (this.isVisible) {
            const domRect = this.getDomRect();

            this.stateBeforeExport.top = domRect.top;
            this.stateBeforeExport.left = domRect.left;
        }

        this.isVisible = false;
    }

    restoreStateAfterExport() {
        this.isVisible = this.stateBeforeExport.isVisible;
        this.top = this.stateBeforeExport.top;
        this.left = this.stateBeforeExport.left;
    }


    setVisibility(isVisible: boolean) {
        if(isVisible && this.top === 0 && this.left === 0){
            this.top = window.innerHeight / 2 - 300;
            this.left = window.innerWidth / 2;
        }
        else if(isVisible && this.stateBeforeExport){
            this.restoreStateAfterExport();
        }
        else if(!isVisible){
            this.setStateBeforeExport();
        }

        this.isVisible = isVisible;
    }
}