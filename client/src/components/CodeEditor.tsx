import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language }) => {
  const extensions = language === 'javascript' ? [javascript()] : [python()];
  return (
    <CodeMirror
      value={value}
      height="200px"
      extensions={extensions}
      onChange={onChange}
    />
  );
};

export default CodeEditor;