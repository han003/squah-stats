import { Round } from './round';
import { Player } from './player';

describe('Round', () => {
  it('should create an instance', () => {
    const player1 = new Player('Player 1');
    const player2 = new Player('Player 2');

    expect(new Round(player1, 11, player2, 2)).toBeTruthy();
  });
});
