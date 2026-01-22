import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { 
  CreateReservationDTO, 
  Reservation, 
  ReservationStatus, 
  InvoiceStatus,
  TableSize,
  ContactLog,
  FestivalGame,
  ReservationStats
} from '../../types/reservation';

type ReservationResponse = { message: string; data: Reservation };
type MessageResponse = { message: string };
type BatchResponse = { message: string; data: Reservation[] };
type GameResponse = { message: string; data: FestivalGame };

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reservations`;

  // ============================================
  // CRUD de base
  // ============================================

  getAll(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/all`, { withCredentials: true });
  }

  getById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  getByFestival(festivalId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/festival/${festivalId}`, { withCredentials: true });
  }

  create(payload: CreateReservationDTO): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/add`, payload, { withCredentials: true });
  }

  update(id: number, payload: Partial<CreateReservationDTO>): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(`${this.baseUrl}/${id}`, payload, { withCredentials: true });
  }

  delete(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  // ============================================
  // Workflow de statut
  // ============================================

  updateStatus(id: number, status: ReservationStatus): Observable<ReservationResponse> {
    return this.http.patch<ReservationResponse>(
      `${this.baseUrl}/${id}/status`, 
      { status }, 
      { withCredentials: true }
    );
  }

  updateStatusBatch(ids: number[], status: ReservationStatus): Observable<BatchResponse> {
    return this.http.patch<BatchResponse>(
      `${this.baseUrl}/batch/status`, 
      { ids, status }, 
      { withCredentials: true }
    );
  }

  // ============================================
  // Facturation
  // ============================================

  markAsInvoiced(id: number): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(
      `${this.baseUrl}/${id}/invoice`, 
      {}, 
      { withCredentials: true }
    );
  }

  markAsPaid(id: number): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(
      `${this.baseUrl}/${id}/paid`, 
      {}, 
      { withCredentials: true }
    );
  }

  updateInvoiceStatusBatch(ids: number[], invoiceStatus: InvoiceStatus): Observable<BatchResponse> {
    return this.http.patch<BatchResponse>(
      `${this.baseUrl}/batch/invoice-status`, 
      { ids, invoice_status: invoiceStatus }, 
      { withCredentials: true }
    );
  }

  // applyPartnerDiscount(id: number): Observable<ReservationResponse> {
  //   return this.http.post<ReservationResponse>(
  //     `${this.baseUrl}/${id}/partner-discount`, 
  //     {}, 
  //     { withCredentials: true }
  //   );
  // }

  recalculatePrice(id: number): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(
      `${this.baseUrl}/${id}/recalculate`, 
      {}, 
      { withCredentials: true }
    );
  }

  // ============================================
  // Phase logistique - Gestion des jeux
  // ============================================

  requestGameList(id: number): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(
      `${this.baseUrl}/${id}/request-game-list`, 
      {}, 
      { withCredentials: true }
    );
  }

  markGameListReceived(id: number): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(
      `${this.baseUrl}/${id}/game-list-received`, 
      {}, 
      { withCredentials: true }
    );
  }

  addGames(id: number, games: { game_id: number; copy_count: number; game_size?: string; allocated_tables?: number }[]): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(
      `${this.baseUrl}/${id}/games`, 
      { games }, 
      { withCredentials: true }
    );
  }

  removeGame(festivalGameId: number): Observable<ReservationResponse> {
    return this.http.delete<ReservationResponse>(
      `${this.baseUrl}/game/${festivalGameId}`, 
      { withCredentials: true }
    );
  }

  markGamesReceived(id: number): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(
      `${this.baseUrl}/${id}/games-received`, 
      {}, 
      { withCredentials: true }
    );
  }

  markGameAsReceived(festivalGameId: number): Observable<GameResponse> {
    return this.http.post<GameResponse>(
      `${this.baseUrl}/game/${festivalGameId}/received`, 
      {}, 
      { withCredentials: true }
    );
  }

  // ============================================
  // Phase technique - Placement
  // ============================================

  placeGame(
    festivalGameId: number, 
    mapZoneId: number, 
    tableSize: TableSize, 
    allocatedTables: number
  ): Observable<GameResponse> {
    return this.http.post<GameResponse>(
      `${this.baseUrl}/game/${festivalGameId}/place`, 
      { map_zone_id: mapZoneId, table_size: tableSize, allocated_tables: allocatedTables }, 
      { withCredentials: true }
    );
  }

  unplaceGame(festivalGameId: number): Observable<GameResponse> {
    return this.http.delete<GameResponse>(
      `${this.baseUrl}/game/${festivalGameId}/place`, 
      { withCredentials: true }
    );
  }

  // ============================================
  // Historique des contacts
  // ============================================

  getContactLogs(id: number): Observable<ContactLog[]> {
    return this.http.get<ContactLog[]>(
      `${this.baseUrl}/${id}/contact-logs`, 
      { withCredentials: true }
    );
  }

  addContactLog(id: number, notes: string): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(
      `${this.baseUrl}/${id}/contact-log`, 
      { notes }, 
      { withCredentials: true }
    );
  }

  // ============================================
  // Statistiques
  // ============================================

  getStats(festivalId: number): Observable<ReservationStats> {
    return this.http.get<ReservationStats>(
      `${this.baseUrl}/festival/${festivalId}/stats`, 
      { withCredentials: true }
    );
  }
}
