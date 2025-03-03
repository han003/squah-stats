import {DateTime} from 'luxon';
import {Player} from './player';

interface RoundPlayer {
  player: Player;
  score: number;
}

export class Round {
  createdAt = DateTime.now();
  createdAtTimeString = this.createdAt.toLocaleString(DateTime.TIME_24_SIMPLE);
  players: [RoundPlayer, RoundPlayer];

  constructor(player1: Player, player1Score: number, player2: Player, player2Score: number) {
    this.players = [
      {player: player1, score: player1Score},
      {player: player2, score: player2Score}
    ];
  }
}
