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

  createdAt = DateTime.now();
  createdAtTimeString = '';
  roundPlayer1: RoundPlayer;
  roundPlayer2: RoundPlayer;
  players: RoundPlayer[];
  winner: RoundPlayer | null = null;

  constructor(player1: Player, player1Score: number, player2: Player, player2Score: number, extra?: {createdAt: DateTime}) {
    this.roundPlayer1 = {player: player1, score: player1Score};
    this.roundPlayer2 = {player: player2, score: player2Score};

    this.players = [this.roundPlayer1, this.roundPlayer2].sort((a,b) => a.player.name().localeCompare(b.player.name()))

    this.winner = this.roundPlayer1.score > this.roundPlayer2.score ? this.roundPlayer1 : this.roundPlayer2;

    this.createdAt = extra?.createdAt || this.createdAt;
    this.createdAtTimeString = this.createdAt.toLocaleString(DateTime.DATETIME_MED);
  }

  toString() {
    const object: RoundSaveData = {
      createdAt: this.createdAt.toFormat(Round.createdAtFormat),
      player1: {
        id: this.roundPlayer1.player.id(),
        score: this.roundPlayer1.score
      },
      player2: {
        id: this.roundPlayer2.player.id(),
        score: this.roundPlayer2.score
      }
    }

    return JSON.stringify(object);
  }
}
