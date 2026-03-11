// Templates prédéfinis pour les kits de communication
// Variables disponibles : ${moduleTitle}, ${moduleDescription}, ${webinarDate}, ${webinar_registration_url}, 
// ${companyName}, ${partnershipType}, ${contactName}, ${bookingUrl}, ${signupCta}, ${signature}

// Templates par défaut pour chaque type et échéance
const defaultTemplates: Record<string, Record<string, string>> = {
  email: {
    "j-30": `OBJET : 📅 Webinar \${moduleTitle} - Réservez votre place dès maintenant !

Bonjour,

Nous avons le plaisir de vous annoncer un webinar exclusif organisé par \${companyName} sur le thème : \${moduleTitle}.

📅 Date : \${webinarDate}
⏱️ Durée : 1 heure
👥 Places limitées

🎯 Ce que vous allez apprendre :
\${moduleDescription}

\${partnershipType ? \`Dans le cadre de notre partenariat \${partnershipType}, nous vous offrons un accès privilégié à cette formation.\` : ""}

💡 Pourquoi participer ?
• Développer vos compétences financières
• Poser vos questions en direct à nos experts
• Obtenir des conseils personnalisés
• Gagner des points dans votre parcours formation

👉 Inscrivez-vous dès maintenant pour réserver votre place !
📹 Pour vous inscrire :
\${webinar_registration_url}

🎯 Vous souhaitez rencontrer un conseiller dès maintenant ? Prenez rendez-vous directement en cliquant ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`Pour toute question, contactez \${contactName}.\` : ""}

À très bientôt !

\${signature}`,

    "j-14": `OBJET : 📅 Webinar \${moduleTitle} - Réservez votre place !

Bonjour,

Nous sommes ravis de vous annoncer un webinar exclusif organisé par \${companyName} sur le thème : \${moduleTitle}.

📅 Date : \${webinarDate}
⏱️ Durée : 1 heure
👥 Places limitées

🎯 Ce que vous allez apprendre :
\${moduleDescription}

\${partnershipType ? \`Dans le cadre de notre partenariat \${partnershipType}, nous vous offrons un accès privilégié à cette formation.\` : ""}

💡 Pourquoi participer ?
• Développer vos compétences financières
• Poser vos questions en direct à nos experts
• Obtenir des conseils personnalisés
• Gagner des points dans votre parcours formation

👉 Inscrivez-vous dès maintenant pour réserver votre place !
📹 Pour vous inscrire :
\${webinar_registration_url}

🎯 Vous souhaitez rencontrer un conseiller dès maintenant ? Prenez rendez-vous directement en cliquant ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`Pour toute question, contactez \${contactName}.\` : ""}

À très bientôt !

\${signature}`,

    "j-7": `OBJET : ⏰ Plus qu'une semaine - Webinar \${moduleTitle}

Bonjour,

Le webinar \${moduleTitle} approche à grands pas !

📅 Rappel : \${webinarDate}

Vous n'êtes pas encore inscrit(e) ? Il n'est pas trop tard !

🎯 Au programme :
\${moduleDescription}

Les places se remplissent rapidement. Ne manquez pas cette opportunité d'enrichir vos connaissances en finance personnelle.

✨ En participant, vous :
• Bénéficiez de l'expertise de nos formateurs
• Interagissez en direct
• Progressez dans votre parcours
• Obtenez des réponses à vos questions

👉 Inscrivez-vous maintenant !

📹 Pour vous inscrire :
\${webinar_registration_url}

🎯 Vous souhaitez rencontrer un conseiller dès maintenant ? Prenez rendez-vous directement en cliquant ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`Questions ? Contactez \${contactName}.\` : ""}

À bientôt !

\${signature}`,

    "j-3": `OBJET : 🚨 J-3 - Dernières places pour le webinar \${moduleTitle}

Bonjour,

C'est dans 3 jours ! Le webinar \${moduleTitle} aura lieu :

📅 \${webinarDate}

⚡ Les dernières places partent vite !

🎯 Thème :
\${moduleDescription}

Ne laissez pas passer cette occasion unique de booster vos compétences financières.

✅ Les avantages :
• Formation pratique et interactive
• Expertise de qualité
• Échanges en direct
• Points bonus dans votre parcours

⏰ Il reste encore quelques places, mais plus pour longtemps !

👉 Inscrivez-vous sans attendre !

📹 Pour vous inscrire :
\${webinar_registration_url}

🎯 Vous souhaitez rencontrer un conseiller dès maintenant ? Prenez rendez-vous directement en cliquant ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`Questions de dernière minute ? \${contactName} est là pour vous.\` : ""}

À très vite !

\${signature}`,

    "j-1": `OBJET : ⚡ DEMAIN - Webinar \${moduleTitle}

Bonjour,

C'est demain ! Le webinar \${moduleTitle} a lieu :

📅 DEMAIN - \${webinarDate}

🔥 Dernière chance de vous inscrire !

Vous hésitez encore ? Voici pourquoi vous ne devez pas manquer cet événement :

🎯 \${moduleDescription}

✨ 1 heure pour transformer votre rapport à l'argent
💡 Des conseils pratiques immédiatement applicables
🎁 Des points bonus pour votre progression

⏰ Les inscriptions ferment ce soir !

👉 Réservez votre place maintenant !

📹 Pour vous inscrire :
\${webinar_registration_url}

🎯 Vous souhaitez rencontrer un conseiller dès maintenant ? Prenez rendez-vous directement en cliquant ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`Dernier délai pour vos questions : \${contactName}\` : ""}

À demain !

\${signature}`,

    "jour-j": `OBJET : 🔴 AUJOURD'HUI - Webinar \${moduleTitle}

Bonjour,

C'est AUJOURD'HUI ! Le webinar \${moduleTitle} commence dans quelques heures :

📅 AUJOURD'HUI - \${webinarDate}

🎯 \${moduleDescription}

Vous êtes inscrit(e) ? Parfait ! Voici le lien de connexion :

👉 \${webinar_registration_url}

⚠️ Important :
• Connectez-vous 5 minutes avant le début
• Préparez vos questions
• Ayez de quoi prendre des notes

💡 Astuce : Installez l'application si vous participez depuis votre mobile pour une meilleure expérience.

🎯 Vous souhaitez rencontrer un conseiller dès maintenant ? Prenez rendez-vous directement en cliquant ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`Problème technique ? Contactez rapidement \${contactName}.\` : ""}

À tout de suite !

\${signature}`,

    "today": `OBJET : 📅 Webinar \${moduleTitle} - \${daysUntilWebinar}

Bonjour,

Nous vous rappelons le prochain webinar organisé par \${companyName} :

📅 Date : \${webinarDate}
⏰ C'est dans \${daysUntilWebinar} !
🎯 Thème : \${moduleTitle}

\${moduleDescription}

\${partnershipType ? \`Dans le cadre de notre partenariat \${partnershipType}, nous vous offrons un accès privilégié.\` : ""}

👉 Pour vous inscrire :
\${webinar_registration_url}

🎯 Vous souhaitez rencontrer un conseiller dès maintenant ? Prenez rendez-vous directement en cliquant ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`Contact : \${contactName}\` : ""}

\${signature}`,
  },

  intranet: {
    "j-30": `# 📅 Webinar exclusif : \${moduleTitle}

## Un mois pour vous organiser !

Nous sommes ravis de vous annoncer un webinar exclusif prévu dans un mois pour tous les collaborateurs \${companyName}.

### 📍 Les informations pratiques

**Date et horaire :** \${webinarDate}
**Durée :** 1 heure
**Format :** Webinar interactif en ligne
**Places :** Limitées

### 🎯 Au programme

\${moduleDescription}

### ✨ Pourquoi participer ?

\${partnershipType ? \`Dans le cadre de notre partenariat \${partnershipType}, nous vous offrons un accès privilégié à cette formation de qualité.\` : ""}

Ce webinar vous permettra de :
- 📚 Développer vos compétences en finance personnelle
- 💡 Obtenir des conseils pratiques d'experts
- 🎤 Poser vos questions en direct
- 🎯 Progresser dans votre parcours de formation
- 🏆 Gagner des points et débloquer des badges

### 👉 Comment s'inscrire ?

📹 Pour vous inscrire :
\${webinar_registration_url}

### 🎯 Besoin d'un accompagnement personnalisé ?

Vous souhaitez rencontrer un conseiller dès maintenant ? [Prenez rendez-vous directement en cliquant ici](\${bookingUrl})
\${signupCta}
\${contactName ? \`### 📞 Contact\\n\\nPour toute question, contactez \${contactName}.\` : ""}

---
\${signature}`,

    "j-14": `# 📅 Webinar exclusif : \${moduleTitle}

## Une opportunité unique de formation pour tous les collaborateurs \${companyName}

Nous sommes ravis de vous annoncer l'organisation d'un webinar exclusif sur le thème de l'éducation financière.

### 📍 Les informations pratiques

**Date et horaire :** \${webinarDate}
**Durée :** 1 heure
**Format :** Webinar interactif en ligne
**Places :** Limitées

### 🎯 Au programme

\${moduleDescription}

### ✨ Pourquoi participer ?

\${partnershipType ? \`Dans le cadre de notre partenariat \${partnershipType}, nous vous offrons un accès privilégié à cette formation de qualité.\` : ""}

Ce webinar vous permettra de :
- 📚 Développer vos compétences en finance personnelle
- 💡 Obtenir des conseils pratiques d'experts
- 🎤 Poser vos questions en direct
- 🎯 Progresser dans votre parcours de formation
- 🏆 Gagner des points et débloquer des badges

### 👉 Comment s'inscrire ?

📹 Pour vous inscrire :
\${webinar_registration_url}

### 🎯 Besoin d'un accompagnement personnalisé ?

Vous souhaitez rencontrer un conseiller dès maintenant ? [Prenez rendez-vous directement en cliquant ici](\${bookingUrl})
\${signupCta}
\${contactName ? \`### 📞 Contact\\n\\nPour toute question, contactez \${contactName}.\` : ""}

---
\${signature}`,

    "j-7": `# ⏰ Plus qu'une semaine - Webinar \${moduleTitle}

## Le compte à rebours est lancé !

Le webinar \${moduleTitle} aura lieu dans exactement **une semaine** !

### 📅 Date : \${webinarDate}

### 🎯 Rappel du programme

\${moduleDescription}

### ✅ Pourquoi c'est le moment de s'inscrire

Les places se remplissent rapidement ! Voici ce que vous allez gagner en participant :

- 💰 Des connaissances précieuses pour mieux gérer vos finances
- 🎓 Une formation de qualité dispensée par des experts
- 🤝 Des échanges enrichissants avec les autres participants
- 🏆 Des points bonus dans votre parcours formation

### 📊 État des inscriptions

⚡ **Places restantes limitées**

### 👉 Action requise

📹 Pour vous inscrire :
\${webinar_registration_url}

### 🎯 Besoin d'un accompagnement personnalisé ?

Vous souhaitez rencontrer un conseiller dès maintenant ? [Prenez rendez-vous directement en cliquant ici](\${bookingUrl})
\${signupCta}
\${contactName ? \`### 📞 Questions ?\\n\\nContactez \${contactName} pour plus d'informations.\` : ""}

---
\${signature}`,

    "j-3": `# 🚨 J-3 - Dernières places pour \${moduleTitle}

## Plus que 3 jours !

⏰ **Date : \${webinarDate}**

### 🔥 Alerte places limitées

Les inscriptions touchent à leur fin ! Ne manquez pas cette opportunité unique.

### 🎯 Ce qui vous attend

\${moduleDescription}

### ⚡ Dernière ligne droite

**Pourquoi vous devez vous inscrire maintenant :**

1. 📉 Les places se remplissent rapidement
2. 🎓 Formation de qualité avec nos experts
3. 💡 Conseils pratiques immédiatement applicables
4. 🏆 Points bonus pour votre progression
5. 🎤 Session de Q&A en direct

### 👉 Agissez maintenant !

📹 Pour vous inscrire :
\${webinar_registration_url}

### 🎯 Besoin d'un accompagnement personnalisé ?

Vous souhaitez rencontrer un conseiller dès maintenant ? [Prenez rendez-vous directement en cliquant ici](\${bookingUrl})
\${signupCta}
\${contactName ? \`### 📞 Dernières questions ?\\n\\n\${contactName} est à votre disposition.\` : ""}

---
\${signature}`,

    "j-1": `# ⚡ DEMAIN - Webinar \${moduleTitle}

## C'est demain !

🔥 **Le grand jour arrive : \${webinarDate}**

### 🎯 Programme de demain

\${moduleDescription}

### 🚨 Dernière chance

⏰ **Les inscriptions ferment ce soir !**

C'est votre dernière opportunité de rejoindre cette session exclusive.

### ✨ Ce que vous allez gagner

- 📚 Des compétences financières essentielles
- 💡 Des conseils d'experts applicables immédiatement
- 🎤 Vos questions répondues en direct
- 🏆 Des points pour votre progression
- 📜 Une attestation de participation

### 👉 Action immédiate requise

📹 Pour vous inscrire :
\${webinar_registration_url}

### ✅ Déjà inscrit(e) ?

Préparez-vous pour demain :
- Notez l'horaire dans votre agenda
- Préparez vos questions
- Assurez votre connexion internet

### 🎯 Besoin d'un accompagnement personnalisé ?

Vous souhaitez rencontrer un conseiller dès maintenant ? [Prenez rendez-vous directement en cliquant ici](\${bookingUrl})
\${signupCta}
\${contactName ? \`### 📞 Urgence ?\\n\\nContactez \${contactName} avant ce soir.\` : ""}

---
\${signature}`,

    "jour-j": `# 🔴 AUJOURD'HUI - \${moduleTitle}

## C'est maintenant !

⏰ **\${webinarDate}**

### 🎯 Programme d'aujourd'hui

\${moduleDescription}

### 🔗 Informations de connexion

**Pour les inscrits :**

👉 Lien de connexion : \${webinar_registration_url}

1. Connectez-vous 5 minutes avant le début
2. Vérifiez votre matériel (micro, webcam)
3. Préparez vos questions
4. Ayez de quoi prendre des notes

### 📱 Conseils techniques

- Privilégiez une connexion stable
- Fermez les applications inutiles
- Utilisez un casque pour une meilleure qualité audio
- Sur mobile, installez l'application dédiée

### ⚠️ En cas de problème technique

\${contactName ? \`Contactez immédiatement \${contactName}\` : "Consultez la FAQ ou contactez le support technique"}

### 🎯 Besoin d'un accompagnement personnalisé ?

Vous souhaitez rencontrer un conseiller ? [Prenez rendez-vous directement en cliquant ici](\${bookingUrl})
\${signupCta}
---
\${signature}`,

    "today": `# 📅 Webinar : \${moduleTitle}

## Rappel - \${daysUntilWebinar}

### 📍 Informations

**Date :** \${webinarDate}
**Échéance :** \${daysUntilWebinar}

### 🎯 Programme

\${moduleDescription}

### 👉 Inscription

📹 \${webinar_registration_url}

### 🎯 Besoin d'un accompagnement personnalisé ?

[Prenez rendez-vous avec un conseiller](\${bookingUrl})
\${signupCta}
\${contactName ? \`### 📞 Contact\\n\\n\${contactName}\` : ""}

---
\${signature}`,
  },

  message: {
    "j-30": `📅 **Webinar exclusif : \${moduleTitle}**

🗓️ *Dans 1 mois : \${webinarDate}*

🎯 **\${moduleDescription}**

✨ Au programme :
• Développement de compétences financières
• Q&A en direct avec des experts
• Points bonus dans votre parcours

\${partnershipType ? \`🤝 Partenariat \${partnershipType}\` : ""}

⚠️ Places limitées !

👉 *Inscrivez-vous maintenant !*
📹 \${webinar_registration_url}

🎯 Besoin d'un conseiller ? Prenez rendez-vous ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`💬 Questions ? → \${contactName}\` : ""}

\${signature}`,

    "j-14": `📅 **Webinar exclusif : \${moduleTitle}**

🎯 **\${moduleDescription}**

📍 *\${webinarDate}*
⏱️ Durée : 1h

✨ Au programme :
• Développement de compétences financières
• Q&A en direct avec des experts
• Points bonus dans votre parcours
• Conseils pratiques immédiatement applicables

\${partnershipType ? \`🤝 Partenariat \${partnershipType}\` : ""}

⚠️ Places limitées !

👉 *Inscrivez-vous maintenant !*
📹 \${webinar_registration_url}

🎯 Besoin d'un conseiller ? Prenez rendez-vous ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`💬 Questions ? → \${contactName}\` : ""}

\${signature}`,

    "j-7": `⏰ **Plus qu'une semaine !**

📅 Webinar : *\${moduleTitle}*
🗓️ \${webinarDate}

🎯 \${moduleDescription}

🔥 Les places partent vite !

✅ Pourquoi participer :
• Formation d'experts
• Échanges en direct
• Progression dans votre parcours
• Conseils personnalisés

👉 *Réservez votre place maintenant !*
📹 \${webinar_registration_url}

🎯 Besoin d'un conseiller ? Prenez rendez-vous ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`💬 \${contactName}\` : ""}

\${signature}`,

    "j-3": `🚨 **J-3 - Dernières places !**

⏰ *\${moduleTitle}*
📅 \${webinarDate}

🎯 \${moduleDescription}

🔥 **Attention : Places limitées !**

✨ Ne manquez pas :
• Expertise de qualité
• Session interactive
• Points bonus
• Conseils pratiques

⚡ *Inscrivez-vous MAINTENANT !*
📹 \${webinar_registration_url}

🎯 Besoin d'un conseiller ? Prenez rendez-vous ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`💬 \${contactName}\` : ""}

\${signature}`,

    "j-1": `⚡ **DEMAIN !**

🔥 Webinar : *\${moduleTitle}*
📅 \${webinarDate}

🎯 \${moduleDescription}

🚨 **Dernière chance de s'inscrire !**

✅ 1h pour transformer votre rapport à l'argent
💡 Conseils pratiques applicables immédiatement
🏆 Points bonus

⏰ *Inscriptions closes ce soir !*
📹 \${webinar_registration_url}

🎯 Besoin d'un conseiller ? Prenez rendez-vous ici : \${bookingUrl}
\${signupCta}
👉 Réservez maintenant !

\${contactName ? \`💬 \${contactName}\` : ""}

\${signature}`,

    "jour-j": `🔴 **C'EST AUJOURD'HUI !**

🎯 *\${moduleTitle}*
⏰ \${webinarDate}

\${moduleDescription}

🔗 **Inscrit(e) ? Connectez-vous maintenant !**
👉 \${webinar_registration_url}

⚠️ Important :
• Connexion 5 min avant
• Préparez vos questions

💡 Astuce : Installez l'app sur mobile

🎯 Besoin d'un conseiller ? Prenez rendez-vous ici : \${bookingUrl}
\${signupCta}
\${contactName ? \`💬 Problème ? → \${contactName}\` : ""}

👉 *À tout de suite !*

\${signature}`,

    "today": `📅 **Webinar : \${moduleTitle}**

🗓️ *\${daysUntilWebinar}* - \${webinarDate}

🎯 \${moduleDescription}

📹 \${webinar_registration_url}

🎯 Prenez rendez-vous avec un conseiller : \${bookingUrl}
\${signupCta}
\${contactName ? \`💬 \${contactName}\` : ""}

\${signature}`,
  },
};

