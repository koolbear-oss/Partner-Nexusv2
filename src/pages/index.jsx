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