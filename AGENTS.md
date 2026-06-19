<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Coding Rules & Standards

## 1. Neobrutalism Design System
- All interactive controls, cards, inputs, and modals must use the Neobrutalism theme:
  - Heavy borders: `border-2 border-black` / `border-3 border-black` / `border-4 border-black`
  - Flat black shadows: `shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]` / `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` / `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`
  - Snappy hover & active effects (translating layout by `0.5px` or `1px` and removing shadow on click).
  - Background colors: Cream (`bg-[#fefaf0]`), Accent Yellow (`bg-[#ffd275]`), Accent Green (`bg-[#a8e6cf]`), Accent Blue (`bg-[#bae1ff]`).

## 2. Checkbox & Select Inputs
- **NEVER** use default HTML `<input type="checkbox">` or default `<select>` tags directly in your views.
- **Custom Select**: Always use the custom component `CustomSelect` located in `app/cms/components/ui/custom-select.tsx`.
- **Custom Checkbox**: Always use the custom component `CustomCheckbox` located in `app/cms/components/ui/custom-checkbox.tsx`.

## 3. Component Reusability & Shared UI
- Write reusable, generalized components instead of copy-pasting layouts or CSS styles.
- Place shared UI components in `app/cms/components/ui/` or `components/ui/`.

## 4. No Hardcoding / Dynamic Coding
- Avoid hardcoding options, texts, statuses, and options.
- Keep components as dynamic as possible (use variables, configurations, properties, or state).

## 5. Database Schema Changes & Migrations
- **ALWAYS** generate a database migration when modifying `prisma/schema.prisma`.
- Run `bun prisma migrate dev --name <migration_name>` to generate and apply migrations locally and create migration files.
- **NEVER** use `prisma db push` directly for production schema changes without generating migration files.


