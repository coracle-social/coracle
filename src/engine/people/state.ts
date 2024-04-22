import {collection} from "@welshman/lib"
import type {Person} from "src/engine/people/model"

export const people = collection<Person>("pubkey")
