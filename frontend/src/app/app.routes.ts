import { Routes } from '@angular/router';
import { Login } from './shared/auth/login/login';
import { Register } from './shared/auth/register/register';
// import { Home } from './home/home/home';
import { FestivalList } from './festival/festival-list/festival-list';
// import { Admin } from './admin/admin/admin';
import { authGuard } from './shared/auth/auth-guard';
// import { adminGuard } from './admin/admin-guard';
import { GameList } from './Game/game-list/game-list';
import { GameDetails } from './Game/game-details/game-details';
import { GamePubList } from './GamePublisher/game-pub-list/game-pub-list';
import { PublisherDetails } from './GamePublisher/publisher-details/publisher-details';


export const routes: Routes = [
    { path: 'login', component: Login },
    {path: 'register', component: Register},
    { path: 'festival-list', component: FestivalList, canActivate:[authGuard]},
    // { path: 'admin', component: Admin, canActivate:[authGuard, adminGuard] },
    { path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'games', component: GameList, title: 'liste des jeux', canActivate:[authGuard]},
	{ path: 'game/:id', component: GameDetails, canActivate:[authGuard]},
	{ path: 'publishers', component: GamePubList, title: 'liste des éditeurs', canActivate:[authGuard]},
	{ path: 'publisher/:id', component: PublisherDetails, canActivate:[authGuard]},
    { path: '**', redirectTo: 'login' },

];
