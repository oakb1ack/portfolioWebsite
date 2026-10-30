// Original flat symbols, constructed on a shared 96-unit grid with Paper.js.
export function drawChapterCrest(kind) {
  const p = new window.paper.PaperScope();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  p.setup(canvas);
  const red = '#c4453c';
  const shapes = [];
  const polygon = points => new p.Path({ segments: points, closed: true });
  const cut = (shape, hole) => {
    const result = shape.subtract(hole);
    shape.remove(); hole.remove();
    return result;
  };
  const rectangle = (x, y, width, height) => new p.Path.Rectangle(new p.Rectangle(x, y, width, height));

  function arch(left, right, top, bottom) {
    const path = new p.Path({ closed: true });
    const middle = (left + right) / 2;
    const shoulder = top + (right - left) / 2;
    path.moveTo([left, bottom]); path.lineTo([left, shoulder]);
    path.cubicCurveTo([left, top + 7], [middle - 7, top], [middle, top]);
    path.cubicCurveTo([middle + 7, top], [right, top + 7], [right, shoulder]);
    path.lineTo([right, bottom]);
    return path;
  }

  if (kind === 'home') {
    // One doorway silhouette. The open center is transparent, not a second color.
    shapes.push(cut(arch(25, 71, 17, 79), arch(35, 61, 27, 80)));
  } else if (kind === 'about') {
    // A single sprig, with broad leaves that remain legible at small sizes.
    const stem = new p.Path({ strokeColor: red, strokeWidth: 4, strokeCap: 'round' });
    stem.moveTo([36, 78]);
    stem.cubicCurveTo([43, 63], [43, 43], [59, 18]);
    for (const [base, tip, bend] of [
      [[39, 69], [20, 52], [22, 68]],
      [[44, 59], [67, 43], [65, 61]],
      [[46, 48], [29, 30], [28, 46]],
      [[52, 37], [74, 22], [73, 39]],
      [[56, 27], [59, 10], [47, 16]],
    ]) {
      const leaf = new p.Path({ closed: true });
      leaf.moveTo(base);
      leaf.quadraticCurveTo(bend, tip);
      leaf.quadraticCurveTo([base[0] + (tip[0] > base[0] ? 9 : -5), tip[1] + 1], base);
      shapes.push(leaf);
    }
  } else if (kind === 'blog') {
    // Folded page and two deliberately spaced text cuts.
    let page = polygon([[26, 17], [57, 17], [72, 32], [72, 79], [26, 79]]);
    page = cut(page, polygon([[57, 17], [57, 32], [72, 32]]));
    page = cut(page, rectangle(37, 45, 24, 4));
    page = cut(page, rectangle(37, 58, 17, 4));
    shapes.push(page);
    shapes.push(polygon([[60, 22], [67, 29], [60, 29]]));
  } else {
    // An asymmetric compass rose: a long north point and quiet horizontal arms.
    let compass = polygon([[48, 12], [56, 39], [76, 48], [56, 55], [48, 79], [40, 55], [20, 48], [40, 39]]);
    compass = cut(compass, new p.Path.Circle({ center: [48, 48], radius: 5.5 }));
    if (kind === 'uncharted') compass = cut(compass, polygon([[22, 65], [69, 21], [74, 27], [28, 71]]));
    shapes.push(compass);
  }

  for (const shape of shapes) shape.fillColor = red;
  const symbol = new p.Group(p.project.activeLayer.children.slice());
  symbol.name = 'symbol';
  const svg = p.project.exportSVG({ asString: true, precision: 2, bounds: new p.Rectangle(0, 0, 96, 96) });
  p.remove();
  return svg;
}
