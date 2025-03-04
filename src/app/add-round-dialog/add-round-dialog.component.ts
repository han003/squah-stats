import { Component, inject, signal, Signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { Player } from '../player';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { Round } from '../round';

export interface AddRoundDialogData {
  players: Signal<Player[]>;
}

@Component({
  selector: 'app-add-round-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatSelect,
    MatOption,
    MatLabel,
    ReactiveFormsModule,
    MatInput,
    MatDialogActions,
    MatButton,
    MatDialogClose,
  ],
  templateUrl: './add-round-dialog.component.html',
  styleUrl: './add-round-dialog.component.scss'
})
export class AddRoundDialogComponent {
  players = signal<Player[]>([]);
  form = new FormGroup({
    player1: new FormGroup({
      player: new FormControl<Player | null>(null, Validators.required),
      score: new FormControl(null, [Validators.required, Validators.min(0)]),
    }),
    player2: new FormGroup({
      player: new FormControl<Player | null>(null, Validators.required),
      score: new FormControl(null, [Validators.required, Validators.min(0)]),
    }),
  })

  constructor(public dialogRef: MatDialogRef<AddRoundDialogComponent>) {
    const data = inject<AddRoundDialogData>(MAT_DIALOG_DATA);
    this.players.set(
      data.players().sort((a, b) => a.name().localeCompare(b.name()))
    );

    if (this.players().length === 2) {
      this.form.controls.player1.controls.player.setValue(this.players()[0]);
      this.form.controls.player2.controls.player.setValue(this.players()[1]);

      this.form.controls.player1.controls.player.disable();
      this.form.controls.player2.controls.player.disable();
    }
  }

  addRound() {
    const form = this.form.getRawValue();

    this.dialogRef.close(
      new Round(
        form.player1.player!,
        form.player1.score!,
        form.player2.player!,
        form.player2.score!,
      )
    )
  }
}
