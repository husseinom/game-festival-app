import { Component, input, output, effect, computed } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PriceZone } from '../../types/price-zone';
import { MapZone } from '../../types/map-zone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-price-zone-edit-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './price-zone-edit-form.html',
  styleUrls: ['./price-zone-edit-form.css']
})
export class PriceZoneEditForm {
  priceZone = input.required<PriceZone>();
  otherPriceZone = input<PriceZone | undefined>();
  festivalMapZones = input<MapZone[]>([]);
  canEditTables = input<boolean>(false);

  updated = output<{ id: number, updates: Partial<PriceZone> & { mapZoneIds?: number[] } }>();
  cancelled = output<void>();

  readonly form = new FormGroup({
    table_price: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    small_tables: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.min(0)]
    }),
    large_tables: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.min(0)]
    }),
    city_tables: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.min(0)]
    }),
    mapZoneIds: new FormControl<number[]>([], { nonNullable: true })
  });

  // Compute available map zones for selection
  availableMapZones = computed(() => {
    const currentPZ = this.priceZone();
    const currentMapZoneIds = currentPZ.mapZones?.map(mz => mz.id) || [];
    return this.festivalMapZones().filter(mz => 
      currentMapZoneIds.includes(mz.id) || !this.isMapZoneAssigned(mz.id)
    );
  });

  // Check if a map zone is assigned to the other price zone
  private isMapZoneAssigned(mapZoneId: number): boolean {
    const other = this.otherPriceZone();
    if (!other) return false;
    return other.mapZones?.some(mz => mz.id === mapZoneId) || false;
  }

  // Compute max tables based on other price zone
  maxTables = computed(() => {
    const other = this.otherPriceZone();
    const current = this.priceZone();
    
    if (!other || !this.canEditTables()) {
      return {
        small: current.small_tables,
        large: current.large_tables,
        city: current.city_tables
      };
    }

    // Total tables from festival (assuming they sum up)
    const totalSmall = current.small_tables + other.small_tables;
    const totalLarge = current.large_tables + other.large_tables;
    const totalCity = current.city_tables + other.city_tables;

    return {
      small: totalSmall,
      large: totalLarge,
      city: totalCity
    };
  });

  constructor() {
    effect(() => {
      const pz = this.priceZone();
      if (pz) {
        const mapZoneIds = pz.mapZones?.map(mz => mz.id) || [];
        this.form.patchValue({
          table_price: pz.table_price,
          small_tables: pz.small_tables,
          large_tables: pz.large_tables,
          city_tables: pz.city_tables,
          mapZoneIds: mapZoneIds
        });
      }
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    
    if (this.form.invalid) {
      return;
    }

    const values = this.form.value;
    const pz = this.priceZone();

    const updates: Partial<PriceZone> & { mapZoneIds?: number[] } = {
      table_price: values.table_price!,
      mapZoneIds: values.mapZoneIds,
      ...(this.canEditTables() && {
        small_tables: values.small_tables!,
        large_tables: values.large_tables!,
        city_tables: values.city_tables!
      })
    };

    this.updated.emit({
      id: pz.id,
      updates
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  toggleMapZone(mapZoneId: number): void {
    const current = this.form.value.mapZoneIds || [];
    const index = current.indexOf(mapZoneId);
    
    if (index > -1) {
      // Remove
      this.form.patchValue({
        mapZoneIds: current.filter(id => id !== mapZoneId)
      });
    } else {
      // Add
      this.form.patchValue({
        mapZoneIds: [...current, mapZoneId]
      });
    }
  }

  isMapZoneSelected(mapZoneId: number): boolean {
    const selected = this.form.value.mapZoneIds || [];
    return selected.includes(mapZoneId);
  }
}
