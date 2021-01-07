const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 3000;
const fetch = require('node-fetch');
const csv = require('csv-parser');
const fs = require('fs');
const upload = require('express-fileupload')
const request = require('request');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { stringify } = require('querystring');
// Importing Dependencies
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
var CronJob = require('cron').CronJob;
const path = require('path');
global.__basedir = __dirname;
var moment = require('moment'); // require
var HttpsProxyAgent = require('https-proxy-agent');

const maxSize = 2 * 1024 * 1024;

const {
    apiDealerKey,
    urlLead,
    apiLeadKey,
    pool,
    urlDealer,
    idpUrlAccessToken,
    apiLeadKeyAPP,
    urlLeadAPP,
    secretKey,
    host,
    hostApi,
    urlApiIdpRefreshAccessToken,
    proxy
} = require('./config/config.js');
const { Z_NO_COMPRESSION } = require('zlib');
const { default: contentSecurityPolicy } = require('helmet/dist/middlewares/content-security-policy');
const { env } = require('process');

pool.connect((err, client, release) => {
    if (err) {
        return console.error(err)
    } else {
        console.log("succes");
    }
})



app.use(bodyParser.urlencoded({
    // extended: false
    extended: true
}));
app.use(bodyParser.json({ limit: '50mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(bodyParser.raw({
    type: 'image/jpg',
    limit: '50mb'
}));


app.use(cors());
app.use(upload());

// const limit = rateLimit({
//     max: 10000,// max requests
//     windowMs: 60 * 60 * 1000, // 1 Hour
//     message: 'Trop de requêtes' // message to send
// });
// app.use(limit); // Setting limiter on specific route

// Data Sanitization against XSS
app.use(xss());
app.use(helmet());

