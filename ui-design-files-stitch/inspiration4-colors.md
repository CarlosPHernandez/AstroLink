---
name: Aetherial Precision
colors:
  surface: '#faf9fe'
  surface-dim: '#dad9df'
  surface-bright: '#faf9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf3'
  surface-container-high: '#e9e7ed'
  surface-container-highest: '#e3e2e7'
  on-surface: '#1a1b1f'
  on-surface-variant: '#414755'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#4c4aca'
  on-secondary: '#ffffff'
  secondary-container: '#6664e4'
  on-secondary-container: '#fffbff'
  tertiary: '#2957b7'
  on-tertiary: '#ffffff'
  tertiary-container: '#4670d2'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0c006a'
  on-secondary-fixed-variant: '#3631b4'
  tertiary-fixed: '#dae2ff'
  tertiary-fixed-dim: '#b2c5ff'
  on-tertiary-fixed: '#001848'
  on-tertiary-fixed-variant: '#0040a1'
  background: '#faf9fe'
  on-background: '#1a1b1f'
  surface-variant: '#e3e2e7'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 64px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style
This design system is built on the principles of **Minimalism** and **Modern Corporate** aesthetics, heavily inspired by the "Apple-like" ethos of clarity, intent, and premium quality. The brand personality is professional, authoritative, and frictionless. 

The target audience consists of high-level professionals and power users who value efficiency and visual calmness. The UI evokes a sense of "digital air"—spacious, breathable, and hyper-legible. We avoid unnecessary ornamentation, relying instead on precision-engineered typography and a singular focus on the primary action color to guide the user journey.

## Colors
The palette is rooted in a **pure white (#FFFFFF) foundation** to maximize perceived lightness and professional cleanliness. 

*   **Primary Blue:** Extracted from the vibrant core of the reference logo, this high-energy blue is reserved for primary actions, progress indicators, and critical wayfinding.
*   **Secondary/Tertiary Blues:** Used for subtle interactive states and depth, providing a range of blue tones that feel cohesive but distinct.
*   **Neutrals:** We utilize a grayscale spectrum that leans slightly cool, ranging from off-blacks for text to very faint grays for subtle containment. Yellow and warm tones are strictly prohibited to maintain a clinical, high-tech atmosphere.

## Typography
We use **Inter** exclusively to achieve a sophisticated, systematic feel. The type hierarchy is designed for high-contrast readability. 

Headlines utilize tighter letter-spacing and heavier weights to feel "anchored" and authoritative. Body text uses standard tracking to ensure comfortable long-form reading. To maintain the premium aesthetic, always ensure generous vertical rhythm (line-height) and avoid using more than three weights in a single view to prevent visual clutter.

## Layout & Spacing
The layout follows a **structured 12-column fixed grid** for desktop, transitioning to a fluid model for tablet and mobile. 

*   **Desktop:** 12 columns, 1200px max-width, centered.
*   **Tablet:** 8 columns, 24px side margins.
*   **Mobile:** 4 columns, 16px side margins.

We employ an 8px spatial system (with a 4px half-step for micro-adjustments). This ensures all elements align to a consistent mathematical rhythm. Spacing between major sections should feel "luxuriously large" (typically 64px or more) to reinforce the minimalist brand personality.

## Elevation & Depth
In alignment with the "Apple-like" aesthetic, we avoid heavy, dark shadows. Instead, we use **Tonal Layers** and **Low-Contrast Outlines**.

1.  **Level 0 (Base):** Pure #FFFFFF background.
2.  **Level 1 (Cards):** Defined by a subtle 1px border (#E5E5E7) rather than a shadow.
3.  **Level 2 (Modals/Popovers):** A very soft, highly diffused ambient shadow (Color: Primary Blue, Opacity: 4%, Blur: 20px). 

This creates a sense of depth that feels "etched" into the screen rather than floating awkwardly above it. Backdrop blurs (Glassmorphism) should be used sparingly on navigation bars to maintain context of the content beneath.

## Shapes
The shape language is defined by **precision-rounded corners**. Following the request for "subtle rounded corners," we use a base radius of **12px** for standard components like cards and buttons.

*   **Small elements (tags, chips):** 8px.
*   **Standard elements (buttons, inputs, cards):** 12px.
*   **Large containers (modals):** 20px.

Avoid fully "pill-shaped" buttons; the 12px radius provides a professional balance between geometric rigidity and friendly approachability.

## Components
Consistent component styling is vital for the design system's integrity:

*   **Buttons:** Primary buttons use a solid Primary Blue fill with white text. Secondary buttons are "ghost" style with a 1px Primary Blue border and blue text. No gradients.
*   **Input Fields:** Use a 1px light gray border that transitions to a 2px Primary Blue border on focus. Labels should be small and positioned above the field.
*   **Cards:** Pure white background, 12px radius, 1px light gray border. No shadows unless the card is interactive/hovered.
*   **Chips/Tags:** Used for categorization; these should have a very light Primary Blue background (5% opacity) with Primary Blue text for a sophisticated monochromatic look.
*   **Lists:** High-contrast text with thin horizontal dividers (#F2F2F7). Avoid icons in lists unless they serve a functional purpose.
*   **Checkboxes/Radios:** When active, these should be solid Primary Blue to ensure high visibility against the white background.