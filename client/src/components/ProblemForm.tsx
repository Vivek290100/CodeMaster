import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

// Define types for the form data
interface VariableInput {
  name: string;
  type: 'integer' | 'string' | 'array';
  subtype?: 'integer' | 'string' | '';
  description?: string;
}

interface VariableOutput {
  name: string;
  type: 'integer' | 'string' | 'array' | 'boolean';
  subtype?: 'integer' | 'string' | '';
  description?: string;
}

interface TestCase {
  input: Record<string, string>;
  output: string;
}

interface FormData {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  variables: {
    inputs: VariableInput[];
    output: VariableOutput;
  };
  testcases: TestCase[];
  boilerplates: {
    javascript: string;
    python?: string;
  };
}

const ProblemForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    difficulty: 'Easy',
    description: '',
    variables: {
      inputs: [{ name: '', type: 'integer', subtype: '', description: '' }],
      output: { name: 'result', type: 'integer', subtype: '', description: '' },
    },
    testcases: [{ input: {}, output: '' }],
    boilerplates: { 
      javascript: '',
      python: '',
    },
  });
  const [activeTab, setActiveTab] = useState<'javascript' | 'python'>('javascript');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const processedTestcases = formData.testcases.map(tc => {
        const processedInput: Record<string, any> = {};
        formData.variables.inputs.forEach(input => {
          const value = tc.input[input.name];
          if (value !== undefined && value !== '') {
            switch (input.type) {
              case 'integer':
                processedInput[input.name] = parseInt(value);
                break;
              case 'string':
                processedInput[input.name] = value;
                break;
              case 'array':
                try {
                  let arr: any[];
                  if (value.startsWith('[') && value.endsWith(']')) {
                    arr = JSON.parse(value);
                  } else {
                    arr = value.split(',').map(v => v.trim());
                  }
                  if (input.subtype === 'integer') {
                    arr = arr.map((v: string) => parseInt(v));
                  }
                  processedInput[input.name] = arr;
                } catch (error) {
                  console.error('Error parsing array input:', error);
                  processedInput[input.name] = value;
                }
                break;
            }
          }
        });
        
        const outputValue = tc.output;
        let processedOutput: any = outputValue;
        if (outputValue !== '' && outputValue !== undefined) {
          switch (formData.variables.output.type) {
            case 'integer':
              processedOutput = parseInt(outputValue);
              break;
            case 'string':
              processedOutput = outputValue;
              break;
            case 'array':
              try {
                let arr: any[];
                if (outputValue.startsWith('[') && outputValue.endsWith(']')) {
                  arr = JSON.parse(outputValue);
                } else {
                  arr = outputValue.split(',').map(v => v.trim());
                }
                if (formData.variables.output.subtype === 'integer') {
                  arr = arr.map((v: string) => parseInt(v));
                }
                processedOutput = arr;
              } catch (error) {
                console.error('Error parsing array output:', error);
                processedOutput = outputValue;
              }
              break;
            case 'boolean':
              processedOutput = outputValue.toLowerCase() === 'true';
              break;
          }
        }
        return { input: processedInput, output: processedOutput };
      });

      const processedFormData = {
        ...formData,
        testcases: processedTestcases,
        slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      };

      await axios.post('http://localhost:5000/api/problems', processedFormData);
      navigate('/');
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error && 'response' in error)
        ? (error as any).response?.data?.message || error.message
        : 'Unknown error';
      alert('Error: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (idx: number, field: keyof VariableInput, value: string) => {
    const newInputs = [...formData.variables.inputs];
    
    if (field === 'type') {
      newInputs[idx].type = value as 'integer' | 'string' | 'array';
      if (value !== 'array') newInputs[idx].subtype = '';
    } else if (field === 'subtype') {
      newInputs[idx].subtype = value as 'integer' | 'string' | '';
    } else {
      newInputs[idx][field] = value;
    }
    
    setFormData({
      ...formData,
      variables: { ...formData.variables, inputs: newInputs }
    });
    
    if (field === 'name' && newInputs[idx].name !== value) {
      const oldName = newInputs[idx].name;
      const newTestcases = formData.testcases.map(tc => {
        const newInput = { ...tc.input };
        delete newInput[oldName];
        return { ...tc, input: newInput };
      });
      setFormData(prev => ({
        ...prev,
        testcases: newTestcases
      }));
    }
  };

  const removeInput = (idx: number) => {
    const inputName = formData.variables.inputs[idx].name;
    const newInputs = formData.variables.inputs.filter((_, i) => i !== idx);
    
    const newTestcases = formData.testcases.map(tc => {
      const newInput = { ...tc.input };
      delete newInput[inputName];
      return { ...tc, input: newInput };
    });
    
    setFormData({
      ...formData,
      variables: { ...formData.variables, inputs: newInputs },
      testcases: newTestcases
    });
  };

  const removeTestCase = (idx: number) => {
    setFormData({
      ...formData,
      testcases: formData.testcases.filter((_, i) => i !== idx)
    });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testcases: [...formData.testcases, { input: {}, output: '' }]
    });
  };

  const handleTestCaseChange = (tcIdx: number, field: 'input' | 'output', name: string | null, value: string) => {
    const newTestcases = [...formData.testcases];
    if (field === 'input' && name) {
      newTestcases[tcIdx].input[name] = value;
    } else if (field === 'output') {
      newTestcases[tcIdx].output = value;
    }
    setFormData({ ...formData, testcases: newTestcases });
  };

  const handleBoilerplateChange = (language: 'javascript' | 'python', value: string) => {
    setFormData({
      ...formData,
      boilerplates: { ...formData.boilerplates, [language]: value }
    });
  };

  const handleOutputChange = (field: keyof VariableOutput, value: string) => {
    const newOutput = { ...formData.variables.output };
    if (field === 'type') {
      newOutput.type = value as 'integer' | 'string' | 'array' | 'boolean';
      if (value !== 'array') newOutput.subtype = '';
    } else if (field === 'subtype') {
      newOutput.subtype = value as 'integer' | 'string' | '';
    } else {
      newOutput[field] = value;
    }
    setFormData({
      ...formData,
      variables: { ...formData.variables, output: newOutput }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* <div className="flex items-center mb-8">
          <Link to="/" className="text-primary hover:underline mr-4">
            ← Back to Problems
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create New Problem</h1>
        </div> */}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-card shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Problem Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Problem Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Sum of Two Numbers"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({
                    ...formData,
                    difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
                  })}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Problem Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Describe the problem using Markdown. You can include example usage and explanations..."
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can use Markdown formatting for the description (headers, code blocks, lists, etc.).
                </p>
              </div>
            </div>
          </div>

          {/* Variables */}
          <div className="bg-card shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Function Parameters & Return Value</h2>
            <h3 className="text-lg font-medium mb-3">Input Parameters</h3>
            {formData.variables.inputs.map((input, idx) => (
              <div key={idx} className="mb-4 p-4 border border-border rounded-md bg-background">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Parameter Name
                    </label>
                    <input
                      value={input.name}
                      onChange={(e) => handleInputChange(idx, 'name', e.target.value)}
                      placeholder="e.g., num1"
                      required
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Data Type
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={input.type}
                        onChange={(e) => handleInputChange(idx, 'type', e.target.value)}
                        className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="integer">Integer</option>
                        <option value="string">String</option>
                        <option value="array">Array</option>
                      </select>
                      {input.type === 'array' && (
                        <select
                          value={input.subtype || ''}
                          onChange={(e) => handleInputChange(idx, 'subtype', e.target.value)}
                          className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select array type</option>
                          <option value="integer">Array of Integers</option>
                          <option value="string">Array of Strings</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <input
                    value={input.description || ''}
                    onChange={(e) => handleInputChange(idx, 'description', e.target.value)}
                    placeholder="Optional description of this parameter"
                    className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary mr-2"
                  />
                  {formData.variables.inputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInput(idx)}
                      className="px-3 py-2 text-destructive-foreground bg-destructive rounded-md hover:bg-destructive/90"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                variables: {
                  ...formData.variables,
                  inputs: [
                    ...formData.variables.inputs,
                    { name: '', type: 'integer', subtype: '', description: '' },
                  ],
                },
              })}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 mb-8"
            >
              Add Input Parameter
            </button>
            
            <h3 className="text-lg font-medium mb-3">Return Value</h3>
            <div className="p-4 border border-border rounded-md bg-background">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Return Value Name
                  </label>
                  <input
                    value={formData.variables.output.name}
                    onChange={(e) => handleOutputChange('name', e.target.value)}
                    placeholder="e.g., result"
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">
                    Data Type
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.variables.output.type}
                      onChange={(e) => handleOutputChange('type', e.target.value)}
                      className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="integer">Integer</option>
                      <option value="string">String</option>
                      <option value="array">Array</option>
                      <option value="boolean">Boolean</option>
                    </select>
                    {formData.variables.output.type === 'array' && (
                      <select
                        value={formData.variables.output.subtype || ''}
                        onChange={(e) => handleOutputChange('subtype', e.target.value)}
                        className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select array type</option>
                        <option value="integer">Array of Integers</option>
                        <option value="string">Array of Strings</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <input
                  value={formData.variables.output.description || ''}
                  onChange={(e) => handleOutputChange('description', e.target.value)}
                  placeholder="Optional description of return value"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div className="bg-card shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Test Cases</h2>
            {formData.testcases.map((tc, tcIdx) => (
              <div key={tcIdx} className="mb-4 p-4 border border-border rounded-md bg-background">
                <h3 className="text-md font-medium mb-3">Test Case {tcIdx + 1}</h3>
                <div className="grid grid-cols-1 gap-4">
                  {formData.variables.inputs.map((input, inputIdx) => (
                    <div key={inputIdx}>
                      <label className="block text-sm font-medium text-card-foreground mb-1">
                        {input.name} ({input.type}{input.subtype ? ` of ${input.subtype}` : ''})
                      </label>
                      <input
                        value={tc.input[input.name] || ''}
                        onChange={(e) => handleTestCaseChange(tcIdx, 'input', input.name, e.target.value)}
                        placeholder={input.type === 'array' ? '[1, 2, 3] or 1, 2, 3' : input.type === 'integer' ? '123' : 'text'}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Output ({formData.variables.output.type}{formData.variables.output.subtype ? ` of ${formData.variables.output.subtype}` : ''})
                    </label>
                    <input
                      value={tc.output}
                      onChange={(e) => handleTestCaseChange(tcIdx, 'output', null, e.target.value)}
                      placeholder={
                        formData.variables.output.type === 'array' ? '[1, 2, 3] or 1, 2, 3' :
                        formData.variables.output.type === 'integer' ? '123' :
                        formData.variables.output.type === 'boolean' ? 'true or false' : 'text'
                      }
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                {formData.testcases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(tcIdx)}
                    className="mt-4 px-3 py-2 text-destructive-foreground bg-destructive rounded-md hover:bg-destructive/90"
                  >
                    Remove Test Case
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTestCase}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80"
            >
              Add Test Case
            </button>
          </div>

          {/* Boilerplates */}
          <div className="bg-card shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Boilerplate Code</h2>
            <div className="flex mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('javascript')}
                className={`px-4 py-2 rounded-t-md ${activeTab === 'javascript' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                JavaScript
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('python')}
                className={`px-4 py-2 rounded-t-md ${activeTab === 'python' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                Python
              </button>
            </div>
            {activeTab === 'javascript' ? (
              <textarea
                value={formData.boilerplates.javascript}
                onChange={(e) => handleBoilerplateChange('javascript', e.target.value)}
                placeholder="function solution(num1, num2) { ... }"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-32 font-mono"
              />
            ) : (
              <textarea
                value={formData.boilerplates.python || ''}
                onChange={(e) => handleBoilerplateChange('python', e.target.value)}
                placeholder="def solution(num1, num2): ..."
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-32 font-mono"
              />
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:bg-primary/50"
            >
              {isSubmitting ? 'Submitting...' : 'Create Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProblemForm;