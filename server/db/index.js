import Knex from 'knex'
import {inspectObj} from '../utils'
const types = require('pg').types

//for postgres date parsing
const DATE_OID = 1082

const dateParseFn = function(val) {
  // we don't want to give a date(no time) value a time !
  // console.dir(val)
  return val === null ? null : val
}

types.setTypeParser(DATE_OID, dateParseFn)

const {
  POSTGRES_HOST,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  POSTGRES_USE_SSL,
  POSTGRES_PORT,
} = process.env

const connection = {
  host: POSTGRES_HOST,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  port: POSTGRES_PORT,
  ssl: POSTGRES_USE_SSL === 'true',
}
// console.dir({connection,POSTGRES_USE_SSL})

export const knex = Knex({
  client: 'postgres',
  connection,
})

export const databaseInit = () => {
  return {
    knex,
  }
}
