import { signal } from '@angular/core';

export interface SessionSaveData {
  key: string;
  name: string;
}

export class Session {
  key: string;
  name = signal('');

  constructor(key: string, extra?: { name?: string }) {
    this.key = key;
    this.name.update(name => extra?.name || name);
  }

  toString() {
    const object: SessionSaveData = {
      key: this.key,
      name: this.name(),
    }

    return JSON.stringify(object);
  }
}
