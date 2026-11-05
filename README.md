# Āraṇyānāṃ Pataye — free hosting package

This version is prepared for GitHub Pages and Pages CMS. It uses static HTML, CSS, JavaScript and a JSON article file. It does not use Firebase, Firestore, Firebase Authentication or Firebase Storage.

## Files

- `index.html`, `articles.html`, `article.html`, `about.html`: public website pages.
- `admin.html`: a small owner page that opens Pages CMS.
- `app.js`: loads and displays published articles from `data/articles.json`.
- `style.css`: the site's stylesheet.
- `.pages.yml`: Pages CMS editing configuration.
- `data/articles.json`: article records. It starts empty because no Firebase database export was included with the supplied website files.
- `media/`: image uploads made through Pages CMS are stored here.

## Publish on GitHub Pages for free

1. Create a GitHub account if you do not already have one.
2. Create a **public** repository. For the shortest website address, name it exactly `YOUR-GITHUB-USERNAME.github.io`.
3. Upload the contents of this folder to the repository root. Do not upload the outer folder itself as a nested folder.
4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select branch `main` and folder `/(root)`, then save.
7. Wait for the deployment to finish. The site address will be `https://YOUR-GITHUB-USERNAME.github.io/`.

GitHub Pages is free for public repositories on GitHub Free. The repository's source files are public, so do not put passwords, private drafts, personal documents or secret keys in it.

## Connect Pages CMS

1. Open https://app.pagescms.org/ and sign in with GitHub.
2. Install/authorize the Pages CMS GitHub App for this repository when prompted.
3. Open this repository. Pages CMS reads `.pages.yml` from the repository root.
4. Open **Research articles**. Create an article and fill in its title, slug, subject, summary, cover image, date, status and content.
5. Keep status as `draft` while working. Change it to `published` when ready for public readers.
6. Save/commit the changes. GitHub Pages will publish the update after its next deployment.

Only your GitHub account (and any collaborators you deliberately grant write access) should have permission to edit the repository. Public visitors can read the site but cannot edit it.

## Article notes

- Use a unique URL slug such as `early-medieval-inscriptions` (lowercase letters, numbers and hyphens only).
- The site displays only records whose status is `published`.
- Upload images through the Pages CMS image field. The CMS stores them in `media/`.
- If an image is not supplied, the site uses a category fallback image.
- Test the site with VS Code Live Server. Do not open the HTML files directly with `file://`, because browsers block the JSON fetch in that mode.

## Existing Firebase articles

The supplied files contained the old Firebase-connected website code, but not an export of the Firebase article database or Storage images. Therefore this package cannot include those old saved articles automatically. Export any existing article records and image files before deleting or closing the old Firebase project. You can then add the article records to `data/articles.json` or recreate them in Pages CMS.
