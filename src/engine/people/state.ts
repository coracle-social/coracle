import {collection} from "src/engine/core/utils"
import type {Person} from "src/engine/people/model"

export const people = collection<Person>("pubkey")
