# Changelog

## 2.0.0

### Breaking change

Template values (`protocol`, `domain`, `path`, `baseUrl`, `publicUrl`) are now written to `res.locals` instead of `app.locals`.

`app.locals` is shared by every request, so under concurrent load a page could render another request's `path` and `publicUrl`. This affects anything that reads these values at render time (for example an `og:url` meta tag).

Templates keep working without changes, because Express merges `res.locals` over `app.locals` at render time. If you read these values directly from `app.locals` (for example `app.locals.publicUrl`), switch to `res.locals`, `req.urlBase` or `req.publicUrl`.
