import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage'; // ← this one is in src/
import Analyze from './pages/Analyze';
import Chat from './pages/Chat';
import Glossary from './pages/Glossary';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/glossary" element={<Glossary />} />
      </Routes>
    </Router>
  );
}

export default App;
