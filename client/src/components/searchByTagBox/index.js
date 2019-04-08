import React from 'react'
import autobind from 'autobind-decorator'
import {
  Form,
  Input,
  Button
} from 'reactstrap'

export default class InputBox extends React.Component{

  constructor(props) {
    super(props)

    this.state = {
      value: ''
    }
  }

  @autobind
  handleChange(e) {
    const {target} = e

    let value
    value = target.value
    this.setState({
      value,
    })
  }

  @autobind
  handleSubmit(e){
    // console.log('submitting form, value: ', this.state.value)
    e.preventDefault()
    this.props.onSubmit(this.state.value)
  }

  render() {
    return (
      <Form className='search-row'>
        <Input
          value={this.state.value}
          type={'text'}
          onChange={this.handleChange}
          placeholder='Search By Tag'
        />
        <Button color='primary' type='submit' onClick={this.handleSubmit}>
          Search
        </Button>
      </Form>
    )
  }
}
