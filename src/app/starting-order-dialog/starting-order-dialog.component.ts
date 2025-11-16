import { Component, DestroyRef, inject, signal, Signal } from '@angular/core';
import { Player } from '../player';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { take, tap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface StartingOrderDialogData {
  players: Signal<Player[]>;
}

@Component({
  selector: 'app-starting-order-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatCard
  ],
  templateUrl: './starting-order-dialog.component.html',
  styleUrl: './starting-order-dialog.component.scss',
})
export class StartingOrderDialogComponent {
  private destroyRef = inject(DestroyRef);

  players = signal<Player[]>([]);
  groupedPlayers = signal<string[][]>([]);

  constructor() {
    const data = inject<StartingOrderDialogData>(MAT_DIALOG_DATA);

    this.players.set(data.players());

    timer(0, 50).pipe(
      take(20),
      tap(() => {
        this.shuffleArray(this.players());
        this.groupPlayers();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private groupPlayers() {
    const players = this.players().map(p => p.name())
    const grouped: string[][] = [];

    while (players.length > 0) {
      grouped.push(players.splice(0, 2));
    }

    this.groupedPlayers.set(grouped);
  }

  private shuffleArray(array: Player[]) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [array[randomIndex]!, array[currentIndex]!];
    }
  }
}
