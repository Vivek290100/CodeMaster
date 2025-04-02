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