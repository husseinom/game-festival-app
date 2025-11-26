export interface Festival {
    id: number,
    name: string,
    logo: string |undefined,
    location: string,
    total_tables: number | undefined,
    startDate: Date,
    endDate: Date,
}
