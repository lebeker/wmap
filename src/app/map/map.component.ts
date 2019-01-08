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
            let polys = Polygon.fromPath(d),
                uid = polys[0].uid;
            path.setAttribute("uid", uid);
            this.terrains[uid] = polys;
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

        let pe = new Point({x: e.offsetX, y: e.offsetY});
        if (this.tmpPoints.length)
            return this.tmpPoints.push(pe);

        let [popArea, adjPoint] = <any>this.population.areas.reduce(
            (a, t) => (a[1] && a) || [t, this._searchClosePoint(pe, t)],
            [null, null]
        );
        if (adjPoint) {
            this.population.areas.splice(this.population.areas.findIndex(p => p + "" === "" + popArea), 1);
            this.tmpPoints = popArea.vertices();
            let part = this.tmpPoints.splice(this.tmpPoints.findIndex(a => a + "" === "" + adjPoint));
            this.tmpPoints = part.concat(...this.tmpPoints);
            this.drawPopulations();
        } else
            this.tmpPoints.push(pe);
    }

    dblclick(e) {
        if (!this.population) return;

        if (this.tmpPoints.length > 2) {
            this.population.areas.push(Polygon.fromVertices(this.tmpPoints));
            this.tmpPoints = [];
            this.drawPopulations();
            return;
        }
        this.tmpPoints = [];
    }

    pointCursorAdjacent(pe: Point, uid = null): Point {
        let ppl = this.populations.find(p => p.name === uid);
        if (ppl) {
            if (ppl.name === this.population.name) return;
            // TODO: conquest
            return;
        }

        let popArea: Polygon,
            adjPoint: Point;

        if (this.population) {
            // Search populations
            [popArea, adjPoint] = <any>this.population.areas.reduce(
                (a, t) => (a[1] && a) || [t, this._searchClosePoint(pe, t)],
                [null, null]
            );
            if (adjPoint)
                return adjPoint;
        }

        if (!uid) return null;

        let terrain = this.terrains[uid];
        adjPoint = terrain && <Point>terrain.reduce((a, t) => a || this._searchClosePoint(pe, t), null);

        return adjPoint;
    }

    mousemove(e) {
        const el = e.target,
            uid = el.getAttribute("uid");
        if (!uid) {
            console.log("No UID." + el.tagName);
            return null;
        }

        let pe = new Point({x: e.offsetX, y: e.offsetY});

        d3.select("g.tessellate").remove();
        d3.select("svg").append("g").attr("class", "tessellate").attr("pointer-events", "none");
        let tsl = d3.select("g.tessellate");

        let pts = this.tmpPoints.concat(this.pointCursorAdjacent(pe, uid) || pe),
            poly = Polygon.fromVertices(pts);
        tsl.selectAll("path").remove();
        tsl.selectAll("line").remove();
        if (pts.length > 2)
            tsl.selectAll("path")
                .data([poly])
                .enter()
                .append("path")
                .attr("fill", "yellow")
                .attr("d", d => d.toPath() || "Z");
        else if (pts.length === 2) {
            tsl.selectAll("line")
                .data([pts])
                .enter()
                .append("line")
                .attr("stroke", "yellow")
                .attr("x1", d => d[0].x)
                .attr("y1", d => d[0].y)
                .attr("x2", d => d[1].x)
                .attr("y2", d => d[1].y);
        }

        tsl.selectAll("circle").remove();
        tsl.selectAll("circle")
            .data(pts)
            .enter()
            .append("circle")

            .attr("cx", (_d) => _d.x)
            .attr("cy", (_d) => _d.y)
            .attr("r", 5)
            .attr("fill", this.population ? this.population.color.toString() : "green");
    }

    protected _searchClosePoint(pe: Point, poly: Polygon, maxDist: number = 5): Point {
        let lines: Line[] = poly.lines
            .filter(l =>
                l.start.x > 0 && l.start.y > 0 && l.start.x < this.width && l.start.y < this.height
                && pe.dist(l.start) < maxDist
            )
            .sort((l1, l2) => pe.dist(l1.start) - pe.dist(l2.start));
        if (!lines.length) return null;
        return lines[0].start;
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
