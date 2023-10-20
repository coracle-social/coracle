import {Fetch} from "hurdak"
import {generatePrivateKey, type Event} from "nostr-tools"
import {signer} from "src/engine/session/derived"
import {buildEvent} from "src/engine/network/utils"
import crypto from "crypto"
import { get } from "svelte/store"

export const uploadToMediaProvider = async (url: string, body: FormData): Promise<string> => {


  //Convert MediaProvider URL to NIP96 upload URL
  url = await getMediaProviderURL(url);

  //Prepare NIP98 event
  const event : Event = await prepareNIP98Event(url, "POST", body)
  const response = await Fetch.fetchJson(url, {
    body,
    method: "POST",
    headers: {
      Authorization: `Nostr ${btoa(JSON.stringify(event))}`,
  }})
  console.debug("response", response)

  // If the media provider use delayed processing, we need to wait for the processing to be done
  if(response.processing_url.length > 0){

    //Prepare NIP98 event	for delayed processing. TODO. If the delayed processing is too long, the event "created_at" maybe expire. It depends on the media provider.
    const event_processing : Event = await prepareNIP98Event(response.processing_url, "GET", body)
    let processing_response = await Fetch.fetchJson(response.processing_url, {
      method: "GET",
      headers: {
        Authorization: `Nostr ${btoa(JSON.stringify(event_processing))}`,
      }})
    console.debug("processing_response", processing_response)

    let timeout : number = 0
    while(processing_response.status == "processing"){
      if (timeout == 120){ // 2 minutes of timeout. TODO, make it configurable
        console.debug("Processing timeout reached");
        return "";
      }
      processing_response = await Fetch.fetchJson(response.processing_url, {
        method: "GET",
        headers: {
          Authorization: `Nostr ${btoa(JSON.stringify(event_processing))}`,
        }})

      if (processing_response.status == "success"){
        console.debug("Processing done");
        return findUrlTag(processing_response.nip94_event.tags)
      }
      console.debug("Status", processing_response.status, "(" + processing_response.percentage + "%)")
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second of delay
      timeout++
    }
  }
    
  if(response.nip94_event.tags.length > 0){
    return findUrlTag(response.nip94_event.tags)
  }else{
    return ""
  }

}

// This function prepare NIP98 event
async function prepareNIP98Event(url: string, method: string, body : FormData) : Promise<Event> {

  const template = buildEvent(27235, {
    tags: [
      ["u", url],
      ["method", method],
      ["payload", crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex")]
    ],
  })

  const $signer = signer.get()
  const event : Event = await ($signer.canSign()

  ? $signer.signAsUser(template)
  : $signer.signWithKey(template, generatePrivateKey()))

  return event;

}

// This function find the url tag in the NIP94 event
function findUrlTag(tags: [string, string][]): string {
  for (const tag of tags) {
    if (tag[0] === "url") {
      return tag[1]
    }
  }
  return ""
}

const getMediaProviderURL = async (url:string): Promise<string> => {
  
  let NIP96_json = await Fetch.fetchJson(url, {method: "GET",})
  console.debug("NIP96_json", NIP96_json)
  if (NIP96_json.api_url.length > 0){
    return NIP96_json.api_url
  }
  return "";
}
