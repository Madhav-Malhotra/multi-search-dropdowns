# Multi Search Dropdowns

This is a class to create W3C-WAI **accessible dropdowns with multiple select, search, and logical form section display**. I created this for the Public Health Infobase team at the Public Health Agency of Canada.

## Examples
Dropdowns in different orientations ![vertical and horizontal dropdowns](./images/dropOrientations.png)

A dropdown form showing different sections using conditional logic.
![only two dropdowns show](./images/dropLogic1.png) 
![more dropdowns appear with user input](./images/dropLogic2.png) 
![all dropdowns appear and have values](./images/dropLogic3.png) 

Different dropdowns with single select, multiselect, and search options toggled on and off.
![single select dropdowns](./images/dropTypes.png)

## Quickstart
Download the files at `/dist/drop.css` and `/dist/drop.js` to a directory.

Create a file in that directory called `index.html`. Put the following in it: 

```html
(index.html)
---------------------------------
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="/drop.css" type="text/css" />
</head>
<body>
    <script src='/drop.js' type='module'></script>
    <script src='/main.js" type='module'></script>
</body>
</html>
```

Next, make a file in that directory called `main.js`. In this file, **you'll create Javascript objects to set the options of your dropdowns**.

Before setting these options, put this boilerplate code in `main.js`:

```js
(main.js)
---------------------------------
import { Dropdown } from '/drop.js';

const drop = new Dropdown();
const initSettings = [{}, {}, {}]; // to be updated

// An EMPTY div to be the parent of the dropdowns
drop.rootDOM = document.body;
// Dropdown settings for each section
drop.sections = initSettings;

// Replace this with your own callback
// Ex: To show a graph after values are selected
drop.onStateUpdate = (value) => console.log(value);

// Render the dropdowns
drop.init();
```