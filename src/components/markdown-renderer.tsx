import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

const markdownComponents = {
    img({ src, alt, ...props }) {
        return (
            <img
                src={src || "/placeholder.svg"}
                alt={alt}
                className="rounded-lg shadow-lg w-full h-auto"
                loading="lazy"
                {...props}
            />
        );
    },
    h3({ children, ...props }) {
        return (
            <h3 className="text-2xl font-semibold mt-6 mb-4" {...props}>
                {children}
            </h3>
        );
    },
    table({ children, ...props }) {
        return (
            <table
                className="w-full border-collapse border border-gray-300 text-sm
                  [&_th]:bg-gray-100
                  [&_th]:text-left
                  [&_th]:px-4 [&_th]:py-2 [&_th]:border [&_th]:border-gray-300
                  [&_td]:px-4 [&_td]:py-2 [&_td]:border [&_td]:border-gray-300
                  [&_tr:nth-child(even)]:bg-gray-50
                  [&_tr:hover]:bg-gray-100 transition-colors"
                {...props}
            >
                {children}
            </table>
        );
    },
    h2({ children, ...props }) {
        return (
            <h2 className="text-3xl font-bold mt-8 mb-6" {...props}>
                {children}
            </h2>
        );
    },
    ul({ children, ...props }) {
        return (
            <ul className="flex list-disc flex-col gap-4 pl-6" {...props}>
                {children}
            </ul>
        );
    },
    ol({ children, ...props }) {
        return (
            <ol className="list-decimal pl-6 mb-4" {...props}>
                {children}
            </ol>
        );
    },
    a({ children, ...props }) {
        return (
            <a className="text-primary underline" {...props}>{children}</a>
        );
    },
    blockquote({ children, ...props }) {
        return (
            <blockquote
                className="border-l-4 border-amber-500 pl-6 italic text-gray-700 bg-amber-50 py-4 rounded-r-lg"
                {...props}>
                {children}
            </blockquote>
        );
    },
};

// Custom component for image with side content
interface ImageContentProps {
    src: string;
    alt?: string;
    position?: 'left' | 'right';
    imageWidth?: string;
    content: string;
}

function ImageContent({
                          src,
                          alt = "",
                          position = 'left',
                          imageWidth = 'w-1/2',
                          content
                      }: ImageContentProps) {
    return (
        <div className={`flex gap-6 pt-6 my-6 ${position === 'right' ? 'flex-row-reverse' : 'flex-row'} items-start`}>
            <div className={`${imageWidth} flex-shrink-0`}>
                <img
                    src={src}
                    alt={alt}
                    className="rounded-md w-full h-auto lg:h-[400px] object-cover"
                    loading="lazy"
                />
            </div>
            <div className="flex-1 prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
}

// Simple function to parse and render content with custom components
function parseAndRender(content: string) {
    const customComponentRegex = /:::(\w+)\s*({[^}]*})?\n([\s\S]*?):::/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = customComponentRegex.exec(content)) !== null) {
        const [fullMatch, componentName, propsString, innerContent] = match;
        const matchStart = match.index;

        // Add regular content before custom component
        if (matchStart > lastIndex) {
            const regularContent = content.slice(lastIndex, matchStart);
            if (regularContent.trim()) {
                parts.push({
                    type: 'markdown',
                    content: regularContent,
                    key: `md-${lastIndex}`
                });
            }
        }

        // Add custom component
        if (componentName === 'ImageContent') {
            try {
                const props = propsString ? JSON.parse(propsString) : {};
                parts.push({
                    type: 'component',
                    component: 'ImageContent',
                    props: {
                        src: props.src,
                        alt: props.alt,
                        position: props.position,
                        imageWidth: props.imageWidth,
                        content: innerContent.trim()
                    },
                    key: `component-${matchStart}`
                });
            } catch (error) {
                console.warn('Failed to parse ImageContent props:', error);
                parts.push({
                    type: 'markdown',
                    content: fullMatch,
                    key: `fallback-${matchStart}`
                });
            }
        }

        lastIndex = matchStart + fullMatch.length;
    }

    // Add remaining content
    if (lastIndex < content.length) {
        const remainingContent = content.slice(lastIndex);
        if (remainingContent.trim()) {
            parts.push({
                type: 'markdown',
                content: remainingContent,
                key: `md-${lastIndex}`
            });
        }
    }

    // If no custom components found, return whole content as markdown
    if (parts.length === 0) {
        parts.push({
            type: 'markdown',
            content: content,
            key: 'full-content'
        });
    }

    return parts;
}

export function MarkdownRenderer({
                                     content,
                                     className = "",
                                 }: MarkdownRendererProps) {
    const parsedParts = parseAndRender(content);

    return (
        <div className={`prose prose-sm max-w-none whitespace-pre-wrap ${className}`}>
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
                    );
                }

                if (part.type === 'component' && part.component === 'ImageContent') {
                    return (
                        <ImageContent
                            key={part.key}
                            src={part.props.src}
                            alt={part.props.alt}
                            position={part.props.position}
                            imageWidth={part.props.imageWidth}
                            content={part.props.content}
                        />
                    );
                }

                return null;
            })}
        </div>
    );
}