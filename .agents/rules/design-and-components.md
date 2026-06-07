---
trigger: always_on
---

# UI Design and Component Development Rules

All agents working on this project MUST strictly follow these design patterns, component guidelines, and code practices.

## 1. Neobrutalism Design Guidelines
This project uses a playful **Neobrutalism (Neo-brutalism)** UI style. Adhere to these styling principles:
- **Borders**: All interactive elements (buttons, select, inputs, cards, containers, modals) must have prominent borders:
  - Small elements (inputs, dropdowns, check-boxes): `border-2 border-black` or `border-3 border-black`
  - Large containers, modals, pages: `border-4 border-black`
- **Shadows**: Use flat, solid black shadows instead of fuzzy blur shadows:
  - Heavy elements: `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`
  - Normal buttons/inputs: `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` or `shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`
- **Interactions**: Implement snappy hover and active effects:
  - On Hover: Translate slightly up or down (`hover:translate-x-[0.5px] hover:translate-y-[0.5px]` or `hover:-translate-x-0.5 hover:-translate-y-0.5`).
  - On Active (Click): Translate to zero and remove the shadow (`active:translate-x-0 active:translate-y-0 active:shadow-none`).
- **Colors**: Use the project's curated color scheme:
  - Background: `bg-[#fefaf0]` (cream/beige)
  - Yellow/Gold accent: `#ffd275` or `#ffc342`
  - Mint Green accent: `#a8e6cf` or `#96d8c0`
  - Light Blue accent: `#bae1ff`
  - Hover highlights: `#fff9ed`
- **Typography**: Text should be bold/extra-bold (`font-bold`, `font-extrabold`, `font-black`) to contrast with the thick borders.

---

## 2. Checkboxes and Selects
NEVER use default HTML `<input type="checkbox">` or default `<select>` elements directly in pages or components. You MUST use custom components.
- **Selects**: Always use `CustomSelect` from [custom-select.tsx](file:///c:/Users/Qy/Documents/Code/vezido-landing-next/app/cms/components/ui/custom-select.tsx).
- **Checkboxes**: Always use `CustomCheckbox` from [custom-checkbox.tsx](file:///c:/Users/Qy/Documents/Code/vezido-landing-next/app/cms/components/ui/custom-checkbox.tsx).
- If new form elements are needed, create clean custom wrappers with the Neobrutalism design style rather than using unstyled/default controls.

---

## 3. Reusable Components
Avoid duplicating layout, styles, or logic.
- Identify common patterns and extract them into shared reusable components under `app/cms/components/ui/` or `components/ui/`.
- Ensure components are generalized, clean, and properly typed.
- Keep parent files thin and focus page code on logic and composition rather than detailed styling of standard items.

---

## 4. No Hardcoding / Dynamic Data
Avoid hardcoding strings, labels, status options, sizes, times, or configurations in page components.
- If data can be dynamic, make it dynamic.
- Pass configuration lists, options, and status selections as parameters, arrays, state, or hooks.
- Retrieve choices and lookups dynamically from API calls or shared config files when possible.
