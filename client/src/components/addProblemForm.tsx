import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { InputVariable, TestCase, Problem, OutputType, VariableType } from '../types/problemTypes';
import { LANGUAGE_VERSIONS } from '../utils/common';

const VARIABLE_TYPES: VariableType[] = ['integer', 'float', 'string', 'boolean', 'object'];
const OUTPUT_TYPES: OutputType[] = [
  'integer', 'float', 'string', 'boolean', 'object',
  'integer[]', 'float[]', 'string[]', 'boolean[]', 'object[]',
  'integer[][]', 'float[][]', 'string[][]', 'boolean[][]', 'object[][]'
];

const getPlaceholderForType = (type: VariableType, isArray: boolean): string => {
  if (isArray) {
    switch (type) {
      case 'integer': return 'e.g., 1, 2, 3';
      case 'float': return 'e.g., 1.0, 2.5, 3.14';
      case 'string': return 'e.g., "apple", "banana", "cherry"';
      case 'boolean': return 'e.g., true, false, true';
      case 'object': return 'e.g., {"key": "value"}, {"id": 1}';
    }
  } else {
    switch (type) {
      case 'integer': return 'e.g., 42';
      case 'float': return 'e.g., 3.14';
      case 'string': return 'e.g., "hello"';
      case 'boolean': return 'e.g., true';
      case 'object': return 'e.g., {"key": "value"}';
    }
  }
  return '';
};

const getOutputPlaceholder = (outputType: OutputType): string => {
  if (outputType.includes('[][]')) {
    switch (outputType.replace('[][]', '')) {
      case 'integer': return 'e.g., 1,2;3,4';
      case 'float': return 'e.g., 1.0,2.5;3.14,4.0';
      case 'string': return 'e.g., "a","b";"c","d"';
      case 'boolean': return 'e.g., true,false;false,true';
      case 'object': return 'e.g., {"k":"v"},{"k":"v"};{"id":1},{"id":2}';
    }
  } else if (outputType.includes('[]')) {
    switch (outputType.replace('[]', '')) {
      case 'integer': return 'e.g., 1, 2, 3';
      case 'float': return 'e.g., 1.0, 2.5, 3.14';
      case 'string': return 'e.g., "apple", "banana", "cherry"';
      case 'boolean': return 'e.g., true, false, true';
      case 'object': return 'e.g., {"key": "value"}, {"id": 1}';
    }
  } else {
    switch (outputType) {
      case 'integer': return 'e.g., 42';
      case 'float': return 'e.g., 3.14';
      case 'string': return 'e.g., "hello"';
      case 'boolean': return 'e.g., true';
      case 'object': return 'e.g., {"key": "value"}';
    }
  }
  return '';
};

