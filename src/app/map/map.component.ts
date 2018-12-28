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
    width;
    height;
    title: string;
    map: WMap = null;
    constructor(
        private _route: ActivatedRoute,
        private _mapSvc: MapService
    ) {
        _route.params.subscribe((params) => {
            this.load(params.hash);
        });
        _mapSvc.map$.subscribe((map: WMap) => {
            if (!map) return;

            this.map = map;
            this.title = this.map.name;
            _mapSvc.getGeoJson(this.map)
                .then((data) => this.buildMap(data));
        });
    }

    load(hash?: string) {
        this._mapSvc.load("europe");
    }

    buildMap(geoJsonData: any) {
        const svg = d3.select("svg");

        if (this.width && this.height) {
            svg
                .attr("width", this.width)
                .attr("height", this.height);
        } else {
            const bb = (<HTMLElement>svg.node()).getBoundingClientRect();

            this.width = bb.width;
            this.height = bb.height;
        }

        const g = svg.append("g");
        const geoPath = d3.geoPath();
        if (this.map.projection && this.map.projection.type === "Albers") {
            const albersProjection = d3.geoAlbers()
                .scale(this.map.projection.scale)
                .rotate(this.map.projection.rotate)
                .center(this.map.projection.center)
                .translate([this.width / 2, this.height / 2]);

            geoPath.projection(albersProjection);
        }

        g.selectAll("path")
            .data(geoJsonData.features)
            .enter()
            .append("path")
            .attr("fill", "#ccc")
            .attr("d", geoPath);
    }

    clicked(e) {
        d3.select("svg").append("circle")
            .attr("cx", e.offsetX)
            .attr("cy", e.offsetY)
            .attr("r", 16)
            .attr("fill", "red");
    }
}
