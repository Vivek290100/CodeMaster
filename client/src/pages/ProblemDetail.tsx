import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { IProblem } from '../types';
import CodeEditor from '../components/CodeEditor';

const ProblemDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [problem, setProblem] = useState<IProblem | null>(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/problems/${slug}`);
                setProblem(res.data);
                setCode(res.data.boilerplates?.javascript || '');
            } catch (error) {
                console.error('Error fetching problem:', error);
            }
        };
        fetchProblem();
    }, [slug]);

    const handleRunCode = async () => {
        if (!problem) return;

        setIsLoading(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/problems/${slug}/run`, {
                code,
                language
            });
            setResults(res.data);
            setActiveTab('results');
        } catch (error) {
            console.error('Error running code:', error);
            setResults([{ error: 'Failed to execute code. Please check your syntax.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitSolution = () => {
        setIsSubmitting(true);
        // Mock submission success
        setTimeout(() => {
            setIsSubmitting(false);
            // Show success message
            alert('Solution submitted successfully!');
        }, 1500);
    };

    if (!problem) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <Link to="/" className="text-primary hover:underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Back to Problems
                    </Link>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Problem description panel */}
                    <div className="lg:w-1/2 bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                        <div className="border-b border-border">
                            <div className="flex">
                                <button 
                                    className={`px-4 py-3 font-medium ${activeTab === 'description' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                                    onClick={() => setActiveTab('description')}
                                >
                                    Description
                                </button>
                                <button 
                                    className={`px-4 py-3 font-medium ${activeTab === 'results' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                                    onClick={() => setActiveTab('results')}
                                >
                                    Results {results.length > 0 && `(${passedTests}/${totalTests})`}
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {activeTab === 'description' ? (
                                <>
                                    <div className="flex justify-between items-center mb-4">
                                        <h1 className="text-2xl font-bold text-card-foreground">{problem.title}</h1>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            problem.difficulty === 'Easy' 
                                                ? 'bg-green-100 text-green-800' 
                                                : problem.difficulty === 'Medium'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                        }`}>
                                            {problem.difficulty}
                                        </span>
                                    </div>
                                    
                                    <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: problem.description }} />
                                    
                                    <div className="mt-6 bg-muted rounded-lg p-4">
                                        <h3 className="font-semibold mb-3">Function Signature</h3>
                                        
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Parameters:</h4>
                                            <ul className="space-y-2">
                                                {problem.variables.inputs.map((input, idx) => (
                                                    <li key={idx} className="flex items-start">
                                                        <span className="text-primary font-mono mr-2">•</span>
                                                        <div>
                                                            <span className="font-mono text-sm">{input.name}</span>
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                {input.type}{input.subtype ? ` of ${input.subtype}` : ''}
                                                            </span>
                                                            {input.description && (
                                                                <p className="text-xs text-muted-foreground mt-1">{input.description}</p>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Returns:</h4>
                                            <div className="flex items-start">
                                                <span className="text-primary font-mono mr-2">•</span>
                                                <div>
                                                    <span className="font-mono text-sm">{problem.variables.output.name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {problem.variables.output.type}{problem.variables.output.subtype ? ` of ${problem.variables.output.subtype}` : ''}
                                                    </span>
                                                    {problem.variables.output.description && (
                                                        <p className="text-xs text-muted-foreground mt-1">{problem.variables.output.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xl font-semibold mb-4">Test Results</h2>
                                    
                                    {results.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                                                <div className="font-medium">{passedTests}/{totalTests} tests passed</div>
                                                {passedTests === totalTests ? (
                                                    <span className="text-green-600 font-medium flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        All tests passed!
                                                    </span>
                                                ) : (
                                                    <span className="text-destructive font-medium">
                                                        {totalTests - passedTests} failed
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {results.map((result, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`border rounded-lg overflow-hidden ${
                                                        result.error 
                                                            ? 'border-destructive' 
                                                            : result.passed 
                                                                ? 'border-green-600' 
                                                                : 'border-destructive'
                                                    }`}
                                                >
                                                    <div className={`px-4 py-3 flex justify-between items-center ${
                                                        result.error 
                                                            ? 'bg-destructive/10' 
                                                            : result.passed 
                                                                ? 'bg-green-600/10' 
                                                                : 'bg-destructive/10'
                                                    }`}>
                                                        <h3 className="font-medium">Test Case {idx + 1}</h3>
                                                        {result.error ? (
                                                            <span className="text-destructive">Error</span>
                                                        ) : (
                                                            <span className={result.passed ? 'text-green-600' : 'text-destructive'}>
                                                                {result.passed ? '✓ Passed' : '✗ Failed'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="p-4 bg-card text-sm space-y-3">
                                                        {result.error ? (
                                                            <div className="text-destructive font-mono whitespace-pre-wrap">{result.error}</div>
                                                        ) : (
                                                            <>
                                                                <div>
                                                                    <div className="font-medium mb-1">Input:</div>
                                                                    <pre className="bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(result.input, null, 2)}</pre>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium mb-1">Expected Output:</div>
                                                                    <pre className="bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(result.expectedOutput, null, 2)}</pre>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium mb-1">Your Output:</div>
                                                                    <pre className="bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(result.actualOutput, null, 2)}</pre>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <p>Click "Run Code" to see results</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Code editor panel */}
                    <div className="lg:w-1/2 bg-card rounded-lg shadow-sm border border-border overflow-hidden flex flex-col">
                        <div className="border-b border-border p-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <select 
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="bg-muted text-foreground border border-border rounded-md px-2 py-1 text-sm"
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                </select>
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={handleRunCode} 
                                    disabled={isLoading}
                                    className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors flex items-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                            Running...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Run Code
                                        </>
                                    )}
                                </button>
                                
                                <button 
                                    onClick={handleSubmitSolution}
                                    disabled={isSubmitting || results.length === 0 || results.some(r => !r.passed)}
                                    className={`px-3 py-1 rounded-md text-sm flex items-center ${
                                        results.length > 0 && results.every(r => r.passed)
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                                    } transition-colors`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Submit
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-grow">
                            <CodeEditor
                                value={code}
                                onChange={setCode}
                                language={language}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProblemDetail;