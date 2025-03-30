import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { Problem, ExecutionResult, OutputType, VariableType } from '../types/problemTypes';
import { LANGUAGE_VERSIONS } from '../utils/common';

const languageExtensions = { 
  javascript: javascript(), 
  python: python(), 
  cpp: cpp() 
};

const formatOutput = (output: string, outputType: OutputType) => {
  try {
    if (outputType.includes('[][]')) {
      const baseType = outputType.replace('[][]', '') as VariableType;
      const rows = output.split(';');
      return rows.map(row => `[${row.split(',').map(v => formatSingleValue(v.trim(), baseType)).join(', ')}]`).join(', ');
    } else if (outputType.includes('[]')) {
      const baseType = outputType.replace('[]', '') as VariableType;
      return `[${output.split(',').map(v => formatSingleValue(v.trim(), baseType)).join(', ')}]`;
    }
    return formatSingleValue(output, outputType as VariableType);
  } catch {
    return output;
  }
};

const formatSingleValue = (value: string, type: VariableType): string => {
  switch (type) {
    case 'integer': return value;
    case 'float': return value;
    case 'string': return `"${value.replace(/^"(.+)"$/, '$1')}"`;
    case 'boolean': return value.toLowerCase();
    case 'object': return value;
    default: return value;
  }
};

const ProblemPage = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axios.get<Problem[]>('http://localhost:5000/api/problems');
        setProblems(data);
        if (data.length) handleProblemSelect(data[0]);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        setError('Failed to load problems: ' + (axiosError.response?.data?.message || axiosError.message));
      }
    };
    fetchProblems();
  }, []);

  const handleProblemSelect = (problem: Problem) => {
    setSelectedProblem(problem);
    setResults([]);
    const boilerplate = problem.boilerplates.find(b => b.language === language)?.code || '';
    setCode(boilerplate);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (!selectedProblem) return;
    const boilerplate = selectedProblem.boilerplates.find(b => b.language === newLang)?.code || '';
    setCode(boilerplate);
  };

  const handleSubmit = async () => {
    if (!selectedProblem) return;
    setIsSubmitting(true);
    setResults([]);

    try {
      const { data } = await axios.post<{ results: ExecutionResult[]; allPassed: boolean }>(
        'http://localhost:5000/api/problems/execute',
        { 
          problemId: selectedProblem._id, 
          language, 
          version: LANGUAGE_VERSIONS[language as keyof typeof LANGUAGE_VERSIONS], 
          code
        }
      );

      setResults(data.results);
      alert(data.allPassed ? 'All tests passed!' : 'Some tests failed. Check the results.');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setError('Execution failed: ' + (axiosError.response?.data?.message || axiosError.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="card bg-card text-card-foreground rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Solve Coding Problems</h1>

        {error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 border border-destructive/20">
            {error}
          </div>
        ) : (
          <>
            <select
              className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent mb-6"
              value={selectedProblem?._id || ''}
              onChange={(e) => {
                const problem = problems.find(p => p._id === e.target.value);
                if (problem) handleProblemSelect(problem);
              }}
            >
              <option value="">Select a problem</option>
              {problems.map(p => (
                <option key={p._id} value={p._id}>
                  {p.title} ({p.difficulty})
                </option>
              ))}
            </select>

            {selectedProblem && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-3">{selectedProblem.title}</h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {selectedProblem.difficulty}
                      </span>
                      {selectedProblem.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="prose text-foreground">{selectedProblem.description}</div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Sample Test Cases</h3>
                    <div className="space-y-3">
                      {selectedProblem.testCases
                        .filter(tc => tc.isSample)
                        .map((tc, i) => (
                          <div key={i} className="p-4 bg-muted/50 rounded-lg border border-border">
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Inputs:</span>{' '}
                              {Object.entries(tc.inputs)
                                .map(([k, v]) => `${k}=${v}`)
                                .join(', ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Expected:</span>{' '}
                              {formatOutput(tc.expectedOutput, selectedProblem.outputType)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Choose Language</label>
                    <select
                      className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                    >
                      {selectedProblem.supportedLanguages.map(lang => (
                        <option key={lang} value={lang}>
                          {lang} ({LANGUAGE_VERSIONS[lang as keyof typeof LANGUAGE_VERSIONS]})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-lg overflow-hidden border border-border">
                    <CodeMirror
                      value={code}
                      extensions={[languageExtensions[language as keyof typeof languageExtensions]]}
                      onChange={setCode}
                      height="400px"
                      theme="dark"
                      className="bg-background"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-lg text-primary-foreground font-medium transition-colors ${
                      isSubmitting 
                        ? 'bg-muted cursor-not-allowed' 
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    {isSubmitting ? 'Running...' : 'Run Code'}
                  </button>
                </div>

                {results.length > 0 && (
                  <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Test Results</h3>
                        <button
                          onClick={() => setShowAllResults(!showAllResults)}
                          className="text-sm text-primary hover:underline"
                        >
                          {showAllResults ? 'Hide Hidden Tests' : 'Show All Tests'}
                        </button>
                      </div>
                      <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {(showAllResults ? results : results.filter(r => r.isSample))
                          .map((r, i) => (
                            <div 
                              key={i} 
                              className={`p-4 rounded-lg border ${
                                r.passed 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">
                                  Test {i + 1} {r.isSample ? '(Sample)' : '(Hidden)'}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  r.passed 
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' 
                                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                                }`}>
                                  {r.passed ? '✓ Passed' : '✗ Failed'}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>
                                  <span className="font-medium">Input:</span>{' '}
                                  {Object.entries(JSON.parse(r.input).inputs)
                                    .map(([k, v]) => `${k}=${v}`)
                                    .join(', ')}
                                </div>
                                <div>
                                  <span className="font-medium">Expected:</span>{' '}
                                  {formatOutput(r.expectedOutput, selectedProblem.outputType)}
                                </div>
                                <div>
                                  <span className="font-medium">Output:</span>{' '}
                                  {formatOutput(r.actualOutput, selectedProblem.outputType)}
                                </div>
                                {r.stderr && (
                                  <div className="text-destructive">{r.stderr}</div>
                                )}
                                {r.executionTime && (
                                  <div className="text-xs text-muted-foreground">
                                    Time: {r.executionTime}ms
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProblemPage;