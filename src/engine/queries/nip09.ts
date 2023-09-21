import {prop} from "ramda"
import {deletes} from "src/engine/state"

export const deletesSet = deletes.derived($deletes => new Set($deletes.map(prop("value"))))
