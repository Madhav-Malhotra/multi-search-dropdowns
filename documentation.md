# Sections Field (Special)

`classInstance.sections (array of objects)`

This is a public field which sets dropdown settings like the options to select. 

It accepts an **array of 1+ objects**. Each object has key-value pairs to indicate dropdown settings. 

Here is an example section value:
```json
[
    {
        "sectionID":"chemical-section",
        "sectionOrder": 0,
        "dropIDs": ["Chemical_Name"],
        "dropTitles": ["Chemical Name"],
        "dropOrder": [0],
        "dropOptions":[
            ["Lead", "Antimony", "Arsenic", "Mercury"]
        ],
        "dropMulti": [true],
        "dropSearch": [true], 
        "dropInit": [false]
    }
    {
        "sectionID":"measurements-section",
        "sectionOrder": 1,
        "dropIDs": [
            "Matrix", 
            "Units", 
            "Cycle_Years", 
            "stats"
        ],
        "dropTitles": [
            "Matrix", 
            "Units", 
            "Collection period",
            "Statistics"
        ],
        "dropOrder": [0, 0, 0, 0],
        "dropOptions":[
            ["blood", "plasma", "serum"],
            ["pmol/g Hb"],
            [
                "3 (2012-2013)", 
                "4 (2014-2015)", 
                "5 (2016-2017)", 
                "6 (2018-2019)"
            ],
            [
                "Geometric mean",
                "Geometric mean and 95th percentile",
                "50th percentile",
                "50th percentile and 95th percentile"
            ]
        ],
        "dropMulti": [false, false, true, false],
        "dropSearch": [false, false, false, false], 
        "dropInit": [true, true, true, true]
    }
] 
```

**Valid key-value pairs to adjust dropdown settings:**
- `sectionID (type: string)`: a unique string value is required. This will set the id of the div housing each section.
- `sectionTitle (type: string, optional)`: creates a heading for each section. 
- `sectionOrder (type: number)`: a number greater than 0 is required. 
  - Think of this as the index of a section in an array. The 0th section will be shown first, then the 1st section, then the 2nd, and so on. 
  - Before the next section is shown, the user must pick a value for a dropdown in the last section. 
  - Duplicate values mean that multiple sections will show at the same time. This is equivalent to default behaviour (no form section logic is applied).
- `dropIDs (type: array)`: 1+ unique string values are required. The number of strings determine the number of dropdowns. They will set the ids of the divs housing each dropdown.
- `dropTitles (type: array)`: 1+ string values are required. The length of this array must be the same as `dropIDs`. Each string will set the label of each dropdown. 
- `dropOrder (type: array)`: 1+ number values greater than 0 are required. The length of this array must be the same as `dropIDs`.
  - Think of this as the index of a dropdown in an array. The 0th dropdown will be shown first, then the 1st dropdown, then the 2nd, and so on. 
  - Before the next dropdown is shown, the user must pick a value for the current dropdowns. 
  - Duplicate values mean that multiple dropdowns will show at the same time. This is equivalent to default behaviour (no form section logic is applied).
- `dropOptions (type: array of arrays)`: this array must contain 1+ nested subarrays. The length of this array must be the same as `dropIDs`. 
  - The array has a nested subarray for each dropdown. Each nested subarray contains strings showing dropdown options.
- `dropMulti (type: array)`: 1+ boolean values are required. The length of this array must be the same as `dropIDs`. Each boolean will determine if multiple selections are allowed in each dropdown.
- `dropSearch (type: array)`: 1+ boolean values are required. The length of this array must be the same as `dropIDs`. Each boolean will determine if text-search to filter options is enabled in each dropdown.
- `dropInit (type: array)`: 1+ boolean values are required. The length of this array must be the same as `dropIDs`. Each boolean will determine if each dropdown autoselects an option on render.
  - Note: dropdowns with multiple selections enabled autoselect all options. Dropdowns with multiple selections disabled autoselect the first option.
  - Note: if the above autoselect behaviours aren't what you're looking for, you can select whichever options you'd like with the `classInstance.setActiveOption()` method. 

