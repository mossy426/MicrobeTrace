# Microbetrace

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Build angular app on personal github account using gh-pages

1. Fork repo to personal account.
2. Navigate to settings of forked repo.
3. Go to pages in the sidebar
4. Source should be gh-pages branch and the root folder.

## Update angular web app

1. Checkout angularMigration branch of forked repo.
2. Run an npm install to get node modules.
3, Make changes to the webapp and test locally.
4. Run ng build --prod --optimization=false --base-href "https://YOURusername.github.io/MicrobeTrace/"
5. Copy all content generated within the dist folder of your local repo after building.
6. Checkout gh-pages branch and replace all content with copied content - The url should build in a couple minutes.

IMPORTANT before building dist folder - If adding new assets that are loaded via filepath in the app (.ie src="img/img.png"), follow these steps:
1. Add the asset filepath to the assets array in the angular.json file starting from the root.
2. Change the filepaths used within the application to just be the filenames since files added to the assets array will be located in the root source upon building.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
