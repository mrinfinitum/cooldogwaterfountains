=== Cool Dog SEO Import ===
Requires at least: 6.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later

One-time import of optimized Yoast SEO titles, meta descriptions and focus keyphrases.

== How to use ==

1. Plugins → Add New → Upload Plugin → choose cooldog-seo-import.zip → Install → Activate.
2. Tools → Cool Dog SEO Import. Review the current and new values side by side.
3. Click "Apply optimized SEO". The previous values are saved first.
4. Clear your site / CDN cache so the new values show up.
5. Deactivate and delete the plugin. (Need to undo? Use "Restore previous values" before deleting.)

The values live in seo-data.json, generated from scripts/seo/yoast-copy.py in the website repo.
