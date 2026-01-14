import React from 'react'

const Header = ({ name, age }) => {
  return (
    <div>
      <h1>{name}</h1>
      <h1>{age}</h1>
    </div>
  )
}

export default Header
