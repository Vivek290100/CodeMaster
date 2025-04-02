import mongoose, { Schema } from 'mongoose';

export interface IProblem {
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  variables: {
    inputs: { name: string; type: string; subtype?: string; description?: string }[];
    output: { name: string; type: string; subtype?: string; description?: string };
  };
  testcases: { input: Record<string, any>; output: any }[];
  boilerplates: Record<string, string>;
}

const ProblemSchema = new Schema<IProblem>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  description: { type: String, required: true },
  variables: {
    inputs: [{
      name: { type: String, required: true },
      type: { type: String, required: true },
      subtype: String,
      description: String
    }],
    output: {
      name: { type: String, default: 'result' },
      type: { type: String, required: true },
      subtype: String,
      description: String
    }
  },
  testcases: [{
    input: { type: Map, of: Schema.Types.Mixed, required: true },
    output: { type: Schema.Types.Mixed, required: true }
  }],
  boilerplates: { type: Map, of: String, default: {} }
});

export const Problem = mongoose.model<IProblem>('Problem', ProblemSchema);