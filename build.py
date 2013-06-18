#!/usr/bin/python3

import json
import os
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request

APP_NAME = 'Password Generator'
IS_APP = False

BASE_DIR = os.path.dirname(sys.argv[0])
SOURCE_DIR = BASE_DIR
BUILD_DIR = os.path.join(BASE_DIR, 'build')

FILES = [
  'popup.html',
  'options.html',
  'main.css',
  'options.css',
  'icons/icon-16.png',
  'icons/icon-19.png',
  'icons/icon-32.png',
  'icons/icon-38.png',
  'icons/icon-48.png',
  'icons/icon-64.png',
  'icons/icon-96.png',
  'icons/icon-128.png',
  'icons/icon-192.png',
  'icons/icon-256.png',
  'js/background.js',
  'js/biguint.js',
  'js/mstrings.js',
  'js/main.js',
  'js/options.js',
  'jshash/md5.js',
  'jshash/sha1.js',
  'jshash/sha256.js'
]

MANIFEST = 'manifest.json'
INDEX_HTML = 'popup.html'
TARGET_JS = 'js/all.js'
TARGET_JS_INCLUDE = ('<script src="' + TARGET_JS + '" type="text/javascript">'
                     '</script>')
JS_INCLUDES = re.compile(r'(<!-- JS -->.*<!-- /JS -->)', flags=re.M | re.S)
JS_SRC = re.compile(r'<script src="([^"]*)" type="text/javascript">')
CLOSURE_URL = 'http://closure-compiler.appspot.com/compile'
BACKGROUND_EXTERNS = os.path.join(SOURCE_DIR, 'js/externs.js')
JS_EXTERNS = None
EXTERNS_URLS = [
  'https://closure-compiler.googlecode.com' +
      '/svn/trunk/contrib/externs/jquery-1.8.js',
  'https://closure-compiler.googlecode.com' +
      '/git/contrib/externs/chrome_extensions.js',
  'https://closure-compiler.googlecode.com' +
      '/git/contrib/externs/google_analytics_api.js'
]

SKIP_JS_FILES = []

USE_LOCALIZED_NAME = False
COMPILATION_LEVEL = False
BACKGROUND_COMPILATION_LEVEL = False

debug_build = False


def parse_command_line():
  global debug_build
  for option in sys.argv[1:]:
    if option == '-d':
      debug_build = True
    else:
      raise Exception('Unknown command line option: ' + option)


def delete(*paths):
  for path in paths:
    if os.path.isdir(path):
      print('Deleting', path)
      shutil.rmtree(path, ignore_errors=True)
    elif os.path.isfile(path):
      print('Deleting', path)
      os.remove(path)


def copy_files(src, dst, files):
  for f in files:
    print('Copying', f)
    full_path = os.path.join(src, f)
    target_path = os.path.join(dst, f)
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    shutil.copy(full_path, target_path)


def get_version():
  version = subprocess.check_output(['git', 'describe'],
                                    universal_newlines=True)
  match = re.compile('v(\d+(?:\.\d+))(?:-(\d+)-g.*)?').match(version)
  version = match.group(1)
  if match.group(2):
    version += '.' + match.group(2)
  return version


def process_manifest(out_dir, version):
  manifest = json.load(open(os.path.join(SOURCE_DIR, MANIFEST)))
  if USE_LOCALIZED_NAME:
    manifest['name'] = '__MSG_extName__'
  else:
    manifest['name'] = APP_NAME
  manifest['version'] = version

  if IS_APP:
    background_js = manifest['app']['background']['scripts']
  else:
    background_js = manifest['background']['scripts']


  if BACKGROUND_COMPILATION_LEVEL:
    output_js = set(f for f in background_js if f.startswith('lib'))
    background_js = set(background_js) - output_js
    output_js.add('js/background.js')
  else:
    output_js = background_js

    if IS_APP:
      manifest['app']['background']['scripts'] = list(output_js)
    else:
      manifest['background']['scripts'] = list(output_js)

  json.dump(manifest, open(os.path.join(out_dir, MANIFEST), 'w'), indent=2)
  return list(background_js)


