import * as d3 from "d3";
import {Component} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {MapService} from "./map.service";
import {WMap} from "../models/wmap";
import {Point} from "../models/point";
import {Polygon} from "../models/polygon";

@Component({
    selector: "wmap-map",
    templateUrl: "./map.component.html",
    styleUrls: ["./map.component.scss"]
})
export class MapComponent {
    width;
    height;
    protected _projection;
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
    }

    clicked(e) {
        /*
        d3.selectAll("circle").remove();
        d3.select("svg").append("circle")
            .attr("cx", e.offsetX)
            .attr("cy", e.offsetY)
            .attr("r", 16)
            .attr("fill", "green");
            */
    }

    mousemove(e) {
        const el = e.target;
        if (el.tagName !== "path") {
            console.log(el.tagName);
            return;
        }

        const pts: Point[] = [],
            d = e.target.getAttribute("d");

        const terrain: Polygon[] = Polygon.fromPath(d);

        // d3.select(e.target).attr("fill", "red")
        let tsl: any = d3.select("g.tessellate");

        if (!tsl || !tsl.length) {
            console.log("Create TeSselLate");
            d3.select("svg").append("g").attr("class", "tessellate");
        }

        tsl = d3.select("g.tessellate");
console.log(tsl);

        let pe = new Point({x: e.offsetX, y: e.offsetY}),
            tlines = terrain[0].lines.slice(0),
            p0 = terrain[0].lines[0].start,
            p1 = terrain[0].lines[0].end,
            data = [pe, p0, p1];

        tlines = tlines
            .filter(l => l.start.x > 0 && l.start.y > 0 && l.start.x < this.width && l.start.y < this.height)
            .sort((l1, l2) => {
            return pe.dist(l1.start) + pe.dist(l1.end) - pe.dist(l2.start) - pe.dist(l2.end);
        });

        p0 = tlines[0].start;
        p1 = tlines[0].end;
        data = [pe, p0, p1];
        console.log(tlines, data, "pe-p0: " + pe.dist(p0));

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

        console.log(this._projection);
//        let iprj = this._projection.inverse();
//        tsl.append("path");
        //console.log(pts.slice(0, 2));
        /*
        var m = d3.mouse(this);
        var p = closestPoint(path.node(), m);
        line.attr("x1", p[0]).attr("y1", p[1]).attr("x2", m[0]).attr("y2", m[1]);
        circle.attr("cx", p[0]).attr("cy", p[1]);
        */
    }
/*
    function closestPoint(pathNode, point) {
        var pathLength = pathNode.getTotalLength();
        // var pathLength = 2.0 * Math.PI * 100;
        var precision = 8;
        var best;
        var bestLength;
        var bestDistance = Infinity;


        // linear scan for coarse approximation
        for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
            if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
                best = scan, bestLength = scanLength, bestDistance = scanDistance;
            }
        }

        // binary search for precise estimate
        precision /= 2;
        while (precision > 0.5) {
            var before,
                after,
                beforeLength,
                afterLength,
                beforeDistance,
                afterDistance;
            if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
                best = before, bestLength = beforeLength, bestDistance = beforeDistance;
            } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
                best = after, bestLength = afterLength, bestDistance = afterDistance;
            } else {
                precision /= 2;
            }
        }

        best = [best.x, best.y];
        best.distance = Math.sqrt(bestDistance);
        return best;

        function distance2(p) {
            var dx = p.x - point[0],
                dy = p.y - point[1];
            return dx * dx + dy * dy;
        }
    }
*/
}
