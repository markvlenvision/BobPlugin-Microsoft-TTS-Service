const supportedLanguages = [
    ['auto', 'auto'],
    ['zh-Hans', 'zh-CN'],
    ['en', 'en-US'],
    ['es', 'es-ES'],
    ['ja', 'ja-JP'],
    ['ko', 'ko-KR'],
    ['ru', 'ru-RU']
];


const supportedRegion = [
    ['eastasia', 'https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1'],
    ['southeastasia', 'https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1'],
    ['eastus', 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1'],
    ['eastus2', 'https://eastus2.tts.speech.microsoft.com/cognitiveservices/v1']
];


exports.supportedLanguages = supportedLanguages;
exports.supportedRegion = supportedRegion;
