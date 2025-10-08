import { isPromise } from "util/types"

export interface Log{
    timestamp: number
    domain: string
    client:{
        ip: string
        name: string | null
    }
}