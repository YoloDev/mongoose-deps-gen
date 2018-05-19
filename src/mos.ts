import * as vscode from 'vscode';
import * as execa from 'execa';
import * as path from 'path';

export async function getMosPlatforms(
  workspace: vscode.WorkspaceFolder,
): Promise<ReadonlyArray<string>> {
  // await execa('mos', ['build', '--platform', 'esp8266', '--local']);
  const json = await execa.stdout(
    'mos',
    ['-X', 'eval-manifest-expr', '--platform', 'esp8266', 'platforms'],
    {
      cwd: workspace.uri.fsPath,
    },
  );

  return JSON.parse(json);
}

export async function getMosModulePaths(workspace: vscode.WorkspaceFolder) {
  const base = await execa.stdout('mos', ['-X', 'get-mos-repo-dir'], {
    cwd: workspace.uri.fsPath,
  });
  return [
    path.join(base, 'fw', 'include'),
    path.join(base, 'fw', 'src'),
    path.join(base, 'frozen'),
    base,
  ];
}

export async function getMosIncludes(
  workspace: vscode.WorkspaceFolder,
  platformName: string,
): Promise<ReadonlyArray<string>> {
  const json = await execa.stdout(
    'mos',
    ['-X', 'eval-manifest-expr', '--platform', platformName, 'includes'],
    { cwd: workspace.uri.fsPath },
  );
  return JSON.parse(json);
}

export async function getMosDefines(
  workspace: vscode.WorkspaceFolder,
  platformName: string,
): Promise<ReadonlyArray<string>> {
  const json = await execa.stdout(
    'mos',
    ['-X', 'eval-manifest-expr', '--platform', platformName, 'build_vars'],
    { cwd: workspace.uri.fsPath },
  );

  const build_vars: { [name: string]: string } = JSON.parse(json);
  return Object.keys(build_vars).filter(k => build_vars[k] === '1');
}
