import {createContext} from 'react'

export const HOST = 'https://coffeetox.ru' //'http://localhost' 

export const cfxContext = createContext({
    inspectContent: () => {}
})

export const usernameValidation = {
    minLength: {
        value: 5,
        message: 'Имя должно быть от 5 до 30 символов'
    },
    maxLength: {
        value: 30,
        message: 'Имя должно быть от 5 до 30 символов'
    }
}

export const tagValidation = {
    minLength: {
        value: 5,
        message: 'Тег должен быть от 5 до 20 символов'
    },
    maxLength: {
        value: 20,
        message: 'Тег должен быть от 5 до 20 символов'
    },
    pattern: {
        value: /^[A-Za-z0-9_]*$/,
        message: 'Тег должен состоять из цифр, латинских букв и "_"'
    },
    validate: {
        is_free: (val) => {
            return quickFetch('/is_tag_free', {tag: val})
            .then(r => {
                if (!r.success)
                    throw Error('failed to check tag')
                else if(!r.is_free)
                    return 'Этот тег занят'
                return true
            })
            .catch(() => {
                return 'Не удалось узнать, свободен ли тег'
            })
        }
    }
}

export const emailValidation = {
    pattern: {
        value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        message: 'Недействительный адрес'
    }
}

export const passwordValidation = {
    minLength: {
        value: 4,
        message: 'Пароль должен быть не короче 4 символов'
    }
}

export const passwordRepValidation = {
    validate: {
        correct_rep: (val, other) => {
            return val == other.password || 'Пароли не совпадают'
        }
    } 
}

export function findInputError(errors, name) {
    const filtered = Object.keys(errors)
        .filter(key => key == name)
        .reduce((cur, key) => {
            cur.error = errors[key]
            return cur
        }, {})
    return filtered
}

export function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(blob); 
        reader.onloadend = function() {
            resolve(reader.result)
        }
    })
}

export function humanFileSize(bytes, si=false, dp=1) {
    const thresh = si ? 1000 : 1024;
  
    if (Math.abs(bytes) < thresh) {
      return bytes + 'B';
    }
  
    const units = si 
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10**dp;
  
    do {
      bytes /= thresh;
      ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
  
    return bytes.toFixed(dp) + units[u];
}

export function cropImage(img, x, y, w, h, type, quality) {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const context = canvas.getContext('2d')
    context.drawImage(img, x, y, w, h, 0, 0, w, h)
    return canvas.toDataURL(type, quality)
}

export function cropImageSrc(src, ...args) {
    return loadImage(src).then(img => cropImage(img, ...args))
}

export function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
    u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

export function imageToBase64(img) {
    return cropImage(img, 0, 0, img.width, img.height)
}


export function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            resolve(img)
        }
        img.onerror = () => resolve(null)
        img.src = src
    })
}

export function loadVideoMetadata(src) {
    return new Promise(resolve => {
        const videoElement = document.createElement('video')
        videoElement.crossOrigin = 'anonymous'
        videoElement.preload = 'metadata'
        videoElement.onloadedmetadata = () => {
            resolve(videoElement)
        }
        videoElement.onerror = () => resolve(null)
        videoElement.src = src
    })
}

export function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function shuffleArray(array) {
    let currentIndex = array.length
  
    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]]
    }
  }
  

export const isFormInvalid = (err) => {
    return Object.keys(err).length > 0
}

export function isIterable(obj) {
    if (obj == null) {
      return false
    }
    return typeof obj[Symbol.iterator] === 'function'
}

export const jsonToFormData = (data) => {
    const fd = new FormData()

    Object.keys(data).forEach(k => {
        if(!Array.isArray(data[k])) {
            fd.append(k, data[k])
            return
        }
        data[k].forEach(w => fd.append(k, w))
    })

    return fd
}

export const trimMultilineText = (s) => {
    return s.replace(/^(\n|\ )+|(\n|\ )+$/g, '')
}

export function formatTime(dt) {
    return String(dt.getHours()).padStart(2, "0") + ':'
        + String(dt.getMinutes()).padStart(2, "0")
}

export function formatDate(dt, year=false) {
    let w = String(dt.getDate()).padStart(2, '0') + '.'
        + String(dt.getMonth() + 1).padStart(2, '0')
    if (year)
        w += '.' + String(dt.getFullYear())
    return w
}

export function areDatesEqual(d1, d2) {
    return d1.getFullYear() == d2.getFullYear()
        && d1.getMonth() == d2.getMonth()
        && d1.getDate() == d2.getDate()
}

export function isToday(datetime) {
    let now = new Date()
    return areDatesEqual(datetime, now)
}

export function isYesterday(datetime) {
    let now = new Date()
    now.setDate(now.getDate() - 1)
    return areDatesEqual(datetime, now)
}

export function thisYear(dt) {
    return dt.getFullYear() == (new Date).getFullYear()
}

export function getLocalizedDateLabel(date, rel) 
{ 
    if (rel && isToday(date))
        return 'Сегодня'
    else if(rel && isYesterday(date))
        return 'Вчера'
    return date.toLocaleString('ru', { month: 'long', day: 'numeric'})
        + (thisYear(date)? '' : ' ' + date.getFullYear())
}

export function getPostDatetimeLabel(datetime) {
    let time = thisYear(datetime)?
        ' в ' + formatTime(datetime) : '';
    
    return getLocalizedDateLabel(datetime, true) + time
}

export function getLastSeenLabel(datetime) {

    if(datetime === null || isNaN(datetime))
        return 'Был в сети давно'

    let minutesAgo = Math.floor((new Date() - datetime) / 1000 / 60)
    let hoursAgo = Math.floor(minutesAgo / 60)

    if (minutesAgo < 1)
        return 'Онлайн'
    else if(minutesAgo < 60)
        return `Был в сети ${nItemsLabel(minutesAgo, 'минуту', 'минуты', 'минут', true)} назад`
    else if(hoursAgo <= 3)
        return `Был в сети ${nItemsLabel(hoursAgo, 'час', 'часа', 'часов', true)} назад`
    else
        return 'Был в сети ' + getPostDatetimeLabel(datetime).toLowerCase()
    
}

export function hostURL(path) {
    if(path[0] == '/')
        path = path.slice(1)
    return HOST + '/' + path
}

export function fileURL(file_id) {
    return hostURL('file/' + file_id)
}

export function userURL(user) {
    return '/user/' + user.tag
}

export function wordForm(n, a, b, c) {
    // a -- минуту (1, 21, 31...)
    // b -- минуты (2, 3, 4, 24...)
    // c -- минут (5, 6, 7, ...)

    if (10 <= n && n <= 20)
        return c
    else if(n % 10 == 1)
        return a
    else if(n % 10 <= 4 && n % 10 != 0)
        return b
    else
        return c
}

export function nItemsLabel(n, a, b, c, hideOne) {
    let form = wordForm(n, a, b, c)
    if(n == 1 && hideOne)
        return form
    return n + ' ' + form
}

export function quickFetch(url, params) {
    if (params)
        url = url + '?' + Object.keys(params).filter(k => params[k] !== undefined).map(k => `${k}=${params[k]}`).join('&')

    return fetch(hostURL(url), {credentials:'include'})
    .then(r => r.json())
}

export function loadUserData(tag) {
    return quickFetch('/user/json/' + tag)
    .then(data => {
        data.registration_date = new Date(data.registration_date)
        data.last_seen = new Date(data.last_seen)

        return data
    })
}