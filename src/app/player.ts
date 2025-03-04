import { signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

export interface PlayerSaveData {
  id: string
  name: string;
}

export class Player {
  id = signal(uuidv4());
  name = signal('');

  constructor(name: string, extra?: {id: string}) {
    this.name.set(name);
    this.id.update((id) => extra?.id || id);
  }

  toString() {
    const object: PlayerSaveData = {
      id: this.id(),
      name: this.name()
    };

    return JSON.stringify(object);
  }
}
