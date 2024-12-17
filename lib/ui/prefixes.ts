import { bgRgb } from 'ansis';

export const ERROR_PREFIX = bgRgb(210, 0, 75).bold.rgb(0, 0, 0)(
  ' Error ',
);
export const INFO_PREFIX = bgRgb(60, 190, 100).bold.rgb(0, 0, 0)(
  ' Info ',
);
