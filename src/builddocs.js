let fs = require("fs")
let Mold = require("mold-template")
let read = exports.read = require("./read").read
let builtins = require("./builtins")

exports.browserImports = require("./browser")

exports.build = function(config, data) {
  if (!data) data = read(config)

	// TODO: Uncertain if this should also be run on data.all
	// (What is `all` vs `items`?)
	data.items = Object.keys(data.items)
		.reduce(
			(items, key) => Object.assign(
				{},
				items,
				{ [key]: organizeTags(data.items[key]) }),
			data.items);

  let format = config.format || "html"
  let renderItem =
      format == "html" ? name => '<div data-item="' + name + '"></div>' :
      format == "markdown" ? (() => {
        let mold = loadMarkdownTemplates(config, data)
        return name => mold.defs.item({item: data.items[name], name}).replace(/[\n␤]{2}$/g, "\n")
      })()
      : null

  let placed = Object.create(null)
  let main = fs.readFileSync(config.main, "utf8").replace(/(^|\n)@(\w+)(?=$|\n)/g, function(_, before, name) {
    if (placed[name]) throw new Error("Item " + name + " is included in doc template twice")
    if (!data.items[name]) throw new Error("Unknown item " + name + " included in doc template")
    placed[name] = true
    return before + renderItem(name)
  })
  for (let name in data.items) if (!placed[name])
    throw new Error("Item " + name + " is missing from the doc template")

  if (format == "markdown") {
    return main.replace(/␤/g, "\n")
  } else if (format == "html") {
    let mdOptions = {html: true}
    if (config.markdownOptions) for (let prop in config.markdownOptions) mdOptions[prop] = config.markdownOptions[prop]
    let markdown = require("markdown-it")(mdOptions).use(require("markdown-it-deflist"))
    let mold = loadHTMLTemplates(markdown, config, data)

    let doc = markdown.render(main)
    return doc.replace(/<div data-item="([^"]+)"><\/div>/g, function(_, name) {
      return mold.defs.item({item: data.items[name], name})
    })
  }
}

function prefix(config) {
  let prefix = config.anchorPrefix
  if (prefix == null) prefix = config.name + "."
  return prefix
}

function templateDir(mold, dir, ext) {
  fs.readdirSync(dir).forEach(function(filename) {
    let match = /^(.*?)\.(\w+)$/.exec(filename)
    if (match && match[2] == ext && !(match[1] in mold.defs))
      mold.bake(match[1], fs.readFileSync(dir + "/" + filename, "utf8").trim())
  })
}

function loadHTMLTemplates(markdown, config, data) {
  let mold = new Mold(moldEnv(config, data))
  mold.defs.markdown = function(text) {
    if (!text) return ""
    return markdown.render(config.markdownFilter ? config.markdownFilter(text) : text)
  }
  mold.defs.markdownFile = function(name) {
    return mold.defs.markdown(fs.readFileSync(name + ".md", "utf8"))
  }

  if (config.templates) templateDir(mold, config.templates, "html")
  templateDir(mold, __dirname + "/../templates", "html")

  return mold
}

function loadMarkdownTemplates(config, data) {
  let mold = new Mold(moldEnv(config, data))

  if (config.templates) templateDir(mold, config.templates, "md")
  templateDir(mold, __dirname + "/../templates/markdown", "md")
  mold.defs.indent = function({text, depth}) {
    return text.trim().split("\n").map(line => /\S/.test(line) ? " ".repeat(depth) + line : "").join("\n")
  }

  return mold
}

function maybeLinkType(config, data, name) {
  if (name in data.all) return "#" + prefix(config) + name
  if (name.charAt(0) == '"') return false
  let imports = config.imports, qualified = config.qualifiedImports
  if (imports) for (let i = 0; i < imports.length; i++) {
    let set = imports[i]
    if (Object.prototype.hasOwnProperty.call(set, name))
      return set[name]
  }
  if (qualified) for (let pref in qualified) if (name.indexOf(pref + ".") == 0) {
    let inner = name.slice(pref.length + 1)
    if (Object.prototype.hasOwnProperty.call(qualified[pref], inner))
      return qualified[pref][inner]
  }
  if (builtins.hasOwnProperty(name)) return builtins[name]
}

function moldEnv(config, data) {
  let env = {
    prefix: prefix(config),
    linkType: function(type) {
      let link = maybeLinkType(config, data, type.type)
      if (!link && link !== false && !config.allowUnresolvedTypes)
        throw new Error("Unknown type '" + type.type + "' at " + type.loc.file + ":" + type.loc.line)
      return link
    },
    hasDescription: function(type) {
      if (type.description) return true
      if (type.properties) for (let prop in type.properties)
        if (env.hasDescription(type.properties[prop])) return true
      if (type.params) for (let i = 0; i < type.params.length; i++)
        if (env.hasDescription(type.params[i])) return true
      if (type.returns && type.returns.description) return true
      return false
    }
  }
  if (config.env) for (let prop in config.env) env[prop] = config.env[prop]
  return env
}

// Takes a parsed getdocs item, finds all tags by searching for keys starting
// with the tag delimiter, strips the delimiter, and moves the entries to
// a new entry in the item with the specified `tagCollectionKey`. Does not
// mutate the input.
//
// ```
// const item = {
//   loc: someLoc,
//   type: 'Function',
//   $added: 'April 6, 2017',
//   $public: true,
// };
// const organizedItem = organizeTags(item);
// assert.deepEqual(organizedItem, {
//   loc: someLoc,
//   type: 'Function',
//   tags: {
//     added: 'April 6, 2017',
//     public: true,
//   }
// });
// ```
//
// ```
// const item = {
//   loc: someLoc,
//   type: 'Function',
// };
// const organizedItem = organizeTags(item, 'collectedTags', '$');
// assert.deepEqual(organizedItem, {
//   loc: someLoc,
//   type: 'Function',
//   collectedTags: {}
// });
// ```
function organizeTags(item, tagCollectionKey = 'tags', tagPrefix = '$') {
	const isTagKey = key => key.startsWith(tagPrefix);
	const stripTagPrefix = key => key.substring(tagPrefix.length);

	let retval = {};
	let tagCollection = {};
	for (const key in item) {
		if (isTagKey(key)) {
			tagCollection[stripTagPrefix(key)] = item[key];
		} else {
			retval[key] = item[key];
		}
	}

	retval[tagCollectionKey] = tagCollection;
	return retval;
}

