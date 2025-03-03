import {signal} from '@angular/core';

export class Player {
  name = signal<string>('');

  constructor(name: string) {
    this.name.set(name);
  }
}
