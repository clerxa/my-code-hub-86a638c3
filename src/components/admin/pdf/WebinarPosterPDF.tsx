import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const colors = {
  primary: "#6B3FA0",       // Purple from the reference
  primaryLight: "#8B6BBF",
  secondary: "#E8B931",     // Gold/yellow accent
  secondaryLight: "#F5D76E",
  bg: "#FFFFFF",
  textDark: "#1a1a2e",
  textMuted: "#555555",
  sectionBg: "#F8F5FC",
  accent: "#3B7DD8",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    fontFamily: "Helvetica",
    color: colors.textDark,
    position: "relative",
    padding: 0,
  },
  // Top banner
  topBanner: {
    backgroundColor: colors.primary,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 40,
    position: "relative",
  },
  topBannerLabel: {
    fontSize: 11,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    textTransform: "uppercase" as any,
    opacity: 0.85,
    marginBottom: 8,
  },
  topBannerTitle: {
    fontSize: 28,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.2,
  },
  // Accent stripe
  accentStripe: {
    height: 5,
    backgroundColor: colors.secondary,
  },
  // Content area
  contentArea: {
    paddingHorizontal: 40,
    paddingTop: 24,
    flex: 1,
  },
  // Date/time section
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: colors.sectionBg,
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  dateIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  dateText: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  dateSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Theme section
  themeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textTransform: "uppercase" as any,
    letterSpacing: 1.5,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.secondary,
    paddingBottom: 4,
  },
  themeDescription: {
    fontSize: 11,
    color: colors.textDark,
    lineHeight: 1.6,
  },
  // Program section
  programSection: {
    marginBottom: 24,
  },
  programItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingLeft: 4,
  },
  programBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginRight: 10,
    marginTop: 3,
  },
  programText: {
    fontSize: 11,
    color: colors.textDark,
    lineHeight: 1.5,
    flex: 1,
  },
  // QR codes section
  qrSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    marginBottom: 16,
    gap: 20,
  },
  qrBlock: {
    alignItems: "center",
    flex: 1,
    backgroundColor: colors.sectionBg,
    borderRadius: 10,
    padding: 16,
  },
  qrImage: {
    width: 110,
    height: 110,
    marginBottom: 8,
  },
  qrLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 3,
  },
  qrSubLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textAlign: "center",
  },
  // Footer
  footer: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  footerLogo: {
    width: 60,
    height: 20,
    objectFit: "contain" as any,
  },
  // Powered by
  poweredBy: {
    fontSize: 8,
    color: "#FFFFFF",
    opacity: 0.7,
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
}: WebinarPosterPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <Text style={styles.topBannerLabel}>WEBINAR</Text>
        <Text style={styles.topBannerTitle}>{title}</Text>
      </View>

      {/* Accent stripe */}
      <View style={styles.accentStripe} />

      {/* Content */}
      <View style={styles.contentArea}>
        {/* Date & Time */}
        <View style={styles.dateSection}>
          <View>
            <Text style={styles.dateText}>{date}</Text>
            <Text style={styles.dateSubText}>{time}</Text>
          </View>
        </View>

        {/* Theme */}
        <View style={styles.themeSection}>
          <Text style={styles.sectionTitle}>Thème</Text>
          <Text style={styles.themeDescription}>{description}</Text>
        </View>

        {/* Programme */}
        {program.length > 0 && (
          <View style={styles.programSection}>
            <Text style={styles.sectionTitle}>Au programme</Text>
            {program.map((item, index) => (
              <View key={index} style={styles.programItem}>
                <View style={styles.programBullet} />
                <Text style={styles.programText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* QR Codes */}
        <View style={styles.qrSection}>
          <View style={styles.qrBlock}>
            {registrationQrCode && (
              <Image style={styles.qrImage} src={registrationQrCode} />
            )}
            <Text style={styles.qrLabel}>S'inscrire au webinar</Text>
            <Text style={styles.qrSubLabel}>Scannez pour vous inscrire</Text>
          </View>

          <View style={styles.qrBlock}>
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
