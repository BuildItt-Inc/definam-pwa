import { runInNewContext } from 'node:vm';
import { typographyPlatformScript } from '../typography';

describe('Before-paint platform typography', () => {
  it.each([
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5, 'ios'],
    ['Android', 'Mozilla/5.0 (Linux; Android 15; Pixel 9)', 'Linux armv8l', 5, 'android'],
    ['iPad desktop mode', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'MacIntel', 5, 'ios'],
    ['Mac desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'MacIntel', 0, 'default'],
    ['Windows desktop', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32', 0, 'default'],
    ['unknown device', '', '', 0, 'default'],
  ])('selects the expected font family for %s', (_name, userAgent, platform, maxTouchPoints, expected) => {
    const dataset: Record<string, string> = {};
    runInNewContext(typographyPlatformScript, {
      navigator: { userAgent, platform, maxTouchPoints },
      document: { documentElement: { dataset } },
    });
    expect(dataset.typography).toBe(expected);
  });
});
