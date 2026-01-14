import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ProposalPDF } from '@/lib/pdf/proposal-pdf';
import { db } from '@repo/db';
import { proposals, proposalDays, proposalActivities, proposalAccommodations, proposalMeals, accommodations, nationalParks } from '@repo/db/schema';
import { eq, and } from 'drizzle-orm';
import { addDays, format } from 'date-fns';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate proposal ID format
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid proposal ID' }, { status: 400 });
    }

    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the proposal with all related data, scoped to user's organization
    const proposal = await db.query.proposals.findFirst({
      where: and(eq(proposals.id, id), eq(proposals.organizationId, session.user.organizationId)),
      with: {
        client: true,
        organization: true,
        days: {
          with: {
            activities: true,
            accommodations: {
              with: {
                accommodation: true,
              },
            },
            meals: true,
            nationalPark: true,
          },
          orderBy: (days, { asc }) => [asc(days.dayNumber)],
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const startDate = proposal.startDate ? new Date(proposal.startDate) : undefined;

    // Transform data for PDF
    const pdfData = {
      tourTitle: proposal.tourTitle || proposal.name,
      clientName: proposal.client?.name || 'Valued Client',
      agencyName: proposal.organization?.name || 'Travel Agency',
      startDate,
      duration: proposal.days.length,
      days: proposal.days.map((day, index) => ({
        dayNumber: day.dayNumber,
        date: startDate ? format(addDays(startDate, index), 'MMMM d, yyyy') : undefined,
        title: day.title || undefined,
        description: day.description || undefined,
        destination: day.nationalPark?.name || undefined,
        activities: (day.activities || []).map((act) => ({
          name: act.name,
          moment: act.moment,
        })),
        accommodation: day.accommodations?.[0]?.accommodation?.name || undefined,
        meals: day.meals ? {
          breakfast: day.meals.breakfast,
          lunch: day.meals.lunch,
          dinner: day.meals.dinner,
        } : undefined,
      })),
      pricingRows: (proposal.pricingRows as any[] || []).map((row) => ({
        type: row.type,
        count: row.count,
        unitPrice: row.unitPrice,
      })),
      inclusions: proposal.inclusions || [],
      exclusions: proposal.exclusions || [],
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      ProposalPDF({ proposal: pdfData }) as any
    );

    // Return PDF as response (convert Buffer to Uint8Array for BodyInit compatibility)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${proposal.tourTitle || 'proposal'}-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
