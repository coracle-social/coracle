import {last} from "ramda"
import type {Handle} from "src/engine/model"

export const displayHandle = (handle: Handle) =>
  handle.address.startsWith("_@") ? last(handle.address.split("@")) : handle.address
