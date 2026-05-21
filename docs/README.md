# BigIPReport documentation (GitHub Pages)

This folder contains the BigIPReport (REST) documentation published with [Jekyll](https://jekyllrb.com/) and [just-the-docs](https://just-the-docs.github.io/just-the-docs/) on [GitHub Pages](https://docs.github.com/en/pages).

## Local preview

From the repository root:

```bash
make docs-serve
```

Open http://localhost:4000/BigIPReport/

Other targets: `make docs-build` (write `docs/_site`), `make docs-clean`.

With Ruby 3+ and Bundler installed you can also run from this directory:

```bash
bundle install
bundle exec jekyll serve --baseurl /BigIPReport
```
