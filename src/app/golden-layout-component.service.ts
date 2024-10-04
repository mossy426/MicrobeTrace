import { ComponentFactoryResolver, Injectable, Injector, StaticProvider, Type } from '@angular/core';
import { ComponentContainer, JsonValue } from "golden-layout";
import { BaseComponentDirective } from './base-component.directive';

@Injectable({
  providedIn: 'root'
})
export class GoldenLayoutComponentService {
  private _componentTypeMap = new Map<string, Type<BaseComponentDirective>>()

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  /**
   * Adds a new element with a specified key and value to the Map (_componentTypeMap). If an element with the same key already exists, the element will be updated.
   * It doesn't make new view, just registers the view/component with goldenLayout map (_componentTypeMap).
   */
  registerComponentType(name: string, componentType: Type<BaseComponentDirective>) {
    this._componentTypeMap.set(name, componentType);
  }

  /**
   * XXXXX Never called in codebase XXXXX
   * @returns an array of registered components
   */
  getRegisteredComponentTypeNames(): string[] {
    const count = this._componentTypeMap.size;
    const result = new Array<string>(count);
    let idx = 0;
    for (let [key, value] of this._componentTypeMap) {
      result[idx++] = key;
    }
    return result;
  }

  createComponent(componentTypeJsonValue: JsonValue, container: ComponentContainer) {
    console.log(componentTypeJsonValue);
    const componentType = this._componentTypeMap.get(componentTypeJsonValue as string);
    if (componentType === undefined) {
      throw new Error('Unknown component type')
    } else {
      const provider: StaticProvider = { provide: BaseComponentDirective.GoldenLayoutContainerInjectionToken, useValue: container };
      const injector = Injector.create({
        providers: [provider]
      });
      const componentFactoryRef = this.componentFactoryResolver.resolveComponentFactory<BaseComponentDirective>(componentType);
      return componentFactoryRef.create(injector);
    }
  }
}
