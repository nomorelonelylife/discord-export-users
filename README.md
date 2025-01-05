# Export Discord Users
Generate a CSV of all Discord members in a server and the date they joined. Generate a CSV of all members of certain role

## Run Locally
Clone the project

```bash
git clone https://github.com/idkravitz/discord-export-users.git
```

Go to the project directory

```bash
cd discord-export-users
```

Install dependencies

```bash
npm install
```

After creating an application with Discord (read below), start the bot

```bash
npm run ts-start
```

or 
```bash
npm run build
npm start
```

## Bot Configuration
- Navigate to the [Discord Developers website](https://discord.com/developers/applications), create an application, and add it to your server
	- [This is a helpful video](https://youtu.be/SPTfmiYiuok?t=124) showing how to do exactly that
- In Bot settings, check "Server Members Intent"
- Back in the project files, rename .env.example to .env and enter your bot client token

## How to Use
- Send a message that says "/members" to any channel (suggested in private channel first for testing)
- Send a message that says "/rolemembers" to any channel (suggested in private channel first for testing)
- Only server members with admin permissions can use this function
