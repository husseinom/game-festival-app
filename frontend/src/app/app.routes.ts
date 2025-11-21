import { Routes } from '@angular/router';
import { GameList } from './Game/game-list/game-list';
import { GameDetails } from './Game/game-details/game-details';
import { GamePubList } from './GamePublisher/game-pub-list/game-pub-list';
import { PublisherDetails } from './GamePublisher/publisher-details/publisher-details';


export const routes: Routes = [
	{ path: '', component: GameList },
	{ path: 'games', component: GameList, title: 'liste des jeux' },
	{ path: 'game/:id', component: GameDetails },
	{ path: 'publishers', component: GamePubList, title: 'liste des éditeurs'},
	{ path: 'publisher/:id', component: PublisherDetails },
];
