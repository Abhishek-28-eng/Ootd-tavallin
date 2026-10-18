const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const sharedPackage = path.resolve(monorepoRoot, 'packages/shared');

const config = getDefaultConfig(projectRoot);

// 1. Only watch mobile project, shared package, and monorepo node_modules
config.watchFolders = [
  projectRoot,
  sharedPackage,
  path.resolve(monorepoRoot, 'node_modules'),
];

// 2. Resolve packages with mobile node_modules prioritized
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force single instance of react, react-dom, and react-native from mobile workspace
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  '@tavallin/shared': sharedPackage,
};

module.exports = config;
