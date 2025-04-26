import { Component, computed, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { MatTab, MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
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
import { MatAccordion, MatExpansionPanel, MatExpansionPanelActionRow, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog/confirm-dialog.component';
import { MatSort, MatSortHeader, Sort, SortDirection } from '@angular/material/sort';
import { sort } from './shared/sort';

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
    MatExpansionPanelActionRow,
    MatSort,
    MatSortHeader,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private matSnackBar = inject(MatSnackBar)
  private matDialog = inject(MatDialog)

  protected version = '0.1.0';
  session = signal(new Session(uuidv4()));
  sessions = signal<Session[]>([])
  selectedTabIndex = signal(0);
  language = signal(navigator.language);
  players = signal<Player[]>([]);
  rounds = signal<Round[]>([]);
  sortBy = signal<string>('');
  sortDirection = signal<SortDirection>('');
  isDefaultSort = computed(() => !this.sortDirection());
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
    const initialTab = parseInt(String(url.searchParams.get('tab')));
    this.selectedTabIndex.set(Number.isFinite(initialTab) ? initialTab : 0);

    const {session, players, rounds} = this.getSessionData(sessionKey);
    this.players.set(players);
    this.rounds.set(rounds);
    this.session.set(session);

    this.sessionNameControl.setValue(session.name());
    this.sessionNameControl.setValue(session.name());

    this.sessionNameControl.valueChanges.subscribe(value => {
      this.session().name.set(value || '');
      this.sessions().find(s => s.key === this.session().key)?.name.set(value || '');
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

    const sessions = Object.entries(localStorage).reduce((acc, [key, value]) => {
      const id = this.extractSessionKey(key);
      acc.set(id, this.getSessionData(id).session);
      return acc;
    }, new Map<string, Session>());

    this.sessions.set(Array.from(sessions.values()));
  }

  extractSessionKey(key: string) {
    return key.replaceAll('session-', '').replaceAll('-players', '').replaceAll('-rounds', '');
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
    console.log(`getSessionData`, sessionKey);
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
    const session = new Session(uuidv4());

    this.session.set(session);
    this.sessions.update(sessions => [...sessions, session]);
    this.players.set([]);
    this.rounds.set([]);

    this.matSnackBar.open('New session started');
  }

  tabChange(event: number) {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', event.toString());
    window.history.pushState({}, '', url.toString());
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
    this.matDialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean | null>(ConfirmDialogComponent, {
      data: {
        title: 'Remove player',
        message: `Are you sure you want to remove ${player.name()}?`,
        confirmText: 'Remove',
      }
    }).afterClosed().subscribe(result => {
      if (result === true) {
        this.players.update((p) => {
          return [...p.filter(p => p !== player)];
        });

        this.matSnackBar.open(`${player.name()} removed!`, undefined, {duration: 2000});
      }
    })
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

  loadSession(key: string) {

  }

  sortStats(event: Sort) {
    this.sortBy.set(event.active);
    this.sortDirection.set(event.direction);
  }

  computeDataSource() {
    const players = this.players();
    const rounds = this.rounds();
    const sortBy = this.sortBy();
    const sortDirection = this.sortDirection();
    const isDefaultSort = this.isDefaultSort();

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

    const stats = players.map(player => {
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
      const pointsPerMatch = matches > 0 ? points / matches : 0;
      const pointsPerWin = wins > 0 ? winPoints / wins : 0;
      const pointsPerLoss = losses > 0 ? losePoints / losses : 0;

      return {
        player,
        matches: {
          value: matches,
          formatted: integerFormatter.format(matches),
        },
        wins: {
          value: wins,
          formatted: integerFormatter.format(wins),
        },
        points: {
          value: points,
          formatted: integerFormatter.format(points),
        },
        pointsPerMatch: {
          value: pointsPerMatch,
          formatted: decimalFormatter.format(pointsPerMatch),
        },
        winRate: {
          value: winRate,
          formatted: percentFormatter.format(winRate),
        },
        pointsPerWin: {
          value: pointsPerWin,
          formatted: decimalFormatter.format(pointsPerWin),
        },
        pointsPerLoss: {
          value: pointsPerLoss,
          formatted: decimalFormatter.format(pointsPerLoss),
        },
      }
    });

    console.log(`sortBy`, sortBy);
    console.log(`sortDirection`, sortDirection);

    return sort(
      stats,
      'en',
      [
        (x) => {
          const defaultSortValue = x.winRate.value;
          if (isDefaultSort) {
            return defaultSortValue;
          }

          switch (sortBy) {
            case 'player': {
              return x.player.name();
            }
            case 'matches': {
              return x.matches.value;
            }
            case 'wins': {
              return x.wins.value;
            }
            case 'points': {
              return x.points.value;
            }
            case 'pointsPerMatch': {
              return x.pointsPerMatch.value;
            }
            case 'winRate': {
              return x.winRate.value;
            }
            case 'pointsPerWin': {
              return x.pointsPerWin.value;
            }
            case 'pointsPerLoss': {
              return x.pointsPerLoss.value;
            }
          }

          return defaultSortValue;
        },
        (x) => x.pointsPerLoss.value
      ],
      [
        sortDirection ? sortDirection : 'desc',
        'desc'
      ]
    )
  }
}
