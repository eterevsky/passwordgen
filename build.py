import os

import builder
import builder.chrome_app as chrome_app
import builder.util as util

FILES = ['main.css', 'options.css']

@builder.action
def build(source_dir, base_build_path=None):
  _, short_name = chrome_app.get_name_from_manifest(source_dir)
  build_path = util.build_path_with_version(source_dir, base_build_path,
                                            short_name)

  app_builder = chrome_app.Builder(source_dir, build_path)
  app_builder.add_static_files(FILES)
  app_builder.add_html_file('popup.html')
  app_builder.add_html_file('options.html')

  return app_builder.build()


if __name__ == '__main__':
  builder.run(build)