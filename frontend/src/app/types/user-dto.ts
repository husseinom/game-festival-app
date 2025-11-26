export interface UserDto {
    id: number,
    name: string,
    email: string,
    password: string
    role: "visitor"| "admin"| "volunteer"| "organisator"| "super_organisator"
}
