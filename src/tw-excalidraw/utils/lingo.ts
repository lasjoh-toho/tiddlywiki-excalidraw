/**
 * Get a UI string from the plugin language files.
 * Falls back to en-GB if the current language has no translation.
 *
 * Usage: lingo('modal/save') → "Speichern" (de-DE) or "Save" (en-GB)
 */
export function lingo(key: string): string {
  const rawLang = $tw.wiki.getTiddlerText('$:/language') ?? '';
  const langName = $tw.wiki.getTiddler(rawLang)?.fields['name'] as string | undefined ?? 'en-GB';

  const supported = ['en-GB', 'de-DE', 'zh-Hans', 'zh-Hant'];
  const lang = supported.includes(langName) ? langName : 'en-GB';

  const tiddlerTitle = `$:/plugins/itw/tw-excalidraw/language/${lang}/UI`;
  const fields = $tw.wiki.getTiddler(tiddlerTitle)?.fields ?? {};

  // Language file stores strings as fields (key: value per line parsed by TW)
  // but TW stores them as the tiddler text, so we parse manually
  const text = (fields['text'] as string | undefined) ?? '';
  const lines = text.split('\n');

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const lineKey = line.slice(0, colonIdx).trim();
    if (lineKey === key) return line.slice(colonIdx + 1).trim();
  }

  // Fallback to en-GB
  if (lang !== 'en-GB') {
    const fallbackTitle = '$:/plugins/itw/tw-excalidraw/language/en-GB/UI';
    const fallbackText = ($tw.wiki.getTiddler(fallbackTitle)?.fields['text'] as string | undefined) ?? '';
    for (const line of fallbackText.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      if (line.slice(0, colonIdx).trim() === key) return line.slice(colonIdx + 1).trim();
    }
  }

  return key; // last resort
}
