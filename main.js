import request from 'request'
import cheerio from 'cheerio'
import { List, Map, Range } from 'immutable'


const serializeCookies = (cookies) => {
  return Object.keys(cookies).reduce((cookieString, cookieKey) => {
    return `${cookieString} ${cookieKey}=${cookies[cookieKey]}`
  }, '')
}

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
}


const signIn = () => {
  const signInUrl = 'https://zdjc.cz/signInUser'
  const options = {
   url: signInUrl,
   headers: defaultHeaders,
   Referer: 'https://zdjc.cz/prihlaseni',
   method: 'POST',
   form: {
    'j_username': 'name'
    'j_password': 'email',
   }
  }
 
  return new Promise((resolve, reject) => {
    request(options, (e, r, b) => {
      if (e) {
        reject(e)
        return
      }

      const setCookieHeader = r.headers['set-cookie']
      if (!setCookieHeader || !setCookieHeader.length) {
        reject('bad signing response')
        return
      }

      const setCookiesRaw = setCookieHeader[0].split(';')
      console.log(setCookiesRaw.join(' '))
      const sessionIdRaw = setCookiesRaw.find((part) => {
        return part.toLowerCase().indexOf('jsessionid') !== -1
      })

      if (!sessionIdRaw) {
        reject('no session id in headers')
        return
      }


      const sessionId = sessionIdRaw.replace('JSESSIONID=', '')
      resolve(sessionId)
    })
  })
 
}


// TODO: take from last (right side)
// TODO: find ones that are close to each other
const getInterestingSeatIds = (domString) => {
  const $ = cheerio.load(domString)
  
  const prioritySelectors = Map({
    3: '#prizemi #rada3 .sedadlo-free',
    4: '#prizemi #rada4 .sedadlo-free',
    5: '#prizemi #rada5 .sedadlo-free',
    6: '#prizemi #rada6 .sedadlo-free',
    1: '#prizemi #rada1 .sedadlo-free',
    2: '#prizemi #rada2 .sedadlo-free',
    7: '#prizemi #rada7 .sedadlo-free',
    8: '#prizemi #rada8 .sedadlo-free',
    9: '#prizemi #rada9 .sedadlo-free',
    10: '#prizemi #rada10 .sedadlo-free',
    12: '#balkon #rada12 .sedadlo-free',
    13: '#balkon #rada13 .sedadlo-free',
    14: '#balkon #rada14 .sedadlo-free',
    11: '#balkon #rada11 .sedadlo-free'
  })

  const availableSeatIds = prioritySelectors.reduce((allSeatIds, selector, index) => {
    const seatDivs = $(selector)

    if (!seatDivs || !seatDivs.length) {
      // return allSeatIds.set(index, List())
      allSeatIds[index] = List()
      return allSeatIds
    }

    const seatIds = List(Object.keys(seatDivs)).flatMap((seatDivKey) => {
      const seatDiv = seatDivs[seatDivKey]
      if (!seatDiv.attribs) {
        return []
      }

      const seatDivId = seatDiv.attribs.id
      const seatId = seatDivId.replace('sedadlo', '')

      return [ seatId ]
    })


    console.log(seatIds.join(','))

    // return allSeatIds.set(index, seatIds)
    allSeatIds[index] = seatIds
    return allSeatIds
  }, {})


  return availableSeatIds
}


const getSeatIds = (playId, sessionId) => {
  const url = `https://zdjc.cz/rezervace/detail?id=${playId}`
  const headers = {
    'User-Agent': defaultHeaders['User-Agent'],
    Cookie: serializeCookies({ JSESSIONID: sessionId }),
  }

  return new Promise((resolve, reject) => {
    request({ url, headers }, (err, response, body) => {
      if (err) {
        reject(err)
        return
      }
    
      resolve(getInterestingSeatIds(body))
    })
  })
}


const reserveTickets = (sessionId, playId, ticketIds) => {
  const url = `https://zdjc.cz/rezervace/vytvorit-rezervaci?id=${playId}&ids=${ticketIds.join(',')}`
  const headers = {
    'User-Agent': defaultHeaders['User-Agent'],
    Cookie: serializeCookies({ JSESSIONID: sessionId }),
  }

  return new Promise((resolve, reject) => {
    request({ url, headers }, (err, response, body) => {
      if (err) {
        reject(err)
        return
      }
    
      resolve(body)
    })
  })

}

let s = null

// signIn()
//   .then((sessionId) => {
//     s = sessionId
//     const playId = 2033
//     return getSeatIds(playId, sessionId)
//     // return {
//     //   'playId': [ 'sid1', 'sid2' ],
//     // }
//   })
//   .then((r) => {
//     console.log(r)
//   })
//   .catch((e) => {
//     console.error(e)
//   })

const log = (b) => {
  const $ = cheerio.load(b)
  console.log($('h1').text())
  console.log('=============')
}

const err = (e) => {
  console.error(e)
}

// const sid = 'ECD635633692D1603FAEE5624963E695'
const sid = '803C23070C90C19BB8B5DA172160CDD6'
const times = 5

const config = {
  // 2030: [ ],
  2032: [ ],
  2035: [ ],
  2041: [ ],
  2042: [ ]
}

// console.log('signing in')
// signIn()

Object.keys(config).forEach((playId) => {
  // new Range(0, times).forEach(() => {
  console.log('getting seat ids for ', playId)
  getSeatIds(playId, sid)
    .then((seats) => {
      const realSeats = List(Object.keys(seats)).flatMap((rowId) => {
        return seats[rowId] 
      })
      const takenSeats = realSeats.take(16)
      console.log('taken: ', takenSeats)
      
      takenSeats.forEach((seatId) => {
        new Range(0, times).forEach(() => {
          reserveTickets(sid, playId, [ seatId ]).then(log).catch(err)
        }) 
      })
    })
    .catch(err)
  // })
})
