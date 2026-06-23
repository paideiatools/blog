# Blog

## Mission
Create implementation-ready, token-driven UI guidance for Blog that is optimized for consistency, accessibility, and fast delivery across marketing site.

## Brand
- Product/brand: Blog
- URL: https://claude.com/blog
- Audience: readers and knowledge seekers
- Product surface: marketing site

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Main font style: `font.family.primary=Anthropic Sans`, `font.family.stack=Anthropic Sans, Arial, sans-serif`, `font.size.base=19.9312px`, `font.weight.base=400`, `font.lineHeight.base=31.89px`
- Typography scale: `font.size.xs=12px`, `font.size.sm=15px`, `font.size.md=17px`, `font.size.lg=18.79px`, `font.size.xl=19.93px`, `font.size.2xl=24.66px`, `font.size.3xl=43.04px`, `font.size.4xl=50.76px`
- Color palette: `color.text.primary=#faf9f5`, `color.text.secondary=#87867f`, `color.text.tertiary=#141413`, `color.surface.base=#000000`, `color.surface.raised=#1f1e1d`, `color.surface.strong=#d97757`
- Spacing scale: `space.1=1.6px`, `space.2=4px`, `space.3=8px`, `space.4=9.6px`, `space.5=10px`, `space.6=12px`, `space.7=16px`, `space.8=16.8px`
- Radius/shadow/motion tokens: `radius.xs=7.5px`, `radius.sm=8px`, `radius.md=8.5px`, `radius.lg=12px`, `radius.xl=23.45px` | `shadow.1=rgba(0, 0, 0, 0) 0px 0px 0px 0px`, `shadow.2=rgb(48, 48, 46) 0px 0px 0px 0px, rgb(61, 61, 58) 0px 0px 0px 1px` | `motion.duration.instant=100ms`, `motion.duration.fast=200ms`, `motion.duration.normal=300ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: cards (437), links (377), buttons (301), inputs (61), lists (49), navigation (15).


## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
