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
            <span>`+info["main"]["pressure"]+` мм ртутного столба</span>
        </li>
		<li>
            <span>Влажность</span>
            <span>`+info["main"]["humidity"]+` %</span>
        </li>
        <li>
            <span>Видимость</span>
            <span>`+info["visibility"]+` %</span>
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
    document.getElementById("fixed_info").innerHTML = "загрузка"
    refreshUserLoc()
})

function weatherFromName(name, fn) {
    try {
        fetch("https://api.openweathermap.org/data/2.5/weather?q="+name+"&units=metric&appid=31406e686af65816a70b9949041d484d").then(
            t => {
                t.json().then(function(b) {
                    try {
                        fn(b, true)
                    }
                    catch (e) {
                        fn(null, false)
                    }
                })
            }
        )
            .catch(t => fn(null, false))
    }
    catch (e) {
        fn(null, false)
    }

}

function weatherFromLatLon(lat, lon, fn) {
    fetch("https://api.openweathermap.org/data/2.5/weather?lat="+lat+"&lon="+lon+"&units=metric&appid=31406e686af65816a70b9949041d484d").then(
        t => {
            t.json().then(function(b) {
                try {
                    fn(b, true)
                }
                catch (e) {
                    fn(null, false)
                }
            })
        }
    )
        .catch(function (q) {
            fn(null, false)
        })
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
        Загрузка
    </li>
    `
}

function removeCityFromList() {
    let w = document.getElementsByClassName("delete");
    for (let i = 0; i < w.length; i++) {
        let wi = w.item(i)
        wi.addEventListener("click", function () {
            wi.parentElement.parentElement.remove()
            localStorage.removeItem(wi.getAttribute("city-id"))
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
        document.querySelectorAll('[data-tmp="'+infoT["id"]+'"]')[0].remove()
        if (status) {
            if (info["cod"] !== 200) {
                alert("An error "+info["message"]+" has occurred")
            }
            else if (localStorage.getItem(info["id"]) !== null) {
                alert("The city already exists "+localStorage.getItem(info["id"]))
            }
            else {
                document.getElementById("list_info").insertAdjacentHTML("afterbegin", addNewCityToList(info))
                removeCityFromList()
                localStorage.setItem(info["id"], info["name"])
            }
        }
        else {
            alert("An unknown error occurred")
        }
    })

    return false
}

for (let i = 0; i < localStorage.length; i++){
    let key = localStorage.key(i)
    let value = localStorage.getItem(key)
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
                localStorage.setItem(info["id"], info["name"])
            }
        }
        else {
            alert("An unknown error occurred")
        }
    })
}