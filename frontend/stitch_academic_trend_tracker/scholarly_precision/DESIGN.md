---
name: Scholarly Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-title:
    fontFamily: Source Serif 4
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  paper-title:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  ui-label:
    fontFamily: Work Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  sidebar-width: 260px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is engineered for the rigors of academic research and trend analysis. The brand personality is authoritative, precise, and intellectually rigorous, aiming to evoke a sense of calm focus and absolute reliability. 

The visual style is **Corporate / Modern** with a strong emphasis on **Minimalism** to ensure that complex data remains the primary focus. It utilizes a structured information hierarchy that mirrors the organization of a peer-reviewed journal while maintaining the efficiency of a high-performance SaaS dashboard. Every interface element is designed to reduce cognitive load, prioritizing legibility and the density of information over decorative flair.

## Colors
The palette is rooted in professional stability and scientific clarity. 

- **Primary (Deep Navy):** Used for structural elements like headers, sidebar navigation, and primary branding to establish authority.
- **Secondary (Teal):** A vibrant accent reserved for growth indicators, interactive call-to-actions, and positive trend data.
- **Tertiary (Slate Gray):** Utilized for metadata, borders, and secondary text to provide nuance without clutter.
- **Neutral (Crisp White/Ice):** The foundation for the workspace, providing a clean "laboratory" feel that ensures maximum contrast for data visualization.

Color is used functionally: semantic colors for error (Maroon), warning (Amber), and success (Teal) must adhere to high-contrast accessibility standards.

## Typography
This design system employs a dual-font strategy to balance editorial sophistication with functional utility. 

- **Source Serif 4** is used for paper titles, publication headers, and editorial content. Its high x-height and sturdy serifs provide an authoritative, academic feel that remains legible even in dense abstracts.
- **Work Sans** handles the core UI, navigation, and body text. Its neutral, professional character ensures that interface instructions and data labels are unambiguous.
- **JetBrains Mono** is introduced for specific data-heavy contexts, such as DOI numbers, citation counts, and tabular figures, where monospaced alignment aids in quick scanning and comparison.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy within a structured dashboard environment. 

1.  **Persistent Navigation:** A 260px sidebar resides on the left, providing immediate access to journal categories, saved searches, and trend reports.
2.  **Grid System:** On desktop, a 12-column grid is used with 24px gutters. Content cards typically span 4, 6, or 12 columns depending on data complexity.
3.  **Density:** To accommodate the needs of researchers, the system utilizes a "Compact" spacing rhythm. Vertical rhythm is strictly based on a 4px baseline grid.
4.  **Responsive Reflow:** On tablet, the sidebar collapses into a hamburger menu. On mobile, data tables transform into expanded cards to maintain readability without horizontal scrolling.

## Elevation & Depth
Depth in this design system is achieved through **Tonal Layers** and **Low-contrast Outlines** rather than heavy shadows, maintaining a flat, professional aesthetic.

- **Base Layer:** `#F8FAFC` (Neutral background).
- **Surface Layer:** White (`#FFFFFF`) cards with a 1px solid border in `#E2E8F0`. 
- **Interactive Elevation:** Subtle, ambient shadows (0px 2px 4px rgba(15, 23, 42, 0.05)) are used only on hovered elements to indicate interactivity.
- **Separation:** High-contrast vertical lines separate navigation from the workspace, emphasizing the "split-pane" nature of professional research tools.

## Shapes
The shape language is conservative and structural. The **Soft (0.25rem)** roundedness level is applied to UI components to prevent the interface from feeling overly aggressive or "brutalist" while maintaining a precise, serious edge. 

Buttons, input fields, and tags use the base `rounded` (4px). High-level containers like paper preview cards use `rounded-lg` (8px) to softly distinguish them from the background. Larger modal windows or primary dashboard widgets utilize `rounded-xl` (12px).

## Components
- **Buttons:** Primary buttons are solid Navy (`#0F172A`) with white text. Secondary buttons use a ghost style with Slate borders. Ghost buttons are used for utility actions to keep the focus on the data.
- **Data Tables:** Highly structured with zebra-striping in a very light gray. Column headers use `ui-label` typography in Navy. Rows have a subtle hover state change to a pale Teal wash.
- **Trend Chips:** Small badges used to show categories or growth percentages. Growth tags use a light Teal background with dark Teal text; neutral tags use Slate.
- **Cards:** White background, 1px border, no shadow. Content is strictly aligned to the grid with consistent 24px internal padding.
- **Input Fields:** Professional "underlined" or "outlined" styles with clear focus states in Teal. Error states must include both a color change (Maroon) and an icon for accessibility.
- **Charts:** Line and bar charts should use the primary and secondary palette. Grid lines should be faint (`#F1F5F9`) to ensure the data series is the most prominent element.