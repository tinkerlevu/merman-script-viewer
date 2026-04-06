import MarkdownPreview from '@uiw/react-markdown-preview';

const source = `
## MarkdownPreview

> todo: React component preview markdown text.
`;

export default function MarkdownViewer(
  { text }: { text: string }
): React.JSX.Element {
  return (<>
    <MarkdownPreview source={text} style={{ padding: 16 }} />
  </>)
}
