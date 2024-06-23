import {createContext} from 'react'

export const HOST = 'http://45.95.202.245'

export const cfxContext = createContext({
    inspectContent: () => {}
})

export function findInputError(errors, name) {
    const filtered = Object.keys(errors)
        .filter(key => key == name)
        .reduce((cur, key) => {
            cur.error = errors[key]
            return cur
        }, {})
    return filtered
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

export function hostURL(path) {
    if(path[0] == '/')
        path = path.slice(1)
    return HOST + '/' + path
}

export function fileURL(file_id) {
    return hostURL('file/' + file_id)
}
