import { Component, computed, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Player, PlayerSaveData } from './player';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatList, MatListItem, MatListItemMeta } from '@angular/material/list';
import { MatDivider } from '@angular/material/divider';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AddRoundDialogComponent, AddRoundDialogData } from './add-round-dialog/add-round-dialog.component';
import { Round, RoundSaveData } from './round';
import { filter } from 'rxjs';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef, MatTable } from '@angular/material/table';
import { v4 as uuidv4 } from 'uuid';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { DateTime } from 'luxon';
import { Session, SessionSaveData } from './session';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';

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
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    MatExpansionPanelHeader,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private matSnackBar = inject(MatSnackBar)
  private matDialog = inject(MatDialog)

  session = signal(new Session(uuidv4()));
  sessionKeys = signal<string[]>([])
  language = signal(navigator.language);
  players = signal<Player[]>([]);
  rounds = signal<Round[]>([]);
  playersTabLabel = computed(() => `Players (${this.players().length})`)
  roundsTabLabel = computed(() => `Rounds (${this.rounds().length})`)
  insufficientPlayers = computed(() => this.players().length < 2);
  statsColumns = ['player', 'matches', 'wins', 'winRate', 'points', 'pointsPerMatch', 'pointsPerWin', 'pointsPerLoss'];
  newPlayerControl = new FormControl<string | null>(null);
  sessionNameControl = new FormControl<string | null>(null);

  dataSource = computed(this.computeDataSource.bind(this));

  constructor() {
    const url = new URL(window.location.href);
    const sessionKey = url.searchParams.get('session') || this.session().key;

    const {session, players, rounds} = this.getSessionData(sessionKey);
    this.players.set(players);
    this.rounds.set(rounds);
    this.session.set(session);

    this.sessionNameControl.valueChanges.subscribe(value => {
      this.session.update(s => {
        s.name.set(value || '');
        return s;
      })
    })

    effect(() => {
      url.searchParams.set('session', this.session().key);
      window.history.pushState({}, '', url.toString());
    })

    effect(() => {
      localStorage.setItem(this.getSessionKey(this.session().key), btoa(this.session().toString()));
      localStorage.setItem(this.getPlayersSessionKey(this.session().key), btoa(JSON.stringify(this.players().map(p => p.toString()))));
      localStorage.setItem(this.getRoundsSessionKey(this.session().key), btoa(JSON.stringify(this.rounds().map(p => p.toString()))));
    })
  }

  ngOnInit() {
    console.log(Object.entries(localStorage));

    const sessionKeys = Object.entries(localStorage).reduce((acc, [key, value]) => {
      acc.add(key.slice(8, 44));
      return acc;
    }, new Set<string>());

    console.log(`sessionKeys`, sessionKeys);

    this.sessionKeys.set(Array.from(sessionKeys));
  }

  getSessionKey(session: string) {
    return `session-${session}`;
  }

  getPlayersSessionKey(session: string) {
    return `session-${session}-players`;
  }

  getRoundsSessionKey(session: string) {
    return `session-${session}-rounds`;
  }

  getSessionData(sessionKey: string) {
    const players: Player[] = [];
    const rounds: Round[] = [];
    const session: Session = new Session(sessionKey);

    const storedSession = localStorage.getItem(this.getSessionKey(sessionKey));
    if (storedSession) {
      const sessionData = JSON.parse(atob(storedSession)) as SessionSaveData;
      session.name.set(sessionData.name);
    }

    const storedPlayers = localStorage.getItem(this.getPlayersSessionKey(sessionKey));
    if (storedPlayers) {
      const playerStrings = JSON.parse(atob(storedPlayers)) as string[];

      playerStrings.forEach(player => {
        const playerData = JSON.parse(player) as PlayerSaveData;
        players.push(new Player(playerData.name, {id: playerData.id}));
      })

      const storedRounds = localStorage.getItem(this.getRoundsSessionKey(sessionKey));
      if (storedRounds) {
        const roundStrings = JSON.parse(atob(storedRounds)) as string[];

        roundStrings.forEach(round => {
          const roundData = JSON.parse(round) as RoundSaveData;
          const player1 = players.find(p => p.id() === roundData.player1.id);
          const player2 = players.find(p => p.id() === roundData.player2.id);

          if (player1 && player2) {
            rounds.push(new Round(player1, roundData.player1.score, player2, roundData.player2.score, {createdAt: DateTime.fromFormat(roundData.createdAt, Round.createdAtFormat)}))
          }
        })
      }
    }

    return {session, players, rounds};
  }

  newSession() {
    this.session.set(new Session(uuidv4()));
    this.sessionKeys.update(keys => [...keys, this.session().key]);
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
      const losses = matches - wins;
      const winRate = matches > 0 ? wins / matches : 0;
      const points = playerRounds.reduce((acc, round) => {
        const roundPlayer = round.players.find(p => p.player === player);
        return roundPlayer ? acc + roundPlayer.score : acc;
      }, 0);
      const winPoints = playerRounds.reduce((acc, round) => {
        const roundPlayer = round.players.find(p => p.player === player);
        return roundPlayer && round.winner === roundPlayer ? acc + roundPlayer.score : acc;
      }, 0);
      const losePoints = playerRounds.reduce((acc, round) => {
        const roundPlayer = round.players.find(p => p.player === player);
        return roundPlayer && round.winner !== roundPlayer ? acc + roundPlayer.score : acc;
      }, 0);

      return {
        player,
        matches: integerFormatter.format(matches),
        wins: integerFormatter.format(wins),
        points: integerFormatter.format(points),
        pointsPerMatch: decimalFormatter.format(matches > 0 ? points / matches : 0),
        winRate: percentFormatter.format(winRate),
        pointsPerWin: decimalFormatter.format(wins > 0 ? winPoints / wins : 0),
        pointsPerLoss: decimalFormatter.format(losses > 0 ? losePoints / losses : 0),
      }
    });
  }
}
