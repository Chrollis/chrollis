import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import type { PluggableList } from 'unified'

export default function MarkdownBody({
  content,
  allowHtml = false,
  disableRelativeLinks = false,
}: {
  content: string
  allowHtml?: boolean

  disableRelativeLinks?: boolean
}) {
  const highlight: PluggableList = [[rehypeHighlight, { detect: true, ignoreMissing: true }]]
  const rehypePlugins: PluggableList = allowHtml
    ? [rehypeRaw, rehypeSanitize, ...highlight]
    : highlight

  return (
    <div className="ak-prose">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={{
          a({ href, children, ...props }) {
            const target = href ?? ''

            const isAbsolute =
              target === '' ||
              target.startsWith('#') ||
              target.startsWith('//') ||
              /^[a-z][a-z0-9+.-]*:/i.test(target)

            if (disableRelativeLinks && !isAbsolute) {
              return <span className="ak-inert-link">{children}</span>
            }

            const isExternal = /^https?:\/\//i.test(target)
            return (
              <a
                href={href}
                {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                {...props}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
