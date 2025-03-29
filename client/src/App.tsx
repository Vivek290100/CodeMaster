import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import ProblemPage from './components/problemPage';
import AddProblemForm from './components/addProblemForm';

function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const toggleTheme = () => {
    setIsDark(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newTheme);
      return newTheme;
    });
  };

  return (
    <Router>
      <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <nav className="bg-card shadow-lg sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
                    <span className="text-2xl">💻</span> CodeMaster
                  </Link>
                  <div className="hidden sm:flex gap-6">
                    <Link 
                      to="/" 
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span>📋</span> Problems
                    </Link>
                    <Link 
                      to="/add" 
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span>➕</span> Add Problem
                    </Link>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-muted transition-all duration-200"
                  title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<ProblemPage  />} />
              <Route path="/add" element={<AddProblemForm />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;