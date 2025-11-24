import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Partners from "./Partners";

import Projects from "./Projects";

import PartnerDetail from "./PartnerDetail";

import Competencies from "./Competencies";

import Certifications from "./Certifications";

import Pricing from "./Pricing";

import Bonuses from "./Bonuses";

import Analytics from "./Analytics";

import Marketplace from "./Marketplace";

import Tenders from "./Tenders";

import ProjectDetail from "./ProjectDetail";

import TenderDetail from "./TenderDetail";

import CreateProject from "./CreateProject";

import CreatePartner from "./CreatePartner";

import EditPartner from "./EditPartner";

import DropdownManager from "./DropdownManager";

import CreateTender from "./CreateTender";

import ProductGroupDiscountManager from "./ProductGroupDiscountManager";

import ProjectExtraDiscountManager from "./ProjectExtraDiscountManager";

import TierSettings from "./TierSettings";

import TrainingManager from "./TrainingManager";

import AssignProject from "./AssignProject";

import EditTender from "./EditTender";

import PartnerTraining from "./PartnerTraining";

import QualificationsView from "./QualificationsView";

import QualificationsManager from "./QualificationsManager";

import AchievementsView from "./AchievementsView";

import AchievementsManager from "./AchievementsManager";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Partners: Partners,
    
    Projects: Projects,
    
    PartnerDetail: PartnerDetail,
    
    Competencies: Competencies,
    
    Certifications: Certifications,
    
    Pricing: Pricing,
    
    Bonuses: Bonuses,
    
    Analytics: Analytics,
    
    Marketplace: Marketplace,
    
    Tenders: Tenders,
    
    ProjectDetail: ProjectDetail,
    
    TenderDetail: TenderDetail,
    
    CreateProject: CreateProject,
    
    CreatePartner: CreatePartner,
    
    EditPartner: EditPartner,
    
    DropdownManager: DropdownManager,
    
    CreateTender: CreateTender,
    
    ProductGroupDiscountManager: ProductGroupDiscountManager,
    
    ProjectExtraDiscountManager: ProjectExtraDiscountManager,
    
    TierSettings: TierSettings,
    
    TrainingManager: TrainingManager,
    
    AssignProject: AssignProject,
    
    EditTender: EditTender,
    
    PartnerTraining: PartnerTraining,
    
    QualificationsView: QualificationsView,
    
    QualificationsManager: QualificationsManager,
    
    AchievementsView: AchievementsView,
    
    AchievementsManager: AchievementsManager,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Partners" element={<Partners />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/PartnerDetail" element={<PartnerDetail />} />
                
                <Route path="/Competencies" element={<Competencies />} />
                
                <Route path="/Certifications" element={<Certifications />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/Bonuses" element={<Bonuses />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Marketplace" element={<Marketplace />} />
                
                <Route path="/Tenders" element={<Tenders />} />
                
                <Route path="/ProjectDetail" element={<ProjectDetail />} />
                
                <Route path="/TenderDetail" element={<TenderDetail />} />
                
                <Route path="/CreateProject" element={<CreateProject />} />
                
                <Route path="/CreatePartner" element={<CreatePartner />} />
                
                <Route path="/EditPartner" element={<EditPartner />} />
                
                <Route path="/DropdownManager" element={<DropdownManager />} />
                
                <Route path="/CreateTender" element={<CreateTender />} />
                
                <Route path="/ProductGroupDiscountManager" element={<ProductGroupDiscountManager />} />
                
                <Route path="/ProjectExtraDiscountManager" element={<ProjectExtraDiscountManager />} />
                
                <Route path="/TierSettings" element={<TierSettings />} />
                
                <Route path="/TrainingManager" element={<TrainingManager />} />
                
                <Route path="/AssignProject" element={<AssignProject />} />
                
                <Route path="/EditTender" element={<EditTender />} />
                
                <Route path="/PartnerTraining" element={<PartnerTraining />} />
                
                <Route path="/QualificationsView" element={<QualificationsView />} />
                
                <Route path="/QualificationsManager" element={<QualificationsManager />} />
                
                <Route path="/AchievementsView" element={<AchievementsView />} />
                
                <Route path="/AchievementsManager" element={<AchievementsManager />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}