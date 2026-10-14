// Self-contained so it can run in the document head before the first paint.
// Blocked JavaScript or an unknown platform keeps the CSS default (Inter).
export const typographyPlatformScript = `(function(){var ua=navigator.userAgent;var ios=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);document.documentElement.dataset.typography=ios?'ios':/Android/i.test(ua)?'android':'default';})();`;
