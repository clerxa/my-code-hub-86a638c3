/**
 * Admin Components - Organized by logical modules
 * 
 * Structure:
 * - general/    : Documentation, Expert Booking
 * - companies/  : Companies, Users, Employees Import
 * - content/    : Modules, Parcours, Villains
 * - gamification/: Features, Themes, Quête FinCare
 * - settings/   : All configuration tabs
 * - shared/     : Reusable UI components
 * - landing/    : Landing page editors (already organized)
 */

// General
export { DocumentationTab } from './DocumentationTab';
export { ExpertBookingTab } from './ExpertBookingTab';
export { ExpertBookingLandingPreview } from './ExpertBookingLandingPreview';

// Companies
export { CompaniesTab } from './CompaniesTab';
export { CompanyRankingTab } from './CompanyRankingTab';
export { UsersAndEmployeesTab } from './UsersAndEmployeesTab';
export { EmployeesImportTab } from './EmployeesImportTab';

export { CommunicationTemplatesEditor } from './CommunicationTemplatesEditor';
export { SidebarConfigurationTab } from './SidebarConfigurationTab';

// Content
export { ModulesTab } from './ModulesTab';
export { ModulesImportTab } from './ModulesImportTab';
export { ParcoursTab } from './ParcoursTab';
export { FormationsTab } from './FormationsTab';
export { FormationContentEditor } from './FormationContentEditor';
export { QuizEditor } from './QuizEditor';
export { DraggableModuleList } from './DraggableModuleList';

// Gamification
export { default as FeaturesTab } from './FeaturesTab';
export { QueteFinCareEditor } from './QueteFinCareEditor';
export { FinancialProductsTab } from './FinancialProductsTab';

// Settings

export { RiskProfileTab } from './RiskProfileTab';
export { RiskProfileQuestionEditor } from './RiskProfileQuestionEditor';
export { RiskProfileResultsEditor } from './RiskProfileResultsEditor';
export { PointsAndValidationTab } from './PointsAndValidationTab';
export { NotificationsTab } from './NotificationsTab';
export { NotificationPreview } from './NotificationPreview';

export { LayoutCustomizationTab } from './LayoutCustomizationTab';
export { PageLayoutEditor } from './PageLayoutEditor';
export { CommunicationKitTab } from './CommunicationKitTab';
export { VisualResourcesTab } from './VisualResourcesTab';
export { CompanyFAQsTab } from './CompanyFAQsTab';
export { PartnershipTab } from './PartnershipTab';
export { EmployeePartnershipEditor } from './EmployeePartnershipEditor';
export { ReferralBlockTab } from './ReferralBlockTab';

export { SimulatorCTAsTab } from './SimulatorCTAsTab';
export { RecommendationsTab } from './RecommendationsTab';
export { NonPartnerWelcomeTab } from './NonPartnerWelcomeTab';

export { SimulatorsTab } from './SimulatorsTab';
export { FooterTab } from './FooterTab';
export { UserFinancialProfilesTab } from './UserFinancialProfilesTab';
export { GlobalSettingsTab } from './GlobalSettingsTab';
export { CelebrationSettingsTab } from './CelebrationSettingsTab';

export { BannerTab } from './BannerTab';
export { WebinarCompanyAssignment } from './WebinarCompanyAssignment';

// Shared
export { ColorPicker } from './ColorPicker';
export { IconSelector } from './IconSelector';
export { ImageUpload } from './ImageUpload';
export { ImageGalleryUploader } from './ImageGalleryUploader';
export { LandingPageEditor } from './LandingPageEditor';
export { LandingPagesTab } from './LandingPagesTab';

// Sidebar
export { AdminSidebar } from './AdminSidebar';
export { AdminSidebarConfigurationTab } from './AdminSidebarConfigurationTab';
