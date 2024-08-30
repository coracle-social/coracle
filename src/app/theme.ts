import {synced} from "@welshman/store"

export const theme = synced<string>("theme", "dark")
