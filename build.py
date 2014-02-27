import os

from builder import File
import builder
import builder.chrome_app as chrome_app
import builder.html as html
import builder.js as js
import builder.util as util

FILES = ['css/main.css',
         'css/narrow.css',
         'css/wide.css']

def do_compile(source_dir, app_builder):
  """Compile the javascript files in background page and HTMLs."""
  compiler = js.get_compiler()
  if compiler.name == 'closure':
    compiler.compilation_level = 'ADVANCED_OPTIMIZATIONS'

  background_js = app_builder.get_background_js()
  background_comp = compiler.compile(list(map(File, background_js)))
  app_builder.copy_file(background_comp, 'js/background.js')
  app_builder.replace_background_js(background_js, 'js/background.js')

  for html_path in ('generate.html', 'options.html'):
    html_file = File(html_path)
    js_paths = html.extract_local_js(html_file)
    js_files = [File(js_path) for js_path in js_paths]
    js_compiled = compiler.compile(js_files)
    js_comp_path = 'js/' + html_path.replace('html', 'js')
    app_builder.copy_file(js_compiled, js_comp_path)
    html_temp = html.replace_js(html_file, js_paths, js_comp_path)
    app_builder.add_html_file(html_temp, html_path, add_js=False)


@builder.action
def dist(source_dir : File, base_build_path, compile_js=False):
  """Create a distribution in a directory and an archive."""
  _, short_name = chrome_app.get_name_from_manifest(source_dir)
  build_path = util.get_build_path_with_version(
      source_dir, base_build_path, short_name, default_branch='gh-pages')
  app_builder = chrome_app.Builder(source_dir, build_path,
                                   add_js=(not compile_js))
  app_builder.set_version(util.get_version_from_git(source_dir))
  app_builder.add_static_files(FILES)

  if compile_js:
    do_compile(source_dir, app_builder)
  else:
    app_builder.add_html_file(File('generate.html'), 'generate.html', add_js=True)
    app_builder.add_html_file(File('options.html'), 'options.html', add_js=True)

  return app_builder.build()


if __name__ == '__main__':
  builder.run(dist)
