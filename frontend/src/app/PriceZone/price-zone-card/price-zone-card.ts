import { Component, inject, input, output } from '@angular/core';
import { PriceZone } from '../../types/price-zone';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog-data/confirm-dialog-data';
import { RoleService } from '../../shared/services/role.service';

@Component({
  selector: 'app-price-zone-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './price-zone-card.html',
  styleUrl: './price-zone-card.css',
})
export class PriceZoneCard {
  private readonly dialog = inject(MatDialog);
  private readonly roleService = inject(RoleService);

  public pz = input<PriceZone | null>(null);
  public canEdit = input<boolean>(true); // Can edit if there are 2+ price zones
  public isEditing = input<boolean>(false); // Is editing mode active

  card = output<number>();
  edit = output<number>();
  remove = output<number>();
  isSelected = input<boolean>(false);

  // Role-based permissions
  readonly canManage = this.roleService.canManageSpaces;

  onCardClick(event?: Event): void {
    // Card click -> show details
    event?.stopPropagation();
    const g = this.pz();
    if (g && g.id !== null) {
      this.card.emit(g.id);
    }
  }

  onEditClick(event: Event): void {
    // Edit button -> open form
    event.stopPropagation();
    const pz = this.pz();
    if (pz && pz.id !== null) {
      this.edit.emit(pz.id);
    }
  }

  onDeleteClick(event: Event): void {
    // Delete button
    event.stopPropagation();
    const pz = this.pz();
    
    if (pz && pz.id !== null) {
      const dialogData: ConfirmDialogData = {
        title: '⚠️ Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer la zone "${pz.name}" ?\n\n⚠️ Si cette zone contient des réservations, elle ne pourra pas être supprimée.\n⚠️ Les zones de plan seront transférées vers l'autre zone de prix.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      };

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '450px',
        data: dialogData,
        enterAnimationDuration: '300ms',
        exitAnimationDuration: '200ms',
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.remove.emit(pz.id);
        }
      });
    }
  }
}
