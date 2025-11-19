export interface GameDto {
    readonly id: number | null;
    name: string;
    type : string
    ageMin: number; // minimum age to play the game
    logoUrl: string|undefined;
    edition : string; // edition of the game
    MaxPlayers: number; // maximum number of players
}
