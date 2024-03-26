import {collection} from "@coracle.social/lib"
import type {Person} from "src/engine/people/model"

export const people = collection<Person>("pubkey")
