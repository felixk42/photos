import util from 'util'
export const inspectObj = obj => {
  console.log(util.inspect(obj, false, null))
}
