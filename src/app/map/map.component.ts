import * as d3 from "d3";
import {Component} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {MapService} from "./map.service";
import {WMap} from "../models/wmap";
import {Point} from "../models/point";
import {Polygon} from "../models/polygon";
import {Population} from "../models/population";
import {Line} from "../models/line";
import {Color} from "../models/color";

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
    population: Population = null;
    openDlgPopulation = false;
    title: string;
    map: WMap = null;
    terrains: {[key: string]: Polygon[]} = {};
    tmpPoints: Point[] = [];
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
            this.terrains[uid] = Polygon.fromPath(d);
        }

        this.drawPopulations();
    }

    drawPopulations() {
        d3.select("g.population").remove();
        for (let p of this.populations) {
            d3.select("svg").append("g")
                .attr("class", "population")
                .attr("uid", p.name)
                .attr("id", p.name);

            d3.select("#" + p.name)
                .selectAll("path")
                .data(p.areas)
                .enter()
                .append("path")
                .attr("fill", p.color.toString())
                .attr("d", d => d.toPath());
        }
    }

    clicked(e) {
        if (!this.population) return;

        let popArea: Polygon,
            newPoly: Polygon;

        [newPoly, popArea] = this.polyCursorAdjacent(e);
        if (!newPoly) return;

        if (popArea) {
            popArea.merge(newPoly);
        } else {
            this.population.areas.push(newPoly);
        }

        this.drawPopulations();
    }

    polyCursorAdjacent(event: any): [Polygon, Polygon] {
        const el = event.target,
            uid = el.getAttribute("uid");
        if (!uid) {
            console.log("No UID." + el.tagName);
            return [null, null];
        }

        let ppl = this.populations.find(p => p.name === uid);
        if (ppl) {
            if (ppl.name === this.population.name) return;
            // TODO: conquest
            return;
        }

        let popArea: Polygon,
            newPoly: Polygon,
            pe = new Point({x: event.offsetX, y: event.offsetY});

        if (this.population) {
            // Search populations
            [popArea, newPoly] = <any>this.population.areas.reduce(
                (a, t) => (a[1] && a) || [t, this._getNewPoly(pe, t)],
                [null, null]
            );
            if (newPoly)
                return [newPoly, popArea];
        }

        let terrain = this.terrains[uid];
        newPoly = terrain && <Polygon>terrain.reduce((a, t) => a || this._getNewPoly(pe, t), null);

        return [newPoly || Polygon.triangle(pe), null];
    }

    mousemove(e) {
        let [newPoly, ] = this.polyCursorAdjacent(e);
        if (!newPoly) return;

        d3.select("g.tessellate").remove();
        d3.select("svg").append("g").attr("class", "tessellate").attr("pointer-events", "none");
        let tsl = d3.select("g.tessellate");

        tsl.selectAll("path").remove();
        tsl.selectAll("path")
            .data([newPoly])
            .enter()
            .append("path")
            .attr("fill", "yellow")
            .attr("d", d => d.toPath());

        tsl.selectAll("circle").remove();
        tsl.selectAll("circle")
            .data(newPoly.vertices())
            .enter()
            .append("circle")

            .attr("cx", (_d) => _d.x)
            .attr("cy", (_d) => _d.y)
            .attr("r", 5)
            .attr("fill", this.population ? this.population.color.toString() : "green");
    }

    protected _getNewPoly(pe: Point, poly: Polygon, maxDist: number = 30): Polygon {
        let p: Polygon = null;
        let lines: Line[] = poly.lines
            .filter(l =>
                l.start.x > 0 && l.start.y > 0 && l.start.x < this.width && l.start.y < this.height
                && pe.dist(l.start) < maxDist
            );
        if (!lines.length) return null;

        let vertices = lines.reduce((a, l) => a.concat(...l.vertices()), []);

        let nlines = vertices.map( v => new Line({start: pe, end: v}))
            .filter(l => !lines.reduce((a, _l) => a || _l.isIntersect(l), false));

        let nvertices = nlines.reduce((a, l) => a.concat(...l.vertices()), []);

        // remove duplicates
        nvertices = nvertices.reduce((a, v) => a.reduce((_a, _v) => _a || _v.eq(v), false) ? a : a.concat(v), []);
//        console.log("pe:" + pe, nvertices);
        return Polygon.fromVertices(nvertices);
    }

    protected _searchClosestPoints(pe: Point, poly: Polygon, maxDist: number = 30): Point[] {
        let lines: Line[] = poly.lines
            .filter(l =>
                l.start.x > 0 && l.start.y > 0 && l.start.x < this.width && l.start.y < this.height
                && pe.dist(l.start) < maxDist
            )
            .sort((l1, l2) => {
                return pe.dist(l1.start) + pe.dist(l1.end) - l1.start.dist(l1.end)
                    - pe.dist(l2.start) - pe.dist(l2.end) + l2.start.dist(l2.end);
            });
        if (!lines.length) return null;
        return [lines[0].start, lines[0].end];
    }

    createPopulation() {
        let ppl = new Population({color: Color.random(), areas: []});
        this.population = ppl;
        this.populations.push(ppl);
        this.editPopulation();
    }
    selectPopulation(e) {
        let pname = e.target.value;
        this.population = this.populations.find(p => p.name === pname);
    }
    editPopulation() {
        this.openDlgPopulation = true;
    }
}