//get all events 
app.get('/api/getevents', (req, res) => {
    let parseRes;
    pool.query("SELECT * FROM catchy.event", (error, results) => {
        if (error) {
            throw error
        } else {
            if (results.rows[0]) {
                results.rows[0].event_obj.description = results.rows[0].event_obj.description.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                results.rows.forEach(obj => {
                    for (let i = 0; i < obj.event_obj.attributes.length; i++) {
                        if (obj.event_obj.attributes[i].type == "mentions" || obj.event_obj.attributes[i].type == "paragraph") {
                            if (obj.event_obj.attributes[i].text != null || obj.event_obj.attributes[i].text != undefined)
                                obj.event_obj.attributes[i].text = obj.event_obj.attributes[i].text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                        }
                    }
                })
            }
            parseRes = JSON.stringify(results.rows).replace(/\\\"/g, "'")
            res.status(200).json(JSON.parse(parseRes));
        }
    })
});


app.get('/api/getdealers/:lat/:long', (req, res) => {
    let lat = req.params.lat;
    let long = req.params.long;
    console.log(urlDealer)
    console.log(apiDealerKey)
    let url = `${urlDealer}/dealers/locator?lat=${lat}&lon=${long}&language=fr&country=fr&filters=renault.blacklisted%3D%3Dfalse&pageSize=10&count=10`;
    fetch(url, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'apiKey': apiDealerKey
        },
    })
        .then(res => res.json())
        .then(json => res.send(json))
        .catch(err => res.json(err.statusCode));

})
//get all master events 
app.get('/api/getAllMasterEvents', (req, res) => {
    let parseRes;
    pool.query("SELECT * FROM catchy.event WHERE  (event_obj->> 'isMasterEvent')::boolean", (error, results) => {
        if (error) {
            throw error
        } else {
            if (results.rows[0]) {
                results.rows[0].event_obj.description = results.rows[0].event_obj.description.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                results.rows.forEach(obj => {
                    for (let i = 0; i < obj.event_obj.attributes.length; i++) {
                        if (obj.event_obj.attributes[i].type == "mentions" || obj.event_obj.attributes[i].type == "paragraph") {
                            if (obj.event_obj.attributes[i].text != null || obj.event_obj.attributes[i].text != undefined)
                                obj.event_obj.attributes[i].text = obj.event_obj.attributes[i].text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                        }

                    }
                })
            }
            parseRes = JSON.stringify(results.rows).replace(/\\\"/g, "'")
            res.status(200).json(JSON.parse(parseRes));
        }
    })
});


app.get('/api/getCurrentEvent/:id', (req, res) => {
    let id = req.params.id;
    let parseRes
    pool.query("SELECT * FROM catchy.event WHERE event_id ='" + id + "'", (error, results) => {
        if (error) {
            throw error
        } else {
            if (results.rows[0]) {
                results.rows[0].event_obj.description = results.rows[0].event_obj.description.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                results.rows.forEach(obj => {
                    for (let i = 0; i < obj.event_obj.attributes.length; i++) {
                        if (obj.event_obj.attributes[i].type == "mentions" || obj.event_obj.attributes[i].type == "paragraph") {
                            if (obj.event_obj.attributes[i].text != null || obj.event_obj.attributes[i].text != undefined)
                                obj.event_obj.attributes[i].text = obj.event_obj.attributes[i].text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                        }

                    }
                })
            }
            parseRes = JSON.stringify(results.rows).replace(/\\\"/g, "'")
            res.status(200).json(JSON.parse(parseRes));
        }
    })
})

//create a event
app.post('/api/createEvent', function (req, res) {
    let event_obj = req.body;
    let codeEvent = uuidv4();
    let hours_tempo = null;
    let istempo = false;
    var dateNow = dateFormat(new Date());
    var path = req.body.theme.bannerImage.path;
    var image_name = req.body.theme.bannerImage.file_name;
    console.log("req :", req.body.theme.bannerImage);

    for (let i = 0; i < event_obj.attributes.length; i++) {
        if (event_obj.attributes[i].type == "config" && event_obj.attributes[i].values[0].optTempo != null) {
            hours_tempo = event_obj.attributes[i].values[0].dateTempo
            istempo = event_obj.attributes[i].values[0].optTempo
        }
    }
    var sql = "INSERT INTO catchy.event (event_obj,code_event,hours_tempo,is_tempo,date_creation,path,image_name) VALUES ($1,$2,$3,$4,$5,$6,$7)"
    pool.query(sql, [event_obj, codeEvent, hours_tempo, istempo, dateNow, path, image_name], (error, results) => {
        if (error) {
            console.log("Error in inserting in the database" + error);
        } else {
            res.json(res.statusCode);
        }
    });
});


//update an Event 
app.put('/api/updateEvent/:id', function (req, res) {
    let id = req.params.id;
    let event_obj = req.body
    let event = JSON.stringify(req.body).replace(/'/g, '\\"')
    let hours_tempo = null
    let istempo = false
    let sql = ""

    if (!req.body.theme.bannerImage.path || !req.body.theme.bannerImage.file_name) {
        var path = "";
        var image_name = "";
    } else {
        var path = req.body.theme.bannerImage.path;
        var image_name = req.body.theme.bannerImage.file_name;
    }

    for (let i = 0; i < event_obj.attributes.length; i++) {
        if (event_obj.attributes[i].type == "config") {
            if (event_obj.attributes[i].values[0].optTempo) {
                hours_tempo = event_obj.attributes[i].values[0].dateTempo
                istempo = event_obj.attributes[i].values[0].optTempo
                sql = "UPDATE catchy.event SET event_obj = event_obj || '" + event + "', hours_tempo = '" + hours_tempo + "', is_tempo = '" + istempo + "',path = '"+ path + "', image_name = '" + image_name + "' WHERE event_id = '" + id + "'";
            } else {
                sql = "UPDATE catchy.event SET event_obj = event_obj || '" + event + "', hours_tempo = NULL , is_tempo = '" + istempo + "',path = '"+ path + "', image_name = '" + image_name + "' WHERE event_id = '" + id + "'";
            }
        }
    }
    pool.query(sql, (error, results) => {
        if (error) {
            throw error
        } else {
            res.status(200).json(results.rows)
        }
    })
})

//remove an event 
app.delete('/api/deleteEvent/:id', function (req, res) {
    let id = req.params.id;
    pool.query("DELETE FROM catchy.event WHERE event_id ='" + id + "'", (error, results) => {
        if (error) {
            throw error
        } else {
            pool.query('SELECT *  FROM catchy.event', (error, results) => {
                if (error) {
                    throw error
                } else {
                    res.status(200).json(results.rows)
                }
            })
        }
    })
})



app.get('/api/alldealers/', function (req, res) {
    pool.query('SELECT *  FROM catchy.dealer WHERE code_rrf IS NOT NULL', (error, results) => {
        if (error) {
            throw error
        } else {
            res.status(200).json(results.rows)
        }
    })
})

app.post('/api/dealer/', (req, res) => {
    let filedealer = req.files
    let results = [];
    if (filedealer) {
        //moving new file into uplaods folder
        filedealer.file.mv('uploads/' + filedealer.file.name, function (err) {
            if (err)
                throw err;
        })
        pool.query("TRUNCATE TABLE catchy.dealer", (error, result) => {
            if (error) {
                throw error
            } else {
                console.log("done");
            }
        })
        //parse csv file into json data and push it into postgres database
        fs.createReadStream('uploads/' + filedealer.file.name)
            .pipe(csv())
            .on('data', (data) => {
                results.push(data);
            })
            .on('end', function () {
                //do something with csvData
                var sql = "INSERT INTO catchy.dealer (code_rrf,nom_affaire,postal_code) VALUES ($1,$2,$3)";
                results.forEach(el => {
                    pool.query(sql, [el.code_rrf, el.nom_affaire, el.code_postale], (error, result) => {
                        if (error) {
                            throw error;
                        }
                    })
                });
            });
        res.json(res.statusCode);
    } else {
        console.log("no files")
    }
})

function dateFormat(date) {
    var formatter = 'YYYY-MM-DD HH:mm:ss';
    return moment(date).format(formatter);
}

async function sumbitLead(lead, urlOfLead, apiKeyOfLead) {
    var dateNow = dateFormat(new Date())
    try {
        const httpOptions = {
            headers: {
                'apiKey': apiKeyOfLead,
                'Content-Type': 'application/json'
            }
        }
        var result = await axios.post(urlOfLead, JSON.stringify(lead), httpOptions);
        if (result.data.correlationId) {
            var sql = "INSERT INTO catchy.lead (id_lead_submission, lead_obj,date_creation,succes) VALUES($1,$2,$3,$4)"
            pool.query(sql, [lead.leadInfo.leadSubmissionId, lead, dateNow, true], (error, results) => {
                if (error)
                    throw error
            });
            return result.data
        }
    } catch (err) {
        console.log("sumbitLead err :", err);
        if (err.response) {
            console.log(err.response.data.messages)
            var sql = "INSERT INTO catchy.lead (lead_obj, msg_error,date_creation,succes) VALUES($1,$2,$3,$4)"
            pool.query(sql, [lead, err.response.data.messages, dateNow, false], (error, results) => {
                if (error)
                    throw error
            });
            return err.response.data.messages[0].message
        }
    }
}



function runLeadCron(urlOfLead, apiKeyOfLead) {
    var leadTempo;
    console.log('Before job instantiation');
    const job = new CronJob('0 0 */1 * * *', function () {
        const d = new Date();
        pool.query("SELECT * FROM catchy.form_tempo WHERE  date_tempo <= NOW()::timestamp", async (error, results) => {
            if (error)
                throw error
            else {
                if (results.rows) {
                    console.log(results.rows);
                    for (let i = 0; i < results.rows.length; i++) {
                        leadTempo = await sumbitLead(results.rows[i].form_obj, urlOfLead, apiKeyOfLead)
                        //par id
                        pool.query("DELETE FROM catchy.form_tempo WHERE id = '" + results.rows[i].id + "'", (error, results) => {
                            if (error)
                                throw error
                        })
                    }

                }
            }
        })
    });
    console.log('After job instantiation');
    job.start();
}

function runPurgeCron() {

    console.log('Before job instantiation purge lead and event table');
    const job = new CronJob('0 0 0 * * *', function () {
        const d = new Date();
        pool.query("DELETE FROM catchy.lead WHERE date_creation < now() - INTERVAL '30 DAYS'");
        pool.query("DELETE FROM catchy.event WHERE date_creation < now() - INTERVAL '30 DAYS'");
    });
    console.log('After job instantiation  purge lead and event table');
    job.start();
}

function runPurgeCronImage() {
    let foundImage = [];
    console.log('Before job instantiation purge lead and event table');
    const job = new CronJob('0 0 0 * * *', function () {
        fs.readdir('assets/events/', function (err, files) {
            if (err) {
              console.error("Could not list the directory.", err);
              process.exit(1);
            }
            pool.query("SELECT image_name FROM catchy.event", (error, results) =>{
                if (error)
                    throw error;
                //search image
                for (var i = 0; i < files.length; i++){
                    for(var j = 0; j < results.rows.length; j++){
                        if(files[i] === results.rows[j].image_name)
                            foundImage[i] = files[i]     
                    }
                }

                //remove files not found
                for (var i = 0; i < files.length; i++) {
                    if (files[i] !== foundImage[i]) {
                        try {
                            fs.unlinkSync('assets/events/' + files[i])
                            //file removed
                        } catch (err) {
                            console.error(err)
                        }
                    }
                } 
            });
        });
       
    });
    console.log('After job instantiation  purge lead and event table');
    job.start();
}

async function createLeadAPP(body, urlOfLead, apiKeyOfLead, event_id, date_tempo) {
    var lead = body
    delete lead.client['recaptcha'];
    console.log(date_tempo, event_id)
    if (date_tempo !== "null") {
        var sql = "INSERT INTO catchy.form_tempo (form_obj,event_id,date_tempo) VALUES($1,$2,$3)"
        pool.query(sql, [lead, event_id, date_tempo], (error, results) => {
            if (error)
                throw error
        })
        return { "Form Tempo wait for submit": true }
    }
    else {
        var result = await sumbitLead(lead, urlOfLead, apiKeyOfLead)
        return result;
    }
}


function createLeadPWA(body, urlOfLead, apiKeyOfLead, event_id, date_tempo) {
    var lead = body
    delete lead.client['recaptcha'];
    console.log(date_tempo, event_id)
    if (date_tempo !== "null") {
        var sql = "INSERT INTO catchy.form_tempo (form_obj,event_id,date_tempo) VALUES($1,$2,$3)"
        pool.query(sql, [lead, event_id, date_tempo], (error, results) => {
            if (error)
                throw error
        })
        return { "Form Tempo wait for submit": true }
    }
    else {
        sumbitLead(lead, urlOfLead, apiKeyOfLead)
        return { "Form sumbit": true };
    }
}

console.log()
app.post('/api/lead/:event_id/:date_tempo', async function (req, res) {
    let event_id = req.params.event_id
    let date_tempo = req.params.date_tempo
    if (req.body.client.recaptcha) {
        var resCaptcha = await validateCaptcha(req.body)
        if (!resCaptcha.success) {
            res.json("Captcha Invalide")
        } else {
            var result = createLeadPWA(req.body, urlLead, apiLeadKey, event_id, date_tempo);
            console.log(result);
            res.json(result);
        }
    } else {
        var result = createLeadPWA(req.body, urlLead, apiLeadKey, event_id, date_tempo);
        console.log(result);
        res.json(result);
    }
})

app.post('/api/leadAPP/:event_id/:date_tempo/', async function (req, res) {
    let event_id = req.params.event_id
    let date_tempo = req.params.date_tempo
    var result = await createLeadAPP(req.body, urlLeadAPP, apiLeadKeyAPP, event_id, date_tempo);
    console.log(result);
    res.json(result);
}
)


app.get('/api/leads/', function (req, res) {
    let resuTrue = [];
    pool.query('SELECT * FROM catchy.lead', (error, results) => {
        if (error) {
            throw error
        } else {
            results.rows.forEach(resu => {
                if (resu.succes)
                    resuTrue.push(resu)
            })
            res.status(200).json(resuTrue)
        }
    })
})


app.get('/api/singleLead/:id', function (req, res) {
    let id = req.params.id
    pool.query("SELECT * FROM catchy.lead WHERE id_lead_submission ='" + id + "'", (error, results) => {
        if (error) {
            throw error
        } else {
            if (results.rows[0].succes) {
                res.status(200).json(results.rows)
            }
        }
    })
})

app.delete('/api/singleLead/:id', function (req, res) {
    let id = req.params.id

    pool.query("DELETE FROM catchy.lead WHERE id_lead_submission ='" + id + "'", (error, results) => {
        if (error) {
            throw error
        } else {
            pool.query('SELECT *  FROM catchy.lead', (error, results) => {
                if (error) {
                    throw error
                } else {
                    res.status(200).json(results.rows)
                }
            })
        }
    })
})

app.post('/api/carsWished', function (req, res) {
    let file = req.files
    let results = [];
    if (file) {
        //moving new file into uplaods folder
        file.file.mv('uploads/' + file.file.name, function (err) {
            if (err)
                throw err;
            else {
                //parse csv file into json data and push it into postgres database
                fs.createReadStream('uploads/' + file.file.name)
                    .pipe(csv())
                    .on('data', (data) => {
                        results.push(data);

                    })
                    .on('error', (error) => {
                        console.log(error);
                    })
                    .on('end', () => {
                        res.json(results);
                    });
            }
        })
    }
})

app.get('/api/FrPostalCode', async function (req, res) {
    console.log('entered');
    try {
        var httpsProxyAgent = require('https-proxy-agent');

        if (process.env.NODE_ENV === 'localhost') {
            var agent = new httpsProxyAgent(proxy);
        } else {
            var agent = new httpsProxyAgent(proxy);
        }
        var config = {
            url: 'https://geo.api.gouv.fr/communes?fields=code,nom,centre,codesPostaux',
            httpsAgent: agent
        }
        var result = await axios.request(config);
        if (result) {
            res.send(result['data']);
        }
    } catch (error) {
        console.log(error);
        res.json(error);
    }

})




async function getAccessToken(idpUrlAccess) {
    var proxyhost = 'http://app-proxy.gcp.renault.fr:80';

    return new Promise(function (resolve, reject) {
        request({
            'url': idpUrlAccess,
            'method': "POST",
            'proxy': proxyhost
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                console.log("res", res)
                resolve(res);
            } else {
                console.log("error", error)
                reject(response)
            }
        });
    });
}


async function getIdpRes(idpUrlAccess) {
    try {
        var resIdp = await getAccessToken(idpUrlAccess);
        console.log("resIdp", resIdp);
        return resIdp;
    } catch (error) {
        console.log("error", error)
        return {
            "code": 3,
            "description": "Erreur Auth IDP",
            "error": error
        };
    }

}

app.post('/api/auth', function (req, res) {
    var code = req.query['code'];
    var idpUrlAccess = idpUrlAccessToken + code;
    getIdpRes(idpUrlAccess).then(function (data) {
        res.json(data);
    }).catch(function (error) {
        res.json(error);
    });
});


app.post('/api/auth/refresh_token', function (req, res) {

    var refreshToken = req.query['refresh_token'];
    var idpUrlAccessRefresh = urlApiIdpRefreshAccessToken + refreshToken;
    getIdpRes(idpUrlAccessRefresh).then(function (data) {
        res.json(data);
    }).catch(function (error) {
        res.json(error);
    });
});

app.post('/api/uploadfile', function (req, res, next) {
    const file = req.files
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.file;
    var nom = Date.now() + "-" + sampleFile.name;
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv('assets/events/' + nom, function (err) {
        if (err)
            return res.status(500).send(err);

        res.status(200).send({
            statusCode: 200,
            status: 'success',
            // uploadedFile: file,
            'path': hostApi + "/uploadProfile/" + nom,
            'file_name': nom
        })
    });


}, (error, req, res, next) => {
    res.status(400).send({
        error: error.message
    })
})

async function validateCaptcha(bodyLead) {
    const proxy = {
        proxyhost: 'http://app-proxy.gcp.renault.fr:80'
    }
    // Verify URL
    const query = stringify({
        secret: secretKey,
        response: bodyLead.client.recaptcha,
        //remoteip: req.connection.remoteAddress
    });

    const verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`;


    // Make a request to verifyURL
    const body = await fetch(verifyURL).then(res => res.json());

    // If not successful
    if (body.success !== undefined && !body.success) {
        return ({ success: false, msg: 'Failed captcha verification' });
    } else {
        // If successful
        return ({ success: true, msg: 'Captcha passed' });
    }



}

app.post('/uploadProfile', function (req, res) {

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.file;
    var nom = Date.now() + "-" + sampleFile.name;
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv('assets/events/' + nom, function (err) {
        if (err)
            return res.status(500).send(err);

        res.json({
            'path': hostApi + "/uploadProfile/" + nom
        })
    });
});

app.get('/uploadProfile/:fileName', function (req, res) {

    const fileName = req.params.fileName;
    const directoryPath = __basedir + "/assets/events/";
    res.download(directoryPath + fileName, fileName, (err) => {
        if (err) {
            res.status(500).send({
                message: "Could not download the file. " + err,
            });
        }
    });
});

// app.use(errHandler);
app.listen(port, () => {
    runLeadCron(urlLead, apiLeadKey);
    runPurgeCron();
    runPurgeCronImage();
    console.log('Server is running at ' + port);
})