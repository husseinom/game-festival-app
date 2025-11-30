import { GamePublisherDto } from "./game-publisher-dto";

export interface GameDto {
    readonly id: number;
    name: string;
    type : string
    min_age: number; // minimum age to play the game
    logo_url?: string;
    game_publisher_id : number; //publisher of the game
    max_players: number; // maximum number of players
    publisher?: GamePublisherDto; // useful to display publisher info alongside the game
}
