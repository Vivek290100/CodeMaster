// App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProblemList from './pages/ProblemList';
import AddProblem from './pages/AddProblem';
import ProblemDetail from './pages/ProblemDetail';

const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<ProblemList />} />
      <Route path="/add-problem" element={<AddProblem />} />
      <Route path="/problems/:slug" element={<ProblemDetail />} />
    </Routes>
  </Router>
);

export default App;