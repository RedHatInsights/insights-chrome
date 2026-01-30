# Disabling PF4 styling

> Note: This flag is mean to be used for debugging purposes to help visually identify usage of outdated PF version

## To remove PF4 styling support follow these steps

1. Open your browser developer tool and access the "console" tab
2. Run this command: `window.insights.chrome.enable.disabledPf4()`
3. Refresh the browser page

> Note: The flag uses localStorage for storage. The browser will remember the flag until the local storage is cleared. To remove the flag run `localStorage.clear()` command in you console and refresh the page.
