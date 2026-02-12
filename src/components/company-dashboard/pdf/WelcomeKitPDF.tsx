import {
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";

const colors = {
  bg: "#0f1117",
  card: "#1a1d27",
  foreground: "#f8fafc",
  muted: "#94a3b8",
  primary: "#3b82f6",
  primaryLight: "#60a5fa",
  secondary: "#a855f7",
  accent: "#f59e0b",
  border: "#1e293b",
  success: "#22c55e",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    padding: 48,
    fontFamily: "Helvetica",
    color: colors.foreground,
    position: "relative",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },

  // ── Cover ──
  coverWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logosRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: "contain",
  },
  logoX: {
    fontSize: 20,
    color: colors.muted,
    marginHorizontal: 20,
  },
  badge: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 9,
    color: colors.accent,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },
  coverTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: colors.foreground,
    marginBottom: 16,
    lineHeight: 1.35,
    maxWidth: 420,
  },
  divider: {
    width: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginVertical: 24,
  },
  coverSub: {
    fontSize: 12,
    textAlign: "center",
    color: colors.muted,
    maxWidth: 380,
    lineHeight: 1.6,
  },
  pillsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 36,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 9,
    color: colors.muted,
  },

  // ── Why page ──
  whyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  whyTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.foreground,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 1.35,
  },
  statsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 40,
    width: "100%",
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 10,
  },
  statDesc: {
    fontSize: 9,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 1.55,
  },
  statSource: {
    fontSize: 7,
    color: colors.muted,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.6,
    fontStyle: "italic",
  },
  whyMission: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 28,
    width: "100%",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  whyMissionText: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.foreground,
    textAlign: "center",
    lineHeight: 1.5,
  },

  // ── Webinars ──
  webinarList: {
    gap: 0,
    width: "100%",
    marginBottom: 24,
  },
  webinarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  webinarBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  webinarText: {
    fontSize: 10,
    color: colors.foreground,
    flex: 1,
  },
  webinarNote: {
    fontSize: 9,
    color: colors.muted,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 1.6,
  },

  // ── Mission ──
  sectionBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.foreground,
    marginBottom: 16,
  },
  missionBody: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 1.75,
    marginBottom: 36,
  },
  cardsRow: {
    flexDirection: "row",
    gap: 14,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
  },
  pillarIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  pillarIconText: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  pillarTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.foreground,
    marginBottom: 8,
  },
  pillarDesc: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.6,
  },

  // ── Reassurance ──
  reassuranceWrap: {
    flex: 1,
  },
  reassuranceIntro: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 1.7,
    marginBottom: 28,
    maxWidth: 460,
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 36,
  },
  benefitCard: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 18,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitIconText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  benefitTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.foreground,
    marginBottom: 6,
  },
  benefitDesc: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.55,
  },
  certifSection: {
    marginTop: 8,
  },
  certifTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 14,
  },
  certifRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  certifBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  certifDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  certifText: {
    fontSize: 9,
    color: colors.foreground,
  },

  // ── CTA ──
  ctaWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.foreground,
    textAlign: "center",
    marginBottom: 12,
  },
  ctaSub: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 36,
    maxWidth: 380,
    lineHeight: 1.65,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 36,
  },
  ctaBtnText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textAlign: "center",
    textDecoration: "none",
  },
  qrWrap: {
    alignItems: "center",
  },
  qrImage: {
    width: 110,
    height: 110,
    marginBottom: 10,
  },
  qrLabel: {
    fontSize: 9,
    color: colors.muted,
    textAlign: "center",
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
  },
  footerText: {
    fontSize: 7,
    color: colors.muted,
    textAlign: "center",
    opacity: 0.6,
  },
});

interface CompanyContact {
  nom: string;
  email: string;
  role_contact?: string | null;
}

interface WelcomeKitPDFProps {
  companyName: string;
  companyLogoUrl?: string | null;
  myfincareLogoUrl?: string | null;
  bookingUrl: string;
  qrCodeDataUrl: string;
  companyContacts?: CompanyContact[];
}

const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>
      Service 100% independant et securise. Aucun partage de donnees avec
      l'employeur. MyFinCare {new Date().getFullYear()}
    </Text>
  </View>
);