def process_index(out_dir):
  html = open(os.path.join(SOURCE_DIR, INDEX_HTML)).read()
  match = JS_INCLUDES.search(html)
  if not match:
    print('Can\'t find JS includes in index.html.')
    exit(1)
  js_includes = match.group(1)

  html = JS_INCLUDES.sub(TARGET_JS_INCLUDE, html)
  open(os.path.join(out_dir, INDEX_HTML), 'w').write(html)

  js_files = []
  for match in JS_SRC.finditer(js_includes):
    js_files.append(match.group(1))
  return js_files


def print_errors(errors, js_files):
  for error in errors:
    if error['file'].find('Externs') >= 0:
      filename = 'externs'
    else:
      fileno = int(error['file'][6:])
      filename = js_files[fileno]
    if 'error' in error:
      text = error['error']
    else:
      text = error['warning']
    print(filename + ':' + str(error['lineno']) + ' ' + text)
    print(error['line'])


def compile_js(out_path, js_files, level, externs):
  print('Compiling JavaScript code.')

  params = [
      ('compilation_level', level),
      ('language', 'ECMASCRIPT5_STRICT'),
      ('output_format', 'json'),
      ('output_info', 'statistics'),
      ('output_info', 'warnings'),
      ('output_info', 'errors'),
      ('output_info', 'compiled_code')
    ]

  if debug_build:
    params.append(('formatting', 'pretty_print'))
    js_code = ['/** @define {boolean} */\nvar DEBUG = true;']
  else:
    js_code = ['/** @define {boolean} */\nvar DEBUG = false;']

  for js_file in js_files:
    if os.path.basename(js_file) not in SKIP_JS_FILES:
      js_code.append(open(os.path.join(SOURCE_DIR, js_file)).read())

  if externs:
    params.append(('js_externs', open(externs).read()))

  for url in EXTERNS_URLS:
    params.append(('externs_url', url))

  for code in js_code:
    params.append(('js_code', code))

  params = bytes(urllib.parse.urlencode(params, encoding='utf8'), 'utf8')
  headers = {'Content-Type': 'application/x-www-form-urlencoded'}

  print('Connecting', CLOSURE_URL)
  out = urllib.request.urlopen(CLOSURE_URL, data=params)
  result = json.loads(out.read().decode('utf8'))

  if 'errors' in result and len(result['errors']):
    print('Errors:')
    print_errors(result['errors'], js_files)
    print()

  if 'warnings' in result and len(result['warnings']):
    print('Warnings:')
    print_errors(result['warnings'], js_files)
    print()

  print('Writing', out_path)
  os.makedirs(os.path.dirname(out_path), exist_ok=True)
  open(out_path, 'w').write(result['compiledCode'])


def main():
  parse_command_line()

  version = get_version()

  dir_name = APP_NAME + '-' + version
  if debug_build:
    dir_name += '-dbg'
  print('Compiling', dir_name)
  out_dir = os.path.join(BUILD_DIR, dir_name)
  archive_path = out_dir + '.zip'
  delete(out_dir, archive_path)
  copy_files(SOURCE_DIR, out_dir, FILES)

  background_js_files = process_manifest(out_dir, version)
  if BACKGROUND_COMPILATION_LEVEL:
    compile_js(os.path.join(out_dir, 'js', 'background.js'),
               background_js_files,
               BACKGROUND_COMPILATION_LEVEL,
               BACKGROUND_EXTERNS)
  if COMPILATION_LEVEL:
    js_files = process_index(out_dir)
    compile_js(os.path.join(out_dir, TARGET_JS),
               js_files,
               COMPILATION_LEVEL,
               JS_EXTERNS)

  print('Archiving', archive_path)
  shutil.make_archive(out_dir, 'zip',
                      root_dir=os.path.abspath(BUILD_DIR),
                      base_dir=dir_name,
                      verbose=True)


if __name__ == '__main__':
  main()
