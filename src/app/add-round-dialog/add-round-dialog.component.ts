import { Component, computed, effect, inject, signal, Signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { Player } from '../player';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDivider, MatListOption, MatSelectionList } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { Round } from '../round';

export interface AddRoundDialogData {
  players: Signal<Player[]>;
}

interface AddRoundPlayer {
  player: Player;
  selected: WritableSignal<boolean>;
  score: WritableSignal<number>;
  disabled: WritableSignal<boolean>;
}

@Component({
  selector: 'app-add-round-dialog',
  imports: [
    MatDialogTitle,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    MatListOption,
    MatSelectionList,
    MatIconButton,
    MatIcon,
    MatDivider,
  ],
  templateUrl: './add-round-dialog.component.html',
  styleUrl: './add-round-dialog.component.scss'
})
export class AddRoundDialogComponent {
  readonly minScore = 0;
  readonly maxScore = 99;
  readonly mockPlayerName = '—';
  players = signal<AddRoundPlayer[]>([]);
  selectedPlayers = computed(() => {
    let mockId = 1;
    const selectedPlayers = this.players().filter(p => p.selected());

    return Array.from<AddRoundPlayer>({length: 2}).fill({
      player: new Player(this.mockPlayerName),
      selected: signal(false),
      disabled: signal(false),
      score: signal(0),
    }).map((_, i) => selectedPlayers.at(i) || {
      player: new Player(this.mockPlayerName),
      selected: signal(false),
      disabled: signal(false),
      score: signal(0),
    })
  });
  round = computed(() => {
    const players = this.selectedPlayers();
    if (players.length !== 2) {
      return undefined;
    }

    const [player1, player2] = players;
    if (!(player1 && player2)) {
      return undefined;

    }

    const diff = Math.abs(player1.score() - player2.score());
    if (diff <= 1) {
      return undefined;
    }

    if (!players.some(p => p.score() >= 11)) {
      return undefined;
    }

    return new Round(
      player1.player,
      player1.score(),
      player2.player,
      player2.score(),
    )
  });

  constructor(public dialogRef: MatDialogRef<AddRoundDialogComponent>) {
    const data = inject<AddRoundDialogData>(MAT_DIALOG_DATA);
    this.players.set(data.players()
      .sort((a, b) => a.name().localeCompare(b.name()))
      .map(player => {
        return {
          player,
          selected: signal(false),
          disabled: signal(false),
          score: signal(11),
        }
      })
    );

    effect(() => {
      if (this.selectedPlayers().filter(p => p.player.name() !== this.mockPlayerName).length === 2) {
        this.players().forEach(p => {
          if (!p.selected()) {
            p.disabled.set(true);
          }
        })
      } else {
        this.players().forEach(p => p.disabled.set(false));
      }
    })
  }

  updateScore(player: AddRoundPlayer, change: 1 | -1) {
    player.score.update(s => Math.min(this.maxScore, Math.max(this.minScore, s + change)));
  }

  addRound() {
    this.dialogRef.close(this.round());
  }
}
