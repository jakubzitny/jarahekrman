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
    // 'j_username': 'gu@protonmail.ch',
    // 'j_password': 'za6WrmxChSyX',
    // 'j_username': 'vojtatranta',
    // 'j_password': '@=.ufivj',
    'j_username': 'katerinamichovska',
    'j_password': 'i-s(Pxjk',
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

  // const prioritySelectors = Map({
  //   3: '#prizemi #rada3 .sedadlo-free',
  //   4: '#prizemi #rada4 .sedadlo-free',
  //   5: '#prizemi #rada5 .sedadlo-free',
  //   6: '#prizemi #rada6 .sedadlo-free',
  //   1: '#prizemi #rada1 .sedadlo-free',
  //   2: '#prizemi #rada2 .sedadlo-free',
  //   7: '#prizemi #rada7 .sedadlo-free',
  //   8: '#prizemi #rada8 .sedadlo-free',
  //   9: '#prizemi #rada9 .sedadlo-free',
  //   10: '#prizemi #rada10 .sedadlo-free',
  //   12: '#balkon #rada12 .sedadlo-free',
  //   13: '#balkon #rada13 .sedadlo-free',
  //   14: '#balkon #rada14 .sedadlo-free',
  //   11: '#balkon #rada11 .sedadlo-free'
  // })
  //sedadlo-free
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


// console.log('signing in')
// signIn()



// const arr = []

// var combine = function(a, min) {
//   var fn = function(n, src, got, all) {
//       if (n == 0) {
//           if (got.length > 0) {
//               all[all.length] = got;
//           }
//           return;
//       }
//       for (var j = 0; j < src.length; j++) {
//           fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
//       }
//       return;
//   }
//   var all = [];
//   for (var i = min; i < a.length; i++) {
//       fn(i, a, [], all);
//   }
//   all.push(a);
//   return all;
// }

// const res = combine(config[2042], 2)


const sid = '74208E4B9D8702E444BE358A954DC3F0'

const configDecember = {
  // 2030: [ ],

  2032: [ ],
  // 2035: [ ],
  2041: [ ],
  // 2042: [ ],
  // 1968: [ ],
  // 2036: [ ],
  // 2038: [ ],
  2040: [ ],
  // 2041: [ ],
  // 2042: [ ],

  // 2042 : [ '574352', '574357', '574358', '574359', '574360', '574536', '574553', '574554', '574555', '574556', '574561', '574562', '574563' ],
  // 2035 : [ '572957', '572958' ],
  // 2041 : [ '574117', '574118', '574135', '574148', '574149', '574166', '574167', '574323', '574324', '574325', '574326', '574330', '574334' ],
  // 2038 : [ '573424', '573425', '573437', '573438', '573577', '573578', '573597', '573598', '573599', '573600', '573601', '573602', '573603', '573635', '573636', '573643', '573648', '573649' ],
  // 1968 : [ '557390', '557402', '557432', '557433', '557496', '557497', '557535', '557536' ],
  // 2032 : [ '572045', '572046', '572111', '572112', '572146', '572147', '572148', '572149', '572185', '572186', '572214', '572215', '572218', '572219', '572220', '572221', '572236', '572237', '572238', '572257', '572264' ],
  // 2040 : [ '573883', '573884', '573885', '573886', '573901', '573941', '573942', '574060', '574061', '574095', '574096' ],
  // DSK 2036 : [ '572967', '572968', '572980', '572992', '572993', '573033', '573034', '573155', '573156', '573173', '573174', '573175', '573176', '573180', '573181', '573182' ]

  // 2038 : [ '573424', '573425', '573577', '573578', '573597', '573598', '573599', '573600', '573601', '573602', '573603', '573635', '573636' ],
  // 2041 : [ '574117', '574118', '574135', '574148', '574149', '574166', '574167', '574323', '574324', '574325', '574326', '574330', '574334' ],
  // 2040 : [ '573883', '573884', '573885', '573886', '573901', '573941', '573942', '574060', '574061', '574095', '574096' ],
  // 2032 : [ '572045', '572046', '572111', '572112', '572146', '572147', '572148', '572149', '572185', '572186', '572214', '572215', '572218', '572219', '572220', '572221', '572236', '572237', '572238', '572257', '572264' ],
  // 1968 : [ '557390', '557402', '557496', '557497', '557535', '557536' ],
}

const configFebruary = {
  2104: [],
  // 2102: [],
  // 2099: [],
  // 2097: [],
  // 2105: [],

  // 2109: [],
  // 2108: [],
  // 2103: [],
  // 2100: [],
  // 2074: [],
  // 2094: [],
}

// Object.keys(config).forEach((playId) => {
//   const seats = config[playId]
//   seats.forEach((seatId) => {
//     // console.log(`https://zdjc.cz/rezervace/vytvorit-rezervaci?id=${playId}&ids=${seatId}`)
//     console.log(`curl -v --cookie "JSESSIONID=${sid}" "https://zdjc.cz/rezervace/vytvorit-rezervaci?id=${playId}&ids=${seatId}" &`)
//   })
// })

// signIn()


Object.keys(configFebruary).forEach((playId) => {
  // new Range(0, times).forEach(() => {
  console.log('getting seat ids for ', playId)
  getSeatIds(playId, sid)
    .then((seats) => {
      console.log(seats)
      const realSeats = List(Object.keys(seats)).flatMap((rowId) => {
        return seats[rowId]
      })
      const takenSeats = realSeats.take(2)
      console.log(playId, ':', realSeats.toArray(),)

      takenSeats.forEach((seatId) => {
        // new Range(0, times).forEach(() => {
        reserveTickets(sid, playId, [ seatId ]).then(log).catch(err)
        // })
      })
    })
    .catch(err)
  // })
})