import React from 'react';
import { Link } from 'react-router-dom';
import ProblemForm from '../components/ProblemForm';

const AddProblem: React.FC = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-primary hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Problems
        </Link>
      </div>
      
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="border-b border-border p-6">
          <h1 className="text-2xl font-bold text-card-foreground">Create New Problem</h1>
          <p className="text-muted-foreground mt-1">Add a new coding challenge to the platform</p>
        </div>
        
        <div className="p-6">
          <ProblemForm />
        </div>
      </div>
    </div>
  </div>
);

export default AddProblem;