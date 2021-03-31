let url = window.location.protocol + "//" + window.location.hostname
if (window.location.port !== ""){
    url = url + ":" + window.location.port
}

function createWeatherList(info) {
    let t = document.querySelector('#createWeatherList').cloneNode(true)
    let list = t.content.querySelectorAll('span')
    list[1].textContent = `${info["weather"][0]["main"]}`
    list[3].textContent = `${info["clouds"]["all"]}` + ` %`
    list[5].textContent = `${info["main"]["pressure"]}` + ` миллибар`
    list[7].textContent = `${info["main"]["humidity"]}` + ` %`
    list[9].textContent = `${info["visibility"]}` + ` метров`
    return document.importNode(t.content, true)
}
    
function userPosition(fn) {
    let defaultPos = [60, 30]

    if (!navigator.geolocation) {
        alert("Browser not supported")
        fn(defaultPos)
        return
    }

    navigator.geolocation.getCurrentPosition(
        function (location) {
            fn([location.coords.latitude, location.coords.longitude])
        },
        function () {
            alert("Geolocation access denied")
            fn(defaultPos)
        }
    )
}

function refreshUserLoc() {
    userPosition(function (loc) {
        weatherFromLatLon(loc[0], loc[1], function (info, status) {
            if (status) {
                let currWeather = document.querySelector('#fixed_info')
                console.log(currWeather)
                let t = document.querySelector('#refreshUserLoc').cloneNode(true)
                t.content.querySelector('h3').textContent = `${info['name']}`
                t.content.querySelector('img').setAttribute('src', `${getWeatherIcon(info)}`)
                t.content.querySelector('p').textContent = `${info["main"]["temp"]}` + '°C'
                t.content.querySelector('.fixed-right').append(createWeatherList(info))
                currWeather.innerHTML = ''
                currWeather.append(document.importNode(t.content, true))
            }
            else {
                document.getElementById("fixed_info").innerHTML = 'ID lookup error'
            }

        })
    })
}

refreshUserLoc()
document.querySelectorAll(".refresh")[0].addEventListener("click",function () {
    document.getElementById("fixed_info").innerHTML = '<img src="https://acegif.com/wp-content/uploads/loading-11.gif" class="img3">'
    refreshUserLoc()
})

function weatherFromName(name, fn) {
	fetch(url + "/cityweather?name=" + name)
		.then(res => res.json())
		.then(res => fn(res[0], res[1]))
		.catch(e => fn(null, false))
}

function weatherFromLatLon(lat, lon, fn) {
	fetch(url+ "/coordinates?lat=" + lat + "&lon=" + lon)
		.then(res => res.json())
		.then(res => fn(res[0], res[1]))
		.catch(e => {console.log(e); fn(null, false)})
}

function getWeatherIcon(info) {
    return "https://openweathermap.org/img/w/" + info["weather"][0]["icon"] + ".png"
}

function addNewCityToList(info) {
    let t = document.querySelector('#addNewCityToList').cloneNode(true)
    t.content.querySelector('h3').textContent = ` ${info["name"]}`
    t.content.querySelector('p').textContent = `${info["main"]["temp"]}` + '°C'
    t.content.querySelector('img').setAttribute('src', `${getWeatherIcon(info)}`)
    t.content.querySelector('button').setAttribute('city-id', `${info["id"]}`)
    t.content.querySelector('li').append(createWeatherList(info))
    return document.importNode(t.content, true)
}

function addNewCityToListInLoading(info) {
    let t = document.querySelector('#addNewCityToListInLoading').cloneNode(true)
    t.content.querySelector('li').setAttribute('data-tmp',`${info["id"]}`)
    t.content.querySelector('h3').textContent = ` ${info["name"]}`
    t.content.querySelector('button').setAttribute('city-id', `${info["id"]}`)
    return document.importNode(t.content, true)
}

function removeCityFromList() {
    let w = document.getElementsByClassName("delete");
    for (let i = 0; i < w.length; i++) {
        let wi = w.item(i)
        wi.addEventListener("click", function () {
            wi.disabled = true
            
            fetch(`${url}/favs/delete`, {
                method: 'DELETE', 
                body: JSON.stringify({cityID: wi.getAttribute("city-id")}),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            })
                .then(res => {
                    if(res.status === 200) {
                        wi.parentElement.parentElement.remove()
                    } else {
                        console.error('Save error')
                    }
                })
        })
    }
}

document.getElementById("add_form").onsubmit = function () {
    let cityInput = document.getElementById("add_info")
    let city = cityInput.value
    cityInput.value = ""

    if (city === "") {
        alert("The input field is empty")
        return false
    }

    if (!window.navigator.onLine) {
        alert("You haven't connection. Please, reconnect and try again")
        return false
    }

    let infoT = {
        name: city,
        id: Math.random()
    }

    document.getElementById("list_info").prepend(addNewCityToListInLoading(infoT))

    weatherFromName(city, function (info, status) {
        fetch(`${url}/favs/get`)
            .then(res => res.json())
            .then(data => {
                document.querySelectorAll('[data-tmp="'+infoT["id"]+'"]')[0].remove()
                if (status) {
                    if (info["cod"] !== 200) {
                        alert("An error "+info["message"]+" has occurred")
                    }
                    else if (data[info["id"]]) {
                        alert("The city already exists "+data[info["id"]])
                    }
                    else {
                        document.getElementById("list_info").prepend(addNewCityToList(info))
                        removeCityFromList()
                        data[info["id"]] = info["name"]
                        fetch(`${url}/favs/set`, {
                            method: 'POST', 
                            body: JSON.stringify(data),
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                        })
                    }
                }
                else {
                    alert("An unknown error occurred")
                }
            })
    })

    return false
}

fetch(`${url}/favs/get`)
    .then(res => res.json())
    .then(data => {
        for (let i = 0; i < Object.keys(data).length; i++) {
            let key = Object.keys(data)[i]
            let value = data[key]
            let info = {
                name: value,
                id: key
            }
        
            document.getElementById("list_info").prepend(addNewCityToListInLoading(info))
        
            weatherFromName(value, function (info, status) {
                document.querySelectorAll('[city-id="'+key+'"]')[0].parentElement.parentElement.remove()
                if (status) {
                    if (info["cod"] !== 200) {
                        alert("An error "+info["message"]+" has occurred")
                    }
                    else {
                        document.getElementById("list_info").prepend(addNewCityToList(info))
                        removeCityFromList()
                        data[info.id] = info.name
                    }
                }
                else {
                    alert("An unknown error occurred")
                }
            })
        }
        fetch(`${url}/favs/set`, {
            method: 'POST', 
            body: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .catch(e => {
            
        })
    })

