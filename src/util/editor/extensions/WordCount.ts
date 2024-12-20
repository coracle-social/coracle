import {Extension} from "@tiptap/core"

export const WordCount = Extension.create({
  name: "wordCount",

  addStorage() {
    return {
      words: 0,
      chars: 0,
    }
  },

  onUpdate() {
    const text = this.editor.state.doc.textContent

    this.storage.words = text.split(/\s+/).filter(word => word.length > 0).length
    this.storage.chars = text.length
  },
})
