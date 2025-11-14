import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import React from 'react'
import { MDXRemote } from 'next-mdx-remote-client/rsc'
import C2A from '@/components/home/call-to-action'
import { slugify } from '@/lib/utils'
import { type TOCEntry } from '@/components/table-of-contents'

interface MarkdownRendererProps {
    content: string
    className?: string
}

export const markdownComponents = {
    img({ src, alt, ...props }) {
        return (
            <div className="my-5">
                <img
                    src={src || '/placeholder.svg'}
                    alt={alt}
                    className="h-full w-full rounded-lg object-cover shadow-lg"
                    loading="lazy"
                    {...props}
                />
                <p className="text-center text-sm italic">{alt}</p>
            </div>
        )
    },
    h3({ children, ...props }) {
        return (
            <h3
                id={typeof children === 'string' ? slugify(children) : ''}
                className="my-5 scroll-mt-20 text-2xl font-semibold"
                {...props}
            >
                {children}
            </h3>
        )
    },
    table({ children, ...props }) {
        return (
            <table
                className="w-full border-collapse border border-gray-300 text-sm transition-colors [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_tr:hover]:bg-gray-100 [&_tr:nth-child(even)]:bg-gray-50"
                {...props}
            >
                {children}
            </table>
        )
    },
    h2({ children, ...props }) {
        return (
            <h2
                id={typeof children === 'string' ? slugify(children) : ''}
                className="my-5 scroll-mt-20 text-3xl font-bold"
                {...props}
            >
                {children}
            </h2>
        )
    },
    ul({ children, ...props }) {
        return (
            <ul className="flex list-disc flex-col gap-4 pl-6" {...props}>
                {children}
            </ul>
        )
    },
    ol({ children, ...props }) {
        return (
            <ol className="mb-4 list-decimal pl-6" {...props}>
                {children}
            </ol>
        )
    },
    a({ children, ...props }) {
        return (
            <a className="text-primary underline" {...props}>
                {children}
            </a>
        )
    },
    blockquote({ children, ...props }) {
        return (
            <blockquote
                className="rounded-r-lg border-l-4 border-amber-500 bg-amber-50 py-4 pl-6 text-gray-700 italic"
                {...props}
            >
                {children}
            </blockquote>
        )
    },
    C2A() {
        return (
            <div className="my-5">
                <C2A />
            </div>
        )
    },
}

// Custom component for image with side content
interface ImageContentProps {
    src: string
    alt?: string
    position?: 'left' | 'right'
    imageWidth?: string
    content: string
}

function ImageContent({
    src,
    alt = '',
    position = 'left',
    imageWidth = 'w-1/2',
    content,
}: ImageContentProps) {
    return (
        <div
            className={`my-6 flex flex-col gap-6 pt-6 lg:flex-row ${position === 'right' ? 'flex-col-reverse lg:flex-row-reverse' : 'flex-col lg:flex-row'} items-start`}
        >
            <div className={`w-full flex-shrink-0 lg:w-1/2`}>
                <img
                    src={src}
                    alt={alt}
                    className="h-auto w-full rounded-md object-cover lg:h-[400px]"
                    loading="lazy"
                />
            </div>
            <div className="prose prose-sm max-w-none flex-1">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    )
}

// Simple function to parse and render content with custom components
function parseAndRender(content: string) {
    const customComponentRegex = /:::(\w+)\s*({[^}]*})?\n([\s\S]*?):::/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = customComponentRegex.exec(content)) !== null) {
        const [fullMatch, componentName, propsString, innerContent] = match
        const matchStart = match.index

        // Add regular content before custom component
        if (matchStart > lastIndex) {
            const regularContent = content.slice(lastIndex, matchStart)
            if (regularContent.trim()) {
                parts.push({
                    type: 'markdown',
                    content: regularContent,
                    key: `md-${lastIndex}`,
                })
            }
        }

        // Add custom component
        if (componentName === 'ImageContent') {
            try {
                const props = propsString ? JSON.parse(propsString) : {}
                parts.push({
                    type: 'component',
                    component: 'ImageContent',
                    props: {
                        src: props.src,
                        alt: props.alt,
                        position: props.position,
                        imageWidth: props.imageWidth,
                        content: innerContent.trim(),
                    },
                    key: `component-${matchStart}`,
                })
            } catch (error) {
                console.warn('Failed to parse ImageContent props:', error)
                parts.push({
                    type: 'markdown',
                    content: fullMatch,
                    key: `fallback-${matchStart}`,
                })
            }
        }

        lastIndex = matchStart + fullMatch.length
    }

    // Add remaining content
    if (lastIndex < content.length) {
        const remainingContent = content.slice(lastIndex)
        if (remainingContent.trim()) {
            parts.push({
                type: 'markdown',
                content: remainingContent,
                key: `md-${lastIndex}`,
            })
        }
    }

    // If no custom components found, return whole content as markdown
    if (parts.length === 0) {
        parts.push({
            type: 'markdown',
            content: content,
            key: 'full-content',
        })
    }

    return parts
}

export function MarkdownRenderer({
    content,
    className = '',
}: MarkdownRendererProps) {
    const parsedParts = parseAndRender(content)

    return (
        <div
            className={`prose prose-sm max-w-none whitespace-pre-wrap ${className}`}
        >
            {parsedParts.map((part) => {
                if (part.type === 'markdown') {
                    return (
                        <ReactMarkdown
                            key={part.key}
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {part.content}
                        </ReactMarkdown>
                    )
                }

                if (
                    part.type === 'component' &&
                    part.component === 'ImageContent'
                ) {
                    return (
                        <ImageContent
                            key={part.key}
                            src={part.props.src}
                            alt={part.props.alt}
                            position={part.props.position}
                            imageWidth={part.props.imageWidth}
                            content={part.props.content}
                        />
                    )
                }

                return null
            })}
        </div>
    )
}

export function RemoteMdx({ content }: { content: string }) {
    return <MDXRemote source={content} components={markdownComponents} />
}

export async function generateTableOfContentsFromMarkdown(markdown: string) {
    const headings = [
        // Match Markdown and HTML headings (e.g., ## Heading, <h2>Heading</h2>)
        ...markdown.matchAll(
            /^(#+)\s+(.+)$|^<h([1-6])(?:\s+[^>]*\bid=["'](.*?)["'][^>]*)?>(.*?)<\/h\3>/gm,
        ),
    ].map((match) => {
        let level
        let text
        let slug

        if (match[1]) {
            // Markdown headings
            level = match[1].length
            text = match[2].trim().replaceAll('\\', '')
        } else {
            // HTML headings
            level = Number.parseInt(match[3], 10) // Extract level from <hN>
            text = match[5].trim().replaceAll('\\', '')
            if (match[4]) {
                slug = `#${match[4]}`
            }
        }

        // Generate slug
        slug ??= `#${slugify(text)}`

        return { level, text, slug, children: [] }
    })

    const toc: TOCEntry[] = []
    const stack: TOCEntry[] = [{ level: 0, text: '', slug: '', children: toc }]

    const containsQuickReference = markdown.match(/<ApiTable\s+rows=\{\[/)
    if (containsQuickReference) {
        toc.push({
            level: 0,
            text: 'Quick reference',
            slug: '#quick-reference',
            children: [],
        })
    }

    for (const heading of headings) {
        while (stack[stack.length - 1].level >= heading.level) stack.pop()
        stack[stack.length - 1].children.push(heading)
        stack.push(heading)
    }

    return toc
}
