import type { MDXComponents } from 'mdx/types'
import { markdownComponents } from '@/components/markdown-renderer'

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        ...components,
        ...markdownComponents,
    }
}
