export function imageUrl(source: string, width: number) {
  try {
    const url = new URL(source, window.location.origin);
    if (url.hostname === "images.unsplash.com") {
      url.searchParams.set("w", String(width));
      url.searchParams.set("auto", "format,compress");
      url.searchParams.set("q", width >= 800 ? "84" : "78");
    }
    return url.toString();
  } catch {
    return source;
  }
}

export function imageSrcSet(source: string) {
  return [320, 640, 900, 1200].map(width => `${imageUrl(source, width)} ${width}w`).join(", ");
}
