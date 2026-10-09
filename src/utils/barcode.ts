// Lightweight Code 128 (Subset B) SVG generator for barcodes
// Generates authentic SVG barcode stripes with start/stop codes and checksum

const CODE128_B_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (104=Start B, 106=Stop)
];

const START_B_INDEX = 104;
const STOP_INDEX = 106;

export function generateBarcodeSvgPath(text: string): { pathData: string; totalWidth: number } {
  const sanitized = text.replace(/[^\x20-\x7E]/g, '');
  if (!sanitized) return { pathData: '', totalWidth: 100 };

  // Calculate checksum for Code 128
  let checksum = START_B_INDEX;
  const indices: number[] = [START_B_INDEX];

  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized.charCodeAt(i) - 32;
    indices.push(code);
    checksum += code * (i + 1);
  }

  const checkIndex = checksum % 103;
  indices.push(checkIndex);
  indices.push(STOP_INDEX);

  // Convert pattern digits (width of bar/space alternating) into rects
  let currentX = 10; // 10px quiet zone
  let path = '';

  for (let i = 0; i < indices.length; i++) {
    const pattern = CODE128_B_PATTERNS[indices[i]] || '111111';
    let isBar = true;
    for (let c = 0; c < pattern.length; c++) {
      const width = parseInt(pattern[c], 10) * 2;
      if (isBar) {
        path += `M${currentX},0 h${width} v50 h-${width} Z `;
      }
      currentX += width;
      isBar = !isBar;
    }
  }

  currentX += 10; // 10px quiet zone
  return { pathData: path, totalWidth: currentX };
}
