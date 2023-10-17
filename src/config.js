const supportedLanguages = [
    ['auto', 'auto'],
    ['zh-Hans', 'zh-CN'],
    ['en', 'en-US'],
    ['es', 'es-ES'],
    ['ja', 'ja-JP'],
    ['ko', 'ko-KR']
];


const supportedRegion = [
    ['eastasia', 'https://eastasia.api.cognitive.microsoft.com/texttospeech/acc/v3.0-beta1/vcg/speak'],
    ['southeastasia', 'https://southeastasia.api.speech.microsoft.com/accfreetrial/texttospeech/acc/v3.0-beta1/vcg/speak']
];


exports.supportedLanguages = supportedLanguages;
exports.supportedRegion = supportedRegion;
