import { signal, WritableSignal } from '@angular/core';
import { v7 as uuid } from 'uuid';

export interface PlayerSaveData {
  id: string
  name: string;
}

export class Player {
  name: WritableSignal<string>;
  id: WritableSignal<string>;

  constructor(name: string, extra?: { id: string }) {
    this.name = signal(name);
    this.id = signal(extra?.id || uuid());
  }

  toString() {
    const object: PlayerSaveData = {
      id: this.id(),
      name: this.name()
    };

    return JSON.stringify(object);
  }
}
