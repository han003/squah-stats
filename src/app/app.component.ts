import { Component, computed, inject, signal } from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Player } from './player';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatList, MatListItem } from '@angular/material/list';
import { MatDivider } from '@angular/material/divider';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AddRoundDialogComponent, AddRoundDialogData } from './add-round-dialog/add-round-dialog.component';
import { Round } from './round';
import { filter } from 'rxjs';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable } from '@angular/material/table';

@Component({
  selector: 'app-root',
  imports: [
    MatTabGroup,
    MatTab,
    MatToolbar,
    MatIcon,
    MatIconButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatButton,
    MatListItem,
    MatList,
    MatDivider,
    ReactiveFormsModule,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderRow,
    MatRow,
    MatRowDef,
    MatHeaderRowDef,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private matSnackBar = inject(MatSnackBar)
  private matDialog = inject(MatDialog)

  player1 = new Player('Joar');
  player2 = new Player('Melting');

  language = signal(navigator.language);
  players = signal<Player[]>([
    this.player1,
    this.player2,
  ]);
  rounds = signal<Round[]>([
    new Round(this.player1, 11, this.player2, 2),
    new Round(this.player1, 11, this.player2, 2),
  ]);
  playersTabLabel = computed(() => `Players (${this.players().length})`)
  roundsTabLabel = computed(() => `Rounds (${this.rounds().length})`)
  statsColumns = ['player', 'matches', 'wins', 'winRate', 'points', 'pointsPerMatch'];
  newPlayerControl = new FormControl<string | null>(null, Validators.required);

  dataSource = computed(() => {
    const players = this.players();
    const rounds = this.rounds();

    const decimalFormatter = new Intl.NumberFormat(this.language(), {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    });

    const integerFormatter = new Intl.NumberFormat(this.language(), {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });

    const percentFormatter = new Intl.NumberFormat(this.language(), {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
      style: 'percent',
    });

    return players.map(player => {
      const playerRounds = rounds.filter(round => round.players.some(p => p.player.id === player.id));
      const matches = playerRounds.length;
      const wins = playerRounds.filter(round => round.winner?.player.id === player.id).length;
      const winRate = matches > 0 ? wins / matches : 0;
      const points = playerRounds.reduce((acc, round) => {
        const roundPlayer = round.players.find(p => p.player === player);
        return roundPlayer ? acc + roundPlayer.score : acc;
      }, 0);

      return {
        player,
        matches: integerFormatter.format(matches),
        wins: integerFormatter.format(wins),
        points: integerFormatter.format(points),
        pointsPerMatch: decimalFormatter.format(matches > 0 ? points / matches : 0),
        winRate: percentFormatter.format(winRate),
      }
    });
  })

  addPlayer() {
    const name = this.newPlayerControl.value;
    if (!name) {
      return;
    }

    this.players.update((p) => {
      return [...p, new Player(name)];
    });

    this.newPlayerControl.reset();
    this.matSnackBar.open(`${name} added!`, undefined, {duration: 2000});
  }

  addRound() {
    this.matDialog.open<AddRoundDialogComponent, AddRoundDialogData, Round>(AddRoundDialogComponent, {
      disableClose: true,
      data: {
        players: this.players,
      }
    }).afterClosed().pipe(
      filter(round => round != null),
    ).subscribe(round => {
      this.rounds.update(r => {
        return [...r, round];
      })
    })
  }
}
