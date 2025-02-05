import type {StampedEvent, SignedEvent} from "@welshman/util"
import {deepMergeLeft} from "@welshman/lib"
import type {Extensions, AnyExtension} from "@tiptap/core"
import {CodeBlock} from "@tiptap/extension-code-block"
import type {CodeBlockOptions} from "@tiptap/extension-code-block"
import {Document} from "@tiptap/extension-document"
import {Dropcursor} from "@tiptap/extension-dropcursor"
import type {DropcursorOptions} from "@tiptap/extension-dropcursor"
import {Gapcursor} from "@tiptap/extension-gapcursor"
import {History} from "@tiptap/extension-history"
import type {HistoryOptions} from "@tiptap/extension-history"
import {Paragraph} from "@tiptap/extension-paragraph"
import type {ParagraphOptions} from "@tiptap/extension-paragraph"
import {Text} from "@tiptap/extension-text"
import {Placeholder} from "@tiptap/extension-placeholder"
import type {PlaceholderOptions} from "@tiptap/extension-placeholder"
import type {
  NostrOptions,
  FileUploadOptions,
  ImageOptions,
  LinkOptions,
  NSecRejectOptions,
} from "nostr-editor"
import {
  NostrExtension,
  Bolt11Extension,
  FileUploadExtension,
  ImageExtension,
  LinkExtension,
  NAddrExtension,
  NEventExtension,
  NProfileExtension,
  TagExtension,
  VideoExtension,
  NSecRejectExtension,
} from "nostr-editor"
import {WordCount} from "./WordCount.js"
import {CodeInline, type CodeInlineOptions} from "./CodeInline.js"
import {BreakOrSubmit, type BreakOrSubmitOptions} from "./BreakOrSubmit.js"
import {MentionNodeView, Bolt11NodeView, MediaNodeView, EventNodeView} from "../nodeviews/index.js"

export type ChildExtensionOptions<C = any, E = any> =
  | false
  | {
      extend?: Partial<E>
      config?: Partial<C>
    }

export type EmptyOptions = object

export type WelshmanExtensionOptions = {
  bolt11?: false
  breakOrSubmit?: ChildExtensionOptions<BreakOrSubmitOptions>
  codeInline?: ChildExtensionOptions<CodeInlineOptions>
  codeBlock?: ChildExtensionOptions<CodeBlockOptions>
  document?: false
  dropcursor?: ChildExtensionOptions<DropcursorOptions>
  fileUpload?: ChildExtensionOptions<FileUploadOptions>
  gapcursor?: false
  history?: ChildExtensionOptions<HistoryOptions>
  image?: ChildExtensionOptions<ImageOptions>
  link?: ChildExtensionOptions<LinkOptions>
  naddr?: ChildExtensionOptions<EmptyOptions>
  nevent?: ChildExtensionOptions<EmptyOptions>
  nprofile?: ChildExtensionOptions<EmptyOptions>
  nsecReject?: ChildExtensionOptions<NSecRejectOptions>
  paragraph?: ChildExtensionOptions<ParagraphOptions>
  placeholder?: ChildExtensionOptions<PlaceholderOptions>
  tag?: false
  text?: false
  video?: false
  wordCount?: false
}

export interface WelshmanOptions extends NostrOptions {
  submit?: () => void
  sign?: (event: StampedEvent) => Promise<SignedEvent>
  defaultUploadUrl?: string
  defaultUploadType?: "nip96" | "blossom"
  extensions?: WelshmanExtensionOptions
}

export const WelshmanExtension = NostrExtension.extend<WelshmanOptions>({
  // Return an empty object or else options can't be passed
  addOptions() {
    return {}
  },

  addExtensions() {
    const {
      sign,
      submit,
      defaultUploadUrl = "https://nostr.build",
      defaultUploadType = "nip96",
    } = this.options

    if (!sign) throw new Error("sign is a required argument to WelshmanExtension")
    if (!submit) throw new Error("submit is a required argument to WelshmanExtension")

    const extensionOptions = deepMergeLeft(this.options.extensions || {}, {
      codeInline: {
        extend: {
          renderText: (props: any) => "`" + props.node.textContent + "`",
        },
      },
      codeBlock: {
        extend: {
          renderText: (props: any) => "```" + props.node.textContent + "```",
        },
      },
      bolt11: {
        config: {
          inline: true,
          group: "inline",
        },
        extend: {
          addNodeView: () => Bolt11NodeView,
        },
      },
      image: {
        config: {
          inline: true,
          group: "inline",
          defaultUploadUrl,
          defaultUploadType,
        },
        extend: {
          addNodeView: () => MediaNodeView,
        },
      },
      video: {
        config: {
          inline: true,
          group: "inline",
          defaultUploadUrl,
          defaultUploadType,
        },
        extend: {
          addNodeView: () => MediaNodeView,
        },
      },
      nevent: {
        config: {
          inline: true,
          group: "inline",
        },
        extend: {
          addNodeView: () => EventNodeView,
        },
      },
      naddr: {
        config: {
          inline: true,
          group: "inline",
        },
        extend: {
          addNodeView: () => EventNodeView,
        },
      },
      nprofile: {
        extend: {
          addNodeView: () => MentionNodeView,
        },
      },
      breakOrSubmit: {
        config: {
          submit,
        },
      },
      fileUpload: {
        config: {
          sign,
          immediateUpload: true,
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "video/mp4",
            "video/mpeg",
            "video/webm",
          ],
        },
      },
    }) as WelshmanExtensionOptions

    const extensions: Extensions = []

    const addExtension = (extension: AnyExtension, options?: ChildExtensionOptions | false) => {
      if (options === false) return

      if (options?.extend) {
        extension = extension.extend(options.extend)
      }

      if (options?.config) {
        extension = extension.configure(options.config)
      }

      extensions.push(extension)
    }

    addExtension(Document, extensionOptions.document)
    addExtension(Text, extensionOptions.text)
    addExtension(Paragraph, extensionOptions.paragraph)
    addExtension(History, extensionOptions.history)
    addExtension(CodeBlock, extensionOptions.codeBlock)
    addExtension(CodeInline, extensionOptions.codeInline)
    addExtension(Dropcursor, extensionOptions.dropcursor)
    addExtension(FileUploadExtension, extensionOptions.fileUpload)
    addExtension(Gapcursor, extensionOptions.gapcursor)
    addExtension(BreakOrSubmit, extensionOptions.breakOrSubmit)
    addExtension(ImageExtension, extensionOptions.image)
    addExtension(LinkExtension, extensionOptions.link)
    addExtension(NAddrExtension, extensionOptions.naddr)
    addExtension(NEventExtension, extensionOptions.nevent)
    addExtension(NProfileExtension, extensionOptions.nprofile)
    addExtension(NSecRejectExtension, extensionOptions.nsecReject)
    addExtension(Placeholder, extensionOptions.placeholder)
    addExtension(TagExtension, extensionOptions.tag)
    addExtension(VideoExtension, extensionOptions.video)
    addExtension(Bolt11Extension, extensionOptions.bolt11)
    addExtension(WordCount, extensionOptions.wordCount)

    return extensions
  },
})
