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
    1. There is also a key called `dpd-updated`. It has a string value of the last dropdown id that was updated (specified in the `dropID` fields of `classInstance.sections`). 
2. Each nested subobject contains data about the dropdowns in that section. Specifically, it has a 

# Public Fields (Other)
#onStateUpdate = () => null;

#rootDOM;

#vertical = true;

# Public Methods
init()

modifySetting(id, key, val)

pushSection(inputData)

resetSection(sid, id)

setActiveOption(sid, id, optionVals)

# Private Fields
#expanded = {};

#queries = {};

#ignoreBlur;

# Private Methods
#makeSection(form, sectionData, provided)

#makeSubsection(section, sectionData, order, provided)

#makeComboListBox(subsection, sectionData, j)

#makeComboNormal(combo, sid, id, sectionData, j, initSelected = true)

#makeComboSearch(combo, sid, id, sectionData, j)

#makeOptions(wrapper, optionArr, id, initAllSelected = true)

#multiStateUpdateHelper(sid, id, i, addState)

#appearanceChangesHelper(wrapper, combo, sid, id)

#focusOption(i, id, combo, prev)

#selectOption(i, sid, id, combo) 

#managePopup(sid, id, combo, expanded, callFocus = true) 

#onComboBlur(e)

#onComboKeyDown(e)

#onComboType(id, combo)

#onPointerUp(e)