// pages/ProblemDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
        } catch (error) {
            console.error('Error running code:', error);
            setResults([{ error: 'Failed to execute code. Please check your syntax.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!problem) return <div>Loading...</div>;

    return (
        <div>
            <h1>{problem.title}</h1>
            <p>Difficulty: {problem.difficulty}</p>
            <div dangerouslySetInnerHTML={{ __html: problem.description }} />

            <h2>Inputs</h2>
            <ul>
                {problem.variables.inputs.map((input, idx) => (
                    <li key={idx}>
                        <strong>{input.name}</strong>: {input.type}
                        {input.subtype && ` (${input.subtype})`}
                    </li>
                ))}
            </ul>

            <h2>Output</h2>
            <p>
                <strong>{problem.variables.output.name}</strong>: {problem.variables.output.type}
            </p>

            <h2>Code Editor</h2>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
            </select>

            <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
            />

            <button onClick={handleRunCode} disabled={isLoading}>
                {isLoading ? 'Running...' : 'Run Code'}
            </button>

            <h2>Results</h2>
            {results.length > 0 ? results.map((result, idx) => (
                <div key={idx}>
                    <h3>Test Case {idx + 1}</h3>
                    {result.error ? (
                        <p style={{ color: 'red' }}>Error: {result.error}</p>
                    ) : (
                        <>
                            <p>Input: {JSON.stringify(result.input, null, 2)}</p>
                            <p>Expected Output: {JSON.stringify(result.expectedOutput, null, 2)}</p>
                            <p>Actual Output: {JSON.stringify(result.actualOutput, null, 2)}</p>
                            <p>Passed: {result.passed ? '✅' : '❌'}</p>
                        </>
                    )}
                </div>
            )) : (
                <p>Click "Run Code" to see results</p>
            )}
        </div>
    );
};

export default ProblemDetail;