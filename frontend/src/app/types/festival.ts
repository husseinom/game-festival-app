export interface Festival {
    id: number,
    name: string,
    logo: string |undefined,
    location: string,
    total_table_nb: number | undefined,
    start: Date,
    end: Date,
}
