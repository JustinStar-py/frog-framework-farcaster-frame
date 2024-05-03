import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev';
import { createSystem } from 'frog/ui';
import { 
  fetchProfileByFid, fetchUserCastsByFid, 
  fetchProfileByUsername,  getFidByUsername } from './far.quest';
import userDataJson from './userData.json';
// import { neynar } from 'frog/hubs'

import qs from 'qs';
import axios from 'axios';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';


dotenv.config();
export const app = new Frog({
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

 ////////////////////////////////////////////////////
  ///////////////  Styling Variables ///////////////////

  const bgStyle = {
    position: 'absolute', 
    width: '100%', 
    height: '100%',
    border: '10px solid #A6EA35',
    borderRadius: '14px',
  }

  const titleTextStyle = {
    position: 'absolute', 
    top: '57.5%', 
    fontSize: 65, 
  }

  const subTitleTextStyle = {
    position: 'absolute', 
    top: '85%', 
    fontSize: 30, 
  }

  const profileStyle = {
    position: 'absolute', 
    width: '250px',
    height: '250px',
    top: '13%',
    left: '5%', 
    border: '15px solid #fff',
    borderRadius: '21px',
  }

  const usernameStyle = {
    position: 'absolute',
    top: '70%',
    left: '5%',
    fontSize: '33px',
  }

  const fidStyle = {
    position: 'absolute',
    top: '80%',
    left: '5%',
    fontSize: '25px',
}

  const detailsTextStyle = {
    position: 'absolute',
    bottom: '2%',
    left: '3%',
    color: '#C848D5',
    fontStyle: 'italic',
    fontSize: '22px',
  }

  const tableStyle = {
    position: 'absolute', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
    width: '95vw', 
    height: '90vh', 
    backgroundColor: '#1E293B', 
    borderRadius: '14px', 
    padding: '25px', 
    border: '25px solid #A6EA35'
  }

  const tableRowStyle = {
    fontSize: 38, 
    fontWeight: 'bolder', 
    color: '#3AB5F1', 
    borderRadius: '17px', 
    border: '5px solid #3AB5F1', 
    padding: '5px'
  }

  const tableRowGoldenStyle = {
    fontSize: 38, 
    fontWeight: 'bolder', 
    color: '#3AB5F1', 
    borderRadius: '17px', 
    border: '7px solid gold', 
    padding: '5px'
  }

  const tableRowDataStyle = {
    color: "#A6EA35",
    paddingLeft: '10px', 
    paddingRight: '5px'
  }

app.use('/*', serveStatic({ root: './public' }))

/**
* Degen Chart routing 
* @route /degen-chart
* @route /degen-chart-show
*/
app.frame('/degen-chart', (c) => {
  const { buttonValue, inputText, status } = c
  const action = status === 'initial' ? process.env.STATIC_NODE_URL + '/degen-chart' : process.env.STATIC_NODE_URL + '/degen-chart-show'
  const image = status === 'initial' ? `${process.env.STATIC_NODE_URL}/gifs/degen-chart.gif` : `${process.env.STATIC_NODE_URL}/gifs/chart-timeframe.gif`
  const frameSharingText = "https://warpcast.com/~/compose?text=Check $DEGEN chart easily here! ✨" + encodeURIComponent("\n") + "frame by @justin-eth 🤝🏻&embeds[]=https://jolly-diverse-herring.ngrok-free.app/degen-chart"
  const intervalTimesButtons = ["15m", "1h", "4h", "1d"]
 
  const buttons = status === 'initial' ? [
      <Button value="show-chart">$DEGEN Chart</Button>,
      <Button.Link href={frameSharingText}>Share Frame</Button.Link>
  ] : [
      <Button value={intervalTimesButtons[0]}>{intervalTimesButtons[0]}</Button>,
      <Button value={intervalTimesButtons[1]}>{intervalTimesButtons[1]}</Button>,
      <Button value={intervalTimesButtons[2]}>{intervalTimesButtons[2]}</Button>,
      <Button value={intervalTimesButtons[3]}>{intervalTimesButtons[3]}</Button>,
  ]

  return c.res({
    action,
    image,
    intents: buttons,
  })
})

// ** show degen chart **
app.frame('/degen-chart-show', async (c) => {
  const { buttonValue, status } = c
  const intervalTimesButtons = ["15m", "1h", "4h", "1d"]
  
  const fetchImage = async () => {
    const img = await axios.get('https://api.chart-img.com/v1/tradingview/advanced-chart/storage', {
        headers: {
          Authorization: 'Bearer ' + process.env.CHART_IMG_KEY,
        },
        params: {
          symbol: 'BYBIT:DEGENUSDT',
          interval: buttonValue,
          studies: [],
        },
        paramsSerializer: (params: any) => {
          return qs.stringify(params, { arrayFormat: 'repeat' })
        },
      })
      .then((res: any) => {
        return res.data.url
      }).catch((err: any) => {
        console.error(err)
      })

    return img;
  }

  return c.res({
    image: await fetchImage(),
    intents: [
      <Button value={intervalTimesButtons[0]}>{intervalTimesButtons[0]}</Button>,
      <Button value={intervalTimesButtons[1]}>{intervalTimesButtons[1]}</Button>,
      <Button value={intervalTimesButtons[2]}>{intervalTimesButtons[2]}</Button>,
      <Button value={intervalTimesButtons[3]}>{intervalTimesButtons[3]}</Button>
    ]
  })
})


// ** Farcaster analyzer **
app.frame('/farcaster-user-analyzer', async (c) => {
  const { buttonValue, inputText, frameData, status } = c

    //////////////////////////////////////////////
    //////////////  API Handling  ////////////////
    const handleZeroDataValue = async (data: any) => {
       if (data === 0 || data === null) {
           return '0'
       } else {
           return data
       }
    }

    const handleBigNumbers = async (data: any) => {
      // if is more than 1000 show 1k or 1m, show like +1.2k
      let num;
      if (data > 1000) {
        if (data > 1000000) {
          num = (data / 1000000).toFixed(1) + 'M';
        }
        num = (data / 1000) > 100 ? (data / 1000).toFixed(0) + 'k' : (data / 1000).toFixed(1) + 'k';
      } else {
        num = data
      }
      return num;
    }
    
    const farcasterID = buttonValue === "search" ? await handleTextInput(inputText) : frameData?.fid

    const userData = await fetchProfileByFid(farcasterID)
    const userCasts = await fetchUserCastsByFid(farcasterID)

    let userCastsCount = 0;
    let userReplyCastsCount = 0;
    let userCastsReactionsCount = 0;
    let userCastsRepliesCount = 0;
    let userCastsRecastsCount = 0;
    let userAccountAge = 0;
    let userScore = 0;
    let userTier = 0;
    const tiers = [
      "New 👶",
      "Rookie👨",
      "Star ⭐️",
      "Pro ⚡️",
      "VIP 💎",
      "Master🧙🏻‍♀️",
      "Legend🧙🏻‍♂️",
      "Godlike👑",
    ];
    // const writing = await fs.writeFileSync('./userData.json', JSON.stringify(userCasts, null, 2))

   if (userCasts) {
      for (let i = 0; i < Object.keys(userCasts).length; i++) {
        if (Object.keys(userCasts[i]).length === 15) {
          userCastsCount += 1;
          userCastsReactionsCount += userCasts[i].reactions.count;
          userCastsRepliesCount += userCasts[i].replies.count;
          userCastsRecastsCount += userCasts[i].recasts.count;
        } else {
          userReplyCastsCount += 1
        }
     }
  }

  if (userData) {
    userScore = 
    Number(((userCastsReactionsCount * 1 
      + userCastsRepliesCount * 2 
      + userCastsRecastsCount * 3.5
      + userData.followerCount * 1.5 
      + userData.followingCount * 1
      + userCastsCount * 5)
    / 100).toFixed(2))

    // i wanna convert to days like 2 days , or 1 month and 30 days
    userAccountAge = Math.floor((Date.now() - new Date(userData.registeredAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  if (userData && userCasts) {
    if (userData?.followerCount > 0 && userData?.followerCount <= 100) {
      userTier = 0
   } else if (userData?.followerCount > 100 && userData?.followerCount <= 250) {
      userTier = 1
   } else if (userData?.followerCount > 250 && userData?.followerCount <= 500) {
      userTier = 2
   } else if (userData?.followerCount > 500 && userData?.followerCount <= 1250) {
      userTier = 3
   } else if (userData?.followerCount > 1250 && userData?.followerCount <= 2000) {
      userTier = 4
   } else if (userData?.followerCount > 2000 && userData?.followerCount <= 3500) {
      userTier = 5
   } else if (userData?.followerCount > 3500 && userData?.followerCount <= 7500) {
      userTier = 6
   } else if (userData?.followerCount > 7500) {
      userTier = 7
   } else {
      userTier = 0
   }
  }

  const sharingScoreLink = `https://warpcast.com/~/compose?text=My Farcaster Score is ${userScore} with Tier ${tiers[userTier]}` + encodeURIComponent("\n\n") + "frame by @justin-eth 🤝🏻&embeds[]=https://jolly-diverse-herring.ngrok-free.app/farcaster-user-analyzer"
  const sharingFrameLink = "https://warpcast.com/~/compose?text=Analysis your farcaster profile here! ✨" + encodeURIComponent("\n") + "frame by @justin-eth 🤝🏻&embeds[]=https://jolly-diverse-herring.ngrok-free.app/farcaster-user-analyzer"

  const buttons = status === 'initial' ? [
    <Button value="my-state">My State</Button>,
    <Button value="search">🔎</Button>,
    <TextInput placeholder="Enter farcaster username or fid" />,
    <Button.Link href="https://warpcast.com/justin-eth">Dev</Button.Link>,
    <Button.Link href={sharingFrameLink}>Share Frame</Button.Link>,
  ] : [
    <Button.Reset>Reset</Button.Reset>,
    <Button.Link href={sharingScoreLink}>Share Score</Button.Link>,
  ]

  return c.res({
    image: (
      status === 'initial' ?
      <div style={{ color: 'white', display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E172A',  border: '40px solid #A6EA35',
      borderRadius: '25px' }}>
         <img width={1120} height={620} src="https://jolly-diverse-herring.ngrok-free.app/bg/profiles-banner.png" style={{position: 'absolute', top: '0%', left: '0%'}} />
         <img width={250} src="https://jolly-diverse-herring.ngrok-free.app/logo/logo.png" style={{position: 'absolute', top: '10%', left: '39%'}} />
         <span style={titleTextStyle}>Farcaster User Analyzer</span>
         <span style={subTitleTextStyle}>Frame by @justin-eth <span style={{fontSize: '45px', paddingLeft: '6px', position: 'relative', top: '-7px'}}>🧙🏻‍♂️</span></span>
    </div> : 
    <div style={{ color: 'white',padding:'20px', display: 'flex', backgroundColor: '#0E172A', 
    height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={tableStyle}>
        <img width={100} src={userData?.pfp.url} style={profileStyle} />
        <span style={usernameStyle}>@{userData?.username}</span>
        <span style={fidStyle}>FID: {farcasterID || frameData?.fid}</span>
        <span style={detailsTextStyle}>**Data is averaged from 100 recent casts**</span>
        <div style={{ position: 'absolute', top: '7%', left: '30%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '25px' }}>
           <span style={tableRowGoldenStyle}>
             Score :
             <span style={tableRowDataStyle}>{userScore}</span>
          </span>
           <span style={tableRowStyle}>
             Followers:
             <span style={tableRowDataStyle}>{handleBigNumbers(userData?.followerCount)}</span>
           </span>
           <span style={tableRowStyle}>
              Followings: 
            <span style={tableRowDataStyle}>{handleBigNumbers(userData?.followingCount)}</span>
           </span>
           <span style={tableRowStyle}>
              Quote casts:
              <span style={tableRowDataStyle}>{handleZeroDataValue(userCastsCount)}</span>
            </span>
           <span style={tableRowStyle}>
              Reply casts:
             <span style={tableRowDataStyle}>{handleZeroDataValue(userReplyCastsCount)}</span>
            </span>
        </div>
        <div style={{ position: 'absolute', top: '7%', left: '61%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '25px' }}>
            <span style={tableRowGoldenStyle}>
                Active tier :
               <span style={tableRowDataStyle}>{tiers[userTier]}</span>
            </span>
            <span style={tableRowStyle}>
                Account age:
               <span style={tableRowDataStyle}>{userAccountAge} d</span>
            </span>
           <span style={tableRowStyle}>
              Reactions:
              <span style={tableRowDataStyle}>{handleZeroDataValue(userCastsReactionsCount)}</span>
           </span>
           <span style={tableRowStyle}>
              Replies: 
            <span style={tableRowDataStyle}>{handleZeroDataValue(userCastsRepliesCount)}</span>
           </span>
           <span style={tableRowStyle}>
              Recasts:
              <span style={tableRowDataStyle}>{handleZeroDataValue(userCastsRecastsCount)}</span>
            </span>
        </div>
      </div>
    </div>     
    ),
    imageAspectRatio: '1.91:1',
    imageOptions: {
      emoji: "twemoji",
    },
    intents: buttons,
  },
)
})

// ** Compare two user data **
app.frame('/how-many-words', async (c) => {
  const { buttonValue, inputText, frameData, status } = c
  
  const farcasterID = buttonValue === "search" ? await handleTextInput(inputText) : frameData?.fid


  const userData = await fetchProfileByFid(farcasterID)
  const userCasts = await fetchUserCastsByFid(farcasterID)
  
  let totalMentions = 0;
  let totalWords = 0;
  let words = ['degen', 'gm', 'gn', 'hello', 'farcaster', '$degen'];
  let wordsCount = {
    degen: 0,
    gm: 0,
    gn: 0,
    hello: 0,
    farcaster: 0,
    $degen: 0
  }

  if (userCasts) {
    for (let i = 0; i < Object.keys(userCasts).length; i++) {
      if (Object.keys(userCasts[i]).length === 15) {
          userCasts[i].text.toLowerCase().split(' ').forEach((word: string) => {
          totalWords += 1

          if (words.includes(word)) {
            wordsCount[word.toLowerCase()] += 1;
          }

          if (word.startsWith('@')) {
            totalMentions += 1
          }
        })
      } else {
        try {
          userCasts[i].childrenCasts[0].text.toLowerCase().split(' ').forEach((word: string) => {
            totalWords += 1
            
            if (words.includes(word)) {
              wordsCount[word.toLowerCase()] += 1;
            }
            
            if (word.startsWith('@')) {
              totalMentions += 1
            }
          })
        } catch (error) {
          continue;
        }
      }
    }
  }

  const subStyle = {
    position: 'absolute', 
    top: '91%', 
    fontSize: 30, 
  }  

  return c.res({
    action: process.env.STATIC_NODE_URL + '/how-many-words',
    image: (
      status === 'initial' ?
      <div style={{ color: 'white', display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E172A',  border: '40px solid #A6EA35',
      borderRadius: '25px' }}>
         <img width={1120} height={620} src="https://jolly-diverse-herring.ngrok-free.app/bg/words-banner.png" style={{position: 'absolute', top: '0%', left: '0%'}} />
         {/* <img width={250} src="https://jolly-diverse-herring.ngrok-free.app/logo/logo.png" style={{position: 'absolute', top: '10%', left: '39%'}} /> */}
         {/* <span style={titleTextStyle}>Compare Users</span> */}
         <span style={subStyle}>Frame by @justin-eth <span style={{fontSize: '45px', paddingLeft: '6px', position: 'relative', bottom: '11px'}}>🧙🏻‍♂️</span></span>
    </div>
    : <div style={{ color: 'white',padding:'20px', display: 'flex', backgroundColor: '#0E172A', 
    height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={tableStyle}>
        <img width={100} src={userData?.pfp.url} style={profileStyle} />
        <span style={usernameStyle}>{userData?.username}</span>
        <span style={fidStyle}>FID: {userData?.fid}</span>
        <span style={detailsTextStyle}>**Data is averaged from 100 recent casts**</span>
        <div style={{ position: 'absolute', top: '7%', left: '36%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '25px' }}>
           <span style={tableRowGoldenStyle}>
              You said $DEGEN 🧢 for :
              <span style={tableRowDataStyle}>{`${wordsCount.$degen + wordsCount.degen}`}</span>
           </span>
           <span style={tableRowStyle}>
              You said GM ☀ for :
             <span style={tableRowDataStyle}>{`${wordsCount.gm}`}</span>
          </span>
           <span style={tableRowStyle}>
               You said GN 🌜 for :
             <span style={tableRowDataStyle}>{`${wordsCount.gn}`}</span>
           </span>
           <span style={tableRowStyle}>
              You mentioned users 👥 for :
              <span style={tableRowDataStyle}>{`${totalMentions}`}</span>
            </span>
           <span style={tableRowStyle}>
             total words 🖊 you said :
             <span style={tableRowDataStyle}>{totalWords}</span>
            </span>
        </div>
      </div>
    </div> 
    ),
    intents: [
      <Button value="my-state">My state</Button>,
      <Button value="search">🔎</Button>,
      <Button.Link href='https://warpcast.com/justin-eth'>Share</Button.Link>,
      <TextInput placeholder="Custom word" />,
      <TextInput placeholder="Enter farcaster username or fid" />,
    ],
  })
})

// ** handle functions
const handleTextInput = async (text: any) => {
  if (!text || text === undefined) {
    return null
  }

  let fid;
  if (text.includes("@")) {
     fid = await getFidByUsername(text.replace("@", ""))
  } else if (Number.isInteger(parseInt(text))) {
     fid = parseInt(text);
  } else {
     fid = await getFidByUsername(text)
  }

  return fid
}

const port = 3000
console.log(`Server is running on port ${port}`)

devtools(app, { serveStatic })

serve({
  fetch: app.fetch,
  port,
})
