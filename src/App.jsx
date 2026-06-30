import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Browse from './pages/Browse';
import BookDetail from './pages/BookDetail';
import AuthorProfile from './pages/AuthorProfile';
import Authors from './pages/Authors';
import Moods from './pages/Moods';
import News from './pages/News';
import Publish from './pages/Publish';
import UploadWizard from './pages/UploadWizard';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/"          element={<Landing />}      />
        <Route path="/browse"    element={<Browse />}       />
        <Route path="/book/:id"  element={<BookDetail />}   />
        <Route path="/author/:id" element={<AuthorProfile />} />
        <Route path="/authors"   element={<Authors />}      />
        <Route path="/moods"     element={<Moods />}        />
        <Route path="/news"      element={<News />}         />
        <Route path="/publish"   element={<Publish />}      />
        <Route path="/upload"    element={<UploadWizard />} />
        <Route path="*"          element={<Browse />}       />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