export const WelcomeKitPDF = ({
  companyName,
  companyLogoUrl,
  myfincareLogoUrl,
  bookingUrl,
  qrCodeDataUrl,
  companyContacts = [],
}: WelcomeKitPDFProps) => (
  <Document>
    {/* ── Page 1 : Couverture ── */}
    <Page size="A4" style={styles.page}>
      <View style={styles.topBar} />
      <View style={styles.coverWrap}>
        <View style={styles.logosRow}>
          {myfincareLogoUrl && (
            <Image src={myfincareLogoUrl} style={styles.logo} />
          )}
          {companyLogoUrl && (
            <>
              <Text style={styles.logoX}>x</Text>
              <Image src={companyLogoUrl} style={styles.logo} />
            </>
          )}
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>GUIDE DE BIEN-ETRE FINANCIER</Text>
        </View>

        <Text style={styles.coverTitle}>
          Prenez le pouvoir sur vos finances avec {companyName} et MyFinCare.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.coverSub}>
          Le bien-etre financier commence par un accompagnement serein,
          confidentiel et personnalise.
        </Text>

        <View style={styles.pillsRow}>
          <View style={styles.pill}>
            <View
              style={[styles.pillDot, { backgroundColor: colors.success }]}
            />
            <Text style={styles.pillText}>100% confidentiel</Text>
          </View>
          <View style={styles.pill}>
            <View
              style={[styles.pillDot, { backgroundColor: colors.secondary }]}
            />
            <Text style={styles.pillText}>Experts neutres</Text>
          </View>
          <View style={styles.pill}>
            <View
              style={[styles.pillDot, { backgroundColor: colors.accent }]}
            />
            <Text style={styles.pillText}>Outils pratiques</Text>
          </View>
        </View>
      </View>
      <Footer />
    </Page>

    {/* ── Page 2 : Pourquoi MyFinCare ── */}
    <Page size="A4" style={styles.page}>
      <View style={styles.topBar} />
      <View style={styles.whyWrap}>
        <View style={styles.sectionBadge}>
          <Text style={styles.badgeText}>LES BESOINS DES SALARIES</Text>
        </View>

        <Text style={styles.whyTitle}>
          Pourquoi MyFinCare existe
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>86%</Text>
            <Text style={styles.statDesc}>
              des Francais declarent ne pas se sentir suffisamment informes pour prendre de bonnes decisions financieres.
            </Text>
            <Text style={styles.statSource}>Source : Banque de France, 2023</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>70%</Text>
            <Text style={styles.statDesc}>
              des actifs en entreprise ne comprennent pas les mecanismes lies a leur epargne salariale, leur PER ou leurs stock-options.
            </Text>
            <Text style={styles.statSource}>Source : Ifop 2023, Fondation Credit Cooperatif</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>33%</Text>
            <Text style={styles.statDesc}>
              des contribuables declarent avoir mal renseigne leur declaration de revenus.
            </Text>
            <Text style={styles.statSource}></Text>
          </View>
        </View>

        <View style={styles.whyMission}>
          <Text style={styles.whyMissionText}>
            Faire de chaque salarie un acteur eclaire de ses decisions financieres.
          </Text>
        </View>
      </View>
      <Footer />
    </Page>

    {/* ── Page 3 : Mission ── */}
    <Page size="A4" style={styles.page}>
      <View style={styles.topBar} />

      <View style={styles.sectionBadge}>
        <Text style={styles.badgeText}>NOTRE MISSION</Text>
      </View>

      <Text style={styles.sectionTitle}>
        Votre serenite financiere, notre engagement
      </Text>

      <Text style={styles.missionBody}>
        Le bien-etre ne s'arrete pas a la porte du bureau. Chez MyFinCare, nous
        pensons que la serenite financiere est le socle de votre epanouissement.
        Notre mission est de democratiser l'acces au conseil expert pour que
        l'argent devienne un moteur pour vos projets, et non une source de
        stress.
      </Text>

      <View style={styles.cardsRow}>
        <View style={styles.pillarCard}>
          <View
            style={[styles.pillarIcon, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.pillarIconText}>C</Text>
          </View>
          <Text style={styles.pillarTitle}>Confidentialite Absolue</Text>
          <Text style={styles.pillarDesc}>
            C'est votre jardin secret. Votre employeur n'a acces a aucune donnee
            personnelle. Vos informations financieres restent strictement
            confidentielles.
          </Text>
        </View>

        <View style={styles.pillarCard}>
          <View
            style={[styles.pillarIcon, { backgroundColor: colors.secondary }]}
          >
            <Text style={styles.pillarIconText}>E</Text>
          </View>
          <Text style={styles.pillarTitle}>Expertise Humaine</Text>
          <Text style={styles.pillarDesc}>
            Accedez a des conseillers neutres et experts pour des conseils sans
            conflit d'interet. Un accompagnement humain, pas un algorithme.
          </Text>
        </View>

        <View style={styles.pillarCard}>
          <View
            style={[styles.pillarIcon, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.pillarIconText}>O</Text>
          </View>
          <Text style={styles.pillarTitle}>Outils Pratiques</Text>
          <Text style={styles.pillarDesc}>
            Pilotez vos projets d'epargne, immobilier et budget en quelques
            clics grace a nos simulateurs et tableaux de bord personnalises.
          </Text>
        </View>
      </View>

      <Footer />
    </Page>

    {/* ── Page 4 : Webinars ── */}
    <Page size="A4" style={styles.page}>
      <View style={styles.topBar} />

      <View style={styles.sectionBadge}>
        <Text style={styles.badgeText}>NOS WEBINARS</Text>
      </View>

      <Text style={[styles.sectionTitle, { fontSize: 18, marginBottom: 10 }]}>
        Des interventions pour eclairer vos choix
      </Text>

      <Text style={[styles.missionBody, { marginBottom: 16, fontSize: 10 }]}>
        Nous organisons regulierement des webinars thematiques, animes par des experts, pour vous aider a comprendre et optimiser vos finances personnelles.
      </Text>

      <View style={styles.webinarList}>
        {[
          "Epargner et investir - mode d'emploi",
          "Declaration de revenus - erreurs a eviter",
          "Revenus passifs - comment generer de la rente ?",
          "Optimisation fiscale - derniere ligne droite avant la fin de l'annee",
          "RSU/ESPP - Fonctionnement, fiscalite et optimisation",
          "Diversification de son patrimoine - principes, enveloppes et actifs",
          "Epargne salariale - Les principes et les bonnes pratiques",
          "Stock-Options - Fonctionnement, fiscalite et optimisation",
          "BSCPE - Fonctionnement, fiscalite et optimisation",
          "Decryptage fiscal : Maitrisez l'impact du budget 2026 sur vos revenus",
        ].map((topic, i) => (
          <View key={i} style={[styles.webinarItem, { paddingVertical: 7 }]}>
            <View style={[styles.webinarBullet, { width: 6, height: 6 }, i % 3 === 1 ? { backgroundColor: colors.secondary } : i % 3 === 2 ? { backgroundColor: colors.accent } : {}]} />
            <Text style={[styles.webinarText, { fontSize: 9 }]}>{topic}</Text>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 16, marginTop: 8 }}>
        <Text style={[styles.webinarNote, { marginBottom: companyContacts.length > 0 ? 8 : 0 }]}>
          Ceci est une liste non exhaustive des webinars proposes par MyFinCare.
        </Text>
        {companyContacts.length > 0 && (
          <Text style={[styles.webinarNote, { fontStyle: "normal" }]}>
            Vous avez une demande specifique ? Rapprochez-vous de votre referent :{" "}
            {companyContacts.map((c, i) => (
              `${c.nom}${c.role_contact ? ` (${c.role_contact})` : ""} - ${c.email}${i < companyContacts.length - 1 ? " / " : ""}`
            )).join("")}
          </Text>
        )}
      </View>

      <Footer />
    </Page>

    {/* ── Page 5 : Reassurance Perlib ── */}
    <Page size="A4" style={styles.page}>
      <View style={styles.topBar} />
      <View style={styles.reassuranceWrap}>
        <View style={styles.sectionBadge}>
          <Text style={styles.badgeText}>VOTRE CABINET PARTENAIRE</Text>
        </View>

        <Text style={styles.sectionTitle}>
          Perlib, expert en gestion de patrimoine
        </Text>

        <Text style={styles.reassuranceIntro}>
          Cabinet de gestion de patrimoine independant, designe meilleur
          conseiller epargne depuis 2023. Un accompagnement personnalise pour
          optimiser vos projets financiers, fiscaux, immobiliers et
          successoraux.
        </Text>

        <View style={styles.benefitsGrid}>
          <View style={styles.benefitCard}>
            <View
              style={[styles.benefitIcon, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.benefitIconText}>A</Text>
            </View>
            <Text style={styles.benefitTitle}>Analyse personnalisee</Text>
            <Text style={styles.benefitDesc}>
              Un expert analyse votre situation financiere en detail pour des
              recommandations sur mesure.
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <View
              style={[
                styles.benefitIcon,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Text style={styles.benefitIconText}>S</Text>
            </View>
            <Text style={styles.benefitTitle}>Strategies optimisees</Text>
            <Text style={styles.benefitDesc}>
              Des recommandations adaptees a vos objectifs pour maximiser votre
              patrimoine.
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <View
              style={[styles.benefitIcon, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.benefitIconText}>R</Text>
            </View>
            <Text style={styles.benefitTitle}>Structure reputee</Text>
            <Text style={styles.benefitDesc}>
              Plus de 6 000 clients accompagnes et note 4,9/5 sur Google Avis
              avec plus de 750 avis.
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <View
              style={[styles.benefitIcon, { backgroundColor: colors.success }]}
            >
              <Text style={styles.benefitIconText}>G</Text>
            </View>
            <Text style={styles.benefitTitle}>Gratuit et sans engagement</Text>
            <Text style={styles.benefitDesc}>
              Un bilan patrimonial offert par votre entreprise, sans aucune
              obligation de votre part.
            </Text>
          </View>
        </View>

        <View style={styles.certifSection}>
          <Text style={styles.certifTitle}>AGREMENTS ET CERTIFICATIONS</Text>
          <View style={styles.certifRow}>
            <View style={styles.certifBadge}>
              <View style={styles.certifDot} />
              <Text style={styles.certifText}>Immatricule ORIAS</Text>
            </View>
            <View style={styles.certifBadge}>
              <View style={styles.certifDot} />
              <Text style={styles.certifText}>Agree ACPR</Text>
            </View>
            <View style={styles.certifBadge}>
              <View style={styles.certifDot} />
              <Text style={styles.certifText}>Agree AMF</Text>
            </View>
            <View style={styles.certifBadge}>
              <View style={styles.certifDot} />
              <Text style={styles.certifText}>
                Meilleur conseiller epargne 2023-2025
              </Text>
            </View>
            <View style={styles.certifBadge}>
              <View style={styles.certifDot} />
              <Text style={styles.certifText}>4,9/5 - 750+ avis Google</Text>
            </View>
          </View>
        </View>
      </View>
      <Footer />
    </Page>

    {/* ── Page 4 : CTA ── */}
    <Page size="A4" style={styles.page}>
      <View style={styles.topBar} />
      <View style={styles.ctaWrap}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PASSEZ A L'ACTION</Text>
        </View>

        <Text style={styles.ctaTitle}>Besoin de faire le point ?</Text>

        <Text style={styles.ctaSub}>
          Un diagnostic personnalise de 30 minutes vous est offert par{" "}
          {companyName}. Prenez rendez-vous avec un expert MyFinCare et
          commencez a construire votre avenir financier des aujourd'hui.
        </Text>

        <Link src={bookingUrl} style={{ textDecoration: "none" }}>
          <View style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>PRENDRE RENDEZ-VOUS</Text>
          </View>
        </Link>

        <View style={styles.qrWrap}>
          {qrCodeDataUrl && (
            <Image src={qrCodeDataUrl} style={styles.qrImage} />
          )}
          <Text style={styles.qrLabel}>
            Scannez ce QR Code pour prendre rendez-vous
          </Text>
        </View>
      </View>
      <Footer />
    </Page>
  </Document>
);
