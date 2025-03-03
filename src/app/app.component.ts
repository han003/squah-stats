import { Component, computed, inject, signal } from '@angular/core';
import { MatTab, MatTabGroup, MatTabLabel } from '@angular/material/tabs';
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
    MatTabLabel,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private matSnackBar = inject(MatSnackBar)
  private matDialog = inject(MatDialog)

  players = signal<Player[]>([
    new Player('Joar'),
    new Player('Melting'),
  ]);
  rounds = signal<Round[]>([]);
  playersTabLabel = computed(() => `Players (${this.players().length})`)
  newPlayerControl = new FormControl<string | null>(null, Validators.required);

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
