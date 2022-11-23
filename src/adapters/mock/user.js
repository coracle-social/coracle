import {writable} from "svelte/store"
import {getLocalJson, setLocalJson} from "src/util/misc"

export const user = writable(getLocalJson("coracle/user"))

user.subscribe($user => setLocalJson("coracle/user", $user))
