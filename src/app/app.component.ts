import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {Player} from './player';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatList, MatListItem} from '@angular/material/list';
import {MatDivider} from '@angular/material/divider';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';

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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  players = signal<Player[]>([]);
  newPlayerControl = new FormControl<string | null>(null, Validators.required);

  addPlayer() {
    const name = this.newPlayerControl.value;
    if (!name) {
      return;
    }

    this.players.update((p) => {
      p.push(new Player(name));
      return p;
    });

    this.newPlayerControl.reset();
  }
}
