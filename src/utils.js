var config = require('./config.js');

const langMap = new Map(config.supportedLanguages);
const regionMap = new Map(config.supportedRegion);
const langMapReverse = new Map(config.supportedLanguages.map(([standardLang, lang]) => [lang, standardLang]));

exports.langMap = langMap;
exports.regionMap = regionMap;
exports.langMapReverse = langMapReverse;
