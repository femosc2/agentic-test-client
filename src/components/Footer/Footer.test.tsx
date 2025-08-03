import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './index'

describe('Footer', () => {
  it('renders footer with default props', () => {
    render(<Footer />)
    
    expect(screen.getByText('My Company')).toBeInTheDocument()
    expect(screen.getByText(/Building amazing experiences/)).toBeInTheDocument()
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument()
  })

  it('renders footer with custom props', () => {
    render(<Footer companyName="Custom Company" year={2024} />)
    
    expect(screen.getByText('Custom Company')).toBeInTheDocument()
    expect(screen.getByText(/© 2024 Custom Company/)).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Footer />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Services')).toBeInTheDocument()
    // Use getAllByText to handle multiple "Contact" elements
    expect(screen.getAllByText('Contact')).toHaveLength(2)
  })

  it('renders social media links', () => {
    render(<Footer />)
    
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument()
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
  })

  it('renders contact information', () => {
    render(<Footer />)
    
    expect(screen.getByText('123 Main Street, City, Country')).toBeInTheDocument()
    expect(screen.getByText('info@example.com')).toBeInTheDocument()
    expect(screen.getByText('+1 (234) 567-890')).toBeInTheDocument()
  })

  it('renders legal links', () => {
    render(<Footer />)
    
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
  })
}) 