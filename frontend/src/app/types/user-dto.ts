export interface UserDto {
    id: number,
    name: string,
    email: string,
    password?: string
    role: "VISITOR" | "ADMIN" | "VOLUNTEER" | "ORGANISATOR" | "SUPER_ORGANISATOR"
}
