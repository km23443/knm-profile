// defaultConfig.js - Default site configuration used when a new site is created.
module.exports = {
  username: 'yourname',
  location: 'somewhere on earth',
  viewCount: 0,
  backgroundImage: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1920&q=80',
  backgroundVideo: '',            // if set (mp4 url), plays as background instead of image
  audioUrl: '',
  accentIcon: 'katana',
  themeColor: '#ffffff',          // username text color
  accentColor: '#a13ecf',         // card border tint, glow accent
  usernameStyle: {
    variant:    'plain',          // 'plain' | 'glass' | 'frost' | 'neon' | 'chrome'
    swaySpeed:  0                 // seconds; 0 = no sway. e.g. 4 = gentle sway every 4s
  },
  usernameGlow: {
    color:    '#ffffff',
    strength: 80,
    pulse:    'normal'
  },
  sizes: {
    accentIcon:    48,
    username:      88,
    avatar:        42,
    activityScale: 1,
    socialIcon:    30
  },
  activity: {
    avatar: 'https://i.pravatar.cc/100?img=12',
    name:   'your activity',
    verb:   'Playing',
    status: 'your status'
  },
  cardStyle: {
    bgAlpha:      55,             // 0-100 (% of base dark bg)
    blur:         18,             // backdrop-filter blur px
    borderAlpha:  9,              // 0-60 (% alpha of white border)
    radius:       14              // border-radius px
  },
  socials: [
    { type: 'discord', url: 'https://discord.com/users/your_id' }
  ],
  particles: {
    count:   55,
    symbols: ['❄', '✦', '·', '◦', '✧', '❅'],
    minSize: 8,
    maxSize: 18,
    color:   '#ffffff'
  }
};
