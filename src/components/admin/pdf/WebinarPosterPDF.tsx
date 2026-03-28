import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { htmlToPdfElements } from "./htmlToPdfElements";

const c = {
  purple: "#6B3FA0",
  purpleDark: "#4A2D6F",
  purpleLight: "#8B6BBF",
  purpleFaint: "#F3EEF9",
  gold: "#E8B931",
  goldLight: "#FDF6E0",
  blue: "#3B7DD8",
  white: "#FFFFFF",
  dark: "#1a1a2e",
  muted: "#666666",
  border: "#E8E0F0",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: c.white,
    fontFamily: "Helvetica",
    color: c.dark,
    padding: 0,
  },
  // ── HEADER ──
  header: {
    backgroundColor: c.purple,
    paddingTop: 30,
    paddingBottom: 22,
    paddingHorizontal: 36,
    position: "relative",
    overflow: "hidden",
  },
  headerDecoTop: {
    position: "absolute",
    top: -40,
    right: -25,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: c.purpleLight,
    opacity: 0.15,
  },
  headerDecoBottom: {
    position: "absolute",
    bottom: -20,
    right: 80,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: c.gold,
    opacity: 0.12,
  },
  headerDecoSmall: {
    position: "absolute",
    top: 15,
    right: 50,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: c.white,
    opacity: 0.06,
  },
  tag: {
    fontSize: 8,
    color: c.gold,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 5,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    color: c.white,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.3,
  },
  // ── STRIPE ──
  stripe: { height: 4, flexDirection: "row" },
  stripeGold: { flex: 4, backgroundColor: c.gold },
  stripePurple: { flex: 1, backgroundColor: c.purpleLight },
  // ── INVITATION ──
  invitationBar: {
    backgroundColor: c.purpleFaint,
    paddingVertical: 8,
    paddingHorizontal: 36,
  },
  invitationText: {
    fontSize: 9,
    color: c.purple,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
  },
  // ── CONTENT ──
  content: {
    paddingHorizontal: 36,
    paddingTop: 18,
    flex: 1,
  },
  // Date card
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    borderLeftWidth: 5,
    borderLeftColor: c.gold,
    padding: 12,
    backgroundColor: c.white,
  },
  dateBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: c.gold,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dateBoxNum: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: c.purpleDark,
  },
  dateMain: { fontSize: 13, fontFamily: "Helvetica-Bold", color: c.dark },
  dateSub: { fontSize: 9, color: c.muted, marginTop: 2 },
  // Sections
  section: { marginBottom: 14 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: c.gold,
    marginRight: 7,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: c.purple,
    letterSpacing: 1.5,
  },
  sectionLine: { height: 1, backgroundColor: c.border, marginBottom: 6 },
  desc: { fontSize: 9.5, color: c.dark, lineHeight: 1.6, paddingLeft: 14 },
  // Program
  progItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    paddingLeft: 14,
  },
  progNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: c.purple,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 1,
  },
  progNumTxt: { fontSize: 7, color: c.white, fontFamily: "Helvetica-Bold" },
  progTxt: { fontSize: 9.5, color: c.dark, lineHeight: 1.5, flex: 1 },
  // ── QR SECTION ──
  qrRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  qrCard: {
    alignItems: "center",
    width: 170,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.white,
  },
  qrAccent: { width: 28, height: 3, borderRadius: 2, marginBottom: 6 },
  qrImg: { width: 90, height: 90, marginBottom: 6 },
  qrLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: c.purple,
    textAlign: "center",
    marginBottom: 1,
  },
  qrSub: { fontSize: 7, color: c.muted, textAlign: "center" },
  // ── ABOUT BLOCK ──
  aboutBlock: {
    marginHorizontal: 36,
    marginBottom: 14,
    borderRadius: 10,
    padding: 14,
    backgroundColor: c.purpleFaint,
    borderLeftWidth: 4,
    borderLeftColor: c.purple,
  },
  aboutTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: c.purple,
    letterSpacing: 1,
    marginBottom: 5,
  },
  aboutText: {
    fontSize: 8,
    color: c.dark,
    lineHeight: 1.6,
  },
  aboutHighlight: {
    fontSize: 8,
    color: c.purple,
    fontFamily: "Helvetica-Bold",
  },
  // ── FOOTER ──
  footer: {
    backgroundColor: c.purpleDark,
    paddingVertical: 10,
    paddingHorizontal: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerName: { fontSize: 8, color: c.white, opacity: 0.9 },
  footerSub: { fontSize: 7, color: c.white, opacity: 0.55, marginTop: 1 },
  footerLogo: { width: 50, height: 16, objectFit: "contain" as any },
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
  const dayMatch = date.match(/(\d{1,2})/);
  const dayNum = dayMatch ? dayMatch[1] : "?";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerDecoTop} />
          <View style={styles.headerDecoBottom} />
          <View style={styles.headerDecoSmall} />
          <Text style={styles.tag}>WEBINAR</Text>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Stripe */}
        <View style={styles.stripe}>
          <View style={styles.stripeGold} />
          <View style={styles.stripePurple} />
        </View>

        {/* Invitation */}
        {invitationText && (
          <View style={styles.invitationBar}>
            <Text style={styles.invitationText}>{invitationText}</Text>
          </View>
        )}

        {/* ── Content ── */}
        <View style={styles.content}>
          {/* Date */}
          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateBoxNum}>{dayNum}</Text>
            </View>
            <View>
              <Text style={styles.dateMain}>{date}</Text>
              {time ? <Text style={styles.dateSub}>{time}</Text> : null}
            </View>
          </View>

          {/* Thème */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            </View>
            <View style={styles.sectionLine} />
            <Text style={styles.desc}>{description}</Text>
          </View>

          {/* Programme */}
          {program.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionLabel}>AU PROGRAMME</Text>
              </View>
              <View style={styles.sectionLine} />
              {program.map((item, i) => (
                <View key={i} style={styles.progItem}>
                  <View style={styles.progNum}>
                    <Text style={styles.progNumTxt}>{i + 1}</Text>
                  </View>
                  <Text style={styles.progTxt}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* QR codes */}
          <View style={styles.qrRow}>
            <View style={styles.qrCard}>
              <View style={[styles.qrAccent, { backgroundColor: c.purple }]} />
              {registrationQrCode && (
                <Image style={styles.qrImg} src={registrationQrCode} />
              )}
              <Text style={styles.qrLabel}>S'inscrire au webinar</Text>
              <Text style={styles.qrSub}>Scannez pour vous inscrire</Text>
            </View>
            <View style={styles.qrCard}>
              <View style={[styles.qrAccent, { backgroundColor: c.blue }]} />
              {bookingQrCode && (
                <Image style={styles.qrImg} src={bookingQrCode} />
              )}
              <Text style={styles.qrLabel}>Prendre rendez-vous</Text>
              <Text style={styles.qrSub}>Avec un conseiller FinCare</Text>
            </View>
          </View>
        </View>

        {/* ── About MyFinCare ── */}
        <View style={styles.aboutBlock}>
          <Text style={styles.aboutTitle}>À PROPOS DE MYFINCARE</Text>
          <Text style={styles.aboutText}>
            <Text style={styles.aboutHighlight}>MyFinCare</Text>
            {" "}est une plateforme d'éducation financière dédiée aux salariés. Grâce à des webinars, des simulateurs et un accompagnement personnalisé par des experts, MyFinCare aide chaque collaborateur à mieux comprendre et optimiser sa rémunération, son épargne et ses investissements.
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerName}>{companyName}</Text>
            <Text style={styles.footerSub}>Propulsé par FinCare</Text>
          </View>
          {logoDataUrl && (
            <Image style={styles.footerLogo} src={logoDataUrl} />
          )}
        </View>
      </Page>
    </Document>
  );
};
