import { signal, WritableSignal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

export interface PlayerSaveData {
  id: string
  name: string;
}

export class Player {
  name: WritableSignal<string>;
  id: WritableSignal<string>;

  constructor(name: string, extra?: { id: string }) {
    this.name = signal(name);
    this.id = signal(extra?.id || uuidv4());
  }

  toString() {
    const object: PlayerSaveData = {
      id: this.id(),
      name: this.name()
    };

    return JSON.stringify(object);
  }
}
