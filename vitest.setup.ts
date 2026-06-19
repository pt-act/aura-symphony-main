// Vitest setup — runs before the test suites.
//
// pdfjs-dist v5+ references browser canvas globals (DOMMatrix, Path2D, …) at
// import time inside display/canvas.js. The Vitest "node" environment doesn't
// define these, so any test that transitively imports `pdfjs-dist` — e.g.
// src/api/client.ts — would crash on load with "ReferenceError: DOMMatrix is
// not defined". The real app runs in the browser where these globals exist;
// these stubs only let the module import under tests. No test renders a PDF,
// so minimal no-op stubs are sufficient.
const g = globalThis as Record<string, unknown>;

class DOMMatrixStub {
  a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  constructor(_init?: unknown) {}
  multiplySelf() { return this; }
  preMultiplySelf() { return this; }
  translateSelf() { return this; }
  scaleSelf() { return this; }
  rotateSelf() { return this; }
  invertSelf() { return this; }
}

g.DOMMatrix ??= DOMMatrixStub;
g.DOMPoint ??= class {
  constructor(public x = 0, public y = 0, public z = 0, public w = 1) {}
};
g.Path2D ??= class {
  constructor(_path?: unknown) {}
  addPath() {}
};
g.ImageData ??= class {
  data: Uint8ClampedArray;
  constructor(public width = 0, public height = 0) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }
};
