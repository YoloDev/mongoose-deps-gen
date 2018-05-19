// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from './fs';
import {
  getMosIncludes,
  getMosModulePaths,
  getMosPlatforms,
  getMosDefines,
} from './mos';
import { getGccSearchPaths } from './gcc';

type Configuration = {
  name: string;
  browse: {
    path: string[];
    limitSymbolsToIncludedHeaders: boolean;
  };
  includePath: string[];
  defines: string[];
  cStandard: string;
  cppStandard: string;
  intelliSenseMode: string;
  mos?: {
    platform: string;
  };
};

type Config = {
  configurations: Configuration[];
  version: number;
};

export async function maybeUpdateIncludes() {
  const mosConfigs = await vscode.workspace.findFiles('mos.yml');

  await Promise.all(mosConfigs.map(maybeupdateIncludeForProject));
  console.log('[mos] C++ includes updated');
}

async function maybeupdateIncludeForProject(uri: vscode.Uri) {
  const workspace = await vscode.workspace.getWorkspaceFolder(uri);
  if (!workspace) {
    return;
  }

  const gccSearchPath = await getGccSearchPaths();
  const mosModulePaths = await getMosModulePaths(workspace);
  const propsFile = await getPropsFile(workspace);
  const platforms = await getMosPlatforms(workspace);
  for (const platformName of platforms) {
    const mosIncludes = await getMosIncludes(workspace, platformName);
    const mosDefines = await getMosDefines(workspace, platformName);
    const platformConfig = getPlatformConfig(
      propsFile.configurations,
      platformName,
    );
    const platformIncludes: ReadonlyArray<string> = [
      path.join(workspace.uri.fsPath, 'build', 'gen'),
      ...mosIncludes /*.map(relativeTo(workspace))*/,
      ...gccSearchPath,
      ...mosModulePaths /*.map(relativeTo(workspace))*/,
    ].map(path.normalize);

    platformConfig.defines = [...mosDefines];
    platformConfig.browse.path = [...platformIncludes];
    platformConfig.includePath = [...platformIncludes];
  }

  await savePropsFile(workspace, propsFile);
}

async function getPropsFile(
  workspace: vscode.WorkspaceFolder,
): Promise<Config> {
  const base = workspace.uri.fsPath;
  const dir = path.join(base, '.vscode');
  const file = path.join(dir, 'c_cpp_properties.json');
  let config = await fs.tryReadAsync(file);
  if (!config) {
    await fs.mkdirp(dir);
    await fs.write(
      file,
      JSON.stringify(
        {
          configurations: [],
          version: 4,
        },
        null,
        2,
      ),
    );
    config = (await fs.tryReadAsync(file))!;
  }

  return JSON.parse(config);
}

async function savePropsFile(workspace: vscode.WorkspaceFolder, props: Config) {
  const base = workspace.uri.fsPath;
  const dir = path.join(base, '.vscode');
  const file = path.join(dir, 'c_cpp_properties.json');
  await fs.write(file, JSON.stringify(props, null, 2));
}

function getPlatformConfig(configurations: Configuration[], platform: string) {
  let config = configurations.find(
    c => (c.mos && c.mos.platform === platform) || false,
  );

  if (!config) {
    config = {
      name: `Mongoose OS (${platform})`,
      browse: {
        path: [],
        limitSymbolsToIncludedHeaders: true,
      },
      includePath: [],
      defines: [],
      cStandard: 'c11',
      cppStandard: 'c++17',
      intelliSenseMode: 'clang-x64',
      mos: { platform },
    };

    configurations.push(config);
  }

  return config;
}
