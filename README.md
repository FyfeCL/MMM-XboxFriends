# MMM-XboxFriends
Display your Xbox friends on MagicMirror. This module uses [Puppeteer](https://github.com/puppeteer/puppeteer) to emulates your login in xbox site and then retrieves your friends list.

## Screenshot
![](https://github.com/FyfeCL/MMM-XboxFriends/blob/master/img/examples/example.png?raw=true)

## Regular installation
1. Install Module
```sh
git clone https://github.com/FyfeCL/MMM-XboxFriends.git
cd MMM-XboxFriends
npm install
```

It should install dependencies, if not, you can install them manually:
- puppeteer [Install instructions](https://github.com/puppeteer/puppeteer)
- fs [Install instructions](https://github.com/douzi8/file-system)


### Choose one of this options:

### Option 1: Manual login
1. Go to MMM-XboxFriends folder
```sh
cd ~/MagicMirror/modules/MMM-GooglePhotos
node generateLogin.js
```

2. It should open a browser window to `https://account.xbox.com/en-US/Friends`.
3. Enter your credentials including second factor authentication. Click on every `Remind me` checkbox so the module don't ask for your credentials again
4. Check whether the folder `myUserDataDir` is full with a lot of files in `MMM-XboxFriends`

### Option 2: Save your credentials in `/docs/creds.js`
**`Important!`** Saving your credentials in plain text is always a risk, please consider this when choosing an option
1. Open cred.js with a text editor
2. Save your credentials (user/pass)
3. If you have second factor authentication, you will be asked to aprove the login the first time you run `MMM-XboxFriends` 

## Configuration
```javascript
{
  module: "MMM-XboxFriends",
	position: "top_right",
	header: "Xbox friends",
	config: {
		showBrowser: false,		// true: show chrome / false: hide chrome
		maximumEntries: 7,		// max friends to show
		offline: true,			// true: show offline friends / false: show only online friends
		fadePoint: 0.5,			// where fade starts, 1: no fade
		fadeMinEntries: 7,		// min entries to enable fading
		maxLengthDetails: 25,		// max string length for name and status
		updateInterval: 10		// minutes to update
		debug: false,			// true: show dev logs
		
	}
},
```

## Usage
#### **`showBrowser`**
- This flag it's used to open chrome headless or not. Except for debbuging you shouldn't need to view your browser

#### **`maximumEntries`**
- Maximum number of friends to show

#### **`offline`**
- Flag to configure if you want to show your offline friends or not

#### **`fadePoint`**
- Part of the list where the fade starts (eg 0.75, fade starts at 3/4 of your list)
- `fadePoint: 1` no fade is shown

#### **`fadeMinEntries`**
- Minimum number of friends to active fading

#### **`maxLengthDetails`**
- Maximum string length (characters) for your friend's name and status
- You can use it to format the total width of the module

#### **`updateInterval`**
- Minutes between each refresh

#### **`debug`**
- If set `true`, more (a lot more!) detailed info will be logged


## Notice
- Every refresh should take less than 30 seconds


