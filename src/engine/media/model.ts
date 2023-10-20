export type NIP98_event = {
	status: string, 
	message: string,
    processing_url: string,
	nip94_event : NIP94_event
    }

 export type NIP94_event = {
    id : string,
    pubkey: string,
    created_at: string,
    kind: 1063,
    tags: [
            ["url", string],
            ["m", string],
            ["x", string],
            ["ox", string],
            ["size", string],
            ["dim",string],
            ["magnet", string],
            ["i", string],
            ["blurhash", string]
    ],
    content: string,
    sig : string,
}