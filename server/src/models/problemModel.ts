// server/src/models/problemModel.ts
import mongoose, { Schema } from 'mongoose';
import { IProblemDocument, OutputType } from '../types/problemTypes';

const testCaseSchema = new Schema({
  inputs: { type: Schema.Types.Mixed, required: true },
  expectedOutput: { type: String, required: true },
  isSample: { type: Boolean, default: true },
}, { _id: false });

const inputVariableSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    validate: /^[a-zA-Z_][a-zA-Z0-9_]*$/
  },
  type: { 
    type: String, 
    enum: ['integer', 'float', 'string', 'boolean', 'object'],
    required: true 
  },
  isArray: { type: Boolean, default: false },
}, { _id: false });

const boilerplateSchema = new Schema({
  language: { type: String, required: true, enum: ['javascript', 'python', 'cpp'] },
  version: { type: String, required: true },
  code: { type: String, required: true },
}, { _id: false });

const problemSchema = new Schema<IProblemDocument>({
  title: { type: String, required: true, minlength: 5, maxlength: 100 },
  description: { type: String, required: true, minlength: 10 },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  tags: [{ type: String, validate: { validator: (v: string) => v.length > 0 && v.length <= 20 } }],
  inputVariables: { type: [inputVariableSchema], required: true, validate: { validator: (v: any[]) => v.length > 0 && v.length <= 10 } },
  testCases: { type: [testCaseSchema], required: true, validate: { validator: (v: any[]) => v.length > 0 && v.length <= 20 } },
  supportedLanguages: { type: [String], required: true, enum: ['javascript', 'python', 'cpp'] },
  boilerplates: { type: [boilerplateSchema], required: true },
  timeLimit: { type: Number, default: 3000, min: 100, max: 10000 },
  memoryLimit: { type: Number, default: -1, min: -1, max: 1024 },
  outputType: {
    type: String,
    required: true,
    enum: [
      'integer', 'float', 'string', 'boolean', 'object',
      'integer[]', 'float[]', 'string[]', 'boolean[]', 'object[]',
      'integer[][]', 'float[][]', 'string[][]', 'boolean[][]', 'object[][]'
    ],
    default: 'string'
  }
}, { timestamps: true });

problemSchema.index({ title: 'text', description: 'text', tags: 'text' });
problemSchema.index({ difficulty: 1 });
problemSchema.index({ createdAt: -1 });

export const Problem = mongoose.model<IProblemDocument>('Problem', problemSchema);