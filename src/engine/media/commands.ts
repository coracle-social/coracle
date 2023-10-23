import {Fetch} from "hurdak"
import {generatePrivateKey, type Event} from "nostr-tools"
import {signer} from "src/engine/session/derived"
import {buildEvent} from "src/engine/network/utils"
import crypto from "crypto"
import { Tags } from "src/util/nostr"
import {cached} from "src/util/lruCache"
import {poll} from "hurdak"

export const uploadToMediaProvider = async (url: string, body: FormData): Promise<string> => {

  //Convert MediaProvider URL to NIP96 upload URL
  url = await getMediaProviderURL(url);

  //Prepare NIP98 event for each field type (file, text, etc) of formdata
  const event : Event = await prepareNIP98Event(url, "POST", body)

  const response = await Fetch.fetchJson(url, {
    body,
    method: "POST",
    headers: {
      Authorization: `Nostr ${btoa(JSON.stringify(event))}`,
  }});
  console.debug("response", response);

  // If the media provider use delayed processing, we need to wait for the processing to be done
  if(response.processing_url.length > 0){

    //Prepare NIP98 event	for delayed processing. TODO. If the delayed processing is too long, the event "created_at" maybe expire. It depends on the media provider.
    const eventProcessing : Event = await prepareNIP98Event(response.processing_url, "GET", body)
    let processingResponse = await Fetch.fetchJson(response.processing_url, {
      method: "GET",
      headers: {
        Authorization: `Nostr ${btoa(JSON.stringify(eventProcessing))}`,
      }});

    // let timeout : number = 0;
    // let test = poll(1000, async () => {
    //   if (timeout == 120){ // 2 minutes of timeout. TODO, make it configurable
    //     console.debug("Processing timeout reached");
    //     return "";
    //   };
    //   processingResponse = await Fetch.fetchJson(response.processing_url, {
    //     method: "GET",
    //     headers: {
    //       Authorization: `Nostr ${btoa(JSON.stringify(eventProcessing))}`,
    //     }});
    //   console.debug("Processing status", processingResponse.status, "(" + processingResponse.percentage + "%)")
    //   timeout++
    //   if (processingResponse.status == "success"){
    //     console.debug("Processing done");
    //     return processingResponse.nip94_event.tags.type("url").values().first()
    //   };
    // });

    let timeout : number = 0;
    while(processingResponse.status == "processing"){
      if (timeout == 120){ // 2 minutes of timeout. TODO, make it configurable
        console.debug("Processing timeout reached");
        return "";
      };
      processingResponse = await Fetch.fetchJson(response.processing_url, {
        method: "GET",
        headers: {
          Authorization: `Nostr ${btoa(JSON.stringify(eventProcessing))}`,
        }});

      if (processingResponse.status == "success"){
        console.debug("Processing done");
        return Tags.from(processingResponse.nip94_event).type("url").values().first();
      };
      console.debug("Processing status", processingResponse.status, "(" + processingResponse.percentage + "%)")
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second of delay
      timeout++
    };
  };
    
  if(response.nip94_event.tags.length > 0){
    console.log("response.nip94_event.tags", Tags.from(response.nip94_event).type("url").values().first());
    return Tags.from(response.nip94_event).type("url").values().first();
  };

  return "";
}

// This function prepare NIP98 event
const prepareNIP98Event = async(url: string, method: string, body : FormData) : Promise<Event> => {

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

export const getMediaProviderURL = cached({
  maxSize: 100,
  getKey: ([url]) => url,
  getValue: ([url]) => fetchMediaProviderURL(url),
})

const fetchMediaProviderURL = async (url:string): Promise<string> => {
  let NIP96json = await Fetch.fetchJson(url, {method: "GET",})
  console.debug("NIP96_json", NIP96json) 
  if (NIP96json.api_url.length > 0){
    return NIP96json.api_url
  }
  return "";
}