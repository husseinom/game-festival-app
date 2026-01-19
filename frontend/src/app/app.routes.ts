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
import { UserList } from './admin/user-list/user-list';
import { FestivalDetails } from './festival/festival-details/festival-details';
import { PriceZoneCard } from './PriceZone/price-zone-card/price-zone-card';
import { ReservationList } from './reservation/reservation-list/reservation-list';
import { ReservationDetail } from './reservation/reservation-detail/reservation-detail';
import { ReservationEdit } from './reservation/reservation-edit/reservation-edit';
import { ReservantList } from './reservant/reservant-list/reservant-list';


export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    
    // Pages publiques (visiteur non connecté)
    { path: 'festival-list', component: FestivalList },
    { path: 'festival/:id', component: FestivalDetails },
    { path: 'games', component: GameList, title: 'liste des jeux' },
    { path: 'game/:id', component: GameDetails },
    { path: 'publishers', component: GamePubList, title: 'liste des éditeurs' },
    { path: 'publisher/:id', component: PublisherDetails },
    
    // Super-Organisateur : réservations, zones et réservants
    { path: 'reservations', component: ReservationList, canActivate: [authGuard, superOrganisatorGuard] },
    { path: 'reservation/:id', component: ReservationDetail, canActivate: [authGuard, superOrganisatorGuard] },
    { path: 'price-zone/:id', component: PriceZoneCard, canActivate: [authGuard, superOrganisatorGuard] },
    { path: 'reservants', component: ReservantList, canActivate: [authGuard, superOrganisatorGuard] },
    
    // Admin uniquement : gestion des utilisateurs
    { path: 'admin/users', component: UserList, canActivate: [authGuard, adminGuard] },
    
    { path: '', pathMatch: 'full', redirectTo: 'festival-list' },
    { path: '**', redirectTo: 'festival-list' },
];
