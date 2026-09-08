import {makeSearch} from "src/util/misc"

export type KindOption = {
  label: string
  kind: number
}

export const makeKindSearch = (options: KindOption[]) =>
  makeSearch<number, KindOption>(options, {
    getValue: (option: KindOption) => option.kind,
    fuseOptions: {keys: ["kind", "label"]},
    displayValue: (kind: number, option?: KindOption) =>
      option ? `${option.label} (kind ${kind})` : `Kind ${kind}`,
  })
