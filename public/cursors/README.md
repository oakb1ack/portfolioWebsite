# Stygius cursor

Original, simplified SVG drawings inspired by Stygius, the Stygian Blade from
Supergiant Games' *Hades*. Reference: the [Supergiant-commissioned replica by
Volpin Props](https://www.volpinprops.com/portfoliopage/stygian-blade/).
These are purpose-drawn cursor illustrations, not extracted game assets.

Each cursor is 40 × 40 CSS pixels with the same blade-tip hotspot at `(3, 3)`.
The ivory blade, red border, green runes, skull guard, and wrapped grip carry
the sword's silhouette at cursor scale. Hover uses a gold blade; clicking
briefly warms the blade to red. Geometry stays fixed across states.

CSS uses the browser's native cursor rendering on fine pointers with hover.
A separate, noninteractive effects layer adds sparse green rune embers while
moving and a brief gold diamond pulse on entering a control. Clicks release a
tapered SVG cut with a warm white edge, crimson body, delayed red afterimage,
small impact flash, and directional gold and orange streaks. A 20ms anticipation
leads into the fast sweep; the tail erodes over the rest of the 340ms strike.
The afterimage fades by 400ms. Clicks within 560ms alternate the swing direction;
a pause returns to the opening swing. The sword itself never trails the mouse.

Effects use the Web Animations API, stop once their short animations finish,
and are capped at 40 concurrent particles. No animation loop runs while idle.
They clear on blur, scrolling, leaving the window, or hiding the tab. Text keeps
its I-beam and has no particles; touch and reduced-motion users receive no
effects. Reduced motion also disables the click flash.
