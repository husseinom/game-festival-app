export interface GamePublisherDto {
    readonly id: number;
    name: string;
    logoUrl: string|undefined;
    exposant?: boolean;
    distributeur?: boolean;
}

