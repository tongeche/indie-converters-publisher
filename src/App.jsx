import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Browse from './pages/Browse';
import BookDetail from './pages/BookDetail';
import AuthorProfile from './pages/AuthorProfile';
import Moods from './pages/Moods';
import Blog from './pages/News';
import Publish from './pages/Publish';
import PublishTemplates from './pages/PublishTemplates';
import UploadWizard from './pages/UploadWizard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import EditBook from './pages/EditBook';
import BlogPost from './pages/BlogPost';
import Hire from './pages/Hire';
import PostBrief from './pages/PostBrief';
import HireBrowse from './pages/HireBrowse';
import FreelancerProfile from './pages/FreelancerProfile';
import GetHired from './pages/GetHired';
import GetHiredProfile from './pages/GetHiredProfile';
import GetHiredProjects from './pages/GetHiredProjects';
import BriefDetail from './pages/BriefDetail';
import HelpCenter from './pages/HelpCenter';
import HelpCategory from './pages/HelpCategory';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SavedBooks from './pages/SavedBooks';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import ComingSoon from './pages/ComingSoon';
import CheckVerify from './pages/CheckVerify';
import PrintCoverCalculator from './pages/PrintCoverCalculator';
import RevenueCalculatorPage from './pages/RevenueCalculatorPage';

// The persistent page rails are a Landing-page-only visual accent — everywhere
// else (dashboard, wizard, checkout, etc.) they cut across app chrome that was
// never designed around them.
function PageRails() {
  const location = useLocation();
  if (location.pathname !== '/') return null;
  return <div className="page-rails" aria-hidden="true" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageRails />
        <Nav />
        <Routes>
          <Route path="/"           element={<Landing />}      />
          <Route path="/browse"     element={<Browse />}       />
          <Route path="/shop"       element={<Shop />}         />
          <Route path="/book/:id"   element={<BookDetail />}   />
          <Route path="/author/:id" element={<AuthorProfile />} />
          <Route path="/moods"      element={<Moods />}        />
          <Route path="/blog"       element={<Blog />}         />
          <Route path="/blog/:slug" element={<BlogPost />}     />
          {/* legacy redirects */}
          <Route path="/news"       element={<Blog />}         />
          <Route path="/news/:slug" element={<BlogPost />}     />
          <Route path="/publish"    element={<Publish />}      />
          <Route path="/publish/templates" element={<PublishTemplates />} />
          <Route path="/login"      element={<Login />}        />
          <Route path="/signup"     element={<Signup />}       />
          <Route path="/upload"     element={
            <ProtectedRoute><UploadWizard /></ProtectedRoute>
          } />
          <Route path="/dashboard"  element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/edit/:slug" element={
            <ProtectedRoute><EditBook /></ProtectedRoute>
          } />
          <Route path="/saved" element={
            <ProtectedRoute><SavedBooks /></ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute><Cart /></ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute><Checkout /></ProtectedRoute>
          } />
          <Route path="/order/:id" element={
            <ProtectedRoute><OrderConfirmation /></ProtectedRoute>
          } />
          <Route path="/check"               element={<CheckVerify />} />
          <Route path="/tools/print-cover-calculator" element={<PrintCoverCalculator />} />
          <Route path="/tools/revenue-calculator" element={<RevenueCalculatorPage />} />
          <Route path="/hire"                element={<Hire />}        />
          <Route path="/hire/post"           element={<PostBrief />}   />
          <Route path="/hire/browse"         element={<HireBrowse />}  />
          <Route path="/hire/freelancer/:id" element={<FreelancerProfile />} />
          <Route path="/hire/*"              element={<ComingSoon />}  />
          <Route path="/get-hired"           element={<GetHired />}    />
          <Route path="/get-hired/profile"   element={
            <ProtectedRoute><GetHiredProfile /></ProtectedRoute>
          } />
          <Route path="/get-hired/projects"  element={
            <ProtectedRoute><GetHiredProjects /></ProtectedRoute>
          } />
          <Route path="/get-hired/projects/:id" element={
            <ProtectedRoute><BriefDetail /></ProtectedRoute>
          } />
          <Route path="/get-hired/*"         element={<ComingSoon />}  />
          <Route path="/help"                element={<HelpCenter />}  />
          <Route path="/help/:slug"          element={<HelpCategory />} />
          <Route path="/help/*"              element={<ComingSoon />}  />
          <Route path="/privacy"             element={<PrivacyPolicy />} />
          <Route path="/terms"               element={<TermsOfService />} />
          <Route path="*"                    element={<Browse />}      />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
