import * as d3 from "d3";
import {Component, EventEmitter, Input, Output} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {Population} from "../../models/population";
import {Color} from "../../models/color";

@Component({
    selector: "wmap-dialog-population",
    templateUrl: "./population.component.html",
    styleUrls: ["./population.component.scss"]
})
export class PopulationDialogComponent {
    @Input()
    visible = false;
    @Output()
    visibleChange = new EventEmitter();
    @Input()
    population: Population;
    @Output()
    populationChange = new EventEmitter();

    test = "test";
    showColorPicker = false;
    change(event?: any) {
        this.populationChange.emit(this.population);
    }

    close(e) {
        if (e.target.getAttribute("class") !== "overlap") return;

        this.visible = false;
        this.visibleChange.emit(false);
    }

    openColorPicker() {
        this.showColorPicker = true;
    }

    get pcolor() {
        return this.population.color.toString();
    }
}
