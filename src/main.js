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

                let requestHeader = requestHeaderSet(secretKey, region, quality);
                let prosodyXml = prosodySet(rate, volume, text);
                let requestBody = requestBodySet(lang, speaker, prosodyXml);

                //$log.info('server:' + server);
                //$log.info('header:' + JSON.stringify(requestHeader));
                //$log.info('body:' + requestBody.toUTF8());


                const resp = await $http.request({
                    method: "POST",
                    url: server,
                    header: requestHeader,
                    body: requestBody
                });

                //$log.info('resp:' + JSON.stringify(resp));


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

function requestHeaderSet(secretKey, region, quality) {

    const map = new Map([
        ['Authorization', 'Bearer ' + secretKey],
        ['Ocp-Apim-Subscription-Key', secretKey],
        ['Content-Type', 'application/ssml+xml'],
        ['X-Microsoft-OutputFormat', quality],
        ['Host', region + '.tts.speech.microsoft.com'],
        ['User-Agent', 'curl'],
    ]);

    return Object.fromEntries(map);

}

function requestBodySet(lang, speaker, prosodyXml) {
    const xml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='" + lang + "'>" +
        "<voice name='" + speaker + "'>" + prosodyXml + "</voice>" +
        "</speak>"

    return $data.fromUTF8(xml);
}

function prosodySet(rate, volume, text) {
    let prosody = text;

    if ("default" !== rate && "default" === volume) {
        prosody = "<prosody rate='" + rate + "' >" + text + "</prosody>";
    } else if ("default" === rate && "default" !== volume) {
        prosody = "<prosody volume='" + volume + "' >" + text + "</prosody>";
    } else if ("default" !== rate && "default" !== volume) {
        prosody = "<prosody rate='" + rate + "' volume='" + volume + "'>" + text + "</prosody>";
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
