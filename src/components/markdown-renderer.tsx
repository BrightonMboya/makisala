import ReactMarkdown from "react-markdown";

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
          h2({ children, ...props }) {
            return (
              <h2 className="text-3xl font-bold mt-8 mb-6" {...props}>
                {children}
              </h2>
            );
          },
          ul({ children, ...props }) {
            return (
              <ul className="list-disc pl-6 mb-4" {...props}>
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
