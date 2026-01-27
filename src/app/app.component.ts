import { Component, computed, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { MatTab, MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Player, PlayerSaveData } from './player';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatList, MatListItem, MatListItemMeta } from '@angular/material/list';
import { MatDivider } from '@angular/material/divider';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { StartingOrderDialogComponent, StartingOrderDialogData } from './starting-order-dialog/starting-order-dialog.component';
import { Matchup } from './matchup';
import { MatOption, MatSelect } from '@angular/material/select';
import { random } from 'lodash-es';
import { RoundsListComponent } from './rounds-list/rounds-list.component';

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
    MatSelect,
    MatOption,
    FormsModule,
    RoundsListComponent,
    MatHint,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private matSnackBar = inject(MatSnackBar)
  private matDialog = inject(MatDialog)

  protected version = '0.1.2';
  session = signal(new Session(uuidv4()));
  sessions = signal<Session[]>([])
  selectedTabIndex = signal(0);
  language = signal(navigator.language);
  players = signal<Player[]>([]);
  matchups = computed(this.computeMatchups.bind(this));
  sortBy = signal<string>('');
  sortDirection = signal<SortDirection>('');
  isDefaultSort = computed(() => !this.sortDirection());
  playersTabLabel = computed(() => `Players (${this.players().length})`)
  rounds = computed(() => this.matchups().reduce<Round[]>((acc, m) => acc.concat(m.rounds()), []));
  roundsTabLabel = computed(() => `Rounds (${this.rounds().length})`)
  insufficientPlayers = computed(() => this.players().length < 2);
  selectedMatchup = signal<Matchup | null>(null);
  statsColumns = ['player', 'matches', 'wins', 'winRate', 'points', 'diff', 'pointsPerMatch', 'pointsPerWin', 'pointsPerLoss'];
  newPlayerControl = new FormControl<string | null>(null);
  sessionNameControl = new FormControl<string | null>(DateTime.now().toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY));

  dataSource = computed(this.computeDataSource.bind(this));

  constructor() {
    const url = new URL(window.location.href);
    const sessionKey = url.searchParams.get('session') || this.session().key;
    const initialTab = this.insufficientPlayers() ? 0 : parseInt(String(url.searchParams.get('tab')));
    this.selectedTabIndex.set(Number.isFinite(initialTab) ? initialTab : 0);

    // const {session, players} = this.getSessionData(sessionKey);
    // this.players.set(players);
    // this.session.set(session);
    //
    // this.sessionNameControl.setValue(session.name());
    // this.sessionNameControl.setValue(session.name());

    this.sessionNameControl.valueChanges.subscribe(value => {
      this.session().name.set(value || '');
      this.sessions().find(s => s.key === this.session().key)?.name.set(value || '');
    })

    effect(() => {
      url.searchParams.set('session', this.session().key);
      window.history.pushState({}, '', url.toString());
    })
  }

  ngOnInit() {
    // const sessions = Object.entries(localStorage).reduce((acc, [key, _]) => {
    //   const id = this.extractSessionKey(key);
    //   acc.set(id, this.getSessionData(id).session);
    //   return acc;
    // }, new Map<string, Session>());
    //
    // this.sessions.set(Array.from(sessions.values()));

    this.mock();
  }

  private mock() {
    this.players.set([
      new Player('Joar'),
      new Player('Sivert'),
      new Player('Egil'),
      new Player('Melting'),
    ]);

    this.matchups().forEach(matchup => {
      for (let i = 0; i < 7; i++) {
        const winningScore = random(0, 100) > 80 ? random(11, 15) : 11;
        const losingScore = winningScore > 11 ? winningScore - 2 : random(0, 9);
        const winner = Math.random() > 0.5 ? matchup.player1 : matchup.player2;

        const round = new Round(
          winner,
          winningScore,
          winner.id() === matchup.player1.id() ? matchup.player2 : matchup.player1,
          losingScore,
          {createdAt: DateTime.now().minus({days: Math.floor(Math.random() * 30)})}
        );
        matchup.addRound(round);
      }
    })
  }

  deleteRound(round: Round) {
    this.matDialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean | null>(ConfirmDialogComponent, {
      data: {
        title: 'Delete round',
        message: `Are you sure you want to delete this round?`,
        confirmText: 'Delete',
      }
    }).afterClosed().subscribe(result => {
      if (result === true) {
        round.deleted.set(true);
        this.matSnackBar.open(`Round deleted`, undefined, {duration: 2000});
      }
    })
  }

  private computeMatchups() {
    const players = this.players();
    const matchups = new Map<string, Matchup>();

    players.forEach(p1 => {
      players.forEach(p2 => {
        if (p1.id() === p2.id()) {
          return;
        }

        const matchupKey = Matchup.createId(p1, p2);
        if (!matchups.has(matchupKey)) {
          matchups.set(matchupKey, new Matchup(p1, p2));
        }
      })
    })

    return Array.from(matchups.values());
  }

  newSession() {
    const session = new Session(uuidv4());

    this.session.set(session);
    this.sessions.update(sessions => [...sessions, session]);
    this.players.set([]);
    this.selectedTabIndex.set(0);

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

    this.players.update((p) => [...p, new Player(name)]);

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
      const matchupId = Matchup.createId(round.players[0]?.player, round.players[1]?.player);
      const matchup = this.matchups().find(m => m.id === matchupId);
      if (matchup) {
        matchup.addRound(round);
      }
    })
  }

  selectStartingOrder() {
    this.matDialog.open<StartingOrderDialogComponent, StartingOrderDialogData>(StartingOrderDialogComponent, {
      disableClose: true,
      data: {
        players: this.players,
      }
    }).afterClosed().pipe(
      filter(round => round != null),
    ).subscribe()
  }

  sortStats(event: Sort) {
    this.sortBy.set(event.active);
    this.sortDirection.set(event.direction);
  }

  computeDataSource() {
    const players = this.players();
    const rounds = this.matchups().reduce<Round[]>((acc, m) => acc.concat(m.rounds()), []);
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

    const diffFormatter = new Intl.NumberFormat(this.language(), {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      signDisplay: 'exceptZero',
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
      const diff = playerRounds.reduce((acc, round) => {
        const roundPlayer = round.players.find(p => p.player === player);
        const player1 = round.players[0];
        const player2 = round.players[1];

        if (!(player1 && player2)) {
          return acc;
        }

        const diff = Math.abs(player1.score - player2.score);
        if (round.winner === roundPlayer) {
          acc += diff;
        } else {
          acc -= diff;
        }

        return acc;
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
        diff: {
          value: diff,
          formatted: diffFormatter.format(diff),
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

    return sort(
      stats,
      navigator.language,
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
            case 'diff': {
              return x.diff.value;
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
        (x) => x.diff.value
      ],
      [
        sortDirection ? sortDirection : 'desc',
        'desc'
      ]
    )
  }
}
