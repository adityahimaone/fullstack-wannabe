import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';

export type CodeLanguage = 'sql' | 'javascript' | 'typescript' | 'go' | 'php' | 'json' | 'text';

export function highlight(code: string, language: CodeLanguage): string {
  const grammar = Prism.languages[language];
  if (!grammar || language === 'text') {
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  return Prism.highlight(code, grammar, language);
}

export default Prism;
