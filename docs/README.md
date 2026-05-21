# BigIPReport documentation (GitHub Pages)

This folder contains the BigIPReport (REST) documentation published with [Jekyll](https://jekyllrb.com/) and [just-the-docs](https://just-the-docs.github.io/just-the-docs/) on [GitHub Pages](https://docs.github.com/en/pages).

## Published site

After Pages is enabled: **https://net-utilities.github.io/BigIPReport/**

## Enable GitHub Pages (one-time)

1. Open the repository on GitHub: [net-utilities/BigIPReport](https://github.com/net-utilities/BigIPReport)
2. Go to **Settings** → **Pages**
3. Under **Build and deployment** → **Source**, choose **GitHub Actions**
4. Save. The `Docs` workflow will build the Jekyll site and deploy it after docs changes land on `main`.

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