const AddProblemForm = () => {
  const [formData, setFormData] = useState<Partial<Problem>>({
    title: '',
    description: '',
    difficulty: 'Easy',
    tags: [],
    inputVariables: [{ name: '', type: 'integer', isArray: false }],
    testCases: [{ inputs: {}, expectedOutput: '', isSample: true }],
    supportedLanguages: ['javascript'],
    timeLimit: 3000,
    memoryLimit: -1,
    outputType: 'string'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFormData = (key: keyof Problem, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const cleanedTestCases = formData.testCases!.map((tc) => ({
      ...tc,
      inputs: Object.fromEntries(
        formData.inputVariables!.map((v) => [v.name, tc.inputs[v.name] || ''])
      ),
    }));
    updateFormData('testCases', cleanedTestCases);
  }, [formData.inputVariables]);

  const addInputVariable = () => updateFormData('inputVariables', [
    ...formData.inputVariables!, 
    { name: '', type: 'integer', isArray: false }
  ]);

  const removeInputVariable = (index: number) => {
    const variableName = formData.inputVariables![index].name;
    updateFormData('inputVariables', formData.inputVariables!.filter((_, i) => i !== index));
    updateFormData('testCases', formData.testCases!.map((tc) => {
      const newInputs = { ...tc.inputs };
      delete newInputs[variableName];
      return { ...tc, inputs: newInputs };
    }));
  };

  const addTestCase = () => {
    const inputs = Object.fromEntries(formData.inputVariables!.map((v) => [v.name, '']));
    updateFormData('testCases', [
      ...formData.testCases!, 
      { inputs, expectedOutput: '', isSample: true }
    ]);
  };

  const removeTestCase = (index: number) => {
    updateFormData('testCases', formData.testCases!.filter((_, i) => i !== index));
  };

  const validateForm = (): string | null => {
    if (!formData.title?.trim()) return 'Please enter a problem title';
    if (!formData.description?.trim()) return 'Please provide a description';
    if (formData.inputVariables?.some(v => !v.name.trim())) return 'All input variables need names';
    if (formData.testCases?.some(tc => !tc.expectedOutput.trim())) return 'All test cases need expected outputs';
    const varNames = formData.inputVariables?.map(v => v.name) || [];
    if (new Set(varNames).size !== varNames.length) return 'Variable names must be unique';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
  
    setIsSubmitting(true);
    try {
      const formattedTestCases = formData.testCases!.map(tc => ({
        ...tc,
        inputs: Object.fromEntries(
          Object.entries(tc.inputs).map(([key, value]) => [key, value])
        ),
        expectedOutput: tc.expectedOutput
      }));
  
      const boilerplates = formData.supportedLanguages!.map((lang) => ({
        language: lang,
        version: LANGUAGE_VERSIONS[lang as keyof typeof LANGUAGE_VERSIONS],
        code: '',
      }));
  
      await axios.post('http://localhost:5000/api/problems', { 
        ...formData,
        testCases: formattedTestCases,
        boilerplates 
      });
      
      alert('Problem created successfully!');
      setFormData({
        title: '',
        description: '',
        difficulty: 'Easy',
        tags: [],
        inputVariables: [{ name: '', type: 'integer', isArray: false }],
        testCases: [{ inputs: {}, expectedOutput: '', isSample: true }],
        supportedLanguages: ['javascript'],
        timeLimit: 3000,
        memoryLimit: -1,
        outputType: 'string'
      });
      setError(null);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setError('Failed to create problem: ' + (axiosError.response?.data?.message || axiosError.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="card bg-card text-card-foreground rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Create a New Coding Problem</h1>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Problem Title</label>
              <input
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter a descriptive title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty Level</label>
              <select
                value={formData.difficulty}
                onChange={(e) => updateFormData('difficulty', e.target.value)}
                className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
              placeholder="Explain the problem clearly (e.g., what should the solution do?)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              value={formData.tags!.join(', ')}
              onChange={(e) => updateFormData('tags', e.target.value.split(',').map(t => t.trim()))}
              className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Add tags (e.g., array, sorting, dp) separated by commas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Output Type</label>
            <select
              value={formData.outputType}
              onChange={(e) => updateFormData('outputType', e.target.value as OutputType)}
              className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {OUTPUT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Input Variables</h3>
              <button
                type="button"
                onClick={addInputVariable}
                className="btn bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg"
              >
                + Add Variable
              </button>
            </div>
            {formData.inputVariables!.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-center">
                <input
                  value={v.name}
                  onChange={(e) => {
                    const newVars = [...formData.inputVariables!];
                    newVars[i].name = e.target.value;
                    updateFormData('inputVariables', newVars);
                  }}
                  placeholder="e.g., nums"
                  className="col-span-4 p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <select
                  value={v.type}
                  onChange={(e) => {
                    const newVars = [...formData.inputVariables!];
                    newVars[i].type = e.target.value as VariableType;
                    updateFormData('inputVariables', newVars);
                  }}
                  className="col-span-3 p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {VARIABLE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <label className="col-span-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={v.isArray}
                    onChange={(e) => {
                      const newVars = [...formData.inputVariables!];
                      newVars[i].isArray = e.target.checked;
                      updateFormData('inputVariables', newVars);
                    }}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Array</span>
                </label>
                {formData.inputVariables!.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInputVariable(i)}
                    className="col-span-2 btn bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Test Cases</h3>
              <button
                type="button"
                onClick={addTestCase}
                className="btn bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg"
              >
                + Add Test Case
              </button>
            </div>
            {formData.testCases!.map((tc, i) => (
              <div key={i} className="card bg-muted/50 p-4 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Test Case {i + 1}</h4>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tc.isSample}
                        onChange={(e) => {
                          const newTCs = [...formData.testCases!];
                          newTCs[i].isSample = e.target.checked;
                          updateFormData('testCases', newTCs);
                        }}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Show as Sample</span>
                    </label>
                    {formData.testCases!.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(i)}
                        className="text-destructive hover:text-destructive/80 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {formData.inputVariables!.map((v) => (
                    <div key={v.name}>
                      <label className="block text-sm mb-1">
                        {v.name} ({v.type}{v.isArray ? '[]' : ''})
                        {v.isArray && <span className="text-xs ml-1">(comma-separated)</span>}
                      </label>
                      <input
                        value={tc.inputs[v.name] || ''}
                        onChange={(e) => {
                          const newTCs = [...formData.testCases!];
                          newTCs[i].inputs[v.name] = e.target.value;
                          updateFormData('testCases', newTCs);
                        }}
                        placeholder={getPlaceholderForType(v.type, v.isArray)}
                        className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm mb-1">
                      Expected Output
                      {formData.outputType?.includes('[]') && (
                        <span className="text-xs ml-1">
                          {formData.outputType.includes('[][]') ? '(semicolon-separated rows, comma-separated values)' : '(comma-separated)'}
                        </span>
                      )}
                    </label>
                    <input
                      value={tc.expectedOutput}
                      onChange={(e) => {
                        const newTCs = [...formData.testCases!];
                        newTCs[i].expectedOutput = e.target.value;
                        updateFormData('testCases', newTCs);
                      }}
                      placeholder={getOutputPlaceholder(formData.outputType!)}
                      className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Supported Languages</h3>
            <div className="flex flex-wrap gap-4">
              {['javascript', 'python', 'cpp'].map((lang) => (
                <label key={lang} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.supportedLanguages!.includes(lang)}
                    onChange={(e) => {
                      updateFormData('supportedLanguages', e.target.checked
                        ? [...formData.supportedLanguages!, lang]
                        : formData.supportedLanguages!.filter(l => l !== lang));
                    }}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm">
                    {lang} ({LANGUAGE_VERSIONS[lang as keyof typeof LANGUAGE_VERSIONS]})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Time Limit (ms)</label>
              <input
                type="number"
                value={formData.timeLimit}
                onChange={(e) => updateFormData('timeLimit', Number(e.target.value))}
                min="100"
                max="10000"
                className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Memory Limit (MB)</label>
              <input
                type="number"
                value={formData.memoryLimit}
                onChange={(e) => updateFormData('memoryLimit', Number(e.target.value))}
                min="-1"
                max="1024"
                className="w-full p-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">Set to -1 for no limit</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg text-primary-foreground font-medium transition-colors ${
              isSubmitting 
                ? 'bg-muted cursor-not-allowed' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Problem'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProblemForm;