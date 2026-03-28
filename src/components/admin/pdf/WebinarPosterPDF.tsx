import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const colors = {
  primary: "#6B3FA0",
  primaryDark: "#4A2D6F",
  primaryLight: "#8B6BBF",
  secondary: "#E8B931",
  secondaryLight: "#F5D76E",
  bg: "#FFFFFF",
  textDark: "#1a1a2e",
  textMuted: "#666666",
  sectionBg: "#F8F5FC",
  accent: "#3B7DD8",
  cardBorder: "#E8E0F0",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    fontFamily: "Helvetica",
    color: colors.textDark,
    position: "relative",
    padding: 0,
  },
  // Header area
  headerArea: {
    position: "relative",
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 40,
    backgroundColor: colors.primary,
  },
  headerDecorCircle1: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    opacity: 0.2,
  },
  headerDecorCircle2: {
    position: "absolute",
    bottom: -15,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secondary,
    opacity: 0.15,
  },
  headerLabel: {
    fontSize: 10,
    color: colors.secondary,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 4,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.25,
    maxLines: 3,
  },
  // Invitation text
  invitationBar: {
    backgroundColor: colors.sectionBg,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  invitationText: {
    fontSize: 10,
    color: colors.primary,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
  },
  // Accent stripe
  accentStripe: {
    height: 4,
    flexDirection: "row",
  },
  accentStripePart1: {
    flex: 3,
    backgroundColor: colors.secondary,
  },
  accentStripePart2: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },
  // Content
  contentArea: {
    paddingHorizontal: 40,
    paddingTop: 22,
    flex: 1,
  },
  // Date card
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderLeftWidth: 5,
    borderLeftColor: colors.secondary,
  },
  dateIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  dateIconText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  dateMainText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.textDark,
  },
  dateSubText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Section styles
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    letterSpacing: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginBottom: 8,
  },
  themeDescription: {
    fontSize: 10,
    color: colors.textDark,
    lineHeight: 1.6,
    paddingLeft: 16,
  },
  // Program items
  programItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
    paddingLeft: 16,
  },
  programNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 1,
  },
  programNumberText: {
    fontSize: 8,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
  },
  programText: {
    fontSize: 10,
    color: colors.textDark,
    lineHeight: 1.5,
    flex: 1,
  },
  // QR section
  qrSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 10,
    marginBottom: 12,
  },
  qrCard: {
    alignItems: "center",
    width: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  qrImage: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  qrLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 2,
  },
  qrSubLabel: {
    fontSize: 7,
    color: colors.textMuted,
    textAlign: "center",
  },
  qrAccent: {
    width: 30,
    height: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  // Footer
  footer: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 12,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  footerLogo: {
    width: 55,
    height: 18,
    objectFit: "contain" as any,
  },
  poweredBy: {
    fontSize: 7,
    color: "#FFFFFF",
    opacity: 0.6,
    marginTop: 2,
  },
});

interface WebinarPosterPDFProps {
  title: string;
  date: string;
  time: string;
  description: string;
  program: string[];
  registrationQrCode: string;
  bookingQrCode: string;
  companyName: string;
  logoDataUrl?: string;
  invitationText?: string;
}

export const WebinarPosterPDF = ({
  title,
  date,
  time,
  description,
  program,
  registrationQrCode,
  bookingQrCode,
  companyName,
  logoDataUrl,
  invitationText,
}: WebinarPosterPDFProps) => {
  // Extract day number for the date icon
  const dayMatch = date.match(/(\d{1,2})/);
  const dayNumber = dayMatch ? dayMatch[1] : "?";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerArea}>
          <View style={styles.headerDecorCircle1} />
          <View style={styles.headerDecorCircle2} />
          <Text style={styles.headerLabel}>WEBINAR</Text>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Accent stripe */}
        <View style={styles.accentStripe}>
          <View style={styles.accentStripePart1} />
          <View style={styles.accentStripePart2} />
        </View>

        {/* Invitation text */}
        {invitationText && (
          <View style={styles.invitationBar}>
            <Text style={styles.invitationText}>{invitationText}</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.contentArea}>
          {/* Date card */}
          <View style={styles.dateCard}>
            <View style={styles.dateIconBox}>
              <Text style={styles.dateIconText}>{dayNumber}</Text>
            </View>
            <View>
              <Text style={styles.dateMainText}>{date}</Text>
              {time ? <Text style={styles.dateSubText}>{time}</Text> : null}
            </View>
          </View>

          {/* Theme */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>THÈME</Text>
            </View>
            <View style={styles.sectionDivider} />
            <Text style={styles.themeDescription}>{description}</Text>
          </View>

          {/* Programme */}
          {program.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>AU PROGRAMME</Text>
              </View>
              <View style={styles.sectionDivider} />
              {program.map((item, index) => (
                <View key={index} style={styles.programItem}>
                  <View style={styles.programNumber}>
                    <Text style={styles.programNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.programText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* QR Codes */}
          <View style={styles.qrSection}>
            <View style={styles.qrCard}>
              <View style={[styles.qrAccent, { backgroundColor: colors.primary }]} />
              {registrationQrCode && (
                <Image style={styles.qrImage} src={registrationQrCode} />
              )}
              <Text style={styles.qrLabel}>S'inscrire au webinar</Text>
              <Text style={styles.qrSubLabel}>Scannez pour vous inscrire</Text>
            </View>

            <View style={styles.qrCard}>
              <View style={[styles.qrAccent, { backgroundColor: colors.accent }]} />
              {bookingQrCode && (
                <Image style={styles.qrImage} src={bookingQrCode} />
              )}
              <Text style={styles.qrLabel}>Prendre rendez-vous</Text>
              <Text style={styles.qrSubLabel}>Avec un conseiller FinCare</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>{companyName}</Text>
            <Text style={styles.poweredBy}>Propulsé par FinCare</Text>
          </View>
          {logoDataUrl && (
            <Image style={styles.footerLogo} src={logoDataUrl} />
          )}
        </View>
      </Page>
    </Document>
  );
};
