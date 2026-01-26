import { Player } from './player';
import { Round } from './round';
import { computed, signal } from '@angular/core';

export class Matchup {
  id: string;
  player1: Player;
  player2: Player;
  rounds = signal<Round[]>([]);
  roundCount = computed(() => this.rounds().length);

  constructor(player1: Player, player2: Player) {
    this.player1 = player1;
    this.player2 = player2;
    this.id = Matchup.createId(player1, player2);
  }

  addRound(round: Round) {
    this.rounds.update(r => [...r, round]);
  }

  static createId(player1?: Player, player2?: Player): string {
    const ids = [player1?.id(), player2?.id()].sort();
    return ids.join('_vs_');
  }
}
