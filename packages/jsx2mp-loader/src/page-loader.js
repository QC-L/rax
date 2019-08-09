const { readJSONSync, writeJSONSync, writeFileSync, readFileSync, existsSync, mkdirpSync } = require('fs-extra');
const { relative, join, dirname, extname } = require('path');
const compiler = require('jsx-compiler');

const ComponentLoader = require.resolve('./component-loader');

module.exports = function pageLoader(content) {
  const rawContent = readFileSync(this.resourcePath, 'utf-8');
  const resourcePath = this.resourcePath;
  const rootContext = this.rootContext;
  const compilerOptions = Object.assign({}, compiler.baseOptions, {
    filePath: this.resourcePath,
    type: 'page',
  });
  const distPath = this._compiler.outputPath;
  const relativeSourcePath = relative(this.rootContext, this.resourcePath);
  const targetFilePath = join(distPath, relativeSourcePath);

  const transformed = compiler(rawContent, compilerOptions);
  const pageDistDir = dirname(join(distPath, relativeSourcePath));
  if (!existsSync(pageDistDir)) mkdirpSync(pageDistDir);

  const distFileWithoutExt = removeExt(join(distPath, relativeSourcePath));

  const config = Object.assign({}, transformed.config);
  if (Array.isArray(transformed.dependencies)) {
    transformed.dependencies.forEach(dep => {
      this.addDependency(dep);
    });
  }

  if (config.usingComponents) {
    const usingComponents = {};
    Object.keys(config.usingComponents).forEach(key => {
      const value = config.usingComponents[key];
      if (/^c-/.test(key)) {
        let result = relative(rootContext, value); // components/Repo.jsx
        result = removeExt(result); // components/Repo
        usingComponents[key] = '/' + result;
      } else {
        usingComponents[key] = value;
      }
    });
    config.usingComponents = usingComponents;
  }

  // Write js content
  writeFileSync(distFileWithoutExt + '.js', transformed.code);
  // Write template
  writeFileSync(distFileWithoutExt + '.axml', transformed.template);
  // Write config
  writeJSONSync(distFileWithoutExt + '.json', config, { spaces: 2 });
  // Write acss style
  if (transformed.style) {
    writeFileSync(distFileWithoutExt + '.acss', transformed.style);
  }
  // Write extra assets
  if (transformed.assets) {
    Object.keys(transformed.assets).forEach((asset) => {
      const content = transformed.assets[asset];
      writeFileSync(join(distPath, asset), content);
    });
  }

  function isCustomComponent(name, usingComponents = {}) {
    const matchingPath = join(dirname(resourcePath), name);
    for (let key in usingComponents) {
      if (usingComponents.hasOwnProperty(key)
        && usingComponents[key].indexOf(matchingPath) === 0) return true;
    }
    return false;
  }

  const denpendencies = [];
  Object.keys(transformed.imported).forEach(name => {
    if (isCustomComponent(name, transformed.usingComponents)) {
      denpendencies.push({ name, loader: ComponentLoader });
    } else {
      denpendencies.push({ name });
    }
  });

  return [
    `/* Generated by JSX2MP PageLoader, sourceFile: ${this.resourcePath}. */`,
    generateDependencies(denpendencies),
  ].join('\n');
};

function createImportStatement(req) {
  return `import '${req}';`;
}

function generateDependencies(dependencies) {
  return dependencies
    .map(({ name, loader }) => {
      let mod = name;
      if (loader) mod = loader + '!' + mod;
      return createImportStatement(mod);
    })
    .join('\n');
}

function removeExt(path) {
  const ext = extname(path);
  return path.slice(0, path.length - ext.length);
}
