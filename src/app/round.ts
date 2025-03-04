import {DateTime} from 'luxon';
import {Player} from './player';
import { computed, signal } from '@angular/core';

interface RoundPlayer {
  player: Player;
  score: number;
}

export interface RoundSaveData {
  createdAt: string;
  player1: {
    id: string;
    score: number;
  };
  player2: {
    id: string;
    score: number;
  };
}

export class Round {
  static readonly createdAtFormat = 'yyyy-MM-dd HH:mm:ss';

  createdAt = signal(DateTime.now());
  createdAtTimeString = computed(() => this.createdAt().toLocaleString(DateTime.DATETIME_MED));
  players: RoundPlayer[];
  winner: RoundPlayer | null = null;

  constructor(player1: Player, player1Score: number, player2: Player, player2Score: number, extra?: {createdAt: DateTime}) {
    this.players = [
      {player: player1, score: player1Score},
      {player: player2, score: player2Score}
    ].sort((a,b) => a.player.name().localeCompare(b.player.name()))

    this.winner = this.players[0].score > this.players[1].score ? this.players[0] : this.players[1];

    this.createdAt.update(createdAt => extra?.createdAt || createdAt);
  }

  toString() {
    const object: RoundSaveData = {
      createdAt: this.createdAt().toFormat(Round.createdAtFormat),
      player1: {
        id: this.players[0].player.id(),
        score: this.players[0].score
      },
      player2: {
        id: this.players[1].player.id(),
        score: this.players[1].score
      }
    }

    return JSON.stringify(object);
  }
}
