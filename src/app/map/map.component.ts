import * as d3 from "d3";
import {Component} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {MapService} from "./map.service";
import {WMap} from "../models/wmap";
import {Point} from "../models/point";
import {Polygon} from "../models/polygon";
import {Population} from "../models/population";

@Component({
    selector: "wmap-map",
    templateUrl: "./map.component.html",
    styleUrls: ["./map.component.scss"]
})
export class MapComponent {
    width;
    height;
    protected _projection;

    populations: Population[] = [];
    population: Population = new Population();
    openDlgPopulation = false;
    title: string;
    map: WMap = null;
    terrains: {[key: string]: Polygon[]} = {};
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
            this._projection = d3.geoAlbers()
                .scale(this.map.projection.scale)
                .rotate(this.map.projection.rotate)
                .center(this.map.projection.center)
                .translate([this.width / 2, this.height / 2]);

            geoPath.projection(this._projection);
        }

        g.selectAll("path")
            .data(geoJsonData.features)
            .enter()
            .append("path")
            .attr("fill", "#ccc")
            .attr("d", geoPath);

        this.terrains = {};
        for (let path of <HTMLBaseElement[]>g.selectAll("path").nodes()) {
            let d = path.getAttribute("d");
            let uid = (new Date).getTime() + "" + Math.random() * 10000;
            path.setAttribute("uid", uid);
            console.log("UID created: " + uid);
            this.terrains[uid] = Polygon.fromPath(d);
        }

    }

    clicked(e) {
    }

    mousemove(e) {
        const el = e.target;
        if (el.tagName !== "path") {
            console.log(el.tagName);
            return;
        }
        let uid = el.getAttribute("uid");

        let terrain = this.terrains[uid];

        d3.select("g.tessellate").remove();
        d3.select("svg").append("g").attr("class", "tessellate");

        let tsl = d3.select("g.tessellate");

        let pe = new Point({x: e.offsetX, y: e.offsetY}),
            tlines = terrain[0].lines.slice(0),
            p0 = terrain[0].lines[0].start,
            p1 = terrain[0].lines[0].end,
            data = [pe, p0, p1];

        tlines = tlines
            .filter(l => l.start.x > 0 && l.start.y > 0 && l.start.x < this.width && l.start.y < this.height)
            .sort((l1, l2) => {
            return pe.dist(l1.start) + pe.dist(l1.end) - l1.start.dist(l1.end)
                - pe.dist(l2.start) - pe.dist(l2.end) + l2.start.dist(l2.end);
        });

        p0 = tlines[0].start;
        p1 = tlines[0].end;
        data = [pe, p0, p1];

        tsl.selectAll("path").remove();
        tsl.selectAll("circle").remove();
        tsl.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", (_d) => _d.x)
            .attr("cy", (_d) => _d.y)
            .attr("r", 5)
            .attr("fill", "green");
    }

    createPopulation() {
        let ppl = new Population();
        this.population = ppl;
        this.populations.push(ppl);
        this.editPopulation();
    }
    selectPopulation(e) {
        let pname = e.target.value;
        console.log(pname, e);
        this.population = this.populations.find(p => p.name === pname);
    }
    editPopulation() {
        this.openDlgPopulation = true;
    }
}
