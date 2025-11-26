import { GamePublisherDto } from "./game-publisher-dto";

export interface GameDto {
    readonly id: number;
    name: string;
    type : string
    ageMin: number; // minimum age to play the game
    logoUrl: string|undefined;
    editeur : string; //publisher of the game
    MaxPlayers: number; // maximum number of players
}
