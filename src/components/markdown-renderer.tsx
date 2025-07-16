import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-sm max-w-none whitespace-pre-wrap ${className}`}>
      <ReactMarkdown
          remarkPlugins={[remarkGfm]}
        components={{
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
            a({children, ...props}) {
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
        }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
