import { RGBELoader } from "three-stdlib";

// Fetches and decodes the HDR off the main thread (the RGBE -> half float
// conversion is ~80ms of main thread on desktop). Same loader, same output
// as decoding it on the page
self.onmessage = async (e: MessageEvent<string>) => {
  try {
    const response = await fetch(e.data);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = new RGBELoader().parse(await response.arrayBuffer()) as unknown as {
      width: number;
      height: number;
      data: Uint16Array;
      type: number;
    };
    const { width, height, data, type } = parsed;
    self.postMessage({ width, height, data, type }, { transfer: [data.buffer] });
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
