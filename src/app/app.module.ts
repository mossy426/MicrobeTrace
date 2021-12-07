import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
// import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';

import { TwoDComponent } from './components/twoDComponent/twoD-plugin.component';
import { LandingComponent } from './components/landing/landing.component';
import { MatInputModule } from '@angular/material';




@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    TwoDComponent
  ],
  imports: [
    
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatInputModule,
    MatMenuModule,
    RouterModule.forRoot([
      {
        path: '',
        redirectTo: 'landing',
        pathMatch: 'full'
     },
     {
        path: 'landing',
        component: LandingComponent
      },
      {
         path: '2d',
         component: TwoDComponent
      }
   ]),
    MatToolbarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
