import { Pipe, PipeTransform } from '@angular/core';
import { RESERVANT_TYPE_LABELS, ReservantType } from '../../types/reservant';

@Pipe({
  name: 'reservantTypeLabel',
  standalone: true
})
export class ReservantTypeLabelPipe implements PipeTransform {
  transform(type: ReservantType | string): string {
    return RESERVANT_TYPE_LABELS[type as ReservantType] || type;
  }
}