export const getDefaultTemplate = (type: string, deadline: string): string => {
  return defaultTemplates[type]?.[deadline] || "";
};

export const getTemplate = (type: string, deadline: string, variables: Record<string, string>): string => {
  let template = defaultTemplates[type]?.[deadline] || "";
  
  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    template = template.replace(regex, value || '');
  });

  // Handle conditional expressions like ${partnershipType ? `...` : ""}
  template = template.replace(/\$\{(\w+)\s*\?\s*`([^`]*)`\s*:\s*"([^"]*)"\}/g, (match, varName, trueValue, falseValue) => {
    const value = variables[varName];
    if (value && value.trim() !== '') {
      return trueValue.replace(new RegExp(`\\$\\{${varName}\\}`, 'g'), value);
    }
    return falseValue;
  });

  // Clean up any remaining empty conditional blocks
  template = template.replace(/\n\n\n+/g, '\n\n');

  return formatToHtml(template);
};

// Process template with variables replacement (for custom templates from DB)
export const processTemplate = (templateContent: string, variables: Record<string, string>): string => {
  let processed = templateContent;
  
  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    processed = processed.replace(regex, value || '');
  });

  // Handle conditional expressions
  processed = processed.replace(/\$\{(\w+)\s*\?\s*`([^`]*)`\s*:\s*"([^"]*)"\}/g, (match, varName, trueValue, falseValue) => {
    const value = variables[varName];
    if (value && value.trim() !== '') {
      return trueValue.replace(new RegExp(`\\$\\{${varName}\\}`, 'g'), value);
    }
    return falseValue;
  });

  processed = processed.replace(/\n\n\n+/g, '\n\n');

  return formatToHtml(processed);
};

// Fonction pour convertir le texte brut en HTML formaté
const formatToHtml = (text: string): string => {
  if (!text) return "";

  // Séparer en lignes
  const lines = text.split("\n");
  let html = "";
  let inList = false;
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      html += `<ul class="list-disc pl-6 my-3 space-y-1">${currentListItems.map(item => `<li>${item}</li>`).join("")}</ul>`;
      currentListItems = [];
    }
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Ligne vide
    if (line === "") {
      flushList();
      continue;
    }
    
    // Bullet point (• ou - au début)
    if (line.startsWith("•") || line.startsWith("- ")) {
      inList = true;
      const content = line.replace(/^[•\-]\s*/, "").trim();
      currentListItems.push(content);
      continue;
    }
    
    // Numérotation (1. 2. etc.)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      if (!inList || currentListItems.length === 0) {
        flushList();
        inList = true;
      }
      currentListItems.push(numberedMatch[2]);
      continue;
    }
    
    // Ligne normale - flush la liste si on en avait une
    flushList();
    
    // Formater le texte avec gras (**text** ou *text*)
    let formattedLine = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
    
    // Handle markdown links [text](url) BEFORE converting raw URLs
    formattedLine = formattedLine.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" class="text-primary underline hover:text-primary/80">$1</a>'
    );

    // Convertir les URLs en liens cliquables (only URLs not already in href)
    formattedLine = formattedLine.replace(
      /(?<!href=")(https?:\/\/[^\s<"]+)/g,
      '<a href="$1" target="_blank" class="text-primary underline hover:text-primary/80">$1</a>'
    );
    
    // Titres markdown (# ## ###)
    if (line.startsWith("### ")) {
      html += `<h4 class="font-semibold text-base mt-4 mb-2">${formattedLine.replace(/^###\s*/, "")}</h4>`;
    } else if (line.startsWith("## ")) {
      html += `<h3 class="font-semibold text-lg mt-5 mb-2">${formattedLine.replace(/^##\s*/, "")}</h3>`;
    } else if (line.startsWith("# ")) {
      html += `<h2 class="font-bold text-xl mt-6 mb-3">${formattedLine.replace(/^#\s*/, "")}</h2>`;
    } else if (line.startsWith("OBJET :")) {
      html += `<p class="font-bold text-lg mb-4">${formattedLine}</p>`;
    } else if (line.startsWith("---")) {
      html += `<hr class="my-4 border-border"/>`;
    } else {
      html += `<p class="mb-3">${formattedLine}</p>`;
    }
  }
  
  // Flush la liste finale si nécessaire
  flushList();
  
  return html;
};
