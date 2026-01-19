'use client';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import {
  Mail,
  Send,
  TestTube,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  Eye,
  Pencil,
} from 'lucide-react';
import { useBuilder } from '@/components/itinerary-builder/builder-context';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getClientById } from '@/app/(dashboard)/clients/actions';
import { saveProposal } from '@/app/itineraries/actions';
import { toast } from '@repo/ui/toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/query-keys';
import Link from 'next/link';

const DEFAULT_MESSAGE = `Thank you for choosing us to plan your unforgettable journey! We've carefully crafted this personalized travel proposal based on your preferences and dreams.

Inside, you'll find a detailed day-by-day itinerary, handpicked accommodations, exciting activities, and transparent pricing. We've poured our expertise and passion into creating an experience you'll cherish forever.

Please take your time to review the proposal. If you have any questions or would like to make adjustments, simply leave a comment directly on the proposal or reply to this email. We're here to make your trip absolutely perfect.

We can't wait to help you embark on this adventure!`;

export default function SharePage() {
  const params = useParams();
  const proposalId = params.id as string;

  const {
    tourId,
    days,
    startDate,
    travelerGroups,
    tourType,
    pricingRows,
    extras,
    clientId,
    tourTitle,
    startCity,
    endCity,
    pickupPoint,
    transferIncluded,
    inclusions,
    exclusions,
    selectedTheme,
    heroImage,
  } = useBuilder();

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState(DEFAULT_MESSAGE);
  const [testEmail, setTestEmail] = useState('');
  const [isProposalSaved, setIsProposalSaved] = useState(false);
  const [proposalLink, setProposalLink] = useState('');

  // Fetch client info
  const { data: clientData } = useQuery({
    queryKey: queryKeys.clients.detail(clientId || ''),
    queryFn: () => (clientId ? getClientById(clientId) : null),
    enabled: !!clientId,
    staleTime: staleTimes.clients,
  });

  // Set default values when client data loads
  useEffect(() => {
    if (clientData?.email) {
      setRecipientEmail(clientData.email);
    }
  }, [clientData]);

  useEffect(() => {
    if (tourTitle) {
      setEmailSubject(`Your Travel Proposal: ${tourTitle}`);
    }
  }, [tourTitle]);

  useEffect(() => {
    if (proposalId) {
      setProposalLink(`${window.location.origin}/proposal/${proposalId}`);
    }
  }, [proposalId]);

  const clientName = clientData?.name || 'Valued Traveler';

  // Auto-publish proposal mutation
  const autoPublishMutation = useMutation({
    mutationFn: async () => {
      if (!tourId) {
        throw new Error('Tour ID is required to save proposal.');
      }

      const proposalData = {
        days,
        startDate,
        travelerGroups,
        tourType,
        pricingRows,
        extras,
        clientId,
        tourTitle,
        startCity,
        endCity,
        pickupPoint,
        transferIncluded,
        inclusions,
        exclusions,
        selectedTheme,
        heroImage,
      };

      const result = await saveProposal({
        id: proposalId,
        name: tourTitle || 'Untitled Safari',
        data: proposalData,
        status: 'shared',
        tourId: tourId,
      });

      if (!result.success) {
        throw new Error('Failed to publish proposal.');
      }

      return result;
    },
    onSuccess: () => {
      setIsProposalSaved(true);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to publish proposal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Auto-publish on mount
  useEffect(() => {
    if (tourId && !isProposalSaved && !autoPublishMutation.isPending) {
      autoPublishMutation.mutate();
    }
  }, [tourId]);

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ isTest }: { isTest: boolean }) => {
      const targetEmail = isTest ? testEmail : recipientEmail;

      if (!targetEmail) {
        throw new Error('Please enter an email address.');
      }

      const response = await fetch('/api/proposal/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          recipientEmail: targetEmail,
          recipientName: clientName, // Always use actual client name so test shows real preview
          subject: emailSubject,
          message: emailMessage,
          isTest,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email.');
      }

      return { isTest };
    },
    onSuccess: ({ isTest }) => {
      toast({
        title: isTest ? 'Test Email Sent!' : 'Email Sent Successfully!',
        description: isTest
          ? `Test email sent to ${testEmail}`
          : `Proposal sent to ${clientName} at ${recipientEmail}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send email',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const copyLink = async () => {
    await navigator.clipboard.writeText(proposalLink);
    toast({
      title: 'Link Copied!',
      description: 'Proposal link copied to clipboard.',
    });
  };

  const duration = days.length > 0 ? `${days.length} days` : '';
  const formattedStartDate = startDate
    ? new Date(startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 pb-32">
      {/* Header */}
      <div className="border-b border-stone-200 pb-6">
        <h2 className="font-serif text-3xl font-bold text-stone-900">Share Proposal</h2>
        <p className="mt-1 text-stone-500">
          Send your proposal to the client via email or share the link directly.
        </p>
      </div>

      {/* Published Status Banner */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {autoPublishMutation.isPending ? (
              <>
                <div className="rounded-full bg-green-100 p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-green-700" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Publishing proposal...</p>
                  <p className="text-sm text-green-600">Generating your shareable link</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle className="h-4 w-4 text-green-700" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Proposal Published</p>
                  <p className="text-sm text-green-600">Your proposal is live and ready to share</p>
                </div>
              </>
            )}
          </div>
          {isProposalSaved && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy Link
              </Button>
              <a href={proposalLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'edit'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Pencil className="h-4 w-4" />
          Edit Email
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'edit' ? (
        <div className="space-y-6">
          {/* Email Form */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-stone-900">
              <Mail className="h-5 w-5 text-green-600" />
              Email Settings
            </h3>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Recipient Email
                </label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@email.com"
                  className="border-stone-200"
                />
                {clientData?.email && recipientEmail !== clientData.email && (
                  <button
                    onClick={() => setRecipientEmail(clientData.email || '')}
                    className="mt-1.5 text-xs text-green-600 hover:underline"
                  >
                    Use client email: {clientData.email}
                  </button>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Email Subject
                </label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Your Travel Proposal"
                  className="border-stone-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Personal Message
                </label>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Add a personal message to the client..."
                  rows={10}
                  className="border-stone-200"
                />
                <button
                  onClick={() => setEmailMessage(DEFAULT_MESSAGE)}
                  className="mt-1.5 text-xs text-stone-500 hover:text-stone-700 hover:underline"
                >
                  Reset to default message
                </button>
              </div>
            </div>
          </div>

          {/* Test Email */}
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700">
              <TestTube className="h-4 w-4" />
              Send Test Email
            </h3>
            <p className="mb-4 text-xs text-stone-500">
              Preview how the email will look by sending a test to yourself.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 border-stone-200 bg-white"
              />
              <Button
                variant="outline"
                onClick={() => sendEmailMutation.mutate({ isTest: true })}
                disabled={!testEmail || sendEmailMutation.isPending || !isProposalSaved}
                className="gap-2"
              >
                {sendEmailMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Test
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Preview Tab */
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          {/* Email Header */}
          <div className="border-b border-stone-100 bg-stone-50 px-6 py-4">
            <div className="text-xs text-stone-500">
              <span className="font-medium">To:</span> {recipientEmail || 'client@email.com'}
            </div>
            <div className="mt-1 text-xs text-stone-500">
              <span className="font-medium">Subject:</span> {emailSubject || 'Your Travel Proposal'}
            </div>
          </div>

          {/* Email Body Preview */}
          <div className="p-6">
            <div className="mb-6 border-b border-stone-100 pb-4 text-center">
              <h1 className="font-serif text-2xl font-bold text-green-700">
                Your Safari Adventure Awaits
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                Your personalized travel proposal is ready to explore
              </p>
            </div>

            <p className="mb-4 text-sm text-stone-700">Dear {clientName},</p>

            <div className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
              {emailMessage || 'Your personal message will appear here...'}
            </div>

            {/* Proposal Card Preview */}
            <div className="mb-6 rounded-lg border-l-4 border-green-600 bg-stone-50 p-4">
              <h2 className="font-serif text-lg font-semibold text-stone-900">
                {tourTitle || 'Your Safari Experience'}
              </h2>
              {formattedStartDate && (
                <p className="mt-1 text-sm text-stone-500">
                  <span className="font-medium">Start Date:</span> {formattedStartDate}
                </p>
              )}
              {duration && (
                <p className="text-sm text-stone-500">
                  <span className="font-medium">Duration:</span> {duration}
                </p>
              )}
            </div>

            {/* CTA Button Preview */}
            <div className="text-center">
              <div className="inline-block rounded-lg bg-green-600 px-8 py-3 text-sm font-semibold text-white">
                View Your Proposal
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-700">
                <strong>Have questions?</strong> Simply reply to this email or leave a comment
                directly on your proposal. We're here to make your trip absolutely perfect!
              </p>
            </div>

            <div className="mt-6 border-t border-stone-100 pt-4">
              <p className="text-sm text-stone-500">
                Warm regards,
                <br />
                <span className="font-medium text-stone-700">Your Travel Team</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-50 border-t bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="text-sm text-stone-500">
            {isProposalSaved ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Ready to send
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <Link href={`/itineraries/${proposalId}/preview`}>
              <Button variant="outline">Back to Preview</Button>
            </Link>

            <Button
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => sendEmailMutation.mutate({ isTest: false })}
              disabled={!recipientEmail || sendEmailMutation.isPending || !isProposalSaved}
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sendEmailMutation.isPending ? 'Sending...' : 'Send to Client'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
