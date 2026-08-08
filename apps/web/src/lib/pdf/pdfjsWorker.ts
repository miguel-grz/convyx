import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

/**
 * Starts the thread pdf.js parses and rasterises on, and returns its stop.
 *
 * pdf.js can start that thread itself, from `GlobalWorkerOptions.workerSrc`, and
 * that is the usual way to do it — but only from a document. Its bootstrap reads
 * `window.location` to decide whether the script is same-origin, and every call
 * here is made from inside a worker, where there is no `window`. The read
 * throws, pdf.js catches it, and quietly falls back to what it calls a fake
 * worker: it imports the worker bundle into whichever thread asked for one and
 * runs there instead.
 *
 * That is not only the lost parallelism the callers want. The bundle installs
 * its own message handler on `self` the moment it is imported, so the fake
 * worker leaves a second, foreign listener on the tool's own port — pdf.js
 * protocol messages arrive at `runInWorker`, and the tool's arrive at pdf.js.
 *
 * Constructing the thread here and handing over the port skips that bootstrap
 * entirely. `workerPort` takes precedence over `workerSrc`, which is left unset
 * so that a thread which cannot start fails where it happens rather than
 * degrading back into the arrangement above.
 */
export function startPdfjsWorker(): () => void {
  const thread = new Worker(workerUrl, { type: 'module' });
  pdfjs.GlobalWorkerOptions.workerPort = thread;

  return () => {
    pdfjs.GlobalWorkerOptions.workerPort = null;
    thread.terminate();
  };
}
