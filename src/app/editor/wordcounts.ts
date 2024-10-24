import {Extension} from "@tiptap/core"
import {writable} from "svelte/store"

export const WordCount = Extension.create({
  name: "wordCount",

  addStorage() {
    return {
      words: writable(0),
      characters: writable(0),
    }
  },

  onUpdate() {
    const text = this.editor.state.doc.textContent
    this.storage.characters.set(text.length)
    this.storage.words.set(text.split(/\s+/).filter(word => word.length > 0).length)
  },
})
