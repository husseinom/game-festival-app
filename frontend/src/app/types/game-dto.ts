import { GamePublisherDto } from "./game-publisher-dto";

export interface GameDto {
    readonly id: number;
    name: string;
    type: string;
    minAge: number;
    imageUrl?: string;
    publisherId: number;
    maxPlayers: number;
    publisher?: GamePublisherDto;
}
