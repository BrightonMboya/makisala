import React from 'react';

interface CommentNotificationEmailProps {
  clientName: string;
  proposalTitle: string;
  commentContent: string;
  commentAuthor: string;
  proposalUrl: string;
  commentDate: string;
  locationDescription?: string;
  commentedSection?: string;
  isReply?: boolean;
  parentComment?: {
    content: string;
    author: string;
  };
}

/**
 * Email template for notifying about new comments on proposals.
 * This is a React component that can be rendered to HTML for email.
 */
export function CommentNotificationEmail({
  clientName,
  proposalTitle,
  commentContent,
  commentAuthor,
  proposalUrl,
  commentDate,
  locationDescription,
  commentedSection,
  isReply,
  parentComment,
}: CommentNotificationEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New Comment on Proposal</title>
      </head>
      <body
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          lineHeight: '1.6',
          color: '#333333',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px',
          backgroundColor: '#f5f5f5',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h1
            style={{
              color: '#1a1a1a',
              fontSize: '24px',
              marginTop: '0',
              marginBottom: '20px',
            }}
          >
            {isReply ? 'New Reply on Comment' : 'New Comment on Proposal'}
          </h1>

          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            <strong>{clientName}</strong> has{' '}
            {isReply
              ? 'replied to a comment'
              : `added a comment ${locationDescription || 'on the proposal'}`}
            :
          </p>

          <div
            style={{
              backgroundColor: '#f8f9fa',
              borderLeft: '4px solid #4a90e2',
              padding: '15px',
              marginBottom: '20px',
              borderRadius: '4px',
            }}
          >
            <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#1a1a1a' }}>
              {proposalTitle}
            </p>
            {commentedSection && (
              <p
                style={{
                  margin: '10px 0 0 0',
                  fontSize: '13px',
                  color: '#4a90e2',
                  fontWeight: '500',
                }}
              >
                📍 {commentedSection}
              </p>
            )}
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              padding: '20px',
              marginBottom: '20px',
            }}
          >
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666666' }}>
              <strong>Comment by:</strong> {commentAuthor}
            </p>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666666' }}>
              <strong>Date:</strong> {commentDate}
            </p>
            {isReply && parentComment && (
              <div
                style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  borderLeft: '3px solid #4a90e2',
                  marginBottom: '15px',
                }}
              >
                <p
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '11px',
                    color: '#666666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '600',
                  }}
                >
                  Original Comment by {parentComment.author}:
                </p>
                <p
                  style={{
                    margin: '0',
                    fontSize: '13px',
                    color: '#1a1a1a',
                    fontStyle: 'italic',
                  }}
                >
                  {parentComment.content}
                </p>
              </div>
            )}
            <div
              style={{
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <p
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '12px',
                  color: '#999999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600',
                }}
              >
                {isReply ? 'Reply:' : 'Comment:'}
              </p>
              <p
                style={{
                  margin: '0',
                  whiteSpace: 'pre-wrap',
                  color: '#1a1a1a',
                  fontSize: '15px',
                  lineHeight: '1.6',
                }}
              >
                {commentContent}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <a
              href={proposalUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#4a90e2',
                color: '#ffffff',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '16px',
              }}
            >
              View Proposal
            </a>
          </div>

          <p
            style={{
              marginTop: '30px',
              fontSize: '12px',
              color: '#999999',
              textAlign: 'center',
            }}
          >
            This is an automated notification from your proposal system.
          </p>
        </div>
      </body>
    </html>
  );
}

/**
 * Renders the email template to HTML string.
 * This function converts the React component to HTML for email sending.
 */
export function renderCommentNotificationEmail(props: CommentNotificationEmailProps): string {
  // For now, we'll use a simple HTML template
  // In production, you might want to use a library like @react-email/render
  // or react-dom/server to render the component properly

  const {
    clientName,
    proposalTitle,
    commentContent,
    commentAuthor,
    proposalUrl,
    commentDate,
    locationDescription,
    commentedSection,
    isReply,
    parentComment,
  } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Comment on Proposal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; font-size: 24px; margin-top: 0; margin-bottom: 20px;">${isReply ? 'New Reply on Comment' : 'New Comment on Proposal'}</h1>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${escapeHtml(clientName)}</strong> has ${isReply ? 'replied to a comment' : `added a comment ${locationDescription ? escapeHtml(locationDescription) : 'on the proposal'}`}:
    </p>
    
    <div style="background-color: #f8f9fa; border-left: 4px solid #4a90e2; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #1a1a1a;">${escapeHtml(proposalTitle)}</p>
      ${commentedSection ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #4a90e2; font-weight: 500;">📍 ${escapeHtml(commentedSection || '')}</p>` : ''}
    </div>
    
    <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
        <strong>Comment by:</strong> ${escapeHtml(commentAuthor)}
      </p>
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
        <strong>Date:</strong> ${escapeHtml(commentDate)}
      </p>
      ${
        isReply && parentComment
          ? `<div style="margin-top: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 6px; border-left: 3px solid #4a90e2; margin-bottom: 15px;">
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Original Comment by ${escapeHtml(parentComment.author)}:</p>
        <p style="margin: 0; font-size: 13px; color: #1a1a1a; font-style: italic;">${escapeHtml(parentComment.content)}</p>
      </div>`
          : ''
      }
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #999999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">${isReply ? 'Reply:' : 'Comment:'}</p>
        <p style="margin: 0; white-space: pre-wrap; color: #1a1a1a; font-size: 15px; line-height: 1.6;">${escapeHtml(commentContent)}</p>
      </div>
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="${escapeHtml(proposalUrl)}" style="display: inline-block; background-color: #4a90e2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Proposal</a>
    </div>
    
    <p style="margin-top: 30px; font-size: 12px; color: #999999; text-align: center;">
      This is an automated notification from your proposal system.
    </p>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}
