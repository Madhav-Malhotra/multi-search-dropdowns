/* 

This program is derived from W3C patterns at:
https://www.w3.org/WAI/ARIA/apg/patterns/

It is licensed according to the W3C Software License at
https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document

Copyright © 2022 W3C® (MIT, ERCIM, Keio, Beihang)

*/


// ============== HELPER FUNCTIONS ============== //
const actions = {
  'expand': 0,
  'collapse': 1,
  'next': 2,
  'prev': 3,
  'hideList': 4,
  'keyboard': 5,
}

function getAllIndices(arr, val) {
  /* Get all indices of a value in an array */
  
  let indices = [];
  let i = -1;
  
  do {
    i = arr.indexOf(val, i+1);
    if (i != -1) indices.push(i);
  } while (i != -1)
  
  return indices;
}

function filterOptions(arr, query) {
  /*
  Searches array of options for ones that match query. 
  
  Parameters
  -----------------
  arr (type: array)
  - An array of 1+ DOM Elements representing dropdown options
  query (type: string)
  - Substring to search for in above options' innerText. 
  
  Returns
  -----------------
  type: array
  - String(s) of input array that included input query.
  */
  
  const out = [];
  query = query.toLowerCase();
  
  for (let el of arr) {
    const text = el.innerText.toLowerCase();
    if (String(text).includes(query)) out.push(el);
  }
  
  return out;
}

function key2Action(keyEvent, dropExpanded, searchAllowed) {
  /* 
  Maps key event to action to perform 
  
  Parameters
  ---------------------
  keyEvent (type: DOM Event)
  - Used to get properties from key press event event. 
  dropExpanded (type: Boolean)
  - Whether the dropdown is currently expanded.
  searchAllowed (type: Boolean)
  - Whether to use search typing actions with current drop.
  
  Returns
  ---------------------
  type: int
  - A code reperenting the action to perform
  */
  
  let key = keyEvent.key;
  const nonSymbolKeys = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Backspace', 
    'Clear']
  if (!nonSymbolKeys.includes(key) && key.length !== 1) {
    key = keyEvent.currentTarget.value;
    if (!key) return;
    key = key.slice(key.length - 1);
  };


  // Expand dropdown
  if (!dropExpanded) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
      return actions.expand;
    }
  }
  
  // Shortcuts when dropdown already expanded
  if (dropExpanded) {
    if (key === 'ArrowUp') {
      return actions.prev;
    } else if (key === 'ArrowDown') {
      return actions.next;
    } else if (key === 'Escape') {
      return actions.collapse;
    } 
    // Note different shortcuts to close searchable vs. regular drops
    else if (!searchAllowed && (key === 'Enter' || key === ' ')) {
      return actions.hideList;
    } else if (searchAllowed && key === 'Enter') {
      return actions.hideList;
    }
    // Typing for search
    else if (
      searchAllowed &&
      (key === 'Backspace' ||
      key === 'Clear' || 
      (key.length === 1)
      )) {
      return actions.keyboard;
    }
  }
}

function getNewIndex(currentOp, maxOp, action) {
  /* 
  Returns ID of newly-selected dropdown after keystroke.
  
  Parameters
  -------------------
  currentOp (type: Number)
  - index of current option in listbox.
  - Ie. An index of i means the option is the ith child of the listbox.
  maxOp (type: Number)
  - The number of options in the listbox 
  action (type: Number)
  - A code that represents which change is requested in the listbox selection
  - See actions global object at top of script for more info. 
  
  Returns
  --------------------
  Number
  - The new index of the option to select in the listbox. 
  - Ex: On returning j, the jth child of the lsitbox will be selected. 
  */
  
  
  // Check input for issues
  currentOp = parseInt(currentOp);
  maxOp = parseInt(maxOp);
  
  if (typeof currentOp != 'number' || typeof maxOp != 'number') {
    console.error('Index of active element could not be read as integer');
    return currentOp;
  }
  
  // Calculate new index
  if (action === actions.next) {
    return Math.min(currentOp + 1, maxOp);
  } else if (action === actions.prev) {
    return Math.max(currentOp - 1, 0);
  } else {
    return currentOp;
  }
}

function isVisible(el) {
  /* Checks if specified domEl is in browser viewport. */
  
  const boundBox = el.getBoundingClientRect();

  return (
    boundBox.top >= 0 &&
    boundBox.left >= 0 &&
    boundBox.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    boundBox.right <=
      (window.innerWidth || document.documentElement.clientWidth)
  );
}

function isScrollable(el) {
  /* Checks if specified el has enough height to scroll */
  return el && el.clientHeight < el.scrollHeight;
}

function adjustScroll(c, p) {
  /* Scroll parent DOM el (p) to ensure child DOM el (c) is visible */
  
  // child above parent
  if (c.offsetTop < p.scrollTop) {
    p.scrollTo(0, c.offsetTop);
  }
  // child below parent
  else if (c.offsetTop + c.offsetHeight > p.scrollTop + p.offsetHeight) {
    p.scrollTo(0, c.offsetTop - p.offsetHeight + c.offsetHeight);
  }
}



