import { Injectable } from '@angular/core';
import { colorSchemes } from '../constants/color-schemes';

@Injectable({
   providedIn: 'root'
})
export class GanttChartService {

  width: number;
  height: number;
  ganttTeams: Array<any>;
  ganttPhases: Array<any>;
  phaseTimelines;
  legion;
  ganttMinDate;
  ganttMaxDate;
  ganttDateRange: number;
  xPadding: number;
  yPadding: number;
  componentID: number;
  data: any;
  ganttOpacity = "0.9";

  rectWidth: number;
  rectHeight: number;
  legionWidth: number;
  legionHeight: number;
  minX: number;
  maxX: number;

  monthNames = [
    'January', 'February', 'March',
    'April', 'May', 'June', 'July',
    'August', 'September', 'October',
    'November', 'December'
  ];

  constructor() { }

  computeRectDimensions() {
    this.rectWidth = this.width - this.xPadding * 2 - 150;
    this.rectHeight = this.ganttPhases.length * 60;
  }

  computeLegionDimensions() {
    const noOfLines = Math.ceil(this.data.length / 3);
    this.legionWidth = this.width - this.xPadding * 2 - 150;
    this.legionHeight = 40 + 40 * noOfLines;
  }

  transformX(x: number) {
    return this.rectWidth * x / (this.maxX - this.minX);
  }

  computeLegion() {
    const noOfLines = Math.ceil(this.data.length / 3);
    this.legion = [];
    let cnt = 0;
    for (let line = 0; line < noOfLines; line++) {
      const legionLine = [];
      for (let i = 0; i < 3; i++) {
        if (this.ganttTeams[cnt]) legionLine.push(this.ganttTeams[cnt]);
        cnt++;
      }
      this.legion.push(legionLine);
    }
    // console.log(this.legion);
  }

  transformGanttDate(d) {
    const oneDay = 24 * 60 * 60 * 1000;
    const daysSinceMinDate = Math.round(Math.abs(
        (new Date(d).getTime()
        - (new Date(this.ganttMinDate)).getTime()
        ) / (oneDay)));
    return this.rectWidth * daysSinceMinDate / (this.maxX - this.minX);
  }

  closestMultipleLessThanEqualTo(factor, num) {
    if (num % factor === 0) return num;
    else return this.closestMultipleLessThanEqualTo(factor, num - 1);
  }

  closestMultipleMoreThanEqualTo(factor, num) {
    if (num % factor === 0) return num;
    else return this.closestMultipleMoreThanEqualTo(factor, num + 1);
  }


  setValues({
    componentID: componentID,
    width: width,
    xPadding: xPadding,
    yPadding: yPadding,
    data: data
  }) {
    this.componentID = componentID;
    this.width = width;
    this.xPadding = xPadding;
    this.yPadding = yPadding;
    this.data = data;
    const froms: any = [];
    const tos: any = [];
    const phases = new Set();
    this.ganttTeams = [];
    // this.setColors();
    for (const team of this.data) {
      this.ganttTeams.push({name: team.name, color: team.color, opacity: team.opacity});
      for (const phase of Object.keys(team.timelines)) {
        phases.add(phase);
        for (const timeline of team.timelines[phase]) {
          froms.push(timeline.from);
          tos.push(timeline.to);
        }
      }
    }
    this.ganttPhases = Array.from(phases);

    const minDate = froms.filter(x => x !== null && x!=="null").reduce((a, b) => new Date(a) < new Date(b) ? a : b );
    const maxDate = tos.filter(x=>x!==null && x!=="null").reduce((a, b) => new Date(a) > new Date(b) ? a : b );

    this.ganttMinDate = minDate;
    this.ganttMaxDate = maxDate;
    const noOfLines = Math.ceil(this.data.length / 3);
    this.height = this.ganttPhases.length * 60 + this.yPadding * 3 + 100 + 40 + 30 * noOfLines;

    const oneDay = 24 * 60 * 60 * 1000;
    this.ganttDateRange = Math.round(Math.abs(
        (new Date(this.ganttMaxDate).getTime()
        - new Date(this.ganttMinDate).getTime()
        ) / (oneDay)));
    this.minX = 0;
    this.maxX = this.ganttDateRange;
    let flag = 0;
    let qts = 1;
    let gridPrecisionX = 0;
    while (flag === 0) {
      if (this.ganttDateRange <= 90 * qts) {
        gridPrecisionX = 7 * qts;
        flag = 1;
        break;
      } else { qts = qts + 1; }
    }

    this.maxX = this.closestMultipleMoreThanEqualTo(7 * qts, this.ganttDateRange);
    this.ganttMaxDate = this.addDays(this.ganttMinDate, this.maxX);

    this.computeRectDimensions();
    this.computeLegionDimensions();
    this.computeLegion();
    // this.printAll();
  }

  addDays(date, days: number) {
    const newdate = new Date(date);
    newdate.setDate((new Date(date)).getDate() + days);
    const day = newdate.getDate();
    const monthIndex = newdate.getMonth();
    const year = newdate.getFullYear();


    return this.monthNames[monthIndex] + ' ' + day + ', ' + year;
  }

  printAll() {
    console.log('line-graph-service');
    console.log('component ID: ' + this.componentID);
    console.log('width: ' + this.width);
    console.log('height: ' + this.height);
    console.log('xPadding: ' + this.xPadding);
    console.log('yPadding: ' + this.yPadding);
    console.log('rectWidth: ' + this.rectWidth);
    console.log('rectHeight: ' + this.rectHeight);
    console.log('ganttMinDate: ' + this.ganttMinDate);
    console.log('ganttMaxDate: ' + this.ganttMaxDate);
  }
}
