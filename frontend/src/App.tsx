import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { BatchResultProvider } from './context/BatchResultContext';
import { MainLayout } from './layouts/MainLayout';
import { AboutPage } from './pages/AboutPage';
import { CompressImagePage } from './pages/CompressImagePage';
import { CompressPdfPage } from './pages/CompressPdfPage';
import { ContactPage } from './pages/ContactPage';
import { DownloadPage } from './pages/DownloadPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PdfToWordPage } from './pages/PdfToWordPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { WordToPdfPage } from './pages/WordToPdfPage';

export function App() {
  return (
    <BatchResultProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pdf-to-word" element={<PdfToWordPage />} />
            <Route
              path="/pdf-to-word/download"
              element={<DownloadPage toolId="pdf-to-word" />}
            />
            <Route path="/word-to-pdf" element={<WordToPdfPage />} />
            <Route
              path="/word-to-pdf/download"
              element={<DownloadPage toolId="word-to-pdf" />}
            />
            <Route path="/compress-pdf" element={<CompressPdfPage />} />
            <Route
              path="/compress-pdf/download"
              element={<DownloadPage toolId="compress-pdf" />}
            />
            <Route path="/compress-image" element={<CompressImagePage />} />
            <Route
              path="/compress-image/download"
              element={<DownloadPage toolId="compress-image" />}
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BatchResultProvider>
  );
}

export default App;
