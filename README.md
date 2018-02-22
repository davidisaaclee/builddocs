**This repository is a work-in-progress.**

This repository is a fork of 
[builddocs](https://github.com/marijnh/builddocs). The main goal of
this fork is to generate HTML documentation which can be fully styled
with CSS, with minimal style elements included in the generated HTML
files.

Implemented features:
- Removed a lot of literal text added by HTML templates
- Made most semantic elements of the generated HTML selectable by CSS
- Allowed selection of tagged definitions via data-* attributes
- Allowed parameterized types to be selectable

Incomplete list of planned tasks:
- Add examples
- Remove all literal text added by HTML templates
- Make all semantic elements of the generated HTML selectable by CSS
- Remove all literal text added by HTML templates
- Document all classnames / selectors

# builddocs

This is a utility that transforms code documented with
[getdocs](https://github.com/marijnh/getdocs)-style doc comments into
HTML.

It exports the following values:

**`build`**`: (config: Object, data: ?Object) → string`

Build the documentation for a given set of files. The configuration
object may have the following fields:

 * **`name`**`: string` The name of this module.

 * **`files`**`: string` Should be a space-separated set of path
   strings, which may contain wildcards. These are the files that are
   scanned for doc comments.

 * **`main`**`: string` The path to the main template, which should be
   a Markdown file with `@itemName` placeholders where the generated
   docs for the documented items in the source should be inserted.
   builddocs will complain when the set of item placeholders does not
   match the set of documented items.

 * **`anchorPrefix`**`: ?string` Can be used to override the prefix
   used when generating HTML anchors. Defaults to the module name with
   a dot after it. You can set this to the empty string to disable
   anchor prefixes.

 * **`imports`**`: ?[Object]` A set of object mapping type names to
   URLs. Will make the library recognize the given type names and
   properly link them.

 * **`qualifiedImports`**`: ?Object<Object<string>>` An object mapping
   prefixes to imports-like objects. For example, `{foo: {bar:
   "http://url"}}` will map the type `foo.bar` to the given URL.

 * **`allowUnresolvedTypes`**`: ?bool` Determines whether running into
   an unknown type should raise an error. Defaults to false (do raise
   an error).

 * **`templates`**`: ?string` May be the path of a directory with
   additional templates to load, which should have an `.html`
   extension and use [Mold](https://github.com/marijnh/mold) syntax.

 * **`env`**`: ?Object` A set of extra values to make available as
   global variables in the templates.

 * **`markdownOptions`**`: ?Object` A set of options to pass through
   to [markdown-it](https://github.com/markdown-it/markdown-it).

The second parameter, `data`, can be used if the data for the module
has already been read. By default, `build` will read it.

**`read`**`: (config: Object) → Object`

Read comments from a given set of files. `config` has the same shape
as the argument to `build` (though only `files` and `order` will be
read by this function).

The returned object has the following properties:

 * **`items`**`: Object` The data returned by
   [getdocs](https://github.com/marijnh/getdocs).

 * **`pieces`**`: [Object]` An ordered array of getdocs items and
   `!!`-prefixed comments that were found in the code.

 * **`all`**`: Object` A mapping from getdocs ids to getdocs items.

**`browserImports`**`: Object<string>`

An object mapping the types available in the browser (such as
`Document` and `Blob`) to their MDN URLs. Useable with the `imports`
or `qualifiedImports` options.

## License

This software is released under an MIT open-source license.
