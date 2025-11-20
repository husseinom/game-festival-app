import { Routes } from '@angular/router';
import { Login } from './shared/auth/login/login';
// import { Home } from './home/home/home';
import { FestivalList } from './festival/festival-list/festival-list';
// import { Admin } from './admin/admin/admin';
import { authGuard } from './shared/auth/auth-guard';
// import { adminGuard } from './admin/admin-guard';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'festival-list', component: FestivalList},
    // { path: 'admin', component: Admin, canActivate:[authGuard, adminGuard] },
    { path: '', pathMatch: 'full', redirectTo: 'festival-list' },
    { path: '**', redirectTo: 'festival-list' },
];
