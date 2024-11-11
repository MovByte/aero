import { useState, useRef } from "react";
import { Editor, DiffEditor, type Monaco} from "@monaco-editor/react";
import { latte, frappe, macchiato, mocha } from "@catppuccin/vscode";

/** Initialize the Catppuccin themes for Monaco */
function initThemes(monaco: Monaco) {
  // Initialize the Catppuccin themes
  monaco.editor.defineTheme("catppuccin-latte", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: latte.colors,
  });
  monaco.editor.defineTheme("catppuccin-frappe", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: frappe.colors,
  });
  monaco.editor.defineTheme("catppuccin-macchiato", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: macchiato.colors,
  });
  monaco.editor.defineTheme("catppuccin-mocha", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: mocha.colors,
  });
}


const sharedStyle = {};
const sharedOptions = {
  fontFamily: "JetBrains Mono",
  fontLigatures: true,
  wordWrap: "on",
  minimap: {
    enabled: false,
  },
  bracketPairColorization: {
    enabled: true,
  },
}

export default function AeroSandboxRewriteDemo() {
  const [lang, setLang] = useState("javascript");
  const [theme, _setTheme] = useState("catppuccin-mocha");
  const editorRef = useRef<any>(null);

  const sharedEditorOptions = {
    width: "100%",
    height: "100vh",
    theme,
    language: lang,
    ref: editorRef,
    key: lang,
  }

  const [diffCode, setDiffCode] = useState("");

  function setDiffCodeFromOriginal(originalCode: string): void {
    // TODO: Will call setDiffCode() with the rewritten code
    // setDiffCode(rewrite(originalCode));
    // But instead I will do this for now:
    setDiffCode(originalCode);
  }

  return (
    <>
      <select
        id="langDropdown"
        className="select w-full max-w-xs"
        onChange={(e) => setLang(e.target.value)}
      >
        <option disabled selected>Select a rewriter to try</option>
        <option value="html">HTML</option>
        <option value="xml">XML+XSLT</option>
        <option value="javascript">JS</option>
        <option value="manifest">Cache Manifests</option>
      </select>
      {/* The left Monaco editor for the original code before rewriting (editable) */}
      <div style={sharedStyle}>
        <Editor
          {...sharedEditorOptions}
          loading="Loading the AeroSandbox Rewriter (original code)"
          onMount={(editor, _monaco: Monaco) => {
            editorRef.current = editor;
            editor.onDidChangeModelContent(() => {
              // @ts-ignore
              const newOriginalCode = editor.getModel().getValue();
              setDiffCodeFromOriginal(newOriginalCode);
            });
          }}
          beforeMount={(monaco: Monaco) => {
            initThemes(monaco);
          }}
          // @ts-ignore
          options={sharedOptions}
        />
      </div>
      {/* The right Monaco editor for the diff of the rewritten code (editable) */}
      <div style={sharedStyle}>
        <DiffEditor
          {...sharedEditorOptions}
          modified={diffCode}
          loading="Loading the AeroSandbox Rewriter (rewriter diff)"
          beforeMount={(monaco: Monaco) => {
            initThemes(monaco);
          }}
          // @ts-ignore
          options={{
            ...sharedOptions,
            renderSideBySide: false
          }}
        />
      </div>
    </>
  );
}