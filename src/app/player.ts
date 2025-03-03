import {signal} from '@angular/core';
import { uniqueId } from 'lodash-es';

export class Player {
  readonly id = uniqueId();
  name = signal<string>('');

  constructor(name: string) {
    this.name.set(name);
  }
}
