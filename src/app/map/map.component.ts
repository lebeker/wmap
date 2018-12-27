import * as d3 from "d3";
import {Component} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {MapService} from "./map.service";
import {WMap} from "../models/wmap";

@Component({
    selector: "wmap-map",
    templateUrl: "./map.component.html",
    styleUrls: ["./map.component.scss"],
    providers: [
       /// MapService
    ]
})
export class MapComponent {
    title: string;
    constructor(
        private _route: ActivatedRoute,
        private _mapSvc: MapService
    ) {
        _route.params.subscribe((params) => {
            this.load(params.hash);
        });
        _mapSvc.map$.subscribe((map: WMap) => {
            this.title = "new Map Loaded:" + map.name;
        });
    }

    load(hash?: string) {
        this.title = "WoW";
        this._mapSvc.load("world");
    }

    clicked(e) {
        console.log("clicked", e);
        d3.select(e.target).append("circle")
            .attr("cx", e.offsetX)
            .attr("cy", e.offsetY)
            .attr("r", 16)
            .attr("fill", "red");
    }
}
