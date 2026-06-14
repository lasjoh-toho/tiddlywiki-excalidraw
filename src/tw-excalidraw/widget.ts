import { widget as Widget } from '$:/plugins/linonetwo/tw-react/widget.js';

import { restoreAppState, restoreElements } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/dist/types/excalidraw/element/types';
import type { AppState, BinaryFiles, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/dist/types/excalidraw/types';

import type { IChangedTiddlers } from 'tiddlywiki';

import { yesOrNo } from './utils/yes-or-no.js';

import { App, IProps } from './components/App';
import { InlineBoard } from './components/InlineBoard';

import './widget.css';

// TODO: Excalidraw v0.18.0 does not correctly respect this. A pnpm patch is used as a temporary measure. Fix awaits next release https://github.com/excalidraw/excalidraw/pull/9525
window.EXCALIDRAW_EXPORT_SOURCE = 'tw-excalidraw';

class ExcalidrawWidget extends Widget<IProps> {
  public reactComponent = App as unknown as typeof App;

  public execute(): void {
    super.execute();
    this.reactComponent = (yesOrNo(this.getAttribute('inline')) ? InlineBoard : App) as unknown as typeof App;
  }

  public getProps = () => {
    const editTitle = this.getAttribute('tiddler');

    const scrollToContent = this.getAttribute('scrollToContent', 'yes');

    const scrollX = this.getAttribute('scrollX');
    const scrollY = this.getAttribute('scrollY');

    let initialData: ExcalidrawInitialDataState = {
      // Scroll to content if scrollToContent is enabled and scrollX/Y are not set
      scrollToContent: yesOrNo(scrollToContent) && !scrollX && !scrollY,
    };

    const initialDataText = editTitle ? $tw.wiki.getTiddlerText(editTitle) ?? '' : null;

    let theme = this.getAttribute('theme');

    if (!theme) {
      const defaultTheme = $tw.wiki.getTiddlerText('$:/config/itw/tw-excalidraw/DefaultTheme', 'auto');

      if (defaultTheme === 'auto') {
        const palette = $tw.wiki.getTiddlerText('$:/palette');

        if (palette) {
          const colourScheme = $tw.wiki.getTiddler(palette)?.fields['color-scheme'];

          if (colourScheme === 'light') theme = 'light';
          else if (colourScheme === 'dark') theme = 'dark';
        }

        if (!theme) theme = 'light';
      } else theme = defaultTheme;
    }

    if (initialDataText) {
      const data = JSON.parse(initialDataText) as {
        elements: readonly ExcalidrawElement[];
        appState: Partial<AppState>;
        files: BinaryFiles;
      };

      initialData = {
        ...initialData,
        elements: restoreElements(data.elements, undefined, {
          repairBindings: true,
        }),
        appState: restoreAppState(data.appState, {
          scrollX: scrollX ? Number(scrollX) : undefined,
          scrollY: scrollY ? Number(scrollY) : undefined,
        }),
        files: data.files,
      };
    }
    return {
      tiddler: editTitle,
      initialData,
      elementId: this.getAttribute('elementId'),
      width: this.getAttribute('width', '100%'),
      height: this.getAttribute('height', '400px'),
      autoFocus: this.getAttribute('autoFocus'),
      langCode: $tw.wiki.getTiddlerText('$:/language')
        ?.replace(/^\$:\/languages\//, '')
        .replace('zh-Hans', 'zh-CN')
        .replace('zh-Hant', 'zh-TW') ?? undefined,
      theme,
      viewMode: this.getAttribute('viewMode'),
      zenMode: this.getAttribute('zenMode'),
      gridMode: this.getAttribute('gridMode'),
      onSave: this.onSave.bind(this),
    };
  };

  private isReady: boolean = false;
  private lastModified: number = 0;

  private onSave(tiddlerTitle: string | undefined, data: string, isActive: boolean): void {
    if (!tiddlerTitle) return;

    const tiddler = $tw.wiki.getTiddler(tiddlerTitle);
    const modified = tiddler?.fields.modified?.getTime() ?? 0;

    // As Excalidraw fires an onSave event on unmount, prevent infinite saving loops if this widget is not newly constructed
    if (!this.isReady) {
      this.lastModified = modified;
      this.isReady = true;
      return;
    }

    if (
      // Disturbingly, Excalidraw fires many change events for no apparent reason
      // I have not been able to find a reliable way to disambiguate these bogus events from real changes
      // This locks the only widget able to write data to the currently active one
      !isActive ||
      // We created the tiddler already, so if it does not exist, it must be deleted
      !tiddler ||
      // If the update is unnecessary
      tiddler.fields.text === data ||
      // If another instance modified the tiddler
      modified !== this.lastModified
    ) return;

    $tw.wiki.setText(tiddlerTitle, 'text', undefined, data);

    if (tiddler.fields.type !== 'application/vnd.excalidraw+json') {
      $tw.wiki.setText(tiddlerTitle, 'type', undefined, 'application/vnd.excalidraw+json');
    }

    this.lastModified = $tw.wiki.getTiddler(tiddlerTitle)?.fields.modified?.getTime() ?? 0;
  }

  refresh(changedTiddlers: IChangedTiddlers): boolean {
    const tiddlerName = this.getAttribute('tiddler');
    const changedAttributes = this.computeAttributes();

    const tiddler = tiddlerName ? $tw.wiki.getTiddler(tiddlerName) : null;
    const modified = tiddler?.fields.modified?.getTime() ?? 0;

    // Do not refresh if:
    if (
      // Another instance did not modify the tiddler
      modified === this.lastModified &&
      // Attributes did not change
      Object.keys(changedAttributes).length === 0 &&
      // Palette was not changed
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      !changedTiddlers['$:/palette'] &&
      // No configuration was changed
      !Object.keys(changedTiddlers).find((title) => title.startsWith('$:/config/itw/tw-excalidraw/'))
    ) return false;

    this.refreshSelf();

    return true;
  }

  public refreshSelf(): void {
    super.destroy();
    this.root = undefined;
    super.refreshSelf();

    // Here we set isReady to false to signal that this is undergoing a refresh
    this.isReady = false;
  }
}

declare let exports: {
  excalidraw: typeof ExcalidrawWidget;
};
exports['excalidraw'] = ExcalidrawWidget;
