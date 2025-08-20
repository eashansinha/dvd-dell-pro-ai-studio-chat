/*
 * Copyright © 2025 Dell Inc. or its subsidiaries. All Rights Reserved.

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Code } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
const useToast = () => ({
  toast: ({ description, variant }: { description: string; variant?: 'default' | 'destructive' }) => {
    console.log(`Toast: ${description}`);
  }
});
import VSCodeIconSvg from '../../assets/vscode.svg';
import { getSettings } from '../../utils/settings';
import { DownloadsPathDialog } from './DownloadsPathDialog';

interface MarkdownRendererProps {
  content: string;
}

interface CodeBlockProps {
  language: string;
  children: string;
}


const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
  const [copied, setCopied] = useState(false);
  const [showPathDialog, setShowPathDialog] = useState(false);
  const { toast } = useToast();
  const isDarkMode = document.documentElement.classList.contains('dark');

  const showToast = (message: string, variant: 'default' | 'destructive' = 'default') => {
    toast({
      description: message,
      variant,
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      showToast('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy code', 'destructive');
    }
  };

  const handlePathDialogClose = (path?: string) => {
    setShowPathDialog(false);
    if (path) {
      // Path was saved, now continue with opening VS Code
      openInVSCodeWithPath(path);
    }
  };

  const openInVSCodeWithPath = async (downloadsPath: string) => {
    try {
      const extensionMap: { [key: string]: string } = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        java: 'java',
        csharp: 'cs',
        cpp: 'cpp',
        c: 'c',
        html: 'html',
        css: 'css',
        scss: 'scss',
        json: 'json',
        xml: 'xml',
        yaml: 'yaml',
        yml: 'yml',
        markdown: 'md',
        sql: 'sql',
        shell: 'sh',
        bash: 'sh',
        powershell: 'ps1',
        go: 'go',
        rust: 'rs',
        ruby: 'rb',
        php: 'php',
        swift: 'swift',
        kotlin: 'kt',
        r: 'r',
        jsx: 'jsx',
        tsx: 'tsx',
      };

      const extension = extensionMap[language?.toLowerCase()] || 'txt';
      const timestamp = new Date().getTime();
      const filename = `code-snippet-${timestamp}.${extension}`;

      // Copy to clipboard first
      await handleCopy();

      // Create a Blob and download it
      const blob = new Blob([children], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);

      showToast(`Code saved as "${filename}". Opening in VS Code...`);

      // Try to open VS Code with the full path
      setTimeout(() => {
        // Construct the full file path
        const fullPath = `${downloadsPath}${downloadsPath.endsWith('/') || downloadsPath.endsWith('\\') ? '' : '/'}${filename}`;
        
        // Try to open VS Code with the file
        window.open(`vscode://file/${fullPath}`);
        showToast('VS Code should be opening with your file.');
      }, 500);
      
    } catch (err) {
      console.error('Failed to save code:', err);
      showToast('Code copied to clipboard. Create a new file in VS Code and paste (Ctrl/Cmd+V)');
    }
  };

  const handleOpenInVSCode = async () => {
    try {
      // Check if downloads path is configured
      const settings = getSettings();
      const downloadsPath = settings.downloadsPath;

      if (!downloadsPath) {
        // Show configuration dialog
        setShowPathDialog(true);
        return;
      }

      // Use the configured path
      openInVSCodeWithPath(downloadsPath);
      
    } catch (err) {
      console.error('Failed to open in VS Code:', err);
      showToast('Code copied to clipboard. Create a new file in VS Code and paste (Ctrl/Cmd+V)');
    }
  };

  return (
    <TooltipProvider>
      <Card className="my-4 overflow-hidden border">
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
        }`}>
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              {language || 'plaintext'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenInVSCode}
                  className="h-8 w-8 p-0"
                >
                  <img src={VSCodeIconSvg} alt="VS Code" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open in VS Code</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? "Copied!" : "Copy code"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Code content */}
        <div className="[&_pre]:m-0 [&_pre]:rounded-none">
          <SyntaxHighlighter
            style={isDarkMode ? vscDarkPlus : vs}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '16px',
              backgroundColor: isDarkMode ? '#1e1e1e' : '#f6f8fa',
              fontSize: '14px',
              lineHeight: 1.5,
            }}
          >
            {children}
          </SyntaxHighlighter>
        </div>
      </Card>

      {/* Downloads Path Configuration Dialog */}
      <DownloadsPathDialog
        open={showPathDialog}
        onClose={handlePathDialogClose}
      />
    </TooltipProvider>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks with syntax highlighting
        code({ inline, className, children }: any) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <CodeBlock language={match[1]}>
              {String(children).replace(/\n$/, '')}
            </CodeBlock>
          ) : (
            <code
              className={`rounded px-1.5 py-0.5 text-sm font-mono ${
                isDarkMode 
                  ? 'bg-white/10' 
                  : 'bg-gray-100'
              }`}
            >
              {children}
            </code>
          );
        },
        // Tables with shadcn styling
        table({ children }: any) {
          return (
            <Card className="my-4 overflow-hidden">
              <table className="w-full text-sm">
                {children}
              </table>
            </Card>
          );
        },
        thead({ children }: any) {
          return <thead className="bg-muted/50">{children}</thead>;
        },
        tbody({ children }: any) {
          return <tbody>{children}</tbody>;
        },
        tr({ children }: any) {
          return <tr className="border-b">{children}</tr>;
        },
        td({ children }: any) {
          return <td className="p-2 text-left">{children}</td>;
        },
        th({ children }: any) {
          return <th className="p-2 text-left font-semibold">{children}</th>;
        },
        // Typography elements
        p({ children }: any) {
          return <p className="mb-4 leading-7">{children}</p>;
        },
        h1({ children }: any) {
          return <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 mt-6">{children}</h1>;
        },
        h2({ children }: any) {
          return <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mb-4 mt-6">{children}</h2>;
        },
        h3({ children }: any) {
          return <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-3 mt-4">{children}</h3>;
        },
        h4({ children }: any) {
          return <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2 mt-3">{children}</h4>;
        },
        h5({ children }: any) {
          return <h5 className="scroll-m-20 text-lg font-semibold tracking-tight mb-2 mt-2">{children}</h5>;
        },
        h6({ children }: any) {
          return <h6 className="scroll-m-20 text-base font-semibold tracking-tight mb-1 mt-2">{children}</h6>;
        },
        // Lists
        ul({ children }: any) {
          return <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>;
        },
        ol({ children }: any) {
          return <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>;
        },
        li({ children }: any) {
          return <li>{children}</li>;
        },
        // Blockquotes
        blockquote({ children }: any) {
          return (
            <blockquote className="mt-6 border-l-2 pl-6 italic text-muted-foreground">
              {children}
            </blockquote>
          );
        },
        // Horizontal rule
        hr() {
          return <hr className="my-6 border-border" />;
        },
        // Links
        a({ href, children }: any) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            >
              {children}
            </a>
          );
        },
        // Strong/bold
        strong({ children }: any) {
          return <strong className="font-semibold">{children}</strong>;
        },
        // Emphasis/italic
        em({ children }: any) {
          return <em className="italic">{children}</em>;
        },
        // Strikethrough
        del({ children }: any) {
          return <del className="line-through">{children}</del>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};         