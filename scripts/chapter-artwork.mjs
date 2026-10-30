// Runs in a browser with Paper.js loaded. All geometry is original and deterministic.
export function drawChapterCrest(kind) {
  const p = new window.paper.PaperScope();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 384;
  p.setup(canvas);
  const C = new p.Point(192, 192);
  const color = {
    light: '#f3df9d', gold: '#c6a45c', brass: '#967039', dark: '#554126',
    ink: '#0a1612', green: '#263c2e', red: '#a64432', ember: '#df8a54',
  };
  const point = (x, y) => new p.Point(x, y);
  const polar = (radius, angle, center = C) => new p.Point(center).add(new p.Point({ length: radius, angle }));
  const metal = (item, from = [105, 100], to = [270, 282], stops) => {
    item.fillColor = {
      gradient: { stops: stops ?? [[color.light, 0], [color.gold, .34], [color.dark, .62], [color.gold, .88], [color.brass, 1]] },
      origin: new p.Point(from), destination: new p.Point(to),
    };
    return item;
  };
  function path(points, { fill, stroke, width = 1, closed = false, opacity = 1 } = {}) {
    return new p.Path({ segments: points, closed, fillColor: fill, strokeColor: stroke,
      strokeWidth: width, strokeCap: 'round', strokeJoin: 'round', opacity });
  }
  const line = (a, b, stroke = color.gold, width = 1, opacity = 1) => path([a, b], { stroke, width, opacity });
  function curve(a, control1, control2, b, stroke = color.gold, width = 1) {
    const result = new p.Path({ strokeColor: stroke, strokeWidth: width, strokeCap: 'round' });
    result.moveTo(a);
    result.cubicCurveTo(control1, control2, b);
    return result;
  }
  function circle(center, radius, { fill, stroke, width = 1 } = {}) {
    return new p.Path.Circle({ center, radius, fillColor: fill, strokeColor: stroke, strokeWidth: width });
  }
  function diamond(center, radius, options) {
    return path([-90, 0, 90, 180].map(angle => polar(radius, angle, center)), { ...options, closed: true });
  }
  function ring(center, outside, inside) {
    const outer = circle(center, outside);
    const inner = circle(center, inside);
    const result = outer.subtract(inner);
    outer.remove(); inner.remove();
    return result;
  }
  function engraved(item, width = 1.1) {
    item.strokeColor = color.dark;
    item.strokeWidth = width;
    item.strokeJoin = 'round';
    return item;
  }
  function smallStar(center, radius, fill = color.gold) {
    const points = Array.from({ length: 8 }, (_, i) => polar(i % 2 ? radius * .23 : radius, -90 + i * 45, center));
    return path(points, { fill, closed: true });
  }
  function rivet(center, radius = 2.8) {
    center = new p.Point(center);
    metal(circle(center, radius), center.subtract([2, 3]), center.add([2, 3]));
    line(center.add([-1, -.6]), center.add([1, -.6]), color.light, .7);
  }

  // The common frame is carved out of a solid diamond, then given separate bevels.
  const frameStart = p.project.activeLayer.children.length;
  diamond(C.add([0, 4]), 166, { fill: '#020806', stroke: '#020806', width: 5 });
  const face = diamond(C, 164, { fill: color.ink });
  face.fillColor = { gradient: { stops: ['#28382a', '#0a1511'], radial: true }, origin: [155, 140], destination: [280, 290] };
  const outer = diamond(C, 166);
  const cutout = diamond(C, 155);
  let frame = outer.subtract(cutout);
  outer.remove(); cutout.remove();
  // A few restrained notches break the machined silhouette.
  for (const [x, y, angle] of [[282, 118, 45], [104, 270, 45], [254, 288, -45]]) {
    const notch = path([[x - 2, y - 6], [x + 3, y], [x - 2, y + 5]], { closed: true });
    notch.rotate(angle, [x, y]);
    const next = frame.subtract(notch);
    frame.remove(); notch.remove(); frame = next;
  }
  metal(frame, [100, 60], [290, 320]);
  path([[29, 190], [192, 27], [352, 187]], { stroke: color.light, width: 1.2, opacity: .85 });
  path([[33, 199], [192, 357], [351, 199]], { stroke: color.brass, width: 1.5 });
  diamond(C, 149, { stroke: color.gold, width: .8, opacity: .65 });
  diamond(C, 143, { stroke: color.gold, width: .6, opacity: .24 });
  // Corner chevrons and inset red stones tie the family together.
  for (let angle = 0; angle < 360; angle += 90) {
    const corner = new p.Group();
    const d = diamond([192, 38], 13, { fill: color.dark, stroke: color.brass, width: 1 });
    const gem = diamond([192, 38], 7.5, { fill: color.red, stroke: color.gold, width: .8 });
    const facet = path([[192, 31], [192, 38], [185, 38]], { fill: color.ember, closed: true, opacity: .65 });
    const left = path([[172, 49], [192, 68], [212, 49]], { stroke: color.gold, width: 1.3 });
    corner.addChildren([d, gem, facet, left]);
    corner.rotate(angle, C);
  }
  // Fine parallel cuts give the bezel an engraved, rather than flat, finish.
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < 9; i++) {
      const start = point(83 + i * 8, 144 - i * 8);
      const mark = line(start, start.add([3, 3]), color.dark, .75, .6);
      mark.rotate(side * 90, C);
    }
    rivet(point(120, 100).rotate(side * 90, C));
  }
  const frameItems = p.project.activeLayer.children.slice(frameStart);
  const frameGroup = new p.Group(frameItems);
  frameGroup.name = 'bezel';
  const motifStart = p.project.activeLayer.children.length;

  function leaf(base, tip, width, tint = false) {
    const direction = tip.subtract(base);
    const normal = direction.normalize(width).rotate(90);
    const result = new p.Path({ closed: true });
    result.moveTo(base);
    result.cubicCurveTo(base.add(direction.multiply(.25)).add(normal), tip.subtract(direction.multiply(.15)).add(normal.multiply(.42)), tip);
    result.cubicCurveTo(tip.subtract(direction.multiply(.28)).subtract(normal.multiply(.5)), base.add(direction.multiply(.25)).subtract(normal.multiply(.6)), base);
    engraved(metal(result, base.subtract([12, 15]), tip.add([9, 8]), tint
      ? [['#f1d68c', 0], ['#a47538', .6], ['#d6b669', 1]] : undefined), .7);
    curve(base, base.add(direction.multiply(.4)), tip.subtract(direction.multiply(.3)), tip.subtract(direction.multiply(.13)), color.dark, .8);
    const mid = base.add(direction.multiply(.58));
    line(mid, mid.add(normal.multiply(.38)).add(direction.multiply(.11)), color.light, .6, .65);
    return result;
  }

  function laurel() {
    for (const side of [-1, 1]) {
      const stem = curve([192 + side * 8, 278], [192 + side * 87, 251], [192 + side * 82, 167], [192 + side * 41, 113], color.brass, 3.5);
      curve([192 + side * 8, 276], [192 + side * 84, 249], [192 + side * 80, 167], [192 + side * 41, 113], color.light, .9);
      for (let i = 0; i < 7; i++) {
        const location = stem.getLocationAt(stem.length * (.12 + i * .115));
        const direction = location.tangent.normalize(27 + (6 - i) * 1.2);
        const outerTip = location.point.add(direction.rotate(side * 48));
        const innerTip = location.point.add(direction.rotate(-side * 39).multiply(.8));
        leaf(location.point, outerTip, 9.5 - i * .45, i % 2 === 0);
        leaf(location.point.add(location.tangent.multiply(4)), innerTip, 7.4 - i * .35, i % 2 !== 0);
      }
    }
    // A cut monogram with a warm red inlay is the personal center of the seal.
    const letter = path([[158, 237], [183, 153], [197, 147], [227, 237], [208, 237], [202, 215], [177, 215], [171, 237]], { closed: true });
    const eye = path([[181, 200], [190, 171], [198, 200]], { closed: true });
    const a = letter.subtract(eye);
    letter.remove(); eye.remove();
    engraved(metal(a, [167, 149], [213, 240]), 1.2);
    path([[164, 230], [185, 159], [190, 156]], { stroke: color.light, width: 1.1 });
    path([[175, 209], [204, 202], [206, 210], [172, 218]], { fill: color.red, stroke: color.dark, width: 1, closed: true });
    path([[179, 275], [192, 282], [205, 275], [204, 291], [192, 285], [181, 291]], { fill: color.red, stroke: color.brass, width: .8, closed: true });
    rivet([192, 280], 3.5);
  }

  function astrolabe(broken = false) {
    metal(ring(C, 83, 74), [132, 108], [255, 274]);
    circle(C, 80, { stroke: color.light, width: .7 });
    circle(C, 70, { stroke: color.brass, width: .9 });
    circle(C, 56, { stroke: color.gold, width: .7 });
    for (let i = 0; i < 40; i++) {
      const major = i % 5 === 0;
      line(polar(major ? 63 : 67, i * 9), polar(72, i * 9), major ? color.light : color.gold, major ? 1.4 : .75);
    }
    if (!broken) {
      const orbit = new p.Path.Ellipse({ center: C, size: [104, 161], strokeColor: color.gold, strokeWidth: 3.5 });
      orbit.rotate(39);
      const highlight = orbit.clone(); highlight.strokeColor = color.light; highlight.strokeWidth = .7; highlight.translate([-1, -1]);
      const equator = new p.Path.Ellipse({ center: C, size: [148, 51], strokeColor: color.brass, strokeWidth: 2.2 });
      equator.rotate(-21);
      metal(ring([192, 99], 10, 6), [186, 89], [198, 109]);
      for (const angle of [-90, 0, 90, 180]) rivet(polar(78, angle), 3);
    }
    // Four separate facets make the needle read as a raised instrument.
    const top = polar(71, -62);
    const bottom = polar(68, 118);
    const left = polar(14, -152);
    const right = polar(14, 28);
    path([top, left, C], { fill: color.light, stroke: color.dark, width: .8, closed: true });
    path([top, right, C], { fill: color.brass, stroke: color.dark, width: .8, closed: true });
    path([bottom, left, C], { fill: color.red, stroke: color.dark, width: .8, closed: true });
    path([bottom, right, C], { fill: '#6e2c23', stroke: color.dark, width: .8, closed: true });
    metal(circle(C, 11), [185, 182], [200, 203]);
    circle(C, 6, { fill: color.ink, stroke: color.gold, width: .9 });
    smallStar(C, 4, color.ember);
    smallStar([154, 153], 7);
    smallStar([226, 230], 5, color.brass);
    if (broken) {
      // The lost-path emblem keeps the family frame but uses a fractured compass.
      path([[213, 104], [231, 109], [225, 127], [211, 123]], { fill: color.ink, closed: true });
      line([214, 105], [218, 113], color.light, 1.2);
      line([224, 121], [230, 110], color.gold, 1.2);
    }
  }

  function arch(left, right, top, bottom) {
    const center = (left + right) / 2;
    const shoulder = top + (right - left) * .55;
    const result = new p.Path({ closed: true });
    result.moveTo([left, bottom]); result.lineTo([left, shoulder]);
    result.cubicCurveTo([left, top + 12], [center - 19, top], [center, top]);
    result.cubicCurveTo([center + 19, top], [right, top + 12], [right, shoulder]);
    result.lineTo([right, bottom]);
    return result;
  }
  function gateway() {
    const shadow = arch(131, 253, 108, 271); shadow.fillColor = '#030b09';
    const outerArch = arch(129, 255, 108, 270);
    const inside = arch(149, 235, 128, 270);
    const surround = outerArch.subtract(inside);
    outerArch.remove(); inside.remove();
    engraved(metal(surround, [130, 110], [252, 273]), 1.3);
    const inner = arch(150, 234, 130, 270);
    inner.fillColor = { gradient: { stops: ['#263c2d', '#060c0a'] }, origin: [162, 144], destination: [218, 259] };
    inner.strokeColor = color.brass; inner.strokeWidth = 1;
    const innerBorder = arch(157, 227, 139, 270);
    innerBorder.strokeColor = color.gold; innerBorder.strokeWidth = .7;
    path([[189, 149], [195, 147], [197, 265], [188, 265]], { fill: color.red, closed: true });
    line([192, 151], [192, 263], color.ember, .8, .8);
    for (const x of [136, 143, 241, 248]) line([x, 185], [x, 257], x < 192 ? color.light : color.dark, 1);
    for (let i = 0; i < 5; i++) {
      const angle = -165 + i * 37.5;
      line(polar(45, angle, point(192, 173)), polar(61, angle, point(192, 173)), color.dark, 1.1);
    }
    const stone = diamond([192, 113], 14, { stroke: color.dark, width: 1 }); metal(stone, [183, 99], [202, 128]);
    diamond([192, 113], 6, { fill: color.red, stroke: color.light, width: .7 });
    for (let i = 0; i < 3; i++) {
      const step = path([[139 - i * 10, 263 + i * 9], [245 + i * 10, 263 + i * 9], [252 + i * 10, 271 + i * 9], [132 - i * 10, 271 + i * 9]], { closed: true, stroke: color.dark, width: 1 });
      metal(step, [160, 261 + i * 9], [180, 275 + i * 9]);
      line([140 - i * 10, 264 + i * 9], [245 + i * 10, 264 + i * 9], color.light, .7);
    }
    for (const x of [125, 237]) {
      const foot = new p.Path.Rectangle({ point: [x, 255], size: [22, 10] });
      engraved(metal(foot), 1);
    }
    smallStar([177, 197], 5, color.gold);
  }

  function codex() {
    // Separate covers, page blocks, and page faces give the book a clear silhouette.
    path([[104, 149], [147, 138], [192, 156], [237, 138], [280, 149], [280, 253], [237, 246], [192, 264], [147, 246], [104, 253]], { fill: color.green, stroke: color.gold, width: 2, closed: true });
    const pages = path([[110, 152], [149, 142], [192, 158], [235, 142], [274, 152], [274, 246], [235, 240], [192, 257], [149, 240], [110, 246]], { closed: true, stroke: color.dark, width: 1 });
    metal(pages, [120, 142], [269, 264]);
    function pageFace(side) {
      const page = new p.Path({ closed: true, strokeColor: color.dark, strokeWidth: 1 });
      page.moveTo([192, 156]);
      page.cubicCurveTo([192 + side * 26, 142], [192 + side * 55, 134], [192 + side * 78, 146]);
      page.lineTo([192 + side * 78, 236]);
      page.cubicCurveTo([192 + side * 51, 228], [192 + side * 27, 235], [192, 251]);
      page.fillColor = { gradient: { stops: side < 0 ? ['#d5bd7d', '#a68c51', '#78633a'] : ['#8b7245', '#dfcb90', '#b39a61'] }, origin: [114, 185], destination: [270, 220] };
      return page;
    }
    pageFace(-1); pageFace(1);
    for (let i = 0; i < 7; i++) {
      const y = 164 + i * 10;
      curve([124, y], [141, y - 3], [158, y + 1], [178, y + 10], color.dark, i === 0 ? 2.2 : 1.1);
      curve([205, y + 10], [223, y + 1], [242, y - 3], [258 - (i % 3) * 5, y], color.dark, 1.1);
    }
    line([192, 158], [192, 249], color.light, .9, .8);
    path([[218, 238], [227, 235], [228, 270], [222, 266], [216, 272]], { fill: color.red, stroke: color.dark, width: 1, closed: true });
    line([220, 241], [220, 263], color.ember, .8);
    // The feather is drawn as a curved silhouette, with individually cut barbs.
    const feather = new p.Path({ closed: true });
    feather.moveTo([218, 218]);
    feather.cubicCurveTo([213, 173], [237, 139], [260, 126]);
    feather.cubicCurveTo([273, 158], [254, 198], [218, 218]);
    engraved(metal(feather, [230, 127], [270, 207]), 1.2);
    const shaft = curve([212, 232], [227, 190], [247, 151], [260, 126], color.dark, 1.8);
    curve([214, 229], [230, 188], [249, 149], [260, 127], color.light, .8);
    for (let i = 0; i < 9; i++) {
      const location = shaft.getLocationAt(shaft.length * (.16 + i * .077));
      const normal = location.normal.normalize(12 - Math.abs(i - 4) * 1.4);
      const back = location.tangent.multiply(-7);
      line(location.point.add(back).add(normal), location.point, color.dark, .85, .75);
      line(location.point.add(back).subtract(normal.multiply(.72)), location.point, color.brass, .75, .8);
    }
    path([[211, 228], [218, 217], [219, 226], [211, 238]], { fill: color.light, stroke: color.dark, width: .8, closed: true });
  }

  if (kind === 'about') laurel();
  else if (kind === 'experience') astrolabe();
  else if (kind === 'blog') codex();
  else if (kind === 'home') gateway();
  else astrolabe(true);

  const motif = new p.Group(p.project.activeLayer.children.slice(motifStart));
  motif.name = 'chapter-motif';
  // Keep raised artwork within the inset diamond even where the quill crosses it.
  const mask = diamond(C, 139);
  mask.clipMask = true;
  const clipped = new p.Group([mask, motif]); clipped.clipped = true;
  clipped.name = 'engraving';
  const svg = p.project.exportSVG({ asString: true, precision: 3, bounds: new p.Rectangle(0, 0, 384, 384) });
  p.remove();
  return svg;
}
