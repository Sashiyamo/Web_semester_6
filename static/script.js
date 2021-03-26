let url = window.location.protocol + "//" + window.location.hostname
if (window.location.port !== ""){
    url = url + ":" + window.location.port
}

function createWeatherList(info) {
    return `
    <ul class="listed">
        <li>
            <span>Осадки</span>
            <span>`+info["weather"][0]["main"]+`</span>
        </li>
		<li>
            <span>Облачность</span>
            <span>`+info["clouds"]["all"]+` %</span>
        </li>
        <li>
            <span>Давление</span>
            <span>`+info["main"]["pressure"]+` миллибар</span>
        </li>
		<li>
            <span>Влажность</span>
            <span>`+info["main"]["humidity"]+` %</span>
        </li>
        <li>
            <span>Видимость</span>
            <span>`+info["visibility"]+` метров</span>
        </li>
    </ul>
    `
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
                document.getElementById("fixed_info").innerHTML = `
                <div class="fixed-left">
                    <h3>`+info['name']+`</h3>
                    <div class="fixed-left-low">
                        <img src="`+getWeatherIcon(info)+`" class="img1">
                        <p>`+info["main"]["temp"]+`°C</p>
                    </div>
                </div>
                <div class="fixed-right">
                    `+createWeatherList(info)+`
                </div>
                `
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
		.catch(e => fn(null, false))
}

function getWeatherIcon(info) {
    return "https://openweathermap.org/img/w/" + info["weather"][0]["icon"] + ".png"
}

function addNewCityToList(info) {
    return `
    <li>
        <div class="lihead">
            <h3>` + info["name"] + `</h3>
            <p>` + info["main"]["temp"] + `°C</p>
            <img src="` + getWeatherIcon(info) + `" class="img2">
            <button class="delete circle" city-id="`+info["id"]+`">×</button>
        </div>
        ` + createWeatherList(info) + `
    </li>
    `
}

function addNewCityToListInLoading(info) {
    return `
    <li data-tmp="`+info["id"]+`">
        <div class="lihead" >
            <h3>` + info["name"] + `</h3>
            <div class="degree"></div>
            <div></div>
            <button class="delete circle" city-id="`+info["id"]+`">×</button>
        </div>
        <img src="https://acegif.com/wp-content/uploads/loading-11.gif" class="img3">
    </li>
    `
}

function removeCityFromList() {
    let w = document.getElementsByClassName("delete");
    for (let i = 0; i < w.length; i++) {
        let wi = w.item(i)
        wi.addEventListener("click", function () {
            wi.parentElement.parentElement.remove()
            fetch(`${url}/favs/get`)
            .then(res => res.json())
            .then(data => {
                delete data[wi.getAttribute("city-id")]
                fetch(`${url}/favs/set`, {
                    method: 'POST', 
                    body: JSON.stringify(data),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                })
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

    let infoT = {
        name: city,
        id: Math.random()
    }

    document.getElementById("list_info").insertAdjacentHTML("afterbegin", addNewCityToListInLoading(infoT))

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
                        document.getElementById("list_info").insertAdjacentHTML("afterbegin", addNewCityToList(info))
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
        
            document.getElementById("list_info").insertAdjacentHTML("afterbegin", addNewCityToListInLoading(info))
        
            weatherFromName(value, function (info, status) {
                document.querySelectorAll('[city-id="'+key+'"]')[0].parentElement.parentElement.remove()
                if (status) {
                    if (info["cod"] !== 200) {
                        alert("An error "+info["message"]+" has occurred")
                    }
                    else {
                        document.getElementById("list_info").insertAdjacentHTML("afterbegin", addNewCityToList(info))
                        removeCityFromList()
                        data[info.id] = info[name]
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
    })