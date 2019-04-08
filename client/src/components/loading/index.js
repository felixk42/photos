import React from 'react'
import {ScaleLoader} from 'react-spinners'

const loaderColor = '#FFFFFF'

export default class OrbLoading extends React.Component {
  render(){
    const {loading, error} = this.props
    let height = 50, width = 10
    if (loading) {
      return (
        <div className='text-center spinners'>
          <ScaleLoader
            color={loaderColor}
            loading={true}
            height={height}
            width={width}
            margin={'5px'}
          />
        </div>
      )
    } else if (error) {
      console.log(error)
      return <p> Error: {error} </p>
    }
  }
}
