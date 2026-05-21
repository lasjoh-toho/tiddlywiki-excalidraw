import type { IDefaultWidgetProps } from '$:/plugins/linonetwo/tw-react/index.js';
import { ParentWidgetContext } from '$:/plugins/linonetwo/tw-react/index.js';

import type { ExcalidrawElement, ExcalidrawEmbeddableElement, NonDeleted, OrderedExcalidrawElement } from '@excalidraw/element/dist/types/element/src/types';
import { Excalidraw, Footer, MainMenu, restoreElements, serializeAsJSON, viewportCoordsToSceneCoords } from '@excalidraw/excalidraw';
import type { AppState, BinaryFiles, ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/dist/types/excalidraw/types';

import '@excalidraw/excalidraw/index.css';

import { PositionObserver } from 'position-observer';

import type { Tiddler } from 'tiddlywiki';

import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

import { yesOrNo } from '../utils/yes-or-no.js';
import { MainMenuItemEmbedTiddler } from './MainMenuItemEmbedTiddler.js';
import { MainMenuItemEnterLayout } from './MainMenuItemEnterLayout.js';
import { MainMenuItemExitLayout } from './MainMenuItemExitLayout.js';
import { TiddlerEmbed } from './TiddlerEmbed.js';
import { Transclude } from './Transclude.js';
import { WebEmbed } from './WebEmbed.js';

export interface IProps {
  tiddler?: string;

  initialData?: ExcalidrawInitialDataState;

  elementId?: string;

  width: string;
  height: string;

  autoFocus?: string;

  langCode?: string;

  theme: string;

  viewMode?: string;
  zenMode?: string;
  gridMode?: string;

  onSave: (tiddler: string | undefined, data: string, isActive: boolean) => void;
}

export function App(props: IProps & IDefaultWidgetProps) {
  const {
    tiddler,
    initialData,
    elementId,
    width,
    height,
    autoFocus,
    langCode,
    theme,
    viewMode,
    zenMode,
    gridMode,
    onSave,
    parentWidget,
  } = props;

  const containerElementReference = useRef<HTMLDivElement>(null);

  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  function insertTiddlerEmbed(title: string, x: number, y: number): void {
    if (!excalidrawAPI) return;

    const embed = restoreElements([{
      type: 'embeddable',
      x,
      y,
      width: 560,
      height: 315,
      link: `{{${title}}}`,
      roundness: {
        type: 3,
      },
    } as unknown as ExcalidrawEmbeddableElement], undefined);

    excalidrawAPI.updateScene({
      elements: [...excalidrawAPI.getSceneElements(), ...embed],
    });
  }

  useEffect(() => {
    if (!excalidrawAPI) return;

    function handler(event: {
      param?: string;
      paramObject?: Record<string, unknown>;
    }): boolean {
      if (!excalidrawAPI) return true;

      const eventTiddler = event.paramObject?.tiddler;

      if (!eventTiddler || typeof eventTiddler !== 'string' || eventTiddler !== tiddler || !event.param) return true;

      const appState = excalidrawAPI.getAppState();

      insertTiddlerEmbed(event.param, appState.scrollX, appState.scrollY);

      return false;
    }

    $tw.rootWidget.addEventListener('tw-excalidraw-search', handler);

    return () => {
      // removeEventListener() only exists on v5.3.7+
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if ($tw.rootWidget.removeEventListener) {
        $tw.rootWidget.removeEventListener('tw-excalidraw-search', handler);
      }
      // If we are on a version prior to that, there is no need to do anything
      // Old event listeners are overridden when a new one is registered
    };
  }, [excalidrawAPI]);

  useEffect(() => {
    if (tiddler && !$tw.wiki.getTiddler(tiddler)) {
      $tw.wiki.addTiddler({
        title: tiddler,
      });
    }
  }, [tiddler]);

  useEffect(() => {
    excalidrawAPI?.scrollToContent(elementId, {
      fitToContent: true,
      animate: false,
    });
  }, [excalidrawAPI, elementId]);

  // Recompute offsets after every position change
  useEffect(() => {
    if (!containerElementReference.current) return;

    const observer = new PositionObserver(() => {
      excalidrawAPI?.refresh();
    });

    observer.observe(containerElementReference.current);

    return () => {
      if (containerElementReference.current) observer.unobserve(containerElementReference.current);
    };
  }, [containerElementReference, excalidrawAPI]);

  function handleChange(
    excalidrawElements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    binaryFiles: BinaryFiles,
  ): void {
    // This is an awful idea, but there is no other option
    if (!isReady && excalidrawAPI) {
      setIsReady(true);

      if (elementId) {
        excalidrawAPI.scrollToContent(elementId, {
          fitToContent: true,
          animate: false,
        });
      }
    }

    const isActive = containerElementReference.current?.contains(document.activeElement) ?? false;

    const data = serializeAsJSON(excalidrawElements, appState, binaryFiles, 'local');

    onSave(tiddler, data, isActive);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    if (viewMode || !excalidrawAPI) return;

    const tiddler = JSON.parse(event.dataTransfer.getData('text/vnd.tiddler')) as Tiddler['fields'];

    if (!$tw.wiki.getTiddler(tiddler.title)) {
      parentWidget?.dispatchEvent({
        type: 'tm-import-tiddlers',
        param: JSON.stringify([tiddler]),
      });

      if ($tw.wiki.getTiddlerText('$:/layout') !== '$:/core/ui/PageTemplate') {
        props.parentWidget?.dispatchEvent({
          type: 'tm-modal',
          param: '$:/plugins/itw/tw-excalidraw/ui/import-modal',
          paramObject: {
            tiddler,
          },
        });
      }
    }

    const sceneCoordinates = viewportCoordsToSceneCoords({
      clientX: event.clientX,
      clientY: event.clientY,
    }, {
      ...excalidrawAPI.getAppState(),
    });

    insertTiddlerEmbed(tiddler.title, sceneCoordinates.x, sceneCoordinates.y);
  }

  function handleFocus(): void {
    if ($tw.wiki.getTiddlerText('$:/temp/itw/tw-excalidraw/FocusedTiddler') === props.tiddler) return;

    $tw.wiki.setText('$:/temp/itw/tw-excalidraw/FocusedTiddler', 'text', undefined, props.tiddler);
  }

  function handleWheelCapture(event: React.WheelEvent<HTMLDivElement>): void {
    if (!containerElementReference.current?.contains(document.activeElement)) event.stopPropagation();
  }

  function handleOpenLayout(): void {
    $tw.wiki.setText('$:/layout', 'text', undefined, '$:/plugins/itw/tw-excalidraw/ui/layout');
  }

  function handleExitLayout(): void {
    $tw.wiki.setText('$:/layout', 'text', undefined, '$:/core/ui/PageTemplate');
  }

  function handleEmbedTiddler(): void {
    props.parentWidget?.dispatchEvent({
      type: 'tm-modal',
      param: '$:/plugins/itw/tw-excalidraw/ui/search-modal',
      paramObject: {
        tiddler,
      },
    });
  }

  function generateLinkForSelection(id: string): string {
    return `##${id}`;
  }

  function matchTiddlerLink(link: string): string | undefined {
    // Tiddler links are surrounded by square brackets
    // [[title]]
    return link.match(/^\[\[(.+)\]\]$/)?.[1];
  }

  function matchTiddlerTransclusion(link: string): string | undefined {
    // Tiddler transclusions are surrounded by curly brackets
    // {{title}}
    return link.match(/^{{(.+)}}$/)?.[1];
  }

  function matchElementLink(link: string): string | undefined {
    // Element links are prefixed just like DataTiddler named properties
    // ##element
    return link.match(/^##(.+)$/)?.[1];
  }

  function handleLinkOpen(element: NonDeleted<ExcalidrawElement>, event: Event): void {
    const link = element.link;

    if (!link) return;

    const tiddlerLink = matchTiddlerLink(link);
    const tiddlerTransclusion = matchTiddlerTransclusion(link);
    const elementLink = matchElementLink(link);

    if (tiddlerLink) {
      parentWidget?.dispatchEvent({
        type: 'tm-navigate',
        navigateTo: tiddlerLink,
      });

      event.preventDefault();
    } else if (tiddlerTransclusion) {
      parentWidget?.dispatchEvent({
        type: 'tm-navigate',
        navigateTo: tiddlerTransclusion,
      });

      event.preventDefault();
    } else if (elementLink) {
      excalidrawAPI?.scrollToContent(elementLink);

      event.preventDefault();
    }
  }

  function renderEmbeddable(element: NonDeleted<ExcalidrawElement>, _: AppState): JSX.Element | null {
    const link = element.link;

    if (!link) return null;

    const transcludedTiddler = matchTiddlerTransclusion(element.link);

    if (transcludedTiddler) return <TiddlerEmbed title={transcludedTiddler} />;

    return <WebEmbed link={element.link} />;
  }

  return (
    <>
      <div
        ref={containerElementReference}
        style={{ width, height, '--tw-excalidraw-height': height }}
        onDrop={handleDrop}
        onFocus={handleFocus}
        onWheelCapture={handleWheelCapture}
      >
        <ParentWidgetContext.Provider value={parentWidget}>
          <Excalidraw
            excalidrawAPI={setExcalidrawAPI}
            onChange={handleChange}
            generateLinkForSelection={generateLinkForSelection}
            onLinkOpen={handleLinkOpen}
            renderEmbeddable={renderEmbeddable}
            validateEmbeddable={true}
            initialData={initialData}
            UIOptions={{
              canvasActions: {
                toggleTheme: true,
              },
            }}
            autoFocus={yesOrNo(autoFocus)}
            langCode={langCode}
            theme={theme === 'light' ? 'light' : (theme === 'dark' ? 'dark' : undefined)}
            viewModeEnabled={yesOrNo(viewMode)}
            zenModeEnabled={yesOrNo(zenMode)}
            gridModeEnabled={yesOrNo(gridMode)}
          >
            <MainMenu>
              <MainMenuItemEnterLayout onSelect={handleOpenLayout} />
              <MainMenuItemExitLayout onSelect={handleExitLayout} />
              <MainMenuItemEmbedTiddler excalidrawAPI={excalidrawAPI} onSelect={handleEmbedTiddler} />
              <MainMenu.Separator />
              <MainMenu.DefaultItems.LoadScene />
              <MainMenu.DefaultItems.SaveToActiveFile />
              <MainMenu.DefaultItems.Export />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.SearchMenu />
              <MainMenu.DefaultItems.Help />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.Separator />
              <MainMenu.DefaultItems.Socials />
              <MainMenu.Separator />
              <MainMenu.DefaultItems.ToggleTheme />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>

            <Footer>
              <button
                onClick={$tw.wiki.getTiddlerText('$:/layout') === '$:/plugins/itw/tw-excalidraw/ui/layout' ? handleExitLayout : handleOpenLayout}
                className='help-icon'
                style={{
                  marginInlineStart: '0.6em',
                }}
              >
                <Transclude title='$:/core/images/standard-layout' />
              </button>
            </Footer>
          </Excalidraw>
        </ParentWidgetContext.Provider>
      </div>
    </>
  );
}
