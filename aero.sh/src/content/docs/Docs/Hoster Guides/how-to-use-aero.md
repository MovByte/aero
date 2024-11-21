---
title: How to use aero on your proxy
---

# Instructions - server backend

## JS

Add these static path imports to the top of your main JS server file or Vite/Astro config:

```js
// static path imports
// aero
import { default as aeroPath, aeroExtrasPath } from "aero-proxy" // You only need to import this if you are using handleWithExtras
import aeroSandboxPath from "aero-sandbox/path.js";
// bare-mux 2.0
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
```

## Express

Add these routes route before your primary (root) route:

```js
app.use("/aero/", express.static(aeroPath));
app.use("/aero/extras/", express.static(aeroExtrasPath)); // You only need to import this if you are using handleWithExtras
app.use("/aero/sandbox/", express.static(aeroSandboxPath));
```

## Fastify

Add this import if you haven't already:

```js
import fastifyStatic from "@fastify/static";
```

Add these routes:

```js
fastify.register(fastifyStatic, {
	root: join(
		fileURLToPath(new URL(".", import.meta.url)),
		aeroSandboxPath
	),
	prefix: "/aero/sandbox/",
	decorateReply: false
});
fastify.register(fastifyStatic, {
	root: join(fileURLToPath(new URL(".", import.meta.url)), aeroPath),
	prefix: "/aero/",
	decorateReply: false
});
```

## Vite/Astro config

Add this these routes in the viteStaticCopy plugin

```js
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
	...,
    plugins: [
        ...,
        viteStaticCopy({
            ...,
            targets: [
                {
                    src: aeroPath,
                    dest: "",
                    rename: "aero",
                    overwrite: false
                },
                {
                    src: aeroSandboxPath,
                    dest: "",
                    rename: "aero/sandbox",
                    overwrite: false,
                },
                // bare-mux 2.0
                {
                    src: baremuxPath,
                    dest: "",
                    rename: "baremux",
                },
                {
                    src: epoxyPath,
                    dest: "",
                    rename: "epoxy",
                    overwrite: false,
                },
            ]
        })
    ]
});
```

## Rust

TODO: Write this...

## Ruby

## Sinatra

```ruby
...

set :root, File.dirname(__FILE__)
# aero
set :aeroPath, File.join(settings.root, 'node_modules', 'aero-proxy', 'dist', 'sw')
set :aeroSandboxPath, File.join(settings.root, 'node_modules', 'aero-sandbox', 'dist')
# bare-mux 2.0
set :baremuxPath, File.join(settings.root, 'node_modules', '@mercuryworkshop', 'bare-mux', 'dist')
set :epoxyPath, File.join(settings.root, 'node_modules', '@mercuryworkshop', 'epoxy-transport', 'dist')
set :libcurlPath, File.join(settings.root, 'node_modules', '@mercuryworkshop', 'libcurl-transport', 'dist')

def set_content_type(params, headers)
  if params[:splat][0].end_with?('.js')
    headers['Content-Type'] = 'application/javascript'
  end
end

# aero
get '/aero/sandbox/' do
  set_content_type(params, headers)
  send_file File.join(settings.aeroSandboxPath, params[:splat][0])
end
get '/aero/*' do
  set_content_type(params, headers)
  if params[:splat][0] == 'aero.config.js'
      send_file File.join(settings.public_folder, 'js', 'aero', params[:splat][0])
    else
      send_file File.join(settings.aeroPath, params[:splat][0])
end
# bare-mux 2.0
get '/baremux/*' do
  set_content_type(params, headers)
  send_file File.join(settings.baremuxPath, params[:splat][0])
end
get '/epoxy/*' do
  set_content_type(params, headers)
  send_file File.join(settings.epoxyPath, params[:splat][0])
end
```

# Instructions - site (static)

1. Create `/sw.js` (in your static folder) with the contents of `/examples/swWithExtras.js` (in this git repo) and modify that file to your liking
2. Copy the contents of `/examples/config.js` (in this Git repo) to `/aero/config.js` (in your static folder) and modify that file to your liking
3. Copy the contents of `/AeroSandbox/examples/config.js` (in this Git repo) to `/aero/sandbox/config.js` (in your static folder) and modify that file to your liking
