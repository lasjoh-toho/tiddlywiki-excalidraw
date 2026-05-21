import { Wikify } from './Wikify.js';

export function Transclude({ title }: {
  title: string;
}) {
  return (
    <Wikify
      text={`
<$tiddler tiddler="${title}">
<$transclude tiddler={{{ [[${title}]] :cascade[all[shadows+tiddlers]tag[$:/tags/ViewTemplateBodyFilter]!is[draft]get[text]] :and[!is[blank]else[$:/core/ui/ViewTemplate/body/default]] }}} />
</$tiddler>`}
    />
  );
}
