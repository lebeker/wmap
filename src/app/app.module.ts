import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";

import {AppRoutingModule} from "./app-routing.module";
import {AppComponent} from "./app.component";
import {MapComponent} from "./map/map.component";
import {MapService} from "./map/map.service";
import {HttpClientModule} from "@angular/common/http";
import {PopulationDialogComponent} from "./map/dialog/population.component";
import {FormsModule} from "@angular/forms";
import {ColorPickerComponent} from "./map/dialog/color.picker.component";

@NgModule({
    declarations: [
        AppComponent,
        MapComponent,
        PopulationDialogComponent,
        ColorPickerComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule
    ],
    providers: [
        MapService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
