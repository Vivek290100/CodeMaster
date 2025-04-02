import React, { useState } from 'react';
import axios from 'axios';

// Define types for the form data
interface VariableInput {
  name: string;
  type: 'integer' | 'string' | 'array';
  subtype?: 'integer' | 'string' | '';
  description?: string;
}

interface VariableOutput {
  name: string;
  type: 'integer' | 'string' | 'array';
  subtype?: 'integer' | 'string' | '';
  description?: string;
}

interface TestCase {
  input: Record<string, string>; // Input values as strings (parsed later if needed)
  output: string; // Output as string (parsed later if needed)
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
  };
}

const ProblemForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    difficulty: 'Easy',
    description: '',
    variables: {
      inputs: [{ name: '', type: 'integer', subtype: '', description: '' }],
      output: { name: 'result', type: 'integer', subtype: '', description: '' },
    },
    testcases: [{ input: {}, output: '' }],
    boilerplates: { javascript: '' },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("formData",formData);
    
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-');
    console.log("slug",slug);
    
    try {
      await axios.post('http://localhost:5000/api/problems', { ...formData, slug });
      alert('Problem added!');
    } catch (error: unknown) {
      // Type assertion for error handling
      const errorMessage = (error instanceof Error && 'response' in error)
        ? (error as any).response?.data?.message || error.message
        : 'Unknown error';
      alert('Error: ' + errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Title:{' '}
        <input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </label>
      <label>
        Difficulty:
        <select
          value={formData.difficulty}
          onChange={(e) =>
            setFormData({
              ...formData,
              difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
            })
          }
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </label>
      <label>
        Description:{' '}
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </label>
      <h3>Inputs</h3>
      {formData.variables.inputs.map((input, idx) => (
        <div key={idx}>
          <input
            value={input.name}
            onChange={(e) => {
              const newInputs = [...formData.variables.inputs];
              newInputs[idx].name = e.target.value;
              setFormData({
                ...formData,
                variables: { ...formData.variables, inputs: newInputs },
              });
            }}
          />
          <select
            value={input.type}
            onChange={(e) => {
              const newInputs = [...formData.variables.inputs];
              newInputs[idx].type = e.target.value as 'integer' | 'string' | 'array';
              setFormData({
                ...formData,
                variables: { ...formData.variables, inputs: newInputs },
              });
            }}
          >
            <option value="integer">Integer</option>
            <option value="string">String</option>
            <option value="array">Array</option>
          </select>
          {input.type === 'array' && (
            <select
              value={input.subtype || ''}
              onChange={(e) => {
                const newInputs = [...formData.variables.inputs];
                newInputs[idx].subtype = e.target.value as 'integer' | 'string' | '';
                setFormData({
                  ...formData,
                  variables: { ...formData.variables, inputs: newInputs },
                });
              }}
            >
              <option value="">Select subtype</option>
              <option value="integer">Integer</option>
              <option value="string">String</option>
            </select>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setFormData({
            ...formData,
            variables: {
              ...formData.variables,
              inputs: [
                ...formData.variables.inputs,
                { name: '', type: 'integer', subtype: '', description: '' },
              ],
            },
          })
        }
      >
        Add Input
      </button>
      <h3>Test Cases</h3>
      {formData.testcases.map((tc, idx) => (
        <div key={idx}>
          {formData.variables.inputs.map((input) => (
            <input
              key={input.name}
              value={tc.input[input.name] || ''}
              onChange={(e) => {
                const newTestcases = [...formData.testcases];
                newTestcases[idx].input = {
                  ...newTestcases[idx].input,
                  [input.name]: e.target.value,
                };
                setFormData({ ...formData, testcases: newTestcases });
              }}
            />
          ))}
          <input
            value={tc.output}
            onChange={(e) => {
              const newTestcases = [...formData.testcases];
              newTestcases[idx].output = e.target.value;
              setFormData({ ...formData, testcases: newTestcases });
            }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setFormData({
            ...formData,
            testcases: [...formData.testcases, { input: {}, output: '' }],
          })
        }
      >
        Add Test Case
      </button>
      <label>
        JavaScript Boilerplate:{' '}
        <textarea
          value={formData.boilerplates.javascript}
          onChange={(e) =>
            setFormData({
              ...formData,
              boilerplates: { ...formData.boilerplates, javascript: e.target.value },
            })
          }
        />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
};

export default ProblemForm;