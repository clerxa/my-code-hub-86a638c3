// Types for the new slides system

export type SlideType = 'title' | 'image' | 'list' | 'quote' | 'pdf' | 'text-image';

export type SlideLayoutVariant = 'centered' | 'left' | 'right' | 'fullscreen';

export type SlideTransition = 'fade' | 'slide' | 'zoom' | 'flip';

// Text color presets
export const TEXT_COLOR_PRESETS = [
  { label: 'Par défaut', value: '' },
  { label: 'Blanc', value: 'text-white' },
  { label: 'Noir', value: 'text-black' },
  { label: 'Primary', value: 'text-primary' },
  { label: 'Gris clair', value: 'text-gray-300' },
  { label: 'Gris foncé', value: 'text-gray-700' },
];

export interface SlideBase {
  id: string;
  type: SlideType;
  layout?: SlideLayoutVariant;
  bgColor?: string;
  bgImage?: string;
  bgGradient?: string;
  textColor?: string; // Text color class
}

export interface TitleSlide extends SlideBase {
  type: 'title';
  title: string;
  subtitle?: string;
  content?: string;
  icon?: string;
}

export interface ImageSlide extends SlideBase {
  type: 'image';
  imageUrl: string;
  imageAlt?: string;
  caption?: string;
  title?: string;
  imagePosition?: 'center' | 'left' | 'right' | 'background';
}

// New: Text + Image slide with flexible layouts
export interface TextImageSlide extends SlideBase {
  type: 'text-image';
  title: string;
  content?: string;
  imageUrl: string;
  imageAlt?: string;
  imagePosition: 'left' | 'right'; // Image on left or right, text on opposite side
}

export interface ListSlide extends SlideBase {
  type: 'list';
  title: string;
  items: {
    text: string;
    icon?: string;
    description?: string;
  }[];
  showNumbers?: boolean;
}

export interface QuoteSlide extends SlideBase {
  type: 'quote';
  quote: string;
  author?: string;
  role?: string;
  highlightColor?: string;
}

export interface PDFSlide extends SlideBase {
  type: 'pdf';
  pdfUrl: string;
  title?: string;
}

export type Slide = TitleSlide | ImageSlide | ListSlide | QuoteSlide | PDFSlide | TextImageSlide;

export interface SlidesData {
  slides: Slide[];
  transition?: SlideTransition;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

// Helper to create a new slide with defaults
export const createSlide = (type: SlideType): Slide => {
  const id = crypto.randomUUID();
  
  switch (type) {
    case 'title':
      return { id, type, title: '', layout: 'centered' };
    case 'image':
      return { id, type, imageUrl: '', layout: 'centered' };
    case 'text-image':
      return { id, type, title: '', imageUrl: '', imagePosition: 'right', layout: 'centered' };
    case 'list':
      return { id, type, title: '', items: [], layout: 'left' };
    case 'quote':
      return { id, type, quote: '', layout: 'centered' };
    case 'pdf':
      return { id, type, pdfUrl: '', layout: 'fullscreen' };
    default:
      return { id, type: 'title', title: '' };
  }
};

export const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  title: 'Titre + Texte',
  image: 'Image seule',
  'text-image': 'Texte + Image',
  list: 'Liste / Points clés',
  quote: 'Citation / Highlight',
  pdf: 'Document PDF',
};

export const SLIDE_TYPE_ICONS: Record<SlideType, string> = {
  title: 'Type',
  image: 'Image',
  'text-image': 'Columns',
  list: 'List',
  quote: 'Quote',
  pdf: 'FileText',
};

