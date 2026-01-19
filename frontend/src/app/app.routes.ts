import { Routes } from '@angular/router';
import { Login } from './shared/auth/login/login';
import { Register } from './shared/auth/register/register';
// import { Home } from './home/home/home';
import { FestivalList } from './festival/festival-list/festival-list';
import { authGuard } from './shared/auth/auth-guard';
import { adminGuard } from './admin/admin.guard';
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
    {path: 'register', component: Register},
    { path: 'festival-list', component: FestivalList, canActivate:[authGuard]},
    {path: 'festival/:id', component: FestivalDetails, canActivate:[authGuard]},
    {path: 'price-zone/:id', component: PriceZoneCard, canActivate:[authGuard]},
    { path: 'admin/users', component: UserList, canActivate:[authGuard, adminGuard] },
    { path: 'admin/reservants', component: ReservantList, canActivate:[authGuard, adminGuard] },
    { path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'games', component: GameList, title: 'liste des jeux', canActivate:[authGuard]},
	{ path: 'game/:id', component: GameDetails, canActivate:[authGuard]},
	{ path: 'publishers', component: GamePubList, title: 'liste des éditeurs', canActivate:[authGuard]},
	{ path: 'publisher/:id', component: PublisherDetails, canActivate:[authGuard]},
    { path: 'reservations', component: ReservationList, canActivate:[authGuard]},
    { path: 'reservation/:id', component: ReservationDetail, canActivate:[authGuard]},
    { path: 'reservation/:id/edit', component: ReservationEdit, canActivate:[authGuard]},
    { path: '**', redirectTo: 'login' },

];
