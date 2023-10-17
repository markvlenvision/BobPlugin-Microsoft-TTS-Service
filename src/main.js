var config = require('./config.js');
var utils = require('./utils.js');
var CryptoJS = require("crypto-js");

function supportLanguages() {
    return config.supportedLanguages.map(([standardLang]) => standardLang);
}


function tts(query, completion) {
    (async () => {
        const targetLanguage = utils.langMap.get(query.lang);
        if (!targetLanguage) {
            const err = new Error();
            Object.assign(err, {
                _type: 'unsupportLanguage',
                _message: '不支持该语种',
            });
            throw err;
        }

        const lang = targetLanguage;
        const speaker = $option[targetLanguage + '-speaker'];
        const text = query.text;
        const region = $option['region'];
        const server = utils.regionMap.get(region);
        const secretKey = $option['secretKey'];
        const quality = $option['quality'];
        const rate = $option['rate'];
        const volume = $option['volume'];
        const cacheDataNum = $option['cacheDataNum'];

        const audioKey = CryptoJS.MD5(speaker + text + quality + rate + volume).toString();


        let audioData = ''
        try {

            const audioPath = '$sandbox/' + audioKey;

            if ($file.exists(audioPath)) {
                //$log.info('音频缓存文件存在')

                audioData = $file.read(audioPath).toUTF8();

            } else {
                //$log.info('音频缓存文件不存在');

                let requestHeader = requestHeaderSet(secretKey, region);

                let prosodyXml = prosodySet(rate, volume, text);
                let requestBody = requestBodySet(quality, lang, speaker, prosodyXml);


                const resp = await $http.request({
                    method: "POST",
                    url: server,
                    header: requestHeader,
                    body: requestBody
                });

                audioData = $data.fromData(resp.data).toBase64();

                //处理缓存
                cacheLog(audioKey, audioData, audioPath, cacheDataNum);

            }


            completion({
                'result': {
                    "type": "base64",
                    "value": audioData,
                    "raw": {}
                }
            });


        } catch (e) {
            $log.error(e);
            completion({
                'error': {
                    'type': e._type || 'unknown',
                    'message': e._message || '未知错误',
                    'addition': {}
                }
            });
        }

    })().catch((err) => {
        $log.error(err)
        completion({
            error: {
                type: err._type || 'unknown',
                message: err._message || '未知错误',
                addtion: err._addtion,
            },
        });
    });
}

function requestHeaderSet(secretKey, region) {

    const map = new Map([
        ['Content-Type', 'application/json'],
        ['Transfer-Encoding', 'chunked'],
        ['User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'],
    ]);

    $log.info(region);

    if ("eastasia" === region) {
        map.set('Host', 'eastasia.api.cognitive.microsoft.com');
        map.set('Ocp-Apim-Subscription-Key', secretKey);

    } else if ("southeastasia" === region) {
        map.set('Host', 'southeastasia.api.speech.microsoft.com');
        map.set('Origin', 'https://azure.microsoft.com');
    }

    return Object.fromEntries(map);

}

function requestBodySet(quality, lang, speaker, prosodyXml) {
    return {
        "ttsAudioFormat": quality,
        "ssml": "<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xml:lang=\"" + lang + "\">" +
            "<voice name=\"" + speaker + "\">" + prosodyXml + "</voice>" +
            "</speak>"
    }
}

function prosodySet(rate, volume, text) {
    let prosody = text;

    if ("default" !== rate && "default" === volume) {
        prosody = "<prosody rate=\"" + rate + "\" >" + text + "</prosody>";
    } else if ("default" === rate && "default" !== volume) {
        prosody = "<prosody volume=\"" + volume + "\" >" + text + "</prosody>";
    } else if ("default" !== rate && "default" !== volume) {
        prosody = "<prosody rate=\"" + rate + "\" volume=\"" + volume + "\">" + text + "</prosody>";
    }
    return prosody;
}

/**
 * 缓存日志
 * @param audioKey
 * @param audioData
 * @param audioPath
 * @param cacheDataNum
 */
function cacheLog(audioKey, audioData, audioPath, cacheDataNum) {
    //缓存音频文件
    let audioDataSaveSucc = $file.write({
        data: $data.fromUTF8(audioData),
        path: audioPath
    });

    if (!audioDataSaveSucc) {
        return;
    }


    //缓存日志
    let cachesPath = '$sandbox/caches.list';


    let cachesList = audioKey;

    if ($file.exists(cachesPath)) {

        //读取日志
        var data = $file.read(cachesPath);
        cachesList = data.toUTF8();

        var cacheData = cachesList.split("\n");


        if (cacheData.length >= cacheDataNum) {
            //删除日志中第一个元素
            var delAudioKey = cacheData.shift();

            $file.delete('$sandbox/' + delAudioKey);
        }

        //添加新元素
        cacheData.push(audioKey);

        cachesList = cacheData.join("\n");
    }


    //写入新日志
    let success = $file.write({
        data: $data.fromUTF8(cachesList),
        path: cachesPath
    });
}


exports.supportLanguages = supportLanguages;
exports.tts = tts;
