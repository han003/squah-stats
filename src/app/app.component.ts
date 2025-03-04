import { Component, computed, effect, inject, signal, WritableSignal } from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Player } from './player';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatList, MatListItem, MatListItemMeta } from '@angular/material/list';
import { MatDivider } from '@angular/material/divider';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AddRoundDialogComponent, AddRoundDialogData } from './add-round-dialog/add-round-dialog.component';
import { Round } from './round';
import { filter } from 'rxjs';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { v4 as uuidv4 } from 'uuid';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

interface SaveData {
  playerNames: string[];
  rounds: {
    player1Name: string;
    player1Score: number;
    player2Name: string;
    player2Score: number;
  }[];
}

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
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatListItemMeta,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private matSnackBar = inject(MatSnackBar)
  private matDialog = inject(MatDialog)

  session: WritableSignal<string>;
  language = signal(navigator.language);
  players = signal<Player[]>([]);
  rounds = signal<Round[]>([]);
  playersTabLabel = computed(() => `Players (${this.players().length})`)
  roundsTabLabel = computed(() => `Rounds (${this.rounds().length})`)
  statsColumns = ['player', 'matches', 'wins', 'winRate', 'points', 'pointsPerMatch'];
  newPlayerControl = new FormControl<string | null>(null, Validators.required);

  dataSource = computed(this.computeDataSource.bind(this));
  saveData = computed(this.computeSaveData.bind(this));

  constructor() {
    const url = new URL(window.location.href);
    this.session = signal(url.searchParams.get('session') || uuidv4());

    const storedSession = localStorage.getItem(this.session());
    if (storedSession) {
      const data = JSON.parse(atob(storedSession)) as SaveData;

      this.players.set(data.playerNames.map(name => new Player(name)));

      const rounds = data.rounds.map(round => {
        const player1 = this.players().find(p => p.name() === round.player1Name);
        const player2 = this.players().find(p => p.name() === round.player2Name);

        return player1 && player2 ? new Round(player1, round.player1Score, player2, round.player2Score) : null;
      });

      this.rounds.set(rounds.filter(r => r != null));
    }

    effect(() => {
      url.searchParams.set('session', this.session());
      window.history.pushState({}, '', url.toString());
    })

    effect(() => {
      localStorage.setItem(this.session(), btoa(JSON.stringify(this.saveData())))
    })
  }

  newSession() {
    this.session.set(uuidv4());
    this.players.set([]);
    this.rounds.set([]);

    this.matSnackBar.open('New session started');
  }

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

  removePlayer(player: Player) {
    this.players.update((p) => {
      return [...p.filter(p => p !== player)];
    });

    this.matSnackBar.open(`${player.name()} removed!`, undefined, {duration: 2000});
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

  computeSaveData(): SaveData {
    return {
      playerNames: this.players().map(p => p.name()),
      rounds: this.rounds().map(round => {
        return {
          player1Name: round.players[0].player.name(),
          player1Score: round.players[0].score,
          player2Name: round.players[1].player.name(),
          player2Score: round.players[1].score,
        };
      }),
    };
  }

  computeDataSource() {
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
  }
}
