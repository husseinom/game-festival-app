
import { Component, output, input, effect } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GamePublisherDto } from '../../../types/game-publisher-dto';

// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-publisher-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
  templateUrl: './publisher-form.html',
  styleUrl: './publisher-form.css'
})
export class PublisherForm {
  newPublisher = output<Omit<GamePublisherDto, 'id'>>()
  updatePublisher = output<{ id: number; publisher: Omit<GamePublisherDto, 'id'> }>()

  editingPublisher = input<GamePublisherDto | null>(null)

  readonly form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)] })
  })

  constructor() {
    effect(() => {
      const p = this.editingPublisher();
      if (p) {
        this.form.patchValue({ name: p.name as string })
      } else {
        this.form.reset()
      }
    })
  }

  submit(): void {
    const value = this.form.value
    const publisher: Omit<GamePublisherDto, 'id'> = {
      name: value.name as string,
      logoUrl: undefined
    }

    const editing = this.editingPublisher()
    if (editing && editing.id !== null) {
      this.updatePublisher.emit({ id: editing.id, publisher })
    } else {
      this.newPublisher.emit(publisher)
    }
  }

  get isEditing(): boolean {
    return this.editingPublisher() !== null
  }

}
