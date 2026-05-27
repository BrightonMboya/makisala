import { docs } from '../../.source';
import { loader } from 'fumadocs-core/source';

const mdxSource = docs.toFumadocsSource();
const rawFiles = mdxSource.files as unknown;
const resolvedFiles =
  typeof rawFiles === 'function' ? (rawFiles as () => unknown[])() : rawFiles;

export const source = loader({
  baseUrl: '/docs',
  source: {
    ...mdxSource,
    files: resolvedFiles,
  } as typeof mdxSource,
});
