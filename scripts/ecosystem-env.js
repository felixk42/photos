#!/usr/bin/env babel-node

/*
Export environment variables from PM2's ecosystem.config.
Usage:
  eval $(node scripts/ecosystem-env.js <app-name>)
*/

const config = require('../ecosystem.config.js')

if (!process.argv[2]) {
  throw Error(`Usage: ${process.argv[1]} <app-name>`)
}

let app_name = process.argv[2]

let found = false
for (let i in config.apps) {
  let app = config.apps[i]
  if (app.name === app_name) {
    found = true
    for (let v in app.env) {
      let val = "'" + app.env[v].toString().replace(/'/g, "'\\''") + "'"
      process.stdout.write(`export ${v}=${val}\n`)
    }
    break
  }
}

if (!found) {
  throw Error(`No such app in ecosystem: ${app_name}`)
}
