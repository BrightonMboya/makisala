'use client';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import {
  Send,
  TestTube,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  Eye,
  Pencil,
  Globe,
  Download,
  Paperclip,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { useBuilder } from '@/components/itinerary-builder/builder-context';
import { EmailDeliveryStatus } from '@/components/email-delivery-status';
import {
  EmailBodyEditor,
  type EmailBodyEditorHandle,
} from '@/components/email-composer/email-body-editor';
import { EmailAttachments } from '@/components/email-composer/email-attachments';
import { isSupportedEmailBody, type EditorNode } from '@/lib/email/proposal-email-body';
import type { EmailAttachment } from '@repo/db/schema';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { toast } from '@repo/ui/toast';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import { toLocalISOString } from '@/lib/date-utils';
import { parseJsonResponse } from '@/lib/parse-json-response';
import Link from 'next/link';

/**
 * Only languages the PDF can actually typeset.
 *
 * The attached PDF is rendered by react-pdf, which has no per-glyph font fallback:
 * a character missing from the fonts in src/lib/pdf/proposal/fonts renders as
 * mojibake rather than falling back the way a browser would. Those fonts cover
 * Western European Latin only, so anything needing Cyrillic, CJK, Devanagari, or
 * even Polish/Turkish accents (ż ł ę, ğ ş) silently garbles the client's copy.
 *
 * Adding a language here therefore means registering a font that covers its script
 * first. Arabic and Hebrew additionally need bidi and shaping, which react-pdf gets
 * wrong even with the right font.
 */
const LANGUAGES = [
  { code: 'en', label: 'English (default)' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sw', label: 'Swahili' },
] as const;

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
    startCityCoordinates,
    endCity,
    endCityCoordinates,
    pickupPoint,
    transferIncluded,
    inclusions,
    exclusions,
    selectedTheme,
    heroImage,
    countries,
    useAutoPricing,
    vehicleId,
    markupPct,
    pickupTransferId,
    dropoffTransferId,
  } = useBuilder();

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isProposalSaved, setIsProposalSaved] = useState(false);
  const [proposalLink, setProposalLink] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Share-email composer state (react-email editor body + additional attachments).
  const [emailBodyJson, setEmailBodyJson] = useState<EditorNode | null>(null);
  const [emailAttachments, setEmailAttachments] = useState<EmailAttachment[]>([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  // Imperative handle to the editor: renders current HTML + inserts variables.
  const editorHandleRef = useRef<EmailBodyEditorHandle>(null);

  const saveProposalMutation = trpc.proposals.save.useMutation();
  const saveEmailDraftMutation = trpc.proposals.saveEmailDraft.useMutation();
  const translateMutation = trpc.translations.translate.useMutation();
  const resetLanguageMutation = trpc.translations.resetLanguage.useMutation();

  // Fetch proposal language + saved email draft
  const { data: proposalData } = trpc.proposals.getForBuilder.useQuery(
    { id: proposalId },
    { staleTime: staleTimes.clients },
  );

  // Sync language from proposal data
  useEffect(() => {
    if (proposalData?.language && proposalData.language !== 'en') {
      setSelectedLanguage(proposalData.language);
    }
  }, [proposalData?.language]);

  // Hydrate the composer from the saved draft once, when the proposal loads.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !proposalData) return;
    hydratedRef.current = true;
    if (isSupportedEmailBody(proposalData.emailBodyJson)) {
      setEmailBodyJson(proposalData.emailBodyJson);
    }
    if (Array.isArray(proposalData.emailAttachments)) {
      setEmailAttachments(proposalData.emailAttachments as EmailAttachment[]);
    }
  }, [proposalData]);

  // Fetch client info
  const { data: clientData } = trpc.clients.getById.useQuery(
    { id: clientId || '' },
    { enabled: !!clientId, staleTime: staleTimes.clients },
  );

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

  // Values shown in place of the variable pills in the editor (so operators read
  // the finished email, not template tokens). These mirror what the server
  // substitutes at send time; the server remains the source of truth for the
  // email actually sent. The org name comes from the proposal query.
  const formattedStartDate = startDate
    ? startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const variableValues = useMemo<Record<string, string>>(
    () => ({
      clientName,
      agencyName: proposalData?.organization?.name || 'Your Travel Agency',
      proposalTitle: tourTitle || 'Your Safari Experience',
      proposalUrl: proposalLink,
      startDate: formattedStartDate,
      duration: days.length ? `${days.length} days` : '',
    }),
    [clientName, proposalData?.organization?.name, tourTitle, proposalLink, formattedStartDate, days.length],
  );

  // The editor reads variable values once at mount, so hold it until the values
  // it needs have resolved (client record, when this proposal has a client).
  const valuesReady = proposalData !== undefined && (!clientId || clientData !== undefined);

  // Debounced autosave of the email draft. We save on actual edits (not on the
  // initial hydration) and pass the values explicitly to avoid stale closures.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleDraftSave = useCallback(
    (next: { body: EditorNode | null; attachments: EmailAttachment[] }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (!proposalId) return;
        saveEmailDraftMutation.mutate({
          id: proposalId,
          emailBodyJson: next.body ?? undefined,
          emailAttachments: next.attachments,
        });
      }, 1000);
    },
    [proposalId, saveEmailDraftMutation],
  );

  const handleBodyChange = useCallback(
    (json: EditorNode) => {
      setEmailBodyJson(json);
      scheduleDraftSave({ body: json, attachments: emailAttachments });
    },
    [emailAttachments, scheduleDraftSave],
  );

  const handleAttachmentsChange = useCallback(
    (list: EmailAttachment[]) => {
      setEmailAttachments(list);
      scheduleDraftSave({ body: emailBodyJson, attachments: list });
    },
    [emailBodyJson, scheduleDraftSave],
  );

  // Load the true rendered email (variables resolved) when the Preview tab opens.
  // The composer renders its current HTML client-side; we post that so the
  // server substitutes this proposal's variable values, matching the send.
  useEffect(() => {
    if (activeTab !== 'preview' || !proposalId) return;
    let cancelled = false;
    setPreviewLoading(true);
    (async () => {
      const bodyHtml = (await editorHandleRef.current?.getHtml()) ?? '';
      const res = await fetch(`/api/proposal/${proposalId}/email-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyHtml }),
      });
      const d = (await res.json()) as { html?: string };
      if (!cancelled) setPreviewHtml(d.html ?? '');
    })()
      .catch(() => {
        if (!cancelled) setPreviewHtml('');
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, proposalId, emailBodyJson]);

  // Auto-publish proposal mutation
  const autoPublishMutation = useMutation({
    mutationFn: async () => {
      if (!tourId) {
        throw new Error('Tour ID is required to save proposal.');
      }

      const proposalData = {
        days,
        startDate: startDate ? toLocalISOString(startDate) : null,
        travelerGroups,
        tourType,
        pricingRows,
        extras,
        clientId,
        tourTitle,
        startCity,
        startCityLat: startCityCoordinates ? String(startCityCoordinates[1]) : null,
        startCityLng: startCityCoordinates ? String(startCityCoordinates[0]) : null,
        endCity,
        endCityLat: endCityCoordinates ? String(endCityCoordinates[1]) : null,
        endCityLng: endCityCoordinates ? String(endCityCoordinates[0]) : null,
        pickupPoint,
        transferIncluded,
        inclusions,
        exclusions,
        selectedTheme,
        heroImage,
        countries,
        useAutoPricing,
        vehicleId,
        markupPct,
        pickupTransferRateId: pickupTransferId,
        dropoffTransferRateId: dropoffTransferId,
      };

      return await saveProposalMutation.mutateAsync({
        id: proposalId,
        name: tourTitle || 'Untitled Safari',
        data: proposalData,
        status: 'shared',
        tourId: tourId,
      });
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

  // Warm the PDF cache in the background so Download / Send is near-instant when the
  // operator clicks. The ~15s render runs server-side (and caches to R2) while they
  // review the page. We hold onto the in-flight promise so a click can wait on it
  // rather than kicking off a second render (see awaitPrewarm below).
  const prewarmPromiseRef = useRef<Promise<unknown> | null>(null);
  const firePrewarm = useCallback(() => {
    const p = fetch(`/api/proposal/${proposalId}/pdf/prewarm`, { method: 'POST' }).catch(
      () => {},
    );
    prewarmPromiseRef.current = p;
    return p;
  }, [proposalId]);

  // Cloudflare Browser Rendering rate-limits concurrent renders (429), so a Download/
  // Send that fires while the prewarm is still rendering must NOT start its own render.
  // Instead, wait for the prewarm to finish — it populates R2, so the click then serves
  // the cached copy. If no prewarm is in flight, this resolves immediately.
  const awaitPrewarm = useCallback(async () => {
    if (prewarmPromiseRef.current) {
      await prewarmPromiseRef.current;
    }
  }, []);

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ isTest }: { isTest: boolean }) => {
      const targetEmail = isTest ? testEmail : recipientEmail;

      if (!targetEmail) {
        throw new Error('Please enter an email address.');
      }

      // Persist the latest composer draft (JSON for re-editing) and attachment
      // list; the send route reads attachments from the DB (the source of truth).
      await saveEmailDraftMutation.mutateAsync({
        id: proposalId,
        emailBodyJson: emailBodyJson ?? undefined,
        emailAttachments,
      });

      // The email body itself is the HTML the composer renders right now (with
      // {{variable}} tokens); the server substitutes real values into it.
      const bodyHtml = (await editorHandleRef.current?.getHtml()) ?? '';

      // Wait out any in-flight prewarm so the email's PDF attachment reuses the cached
      // render instead of starting a concurrent one (Cloudflare 429s on concurrency).
      await awaitPrewarm();

      const response = await fetch('/api/proposal/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          recipientEmail: targetEmail,
          recipientName: clientName, // Always use actual client name so test shows real preview
          subject: emailSubject,
          isTest,
          bodyHtml,
        }),
      });

      // The email route renders a PDF via headless Chromium. If that ever pushes
      // the serverless function past its time/memory budget, the platform kills it
      // and returns a non-JSON error page — parseJsonResponse surfaces a readable
      // message instead of a raw "Unexpected token ... is not valid JSON".
      const result = await parseJsonResponse<{ success?: boolean; error?: string }>(response);

      if (!response.ok || !result.success) {
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

  // Prewarm once, as soon as the proposal is published (its updatedAt has settled
  // server-side, so the warmed copy matches what a later click will request).
  const prewarmedRef = useRef(false);
  useEffect(() => {
    if (isProposalSaved && !prewarmedRef.current) {
      prewarmedRef.current = true;
      firePrewarm();
    }
  }, [isProposalSaved, firePrewarm]);

  // Download the proposal PDF so the operator can send it directly (email, WhatsApp, etc).
  // Same render pipeline as the email attachment, streamed back as a file. We fetch it as
  // a blob (rather than navigating) so errors surface as a toast and the button can show
  // a spinner while Cloudflare renders.
  const downloadPdfMutation = useMutation({
    mutationFn: async () => {
      // If a prewarm render is in flight, wait for it (avoids a concurrent CF render →
      // 429). After it resolves the PDF is cached, so this download is an R2 hit.
      await awaitPrewarm();

      // Client stopwatch = the latency the operator actually feels (network + server
      // + R2-hit-or-render). X-PDF-Source tells us which path served it.
      const startedAt = performance.now();
      const response = await fetch(`/api/proposal/${proposalId}/pdf`);
      if (!response.ok) {
        const result = await parseJsonResponse<{ error?: string }>(response).catch(
          () => ({}) as { error?: string },
        );
        throw new Error(result.error || 'Failed to generate PDF.');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || `${tourTitle || 'proposal'}.pdf`;
      const source = response.headers.get('X-PDF-Source'); // 'r2' | 'rendered'
      const feltMs = Math.round(performance.now() - startedAt);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      return { feltMs, source };
    },
    onSuccess: ({ feltMs, source }) => {
      // Lightweight instrumentation so before/after latency is visible without analytics.
      console.info(`[pdf] downloaded in ${feltMs}ms (source: ${source ?? 'unknown'})`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to download PDF',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    if (language === 'en') {
      // Re-warm the cache for the new language once the reset lands (it changes the
      // proposal's content + version, so the previous warm-up no longer applies).
      resetLanguageMutation.mutate({ proposalId }, { onSuccess: firePrewarm });
      return;
    }
    translateMutation.mutate(
      { proposalId, language },
      {
        onSuccess: () => {
          firePrewarm();
          const langLabel = LANGUAGES.find((l) => l.code === language)?.label || language;
          toast({
            title: 'Proposal Translated',
            description: `Your proposal will be displayed in ${langLabel} when the client views it.`,
          });
        },
        onError: (error) => {
          setSelectedLanguage('en');
          toast({
            title: 'Translation Failed',
            description: error.message,
            variant: 'destructive',
          });
        },
      },
    );
  };

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPdfMutation.mutate()}
                disabled={downloadPdfMutation.isPending}
                className="gap-1.5"
              >
                {downloadPdfMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {downloadPdfMutation.isPending ? 'Preparing...' : 'Download PDF'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Client Language */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-900">
          <Globe className="h-5 w-5 text-green-600" />
          Client Language
        </h3>
        <p className="mb-4 text-sm text-stone-500">
          Choose the language your client will see when viewing this proposal. The proposal will be automatically translated.
        </p>
        <div className="flex items-center gap-3">
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-64 border-stone-200">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {translateMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Translating...
            </div>
          )}
          {translateMutation.isSuccess && selectedLanguage !== 'en' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Translated
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
          {/* Email canvas — one clean, borderless surface (Resend-style): the
              recipient/subject fields sit inline above the body, sharing the same
              sheet of "paper" as the message itself rather than living in separate
              bordered cards. */}
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            {/* Field rows: label on the left, borderless input inline, hairline
                divider under each — mirrors the To / Subject header of a real email. */}
            <div className="divide-y divide-stone-100">
              <div className="flex items-center gap-3 px-6 py-3">
                <label className="w-20 shrink-0 text-sm text-stone-400">To</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@email.com"
                  className="flex-1 border-0 bg-transparent p-0 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0"
                />
                {clientData?.email && recipientEmail !== clientData.email && (
                  <button
                    onClick={() => setRecipientEmail(clientData.email || '')}
                    className="shrink-0 text-xs text-green-600 hover:underline"
                  >
                    Use {clientData.email}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 px-6 py-3">
                <label className="w-20 shrink-0 text-sm text-stone-400">Subject</label>
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Your Travel Proposal"
                  className="flex-1 border-0 bg-transparent p-0 text-sm font-medium text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:ring-0"
                />
                {saveEmailDraftMutation.isPending && (
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-stone-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving…
                  </span>
                )}
              </div>
            </div>

            {/* Body — borderless, generous padding, reads as the message canvas.
                The editor takes its content once at mount, so hold it back until the
                saved draft has loaded; otherwise it would seed the default over an
                existing email. Reject legacy (Maily) drafts so they reseed the default
                rather than render broken. */}
            <div className="px-6 py-5">
              {!valuesReady ? (
                <div className="flex h-40 items-center justify-center text-sm text-stone-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading email…
                </div>
              ) : (
                <EmailBodyEditor
                  ref={editorHandleRef}
                  value={
                    emailBodyJson ??
                    (isSupportedEmailBody(proposalData?.emailBodyJson)
                      ? proposalData.emailBodyJson
                      : null)
                  }
                  variableValues={variableValues}
                  onChange={handleBodyChange}
                />
              )}
            </div>
          </div>

          <p className="px-1 text-xs text-stone-400">
            Highlighted fields (client name, proposal title, dates, and link) are filled in
            automatically when you send. Use the Preview tab to see exactly what the client gets.
          </p>

          {/* Attachments */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-900">
              <Paperclip className="h-5 w-5 text-green-600" />
              Attachments
            </h3>
            <EmailAttachments
              proposalId={proposalId}
              value={emailAttachments}
              onChange={handleAttachmentsChange}
            />
          </div>

          {/* Test Email */}
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-700">
              <TestTube className="h-4 w-4" />
              Send Test Email
            </h3>
            <p className="mb-4 text-xs text-stone-500">
              Preview how the email will look by sending a test to yourself. Attachments are
              included.
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
        /* Preview Tab: the real rendered email (variables resolved server-side) */
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          <div className="border-b border-stone-100 bg-stone-50 px-6 py-4">
            <div className="text-xs text-stone-500">
              <span className="font-medium">To:</span> {recipientEmail || 'client@email.com'}
            </div>
            <div className="mt-1 text-xs text-stone-500">
              <span className="font-medium">Subject:</span> {emailSubject || 'Your Travel Proposal'}
            </div>
            {emailAttachments.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Paperclip className="h-3 w-3 text-stone-400" />
                {emailAttachments.map((a) => (
                  <span
                    key={a.key}
                    className="rounded bg-white px-2 py-0.5 text-xs text-stone-600 ring-1 ring-stone-200"
                  >
                    {a.filename}
                  </span>
                ))}
                <span className="text-xs text-stone-400">+ proposal PDF</span>
              </div>
            )}
          </div>

          {previewLoading ? (
            <div className="flex h-[600px] items-center justify-center text-sm text-stone-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Rendering preview…
            </div>
          ) : (
            <iframe
              title="Email preview"
              srcDoc={previewHtml}
              className="h-[600px] w-full border-0 bg-white"
            />
          )}
        </div>
      )}

      {/* Delivery analytics for prior sends of this proposal */}
      <EmailDeliveryStatus proposalId={proposalId} />

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
