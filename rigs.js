/* Source rectangles are measured on the original 1328 × 1184 illustration. */
const rigs = (() => {
  const cabinet = (kind, x, y, w, h, span = 1) => ({ kind, rect: [x, y, w, h], span });
  const group = (kind, edges, top, bottom, span = 1) =>
    edges.slice(0, -1).map((x, i) => cabinet(kind, x, top, edges[i + 1] - x, bottom - top, span));
  const ivah = [376, 452, 529, 607, 683];
  const deng = [706, 791, 876, 964];
  const roots = [40, 117, 193, 270, 345];
  const hafnia = [56, 133, 211, 286];
  const ark = [675, 771, 867, 963];
  const light = [1009, 1079, 1148, 1218, 1287];
  const catalog = [
    {
      name: 'Ivah Sound', art: [368, 8, 322, 446], country: 'FINLAND', code: 'FIN', color: '#ff8545',
      note: 'Polar Bear Scoops at the foundation. Orange horns and hand-built birch from the south of Finland.',
      rows: [
        group('Polar Bear Scoop', ivah, 282, 444, 2),
        group('Polar Kick', ivah, 189, 282, 2),
        group('MT112 Mid-High', [379, 452, 529, 607, 682], 66, 193, 2).map((piece, i) => {
          if (i === 0) piece.outline = [[1, 12], [73, 0], [73, 127], [1, 127]];
          if (i === 3) piece.outline = [[0, 0], [74, 11], [74, 127], [0, 127]];
          return piece;
        }),
        [{
          ...cabinet('Tweeter Array', 465, 15, 131, 50, 2),
          outline: [[0, 14], [64, 0], [130, 13], [130, 50], [0, 50]],
        }],
      ],
    },
    {
      name: 'Deng Deng Hi-Fi', art: [699, 22, 275, 432], country: 'SWEDEN', code: 'SWE', color: '#adc875',
      note: 'Dark grilles, green lettering, reflex kicks and heavyweight Super Scoops.',
      rows: [
        group('Super Scoop', deng, 265, 449, 2),
        group('Reflex Kick', [711, 792, 876, 960], 177, 265, 2),
        group('Mid-High', [721, 796, 875, 949], 92, 177, 2),
        [cabinet('Top', 762, 55, 72, 38, 1), cabinet('Top', 834, 55, 78, 38, 1)],
      ],
    },
    {
      name: 'Happy Days Sound System', art: [980, 84, 323, 371], country: 'SWEDEN', code: 'SWE', color: '#f5bc76',
      note: 'Pale timber, crossed grilles and lions on the front.',
      rows: [
        group('Bass Horn', [987, 1140, 1294], 350, 451, 4),
        [cabinet('Lion Panel', 986, 238, 90, 110, 2), cabinet('Grille', 1077, 238, 125, 110, 4), cabinet('Lion Panel', 1203, 238, 91, 110, 2)],
        group('Grille', [1001, 1139, 1280], 163, 236, 3),
        [cabinet('Horn', 1039, 92, 202, 71, 4)],
      ],
    },
    {
      name: 'Roots Invasion Sound System', art: [33, 19, 321, 436], country: 'NORWAY', code: 'NOR', color: '#eac78b',
      note: 'A wooden wall of sound crowned with little horns and tops.',
      rows: [
        group('Scoop', roots, 300, 450, 2),
        group('Kick', [46, 119, 193, 267, 341], 203, 300, 2),
        group('Horn', [72, 131, 192, 252, 317], 156, 204),
        [cabinet('Top', 88, 101, 42, 55), cabinet('Horn', 132, 98, 120, 58, 2), cabinet('Top', 255, 101, 52, 55)],
        [cabinet('Top', 157, 26, 89, 34, 2)],
      ],
    },
    {
      name: 'Hafnia Roots Hi-Fi', art: [42, 550, 270, 422], country: 'DENMARK', code: 'DEN', color: '#75d3a3',
      note: 'Green horns and dark timber, with the orange crest at the centre.',
      rows: [
        group('Bass Horn', hafnia, 805, 942, 2),
        group('Wood Panel', hafnia, 757, 805, 2),
        [
          cabinet('Horn', 62, 672, 71, 84, 2),
          cabinet('Crest', 135, 674, 75, 82, 2),
          cabinet('Horn', 211, 673, 75, 83, 2),
        ],
        group('Bass', [79, 174, 272], 616, 671, 2),
        [cabinet('Top', 120, 565, 118, 48, 2)],
      ],
    },
    {
      name: 'Rotknöl Rockers', art: [333, 642, 308, 346], country: 'SWEDEN', code: 'SWE', color: '#e9ac49',
      note: 'A compact wooden rig on wheels, ready to roll into the dance.',
      rows: [
        [cabinet('Wheels', 343, 937, 258, 47, 6)],
        group('Bass', [343, 423, 505, 590], 817, 938, 2),
        group('Horn', [394, 455, 513, 573], 728, 814, 2),
        group('Midrange', [417, 488, 559], 685, 728, 2),
        [cabinet('Top', 461, 648, 69, 36, 2)],
      ],
    },
    {
      name: 'Rockers Ark Sound System', art: [668, 549, 303, 432], country: 'DENMARK', code: 'DEN', color: '#efd9aa',
      note: 'Pale horns topped with the hand-lettered Rockers Ark sign.',
      rows: [
        group('Scoop', ark, 819, 975, 2),
        group('Kick', ark, 744, 819, 2),
        group('Mid-High Cabinet', [689, 775, 861, 949], 610, 743, 2),
        [cabinet('Sign', 744, 552, 150, 58, 4)],
      ],
    },
    {
      name: 'Lighthouse Sound System', art: [982, 556, 323, 373], country: 'SWEDEN', code: 'SWE', color: '#f5d459',
      note: 'Yellow scoops, horn kicks and a crown that lights up the stack.',
      rows: [
        group('Scoop', light, 734, 928, 2),
        group('Kick', [1081, 1147, 1210], 665, 734, 2),
        group('Horn', [1084, 1147, 1208], 606, 665, 2),
        group('Top', [1092, 1148, 1207], 567, 606, 2),
      ],
    },
  ];

  return catalog.map(rig => {
    const rows = rig.rows.map(row => {
      const width = row.reduce((sum, piece) => sum + piece.span, 0);
      let col = Math.floor((8 - width) / 2);
      return row.map(piece => {
        const slot = { ...piece, col, id: `${piece.kind}:${piece.span}` };
        col += piece.span;
        return slot;
      });
    });
    return { ...rig, rows };
  });
})();