&nbsp;

&nbsp;


# State Field (Special)
`classInstance.state (type: object of object(s) of array(s) of object(s))`

This is a public field with information about which dropdown options the user has selected at any moment. 

**Please do not write to the state value.** 

This field can be read at any time using `classInstance.state`. However, you will find it more interesting to set a callback function to the `onStateUpdate` field. Your callback function will be passed the `state` field as an argument whenever the dropdowns are updated. 

**How to interpret the state value**:

Here is an example state value:
```json
{
    "chemical-section": {
        "Biomarker": [{"id":83, "val":"lead"}]
    },
    "measurements-section": {
        "Matrix": [{"id":0, "val":"blood"}],
        "Units": [{"id":0, "val":"pmol/g Hb"}],
        "Cycle_Years": [
            {"id":2, "val":"3 (2012-2013)", "new":true},
            {"id":3, "val":"4 (2014-2015)", "new":true},
            {"id":4, "val":"5 (2016-2017)", "new":true},
            {"id":5, "val":"6 (2018-2019)", "new":true}
        ],
        "stats": [{"id":0, "val":"Geometric mean"}]
    },
    "dpd-updated":"stats"
} 
```

1. The object contains a key for every section in `classInstance.sections`. Each key is a section ID specified in the `sectionID` fields of `classInstance.sections`. Each key has a nested object as its value. 
    1. There is also a key called `dpd-updated`. It has a string value of the last dropdown ID that was updated (specified in the `dropID` fields of `classInstance.sections`). 
2. The nested object contains data about the dropdowns in that section. Specifically, it has a key for each dropdown ID in that section. Each key has an array as a value. 
3. The array has an object for each option selected in the dropdown. This means single select dropdowns will have a maximum of one object in this array.
    1. Each object has two fields: a `val` (the `innerText` of the option selected) and `id` (part of the `id` of the option selected). A third field `new` may be provided when a dropdown is first rendered and a value has been autoselected. 
    2. Note that the html `id` attribute of each option selected is different from the `id` field above. The HTML `id` attribute has the following format: `${dropID}-dpd-option-${id}`. In other words, the `id` field specifies the changing part of the HTML `id` attribute for different options of a dropdown.

&nbsp;

&nbsp;


# Public Fields
None

&nbsp;


# Public Methods


`init()`

**Description**

- Renders the dropdowns to the parent specified in the `rootDOM` field.

**Parameters**

None, but this method relies on all fields. Especially be sure to initialise `rootDOM` and `sections` before calling this method.

**Returns** 
None

-----

`modifySetting(id, key, val)`

**Description**

- Adjusts a setting specified in the `sections` field.
- **Warning: changes made in the sections field will not take effect unless you call the `resetSection()` method documented below.**

**Parameters**

