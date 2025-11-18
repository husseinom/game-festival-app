export interface UserDto {
    id: number,
    login: string,
    password: string
    role: "user"| "admin"
}
