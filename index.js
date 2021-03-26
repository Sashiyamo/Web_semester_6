const express = require ("express")
const cors = require ("cors")
const fetch = require ("node-fetch")
const path = require ("path")
const coockieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const mongoose = require ("mongoose")
const uri = "mongodb+srv://admin:admin@cluster0.zmjrp.mongodb.net/WeatherMap?retryWrites=true&w=majority"

const storage = require ('./storagemodel')

const app = express ()

app.use(cors())
app.use(coockieParser())
app.use(bodyParser())

app.use("/static",express.static(__dirname+"/static"))

mongoose.connect(uri,
    {useNewUrlParser: true, useUnifiedTopology: true},
    (err) => {
        if(err) console.log(err)
    else {
        console.log('Your database is active now')
    }
})

const test = new storage({Data:{}})
test.save()

function weatherFromName(name, fn) {
    name = encodeURIComponent(name)
    try {
        fetch("https://api.openweathermap.org/data/2.5/weather?q="+name+"&units=metric&appid=9c267e6baa6acb2b0131fb15ee8200bb").then(
            t => {
                t.json().then(function(b) {
                    try {
                        fn(b, true)
                    }
                    catch (e) {
                        console.log(e)
                        fn(null, false)
                    }
                })
            }
        )
            .catch(t => {
                console.log(t)
                fn(null, false)
            })
    }
    catch (e) {
        console.log(e)
        fn(null, false)
    }

}

function weatherFromLatLon(lat, lon, fn) {
    lat = encodeURIComponent(lat)
    lon = encodeURIComponent(lon)
    fetch("https://api.openweathermap.org/data/2.5/weather?lat="+lat+"&lon="+lon+"&units=metric&appid=9c267e6baa6acb2b0131fb15ee8200bb").then(
        t => {
            t.json().then(function(b) {
                try {
                    fn(b, true)
                }
                catch (e) {
                    console.log(e)
                    fn(null, false)
                }
            })
        }
    )
        .catch(function (q) {
            console.log(q)
            fn(null, false)
        })
}

app.get("/", (req, res) =>{
    res.sendFile(path.join(__dirname+"/static/index.html"))
})

app.get("/cityweather", (req, res) =>{
    console.log(req.query.name)
    weatherFromName(req.query.name, function(){
        res.json([...arguments])
    })
})

app.get("/coordinates", (req, res) =>{
    console.log(req.query.lat, req.query.lon)
    weatherFromLatLon(req.query.lat, req.query.lon, function(){
        res.json([...arguments])
    })
})

app.use('/', (req, res, next) => {
    if(req.cookies.id) {
        storage.findById(req.cookies.id, (err, result) => {
            if(err) {
                res.status(400)
            } else {
                if(result) {
                    res.cookie('id', req.cookies.id)
                    next()
                } else {
                    storage.create({data: {}}, (err, result) => {
                        if(err) {
                            console.log(err)
                            res.status(400).end()
                        } else {
                            req.cookies.id = result._id
                            res.cookie('id', result._id)
                            next()
                        }
                    })
                }
            }
            
        })
        
    } else {
        storage.create({data: {}}, (err, result) => {
            if(err) {
                console.log(err)
                res.status(400).end()
            } else {
                req.cookies.id = result._id
                res.cookie('id', result._id)
                next()
            }
        })
    }
})

app.post('/favs/set', (req, res) => {
    let id = req.cookies.id
    console.log('body', req.body)
    storage.findById(id, async (err, result) => {
        if(err) {
            res.status(400).end()
        } else {
            if(!result) {
                res.status(404).end()
            } else {
                result.data = req.body
                await result.save()
                res.status(200)
            }
        }
    })
})

app.get('/favs/get', (req, res) => {
    let id = req.cookies.id 
    console.log(req.cookies)
    storage.findById(id, (err, result) => {
        if(err) {
            res.status(400).end()
        } else {
            if(!result) {
                res.status(404).end()
            } else {
                console.log(result)
                res.json(result.data || {})
            }
        }
    })
})

app.listen(process.env.PORT || 8888)