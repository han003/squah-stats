import {DateTime} from 'luxon';
import {Player} from './player';

interface RoundPlayer {
  player: Player;
  score: number;
}

export class Round {
  createdAt = DateTime.now();
  createdAtTimeString = this.createdAt.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
  players: RoundPlayer[];
  winner: RoundPlayer | null = null;

  constructor(player1: Player, player1Score: number, player2: Player, player2Score: number) {
    this.players = [
      {player: player1, score: player1Score},
      {player: player2, score: player2Score}
    ].sort((a,b) => a.player.name().localeCompare(b.player.name()))

    this.winner = this.players[0].score > this.players[1].score ? this.players[0] : this.players[1];
  }
}
