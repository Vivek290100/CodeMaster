// ProblemList.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { IProblem } from '../types';

const ProblemList: React.FC = () => {
  const [problems, setProblems] = useState<IProblem[]>([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/problems').then(res => setProblems(res.data));
  }, []);

  return (
    <div>
      <h1>Problems</h1>
      <ul>
        {problems.map(p => (
          <li key={p.slug}>
            <Link to={`/problems/${p.slug}`}>{p.title} ({p.difficulty})</Link>
          </li>
        ))}
      </ul>
      <Link to="/add-problem">Add Problem</Link>
    </div>
  );
};

export default ProblemList;