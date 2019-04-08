import {isNumber} from 'lodash'
const trafficLightsThresholds = {
  red: 0.1,
  yellow: 0.05,
}

export function getTrafficLightColor(value){
  if(!isNumber(value)){
    console.error('getTrafficLightColor value: ', value)
  }
  let trafficLightColor = 'green'
  if (value < 1 - trafficLightsThresholds.yellow) {
    trafficLightColor = 'yellow'
  }
  if (value < 1 - trafficLightsThresholds.red) {
    trafficLightColor = 'red'
  }
  return trafficLightColor
}
