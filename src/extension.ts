// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { maybeUpdateIncludes } from './generator';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
// or when a folder containing a mos.yml is opened.
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('mongoose-deps-gen activated');
  const channel = vscode.window.createOutputChannel('mos-deps-gen');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand('mos-dep-gen.generate', () => {
      channel.appendLine('Workspace changed');
      maybeUpdateIncludes(channel, true);
    }),
  );

  // Get notified whenever the workspace folders change
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(e => {
      channel.appendLine('Workspace changed');
      maybeUpdateIncludes(channel, false);
    }),
  );

  const watcher = vscode.workspace.createFileSystemWatcher(
    'mos.yml',
    true,
    true,
    false,
  );
  context.subscriptions.push(watcher);
  context.subscriptions.push(
    watcher.onDidChange(e => {
      channel.appendLine('Mos config changed');
      maybeUpdateIncludes(channel, false);
    }),
  );

  context.subscriptions.push(
    watcher.onDidCreate(e => {
      channel.appendLine('Mos config changed');
      maybeUpdateIncludes(channel, false);
    }),
  );

  maybeUpdateIncludes(channel, false);
}

// this method is called when your extension is deactivated
export function deactivate() {}
