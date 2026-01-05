import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#333',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#15803d',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  clientSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  clientLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 30,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803d',
    marginTop: 25,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 5,
  },
  dayCard: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fafafa',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#15803d',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#15803d',
  },
  dayDate: {
    fontSize: 10,
    color: '#666',
  },
  dayTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dayDescription: {
    fontSize: 10,
    color: '#555',
    lineHeight: 1.5,
    marginBottom: 10,
  },
  activityList: {
    marginTop: 10,
  },
  activity: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  activityTime: {
    width: 70,
    fontSize: 9,
    color: '#666',
  },
  activityName: {
    flex: 1,
    fontSize: 10,
  },
  accommodation: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  accommodationLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  accommodationName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  meals: {
    marginTop: 8,
    fontSize: 9,
    color: '#666',
  },
  pricingSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#15803d',
    borderRadius: 4,
    color: '#fff',
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 10,
    color: '#d1fae5',
  },
  pricingValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#22c55e',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  inclusionsSection: {
    marginTop: 25,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  bullet: {
    width: 15,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 10,
  },
  exclusionsSection: {
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

interface ProposalPDFProps {
  proposal: {
    tourTitle: string;
    clientName: string;
    agencyName: string;
    startDate?: Date;
    duration: number;
    days: Array<{
      dayNumber: number;
      date?: string;
      title?: string;
      description?: string;
      destination?: string;
      activities: Array<{
        name: string;
        moment: string;
      }>;
      accommodation?: string;
      meals?: {
        breakfast: boolean;
        lunch: boolean;
        dinner: boolean;
      };
    }>;
    pricingRows: Array<{
      type: string;
      count: number;
      unitPrice: number;
    }>;
    inclusions: string[];
    exclusions: string[];
  };
}

export function ProposalPDF({ proposal }: ProposalPDFProps) {
  const totalPrice = proposal.pricingRows.reduce(
    (sum, row) => sum + row.count * row.unitPrice,
    0
  );

  const formatMeals = (meals?: { breakfast: boolean; lunch: boolean; dinner: boolean }) => {
    if (!meals) return '';
    const included = [];
    if (meals.breakfast) included.push('Breakfast');
    if (meals.lunch) included.push('Lunch');
    if (meals.dinner) included.push('Dinner');
    return included.length > 0 ? `Meals: ${included.join(', ')}` : '';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{proposal.agencyName}</Text>
          <Text style={styles.subtitle}>Travel Proposal</Text>
        </View>

        {/* Client Info */}
        <View style={styles.clientSection}>
          <Text style={styles.clientLabel}>Prepared for</Text>
          <Text style={styles.clientName}>{proposal.clientName}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tour</Text>
              <Text style={styles.infoValue}>{proposal.tourTitle}</Text>
            </View>
            {proposal.startDate && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Start Date</Text>
                <Text style={styles.infoValue}>
                  {format(proposal.startDate, 'MMMM d, yyyy')}
                </Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{proposal.duration} Days</Text>
            </View>
          </View>
        </View>

        {/* Itinerary */}
        <Text style={styles.sectionTitle}>Your Itinerary</Text>
        {proposal.days.map((day) => (
          <View key={day.dayNumber} style={styles.dayCard} wrap={false}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayNumber}>Day {day.dayNumber}</Text>
              {day.date && <Text style={styles.dayDate}>{day.date}</Text>}
            </View>
            {day.title && <Text style={styles.dayTitle}>{day.title}</Text>}
            {day.destination && (
              <Text style={styles.dayDescription}>{day.destination}</Text>
            )}
            {day.description && (
              <Text style={styles.dayDescription}>{day.description}</Text>
            )}

            {day.activities.length > 0 && (
              <View style={styles.activityList}>
                {day.activities.map((activity, idx) => (
                  <View key={idx} style={styles.activity}>
                    <Text style={styles.activityTime}>{activity.moment}</Text>
                    <Text style={styles.activityName}>{activity.name}</Text>
                  </View>
                ))}
              </View>
            )}

            {day.accommodation && (
              <View style={styles.accommodation}>
                <Text style={styles.accommodationLabel}>Accommodation</Text>
                <Text style={styles.accommodationName}>{day.accommodation}</Text>
              </View>
            )}

            {day.meals && (
              <Text style={styles.meals}>{formatMeals(day.meals)}</Text>
            )}
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {format(new Date(), 'MMMM d, yyyy')} by {proposal.agencyName}
        </Text>
      </Page>

      {/* Pricing Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Pricing Details</Text>

        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>Trip Cost</Text>
          {proposal.pricingRows.map((row, idx) => (
            <View key={idx} style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>
                {row.count}x {row.type}
              </Text>
              <Text style={styles.pricingValue}>
                ${(row.count * row.unitPrice).toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalPrice.toLocaleString()}</Text>
          </View>
        </View>

        {/* Inclusions */}
        {proposal.inclusions.length > 0 && (
          <View style={styles.inclusionsSection}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            {proposal.inclusions.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Exclusions */}
        {proposal.exclusions.length > 0 && (
          <View style={styles.exclusionsSection}>
            <Text style={styles.sectionTitle}>Not Included</Text>
            {proposal.exclusions.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>✗</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {format(new Date(), 'MMMM d, yyyy')} by {proposal.agencyName}
        </Text>
      </Page>
    </Document>
  );
}
