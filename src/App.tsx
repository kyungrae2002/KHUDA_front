import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UploadPage from './pages/UploadPage';
import ChatPage from './pages/ChatPage';
import PlanPage from './pages/PlanPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"       element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/chat"   element={<ChatPage />} />
        <Route path="/plan"   element={<PlanPage />} />
      </Routes>
    </Router>
  );
}

export default App;
