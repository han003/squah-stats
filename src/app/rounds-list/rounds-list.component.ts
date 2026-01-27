import { Component, input, output } from '@angular/core';
import { Round } from '../round';
import { MatDivider } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-rounds-list',
  imports: [
    MatDivider,
    MatIcon,
    MatIconButton
  ],
  templateUrl: './rounds-list.component.html',
  styleUrl: './rounds-list.component.scss',
})
export class RoundsListComponent {
  delete = output<Round>();

  rounds = input.required<Round[]>();
}