// =====================================================
// SLIDE TEMPLATES - Pre-configured slide sets
// =====================================================

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  slides: Slide[];
}

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: 'intro',
    name: 'Introduction',
    description: 'Slide de titre avec objectifs pédagogiques',
    icon: 'Play',
    color: 'from-emerald-500 to-teal-600',
    slides: [
      {
        id: crypto.randomUUID(),
        type: 'title',
        title: 'Titre du module',
        subtitle: 'Sous-titre ou accroche',
        content: 'Bienvenue dans ce module de formation.',
        layout: 'centered',
        bgGradient: 'from-primary/20 to-primary/5'
      },
      {
        id: crypto.randomUUID(),
        type: 'list',
        title: '🎯 Objectifs de ce module',
        items: [
          { text: 'Objectif 1', description: 'Description de l\'objectif' },
          { text: 'Objectif 2', description: 'Description de l\'objectif' },
          { text: 'Objectif 3', description: 'Description de l\'objectif' }
        ],
        layout: 'left',
        bgGradient: 'from-blue-600 to-indigo-900'
      }
    ]
  },
  {
    id: 'chapter',
    name: 'Chapitre',
    description: 'Section de contenu avec titre et points clés',
    icon: 'BookOpen',
    color: 'from-blue-500 to-indigo-600',
    slides: [
      {
        id: crypto.randomUUID(),
        type: 'title',
        title: 'Chapitre X',
        subtitle: 'Titre du chapitre',
        layout: 'centered',
        bgGradient: 'from-purple-600 to-pink-600'
      },
      {
        id: crypto.randomUUID(),
        type: 'title',
        title: 'Concept clé',
        content: 'Explication détaillée du concept principal de ce chapitre. Ajoutez ici le contenu pédagogique essentiel.',
        layout: 'left'
      },
      {
        id: crypto.randomUUID(),
        type: 'list',
        title: 'Points importants',
        items: [
          { text: 'Point 1', description: 'Détail important' },
          { text: 'Point 2', description: 'Détail important' },
          { text: 'Point 3', description: 'Détail important' }
        ],
        showNumbers: true,
        layout: 'left'
      }
    ]
  },
  {
    id: 'conclusion',
    name: 'Conclusion',
    description: 'Récapitulatif et prochaines étapes',
    icon: 'CheckCircle',
    color: 'from-violet-500 to-purple-600',
    slides: [
      {
        id: crypto.randomUUID(),
        type: 'title',
        title: '📝 Ce qu\'il faut retenir',
        subtitle: 'Récapitulatif du module',
        layout: 'centered',
        bgGradient: 'from-emerald-500 to-teal-700'
      },
      {
        id: crypto.randomUUID(),
        type: 'list',
        title: 'Points clés à retenir',
        items: [
          { text: 'Enseignement 1', description: 'Le point principal' },
          { text: 'Enseignement 2', description: 'Le point principal' },
          { text: 'Enseignement 3', description: 'Le point principal' }
        ],
        layout: 'left'
      },
      {
        id: crypto.randomUUID(),
        type: 'quote',
        quote: 'Une citation inspirante ou un message de motivation pour clôturer le module.',
        author: 'Expert FinCare',
        layout: 'centered',
        bgGradient: 'from-orange-400 to-rose-600'
      },
      {
        id: crypto.randomUUID(),
        type: 'title',
        title: '🚀 Prochaines étapes',
        content: 'Félicitations ! Vous avez terminé ce module. Continuez votre parcours pour approfondir vos connaissances.',
        layout: 'centered',
        bgGradient: 'from-gray-900 to-gray-800'
      }
    ]
  },
  {
    id: 'concept',
    name: 'Concept',
    description: 'Explication d\'un concept avec visuel',
    icon: 'Lightbulb',
    color: 'from-amber-500 to-orange-600',
    slides: [
      {
        id: crypto.randomUUID(),
        type: 'title',
        title: 'Le concept',
        subtitle: 'Une notion essentielle',
        layout: 'centered',
        bgGradient: 'from-blue-600 to-indigo-900'
      },
      {
        id: crypto.randomUUID(),
        type: 'image',
        title: 'Illustration du concept',
        imageUrl: '',
        caption: 'Ajoutez une image explicative',
        imagePosition: 'center',
        layout: 'centered'
      },
      {
        id: crypto.randomUUID(),
        type: 'quote',
        quote: 'La définition ou le point clé à retenir sur ce concept.',
        layout: 'centered',
        highlightColor: 'primary'
      }
    ]
  },
  {
    id: 'example',
    name: 'Exemple pratique',
    description: 'Cas pratique avec mise en situation',
    icon: 'FileCode',
    color: 'from-cyan-500 to-blue-600',
    slides: [
      {
        id: crypto.randomUUID(),
        type: 'title',
        title: '💡 Exemple pratique',
        subtitle: 'Mise en application',
        layout: 'centered',
        bgGradient: 'from-cyan-500 to-blue-600'
      },
      {
        id: crypto.randomUUID(),
        type: 'title',
        title: 'Situation',
        content: 'Décrivez ici la situation ou le contexte de l\'exemple pratique.',
        layout: 'left'
      },
      {
        id: crypto.randomUUID(),
        type: 'list',
        title: 'Solution étape par étape',
        items: [
          { text: 'Étape 1', description: 'Première action à réaliser' },
          { text: 'Étape 2', description: 'Deuxième action à réaliser' },
          { text: 'Étape 3', description: 'Troisième action à réaliser' }
        ],
        showNumbers: true,
        layout: 'left'
      }
    ]
  }
];

// Helper to apply a template (generates fresh IDs)
export const applyTemplate = (template: SlideTemplate): Slide[] => {
  return template.slides.map(slide => ({
    ...slide,
    id: crypto.randomUUID()
  }));
};
