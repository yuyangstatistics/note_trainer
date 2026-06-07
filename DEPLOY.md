# Deploying to `yuyangyy.com/note_trainer/`

Use a separate GitHub repository named:

```text
note_trainer
```

With GitHub Pages enabled, this project repository can be served at:

```text
https://yuyangyy.com/note_trainer/
```

This assumes `yuyangyy.com` is already configured as the custom domain for your GitHub Pages user site.

## Repository layout

Put this app's static files at the root of the `note_trainer` repository:

```text
note_trainer/
  .nojekyll
  index.html
  styles.css
  app.js
  assets/
    fonts/
      Bravura.otf
      Bravura_LICENSE.txt
  docs/
```

## GitHub Pages settings

In the `note_trainer` repository:

1. Go to `Settings -> Pages`.
2. Set the source to the branch that contains `index.html`, usually `main`.
3. Use `/ (root)` as the publishing folder.
4. Do not add a custom domain in this repository.

## CNAME

Do not add a `CNAME` file to the `note_trainer` repository for this setup.

The domain-level `CNAME` belongs in your GitHub Pages user-site repository, the one that owns:

```text
https://yuyangyy.com/
```

The `/note_trainer/` path comes from the separate repository name.

## Asset paths

The app uses relative paths:

```text
styles.css
app.js
assets/fonts/Bravura.otf
```

So it works correctly from:

```text
https://yuyangyy.com/note_trainer/
```

as long as these files are published together at the repository root.
