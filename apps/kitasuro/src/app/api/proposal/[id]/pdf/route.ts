import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ProposalPDF } from '@/lib/pdf/proposal-pdf';
import { db } from '@repo/db';
import { proposals, proposalDays, proposalActivities, proposalAccommodations, proposalMeals, accommodations, nationalParks } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { addDays, format } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the proposal with all related data
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
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

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
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
