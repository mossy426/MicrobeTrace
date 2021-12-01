import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TwoDComponent } from './components/twoDComponent/twoD-plugin.component';

const routes: Routes = [
  {
    path: './components/twoDComponent',
    component: TwoDComponent
  },
  { path: 'second-component', component: TwoDComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }