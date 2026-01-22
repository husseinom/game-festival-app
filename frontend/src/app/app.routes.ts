import { Routes } from '@angular/router';
import { Login } from './shared/auth/login/login';
import { Register } from './shared/auth/register/register';
import { FestivalList } from './festival/festival-list/festival-list';
import { authGuard } from './shared/auth/auth-guard';
import { adminGuard, organisatorGuard, superOrganisatorGuard } from './shared/guards/role.guard';
import { GameList } from './Game/game-list/game-list';
import { GameDetails } from './Game/game-details/game-details';
import { GamePubList } from './GamePublisher/game-pub-list/game-pub-list';
import { PublisherDetails } from './GamePublisher/publisher-details/publisher-details';
import { FestivalDetails } from './festival/festival-details/festival-details';
import { PriceZoneDetailsComponent } from './PriceZone/price-zone-details/price-zone-details';
import { PriceZonePublicComponent } from './PriceZone/price-zone-public/price-zone-public';
import { ReservationList } from './reservation/reservation-list/reservation-list';
import { ReservationDetail } from './reservation/reservation-detail/reservation-detail';
import { ReservationEdit } from './reservation/reservation-edit/reservation-edit';
import { Admin } from './admin/admin/admin';

export const routes: Routes = [
    // Auth routes
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    
    // Public pages (accessible without login)
    { path: 'festival-list', component: FestivalList },
    { path: 'festival/:id', component: FestivalDetails },
    { path: 'festival/:festivalId/zone/:id', component: PriceZonePublicComponent },
    { path: 'games', component: GameList, title: 'liste des jeux' },
    { path: 'game/:id', component: GameDetails },
    { path: 'publishers', component: GamePubList, title: 'liste des éditeurs' },
    { path: 'publisher/:id', component: PublisherDetails },
    
    // Super-Organisateur: reservations, zones management
    { path: 'reservations', component: ReservationList, canActivate: [authGuard, superOrganisatorGuard] },
    { path: 'reservation/:id', component: ReservationDetail, canActivate: [authGuard, superOrganisatorGuard] },
    { path: 'reservation/:id/edit', component: ReservationEdit, canActivate: [authGuard, superOrganisatorGuard] },
    { path: 'price-zone/:id', component: PriceZoneDetailsComponent, canActivate: [authGuard, superOrganisatorGuard] },
    
    // Admin: unified admin dashboard (includes user management, system settings, etc.)
    { path: 'admin', component: Admin, canActivate: [authGuard, adminGuard] },
    
    // Redirects
    { path: '', pathMatch: 'full', redirectTo: 'festival-list' },
    { path: '**', redirectTo: 'festival-list' },
];
