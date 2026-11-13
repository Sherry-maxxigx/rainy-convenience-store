const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'src/page.html'), 'utf8');
const options = {
  entryPoints: [path.join(root, 'src/scene.js')],
  bundle: true, write: false, format: 'iife', target: 'es2022',
  minify: true, legalComments: 'inline',
};
const dataURI = (file, mime) => `data:${mime};base64,${fs.readFileSync(path.join(root, file)).toString('base64')}`;

async function build() {
  if (process.argv.includes('--offline')) {
    const inlineAssets = {
      name: 'inline-local-assets',
      setup(build) {
        build.onLoad({ filter: /[\\/]src[\\/](assets|models|night)\.js$/ }, ({ path: filename }) => {
          const name = path.basename(filename, '.js');
          let value;
          if (name === 'night') {
            value = dataURI('assets/environment/night.hdr', 'application/octet-stream');
          } else if (name === 'models') {
            value = Object.fromEntries(['folding_wooden_stool', 'metal_trash_can'].map(key => [
              key, JSON.parse(fs.readFileSync(path.join(root, `assets/models/${key}.gltf`), 'utf8')),
            ]));
          } else {
            value = Object.fromEntries(fs.readdirSync(path.join(root, 'assets/textures')).filter(f => f.endsWith('.jpg')).sort().map(f => [
              path.basename(f, '.jpg'), dataURI(`assets/textures/${f}`, 'image/jpeg'),
            ]));
          }
          return { contents: `export default ${JSON.stringify(value)};`, loader: 'js' };
        });
      },
    };
    const result = await esbuild.build({ ...options, plugins: [inlineAssets] });
    const code = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
    const license = fs.readFileSync(path.join(root, 'licenses/three-MIT.txt'), 'utf8');
    const html = template.replace('/*__BUNDLE__*/', () => code).replace('</head>', `<!-- Third-party notice: Three.js\n${license}\n-->\n</head>`);
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(root, 'dist/rainy-corner.html'), html);
    console.log('Built offline file: dist/rainy-corner.html');
    return;
  }
  const result = await esbuild.build(options);
  fs.writeFileSync(path.join(root, 'app.js'), result.outputFiles[0].text);
  const html = template.replace('<script>/*__BUNDLE__*/</script>', '<script defer src="./app.js"></script>');
  if (html === template) throw new Error('Missing script placeholder in src/page.html');
  fs.writeFileSync(path.join(root, 'index.html'), html);
  console.log('Built GitHub Pages website: index.html + app.js + assets/');
}

build().catch(error => { console.error(error); process.exitCode = 1; });
