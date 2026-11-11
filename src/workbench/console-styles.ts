/**
 * The console's look: a terminal, on purpose. Monospace, console colours and a
 * translucent black background, so nobody mistakes it for a screen of the
 * app, and the app stays visible behind it. Scoped under `.wb-root`.
 */
export const CONSOLE_CSS = `
.wb-root{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;font-size:12px;line-height:1.45;color:#b8f5b0;box-sizing:border-box}
.wb-root *,.wb-root *::before,.wb-root *::after{box-sizing:border-box}
:root{--wb-width:min(560px,100vw)}
@media (min-width:1100px){:root{--wb-width:min(460px,36vw)}}
.wb-host{position:fixed;inset:0;width:auto;height:auto;margin:0;padding:0;border:0;background:transparent;overflow:visible;pointer-events:none;z-index:2000;color:inherit}
.wb-host>*{pointer-events:auto}
.wb-drawer{position:fixed;top:0;right:0;height:100dvh;width:var(--wb-width);background:rgba(6,10,6,.8);backdrop-filter:blur(3px);border-left:1px solid #2f6b2f;display:flex;flex-direction:column;box-shadow:-4px 0 18px rgba(0,0,0,.35)}
.wb-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border-bottom:1px solid #2f6b2f;color:#7cfc00;letter-spacing:.08em}
.wb-scroll{flex:1;min-height:0;overflow:auto;padding:4px 10px 24px}
.wb-root fieldset{border:0;margin:0;padding:0;min-width:0}
.wb-section{border:1px dashed #2f6b2f;margin:8px 0;padding:4px 8px}
.wb-section>summary{cursor:pointer;color:#7cfc00;text-transform:uppercase;letter-spacing:.06em}
.wb-root input,.wb-root select,.wb-root button{font:inherit;color:#d7ffd0;background:rgba(0,0,0,.55);border:1px solid #3d7a3d;border-radius:2px;padding:3px 6px;max-width:100%;min-width:0}
.wb-root input[type=checkbox]{padding:0}
.wb-root button{cursor:pointer}
.wb-root button:hover:not(:disabled){background:#173317}
.wb-root :disabled{opacity:.45;cursor:not-allowed}
.wb-root button.wb-primary{border-color:#7cfc00;color:#7cfc00}
.wb-root button.wb-danger{border-color:#ff6b6b;color:#ff8a8a}
.wb-root :focus-visible{outline:1px solid #ffd166;outline-offset:1px}
.wb-root a{color:#6fd3ff}
.wb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px 10px;margin:6px 0}
.wb-grid label,.wb-field{display:flex;flex-direction:column;gap:2px;min-width:0;color:#8fd18a}
.wb-root label.wb-check{flex-direction:row;align-items:center;gap:6px}
.wb-root label.wb-check input{flex:none}
.wb-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}
.wb-hint{color:#79a876}
.wb-warn{color:#ffd166}
.wb-bad{color:#ff8a8a}
.wb-ok{color:#7cfc00}
.wb-msg{border:1px solid;padding:4px 8px;margin:6px 0;white-space:pre-wrap;overflow-wrap:anywhere}
.wb-tablewrap{overflow-x:auto;max-width:100%}
.wb-table{width:100%;border-collapse:collapse}
.wb-table th,.wb-table td{text-align:left;border-bottom:1px dotted #2f6b2f;padding:2px 4px;vertical-align:top;white-space:nowrap}
.wb-table .wb-wrap,.wb-table td[colspan]{white-space:normal;overflow-wrap:anywhere;min-width:14ch}
.wb-table th{color:#79a876;font-weight:normal}
.wb-table tr.wb-log-head td{border-bottom:0}
.wb-status{display:flex;flex-wrap:wrap;gap:2px 14px;padding:6px 10px;border-bottom:1px solid #2f6b2f}
.wb-k{color:#79a876;margin-right:4px}
.wb-root ol,.wb-root ul{margin:4px 0;padding-left:20px}
.wb-launcher{position:fixed;right:0;top:50%;transform:translateY(-50%);width:18px;height:56px;padding:0;border:1px solid #3d7a3d;border-right:0;border-radius:4px 0 0 4px;background:rgba(6,10,6,.7);color:#7cfc00;opacity:.5;cursor:pointer;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;writing-mode:vertical-rl;letter-spacing:.1em;line-height:1}
.wb-launcher:hover,.wb-launcher:focus-visible{opacity:1}
.wb-stale{opacity:.5}
@media (max-width:600px){.wb-drawer{overflow:auto}.wb-scroll{flex:none;overflow:visible}.wb-stack thead{display:none}.wb-stack tr{display:flex;flex-wrap:wrap;gap:0 10px;border-bottom:1px dotted #2f6b2f}.wb-stack td{display:block;border-bottom:0;white-space:normal}.wb-stack td[colspan]{flex-basis:100%}}
.wb-dialog-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:2;padding:12px}
.wb-dialog{background:#060a06;border:1px solid #7cfc00;padding:12px;width:100%;max-width:540px;max-height:90dvh;overflow:auto}
`;