// ================= MAIN CLASS ================= // 
export class Dropdown {
  // Declare user-interactable fields
  #onStateUpdate = () => null;
  #rootDOM;
  #sections = [];
  #vertical = true;
  #controlLabels = {
    'select': 'Select all', 
    'deselect': 'Deselect all', 
    'search': 'Type to search',
    'numSelect': 'options selected'
  };
  state = {};
  
  // Declare other fields.
  #expanded = {};
  #queries = {};
  #ignoreBlur;
  
  // Getter methods
  get onStateUpdate() { return this.#onStateUpdate; }
  get rootDOM() { return this.#rootDOM; }
  get sections() { return this.#sections; }
  get state() { return this.state; }
  get vertical() { return this.#vertical; }
  get controlLabels() { return this.#controlLabels; }
  
  // Setter methods
  set rootDOM(domEl) {
    /* This setter method is UNPROTECTED. 
    It requires a valid DOM element to be the parent of the created dropdown.
    Ensuring this is your responsibility. */
    this.#rootDOM = domEl;
  }
  set onStateUpdate(callback) {
    /* Input callback must take an object as its first parameter. */
    
    if (typeof callback === 'function') {
      this.#onStateUpdate = callback;
    } else console.error('callback must be a function.');
  }
  set sections(list) {
    const validArr = Array.isArray(list);
    
    let hasObjs = true;
    for (let el of list) {
      hasObjs = hasObjs && (typeof el === 'object');
    }
    
    if (validArr && hasObjs) this.#sections = list;
    else console.error('list must be an array with 1+ object(s) as element(s)');
  }
  set vertical(inputBool) {
    if (typeof inputBool === typeof true) this.#vertical = inputBool;
    else console.error('inputBool must be a Boolean value');
  }
  set controlLabels(inputArr) {
    if (Array.isArray(inputArr) && inputArr.length === 4) {
      this.#controlLabels = {
        'select': inputArr[0], 
        'deselect': inputArr[1], 
        'search': inputArr[2],
        'numSelect': inputArr[3]
      };
    } else console.error("controlLabels must be an array of four strings: alternative labels for the 'Select all' button, 'Deselect all' button, 'Type to search options' placeholder, and 'NUM options selected' placeholder.")
  }
  
  // Builder Methods
  init() {
    /*
    Initialises the form. Please set #sections and #rootDOM before using.
    
    Parameters
    -------------------
    undefined
    - But depends on #sections and #rootDom
    
    Returns
    -------------------
    undefined
    */
    
    this.#rootDOM.innerHTML = '';
    
    const form = document.createElement('div');
    form.className = 'dpd-form';
    if (!this.#vertical) form.classList.add('dpd-horizontal');
    
    // Build section state and HTML
    for (let i = 0; i < this.#sections.length; i++) {
      const section = this.#sections[i];
      this.state[section.sectionID] = {};
      this.#makeSection(form, this.#sections[i]);
    }
    
    this.#rootDOM.appendChild(form);
    
    // Collapse dropdowns on external clicks
    document.body.addEventListener('pointerup', this.#onPointerUp.bind(this));
  }
  
  #makeSection(form, sectionData, provided) {
    /*
    Generates raw HTML for each section of the dropdown form.
    
    Parameters
    -------------------
    form (DOM Element)
    - The form element to append the section to as a child.
    sectionData (object)
    - An object with settings for the current section.
    provided (type: DOM element)
    - A provided section div. Mainly used for resets
    
    Returns
    -------------------
    undefined
    */
    
    // Init elements
    let section = document.createElement('div');
    if (provided) section = provided;
    if (!provided) form.appendChild(section);
    
    const header = document.createElement('h4');
    
    // Init classes
    section.classList.add('dpd-section');
    if (sectionData['sectionOrder'] != 0) section.classList.add('dpd-hidden');
    
    // Init dataset
    section.dataset.order = sectionData['sectionOrder'];
    section.dataset.name = sectionData['sectionID'];
    
    // Init header
    if (sectionData['sectionTitle']) {
      header.innerText = sectionData['sectionTitle'];
      header.className = 'dpd-section-header';
      section.appendChild(header); 
    }
    
    const maxOrder = Math.max(...sectionData['dropOrder']) + 1;
    
    // Run through all dropdowns with current order priority.
    for (let order = 0; order < maxOrder; order++) {
      this.#makeSubsection(section, sectionData, order);
    }
  }
  
  #makeSubsection(section, sectionData, order, provided) {
    /* 
    Helper method used by makeSection to initialise subgroups 
    to wrap dropdowns in. 
    
    Parameters
    -----------------
    section (type: DOM element)
    - Parent container for subsection. 
    sectionData (type: Object)
    - has various data useful for initialising current object
    order (type: Number)
    - The order that the subsection will be displayed in. 
    provided (type: array)
    - Object with subsection dom el and sectionData reference index
    - Used when resetting specific sections.
    
    Returns
    -----------------
    undefined
    */
    
    let subdrops = getAllIndices(sectionData['dropOrder'], order);
    if (provided) subdrops = provided.index;
    
    for (let j of subdrops) {
      // Create subsection
      let subsection = document.createElement('div');
      if (!provided) section.appendChild(subsection);
      else subsection = provided.dom;
      
      // Build state
      const sid = sectionData['sectionID'];
      const id = sectionData['dropIDs'][j];
      this.state[sid][id] = [];
      
      // Set label info
      const label = document.createElement('label');
      label.innerText = sectionData['dropTitles'][j];
      label.id = `${sectionData['dropIDs'][j]}-dpd-label`;
      label.className = 'dpd-label';
      label.setAttribute('for', `${sectionData['dropIDs'][j]}-dpd-combobox`);
      subsection.appendChild(label);
      
      // Wrap current dropdown and label in a convenient container
      subsection.className = 'dpd-section-group';
      subsection.dataset.order = sectionData['dropOrder'][j];
      subsection.dataset.name = sectionData['dropIDs'][j];
      if (sectionData['disabled'] && sectionData['disabled'][j]) {
        subsection.disabled = true;
        subsection.setAttribute('aria-disabled', true);
      }
      
      // Make combobox
      this.#makeComboListBox(subsection, sectionData, j);
      
      // Hide dropdowns at high order to begin
      if (order != 0) subsection.classList.add('dpd-hidden');
    }
  }
  
  #makeComboListBox(subsection, sectionData, j) {
    /* 
    Helper method used by makeSubsection to init accessible combobox and 
    listbox. 
    
    Parameters
    -----------------
    subsection (type: DOM Element)
    - Parent container to house combobox/listbox in. 
    sectionData (type: Object)
    - Useful data for initialising combobox/listbox
    j (type: Number)
    - Index to identify dropdown being created (out of all drops in subsection)
    
    Returns
    -----------------
    undefined
    */
    
    const id = sectionData['dropIDs'][j];
    const sid = sectionData['sectionID'];
    let initSelected = true;
    if (sectionData['dropInit'] && typeof sectionData['dropInit'][j] === 'boolean')
      initSelected = sectionData['dropInit'][j];
    
    // Create els and append els
    const wrapper = document.createElement('div');
    const combo = document.createElement('div');
    const list = document.createElement('div');
    
    subsection.appendChild(wrapper);
    wrapper.appendChild(combo);
    wrapper.appendChild(list);
    
    // Adjust wrapper
    wrapper.className = 'dpd-accessible-selector';
    if (sectionData['dropMulti'][j]) wrapper.dataset.multi = true;
    if (sectionData['dropSearch'][j]) wrapper.dataset.search = true;
    
    // Adjust combobox
    if (sectionData['dropSearch'][j])
      this.#makeComboSearch(combo, sid, id, sectionData, j);
    else this.#makeComboNormal(combo, sid, id, sectionData, j, initSelected);
    
    // Adjust listbox
    list.setAttribute('class', 'dpd-listbox');
    list.setAttribute('role', 'listbox');
    list.setAttribute('id', `${id}-dpd-listbox`);
    list.setAttribute('aria-labelledby', `${id}-dpd-label`);
    list.setAttribute('tabindex', -1);
    
    list.onblur = () => {
      if (wrapper.dataset.multi) {
        this.#managePopup(sid, id, combo, false, false);
      }
    };
    
    // Make options
    this.#makeOptions(wrapper, sectionData['dropOptions'][j], id, initSelected);
  }
  
  #makeComboNormal(combo, sid, id, sectionData, j, initSelected = true) {
    /* Helper method used by makeComboListBox */
    
    // Adjust combobox (HTML)
    combo.id = `${id}-dpd-combobox`;
    combo.className = 'dpd-combo';
    
    // Default to first el selected (unless multiselect)
    combo.innerText = sectionData['dropOptions'][j][0];
    if (combo.parentNode.dataset.multi && initSelected) 
      combo.innerText = 
        `${sectionData['dropOptions'][j].length} ${this.controlLabels['numSelect']}`;
    else if (!initSelected) 
      combo.innerText = `0 ${this.controlLabels['numSelect']}`;
      
      
    // Check if disabled
    const disabled = sectionData['disabled'] && sectionData['disabled'][j];

    // Adjust combobox (ARIA)
    this.#expanded[id] = false;
    combo.setAttribute('aria-expanded', false);
    combo.setAttribute('aria-controls', `${id}-dpd-listbox`);
    combo.setAttribute('aria-haspopup', 'listbox');
    combo.setAttribute('aria-labelledby', `${id}-dpd-label`);
    combo.setAttribute('role', 'combobox');
    combo.setAttribute('tabindex', disabled ? -1 : 0);
    if (disabled) {
      combo.disabled = true;
      combo.setAttribute('aria-disabled', 'true');
    }
    
    // Adjust combobox (event handlers)
    if (!disabled) {
      combo.addEventListener('blur', this.#onComboBlur.bind(this));
      combo.addEventListener('keyup', this.#onComboKeyUp.bind(this));
      combo.addEventListener('click', () => {
        this.#managePopup(sid, id, combo, !this.open, false);
      });
    }
  }
  
  #makeComboSearch(combo, sid, id, sectionData, j) {
    /* Helper method used by makeComboListBox */
    
    const search = document.createElement('input');

    // Adjust search (HTML)
    search.id = `${id}-dpd-combobox`;
    search.className = 'dpd-combo';
    search.type = 'text';
    search.placeholder = this.#controlLabels['search'];
    
    // check if disabled
    const disabled = sectionData['disabled'] && sectionData['disabled'][j];
    if (disabled) {
      search.disabled = true;
      search.setAttribute('aria-disabled', true);
      search.setAttribute('tabIndex', -1);
      combo.disabled = true;
      combo.setAttribute('aria-disabled', true);
    }
    
    // Adjust search (ARIA)
    this.#expanded[id] = false;
    search.setAttribute('aria-expanded', false);
    search.setAttribute('aria-controls', `${id}-dpd-listbox`);
    search.setAttribute('aria-labelledby', `${id}-dpd-label`);
    search.setAttribute('role', 'combobox');
    search.setAttribute('aria-autocomplete', 'list');
    
    // Adjust search (event listeners)
    if (!disabled) {
      search.addEventListener('blur', this.#onComboBlur.bind(this));
      search.addEventListener('keyup', this.#onComboKeyUp.bind(this));
      search.addEventListener('click', () => {
        this.#managePopup(sid, id, search, !this.open, false);
      });
      search.addEventListener('focus', () => {
        this.#managePopup(sid, id, search, true, false);
      });
    }
    
    // Turn combobox into container that will house searchbar
    combo.className = 'dpd-search-group';
    combo.appendChild(search);
  }
  
  #makeOptions(wrapper, optionArr, id, initAllSelected = true) {
    /*
    Appends options to listbox. 
    
    Parameters
    ----------------------
    wrapper (type: DOM Element)
    - Container housing listbox and combobox. 
    optionArr (type: Array)
    - Array of strings to display for each option in the listbox. 
    id (type: string)
    - An ID to identify the current field. 
    initAllSelected (type: boolean)
    - whether to initialize all options as selected
    
    Returns
    ----------------------
    undefined
    */
    
    // Extract info
    const combo = wrapper.querySelector('.dpd-combo');
    const listbox = wrapper.querySelector('.dpd-listbox');
    const sid = wrapper.parentNode.parentNode.dataset.name;
    const multi = wrapper.dataset.multi;
    
    // auto select option if only one
    let autoselect = false;
    if (optionArr.length === 1) autoselect = true;
    
    // Special all option for multiple selectors only
    if (multi) {
      optionArr = [this.#controlLabels['select'], this.#controlLabels['deselect'], 
        ...optionArr];
    }
    
    
    // For each option in array, build HTML tags
    for (let i = 0; i < optionArr.length; i++) {
      const option = document.createElement('div');
      listbox.appendChild(option);
      
      // HTML Settings
      option.innerText = optionArr[i];
      option.dataset.name = optionArr[i];
      option.id = `${id}-dpd-option-${i}`;
      option.classList.add('dpd-option');
      
      // determine active element and select all button
      const active = autoselect ||
        (!multi && i === 0 && initAllSelected) || 
        (multi && initAllSelected && i !== 1);
      
      if (multi && [0, 1].includes(i)) 
        option.classList.add('dpd-option-select-all');
      
      // focus on the first element
      if (i === 0) option.classList.add('dpd-focused');
      
      // update state
      if (active && !(multi && [0, 1].includes(i)) ) {
        this.state[sid][id].push({
          'id': i,
          'val': option.innerText,
          'new': true
        });
      }
      
      // ARIA settings
      option.setAttribute('aria-selected', active);
      option.setAttribute('role', 'option');
      
      // Event listeners
      option.onclick = (e) => {
        let multiFocusCall = e.clientY ? true : false;
        
        e.stopPropagation();
        this.#focusOption(i, id, combo);
        this.#selectOption(i, sid, id, combo);
        
        // Don't close multiselect on option select.
        if (multi) this.#managePopup(sid, id, combo, multiFocusCall);
        else this.#managePopup(sid, id, combo, false, false);
      }
      // Stops native blur from taking focus away from combobox
      option.onmousedown = () => {this.#ignoreBlur = true}; 
      
      if (autoselect) setTimeout(()=>option.click(), 1);
    }
  }
  
  // Helper Methods (functional)
  modifySetting(id, key, val) {
    /*
    Change a setting for a section in the dropdown menu
    
    Parameters
    ------------------------------
    id (type: string)
    - The name of the section to modify
    key (type: string)
    - The key of the section object to modify
    - Represents the setting to adjust
    val (type: any)
    - The value to set the key to
    
    Returns
    ------------------------------
    undefined
    */
    
    let validID = false;
    let validKey = false;
    let sectionData;
    
    // Find the right section
    for (let i = 0; i < this.#sections.length; i++) {
      const h = this.#sections[i];
      if (h.sectionID != id) continue;
      validID = true; sectionData = h;
      
      // Find the right key
      for (let k of Object.keys(h)) {
        if (k != key) continue;
        // Adjust its value
        if (val) h[k] = val;
        validKey = true;
      }
    }
    
    if (!validID) console.error(`section with ID: ${id} not found.`);
    else if (!validKey && val) 
      console.error(`section ${id} does not have key ${key}`);
    
    if (validID) return sectionData;
  }
  
  pushSection(inputData) {
    /* 
    Appends section to the end of the sections array
    
    Parameters
    ----------------
    inputData (type: obj)
    - Object with settings for a setting. 
    - Object will be shown at the bottom of the dropdowns section.
    
    Returns
    ----------------
    undefined
    */
  
    let valid = true;
    
    if ((typeof inputData != typeof {}) 
      || (Object.keys(inputData).length < 1)
      || (typeof this.#sections != typeof [])) {
        valid = false;
    }
    
    if (valid) this.#sections.push(inputData);
    else console.error('Ensure inputData is an object with 1+ fields and that \
    #sections has been initialised');
  }
  
  resetSection(sid, id) {
    /* 
    Reset a specified dropdown
    
    Parameters
    --------------------
    sid (type: string)
    - The id of the section to reset
    id (type: string)
    - The id of the drop down to reset
    
    Returns
    --------------------
    undefined
    */
    
    // Gather info
    const form = this.#rootDOM.querySelector('.dpd-form');
    
    // Reset everything
    if (sid === undefined && id === undefined) {
      form.remove();
      
      this.state = {}; this.#expanded = {}; this.#queries = {};
      this.init();
      return;
    }
    
    
    // Validate input
    const validSID = (typeof sid === 'string') && (this.state[sid]);
    const validID = (validSID) && (typeof id === 'string') 
      && (this.state[sid][id]);
      
    // Gather info
    const section = 
        this.#rootDOM.querySelector(`.dpd-section[data-name=${sid}]`);
    let drops = Array.from(section.querySelectorAll('.dpd-section-group'));
    // modifySetting not sent val, so simply returns existing section data
    const sectionData = this.modifySetting(sid);
      
    
    // Reset section only  
    if (validSID && !validID) {
      let ids = drops.map(d => d.dataset.name);
      
      // Clear away old data
      section.innerHTML = ''; this.state[sid] = {}; 
      for (let id of ids) {
        this.#expanded[id] = undefined;
        this.#queries[id] = undefined;
      }
      
      // reset the section 
      this.#makeSection(form, sectionData, section);
      return;
    }
    
    
    // Reset dropdown only
    if (validSID && validID) {
      for (let d of drops) {
        if (d.dataset.name != id) continue;
        const j = sectionData['dropIDs'].indexOf(d.dataset.name);
        
        // Clear old data
        d.innerHTML = ''; this.state[sid][id] = [];
        this.#expanded[id] = undefined;
        this.#queries[id] = undefined;
        
        // Reset the dropdown
        this.#makeSubsection(section, sectionData, 0, 
          { 'index': [j], 'dom': d });
      }
    }
    
    
  }
  
  setActiveOption(sid, id, optionVals) {
    /*
    Adjusts the active option of specified dropdown.
    
    Parameters
    --------------------
    sid (type: string)
    - the id of the section with the dropdown
    id (type: string)
    - the id of the drop down to change
    optionVals (type: array)
    - the text value(s) of the option(s) to set active
    
    Returns
    --------------------
    undefined
    */
    
    // Prepare to reset options
    const options = this.#rootDOM.querySelectorAll(
      `.dpd-section[data-name="${sid}"] #${id}-dpd-listbox .dpd-option`);
    const combo = this.#rootDOM.querySelector(
      `.dpd-section[data-name="${sid}"] #${id}-dpd-combobox`);
    optionVals = optionVals.map(option => option.toLowerCase());
    
    if (options.length) {
      this.state[sid][id] = [];
      this.state['dpd-updated'] = id;
    }
    
    // Helper func
    const updateComboName = () => {
      if (!combo.dataset.search) {
        let active = 0;
        options.forEach(o => {
          if (o.getAttribute('aria-selected') === 'true') active += 1;
        });
        if (active != 1) combo.innerText = 
          `${active} ${this.controlLabels['numSelect']}`;
      }
      
      this.#managePopup(sid, id, combo, false, false);
    };
    
    
    for (let o of options) {
      // sets matching options to checked
      if (optionVals.includes(o.dataset.name.toLowerCase())) {
        o.click();
        
        setTimeout(() => {
          if (o.getAttribute('aria-selected') != 'true')  {
            o.setAttribute('aria-selected', true);
            o.classList.add('dpd-focused');
          }
          
          updateComboName();
          
          this.#onStateUpdate(this.state); 
        }, 50)
      } 
      // sets non matching options unchecked
      else {
        o.setAttribute('aria-selected', false);
        o.classList.remove('dpd-focused');
      }
    }
    
    updateComboName();
  }
  
  #multiStateUpdateHelper(sid, id, i, addState) {
    /* Helper function for #selectOption to update record of selected vals */
    
    let exists = false;
      
    for (let j = 0; j < this.state[sid][id].length; j++) {
      const el = this.state[sid][id][j];
      
      if (el.id == i) {
        exists = true;
        this.state[sid][id].splice(j, 1);
        break;
      }
    }
    
    if (!exists) this.state[sid][id].push(addState);
  }
  
  #appearanceChangesHelper(wrapper, combo, sid, id) {
    /* Helper function for selectOption to update appearance of selected vals */
    
    // Update ARIA to clear checkmarks
    const options = Array.from(wrapper.querySelectorAll('.dpd-option'));
    for (let o of options) {
      o.setAttribute('aria-selected', false);
    }
    
    // Update ARIA to show checkmarks
    for (let j = 0; j < this.state[sid][id].length; j++) {
      const target = this.state[sid][id][j]['id'];
      options[target].setAttribute('aria-selected', true);
    }
    
    // Update combo text
    let modifyAttr = combo.tagName === 'DIV' ? 'innerText' : 'placeholder';
    const message = (this.state[sid][id].length == 1) ? 
      this.state[sid][id][0].val :
      `${this.state[sid][id].length} ${this.controlLabels['numSelect']}`;
    
    combo[modifyAttr] = message;
    if (wrapper.dataset.search && !wrapper.dataset.multi) combo.value = '';
    if (modifyAttr === 'placeholder') this.#queries[id] = combo.value;
  }
  
  // Helper methods (event listeners)
  #focusOption(i, id, combo, prev) {
    /*
    Fires on when option is focused on (but not yet selected)
    
    Parameters
    ----------------
    i (type: Number)
    - Index representing which option of the listbox is focused on
    - Ex: A value of 2 means the 2nd option of the listbox is focused on
    id (type: String)
    - A unique id for the listbox. 
    combo (type: DOM Element)
    - The DOM element representing the combobox.
    prev (type: Boolean)
    - Whether to select the last option
    
    Returns
    ----------------
    undefined
    */
    
    // Select wrapper
    let wrapper = combo.parentNode;
    if (wrapper.classList.contains('dpd-search-group')) 
      wrapper = wrapper.parentNode;

    // run through options until you find one that's visible 
    let selected; 
    prev ? i += 1 : i -= 1;
    
    do {
      prev ? i -= 1 : i += 1;
      selected = this.#rootDOM.querySelector(`#${id}-dpd-option-${i}`);
      if (selected === null) return;
    } while (selected.classList.contains('dpd-invisible'))
    
    // Update ARIA
    combo.setAttribute('aria-activedescendant', selected.id);

    // Update focused option
    const options = Array.from(wrapper.querySelectorAll('.dpd-option'));
    for (let o of options) {
      o.classList.remove('dpd-focused');
    }
    selected.classList.add('dpd-focused');
  
    // ensure the new option is in view
    const listbox = wrapper.querySelector('.dpd-listbox');
    if (isScrollable(listbox)) adjustScroll(options[i], listbox);
  
    // ensure the new option is visible on screen
    // ensure the new option is in view
    if (!isVisible(options[i])) {
      options[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  
  #selectOption(i, sid, id, combo) {
    /*
    Fires when an option is selected. 
    
    Parameters
    ----------------
    i (type: Number)
    - Index representing which option of the listbox is focused on
    - Ex: A value of 2 means the 2nd option of the listbox is focused on
    sid (type: String)
    - A unique section id showing which section the listbox is in. 
    id (type: String)
    - A unique id for the listbox. 
    combo (type: DOM Element)
    - The DOM element representing the combobox.
    
    Returns
    ----------------
    undefined
    */
    
    // Prepare vars
    let wrapper = combo.parentNode;
    if (wrapper.classList.contains('dpd-search-group')) 
      wrapper = wrapper.parentNode;
      
    const selected = this.#rootDOM.querySelector(`#${id}-dpd-option-${i}`);
    const addState = {
      'id': i,
      'val': selected.innerText
    };
    
    // Update multistate
    if (wrapper.dataset.multi) {
      
      // Exception for special option
      if (selected.classList.contains('dpd-option-select-all')) {
        this.#selectAllMulti(selected, wrapper, combo, sid, id);
        return;
      }
        
      this.#multiStateUpdateHelper(sid, id, i, addState);
    } 
    
    // Update single state
    else this.state[sid][id][0] = addState; 
    this.#stateChange(combo);
  
    this.#appearanceChangesHelper(wrapper, combo, sid, id);
  }

  #managePopup(sid, id, combo, expanded, callFocus = true) {
    /*
    Adjusts combobox properties like expanded, active option, etc. 
    
    Parameters
    ----------------
    i (type: Number)
    - Index representing which option of the listbox is focused on
    - Ex: A value of 2 means the 2nd option of the listbox is focused on
    sid (type: String)
    - A unique section id showing which section the listbox is in. 
    id (type: String)
    - A unique id for the listbox. 
    combo (type: DOM Element)
    - The DOM element representing the combobox.
    callFocus (type: Boolean, default true)
    - Whether to restore focus to the combobox after making changes.
    
    Returns
    ----------------
    undefined
    */
    
    // No changes needed
    if (this.#expanded[id] === expanded) {
      return;
    }
    
    // Extract data
    let wrapper = combo.parentNode;
    if (wrapper.classList.contains('dpd-search-group')) 
      wrapper = wrapper.parentNode;
    
    let active = this.state[sid][id][0];
    if (active) active = active['id'];
  
    // Update data
    this.#expanded[id] = expanded;
  
    // Update styles
    combo.setAttribute('aria-expanded', `${expanded}`);
    if (expanded) wrapper.classList.add('dpd-expanded');
    else wrapper.classList.remove('dpd-expanded');

    // Update ARIA
    const activeID = (expanded && active) ? `${id}-dpd-option-${active}` : '';
    combo.setAttribute('aria-activedescendant', activeID);
  
  
    // Adjust scroll / focus
    if (activeID === '' && !isVisible(combo)) {
      combo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Adjust visibile elements
    if (expanded) {
      this.#onComboType(id, combo);
    }
  
    // Focus on combobox
    if (callFocus) combo.focus();
  }

  #onComboBlur(e) {
    /* Defines what happens to combobox after option selected */
    
    // Ignore click on something like the scrollbar 
    // (close to combobox, but not quite in the same div)
    if (e.relatedTarget) {
      const rel = e.relatedTarget;
      let wrapper = e.target.parentNode;
      if (wrapper.classList.contains('dpd-search-group')) 
        wrapper = wrapper.parentNode;
        
      if (wrapper.contains(rel)) return;
    }
    
    // Prevent blur when you click an option
    if (this.#ignoreBlur) {
      this.#ignoreBlur = false;
      return;
    }
    
    // Gather info for changes
    const [sid, id] = this.#getComboProps(e);
    
    const open = this.#expanded[id];
    
    // Make changes
    if (open) {
      this.#managePopup(sid, id, e.target, false, false);
    }
  }
  
  #onComboKeyUp(e) {
    /* Responds to key press inputs in combobox. */
    
    // Get data about combobox. 
    const [sid, id, active, expanded, searchable, max] 
      = this.#getComboProps(e, true);

    // Get key event and index of next element to be selected 
    const action = key2Action(e, expanded, searchable);
    const newIndex = getNewIndex(active, max, action);

    // Make changes based on event 
    // To future programmers: be careful about editing order of operations
    if (
      action === actions.prev || 
      action === actions.next) {
        e.preventDefault();
        this.#focusOption(newIndex, id, e.target, action === actions.prev);
    } else if (
      action === actions.hideList || 
      action === actions.collapse) {
        e.preventDefault();
        if (action === actions.hideList) {
          this.#selectOption(active, sid, id, e.target);
        }
        if (action === actions.collapse) {
          this.#managePopup(sid, id, e.target, false);
        }
    } else if (action === actions.keyboard) {
      this.#onComboType(id, e.target);
      
      // focus on new visible option
      setTimeout(() => {
        const visible = e.target.parentNode.parentNode
          .querySelector('.dpd-option:not(.dpd-invisible)');
        
        if (visible) {
          let [id, _, __, i] = visible.id.split('-');
          this.#focusOption(+i, id, e.target, false);
        }
      }, 100);
      
    } else if (action === actions.expand) {
      e.preventDefault();
      this.#managePopup(sid, id, e.target, true);
    }
  
  }
  
  #onComboType(id, combo) {
    /* Respond specifically when characters typed in searchable combobox */
  
    // Update search string (after waiting for it to update)
    setTimeout(() => {
      // No input validation since databases not affected and 
      // French characters would complicate things. 
      this.#queries[id] = combo.value;
      let options = combo.parentNode.parentNode.querySelectorAll('.dpd-option');
      this.#updateVisibleOptions(id, options);
    }, 10);
    
  }
  
  #onPointerUp(e) {
    /* Ensures combobox is collapsed when clicking outside it. */
    
    for (let k of Object.keys(this.#expanded)) {
      if (!this.#expanded[k]) {
        continue;
      }
      
      const combo = this.#rootDOM.querySelector(`#${k}-dpd-combobox`);
      const listbox = this.#rootDOM.querySelector(`#${k}-dpd-listbox`);

      if (!listbox.parentNode.contains(e.target)) {
        setTimeout(() => this.#onComboBlur({target: combo}), 10);
      }
    }
  }
  
  #selectAllMulti(selected, wrapper, combo, sid, id) {
    /* Handles clicks on the Select all/Deselect all buttons */
    
    // Reset state
    this.state[sid][id] = [];
    
    // get all options visible
    let options = Array.from(
      wrapper.querySelectorAll('.dpd-option:not(.dpd-invisible)')
    );
    
    for (let o of options) {
      // Get ID and skip ID of select all button
      let i = o.id.split('-');
      i = parseInt(i[i.length - 1]);
      
      if ([0, 1].includes(i)) continue;
      
      // run state updates 
      const addState = {
        'id': i,
        'val': o.innerText
      };
      
      if (selected.innerText === this.#controlLabels['select'])
        this.#multiStateUpdateHelper(sid, id, i, addState);
    }
    
    // run appearance updates
    this.#appearanceChangesHelper(wrapper, combo, sid, id);
    
    const selectButtons = wrapper.querySelectorAll('.dpd-option-select-all');
    for (let btn of selectButtons) {
      if (btn.innerText === selected.innerText) 
        btn.setAttribute('aria-selected', true);
      else btn.setAttribute('aria-selected', false);
    }
    
    this.#stateChange(combo);
  }
  
  #getComboProps(e, extended=false) {
    /* Helper function used by onComboBlur and onComboKeyUp */
    
    // Get basic data about section that combo is in
    const id = e.target.id.split('-')[0];
    let sid = e.target.parentNode.parentNode.parentNode;
    if (sid.classList.contains('dpd-section-group'))
      sid = sid.parentNode.dataset.name;
    else sid = sid.dataset.name;
    
    if (!extended) return [sid, id];
    
    // Get extended data about active/max element in combo
    let active, max; 
    
    active = e.target.parentNode;
    if (active.classList.contains('dpd-search-group')) {
      max = active.parentNode.querySelectorAll('.dpd-option').length - 1;
      active = active.parentNode.querySelector('.dpd-option.dpd-focused');
    } else {
      max = active.querySelectorAll('.dpd-option').length - 1;
      active = active.querySelector('.dpd-option.dpd-focused');
    }
    
    if (!active && this.state[sid][id][0]) {
      active = this.state[sid][id][0]['id'];
    } else if (!active) active = 0;
    else {
      active = active.id.split('-');
      active = active[active.length - 1];
    }
    
    // Get extended data about combo type
    const expanded = this.#expanded[id];
    const searchable = e.target.type === 'text';

    return [sid, id, active, expanded, searchable, max];
  }
  
  #updateVisibleOptions(id, options) {
    /* 
    Updates visibility of specified options using dropdown query. 
    
    Parameters
    ---------------
    id (type: string)
    - Identifies the dropdown query to be used when filtering. 
    options (type: array)
    - Array of DOM Elements to update the visibility of. 
    
    Returns
    ---------------
    undefined
    */
    
    if (this.#queries[id] === undefined) this.#queries[id] = '';
    
    let visible = filterOptions(options, this.#queries[id]);
      
    // Update element display
    for (let o of options) {
      if (visible.includes(o)) o.classList.remove('dpd-invisible');
      else if (!o.classList.contains('dpd-option-select-all')) 
        o.classList.add('dpd-invisible');
    }
  }
  
  #stateChange(combo) {
    /* 
    Displays hidden sections/dropdowns following user interactions.
    
    Parameters
    ----------------
    combo (type: DOM Element)
    - Combobox which had its value change.
    - Also, this method depends on current value of this.state
   
    Returns
    ----------------
    undefined
    */
    
    if (combo.type === 'text') combo = combo.parentNode;
    
    // Prep for section updates
    if (!combo.parentNode || !combo.parentNode.parentNode) return;
    const group = combo.parentNode.parentNode;
    const section = group.parentNode;
    const form = section.parentNode;
    
    // Define which combo made update
    this.state['dpd-updated'] = group.dataset.name;
    this.#onStateUpdate(this.state); 
    
    // Figure out current and next subgroup in order
    let order = parseInt(group.dataset.order);
    let groups = section.querySelectorAll(
      `div.dpd-section-group[data-order="${order+1}"]`
    );
    let nextGroup = []; 
    
    // Add any eligible subgroups to update list
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].classList.contains('dpd-hidden')) {
        nextGroup.push(groups[i]);
      }
    }
    
    // Figure out current and next section in order.
    order = parseInt(section.dataset.order);
    let sectionsFilled = true;
    let sections = form.querySelectorAll(`div.dpd-section[data-order="${order}"]`);

    for (let i = 0; i < sections.length; i++) {
      // Get num groups for section
      let groupFilled = false;
      let sid = sections[i].dataset.name;
      groups = sections[i].querySelectorAll('div.dpd-section-group');
      
      // Check if groups have any values in state
      for (let j = 0; j < groups.length; j++) {
        let id = groups[j].dataset.name;
        const record = this.state[sid][id];
        const vals = record[0];

        if (vals && (!vals['new'] || record.length > 1)) {
          groupFilled = true;
          break;
        }
        
      }
  
      sectionsFilled = sectionsFilled && groupFilled;
    }
    
    // Add any eligible sections to update list
    if (sectionsFilled) {
      sections = form.querySelectorAll(`div.dpd-section[data-order="${order+1}"]`);
      
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].classList.contains('dpd-hidden')) {
          nextGroup.push(sections[i]);
        }
      }
    }
    
    // Display next sections/dropdowns in order
    for (let n of nextGroup) {
      n.classList.remove('dpd-hidden');
    }
    
    // Update flex grow properties
    sections = this.#rootDOM.querySelectorAll('.dpd-section');
    for (let s of sections) {
      if (s.classList.contains('dpd-hidden')) continue;
      
      let flex = 0; 

      for (let c of s.children) {
        if (!c.classList.contains('dpd-hidden')) flex += 1;
      }
      
      s.style.flexGrow = flex;
    }
  
  }
  
  
} // End of class