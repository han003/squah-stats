import { Component, computed, effect, inject, signal, WritableSignal } from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Player, PlayerSaveData } from './player';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatList, MatListItem, MatListItemMeta } from '@angular/material/list';
import { MatDivider } from '@angular/material/divider';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AddRoundDialogComponent, AddRoundDialogData } from './add-round-dialog/add-round-dialog.component';
import { Round, RoundSaveData } from './round';
import { filter } from 'rxjs';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { v4 as uuidv4 } from 'uuid';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { DateTime } from 'luxon';

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
  playersSessionKey = computed(() => `session-${this.session()}-players`);
  roundsSessionKey = computed(() => `session-${this.session()}-rounds`);
  language = signal(navigator.language);
  players = signal<Player[]>([]);
  rounds = signal<Round[]>([]);
  playersTabLabel = computed(() => `Players (${this.players().length})`)
  roundsTabLabel = computed(() => `Rounds (${this.rounds().length})`)
  insufficientPlayers = computed(() => this.players().length < 2);
  statsColumns = ['player', 'matches', 'wins', 'winRate', 'points', 'pointsPerMatch'];
  newPlayerControl = new FormControl<string | null>(null, Validators.required);

  dataSource = computed(this.computeDataSource.bind(this));

  constructor() {
    const url = new URL(window.location.href);
    this.session = signal(url.searchParams.get('session') || uuidv4());

    const storedPlayers = localStorage.getItem(this.playersSessionKey());
    if (storedPlayers) {
      const players = JSON.parse(atob(storedPlayers)) as string[];

      players.forEach(player => {
        const playerData = JSON.parse(player) as PlayerSaveData;

        this.players.update(p => {
          return [
            ...p,
            new Player(playerData.name, {id: playerData.id})
          ];
        });
      })

      const storedRounds = localStorage.getItem(this.roundsSessionKey());
      if (storedRounds) {
        const rounds = JSON.parse(atob(storedRounds)) as string[];

        rounds.forEach(round => {
          const roundData = JSON.parse(round) as RoundSaveData;
          const player1 = this.players().find(p => p.id() === roundData.player1.id);
          const player2 = this.players().find(p => p.id() === roundData.player2.id);

          if (player1 && player2) {
            this.rounds.update(r => {
              return [
                ...r,
                new Round(player1, roundData.player1.score, player2, roundData.player2.score, {createdAt: DateTime.fromFormat(roundData.createdAt, Round.createdAtFormat)})
              ];
            });
          }
        })
      }
    }

    effect(() => {
      url.searchParams.set('session', this.session());
      window.history.pushState({}, '', url.toString());
    })

    effect(() => {
      localStorage.setItem(this.playersSessionKey(), btoa(JSON.stringify(this.players().map(p => p.toString()))));
      localStorage.setItem(this.roundsSessionKey(), btoa(JSON.stringify(this.rounds().map(p => p.toString()))));
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
        return [round, ...r];
      })
    })
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
