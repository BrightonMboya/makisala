# @repo/resend

Email notification package for the Makisala monorepo using Resend.

## Overview

This package provides email notification functionality, specifically for sending notifications when clients add comments on proposals in the Kitasuro app.

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email address to receive notifications
NOTIFICATION_EMAIL=your-team@example.com

# Optional: From email address (defaults to notifications@makisala.com)
RESEND_FROM_EMAIL=notifications@yourdomain.com

# Optional: Base URL for generating proposal links (defaults to http://localhost:3000)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Resend Account Setup

1. Sign up for a Resend account at https://resend.com
2. Create an API key in the Resend dashboard
3. Add your domain (if you want to use a custom from address)
4. Verify your domain following Resend's instructions

## Usage

### Sending Comment Notification Email

```typescript
import { sendCommentNotificationEmail } from '@repo/resend';

await sendCommentNotificationEmail({
  proposalId: 'proposal-123',
  clientName: 'John Doe',
  proposalTitle: 'Safari Adventure Tour',
  commentContent: 'Can we adjust the itinerary?',
  commentAuthor: 'John Doe',
  proposalUrl: 'https://yourdomain.com/proposal/proposal-123', // Optional
  commentDate: 'Monday, January 15, 2024, 2:30 PM EST', // Optional
});
```

## Email Templates

The package includes a responsive HTML email template for comment notifications located in `src/templates/comment-notification.tsx`.

## Integration

This package is automatically integrated into the Kitasuro app's comment creation flow. When a client adds a comment on a proposal, an email notification is sent to the configured notification email address.

## Error Handling

Email sending failures are logged but do not block comment creation. This ensures that comment functionality remains available even if email services are temporarily unavailable.
