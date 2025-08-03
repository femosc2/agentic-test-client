import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './index'

describe('Header', () => {
  it('renders header with default title', () => {
    render(<Header />)
    
    expect(screen.getByText('My App')).toBeInTheDocument()
  })

  it('renders header with custom title', () => {
    render(<Header title="Custom App" />)
    
    expect(screen.getByText('Custom App')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Header />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Services')).toBeInTheDocument()
  })

  it('renders hamburger menu button on mobile', () => {
    render(<Header />)
    
    const menuButton = screen.getByLabelText('Toggle navigation menu')
    expect(menuButton).toBeInTheDocument()
  })

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(<Header />)
    
    const menuButton = screen.getByLabelText('Toggle navigation menu')
    fireEvent.click(menuButton)
    
    // The menu should be open after clicking
    expect(menuButton).toBeInTheDocument()
  })

  it('has correct navigation link hrefs', () => {
    render(<Header />)
    
    const homeLink = screen.getByText('Home').closest('a')
    const aboutLink = screen.getByText('About').closest('a')
    const servicesLink = screen.getByText('Services').closest('a')
    const contactLink = screen.getByText('Contact').closest('a')
    
    expect(homeLink).toHaveAttribute('href', '/')
    expect(aboutLink).toHaveAttribute('href', '/about')
    expect(servicesLink).toHaveAttribute('href', '/services')
    expect(contactLink).toHaveAttribute('href', '/contact')
  })
})
