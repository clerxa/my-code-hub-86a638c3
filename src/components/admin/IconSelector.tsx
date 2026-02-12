import { 
  Target, TrendingUp, Shield, Star, CheckCircle, Clock, Users, Award, Zap, Heart, 
  Lightbulb, Gift, Trophy, ThumbsUp, MessageCircle, Calendar, Briefcase, Rocket, 
  Smile, Eye, Home, Wallet, CreditCard, Building, Building2, PiggyBank, Landmark,
  TrendingDown, Globe, Mail, Sparkles, BookOpen, GraduationCap, Calculator,
  Video, Phone, User, FileText, Folder, Settings, Bell, Search, Lock, Unlock,
  Key, Link, Download, Upload, Share, Edit, Trash2, Plus, Minus, Check, X,
  AlertCircle, Info, HelpCircle, ChevronRight, ArrowRight, ArrowUp, ArrowDown,
  RefreshCw, ExternalLink, Copy, Save, Send, Play, Pause, StopCircle,
  Headphones, Music, Image, Camera, Film, Mic, Volume2, Wifi, Cloud, Database,
  Server, Code, Terminal, Monitor, Smartphone, Tablet, Laptop, Watch, Printer,
  DollarSign, Euro, Bitcoin, Percent, BarChart, PieChart, LineChart, Activity,
  Map, MapPin, Navigation, Compass, Flag, Bookmark, Tag, Hash, AtSign,
  // New everyday life icons
  Car, Bike, Bus, Plane, Train, Ship, Fuel, ParkingCircle,
  ShoppingCart, ShoppingBag, Store, Package, Receipt, Barcode,
  Utensils, Coffee, Pizza, Wine, Cookie, Apple, Salad, IceCream2,
  Bed, Bath, Sofa, Lamp, Tv, Refrigerator, WashingMachine, AirVent,
  Baby, Dog, Cat, TreePine, Flower2, Sun, Moon, CloudRain, Umbrella, Snowflake, Thermometer,
  Dumbbell, HeartPulse, Pill, Stethoscope, Syringe, Bandage, Brain,
  Scissors, Paintbrush, Palette, Wrench, Hammer, Drill, Ruler, PenTool,
  Shirt, Glasses, Watch as WristWatch, Crown, Gem, Sparkle,
  PartyPopper, Cake, Gamepad2, Dice1, Puzzle, Music2, Guitar, Ticket,
  Mountain, Tent, Backpack, Luggage, Anchor, Waves,
  Handshake, UserPlus, UserCheck, Users2, UsersRound, Contact, BadgeCheck,
  ClipboardList, ClipboardCheck, ListTodo, ListChecks, CalendarCheck, CalendarClock,
  Lightbulb as IdeaLight, Brain as BrainIcon, Workflow, Network, Layers, Shapes,
  type LucideIcon
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Extended list of available icons with categories
export const availableIcons: { name: string; icon: LucideIcon; category: string }[] = [
  // Finance & Money
  { name: "DollarSign", icon: DollarSign, category: "Finance" },
  { name: "Euro", icon: Euro, category: "Finance" },
  { name: "Bitcoin", icon: Bitcoin, category: "Finance" },
  { name: "Wallet", icon: Wallet, category: "Finance" },
  { name: "CreditCard", icon: CreditCard, category: "Finance" },
  { name: "PiggyBank", icon: PiggyBank, category: "Finance" },
  { name: "Landmark", icon: Landmark, category: "Finance" },
  { name: "Percent", icon: Percent, category: "Finance" },
  { name: "TrendingUp", icon: TrendingUp, category: "Finance" },
  { name: "TrendingDown", icon: TrendingDown, category: "Finance" },
  { name: "BarChart", icon: BarChart, category: "Finance" },
  { name: "PieChart", icon: PieChart, category: "Finance" },
  { name: "LineChart", icon: LineChart, category: "Finance" },
  { name: "Activity", icon: Activity, category: "Finance" },
  { name: "Calculator", icon: Calculator, category: "Finance" },
  { name: "Receipt", icon: Receipt, category: "Finance" },
  
  // Business & Work
  { name: "Briefcase", icon: Briefcase, category: "Business" },
  { name: "Building", icon: Building, category: "Business" },
  { name: "Building2", icon: Building2, category: "Business" },
  { name: "Users", icon: Users, category: "Business" },
  { name: "Users2", icon: Users2, category: "Business" },
  { name: "UsersRound", icon: UsersRound, category: "Business" },
  { name: "User", icon: User, category: "Business" },
  { name: "UserPlus", icon: UserPlus, category: "Business" },
  { name: "UserCheck", icon: UserCheck, category: "Business" },
  { name: "Contact", icon: Contact, category: "Business" },
  { name: "Target", icon: Target, category: "Business" },
  { name: "Award", icon: Award, category: "Business" },
  { name: "Trophy", icon: Trophy, category: "Business" },
  { name: "Star", icon: Star, category: "Business" },
  { name: "Flag", icon: Flag, category: "Business" },
  { name: "Handshake", icon: Handshake, category: "Business" },
  { name: "BadgeCheck", icon: BadgeCheck, category: "Business" },
  
  // Communication
  { name: "Mail", icon: Mail, category: "Communication" },
  { name: "MessageCircle", icon: MessageCircle, category: "Communication" },
  { name: "Phone", icon: Phone, category: "Communication" },
  { name: "Video", icon: Video, category: "Communication" },
  { name: "Send", icon: Send, category: "Communication" },
  { name: "Bell", icon: Bell, category: "Communication" },
  { name: "AtSign", icon: AtSign, category: "Communication" },
  
  // Time & Calendar
  { name: "Calendar", icon: Calendar, category: "Time" },
  { name: "CalendarCheck", icon: CalendarCheck, category: "Time" },
  { name: "CalendarClock", icon: CalendarClock, category: "Time" },
  { name: "Clock", icon: Clock, category: "Time" },
  
  // Education & Learning
  { name: "BookOpen", icon: BookOpen, category: "Education" },
  { name: "GraduationCap", icon: GraduationCap, category: "Education" },
  { name: "Lightbulb", icon: Lightbulb, category: "Education" },
  { name: "Brain", icon: Brain, category: "Education" },
  
  // Tasks & Organization
  { name: "ClipboardList", icon: ClipboardList, category: "Organisation" },
  { name: "ClipboardCheck", icon: ClipboardCheck, category: "Organisation" },
  { name: "ListTodo", icon: ListTodo, category: "Organisation" },
  { name: "ListChecks", icon: ListChecks, category: "Organisation" },
  { name: "Workflow", icon: Workflow, category: "Organisation" },
  { name: "Network", icon: Network, category: "Organisation" },
  { name: "Layers", icon: Layers, category: "Organisation" },
  { name: "Shapes", icon: Shapes, category: "Organisation" },
  
  // Actions & UI
  { name: "CheckCircle", icon: CheckCircle, category: "Actions" },
  { name: "Check", icon: Check, category: "Actions" },
  { name: "X", icon: X, category: "Actions" },
  { name: "Plus", icon: Plus, category: "Actions" },
  { name: "Minus", icon: Minus, category: "Actions" },
  { name: "Edit", icon: Edit, category: "Actions" },
  { name: "Trash2", icon: Trash2, category: "Actions" },
  { name: "Save", icon: Save, category: "Actions" },
  { name: "Download", icon: Download, category: "Actions" },
  { name: "Upload", icon: Upload, category: "Actions" },
  { name: "Share", icon: Share, category: "Actions" },
  { name: "Copy", icon: Copy, category: "Actions" },
  { name: "RefreshCw", icon: RefreshCw, category: "Actions" },
  { name: "Search", icon: Search, category: "Actions" },
  { name: "Eye", icon: Eye, category: "Actions" },
  { name: "ExternalLink", icon: ExternalLink, category: "Actions" },
  { name: "Link", icon: Link, category: "Actions" },
  
  // Navigation
  { name: "ArrowRight", icon: ArrowRight, category: "Navigation" },
  { name: "ArrowUp", icon: ArrowUp, category: "Navigation" },
  { name: "ArrowDown", icon: ArrowDown, category: "Navigation" },
  { name: "ChevronRight", icon: ChevronRight, category: "Navigation" },
  { name: "Home", icon: Home, category: "Navigation" },
  { name: "Map", icon: Map, category: "Navigation" },
  { name: "MapPin", icon: MapPin, category: "Navigation" },
  { name: "Navigation", icon: Navigation, category: "Navigation" },
  { name: "Compass", icon: Compass, category: "Navigation" },
  { name: "Globe", icon: Globe, category: "Navigation" },
  
  // Status & Alerts
  { name: "AlertCircle", icon: AlertCircle, category: "Status" },
  { name: "Info", icon: Info, category: "Status" },
  { name: "HelpCircle", icon: HelpCircle, category: "Status" },
  { name: "Shield", icon: Shield, category: "Status" },
  { name: "Lock", icon: Lock, category: "Status" },
  { name: "Unlock", icon: Unlock, category: "Status" },
  { name: "Key", icon: Key, category: "Status" },
  
  // Emotions & Social
  { name: "Heart", icon: Heart, category: "Emotions" },
  { name: "ThumbsUp", icon: ThumbsUp, category: "Emotions" },
  { name: "Smile", icon: Smile, category: "Emotions" },
  { name: "Sparkles", icon: Sparkles, category: "Emotions" },
  { name: "Sparkle", icon: Sparkle, category: "Emotions" },
  { name: "Zap", icon: Zap, category: "Emotions" },
  { name: "Rocket", icon: Rocket, category: "Emotions" },
  { name: "Gift", icon: Gift, category: "Emotions" },
  { name: "PartyPopper", icon: PartyPopper, category: "Emotions" },
  
  // Transport
  { name: "Car", icon: Car, category: "Transport" },
  { name: "Bike", icon: Bike, category: "Transport" },
  { name: "Bus", icon: Bus, category: "Transport" },
  { name: "Train", icon: Train, category: "Transport" },
  { name: "Plane", icon: Plane, category: "Transport" },
  { name: "Ship", icon: Ship, category: "Transport" },
  { name: "Fuel", icon: Fuel, category: "Transport" },
  { name: "ParkingCircle", icon: ParkingCircle, category: "Transport" },
  
  // Shopping
  { name: "ShoppingCart", icon: ShoppingCart, category: "Shopping" },
  { name: "ShoppingBag", icon: ShoppingBag, category: "Shopping" },
  { name: "Store", icon: Store, category: "Shopping" },
  { name: "Package", icon: Package, category: "Shopping" },
  { name: "Barcode", icon: Barcode, category: "Shopping" },
  
  // Food & Drink
  { name: "Utensils", icon: Utensils, category: "Alimentation" },
  { name: "Coffee", icon: Coffee, category: "Alimentation" },
  { name: "Pizza", icon: Pizza, category: "Alimentation" },
  { name: "Wine", icon: Wine, category: "Alimentation" },
  { name: "Cookie", icon: Cookie, category: "Alimentation" },
  { name: "Apple", icon: Apple, category: "Alimentation" },
  { name: "Salad", icon: Salad, category: "Alimentation" },
  { name: "IceCream", icon: IceCream2, category: "Alimentation" },
  { name: "Cake", icon: Cake, category: "Alimentation" },
  
  // Home & Living
  { name: "Bed", icon: Bed, category: "Maison" },
  { name: "Bath", icon: Bath, category: "Maison" },
  { name: "Sofa", icon: Sofa, category: "Maison" },
  { name: "Lamp", icon: Lamp, category: "Maison" },
  { name: "Tv", icon: Tv, category: "Maison" },
  { name: "Refrigerator", icon: Refrigerator, category: "Maison" },
  { name: "WashingMachine", icon: WashingMachine, category: "Maison" },
  { name: "AirVent", icon: AirVent, category: "Maison" },
  
  // Family & Pets
  { name: "Baby", icon: Baby, category: "Famille" },
  { name: "Dog", icon: Dog, category: "Famille" },
  { name: "Cat", icon: Cat, category: "Famille" },
  
  // Nature & Weather
  { name: "TreePine", icon: TreePine, category: "Nature" },
  { name: "Flower2", icon: Flower2, category: "Nature" },
  { name: "Sun", icon: Sun, category: "Nature" },
  { name: "Moon", icon: Moon, category: "Nature" },
  { name: "CloudRain", icon: CloudRain, category: "Nature" },
  { name: "Umbrella", icon: Umbrella, category: "Nature" },
  { name: "Snowflake", icon: Snowflake, category: "Nature" },
  { name: "Thermometer", icon: Thermometer, category: "Nature" },
  { name: "Waves", icon: Waves, category: "Nature" },
  
  // Health & Fitness
  { name: "Dumbbell", icon: Dumbbell, category: "Santé" },
  { name: "HeartPulse", icon: HeartPulse, category: "Santé" },
  { name: "Pill", icon: Pill, category: "Santé" },
  { name: "Stethoscope", icon: Stethoscope, category: "Santé" },
  { name: "Syringe", icon: Syringe, category: "Santé" },
  { name: "Bandage", icon: Bandage, category: "Santé" },
  
  // Tools & DIY
  { name: "Scissors", icon: Scissors, category: "Outils" },
  { name: "Paintbrush", icon: Paintbrush, category: "Outils" },
  { name: "Palette", icon: Palette, category: "Outils" },
  { name: "Wrench", icon: Wrench, category: "Outils" },
  { name: "Hammer", icon: Hammer, category: "Outils" },
  { name: "Drill", icon: Drill, category: "Outils" },
  { name: "Ruler", icon: Ruler, category: "Outils" },
  { name: "PenTool", icon: PenTool, category: "Outils" },
  
  // Fashion & Style
  { name: "Shirt", icon: Shirt, category: "Mode" },
  { name: "Glasses", icon: Glasses, category: "Mode" },
  { name: "Crown", icon: Crown, category: "Mode" },
  { name: "Gem", icon: Gem, category: "Mode" },
  
  // Entertainment & Hobbies
  { name: "Gamepad2", icon: Gamepad2, category: "Loisirs" },
  { name: "Dice1", icon: Dice1, category: "Loisirs" },
  { name: "Puzzle", icon: Puzzle, category: "Loisirs" },
  { name: "Music2", icon: Music2, category: "Loisirs" },
  { name: "Guitar", icon: Guitar, category: "Loisirs" },
  { name: "Ticket", icon: Ticket, category: "Loisirs" },
  
  // Travel & Outdoors
  { name: "Mountain", icon: Mountain, category: "Voyage" },
  { name: "Tent", icon: Tent, category: "Voyage" },
  { name: "Backpack", icon: Backpack, category: "Voyage" },
  { name: "Luggage", icon: Luggage, category: "Voyage" },
  { name: "Anchor", icon: Anchor, category: "Voyage" },
  
  // Media
  { name: "Play", icon: Play, category: "Media" },
  { name: "Pause", icon: Pause, category: "Media" },
  { name: "StopCircle", icon: StopCircle, category: "Media" },
  { name: "Headphones", icon: Headphones, category: "Media" },
  { name: "Music", icon: Music, category: "Media" },
  { name: "Image", icon: Image, category: "Media" },
  { name: "Camera", icon: Camera, category: "Media" },
  { name: "Film", icon: Film, category: "Media" },
  { name: "Mic", icon: Mic, category: "Media" },
  { name: "Volume2", icon: Volume2, category: "Media" },
  
  // Tech
  { name: "Monitor", icon: Monitor, category: "Tech" },
  { name: "Smartphone", icon: Smartphone, category: "Tech" },
  { name: "Tablet", icon: Tablet, category: "Tech" },
  { name: "Laptop", icon: Laptop, category: "Tech" },
  { name: "Watch", icon: Watch, category: "Tech" },
  { name: "Printer", icon: Printer, category: "Tech" },
  { name: "Wifi", icon: Wifi, category: "Tech" },
  { name: "Cloud", icon: Cloud, category: "Tech" },
  { name: "Database", icon: Database, category: "Tech" },
  { name: "Server", icon: Server, category: "Tech" },
  { name: "Code", icon: Code, category: "Tech" },
  { name: "Terminal", icon: Terminal, category: "Tech" },
  { name: "Settings", icon: Settings, category: "Tech" },
  
  // Files & Organization
  { name: "FileText", icon: FileText, category: "Files" },
  { name: "Folder", icon: Folder, category: "Files" },
  { name: "Bookmark", icon: Bookmark, category: "Files" },
  { name: "Tag", icon: Tag, category: "Files" },
  { name: "Hash", icon: Hash, category: "Files" },
];

// Helper to get icon component by name
export function getIconByName(name: string): LucideIcon | null {
  const found = availableIcons.find(i => i.name.toLowerCase() === name?.toLowerCase());
  return found?.icon || null;
}

// Group icons by category
export function getIconsByCategory(): Record<string, typeof availableIcons> {
  return availableIcons.reduce((acc, icon) => {
    if (!acc[icon.category]) {
      acc[icon.category] = [];
    }
    acc[icon.category].push(icon);
    return acc;
  }, {} as Record<string, typeof availableIcons>);
}

interface IconSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowNone?: boolean;
}

export function IconSelector({ value, onChange, placeholder = "Sélectionner une icône...", allowNone = false }: IconSelectorProps) {
  const selectedIcon = availableIcons.find(i => i.name.toLowerCase() === value?.toLowerCase());
  const SelectedIconComponent = selectedIcon?.icon;
  const iconsByCategory = getIconsByCategory();

  return (
    <Select value={value || (allowNone ? '_none' : '')} onValueChange={(v) => onChange(v === '_none' ? '' : v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {value && value !== '_none' ? (
            <div className="flex items-center gap-2">
              {SelectedIconComponent && <SelectedIconComponent className="h-4 w-4" />}
              <span>{selectedIcon?.name || value}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        <ScrollArea className="h-[300px]">
          {allowNone && (
            <SelectItem value="_none">
              <span className="text-muted-foreground">Aucune icône</span>
            </SelectItem>
          )}
          {Object.entries(iconsByCategory).map(([category, icons]) => (
            <div key={category}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                {category}
              </div>
              {icons.map(({ name, icon: IconComponent }) => (
                <SelectItem key={name} value={name}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{name}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}
