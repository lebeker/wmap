import { Injectable } from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {WMap} from "../models/wmap";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class MapService {
    private _map$: BehaviorSubject<WMap> = new BehaviorSubject<WMap>(null);
    public map$: Observable<WMap> = this._map$.asObservable();

    constructor(private _http: HttpClient) {}
    load(name: string) {
        this._http.get("/assets/maps/" + name + ".json")
            .toPromise()
            .then((data) => {
                console.log("Map loaded:", data);
               this._map$.next(new WMap(data));
            })
            .catch(() => {});
    }

    getGeoJson(map: WMap = null): Promise<any> {
        map = map || this._map$.getValue();
        if (!map) return Promise.reject("Map is empty");
        return this._http.get(map.geojson)
            .toPromise()
            .catch(() => {});
    }
}