- `id (type: string)`: a valid section ID to find the section to modify the setting of.
- `key (type: string)`: a key in the sections objects to specify which setting to modify. 
  - Valid keys are: `sectionID`, `sectionOrder`, `dropIDs`, `dropTitles`, `dropOrder`, `dropOptions`, `dropMulti`, `dropSearch`, and `dropInit`. See [the heading on the sections field](#sections-field-special) for more details.
- `val (type: varies)`: the value to update the setting above. Could be a number, string, or array.
 

**Returns** 
None

-----

`pushSection(sectionObject)`

**Description**

- Adds a new section's settings to the `sections` field.

**Parameters**

- `sectionObject (type: object)`:  See [the heading on the sections field](#sections-field-special) for more details on the format of a valid object. 

**Returns** 
None

-----

`resetSection(sectionID, dropdownID)`

**Description**

- Re-renders the specified dropdown, section, or form. 
- Usually, you'll call this method after you update a dropdown's settings. 

**Parameters**

- `sectionID (type: string, optional)`: a valid section ID to identify the section to re-render. If none is provided, all sections will be re-rendered.
- `dropdownID (type: string, optional)`: a valid dropdown ID to identify the dropdown to re-render. If none is provided, but a `sectionID` is provided, all dropdowns in a section will be re-rendered.

**Returns** 
None

-----

`setActiveOption(sectionID, dropdownID, optionVals)`

**Description**

- Programmatically selects an option in the specified dropdown. 
- **Useful to enable autofill behaviours**. 

**Parameters**

- `sectionID (type: string, optional)`: a valid section ID to identify the section containing the dropdown.
- `dropdownID (type: string, optional)`: a valid dropdown ID to identify the dropdown to adjust options of.
- `optionVals (type: array)`: an array of 0 or more strings that exactly match the `innerText` of the options dropdown to adjust. The string(s) will indicate the option(s) to select.

**Returns** 
None, though **any callback function specified in the `onStateUpdate` field will be called**.

-----

&nbsp;

&nbsp;


# Private Fields
`#onStateUpdate` (type: function):
- A callback function to pass the `state` field to when selected dropdowns change. 

`#rootDOM` (DOM Element):
- A parent DOM element to house the dropdowns generated.
- Warning: **all innerHTML of this element is cleared** when you initialise the dropdowns. Please ensure no other children are present/added to the passed DOM element. 
- Warning: **the value you set to this field is not validated. Any bugs due to incorrect values are your responsibility.**

`#vertical` (type: boolean, default true):
- If multiple dropdowns are present, whether to put one dropdown on top of the other instead of side to side.

`#expanded` (type: object):
- This isn't a field for class users to interact with. It's used internally to track which dropdowns are expanded (have their options showing).

`#queries` (type: object):
- This isn't a field for class users to interact with. It's used internally to track searches in searchable dropdowns.

`#ignoreBlur` (type: boolean):
- This isn't a field for class users to interact with. It's used internally to over-ride blur events when a user interacts with dropdown options.

&nbsp;

&nbsp;

# Private Methods
This documentation is left to help in fixing bugs. **There may be bugs on searchable mobile dropdowns**.

Methods related to rendering the dropdown:

`#makeSection(form, sectionData, existing)`

**Description**

- Internal method called by `init()`. Creates DOM elements related to each section of the form. 

**Parameters**

- `form (type: DOM element)`: The parent form to append the section to.
- `sectionData (type: object)`: An object with settings for the current section.
- `existing (type: DOM element)`: An existing section div. Used when resetting specific sections, so existing divs aren't over-written.

**Returns** 
None

-----

`#makeSubsection(section, sectionData, order, existing)`

**Description**

- Internal method called by `makeSection()`. Creates DOM elements to wrap each dropdown in. 

**Parameters**

- `section (type: DOM element)`: A parent section div to append dropdown wrappers to.
- `sectionData (type: object)`: An object with settings for the current section.
- `order (type: Number)`: The order that the dropdown will be displayed in.
- `existing (type: array)`: Array with an existing subsection DOM element and dropdown index. Used when resetting specific dropdowns, so existing subsection dropdown wrappers aren't overwritten.


**Returns** 
None

-----

#makeComboListBox(subsection, sectionData, j)

#makeComboNormal(combo, sid, id, sectionData, j, initSelected = true)

#makeComboSearch(combo, sid, id, sectionData, j)

#makeOptions(wrapper, optionArr, id, initAllSelected = true)

Event handler methods:

#focusOption(i, id, combo, prev)

#selectOption(i, sid, id, combo) 

#managePopup(sid, id, combo, expanded, callFocus = true) 

#onComboBlur(e)

#onComboKeyDown(e)

#onComboType(id, combo)

#onPointerUp(e)

Helper methods:

#multiStateUpdateHelper(sid, id, i, addState)

#appearanceChangesHelper(wrapper, combo, sid, id)