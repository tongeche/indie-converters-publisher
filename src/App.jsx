import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Browse from './pages/Browse';
import BookDetail from './pages/BookDetail';
import AuthorProfile from './pages/AuthorProfile';
import Authors from './pages/Authors';
import Moods from './pages/Moods';
import Blog from './pages/News';
import Publish from './pages/Publish';
import UploadWizard from './pages/UploadWizard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import EditBook from './pages/EditBook';
import BlogPost from './pages/BlogPost';
import Hire from './pages/Hire';
import PostBrief from './pages/PostBrief';
import HireBrowse from './pages/HireBrowse';
import GetHired from './pages/GetHired';
import GetHiredProfile from './pages/GetHiredProfile';
import GetHiredProjects from './pages/GetHiredProjects';
import HelpCenter from './pages/HelpCenter';
import SavedBooks from './pages/SavedBooks';
import ComingSoon from './pages/ComingSoon';
import CheckVerify from './pages/CheckVerify';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <Routes>
          <Route path="/"           element={<Landing />}      />
          <Route path="/browse"     element={<Browse />}       />
          <Route path="/book/:id"   element={<BookDetail />}   />
          <Route path="/author/:id" element={<AuthorProfile />} />
          <Route path="/authors"    element={<Authors />}      />
          <Route path="/moods"      element={<Moods />}        />
          <Route path="/blog"       element={<Blog />}         />
          <Route path="/blog/:slug" element={<BlogPost />}     />
          {/* legacy redirects */}
          <Route path="/news"       element={<Blog />}         />
          <Route path="/news/:slug" element={<BlogPost />}     />
          <Route path="/publish"    element={<Publish />}      />
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
          <Route path="/check"               element={<CheckVerify />} />
          <Route path="/hire"                element={<Hire />}        />
          <Route path="/hire/post"           element={<PostBrief />}   />
          <Route path="/hire/browse"         element={<HireBrowse />}  />
          <Route path="/hire/*"              element={<ComingSoon />}  />
          <Route path="/get-hired"           element={<GetHired />}    />
          <Route path="/get-hired/profile"   element={
            <ProtectedRoute><GetHiredProfile /></ProtectedRoute>
          } />
          <Route path="/get-hired/projects"  element={
            <ProtectedRoute><GetHiredProjects /></ProtectedRoute>
          } />
          <Route path="/get-hired/*"         element={<ComingSoon />}  />
          <Route path="/help"                element={<HelpCenter />}  />
          <Route path="/help/*"              element={<ComingSoon />}  />
          <Route path="*"                    element={<Browse />}      />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
