import { Injectable } from '@angular/core';
import * as localForage from 'localforage';

@Injectable()
export class LocalStorageService {

    getItem(key: string, callback: any): void {
        if (!localForage) {
            return;
        }

        localForage.getItem(key, callback);
    }


    setItem(key: string, value: string | null | undefined): void {
        if (!localForage) {
            return;
        }

        if (value === null) {
            value = undefined;
        }

        localForage.setItem(key, value);
    }

    removeItem(key: string, value: ((err: any) => void) | null | undefined): void {
        if (!localForage) {
            return;
        }

        if (value === null) {
            value = undefined;
        }

        localForage.removeItem(key, value);
    }

    keys() {

        if (!localForage) {
            return;
        }

        return localForage.keys();
    }

}
