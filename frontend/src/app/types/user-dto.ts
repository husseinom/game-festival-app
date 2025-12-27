export type Role = "VISITOR" | "ADMIN" | "VOLUNTEER" | "ORGANISATOR" | "SUPER_ORGANISATOR";

export interface UserDto {
    id: number,
    name: string,
    email: string,
    password?: string
    role: Role
}
