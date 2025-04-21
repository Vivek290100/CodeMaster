import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { IProblem } from '../types';

const ProblemList: React.FC = () => {
  const [problems, setProblems] = useState<IProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios
      .get('http://localhost:5000/api/problems')
      .then((res) => {
        setProblems(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching problems:', err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Coding Problems</h1>
          <p className="text-muted-foreground mt-2">Sharpen your coding skills with these challenges...</p>
        </header>

        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            {/* <button className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80">All</button>
            <button className="px-4 py-2 text-muted-foreground rounded-lg hover:bg-muted">Easy</button>
            <button className="px-4 py-2 text-muted-foreground rounded-lg hover:bg-muted">Medium</button>
            <button className="px-4 py-2 text-muted-foreground rounded-lg hover:bg-muted">Hard</button> */}
          </div>
          <Link
            to="/add-problem"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Problem
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : problems.length === 0 ? (
          <div className="bg-card rounded-lg p-8 text-center">
            <p className="text-lg text-card-foreground">No problems found. Add your first problem!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {problems.map((problem) => (
              <Link
                key={problem.slug}
                to={`/problems/${problem.slug}`}
                className="bg-card hover:bg-card/90 border border-border rounded-lg p-6 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-card-foreground">{problem.title}</h2>
                    <p className="mt-2 text-muted-foreground line-clamp-2">
                      {(problem.description || '')
                        .replace(/<[^>]*>?/gm, '')
                        .substring(0, 120) || 'No description available'}...
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      problem.difficulty === 'Easy'
                        ? 'bg-green-100 text-green-800'
                        : problem.difficulty === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemList;