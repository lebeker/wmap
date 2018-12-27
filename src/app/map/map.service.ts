import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import {WMap} from "../models/wmap";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class MapService {
    private _map$: Subject<WMap> = new Subject<WMap>();
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
}
