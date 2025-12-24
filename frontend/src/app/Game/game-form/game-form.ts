import { Component, output, input, computed, effect, inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GameDto } from '../../types/game-dto';
import { GamePublisherDto } from '../../types/game-publisher-dto';
import { GameListService } from '../service/game-list-service';

// Angular Material imports (kept same as student example)
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-game-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
  ],
  templateUrl: './game-form.html',
  styleUrl: './game-form.css'
})
export class GameForm implements OnInit {
  private readonly gameListService = inject(GameListService);
  
  newGame = output<Omit<GameDto, 'id'>>()
  updateGame = output<{ id: number; game: Omit<GameDto, 'id'> }>()

  editingGame = input<GameDto | null>(null)
  publishers = input<GamePublisherDto[]>([])
  
  gameTypes = this.gameListService.gameTypes;

  readonly form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
    }),
    type: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    ageMin: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    pubId: new FormControl<number|null>(null, {validators: [Validators.required] }),
    MaxPlayers: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
  })

  ngOnInit(): void {
    this.gameListService.getGameTypes();
  }

  constructor() {
    // Patch the form when editingGame changes
    effect(() => {
      const g = this.editingGame();
      if (g) {
        this.form.patchValue({
          name: g.name as string,
          type: g.type,
          ageMin: g.minAge,
          pubId: g.publisherId,
          MaxPlayers: g.maxPlayers,
        })
      } else {
        this.form.reset()
        // Si un seul éditeur disponible, prérempli automatiquement
        if (this.publishers().length === 1) {
          this.form.patchValue({ pubId: this.publishers()[0].id })
        }
      }
    })
  }

  submit(): void {
    const value = this.form.value
    const game: Omit<GameDto, 'id'> = {
      name: value.name as string,
      type: value.type as string,
      minAge: value.ageMin as number,
      imageUrl: undefined,
      publisherId: value.pubId as number,
      maxPlayers: value.MaxPlayers as number,
    }

    const editing = this.editingGame()
    if (editing && editing.id !== null) {
      this.updateGame.emit({ id: editing.id, game })
    } else {
      this.newGame.emit(game)
    }
  }

  get isEditing(): boolean {
    return this.editingGame() !== null
  }

}
