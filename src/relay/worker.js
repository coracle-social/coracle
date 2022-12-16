const url = new URL('src/worker/index.js', import.meta.url)

export const worker = new Worker(url, {type: 'module'})

worker.post = (topic, payload) => worker.postMessage({topic, payload})

window.worker = worker
