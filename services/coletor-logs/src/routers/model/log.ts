import { isPromise } from "util/types"

export interface Log{
    timestamp: number
    domain: string
    status: string | null
    client:{
        ip: string
        name: string | null
    }
}