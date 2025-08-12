# DESIGN SYSTEM – Dark Glass Command Center

## Palette
- Primary Cyan: `#01D1D1`
- Teal: `#2A9D8F`
- Accent/Warning: `#F4A261`
- Error: `#E76F51`
- Surfaces: charcoal `#0E1116` → `#0B0F14` gradient; cards use translucency.

## Shape & Effects
- Radius: global 12px; cards 16px.
- Blur: 20px on glass surfaces (backdrop-filter).
- Borders: 1px thin cyan alpha (`rgba(1,209,209,0.25)`).
- Glow: subtle outer glow on active states; cyan “glint” animation on cards.
- Motion: buttons scale 1.02 on hover; gradient shift; cards lift 4px on hover.

## Typography
- **Headlines**: Montserrat (semi-bold), tight letter spacing.
- **Body/Buttons**: Inter; **no uppercase** on buttons.
- Sizes: 10/12/14/16/20/24 typographic scale.

## Components
- **GlassCard**: Paper variant with blur + border + glint.
- **KpiCard**: KPI layout with animated cyan top bar.
- **Buttons**: Contained = cyan→teal gradient, glow on hover; text/outlined as usual.
- **AppShell**: Glass AppBar + 280px Drawer; brand block; animated “System Online” pulse; avatar with role chip.

## Global Details
- Custom cyan scrollbar.
- Gradient page background with parallax dots (optional).
