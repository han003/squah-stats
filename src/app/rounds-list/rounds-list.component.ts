import { Component, input } from '@angular/core';
import { Round } from '../round';
import { MatDivider } from '@angular/material/list';

@Component({
  selector: 'app-rounds-list',
  imports: [
    MatDivider
  ],
  templateUrl: './rounds-list.component.html',
  styleUrl: './rounds-list.component.scss',
})
export class RoundsListComponent {
  rounds = input.required<Round[]>();
}
